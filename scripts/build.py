#!/usr/bin/env python3
"""Builds dist/ from src/template.html + data/ + public/.
Run: python3 scripts/build.py      (vendor/ must exist: scripts/fetch_vendor.sh)"""
import json, re, shutil, hashlib, base64, pathlib, sys
ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))
from validate import check

def main():
    places = json.load(open(ROOT / 'data/places.json', encoding='utf-8'))
    cities = json.load(open(ROOT / 'data/cities.json', encoding='utf-8'))
    errors, _ = check(places, cities)
    if errors:
        print('\n'.join(errors)); sys.exit('build stopped: data errors')
    t = (ROOT / 'src/template.html').read_text(encoding='utf-8')
    t = t.replace('/*LOGIC*/', (ROOT / 'src/logic.js').read_text(encoding='utf-8'))
    html = t.replace('/*DATA*/', json.dumps(places, ensure_ascii=False, separators=(',', ':'))) \
            .replace('/*CITIES*/', json.dumps(cities, ensure_ascii=False)) \
            .replace('/*UPDATED*/', json.dumps(json.load(open(ROOT / 'data/meta.json'))['updated'])) \
            .replace('/*REV*/', str(int(json.load(open(ROOT / 'data/meta.json')).get('rev', 1))))
    dist = ROOT / 'dist'
    if dist.exists(): shutil.rmtree(dist)
    shutil.copytree(ROOT / 'public', dist)
    if (ROOT / 'vendor').exists(): shutil.copytree(ROOT / 'vendor', dist / 'vendor')
    (dist / 'index.html').write_text(html, encoding='utf-8')
    # CSP: allow exactly the inline scripts of this build
    hashes = ' '.join("'sha256-" + base64.b64encode(hashlib.sha256(m.group(1).encode()).digest()).decode() + "'"
                      for m in re.finditer(r'<script>(.*?)</script>', html, re.S))
    h = (dist / '_headers').read_text()
    h = re.sub(r"script-src 'self' [^;]*?'wasm-unsafe-eval'", f"script-src 'self' {hashes} 'wasm-unsafe-eval'", h)
    (dist / '_headers').write_text(h)
    print(f"dist/index.html {len(html.encode())} bytes, sha256 {hashlib.sha256(html.encode()).hexdigest()[:16]}")

if __name__ == '__main__':
    main()
