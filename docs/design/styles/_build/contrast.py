#!/usr/bin/env python3
"""Contrast of key text/background token pairs per style (light and dark). Translucent backgrounds measured over their base."""
import re, os, sys
B = os.path.dirname(os.path.abspath(__file__))
def toks(css, dark):
    out = {}
    for m in re.finditer(r':root(\[data-theme=dark\])?\{([^}]*)\}', css):
        if bool(m.group(1)) and not dark: continue
        for k, v in re.findall(r'--([\w-]+):([^;]+)', m.group(2)): out[k] = v.strip()
    return out
def rgb(v, T):
    while v.startswith('var('): v = T[v[6:-1]]
    if v.startswith('#'): h = v[1:]; return tuple(int(h[i:i+2], 16) for i in (0, 2, 4)) + (1,)
    m = re.match(r'rgba?\(([^)]*)\)', v); p = [float(x) for x in m.group(1).split(',')]; return tuple(p[:3]) + ((p[3] if len(p) > 3 else 1),)
def over(c, b): a = c[3]; return tuple(c[i] * a + b[i] * (1 - a) for i in range(3)) + (1,)
def lum(c): f = lambda x: (x / 255) / 12.92 if x / 255 <= .03928 else ((x / 255 + .055) / 1.055) ** 2.4; return .2126 * f(c[0]) + .7152 * f(c[1]) + .0722 * f(c[2])
def cr(a, b): l1, l2 = sorted([lum(a), lum(b)], reverse=True); return (l1 + .05) / (l2 + .05)
PAIRS = [('ink', 'sheet-bg'), ('sub', 'sheet-bg'), ('sub', 'surface'), ('open', 'sheet-bg'), ('open', 'surface'), ('soon', 'surface'), ('closed', 'surface'), ('link', 'sheet-bg'), ('brand-ink', 'brand'),
         ('chip-ink', 'chip-bg'), ('chip-on-ink', 'chip-on-bg'), ('btn2-ink', 'btn2-bg'), ('warn-ink', 'warn-bg'), ('k-on', 'k-chabad'), ('k-on', 'k-eda'), ('k-on', 'k-landa'), ('k-products', 'surface'), ('m-label', 'm-land'), ('m-water-label', 'm-sea'), ('toast-ink', 'toast-bg')]
# extra pairs for styles that define status-label backgrounds (hybrid): label text on its tint, tinted town button
EXTRA = [('open', 'open-bg'), ('soon', 'soon-bg'), ('closed', 'closed-bg'), ('btn2-ink', 'brand-tint')]
bad = 0
for st in ['apple', 'wolt', 'airbnb', 'google', 'hybrid']:
    css = open(os.path.join(B, 'common.css')).read() + open(os.path.join(B, st + '.css')).read()
    for dark in (False, True):
        T = toks(css, dark); base = rgb(T['bg'], T); base = over(base, (255, 255, 255, 1) if not dark else (0, 0, 0, 1)); land = rgb(T['m-land'], T)
        row = []
        for f, b in PAIRS + (EXTRA if 'open-bg' in T else []):
            bb = rgb(T[b], T) if T[b] != 'transparent' else base; bb = over(bb, land if b in ('chip-bg', 'search-bg') else base) if bb[3] < 1 else bb
            if b == 'chip-bg' and bb[3] == 1 and T[b] == 'transparent': bb = base
            r = cr(over(rgb(T[f], T), bb), bb); row.append(f'{f}/{b} {r:.1f}'); bad += r < 4.5
            if r < 4.5: print('  LOW', st, 'dark' if dark else 'light', f, b, round(r, 2))
        print(st, 'dark ' if dark else 'light', ' | '.join(row))
sys.exit(1 if bad else 0)
