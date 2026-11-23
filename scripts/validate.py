#!/usr/bin/env python3
"""Checks data/places.json before every update. Exit code 1 = errors that must be fixed.
Run: python3 scripts/validate.py"""
import json, sys, re, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
HC = {'chabad', 'eda', 'landa', 'products'}
TYPES = {'בשרי', 'חלבי', 'פרווה'}
KINDS_PREFIX = ('מסעדה', 'מוצרים', 'קייטרינג', 'מאפייה', 'אחר')

def check(places, cities):
    errors, warnings = [], []
    seen = set(); uids = set()
    for i, p in enumerate(places):
        tag = f"#{i} {p.get('n', '?')}"
        for f in ('n', 'c', 'k', 'h', 'hc', 'f'):
            if not isinstance(p.get(f), str) or not p.get(f).strip():
                errors.append(f"{tag}: missing required field '{f}'")
        if p.get('hc') not in HC:
            errors.append(f"{tag}: kashrut class '{p.get('hc')}' is not one of {sorted(HC)}")
        if not isinstance(p.get('t'), list) or any(t not in TYPES for t in p.get('t', [])):
            errors.append(f"{tag}: food types must be a list from {sorted(TYPES)}")
        for f in ('n', 's', 'c', 'h', 'p', 'f'):
            v = p.get(f)
            if isinstance(v, str) and re.search(r'[<>`]|javascript:', v, re.I):
                errors.append(f"{tag}: field '{f}' contains markup characters")
        u = p.get('u')
        if not isinstance(u, str) or not u:
            errors.append(f"{tag}: missing permanent id 'u' (used in shared links)")
        elif u in uids:
            errors.append(f"{tag}: id '{u}' is used twice")
        uids.add(u)
        key = (p.get('n'), p.get('s'), p.get('c'), p.get('k'), p.get('h'))
        if key in seen: warnings.append(f"{tag}: duplicate name+street+city")
        seen.add(key)
        if p.get('c') and p['c'] not in cities:
            warnings.append(f"{tag}: city '{p['c']}' has no coordinates in cities.json (map position unknown)")
        g = p.get('g') or {}
        loc = g.get('loc')
        if loc is not None:
            if not (isinstance(loc.get('lat'), (int, float)) and isinstance(loc.get('lng'), (int, float))):
                errors.append(f"{tag}: location must be numbers")
            elif not (29.3 < loc['lat'] < 33.5 and 34.2 < loc['lng'] < 35.95):
                errors.append(f"{tag}: location {loc} is outside Israel")
        for per in g.get('periods') or []:
            ok = isinstance(per, list) and len(per) == 6 and all(isinstance(x, int) for x in per)
            if ok:
                od, oh, om, cd, ch, cm = per
                ok = 0 <= od <= 6 and 0 <= cd <= 6 and 0 <= oh <= 23 and 0 <= ch <= 24 and 0 <= om <= 59 and 0 <= cm <= 59
            if not ok: errors.append(f"{tag}: bad opening period {per} (expected [openDay,h,m,closeDay,h,m], day 0=Sunday)")
        week = g.get('week')
        if week is not None and (not isinstance(week, list) or len(week) != 7):
            errors.append(f"{tag}: weekly hours must list 7 days")
        if g.get('periods') and not g.get('chk'):
            errors.append(f"{tag}: has opening hours but no 'chk' (month checked, YYYY-MM)")
        if g.get('chk') and not re.fullmatch(r'20\d\d-(0[1-9]|1[0-2])', g['chk']):
            errors.append(f"{tag}: 'chk' must look like 2026-11")
        if g.get('closed') not in (None, 'סגור לצמיתות', 'סגור זמנית'):
            errors.append(f"{tag}: unknown closed value '{g.get('closed')}'")
    for c, ll in cities.items():
        if not (isinstance(ll, list) and len(ll) == 2 and 29.3 < ll[0] < 33.5 and 34.2 < ll[1] < 35.95):
            errors.append(f"city {c}: coordinates outside Israel")
    return errors, warnings

def main():
    places = json.load(open(ROOT / 'data/places.json', encoding='utf-8'))
    cities = json.load(open(ROOT / 'data/cities.json', encoding='utf-8'))
    errors, warnings = check(places, cities)
    for w in warnings: print('warning:', w)
    for e in errors: print('ERROR:', e)
    print(f"{len(places)} places, {len(errors)} errors, {len(warnings)} warnings")
    sys.exit(1 if errors else 0)

if __name__ == '__main__':
    main()
