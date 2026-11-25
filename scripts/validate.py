#!/usr/bin/env python3
"""Checks data/places.json, data/cities.json and data/meta.json before every update.
Exit code 1 = errors that must be fixed. Warnings never block; they list things to review.
Run: python3 scripts/validate.py

1. Every file is checked against data/schema.json (JSON Schema 2020-12) with a small
   built-in validator (stdlib only). It supports only the keywords listed in SUPPORTED and
   fails on any other keyword, so the schema can never claim a check that is not run.
2. Cross-record checks that a schema cannot express: unique ids, town in cities.json,
   duplicates, 'javascript:' in text.
3. Quality flags (g.q, see data/README.md): computed here with the same rules that
   scripts/data/flags.py writes. Flagged places are listed as warnings, and a warning is
   raised when the data changed and a computed flag is missing from g.q (or no longer applies)."""
import json, sys, re, pathlib, collections
ROOT = pathlib.Path(__file__).resolve().parent.parent

# ---------------------------------------------------------------- schema
SUPPORTED = {'$ref', 'anyOf', 'type', 'enum', 'const', 'pattern', 'minLength', 'minimum', 'maximum',
             'required', 'properties', 'additionalProperties', 'propertyNames', 'items', 'prefixItems',
             'minItems', 'maxItems', 'uniqueItems'}
ANNOTATIONS = {'$schema', '$id', '$defs', '$comment', 'title', 'description', 'x-codes'}
TYPES_PY = {'string': lambda v: isinstance(v, str),
            'integer': lambda v: isinstance(v, int) and not isinstance(v, bool),
            'number': lambda v: isinstance(v, (int, float)) and not isinstance(v, bool),
            'boolean': lambda v: isinstance(v, bool),
            'array': lambda v: isinstance(v, list),
            'object': lambda v: isinstance(v, dict),
            'null': lambda v: v is None}

class SchemaError(Exception):
    pass

def load_schema():
    return json.load(open(ROOT / 'data/schema.json', encoding='utf-8'))

def _resolve(root, ref):
    if not ref.startswith('#/'):
        raise SchemaError(f'only local $ref is supported: {ref}')
    node = root
    for part in ref[2:].split('/'):
        node = node[part]
    return node

def schema_errors(value, schema, root, path='$'):
    """Returns a list of 'path: problem' strings (empty = valid)."""
    out = []
    unknown = set(schema) - SUPPORTED - ANNOTATIONS
    if unknown:
        raise SchemaError(f'unsupported schema keyword(s) {sorted(unknown)} at {path}')
    if '$ref' in schema:
        out += schema_errors(value, _resolve(root, schema['$ref']), root, path)
    if 'anyOf' in schema:
        if all(schema_errors(value, s, root, path) for s in schema['anyOf']):
            out.append(f'{path}: {value!r} does not match any allowed form')
    if 'type' in schema:
        ts = schema['type'] if isinstance(schema['type'], list) else [schema['type']]
        if not any(TYPES_PY[t](value) for t in ts):
            return out + [f'{path}: expected {"/".join(ts)}, got {type(value).__name__}']
    if 'enum' in schema and value not in schema['enum']:
        out.append(f'{path}: {value!r} is not one of the allowed values')
    if 'const' in schema and value != schema['const']:
        out.append(f'{path}: must be {schema["const"]!r}')
    if isinstance(value, str):
        if 'minLength' in schema and len(value.strip()) < schema['minLength']:
            out.append(f'{path}: must not be empty')
        if 'pattern' in schema and not re.search(schema['pattern'], value):
            out.append(f'{path}: {value!r} does not match {schema["pattern"]}')
    if TYPES_PY['number'](value):
        if 'minimum' in schema and value < schema['minimum']:
            out.append(f'{path}: {value} < minimum {schema["minimum"]}')
        if 'maximum' in schema and value > schema['maximum']:
            out.append(f'{path}: {value} > maximum {schema["maximum"]}')
    if isinstance(value, dict):
        for k in schema.get('required', []):
            if k not in value:
                out.append(f'{path}: missing required field {k!r}')
        props = schema.get('properties', {})
        for k, v in value.items():
            if 'propertyNames' in schema:
                out += schema_errors(k, schema['propertyNames'], root, f'{path} key {k!r}')
            if k in props:
                out += schema_errors(v, props[k], root, f'{path}.{k}')
            elif schema.get('additionalProperties') is False:
                out.append(f'{path}: unknown field {k!r}')
            elif isinstance(schema.get('additionalProperties'), dict):
                out += schema_errors(v, schema['additionalProperties'], root, f'{path}.{k}')
    if isinstance(value, list):
        if 'minItems' in schema and len(value) < schema['minItems']:
            out.append(f'{path}: needs at least {schema["minItems"]} items')
        if 'maxItems' in schema and len(value) > schema['maxItems']:
            out.append(f'{path}: at most {schema["maxItems"]} items')
        if schema.get('uniqueItems'):
            seen = []
            for x in value:
                if x in seen:
                    out.append(f'{path}: item {x!r} appears twice')
                seen.append(x)
        pre = schema.get('prefixItems', [])
        for i, x in enumerate(value):
            if i < len(pre):
                out += schema_errors(x, pre[i], root, f'{path}[{i}]')
            elif 'items' in schema:
                out += schema_errors(x, schema['items'], root, f'{path}[{i}]')
    return out

