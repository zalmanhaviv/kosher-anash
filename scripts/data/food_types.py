#!/usr/bin/env python3
"""Fills an empty food type t only when the source text states it explicitly.
Looks for the whole words בשרי / חלבי / פרווה in k, f, n, h (in that order) of places with t == [].
Never guesses from the kind of place, the name of a dish or the kashrut body; never changes a non-empty t
and never touches tt (the raw booklet text) or h.
Run: python3 scripts/data/food_types.py           (writes data/places.json, prints what it filled)
     python3 scripts/data/food_types.py --dry     (prints only)"""
import json, re, sys, pathlib, collections
ROOT = pathlib.Path(__file__).resolve().parents[2]
PLACES = ROOT / 'data/places.json'
WORD = re.compile(r'(?<![א-ת])(בשרי|חלבי|פרווה)(?![א-ת])')
FIELDS = ('k', 'f', 'n', 'h')

def stated(p):
    """(types, field) from the first field that names food types explicitly, else ([], None)."""
    for f in FIELDS:
        found = []
        for m in WORD.findall(p.get(f) or ''):
            if m not in found:
                found.append(m)
        if found:
            return found, f
    return [], None

def main():
    places = json.loads(PLACES.read_text(encoding='utf-8'))
    by_field = collections.Counter()
    left = 0
    for i, p in enumerate(places):
        if p.get('t'):
            continue
        types, field = stated(p)
        if types:
            p['t'] = types
            by_field[field] += 1
            print(f"#{i} {p['n']} ({p['c']}): t={types} from {field}={p[field]!r}")
        else:
            left += 1
    print(f"filled {sum(by_field.values())} ({dict(by_field)}), still empty {left}")
    if '--dry' not in sys.argv and by_field:
        PLACES.write_text(json.dumps(places, ensure_ascii=False, indent=1), encoding='utf-8')

if __name__ == '__main__':
    main()
