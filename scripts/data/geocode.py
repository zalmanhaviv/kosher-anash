#!/usr/bin/env python3
"""Pre-computed geocoding with OpenStreetMap Nominatim, for places that have a street address (s)
but no exact location (no g.loc). Never runs in the app; results are stored in the repository.

Default = offline. The script reads Nominatim answers from a local JSON file (the cache,
data/geocode-cache.json, or --answers FILE) and makes NO network calls.

  python3 scripts/data/geocode.py                 # report only: accepted / doubtful / no answer
  python3 scripts/data/geocode.py --write         # also store accepted results in data/places.json
  python3 scripts/data/geocode.py --answers a.json [--write]
  python3 scripts/data/geocode.py --fetch [--write]   # ONLY when run by the owner or a manual CI job

--fetch asks Nominatim for the queries that are not in the cache yet, one request at a time with
1.1 s between requests, an identifying User-Agent, countrycodes=il, and saves every answer to the
cache so the same address is never asked twice (Nominatim usage policy:
https://operations.osmfoundation.org/policies/nominatim/).

Answers file format: {"<query key>": [<Nominatim jsonv2 result with addressdetails=1>, ...]}.
The query key is printed for every candidate (see query_key()).

A result is accepted only when ALL of these hold:
  - the returned road equals the booklet street (after removing quotes, 'רחוב/שדרות/שד׳' and the
    letters ו/י, so כתיב מלא/חסר match),
  - the returned town (city/town/village/municipality) equals the booklet town c (same normalising),
  - it lies within 8 km of the town centre in cities.json.
prec = 'house' when the result is the building with the same house number, else 'street'.
Stored as g = {loc, prec, src:'osm', chk:'YYYY-MM'}. Anything else is 'doubtful' and is listed in
data/review-queue.md (scripts/data/review_queue.py) instead of being stored."""
import json, re, sys, time, math, datetime, pathlib, urllib.parse
ROOT = pathlib.Path(__file__).resolve().parents[2]
PLACES = ROOT / 'data/places.json'
CITIES = ROOT / 'data/cities.json'
CACHE = ROOT / 'data/geocode-cache.json'
API = 'https://nominatim.openstreetmap.org/search'
USER_AGENT = 'kosher-anash-data/1.0 (+https://github.com/zalmanhaviv/kosher-anash)'
MAX_KM = 8.0
GENERIC = {'רחוב', 'רח', 'שדרות', 'שד', 'שדרת', 'סמטת', 'קניון', 'מרכז', 'צומת'}

def norm(s):
    """Spelling-forgiving comparison form of a Hebrew street or town name."""
    s = re.sub(r'[״"׳\'`’.,\-–־()]', ' ', str(s or ''))
    s = s.replace('ך', 'כ').replace('ם', 'מ').replace('ן', 'נ').replace('ף', 'פ').replace('ץ', 'צ')
    words = [w for w in s.split() if w not in GENERIC]
    return ' '.join(re.sub(r'[וי]', '', w) for w in words if re.sub(r'[וי]', '', w))

def split_street(s):
    """('שדרות ירושלים', '40') from 'שדרות ירושלים 40'; extra words after the number are dropped."""
    m = re.match(r'^\s*(.*?[^\d\s])\s+(\d+[א-ת]?)\b', s or '')
    return (m.group(1).strip(), m.group(2)) if m else ((s or '').strip(), '')

def candidates(places):
    return [(i, p) for i, p in enumerate(places) if (p.get('s') or '').strip() and not (p.get('g') or {}).get('loc')]

def query_params(p):
    street, num = split_street(p['s'])
    return {'format': 'jsonv2', 'addressdetails': '1', 'limit': '5', 'countrycodes': 'il',
            'street': (num + ' ' + street).strip() if num else street, 'city': p['c']}

def query_key(p):
    return urllib.parse.urlencode(sorted(query_params(p).items()))

def km(a, b):
    la1, lo1, la2, lo2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    x = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 12742 * math.asin(math.sqrt(x))

def judge(p, results, centre):
    """('accepted', g) | ('doubtful', reason) | ('none', reason)."""
    if not results:
        return 'none', 'Nominatim returned nothing'
    street, num = split_street(p['s'])
    reasons = []
    for r in results:
        a = r.get('address') or {}
        road = a.get('road') or a.get('pedestrian') or a.get('footway') or ''
        town = next((a[k] for k in ('city', 'town', 'village', 'municipality') if a.get(k)), '')
        ll = (float(r['lat']), float(r['lon']))
        if norm(road) != norm(street) or not norm(street):
            reasons.append(f"road '{road}' ≠ '{street}'")
            continue
        if norm(town) != norm(p['c']):
            reasons.append(f"town '{town}' ≠ '{p['c']}'")
            continue
        if centre and km(ll, centre) > MAX_KM:
            reasons.append(f'{km(ll, centre):.1f} km from the town centre')
            continue
        house = bool(num) and str(a.get('house_number', '')).strip() == num
        g = {'loc': {'lat': round(ll[0], 6), 'lng': round(ll[1], 6)}, 'prec': 'house' if house else 'street',
             'src': 'osm', 'chk': datetime.date.today().strftime('%Y-%m')}
        return 'accepted', g
    return 'doubtful', '; '.join(reasons[:3])

def fetch(params):
    import urllib.request
    req = urllib.request.Request(API + '?' + urllib.parse.urlencode(params), headers={'User-Agent': USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode('utf-8'))

def run(places, cities, answers):
    """[(index, place, status, detail, key)] for every candidate."""
    out = []
    for i, p in candidates(places):
        key = query_key(p)
        c = cities.get(p['c'])
        if key not in answers:
            out.append((i, p, 'pending', 'no Nominatim answer stored yet', key))
            continue
        status, detail = judge(p, answers[key], tuple(c) if c else None)
        out.append((i, p, status, detail, key))
    return out

def main(argv):
    places = json.loads(PLACES.read_text(encoding='utf-8'))
    cities = json.loads(CITIES.read_text(encoding='utf-8'))
    src = pathlib.Path(argv[argv.index('--answers') + 1]) if '--answers' in argv else CACHE
    answers = json.loads(src.read_text(encoding='utf-8')) if src.exists() else {}
    if '--fetch' in argv:
        for _, p in candidates(places):
            key = query_key(p)
            if key in answers:
                continue
            answers[key] = fetch(query_params(p))
            CACHE.write_text(json.dumps(answers, ensure_ascii=False, indent=1), encoding='utf-8')
            time.sleep(1.1)
    rows = run(places, cities, answers)
    for i, p, status, detail, key in rows:
        print(f"{status:9} #{i} {p['n']} | {p['s']} | {p['c']} | {detail if status != 'accepted' else detail['prec']}\n          key: {key}")
    if '--write' in argv:
        n = 0
        for i, p, status, detail, _ in rows:
            if status == 'accepted' and not p.get('g'):
                p['g'] = detail
                n += 1
        if n:
            PLACES.write_text(json.dumps(places, ensure_ascii=False, indent=1), encoding='utf-8')
        print(f'stored {n} locations')
    counts = {s: sum(1 for r in rows if r[2] == s) for s in ('accepted', 'doubtful', 'none', 'pending')}
    print('summary: ' + ', '.join(f'{k} {v}' for k, v in counts.items()))

if __name__ == '__main__':
    main(sys.argv[1:])
