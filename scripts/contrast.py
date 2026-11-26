#!/usr/bin/env python3
"""Contrast check of the design tokens in src/template.html (light :root and the prefers-color-scheme:dark block).
Every text/background pair the UI uses must reach 4.5:1 (WCAG AA, normal text). Translucent colours are blended
over the surface they sit on. Exits 1 on any failure. Run: python3 scripts/contrast.py"""
import re, sys, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
MIN = 4.5
# (text, background, what) – background may be 'glass over map' = translucent token over the map colour
PAIRS = [
    ('ink', 'bg', 'main text on the sheet'), ('ink', 'surface', 'main text on cards'),
    ('sub', 'bg', 'secondary text on the sheet'), ('sub', 'surface', 'secondary text on cards'),
    ('brand', 'surface', 'action text (buttons, links)'), ('brand', 'bg', 'action text on the sheet'),
    ('brand', 'brand-tint', 'quiet action button'), ('on-brand', 'brand', 'primary button / active chip / cluster'),
    ('open', 'open-bg', 'status label: open'), ('soon', 'soon-bg', 'status label: closing soon'),
    ('closed', 'closed-bg', 'status label: closed'), ('sub', 'bg', 'status: no information'),
    ('warn-ink', 'warn-bg', 'doubtful hours / offline bar'), ('warn-ink', 'surface', 'doubtful hours note in a row'),
    ('on-k', 'chabad', 'kashrut letter ח'), ('on-k', 'eda', 'kashrut letter ע'), ('on-k', 'landa', 'kashrut letter ל'),
    ('products', 'surface', 'kashrut letter מ (hollow)'),
    ('chabad', 'surface', 'kashrut text חב״ד'), ('eda', 'surface', 'kashrut text העדה'),
    ('landa', 'surface', 'kashrut text לנדא'), ('products', 'surface', 'kashrut text מוצרים'),
    ('ink', 'glass/map-bg', 'search text over the map'), ('sub', 'glass/map-bg', 'search placeholder over the map'),
    ('ink', 'glass-chip/map-bg', 'chip text over the map'), ('brand', 'glass-float/map-bg', 'location button'),
    ('toast-ink', 'toast-bg/bg', 'toast'), ('ink', 'attr-bg/map-bg', 'map attribution'),
    ('ink', 'map-halo', 'marker name label'), ('ink', 'surface-hover', 'row text on hover'),
]

def tokens(block):
    return dict(re.findall(r'--([\w-]+)\s*:\s*([^;]+);', block))

def parse():
    s = (ROOT / 'src/template.html').read_text(encoding='utf-8')
    css = s[s.index('<style>'):s.index('</style>')]
    light = tokens(re.search(r':root\{(.*?)\n\}', css, re.S).group(1))
    dark = dict(light); dark.update(tokens(re.search(r'@media \(prefers-color-scheme:dark\)\{:root\{(.*?)\}\}', css, re.S).group(1)))
    return {'light': light, 'dark': dark}

def rgba(v, t, depth=0):
    v = v.strip()
    m = re.fullmatch(r'var\(--([\w-]+)\)', v)
    if m and depth < 8: return rgba(t[m.group(1)], t, depth + 1)
    if v.startswith('#'):
        h = v[1:]
        if len(h) == 3: h = ''.join(c * 2 for c in h)
        return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) + (1.0,)
    m = re.fullmatch(r'rgba?\(([^)]*)\)', v)
    if m:
        p = [float(x) for x in m.group(1).split(',')]
        return (p[0], p[1], p[2], p[3] if len(p) > 3 else 1.0)
    raise ValueError(f'cannot read colour {v!r}')

def over(fg, bg):
    a = fg[3]
    return tuple(fg[i] * a + bg[i] * (1 - a) for i in range(3)) + (1.0,)

def colour(name, t):
    if '/' in name:
        top, under = name.split('/')
        return over(rgba(t[top], t), colour(under, t))
    c = rgba(t[name], t)
    return c if c[3] == 1 else over(c, rgba(t['bg'], t))

def lum(c):
    def ch(x):
        x /= 255
        return x / 12.92 if x <= 0.03928 else ((x + 0.055) / 1.055) ** 2.4
    return 0.2126 * ch(c[0]) + 0.7152 * ch(c[1]) + 0.0722 * ch(c[2])

def ratio(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)

def main():
    bad = 0; low = (99, '')
    for theme, t in parse().items():  # a token defined through itself is invalid CSS and silently drops the rule
        for k, v in t.items():
            if f'var(--{k})' in v: bad += 1; print(f'FAIL {theme}: --{k} refers to itself')
    for theme, t in parse().items():
        for fg, bg, what in PAIRS:
            r = ratio(colour(fg, t), colour(bg, t))
            if r < low[0]: low = (r, f'{theme}: {what}')
            if r < MIN:
                bad += 1; print(f'FAIL {theme:5} {r:5.2f}:1  {what}  (--{fg} on --{bg})')
            elif '-v' in sys.argv:
                print(f'ok   {theme:5} {r:5.2f}:1  {what}')
    print(f'{len(PAIRS) * 2} pairs, lowest {low[0]:.2f}:1 ({low[1]})' + (f', {bad} below {MIN}:1' if bad else ', all >= 4.5:1'))
    sys.exit(1 if bad else 0)

if __name__ == '__main__':
    main()
