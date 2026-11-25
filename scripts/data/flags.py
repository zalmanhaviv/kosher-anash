#!/usr/bin/env python3
"""Writes the quality flags g.q into data/places.json (same rules as scripts/validate.py).
It only adds/removes codes in g.q – it never changes hours, kashrut, locations or anything else.
Run: python3 scripts/data/flags.py            (writes the file)
     python3 scripts/data/flags.py --check    (exit 1 if g.q is not up to date; writes nothing)
Codes: see data/README.md and data/schema.json (#/$defs/g/properties/q/x-codes)."""
import json, sys, pathlib
ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'scripts'))
from validate import quality, FLAG_ORDER, AUTO_FLAGS  # noqa: E402

PLACES = ROOT / 'data/places.json'

def save_places(places):
    """Same format as the existing file: indent 1, Hebrew as is, no final newline."""
    PLACES.write_text(json.dumps(places, ensure_ascii=False, indent=1), encoding='utf-8')

def apply(places):
    computed = quality(places)
    changed = 0
    for i, p in enumerate(places):
        g = p.get('g')
        if g is None:
            continue
        keep = [c for c in (g.get('q') or []) if c not in AUTO_FLAGS]   # codes set by hand, if any
        new = [c for c in FLAG_ORDER if c in computed.get(i, [])] + keep
        if new != (g.get('q') or []):
            changed += 1
            if new:
                g['q'] = new
            else:
                g.pop('q', None)
    return changed

def main():
    places = json.loads(PLACES.read_text(encoding='utf-8'))
    changed = apply(places)
    if '--check' in sys.argv:
        print(f'{changed} places need a g.q update')
        sys.exit(1 if changed else 0)
    if changed:
        save_places(places)
    print(f'g.q updated on {changed} places')

if __name__ == '__main__':
    main()
