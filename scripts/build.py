#!/usr/bin/env python3
"""Builds dist/ from src/template.html + data/ + public/ (+ vendor/ when present).
Run: python3 scripts/build.py      (vendor/ comes from scripts/fetch_vendor.sh; every pinned file must be there)
     python3 scripts/build.py --dev  (local test build: missing vendor files only warn, dist/NOT-FOR-RELEASE.txt)

Besides filling the template it
- writes the allowed values of the live-data gate (K_OK, F_OK, T_OK, PREC_OK, CLOSED_OK) from data/schema.json, so a
  schema change can never make the app silently reject every live update; HC in the template must match schema hc;
- copies only the vendor files listed in fetch_vendor.sh and checks each against its pinned sha256; a missing one stops
  the build (except with --dev);
- gives sw.js a version from a hash of everything it serves and the exact precache list of this build;
- puts the CSP hashes of the inline scripts into dist/_headers;
- reports gzip sizes and stops when a budget is exceeded (docs/perf/stage2.md)."""
import json, re, shutil, hashlib, base64, pathlib, sys, gzip
ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))
from validate import check

# gzip budgets in bytes (stage 2 measurement: index.html 73 KB; the map library is loaded after the list)
BUDGET = {'index.html': 120_000, 'first-load': 520_000}


def schema_consts(schema, template):
    """JS for /*SCHEMA*/: every enum the gate uses, straight from the schema. Fails on drift."""
    d = schema['$defs']; pl = d['place']['properties']; g = d['g']['properties']
    vals = {'K_OK': pl['k']['enum'], 'F_OK': pl['f']['enum'], 'T_OK': pl['t']['items']['enum'],
            'PREC_OK': g['prec']['enum'], 'CLOSED_OK': g['closed']['enum']}
    for k, v in vals.items():
        if not v or not all(isinstance(x, str) and x for x in v):
            sys.exit(f'build stopped: schema enum for {k} is empty or not strings')
    m = re.search(r'const HC = \{([^}]*)\}', template)
    hc = re.findall(r'(\w+)\s*:', m.group(1)) if m else []
    if sorted(hc) != sorted(pl['hc']['enum']):
        sys.exit(f"build stopped: HC in src/template.html {sorted(hc)} != schema hc {sorted(pl['hc']['enum'])}")
    if template.count('/*SCHEMA*/') != 1:
        sys.exit('build stopped: src/template.html must contain /*SCHEMA*/ exactly once')
    return 'const ' + ', '.join(f'{k} = {json.dumps(v, ensure_ascii=False)}' for k, v in vals.items()) + ';'


def vendor_pins():
    """name -> sha256 ('' = not pinned yet) from the PIN lines of fetch_vendor.sh"""
    pins = {}
    for line in (ROOT / 'scripts/fetch_vendor.sh').read_text().splitlines():
        m = re.match(r'^get\s+(\S+)\s+(\S+)\s+([0-9a-f]{64}|-)\s*$', line.strip())
        if m: pins[m.group(1)] = '' if m.group(3) == '-' else m.group(3)
    if not pins: sys.exit('build stopped: no vendor files listed in scripts/fetch_vendor.sh')
    return pins


def copy_vendor(dist, dev=False):
    """Copies the pinned vendor files. A missing or empty one stops the build (without rtl-text.mjs Hebrew map labels
    are drawn reversed, without maplibre the SVG fallback map is shown), unless dev=True (--dev): then the build goes
    on and dist/NOT-FOR-RELEASE.txt names what is missing."""
    src = ROOT / 'vendor'
    pins = vendor_pins()
    missing = [n for n in pins if not (src / n).is_file() or (src / n).stat().st_size == 0]
    # a changed file is checked first: it stops the build even with --dev
    for name, pin in pins.items():
        if name in missing: continue
        h = hashlib.sha256((src / name).read_bytes()).hexdigest()
        if pin and h != pin: sys.exit(f'build stopped: vendor/{name} sha256 {h} != pinned {pin} (scripts/fetch_vendor.sh)')
        if not pin: print(f'warning: vendor/{name} not pinned; sha256 {h}')
    if missing:
        msg = f"vendor/ is missing {', '.join(missing)} (run: sh scripts/fetch_vendor.sh)"
        if not dev: sys.exit(f'build stopped: {msg}; for a local test build without them: python3 scripts/build.py --dev')
        print(f'warning: {msg}; dev build, not for release')
        (dist / 'NOT-FOR-RELEASE.txt').write_text(f'Dev build (--dev): {msg}\n')
    out = []
    for name in pins:
        if name in missing: continue
        (dist / 'vendor').mkdir(exist_ok=True)
        shutil.copy2(src / name, dist / 'vendor' / name); out.append('/vendor/' + name)
    return out