def validate_file(value, entry, schema=None):
    schema = schema or load_schema()
    return schema_errors(value, schema['$defs'][entry], schema)

# ---------------------------------------------------------------- quality flags
WEEK = 7 * 1440
SHABBAT_WINDOW = (5 * 1440 + 17 * 60, 6 * 1440 + 17 * 60)   # Friday 17:00 → Saturday 17:00
FLAG_ORDER = ['hours-shabbat', 'hours-24h', 'shared-google', 'approx-loc']
AUTO_FLAGS = set(FLAG_ORDER)

def intervals(g):
    """Opening periods as [open, close) minutes from Sunday 00:00; close may pass the end of the week."""
    out = []
    for od, oh, om, cd, ch, cm in (g or {}).get('periods') or []:
        o = od * 1440 + oh * 60 + om
        c = cd * 1440 + ch * 60 + cm
        if c <= o:
            c += WEEK
        out.append((o, c))
    return out

def _overlaps(o, c, a, b):
    return any(o + s < b and c + s > a for s in (0, WEEK, -WEEK))

def _merged(iv):
    parts = []
    for o, c in iv:
        if c > WEEK:
            parts += [(o, WEEK), (0, c - WEEK)]
        else:
            parts.append((o, c))
    parts.sort()
    m = []
    for o, c in parts:
        if m and o <= m[-1][1]:
            m[-1] = (m[-1][0], max(m[-1][1], c))
        else:
            m.append((o, c))
    return m

def days_24h(g):
    m = _merged(intervals(g))
    return [d for d in range(7) if any(o <= d * 1440 and c >= (d + 1) * 1440 for o, c in m)]

def norm_phone(x):
    x = re.sub(r'\D', '', x or '')
    return '0' + x[3:] if x.startswith('972') else x

def _norm_street(s):
    return re.sub(r'\s+', ' ', (s or '').strip())

def _differ(a, b):
    """Two places are different addresses if the town differs, or both streets are known and differ."""
    if a['c'] != b['c']:
        return True
    sa, sb = _norm_street(a['s']), _norm_street(b['s'])
    return bool(sa and sb and sa != sb)

def shared_groups(places):
    """[(kind, key, [indexes])] for Google locations / phones shared by places at different addresses."""
    found = []
    for kind in ('loc', 'phone'):
        groups = collections.defaultdict(list)
        for i, p in enumerate(places):
            g = p.get('g') or {}
            if kind == 'loc':
                if not g.get('loc') or g.get('prec') == 'street' or g.get('src'):
                    continue
                key = (round(g['loc']['lat'], 5), round(g['loc']['lng'], 5))
            else:
                key = norm_phone(g.get('phone'))
                if not key:
                    continue
            groups[key].append(i)
        for key, idx in groups.items():
            if len(idx) > 1 and any(_differ(places[a], places[b]) for a in idx for b in idx if a < b):
                found.append((kind, key, idx))
    return found

