#!/usr/bin/env python3
"""Builds public/fonts/rubik.woff2 from the Rubik variable font (google/fonts, ofl/rubik, OFL 1.1).
Weight axis limited to 400–600 (text 400/500, headings 600); Hebrew + basic Latin + digits/punctuation only.
Run once when the font changes:  python3 src/theme/subset_fonts.py <path to Rubik[wght].ttf>
woff2 needs the 'brotli' Python module (fontTools)."""
import sys, pathlib
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset
ROOT = pathlib.Path(__file__).resolve().parent.parent.parent
UNI = ('U+0020-007E,U+00A0,U+00A9,U+00B7,U+00D7,U+0591-05C7,U+05D0-05EA,U+05EF-05F4,U+FB1D-FB4F,'
       'U+200E-200F,U+2010-2014,U+2018-201E,U+2022,U+2026,U+2032-2033,U+20AA,U+2212')
def main(src):
    f = TTFont(src)
    opt = subset.Options()
    opt.layout_features = ['kern', 'liga', 'calt', 'mark', 'mkmk', 'ccmp', 'locl', 'tnum', 'rlig']
    opt.name_IDs = ['*']; opt.notdef_outline = True; opt.hinting = False
    s = subset.Subsetter(opt); s.populate(unicodes=subset.parse_unicodes(UNI)); s.subset(f)
    f = instancer.instantiateVariableFont(f, {'wght': (400, 600)})
    out = ROOT / 'public/fonts/rubik.woff2'; out.parent.mkdir(parents=True, exist_ok=True)
    f.flavor = 'woff2'; f.save(out)
    print(out, out.stat().st_size, 'bytes')
if __name__ == '__main__':
    main(sys.argv[1])