def main(argv=sys.argv[1:]):
    unknown = [a for a in argv if a != '--dev']
    if unknown: sys.exit(f'build stopped: unknown option {unknown[0]} (only --dev)')
    dev = '--dev' in argv
    places = json.load(open(ROOT / 'data/places.json', encoding='utf-8'))
    cities = json.load(open(ROOT / 'data/cities.json', encoding='utf-8'))
    schema = json.load(open(ROOT / 'data/schema.json', encoding='utf-8'))
    meta = json.load(open(ROOT / 'data/meta.json', encoding='utf-8'))
    errors, _ = check(places, cities)
    if errors:
        print('\n'.join(errors)); sys.exit('build stopped: data errors')
    t = (ROOT / 'src/template.html').read_text(encoding='utf-8')
    if '/vendor/fonts.css' in t: sys.exit('build stopped: /vendor/fonts.css is gone (Rubik is in /fonts/)')
    t = t.replace('/*SCHEMA*/', schema_consts(schema, t))
    t = t.replace('/*LOGIC*/', (ROOT / 'src/logic.js').read_text(encoding='utf-8'))
    html = t.replace('/*DATA*/', json.dumps(places, ensure_ascii=False, separators=(',', ':'))) \
            .replace('/*CITIES*/', json.dumps(cities, ensure_ascii=False)) \
            .replace('/*UPDATED*/', json.dumps(meta['updated'])) \
            .replace('/*REV*/', str(int(meta.get('rev', 1))))
    left = [p for p in ('/*SCHEMA*/', '/*LOGIC*/', '/*DATA*/', '/*CITIES*/', '/*UPDATED*/', '/*REV*/') if p in html]
    if left: sys.exit(f'build stopped: placeholders left in index.html: {left}')
    dist = ROOT / 'dist'
    if dist.exists(): shutil.rmtree(dist)
    shutil.copytree(ROOT / 'public', dist)
    vendor = copy_vendor(dist, dev)
    (dist / 'index.html').write_text(html, encoding='utf-8')
    # CSP: allow exactly the inline scripts of this build
    hashes = ' '.join("'sha256-" + base64.b64encode(hashlib.sha256(m.group(1).encode()).digest()).decode() + "'"
                      for m in re.finditer(r'<script>(.*?)</script>', html, re.S))
    h = (dist / '_headers').read_text()
    h2 = re.sub(r"script-src 'self' [^;]*?'wasm-unsafe-eval'", f"script-src 'self' {hashes} 'wasm-unsafe-eval'", h)
    if h2 == h and hashes not in h: sys.exit('build stopped: script-src not found in public/_headers')
    if "'unsafe-inline'" in re.search(r'script-src[^;]*', h2).group(0): sys.exit("build stopped: script-src must not allow 'unsafe-inline'")
    (dist / '_headers').write_text(h2)
    # service worker: precache list of this build and a version that changes with any served byte
    pre = ['/', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/icon-maskable-512.png', '/icon-180.png',
           '/fonts/rubik.woff2', '/map-style/light.json', '/map-style/dark.json'] + vendor
    for p in pre:
        if p != '/' and not (dist / p.lstrip('/')).is_file(): sys.exit(f'build stopped: precache file missing: {p}')
    # sw.js is hashed as written in public/ (before the version is put in), so a change to the worker alone is a new
    # cache version too
    ver = hashlib.sha256()
    for f in sorted(x for x in dist.rglob('*') if x.is_file()):
        ver.update(str(f.relative_to(dist)).encode()); ver.update(hashlib.sha256(f.read_bytes()).digest())
    sw = (dist / 'sw.js').read_text()
    if "'__BUILD__'" not in sw or '__PRECACHE__' not in sw: sys.exit('build stopped: sw.js placeholders missing')
    sw = sw.replace("'__BUILD__'", json.dumps(ver.hexdigest()[:12])).replace('__PRECACHE__', json.dumps(pre))
    (dist / 'sw.js').write_text(sw)
    # sizes (gzip -9, as served) and budgets
    gz = lambda p: len(gzip.compress((dist / p.lstrip('/')).read_bytes() if p != '/' else html.encode(), 9))
    first = ['/', '/fonts/rubik.woff2', '/icon-192.png', '/map-style/light.json'] + [v for v in vendor if not v.endswith('worker.mjs') and 'rtl' not in v]
    size = {p: gz(p) for p in first}
    total = sum(size.values())
    print(f"dist/index.html {len(html.encode())} bytes (gzip {size['/']}), sha256 {hashlib.sha256(html.encode()).hexdigest()[:16]}, sw {ver.hexdigest()[:12]}")
    print('first load (gzip): ' + ', '.join(f'{p} {n}' for p, n in size.items()) + f' = {total}')
    if size['/'] > BUDGET['index.html']: sys.exit(f"build stopped: index.html gzip {size['/']} > budget {BUDGET['index.html']}")
    if total > BUDGET['first-load']: sys.exit(f"build stopped: first load gzip {total} > budget {BUDGET['first-load']}")

if __name__ == '__main__':
    main()