def quality(places):
    """{index: [codes]} computed from the data, in FLAG_ORDER."""
    q = collections.defaultdict(set)
    for i, p in enumerate(places):
        g = p.get('g') or {}
        if any(_overlaps(o, c, *SHABBAT_WINDOW) for o, c in intervals(g)):
            q[i].add('hours-shabbat')
        if days_24h(g):
            q[i].add('hours-24h')
        if g.get('loc') and g.get('prec') == 'street':
            q[i].add('approx-loc')
    for _, _, idx in shared_groups(places):
        for i in idx:
            q[i].add('shared-google')
    return {i: [c for c in FLAG_ORDER if c in s] for i, s in q.items()}

# ---------------------------------------------------------------- checks
def check(places, cities, meta=None):
    errors, warnings = [], []
    schema = load_schema()
    for e in validate_file(places, 'placesFile', schema):
        m = re.match(r'\$\[(\d+)\]', e)
        if m:
            p = places[int(m.group(1))]
            e = f"#{m.group(1)} {p.get('n', '?') if isinstance(p, dict) else '?'}: {e}"
        errors.append(e)
    errors += [f'cities.json {e}' for e in validate_file(cities, 'citiesFile', schema)]
    if meta is not None:
        errors += [f'meta.json {e}' for e in validate_file(meta, 'metaFile', schema)]
    if not isinstance(places, list) or not all(isinstance(p, dict) for p in places):
        return errors, warnings
    seen = set(); uids = set()
    for i, p in enumerate(places):
        tag = f"#{i} {p.get('n', '?')}"
        for f in ('n', 's', 'c', 'h', 'p', 'f', 'tt'):
            if isinstance(p.get(f), str) and re.search(r'javascript:', p[f], re.I):
                errors.append(f"{tag}: field '{f}' contains 'javascript:'")
        u = p.get('u')
        if u in uids:
            errors.append(f"{tag}: id '{u}' is used twice")
        uids.add(u)
        key = (p.get('n'), p.get('s'), p.get('c'), p.get('k'), p.get('h'))
        if key in seen:
            warnings.append(f"{tag}: duplicate name+street+city (see data/review-queue.md)")
        seen.add(key)
        if p.get('c') and isinstance(cities, dict) and p['c'] not in cities:
            warnings.append(f"{tag}: city '{p['c']}' has no coordinates in cities.json (map position unknown)")
        g = p.get('g') or {}
        if g.get('src') == 'osm' and g.get('prec') not in ('house', 'street'):
            errors.append(f"{tag}: an OSM location must have prec 'house' or 'street'")
    # quality flags
    computed = quality(places)
    for i, p in enumerate(places):
        stored = set((p.get('g') or {}).get('q') or [])
        want = set(computed.get(i, []))
        tag = f"#{i} {p.get('n', '?')} ({p.get('c', '?')}) [{p.get('u', '?')}]"
        if want:
            warnings.append(f"flag {','.join(computed[i])}: {tag}")
        if want - stored:
            warnings.append(f"{tag}: new quality flag(s) {sorted(want - stored)} not in g.q – run python3 scripts/data/flags.py and review")
        if (stored & AUTO_FLAGS) - want:
            warnings.append(f"{tag}: g.q has {sorted((stored & AUTO_FLAGS) - want)} but the data no longer shows it – run python3 scripts/data/flags.py")
    return errors, warnings

def main():
    places = json.load(open(ROOT / 'data/places.json', encoding='utf-8'))
    cities = json.load(open(ROOT / 'data/cities.json', encoding='utf-8'))
    meta = json.load(open(ROOT / 'data/meta.json', encoding='utf-8'))
    try:
        errors, warnings = check(places, cities, meta)
    except SchemaError as e:
        print('ERROR: data/schema.json:', e)
        sys.exit(1)
    for w in warnings: print('warning:', w)
    for e in errors: print('ERROR:', e)
    counts = collections.Counter(c for cs in quality(places).values() for c in cs)
    print('quality flags: ' + ', '.join(f'{c} {counts[c]}' for c in FLAG_ORDER))
    print(f"{len(places)} places, {len(errors)} errors, {len(warnings)} warnings")
    sys.exit(1 if errors else 0)

if __name__ == '__main__':
    main()
