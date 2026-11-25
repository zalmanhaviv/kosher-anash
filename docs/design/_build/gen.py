#!/usr/bin/env python3
"""Builds the S1-2 design proposals: docs/design/<dir>/{mock.html,markers.svg,map-style.json,README.md}.

Run:  node docs/design/_build/data.mjs && python3 docs/design/_build/gen.py
Then: python3 docs/design/_build/shots.py   (Playwright screenshots)

All place data comes from data/places.json via data.mjs (statuses computed with src/logic.js
statusAt for Friday 27.11.2026 12:30, Israel time). Nothing is invented.
"""
import json, math, os, sys, html, itertools
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from directions import DIRS, COMMON_SCALE
from color import cr, de

ROOT = os.path.abspath(os.path.join(HERE, '..'))
D = json.load(open(os.path.join(HERE, 'mockdata.json'), encoding='utf-8'))
E = html.escape
HL = {'chabad': 'ח', 'eda': 'ע', 'landa': 'ל', 'products': 'מ'}
HC = {'chabad': 'חב״ד', 'eda': 'העדה החרדית', 'landa': 'לנדא', 'products': 'מוצרי העדה/לנדא'}
DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
TODAY = 5  # Friday

# ---------------------------------------------------------------- icons (line, 24 grid)
IC = {
 'search': '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
 'filter': '<path d="M4 6h16M7 12h10M10 18h4"/>',
 'locate': '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
 'nav': '<path d="M12 3 4.5 20.2 12 16l7.5 4.2z"/>',
 'map': '<path d="M9 4 3 6.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5z"/><path d="M9 4v13.5M15 6.5V20"/>',
 'share': '<circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="m8.2 10.8 7.6-4.1M8.2 13.2l7.6 4.1"/>',
 'tel': '<path d="M5 4h3.5l1.7 4.3-2.2 1.4a11 11 0 0 0 6.3 6.3l1.4-2.2L20 15.5V19a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z"/>',
 'back': '<path d="m9 6 6 6-6 6"/>',
 'star': '<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
 'clock': '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
 'candle': '<path d="M9 21h6M10 21v-9h4v9"/><path d="M12 9.5c-1.6-1.2-1.6-3 0-5 1.6 2 1.6 3.8 0 5z"/>',
}
def icon(name, size=20, sw=2):
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
            f'stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{IC[name]}</svg>')

# ---------------------------------------------------------------- projection
def merc(lat, lng, z):
    s = 256 * 2 ** z
    x = (lng + 180) / 360 * s
    y = (1 - math.log(math.tan(math.radians(lat)) + 1 / math.cos(math.radians(lat))) / math.pi) / 2 * s
    return x, y

def project(places, center, z, ox, oy):
    cx, cy = merc(center[0], center[1], z)
    out = []
    for p in places:
        x, y = merc(p['loc']['lat'], p['loc']['lng'], z)
        out.append((x - cx + ox, y - cy + oy, p))
    return out

def cluster(pts, r):
    groups = []
    for x, y, p in pts:
        for g in groups:
            if math.hypot(g['x'] - x, g['y'] - y) < r:
                g['m'].append((x, y, p)); n = len(g['m'])
                g['x'] = sum(a for a, _, _ in g['m']) / n; g['y'] = sum(b for _, b, _ in g['m']) / n
                break
        else:
            groups.append({'x': x, 'y': y, 'm': [(x, y, p)]})
    return groups

def smooth_closed(pts):
    n = len(pts); d = f'M{pts[0][0]:.1f},{pts[0][1]:.1f}'
    for i in range(n):
        p0, p1, p2, p3 = pts[i - 1], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d += f' C{c1[0]:.1f},{c1[1]:.1f} {c2[0]:.1f},{c2[1]:.1f} {p2[0]:.1f},{p2[1]:.1f}'
    return d + 'Z'

# ---------------------------------------------------------------- markers (SVG, also used in markers.svg)
def marker_svg(kind, hc, state='', approx=False, sel=False, label=None):
    """state: y open, s closing soon, u no info. Returns an inline <svg> positioned by caller (centre at 0,0)."""
    v = lambda n: f'var(--{n})'
    fill, on = v('k-' + hc), v('k-' + hc + '-on')
    hollow = hc == 'products' or approx
    sc = 1.3 if sel else 1
    if kind == 'tile':
        s = 30 * sc; r = 9 * sc; w = s + 8
        body = (f'<rect x="4" y="4" width="{s}" height="{s}" rx="{r}" fill="none" stroke="{v("mk-edge")}" stroke-width="4.2"/>'
                f'<rect x="4" y="4" width="{s}" height="{s}" rx="{r}" fill="{v("surface") if hollow else fill}" '
                f'stroke="{fill if hollow else v("ring")}" stroke-width="2.2" {"stroke-dasharray=\"4 3\"" if approx else ""}/>'
                f'<text x="{4 + s / 2}" y="{4 + s / 2 + 6 * sc}" text-anchor="middle" class="mkt" font-size="{17 * sc}" '
                f'fill="{fill if hollow else on}">{HL[hc]}</text>')
        if state == 'y': body += f'<circle cx="7" cy="7" r="5" fill="{v("open")}" stroke="{v("badge-edge")}" stroke-width="2"/>'
        if state == 's': body += f'<circle cx="7" cy="7" r="4.5" fill="{v("badge-edge")}" stroke="{v("soon")}" stroke-width="2.6"/>'
        h = w
    elif kind == 'tag':
        s = 28 * sc; r = 7 * sc; w = s + 8; h = s + 16
        cxm = 4 + s / 2
        tagd = (f'M{4 + r},{4} h{s - 2 * r} a{r},{r} 0 0 1 {r},{r} v{s - 2 * r} a{r},{r} 0 0 1 -{r},{r} '
                f'h-{s / 2 - r - 5} l-5,7 l-5,-7 h-{s / 2 - r - 5} a{r},{r} 0 0 1 -{r},-{r} v-{s - 2 * r} a{r},{r} 0 0 1 {r},-{r}z')
        body = (f'<path d="{tagd}" fill="none" stroke="{v("mk-edge")}" stroke-width="4" stroke-linejoin="round"/>'
                f'<path d="M{4 + r},{4} h{s - 2 * r} a{r},{r} 0 0 1 {r},{r} v{s - 2 * r} a{r},{r} 0 0 1 -{r},{r} '
                f'h-{s / 2 - r - 5} l-5,7 l-5,-7 h-{s / 2 - r - 5} a{r},{r} 0 0 1 -{r},-{r} v-{s - 2 * r} a{r},{r} 0 0 1 {r},-{r}z" '
                f'fill="{v("surface") if hollow else fill}" stroke="{fill if hollow else v("ring")}" stroke-width="2" '
                f'{"stroke-dasharray=\"4 3\"" if approx else ""}/>'
                f'<text x="{cxm}" y="{4 + s / 2 + 6 * sc}" text-anchor="middle" class="mkt" font-size="{16 * sc}" '
                f'fill="{fill if hollow else on}">{HL[hc]}</text>')
        if state in ('y', 's'):
            col = v('open') if state == 'y' else v('soon')
            body += f'<rect x="{cxm - 9}" y="{4 + s - 6}" width="18" height="4" rx="2" fill="{col}" stroke="{v("badge-edge")}" stroke-width="1"/>'
    else:  # seal
        R = 16 * sc; w = 2 * R + 8; h = w; c = w / 2
        body = (f'<circle cx="{c}" cy="{c}" r="{R}" fill="none" stroke="{v("mk-edge")}" stroke-width="4.4"/>'
                f'<circle cx="{c}" cy="{c}" r="{R}" fill="{v("surface") if hollow else fill}" stroke="{fill if hollow else v("ring")}" '
                f'stroke-width="2.4" {"stroke-dasharray=\"4 3\"" if approx else ""}/>'
                f'<circle cx="{c}" cy="{c}" r="{R - 4.5}" fill="none" stroke="{fill if hollow else on}" stroke-opacity=".55" stroke-width="1"/>'
                f'<text x="{c}" y="{c + 6 * sc}" text-anchor="middle" class="mkt" font-size="{17 * sc}" fill="{fill if hollow else on}">{HL[hc]}</text>')
        if state == 'y':
            body += (f'<circle cx="{w - 7}" cy="7" r="6" fill="{v("open")}" stroke="{v("badge-edge")}" stroke-width="2"/>'
                     f'<path d="M{w - 9.5},7 l1.8,1.8 3.2,-3.4" stroke="{v("ring")}" stroke-width="1.8" fill="none" stroke-linecap="round"/>')
        if state == 's':
            body += (f'<circle cx="{w - 7}" cy="7" r="6" fill="{v("soon")}" stroke="{v("badge-edge")}" stroke-width="2"/>'
                     f'<path d="M{w - 7},4 v3.2 l2,1.2" stroke="{v("ring")}" stroke-width="1.6" fill="none" stroke-linecap="round"/>')
    lab = ''
    if label:
        lab = f'<span class="mkl">{E(label)}</span>'
    return w, h, f'<svg class="mksvg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" aria-hidden="true">{body}</svg>{lab}'

def cluster_svg(kind, members):
    n = len(members); v = lambda x: f'var(--{x})'
    if kind == 'wine':
        r = 19 if n < 10 else 22; w = 2 * r + 6; c = w / 2
        body = (f'<circle cx="{c}" cy="{c}" r="{r}" fill="{v("brand")}" stroke="{v("band-ink")}" stroke-width="3"/>'
                f'<text x="{c}" y="{c + 5.5}" text-anchor="middle" class="clt" fill="{v("brand-on")}">{n}</text>')
    elif kind == 'square':
        s = 36 if n < 10 else 40; w = s + 6
        body = (f'<rect x="3" y="3" width="{s}" height="{s}" rx="11" fill="{v("brand")}" stroke="{v("ring")}" stroke-width="3"/>'
                f'<text x="{w / 2}" y="{w / 2 + 5.5}" text-anchor="middle" class="clt" fill="{v("brand-on")}">{n}</text>')
    else:  # ring: segmented by kashrut share
        r = 20 if n < 10 else 23; w = 2 * r + 10; c = w / 2; circ = 2 * math.pi * (r + 1)
        body = f'<circle cx="{c}" cy="{c}" r="{r + 1}" fill="none" stroke="{v("ring")}" stroke-width="8"/>'
        off = 0
        for hc in ('chabad', 'eda', 'landa', 'products'):
            k = sum(1 for m in members if m['hc'] == hc)
            if not k: continue
            L = circ * k / n
            body += (f'<circle cx="{c}" cy="{c}" r="{r + 1}" fill="none" stroke="{v("k-" + hc)}" stroke-width="5" '
                     f'stroke-dasharray="{max(L - 2, 1):.1f} {circ - max(L - 2, 1):.1f}" stroke-dashoffset="{-off:.1f}" transform="rotate(-90 {c} {c})"/>')
            off += L
        body += (f'<circle cx="{c}" cy="{c}" r="{r - 3}" fill="{v("signal-on")}"/>'
                 f'<text x="{c}" y="{c + 6}" text-anchor="middle" class="clt" fill="{v("signal")}">{n}</text>')
    return w, w, f'<svg class="mksvg" width="{w}" height="{w}" viewBox="0 0 {w} {w}" aria-hidden="true">{body}</svg>'

def me_dot():
    return ('<svg class="mksvg" width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">'
            '<circle cx="22" cy="22" r="18" fill="var(--me)" fill-opacity=".18"/>'
            '<circle cx="22" cy="22" r="8" fill="var(--me)" stroke="var(--ring)" stroke-width="3"/></svg>')

# ---------------------------------------------------------------- schematic map
def map_svg(d, w, h, center, z, ox, oy, places, mode, sel_u=None, cl_r=34):
    pts = project([p for p in places if p.get('loc')], center, z, ox, oy)
    g = []
    g.append(f'<rect width="{w}" height="{h}" fill="var(--m-land)"/>')
    if mode == 'town':
        ring = [(x, y) for x, y, p in pts if (p['s'] or '').startswith('ירושלים') and p['c'] == 'צפת']
        cx = sum(a for a, _ in ring) / len(ring); cy = sum(b for _, b in ring) / len(ring)
        # drop duplicates closer than 6px, order by angle around centroid
        uniq = []
        for q in sorted(ring, key=lambda q: math.atan2(q[1] - cy, q[0] - cx)):
            if all(math.hypot(q[0] - u[0], q[1] - u[1]) > 14 for u in uniq): uniq.append(q)
        # push ring slightly outward so markers sit beside the road, not on it
        rp = [(cx + (x - cx) * 1.12, cy + (y - cy) * 1.12) for x, y in uniq]
        ringd = smooth_closed(rp)
        g.append(f'<rect width="{w}" height="{h}" fill="var(--m-resid)" opacity=".9"/>')
        # wooded slope west/south-west (Biriya forest side) and citadel park in the ring
        g.append(f'<path d="M0,{h * .55} C{w * .2},{h * .5} {w * .25},{h * .8} {w * .1},{h} L0,{h}Z" fill="var(--m-wood)"/>')
        g.append(f'<path d="{smooth_closed([(cx + (x - cx) * .55, cy + (y - cy) * .55) for x, y in uniq])}" fill="var(--m-park)"/>')
        # buildings: deterministic blocks along a grid
        import random; rnd = random.Random(7)
        for i in range(140):
            bx, by = rnd.uniform(0, w), rnd.uniform(0, h)
            if math.hypot(bx - cx, by - cy) < 60: continue
            g.append(f'<rect x="{bx:.0f}" y="{by:.0f}" width="{rnd.randint(10, 22)}" height="{rnd.randint(8, 16)}" rx="1.5" '
                     f'fill="var(--m-building)" transform="rotate({rnd.randint(-25, 25)} {bx:.0f} {by:.0f})"/>')
        roads = []
        for x, y, p in pts:
            if (p['s'] or '').startswith('ירושלים'): continue
            nx, ny = min(rp, key=lambda q: math.hypot(q[0] - x, q[1] - y))
            ex, ey = x + (x - nx) * 0.6, y + (y - ny) * 0.6
            roads.append(f'M{nx:.0f},{ny:.0f} Q{(nx + x) / 2 + 12:.0f},{(ny + y) / 2 - 8:.0f} {x:.0f},{y:.0f} T{ex:.0f},{ey:.0f}')
        for a in (0.3, 1.4, 2.6, 3.7, 4.9, 5.7):
            sx, sy = cx + math.cos(a) * 95, cy + math.sin(a) * 95
            roads.append(f'M{sx:.0f},{sy:.0f} L{cx + math.cos(a) * 700:.0f},{cy + math.sin(a) * 700:.0f}')
        for r_ in roads:
            g.append(f'<path d="{r_}" fill="none" stroke="var(--m-casing)" stroke-width="9" stroke-linecap="round"/>')
        for r_ in roads:
            g.append(f'<path d="{r_}" fill="none" stroke="var(--m-road)" stroke-width="6.5" stroke-linecap="round"/>')
        g.append(f'<path id="ringroad" d="{ringd}" fill="none" stroke="var(--m-major-casing)" stroke-width="14"/>')
        g.append(f'<path d="{ringd}" fill="none" stroke="var(--m-major)" stroke-width="10.5"/>')
        g.append('<text class="mrl" dy="4"><textPath href="#ringroad" startOffset="18%">ירושלים</textPath></text>')
        g.append(f'<text class="mpl" x="{cx - 120:.0f}" y="{cy + 40:.0f}">העיר העתיקה</text>')
    else:  # region
        g.append(f'<path d="M0,0 C{w * .18},{h * .1} {w * .3},{h * .35} {w * .22},{h * .62} C{w * .14},{h * .85} {w * .05},{h * .9} 0,{h}Z" fill="var(--m-wood)"/>')
        g.append(f'<path d="M{w * .38},{h * .78} C{w * .5},{h * .7} {w * .62},{h * .82} {w * .58},{h} L{w * .36},{h}Z" fill="var(--m-park)"/>')
        P = lambda la, lo: tuple(v for v in project([{'loc': {'lat': la, 'lng': lo}}], center, z, ox, oy)[0][:2])
        mer, saf, rp_ = P(32.985, 35.44), P(32.965, 35.495), P(32.969, 35.542)
        r89 = f'M-20,{mer[1] + 30:.0f} Q{mer[0] - 80:.0f},{mer[1] + 10:.0f} {mer[0]:.0f},{mer[1]:.0f} T{saf[0]:.0f},{saf[1]:.0f} T{rp_[0]:.0f},{rp_[1]:.0f} L{w + 20},{rp_[1] - 40:.0f}'
        sec = [f'M{saf[0]:.0f},{saf[1]:.0f} Q{saf[0] + 40:.0f},{saf[1] - 160:.0f} {saf[0] + 10:.0f},-20',
               f'M{saf[0]:.0f},{saf[1]:.0f} Q{saf[0] - 30:.0f},{saf[1] + 200:.0f} {saf[0] + 90:.0f},{h + 20}',
               f'M{mer[0]:.0f},{mer[1]:.0f} Q{mer[0] - 30:.0f},{mer[1] - 200:.0f} {mer[0] - 120:.0f},-20',
               f'M{mer[0]:.0f},{mer[1]:.0f} Q{mer[0] + 60:.0f},{mer[1] + 200:.0f} {mer[0] - 40:.0f},{h + 20}']
        g.append(f'<path d="{r89}" fill="none" stroke="var(--m-motorway-casing)" stroke-width="10" stroke-linecap="round"/>')
        for s in sec: g.append(f'<path d="{s}" fill="none" stroke="var(--m-major-casing)" stroke-width="7"/>')
        for s in sec: g.append(f'<path d="{s}" fill="none" stroke="var(--m-major)" stroke-width="4.5"/>')
        g.append(f'<path id="r89" d="{r89}" fill="none" stroke="var(--m-motorway)" stroke-width="7" stroke-linecap="round"/>')
        for nm, la, lo in (('צפת', 32.9646, 35.496), ('מירון', 32.985, 35.44), ('ראש פינה', 32.969, 35.542), ('ספסופה', 33.003, 35.448), ('בירייה', 32.982, 35.505)):
            x, y = P(la, lo)
            g.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{30 if nm == "צפת" else 16}" fill="var(--m-resid)" stroke="var(--m-building)" stroke-width="6"/>')
            g.append(f'<text class="mpl big" x="{x + (70 if nm == "צפת" else 0):.0f}" y="{y - (40 if nm == "צפת" else 24):.0f}">{nm}</text>')
    # markers
    over = []
    groups = cluster(pts, cl_r)
    for gr in groups:
        if len(gr['m']) > 1 and not any(m[2]['u'] == sel_u for m in gr['m']):
            cw, ch, s = cluster_svg(d['cluster'], [m[2] for m in gr['m']])
            over.append(f'<div class="mk cl" style="left:{gr["x"] - cw / 2:.0f}px;top:{gr["y"] - ch / 2:.0f}px">{s}</div>')
        else:
            for x, y, p in gr['m']:
                sel = p['u'] == sel_u
                mw, mh, s = marker_svg(d['marker'], p['hc'], p['st']['s'], approx=p.get('prec') == 'street', sel=sel, label=p['n'] if sel else None)
                anchor_y = mh - 2 if d['marker'] == 'tag' else mh / 2
                over.append(f'<div class="mk{" sel" if sel else ""}" style="left:{x - mw / 2:.0f}px;top:{y - anchor_y:.0f}px">{s}</div>')
    svg = f'<svg class="mapsvg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" aria-hidden="true">{"".join(g)}</svg>'
    return svg + ''.join(over) + '<div class="attr">הדמיה · © OpenStreetMap</div>'

# ---------------------------------------------------------------- list items and card, per direction
def joinS(p): return ', '.join(x for x in (p['s'], p['c']) if x)

def item(d, p):
    st = p['st']; hc = p['hc']; t = '/'.join(p['t'])
    k = d['marker']
    if k == 'tile':
        return (f'<button class="item"><span class="kt b-{hc}">{HL[hc]}</span><span class="bd">'
                f'<span class="nm">{E(p["n"])}</span><span class="l2">{E(joinS(p))}{" · " + t if t else ""}</span>'
                f'<span class="l3"><span class="kh k-{hc}">{E(p["h"])}</span>'
                f'<span class="stl st-{st["s"]}"><i></i>{E(st["t"])}</span></span></span></button>')
    if k == 'tag':
        return (f'<button class="item st-bar-{st["s"]}"><span class="bd">'
                f'<span class="r1"><span class="nm">{E(p["n"])}</span><span class="stx st-{st["s"]}">{E(st["t"])}</span></span>'
                f'<span class="l2">{E(joinS(p))}{" · " + t if t else ""}</span>'
                f'<span class="ktag k-{hc}"><b class="b-{hc}">{HL[hc]}</b>{E(p["h"])}</span></span></button>')
    return (f'<button class="item"><span class="seal b-{hc}">{HL[hc]}</span><span class="bd">'
            f'<span class="nm">{E(p["n"])}</span><span class="l2">{E(joinS(p))}{" · " + t if t else ""}</span>'
            f'<span class="kh k-{hc}">כשרות: {E(p["h"])}</span>'
            f'<span class="lab lab-{st["s"]}">{E(st["t"])}</span></span></button>')

def friday_band(d):
    return (f'<div class="band">{icon("candle", 20)}<span>הדלקת נרות בצפת היום: <b class="bt">{D["candles"]}</b> <span class="nw">(מנהג חב״ד)</span></span></div>')

OPEN_NOTE = 'מוצגים מקומות שפתוחים עכשיו לפי שעות הפעילות ברשת. בסוף הרשימה גם מקומות שאין עליהם מידע על שעות הפעילות.'

def sheet_list(d, rows, n_items):
    inc = [r for r in rows if r['inCity']]
    near = [r for r in rows if not r['inCity']]
    body = friday_band(d) + f'<div class="note">{OPEN_NOTE}</div>'
    if d['marker'] == 'tag':
        body += '<div class="sec-h">בצפת</div><div class="grp">' + ''.join(item(d, p) for p in inc[:n_items]) + '</div>'
        if n_items > len(inc): body += '<div class="sec-h">בסביבה</div><div class="grp">' + ''.join(item(d, p) for p in near[:n_items - len(inc)]) + '</div>'
    else:
        body += '<div class="sec-h">בצפת</div>' + ''.join(item(d, p) for p in inc[:n_items])
        if n_items > len(inc): body += '<div class="sec-h">בסביבה</div>' + ''.join(item(d, p) for p in near[:n_items - len(inc)])
    return (f'<div class="shead"><div class="grab"></div><div class="stitle"><h2>צפת והסביבה</h2><span>{D["count"]} מקומות</span></div></div>'
            f'<div class="sbody">{body}</div>')

def hours_rows(p):
    out = ''
    for i, n in enumerate(DAYS):
        v = p['week'][(i + 6) % 7].split(': ', 1)[1]
        cls = ' class="t"' if i == TODAY else ''
        vv = ', '.join(f'<bdi>{E(x)}</bdi>' for x in v.split(', ')) if any(c.isdigit() for c in v) else E(v)
        out += f'<span{cls}>{n}</span><span{cls}>{vv}</span>'
    return out

def card(d, p):
    st = p['st']; hc = p['hc']; t = '/'.join(p['t'])
    acts = (f'<div class="acts"><a class="pri">{icon("nav")}<span>ניווט</span></a><a>{icon("map")}<span>גוגל מפות</span></a>'
            f'<a>{icon("share")}<span>שיתוף</span></a><a>{icon("tel")}<span>חיוג <small>{E(p["phone"])}</small></span></a></div>')
    kbox = (f'<div class="kbox"><span class="ks b-{hc}">{HL[hc]}</span><div><div class="kt2">כשרות</div>'
            f'<div class="kn">{E(p["h"])}</div><div class="ksrc">לפי מאגר מסעדות לאנ״ש חב״ד, ניסן ה׳תשפ״ה</div></div></div>')
    hours = (f'<div class="dl"><h4>שעות פתיחה</h4><div class="hrs">{hours_rows(p)}</div>'
             f'<div class="src">לפי Google Maps, נבדק בנובמבר 2026. כדאי לוודא לפני שיוצאים.</div>'
             f'<div class="src">הדלקת נרות בצפת ביום שישי: {D["candles"]} (מנהג חב״ד)</div></div>')
    slot = '<div class="report-slot" aria-hidden="true"></div>'  # reserved, deferred by decision (CONTEXT rule 9)
    warn = '<p class="warn">יש לבדוק את תעודת הכשרות במקום העסק.</p>'
    head = (f'<button class="back">{icon("back", 18)}חזרה לרשימה</button>'
            f'<div class="hd"><h3>{E(p["n"])}</h3><button class="fav" aria-label="שמירה ברשימה שלי">{icon("star", 22)}</button></div>'
            f'<div class="addr">{E(joinS(p))}</div>')
    meta = f'<span class="meta">{E(p["f"])}{", " + t if t else ""}</span>'
    if d['marker'] == 'tile':
        body = head + f'<div class="row"><span class="stl big st-{st["s"]}"><i></i>{E(st["t"])}</span>{meta}</div>' + acts + kbox + hours
    elif d['marker'] == 'tag':
        body = head + f'<div class="row"><span class="stx big st-{st["s"]}">{E(st["t"])}</span>{meta}</div>' + kbox + acts + hours
    else:
        body = (f'<button class="back">{icon("back", 18)}חזרה לרשימה</button><div class="lab big lab-{st["s"]}">{E(st["t"])}</div>'
                f'<div class="hd"><h3>{E(p["n"])}</h3><button class="fav" aria-label="שמירה ברשימה שלי">{icon("star", 22)}</button></div>'
                f'<div class="addr">{E(joinS(p))}</div><div class="row">{meta}</div>' + acts + kbox + hours)
    return f'<div class="sbody"><div class="det">{body}{slot}{warn}</div></div>'

CHIPS = [('on', f'<span class="d"></span>פתוח עכשיו · {D["nOpen"]}'), ('', 'פתוח בשישי'), ('', icon('clock', 15, 2.2) + 'מתי?'),
         ('', 'בשרי'), ('', 'חלבי'), ('', 'פרווה'), ('', 'פיצה'), ('', 'מאפיות')]

def topbar():
    chips = ''.join(f'<span class="chip {c}">{t}</span>' for c, t in CHIPS)
    return (f'<div class="topbar"><div class="sbar"><h1 class="brandmark">כשר לאנ״ש</h1><span class="sep"></span>'
            f'<span class="q">{icon("search", 18)}חיפוש מקום, אוכל או רחוב</span>'
            f'<span class="ibtn">{icon("filter")}</span></div><div class="chips">{chips}</div></div>')

STATUSBAR = '<div class="osbar"><span>12:30</span><span>יום שישי</span></div>'

def phone(d, theme, which):
    rows = D['rows']
    sel = next(p for p in D['all'] if p['n'] == 'בוסלה')
    if which == 'home':
        mp = map_svg(d, 390, 844, (32.9668, 35.4950), 16.0, 200, 290, rows, 'town', cl_r=30)
        sheet = f'<section class="sheet half">{sheet_list(d, rows, 4)}</section>'
        fab = f'<span class="fab">{icon("locate", 22)}</span>'
    else:
        mp = map_svg(d, 390, 844, (sel['loc']['lat'], sel['loc']['lng']), 16.0, 195, 115, rows, 'town', sel_u=sel['u'], cl_r=30)
        sheet = f'<section class="sheet card">{card(d, sel)}</section>'
        fab = ''
    return (f'<div class="f phone" data-theme="{theme}" id="{d["key"]}-{which}-{theme}">{mp}{STATUSBAR}'
            f'{topbar() if which == "home" else ""}{fab}{sheet}</div>')

def desktop(d, theme):
    rows = D['rows']
    mp = map_svg(d, 1280, 800, (32.9725, 35.4735), 13.0, 424, 400, rows, 'region', cl_r=40)
    me = ''
    panel = f'<section class="sheet side">{sheet_list(d, rows, 9)}</section>'
    return (f'<div class="f desk" data-theme="{theme}" id="{d["key"]}-desktop-{theme}">{mp}{me}{topbar()}'
            f'<span class="fab">{icon("locate", 22)}</span>{panel}</div>')

# ---------------------------------------------------------------- CSS
def vars_css(d):
    out = ''
    for theme in ('light', 'dark'):
        vs = {**d['c'][theme], **{'m-' + k: v for k, v in d['map'][theme].items()}, **d['shadow'][theme]}
        out += f'.f[data-theme={theme}]{{' + ';'.join(f'--{k}:{v}' for k, v in vs.items()) + ';color-scheme:' + theme + '}\n'
    t = d['type']; r = d['radius']; f = d['fonts']
    out += (':root{' + ';'.join(f'--fs-{k}:{v}' for k, v in t.items()) + ';' + ';'.join(f'--r-{k}:{v}' for k, v in r.items()) + ';'
            + ';'.join(f'--{k}:{v}' for k, v in COMMON_SCALE['space'].items())
            + f';--font-display:{f["display"][2]};--font-body:{f["body"][2]}}}\n')
    return out

BASE_CSS = r'''
*{box-sizing:border-box}
body{margin:0;background:#8d8f93;font-family:system-ui,sans-serif;direction:rtl;color:#111}
.gal{display:flex;flex-wrap:wrap;gap:32px;padding:32px;align-items:flex-start}
.gal figure{margin:0}.gal figcaption{font:600 14px/1.4 system-ui,sans-serif;color:#fff;margin-top:8px;max-width:390px}
.f{position:relative;overflow:hidden;background:var(--bg);color:var(--ink);font-family:var(--font-body);font-size:var(--fs-base);-webkit-font-smoothing:antialiased}
.f.phone{width:390px;height:844px;border-radius:0}
.f.desk{width:1280px;height:800px}
.f button{font:inherit;color:inherit}
.mapsvg{position:absolute;inset:0}
.mrl{font:600 12px var(--font-body);fill:var(--m-road-label);paint-order:stroke;stroke:var(--m-label-halo);stroke-width:3px}
.mpl{font:700 13px var(--font-body);fill:var(--m-label);paint-order:stroke;stroke:var(--m-label-halo);stroke-width:3.5px;text-anchor:middle}
.mpl.big{font-size:15px}
.mk{position:absolute;z-index:3;display:flex;align-items:center;gap:6px}
.mk.sel{z-index:6}
.mksvg{display:block;overflow:visible;filter:drop-shadow(0 1px 2px rgba(0,0,0,.35))}
.mkt{font-family:var(--font-display);font-weight:800}
.clt{font:800 15px var(--font-body)}
.mkl{background:var(--surface);color:var(--ink);font:700 var(--fs-sm) var(--font-body);padding:3px 8px;border-radius:var(--r-xs);box-shadow:var(--sh1);white-space:nowrap}
.attr{position:absolute;left:0;bottom:0;z-index:2;direction:ltr;font-size:11px;background:color-mix(in srgb,var(--surface) 80%,transparent);color:var(--sub);padding:1px 6px;border-radius:0 6px 0 0}
.phone .attr{bottom:auto;top:430px}
.osbar{position:absolute;top:0;left:0;right:0;height:30px;z-index:40;display:flex;justify-content:space-between;align-items:center;padding:0 22px;font:700 13px var(--font-body);color:var(--ink);background:color-mix(in srgb,var(--bg) 70%,transparent)}
.topbar{position:absolute;top:38px;right:12px;left:12px;z-index:30;display:flex;flex-direction:column;gap:8px}
.desk .topbar{right:16px;left:auto;width:400px;top:16px}
.sbar{display:flex;align-items:center;gap:4px;height:52px;background:var(--surface);border-radius:var(--r-md);box-shadow:var(--sh1);padding:0 6px 0 8px}
.brandmark{margin:0;font-family:var(--font-display);font-weight:800;font-size:17px;color:var(--brand-ink);padding:0 8px 0 4px;white-space:nowrap}
.sep{width:1px;height:24px;background:var(--line)}
.q{flex:1;display:flex;align-items:center;gap:6px;color:var(--mut);font-size:var(--fs-input,16px);padding:0 8px;white-space:nowrap;overflow:hidden}
.ibtn{width:44px;height:44px;display:grid;place-items:center;color:var(--sub)}
.chips{display:flex;gap:6px;overflow:hidden;margin:0 -12px;padding:2px 12px 4px}
.desk .chips{margin:0;padding-inline:0;flex-wrap:wrap}
.chip{flex:0 0 auto;height:40px;padding:0 14px;border-radius:var(--r-pill);background:var(--surface);box-shadow:var(--sh1);font-size:var(--fs-md);font-weight:600;display:flex;align-items:center;gap:6px;white-space:nowrap;color:var(--ink)}
.chip .d{width:8px;height:8px;border-radius:50%;background:var(--open)}
.fab{position:absolute;z-index:20;left:12px;top:378px;width:44px;height:44px;border-radius:var(--r-md);background:var(--surface);box-shadow:var(--sh1);display:grid;place-items:center;color:var(--brand-ink)}
.desk .fab{left:16px;top:auto;bottom:16px}
.sheet{position:absolute;left:0;right:0;bottom:0;z-index:25;background:var(--surface);border-radius:var(--r-lg) var(--r-lg) 0 0;box-shadow:var(--sh2);display:flex;flex-direction:column;overflow:hidden}
.sheet.half{top:440px}.sheet.card{top:206px}
.sheet.side{right:16px;left:auto;width:400px;top:176px;bottom:16px;border-radius:var(--r-lg);box-shadow:var(--sh1)}
.shead{padding:8px 16px 8px}
.grab{width:36px;height:5px;border-radius:3px;background:var(--line);margin:0 auto 10px}
.side .grab{display:none}
.stitle{display:flex;align-items:baseline;justify-content:space-between;gap:10px}
.stitle h2{margin:0;font-family:var(--font-display);font-size:var(--fs-lg);font-weight:700}
.stitle span{font-size:var(--fs-md);color:var(--sub)}
.sbody{flex:1;overflow:hidden}
.band{display:flex;align-items:center;gap:10px;margin:4px 16px 8px;padding:10px 14px;border-radius:var(--r-md);background:var(--band);color:var(--band-ink);font-size:var(--fs-md);font-weight:600}
.band .bt{font-family:var(--font-display);font-size:var(--fs-lg);font-weight:800}
.nw{white-space:nowrap}
.mk.sel{flex-direction:column;gap:3px}
.note{margin:0 16px 4px;font-size:var(--fs-sm);color:var(--sub);line-height:1.45}
.sec-h{font-size:var(--fs-sm);font-weight:700;color:var(--sub);padding:12px 16px 4px}
.item{display:flex;gap:12px;align-items:flex-start;width:100%;text-align:right;border:0;background:transparent;padding:12px 16px}
.bd{flex:1;min-width:0;display:flex;flex-direction:column}
.nm{font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.l2{font-size:var(--fs-md);color:var(--sub);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.kh{font-size:var(--fs-md);font-weight:600}
.k-chabad{color:var(--k-chabad-ink)}.k-eda{color:var(--k-eda-ink)}.k-landa{color:var(--k-landa-ink)}.k-products{color:var(--k-products-ink)}
.b-chabad{background:var(--k-chabad);color:var(--k-chabad-on)}.b-eda{background:var(--k-eda);color:var(--k-eda-on)}
.b-landa{background:var(--k-landa);color:var(--k-landa-on)}.b-products{background:var(--surface);color:var(--k-products);box-shadow:inset 0 0 0 2px var(--k-products)}
.st-y{color:var(--open)}.st-s{color:var(--soon)}.st-u{color:var(--noinfo)}.st-n{color:var(--closed)}
.det{padding:4px 16px 16px}
.back{display:flex;align-items:center;gap:4px;border:0;background:transparent;color:var(--sub);font-weight:600;padding:0;height:44px}
.hd{display:flex;align-items:flex-start;gap:8px}.hd h3{flex:1;margin:0;font-family:var(--font-display);font-size:var(--fs-xxl);font-weight:800;line-height:1.2}
.fav{width:44px;height:44px;border:0;background:transparent;display:grid;place-items:center;color:var(--sub)}
.addr{color:var(--sub);font-size:var(--fs-base);margin-top:2px}
.row{display:flex;gap:14px;flex-wrap:wrap;margin-top:8px;align-items:center;font-size:var(--fs-md)}
.meta{color:var(--sub)}
.acts{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:14px 0}
.acts a{height:60px;border-radius:var(--r-md);border:1px solid var(--line);background:var(--surface);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;color:var(--brand-ink);font-size:var(--fs-sm);font-weight:700;text-align:center}
.acts a.pri{background:var(--brand);border-color:var(--brand);color:var(--brand-on)}
.acts small{display:block;font-size:11px;direction:ltr;font-weight:600}
.kbox{display:flex;gap:12px;align-items:center;padding:12px;border-radius:var(--r-md);background:var(--surface2)}
.ks{flex:0 0 44px;height:44px;display:grid;place-items:center;font:800 20px var(--font-display);border-radius:var(--r-marker)}
.kt2{font-size:var(--fs-sm);color:var(--sub)}.kn{font-size:var(--fs-base);font-weight:700}.ksrc{font-size:var(--fs-sm);color:var(--sub)}
.dl{margin-top:14px}.dl h4{margin:0 0 6px;font-size:var(--fs-sm);color:var(--sub)}
.hrs{display:grid;grid-template-columns:auto 1fr;gap:3px 16px;font-size:var(--fs-md)}
.hrs .t{font-weight:700}
.hrs bdi{unicode-bidi:isolate;direction:ltr}
.src{font-size:var(--fs-sm);color:var(--mut);margin-top:6px}
.warn{font-size:var(--fs-sm);color:var(--mut);margin:14px 0 0}
.report-slot{height:0} /* reserved for the deferred "report a mistake" button – nothing shown */
'''

DIR_CSS = {
 'neirot': r'''
.kt{flex:0 0 40px;height:40px;border-radius:var(--r-marker);display:grid;place-items:center;font:800 19px var(--font-display);margin-top:2px}
.kt.b-products{box-shadow:inset 0 0 0 2px var(--k-products)}
.item{padding:12px 16px;position:relative}
.item+.item::before{content:"";position:absolute;top:0;right:68px;left:16px;height:1px;background:var(--line)}
.nm{font-family:var(--font-display);font-size:18px;font-weight:700}
.l3{display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin-top:2px}.l3 .kh{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.stl{white-space:nowrap;display:inline-flex;align-items:center;gap:6px;font-weight:700;font-size:var(--fs-md);margin-top:3px}
.stl i{width:8px;height:8px;border-radius:50%;background:currentColor}
.stl.st-s i{background:transparent;box-shadow:inset 0 0 0 2px currentColor}
.stl.st-u i{background:transparent;box-shadow:inset 0 0 0 1.5px currentColor}
.stl.big{font-size:var(--fs-base)}
.chip.on{background:var(--brand);color:var(--brand-on)}
.chip.on .d{background:var(--band-ink)}
.band{border-radius:var(--r-md)}
.band svg{color:var(--band-ink)}
.kbox{background:var(--brand-soft)}
.kbox .ks{flex-basis:52px;height:52px;font-size:24px}
.hrs span.t{background:var(--brand-soft);color:var(--brand-ink);margin:0 -6px;padding:0 6px;border-radius:6px}
.sheet{border-top:3px solid var(--brand)}
.side.sheet{border-top-width:3px}
''',
 'tekhelet': r'''
.f{font-size:var(--fs-base)}
.sheet{background:var(--bg)}
.shead{background:var(--bg)}
.grp{margin:0 12px 6px;background:var(--surface);border-radius:var(--r-md);overflow:hidden;box-shadow:0 0 0 1px var(--line)}
.grp .item+.item{border-top:1px solid var(--line)}
.item{padding:11px 14px 11px 12px;position:relative}
.item::after{content:"";position:absolute;right:0;top:10px;bottom:10px;width:4px;border-radius:0 0 0 0;background:var(--noinfo);opacity:.35}
.st-bar-y::after{background:var(--open);opacity:1}.st-bar-s::after{background:var(--soon);opacity:1}
.r1{display:flex;gap:8px;align-items:baseline}
.r1 .nm{flex:1;font-family:var(--font-display);font-weight:400;font-size:17.5px}
.stx{font-weight:700;font-size:var(--fs-md);white-space:nowrap}
.stx.big{font-size:var(--fs-base)}
.ktag{display:inline-flex;align-self:flex-start;align-items:center;gap:6px;margin-top:5px;font-size:var(--fs-md);font-weight:700;padding:2px 10px 2px 3px;border-radius:var(--r-pill);background:var(--surface2);box-shadow:inset 0 0 0 1px var(--line)}
.ktag b{width:22px;height:22px;border-radius:7px;display:grid;place-items:center;font:400 14px var(--font-display)}
.ktag b.b-products{box-shadow:inset 0 0 0 1.5px var(--k-products)}
.chip{box-shadow:var(--sh1)}
.chip.on{background:var(--brand);color:var(--brand-on)}
.chip.on .d{background:var(--brand-on)}
.band{background:var(--band);color:var(--band-ink);border-radius:var(--r-md);box-shadow:inset 3px 0 0 var(--brand)}
.brandmark{font-weight:400}
.stitle h2,.hd h3{font-weight:400}
.det{background:var(--surface);margin:0 0 0;min-height:100%}
.sheet.card{background:var(--surface)}
.acts a{border-radius:50px/40px;height:64px;background:var(--surface2);border:0}
.acts a.pri{border-radius:50px/40px}
.kbox{margin-top:12px;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line)}
.kbox .ks{border-radius:var(--r-marker)}
.hrs span.t{color:var(--brand-ink)}
.mkt{font-weight:400}
''',
 'shelet': r'''
.f{font-size:var(--fs-base)}
.chip{height:44px;padding:0 16px;font-size:var(--fs-md);font-weight:600;box-shadow:var(--sh1)}
.chip.on{background:var(--signal);color:var(--signal-on);box-shadow:0 0 0 2px var(--ink)}
.chip.on .d{background:var(--open)}
.sbar{height:54px;box-shadow:var(--sh1)}
.brandmark{font-weight:800}
.item{padding:14px 16px;border-top:1px solid var(--line);gap:14px}
.seal{flex:0 0 46px;height:46px;border-radius:50%;display:grid;place-items:center;font:800 21px var(--font-display);position:relative;margin-top:2px}
.seal::after{content:"";position:absolute;inset:4px;border-radius:50%;box-shadow:0 0 0 1px currentColor;opacity:.5}
.nm{font-size:var(--fs-lg);font-weight:700}
.l2{font-size:var(--fs-md)}
.kh{margin-top:2px}
.lab{display:inline-flex;align-self:flex-start;align-items:center;height:28px;padding:0 10px;border-radius:var(--r-xs);font-weight:700;font-size:var(--fs-md);margin-top:6px}
.lab-y{background:var(--open-bg);color:var(--open-on)}.lab-s{background:var(--soon-bg);color:var(--soon-on)}.lab-u{background:var(--noinfo-bg);color:var(--noinfo-on)}
.lab.big{height:40px;font-size:var(--fs-lg);padding:0 14px;margin:2px 0 8px}
.t{font-size:var(--fs-md);color:var(--sub);margin-top:4px}
.band{background:var(--band);color:var(--band-ink);font-size:var(--fs-base);border-radius:var(--r-sm);box-shadow:inset 0 0 0 2px var(--signal)}
.stitle h2{font-size:var(--fs-xl);font-weight:800}
.hd h3{font-size:var(--fs-xxl)}
.acts{grid-template-columns:repeat(2,1fr);gap:10px}
.acts a{height:56px;flex-direction:row;gap:8px;font-size:var(--fs-base);border:2px solid var(--line);color:var(--ink)}
.acts a span{display:flex;flex-direction:column;align-items:flex-start;line-height:1.1}
.acts a.pri{background:var(--brand);color:var(--brand-on);border-color:var(--brand)}
.kbox{background:var(--surface);border:2px solid var(--line)}
.kbox .ks{flex-basis:56px;height:56px;border-radius:50%;font-size:26px;position:relative}
.kbox .ks::after{content:"";position:absolute;inset:5px;border-radius:50%;box-shadow:0 0 0 1px currentColor;opacity:.5}
.hrs{font-size:var(--fs-base);gap:4px 18px}
.hrs span.t{background:var(--signal);color:var(--signal-on);padding:0 6px;margin:0 -6px;border-radius:4px}
.sheet.half{top:452px}
''',
}

# ---------------------------------------------------------------- contrast tables
def contrast_rows(d):
    rows = []
    for theme in ('light', 'dark'):
        c = d['c'][theme]; m = d['map'][theme]
        pairs = [('ink', 'surface', 4.5), ('ink', 'bg', 4.5), ('sub', 'surface', 4.5), ('sub', 'bg', 4.5), ('mut', 'surface', 4.5),
                 ('mut', 'bg', 4.5), ('mut', 'surface2', 4.5), ('brand-ink', 'surface', 4.5), ('brand-ink', 'brand-soft', 4.5),
                 ('brand-on', 'brand', 4.5), ('band-ink', 'band', 4.5),
                 ('open', 'surface', 4.5), ('soon', 'surface', 4.5), ('closed', 'surface', 4.5), ('noinfo', 'surface', 4.5)]
        if d['marker'] == 'tag':
            pairs += [('open', 'bg', 4.5), ('soon', 'bg', 4.5), ('noinfo', 'bg', 4.5), ('sub', 'surface2', 4.5)]
        if 'open-bg' in c:
            pairs += [('open-on', 'open-bg', 4.5), ('soon-on', 'soon-bg', 4.5), ('noinfo-on', 'noinfo-bg', 4.5), ('signal-on', 'signal', 4.5)]
        for k in ('chabad', 'eda', 'landa', 'products'):
            pairs.append((f'k-{k}-ink', 'surface', 4.5))
            if k != 'products': pairs.append((f'k-{k}-on', f'k-{k}', 4.5))
        for a, b, need in pairs:
            rows.append((theme, a, b, c[a], c[b], cr(c[a], c[b]), need))
        # UI / map pairs (3:1)
        ui = [('marker edge (outline of every marker)', c['mk-edge'], 'm-land', m['land']), ('marker edge', c['mk-edge'], 'm-park', m['park']),
              ('marker k-products (border)', c['k-products'], 'surface', c['surface']),
              ('me dot', c['me'], 'm-land', m['land']), ('cluster brand', c['brand'], 'm-land', m['land']) if d['cluster'] != 'ring' else (('cluster core', c['signal-on'], 'm-land', m['land']) if theme == 'light' else ('cluster outer ring', c['ring'], 'm-land', m['land'])),
              ('status open (marker badge)', c['open'], 'badge-edge', c['badge-edge']), ('status soon (marker badge)', c['soon'], 'badge-edge', c['badge-edge']),
              ('map label', m['label'], 'm-land', m['land']), ('road label', m['road-label'], 'm-road', m['road']), ('line', c['line'], 'surface', c['surface'])]
        for a, ca, b, cb in ui:
            need = 3.0 if a != 'line' else 0
            rows.append((theme, a, b, ca, cb, cr(ca, cb), need))
    return rows

def sep_rows(d):
    out = []
    for theme in ('light', 'dark'):
        c = d['c'][theme]
        keys = {'brand': c['brand'], 'me': c['me'], 'chabad': c['k-chabad'], 'eda': c['k-eda'], 'landa': c['k-landa']}
        for kind in ('normal', 'deutan', 'protan', 'tritan'):
            ws = sorted(((de(keys[a], keys[b], kind), a, b) for a, b in itertools.combinations(keys, 2)))
            out.append((theme, kind, ws[:3]))
    return out

# ---------------------------------------------------------------- map-style.json
def map_style(d):
    def rules(m):
        return [
         {'match': {'id': 'background'}, 'paint': {'background-color': m['land']}},
         {'match': {'source-layer': 'landuse', 'class': ['residential', 'suburb', 'neighbourhood']}, 'paint': {'fill-color': m['resid'], 'fill-opacity': 1}},
         {'match': {'source-layer': 'landuse', 'class': ['commercial', 'industrial', 'retail', 'hospital', 'school', 'cemetery', 'stadium', 'railway']}, 'paint': {'fill-color': m['resid'], 'fill-opacity': 0.6}},
         {'match': {'source-layer': 'park'}, 'paint': {'fill-color': m['park'], 'fill-outline-color': m['park']}},
         {'match': {'source-layer': 'landcover', 'class': ['wood', 'forest']}, 'paint': {'fill-color': m['wood'], 'fill-opacity': 0.8}},
         {'match': {'source-layer': 'landcover', 'class': ['grass', 'farmland', 'scrub', 'wetland', 'sand', 'rock', 'ice']}, 'paint': {'fill-color': m['park'], 'fill-opacity': 0.35}},
         {'match': {'source-layer': 'water', 'type': 'fill'}, 'paint': {'fill-color': m['water']}},
         {'match': {'source-layer': 'waterway', 'type': 'line'}, 'paint': {'line-color': m['waterline']}},
         {'match': {'source-layer': 'building', 'type': 'fill'}, 'paint': {'fill-color': m['building'], 'fill-outline-color': m['building']}, 'minzoom': 15},
         {'match': {'source-layer': 'transportation', 'class': ['minor', 'service', 'track'], 'casing': True}, 'paint': {'line-color': m['casing']}},
         {'match': {'source-layer': 'transportation', 'class': ['minor', 'service', 'track'], 'casing': False}, 'paint': {'line-color': m['road']}},
         {'match': {'source-layer': 'transportation', 'class': ['primary', 'secondary', 'tertiary'], 'casing': True}, 'paint': {'line-color': m['major-casing']}},
         {'match': {'source-layer': 'transportation', 'class': ['primary', 'secondary', 'tertiary'], 'casing': False}, 'paint': {'line-color': m['major']}},
         {'match': {'source-layer': 'transportation', 'class': ['motorway', 'trunk'], 'casing': True}, 'paint': {'line-color': m['motorway-casing']}},
         {'match': {'source-layer': 'transportation', 'class': ['motorway', 'trunk'], 'casing': False}, 'paint': {'line-color': m['motorway']}},
         {'match': {'source-layer': 'transportation', 'class': ['path', 'pedestrian']}, 'paint': {'line-color': m['casing'], 'line-opacity': 0.7}},
         {'match': {'source-layer': 'transportation', 'class': ['rail', 'transit']}, 'paint': {'line-color': m['rail']}},
         {'match': {'source-layer': 'boundary'}, 'paint': {'line-color': m['boundary']}},
         {'match': {'source-layer': 'place', 'type': 'symbol'}, 'paint': {'text-color': m['label'], 'text-halo-color': m['label-halo'], 'text-halo-width': 1.6}},
         {'match': {'source-layer': 'transportation_name', 'type': 'symbol'}, 'paint': {'text-color': m['road-label'], 'text-halo-color': m['label-halo'], 'text-halo-width': 1.4}},
         {'match': {'source-layer': ['water_name'], 'type': 'symbol'}, 'paint': {'text-color': m['water-label'], 'text-halo-color': m['label-halo'], 'text-halo-width': 1.2}},
        ]
    return {
     '$comment': [
      f'S1-2 proposal – direction "{d["title_en"]}". Paint overrides for the OpenFreeMap liberty style (https://tiles.openfreemap.org/styles/liberty), OpenMapTiles schema.',
      'Layers are matched by source-layer (+ geometry type, + the class values in the layer filter, + casing = layer id contains "casing"), not by hard-coded liberty ids, so the override survives liberty id renames. "id" is used only for "background".',
      'A small build step (to be written after the owner chooses) fetches liberty once, applies these rules, keeps name:he labels (as today), and writes public/map-style/<theme>.json into the repo; the app loads it from the site.',
      'Glyphs stay the liberty font stack (Hebrew already renders with the rtl-text plugin). Custom fonts on the map would need self-hosted glyph PBFs – not proposed.',
     ],
     'base': 'https://tiles.openfreemap.org/styles/liberty',
     'remove_layers': [
      {'source-layer': 'poi', '$why': 'all POI icons/labels: shops, banks, other restaurants – only our markers should speak'},
      {'source-layer': 'housenumber'}, {'source-layer': 'aerodrome_label'}, {'source-layer': 'mountain_peak'},
      {'source-layer': 'transportation_name', 'class': ['minor', 'service', 'track', 'path'], 'maxzoom': 15, '$why': 'minor street names only from z15'},
      {'type': 'fill-extrusion', '$why': '3D buildings off'},
      {'source-layer': 'landcover', 'type': 'fill-pattern', '$why': 'no texture patterns'},
     ],
     'keep_labels': ['place: city, town, village, suburb, neighbourhood, quarter', 'transportation_name: motorway–tertiary (all zooms), minor from z15', 'water_name'],
     'light': rules(d['map']['light']),
     'dark': rules(d['map']['dark']),
    }

# ---------------------------------------------------------------- markers.svg (sheet)
def markers_sheet(d):
    def block(theme, y0):
        c = d['c'][theme]; m = d['map'][theme]
        css = ';'.join(f'--{k}:{v}' for k, v in c.items())
        items = []; x = 20
        title = 'בהיר' if theme == 'light' else 'כהה'
        items.append(f'<text x="960" y="{y0 + 26}" class="h" text-anchor="end" fill="{c["ink"]}">{title}</text>')
        specs = [('chabad', 'y', False, 'ח · פתוח'), ('eda', 's', False, 'ע · נסגר בקרוב'), ('landa', 'u', False, 'ל · אין מידע'),
                 ('products', 'u', False, 'מ · מוצרים (חלול)'), ('chabad', 'u', True, 'מיקום משוער'), ('eda', 'y', False, 'נבחר')]
        for i, (hc, s, ap, lab) in enumerate(specs):
            w, h, svg = marker_svg(d['marker'], hc, s, approx=ap, sel=lab == 'נבחר')
            inner = svg.split('>', 1)[1].rsplit('</svg>', 1)[0]
            cx = 70 + i * 120
            items.append(f'<g transform="translate({cx - w / 2},{y0 + 60 - h / 2})">{inner}</g>')
            items.append(f'<text x="{cx}" y="{y0 + 118}" text-anchor="middle" class="l" fill="{c["sub"]}">{lab}</text>')
        mem = [{'hc': 'chabad'}] * 5 + [{'hc': 'eda'}] * 3 + [{'hc': 'landa'}] * 2
        w, h, svg = cluster_svg(d['cluster'], mem)
        inner = svg.split('>', 1)[1].rsplit('</svg>', 1)[0]
        items.append(f'<g transform="translate({790 - w / 2},{y0 + 60 - h / 2})">{inner}</g>')
        items.append(f'<text x="790" y="{y0 + 118}" text-anchor="middle" class="l" fill="{c["sub"]}">אשכול (10)</text>')
        items.append(f'<g transform="translate({890 - 22},{y0 + 38})"><circle cx="22" cy="22" r="18" fill="{c["me"]}" fill-opacity=".18"/><circle cx="22" cy="22" r="8" fill="{c["me"]}" stroke="{c["ring"]}" stroke-width="3"/></g>')
        items.append(f'<text x="890" y="{y0 + 118}" text-anchor="middle" class="l" fill="{c["sub"]}">המיקום שלי</text>')
        return f'<g style="{css}"><rect x="0" y="{y0}" width="980" height="140" fill="{m["land"]}"/>{"".join(items)}</g>'
    f = d['fonts']['display'][2].replace('"', "'")
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="980" height="280" viewBox="0 0 980 280" direction="rtl">'
            f'<style>.mkt{{font-family:{f};font-weight:800}}.clt{{font:800 15px {d["fonts"]["body"][2].replace(chr(34), chr(39))}}}'
            f'.l{{font:600 12px sans-serif}}.h{{font:700 14px sans-serif}}</style>{block("light", 0)}{block("dark", 140)}</svg>')

# ---------------------------------------------------------------- README per direction
def readme(d, key):
    L = []
    L.append(f'# כיוון: {d["title"]} ({d["title_en"]})\n')
    L.append('הצעה בלבד (S1-2). שום דבר לא מומש ב-`src/template.html`; הבעלים בוחר קודם.\n')
    L.append('## הרעיון\n')
    L += [f'- {x}' for x in d['concept']]
    L.append('\n## קבצים\n')
    L.append('- `mock.html` – הדמיה סטטית עצמאית: נייד 390×844 (בית, כרטיס מקום; בהיר וכהה) ומחשב 1280×800 (בהיר וכהה).')
    L.append('- `phone-light.png`, `phone-dark.png`, `card.png`, `desktop.png` (+ `card-dark.png`, `desktop-dark.png`).')
    L.append('- `map-style.json` – דריסות צבע לשכבות liberty (בהיר וכהה), והסרת רעש (POI, מספרי בתים, תלת-ממד).')
    L.append('- `markers.svg` – סמנים לכל כשרות ומצב, אשכול, ונקודת "המיקום שלי", על רקע המפה בבהיר ובכהה.\n')
    L.append('**הנתונים בהדמיה אמיתיים:** מקומות מצפת והסביבה מתוך `data/places.json`, הכשרות מילה במילה, והסטטוס חושב ב-`statusAt` של `src/logic.js` ליום שישי 27.11.2026 12:30 (שעון ישראל), עם סינון "פתוח עכשיו" כמו באפליקציה. הדלקת נרות בצפת: '
             f'{D["candles"]} (מנהג חב״ד, `candles`). המרחק לא מוצג כי לא נמסר מיקום (תיקון לבאג שבביקורת). המפה היא שרטוט סכמטי בצבעי הסגנון – לא אריחים אמיתיים (אין רשת בסביבת העבודה).\n')
    L.append('## גופנים\n')
    L.append('| תפקיד | גופן | רישיון | משקלים | שימוש |\n|---|---|---|---|---|')
    seen = set()
    for role, (name, lic, stack, use, wts) in d['fonts'].items():
        if (name, role) in seen: continue
        L.append(f'| {"כותרות" if role == "display" else "טקסט"} | {name} | {lic} | {wts or "—"} | {use} |')
    L.append('\nכל הגופנים חינמיים, זמינים ב-Google Fonts וב-`@fontsource/*` ב-npm, ואפשר לארח אותם באתר (`vendor/`) כמו את Assistant היום. '
             '**בצילומי המסך** הגופנים לא היו זמינים (אין רשת) והוצגו גופני מערכת חלופיים (FreeSerif / Liberation / DejaVu) – האופי קרוב, הפרטים לא.\n')
    L.append('## אסימונים\n')
    L.append('### צבע (בהיר / כהה)\n')
    L.append('| אסימון | בהיר | כהה | תפקיד |\n|---|---|---|---|')
    roles = {'bg': 'רקע', 'surface': 'משטח (גיליון, כרטיס)', 'surface2': 'משטח משני', 'line': 'קו מפריד (דקורטיבי)', 'ink': 'טקסט ראשי', 'sub': 'טקסט משני',
             'mut': 'טקסט שקט', 'brand': 'מותג (כפתור ראשי, צ׳יפ נבחר)', 'brand-on': 'טקסט על מותג', 'brand-soft': 'רקע מותג רך', 'brand-ink': 'טקסט מותג על משטח',
             'band': 'פס הדלקת נרות', 'band-ink': 'טקסט בפס', 'signal': 'צהוב שלט (בחירה)', 'signal-on': 'טקסט על צהוב',
             'open': 'פתוח', 'soon': 'נסגר בקרוב', 'closed': 'סגור', 'noinfo': 'אין מידע',
             'open-bg': 'תווית פתוח', 'open-on': 'טקסט תווית פתוח', 'soon-bg': 'תווית נסגר בקרוב', 'soon-on': 'טקסט', 'noinfo-bg': 'תווית אין מידע', 'noinfo-on': 'טקסט',
             'me': 'נקודת המיקום שלי', 'ring': 'טבעת סמן', 'mk-edge': 'קו מתאר חיצוני לכל סמן (ניגודיות מול המפה)', 'badge-edge': 'מסגרת תג הסטטוס בסמן'}
    for k, v in d['c']['light'].items():
        r = roles.get(k)
        if not r and k.startswith('k-'):
            parts = k.split('-'); g = HC[parts[1]]
            r = f'כשרות {g} – ' + ({'on': 'אות על המילוי', 'ink': 'טקסט על משטח'}.get(parts[2], '') if len(parts) > 2 else 'מילוי סמן')
        L.append(f'| `--{k}` | `{v}` | `{d["c"]["dark"][k]}` | {r} |')
    L.append('\nמוצרים (מ) מוצג תמיד כסמן **חלול** (מילוי משטח, מסגרת ואות בצבע) – הבדל צורה ולא רק צבע. מיקום משוער – מסגרת מקווקוות (כמו היום).\n')
    L.append('### צבעי מפה\n')
    L.append('| שכבה | בהיר | כהה |\n|---|---|---|')
    for k, v in d['map']['light'].items():
        L.append(f'| {k} | `{v}` | `{d["map"]["dark"][k]}` |')
    L.append('\n### טיפוגרפיה, רדיוסים, רווחים, צללים\n')
    L.append('| | |\n|---|---|')
    L.append('| סולם (xs…xxl) | ' + ' / '.join(d['type'].values()) + ' (קלטים 16px לפחות – בלי זום ב-iOS) |')
    L.append('| רדיוס | ' + ', '.join(f'{k} {v}' for k, v in d['radius'].items()) + ' |')
    L.append('| רווחים | ' + ', '.join(f'{k} {v}' for k, v in COMMON_SCALE['space'].items()) + ' |')
    for th in ('light', 'dark'):
        L.append(f'| צל ({th}) | sh1 `{d["shadow"][th]["sh1"]}` · sh2 `{d["shadow"][th]["sh2"]}` |')
    L.append('\n## בדיקת ניגודיות\n')
    L.append('חושב לפי WCAG 2.x (יחס בהירות יחסית). טקסט רגיל ≥ 4.5:1; רכיבי ממשק וסמנים מול המפה ≥ 3:1. "קו מפריד" דקורטיבי – בלי דרישה.\n')
    L.append('| מצב | זוג | צבעים | יחס | נדרש | |\n|---|---|---|---|---|---|')
    fails = 0
    for theme, a, b, ca, cb, ratio, need in contrast_rows(d):
        ok = ratio >= need
        fails += (not ok)
        L.append(f'| {theme} | `{a}` על `{b}` | `{ca}` / `{cb}` | {ratio:.2f} | {need if need else "—"} | {"עובר" if ok else "**נכשל**"} |')
    L.append(f'\nסה״כ כשלים: {fails}.\n')
    L.append('### הבחנה בין צבעי הכשרות, המותג ונקודת המיקום (CIEDE2000, כולל הדמיית עיוורון צבעים)\n')
    L.append('שלושת הזוגות הקרובים ביותר בכל מצב (ΔE00; מעל ~10 מובחן היטב, 5–10 מובחן בסמיכות, מתחת ל-5 – רק עם האות). מוצרים לא בטבלה – הסמן שלו חלול (הבדל צורה). ההדמיה לפי Machado 2009 בחומרה מלאה.\n')
    L.append('| מצב | ראייה | הזוגות הקרובים |\n|---|---|---|')
    for theme, kind, ws in sep_rows(d):
        L.append(f'| {theme} | {kind} | ' + ' · '.join(f'{a}/{b} {v:.1f}' for v, a, b in ws) + ' |')
    L.append('\nבכל מקרה הסמן נושא אות (ח/ע/ל/מ) והטקסט המלא של הכשרות מופיע ברשימה ובכרטיס – הצבע אינו הסימן היחיד.\n')
    L.append('## סמנים ואשכולות\n')
    L.append({'tile': 'אריח מעוגל 30px (נבחר 39px) עם אות בגופן הכותרות, טבעת לבנה. סטטוס: נקודה ירוקה מלאה = פתוח, טבעת כתומה = נסגר בקרוב, בלי סימן = אין מידע. אשכול: עיגול יין עם טבעת פליז ומספר.',
              'tag': 'תגית עם חוד קטן שמצביע על המיקום (לא סיכה), 28px. סטטוס: פס קצר בתחתית התגית – ירוק = פתוח, כתום = נסגר בקרוב. אשכול: ריבוע מעוגל בתכלת כהה עם מספר.',
              'seal': 'חותם עגול 32px עם טבעת פנימית דקה (כמו חותמת כשרות). סטטוס: תג עגול בפינה – ירוק עם ✓ = פתוח, כתום עם שעון = נסגר בקרוב. אשכול: עיגול דיו עם מספר צהוב וטבעת מחולקת לפי הכשרויות שבו (MapLibre `clusterProperties`).'}[d['marker']])
    L.append('\nאזור לחיצה 44px לכל סמן (`::before` כמו היום). מומלץ לממש כשכבת GeoJSON עם clustering מובנה (כפי שהומלץ בביקורת) – הסמנים כ-SDF/תמונות שנוצרות מה-SVG.\n')
    L.append('## מאמץ מימוש משוער\n')
    L.append({'neirot': 'בינוני. החלפת אסימונים + גופן כותרות אחד חדש (~40KB woff2 לתת-קבוצה עברית). פס ההדלקה כבר קיים (`.shab`) – רק עיצוב. סמנים: צורה דומה להיום.',
              'tekhelet': 'בינוני. אסימונים + Secular One (~30KB). דורש שינוי markup קטן ברשימה (קיבוץ בבלוקים, תגית כשרות) – בקשה ל-map-ux. סמן תגית עם עוגן תחתון.',
              'shelet': 'בינוני-גבוה. Rubik במקום Assistant (גופן משתנה ~70KB), גדלים גדולים יותר משפיעים על כל המסכים, תוויות סטטוס מלאות וטבעת אשכול מחולקת (clusterProperties) – כמה בקשות ל-map-ux.'}[key])
    return '\n'.join(L) + '\n'

# ---------------------------------------------------------------- main
def build(key):
    d = DIRS[key]; d['key'] = key
    out = os.path.join(ROOT, key); os.makedirs(out, exist_ok=True)
    css = vars_css(d) + BASE_CSS + DIR_CSS[key]
    frames = [
     (phone(d, 'light', 'home'), 'נייד – בית, בהיר'), (phone(d, 'dark', 'home'), 'נייד – בית, כהה'),
     (phone(d, 'light', 'card'), 'נייד – כרטיס מקום, בהיר'), (phone(d, 'dark', 'card'), 'נייד – כרטיס מקום, כהה'),
     (desktop(d, 'light'), 'מחשב – תצוגה מפוצלת, בהיר'), (desktop(d, 'dark'), 'מחשב – תצוגה מפוצלת, כהה'),
    ]
    gal = ''.join(f'<figure>{f}<figcaption>{cap}</figcaption></figure>' for f, cap in frames)
    doc = (f'<!DOCTYPE html><html lang="he" dir="rtl"><head><meta charset="utf-8"><title>כשר לאנ״ש – כיוון {d["title"]}</title>'
           f'<meta name="viewport" content="width=device-width,initial-scale=1">'
           f'<!-- S1-2 design proposal. Self-contained; intended fonts: {d["fonts"]["display"][0]} + {d["fonts"]["body"][0]} (fall back to system fonts offline). '
           f'Data: real places from data/places.json, status via src/logic.js statusAt at Fri 27.11.2026 12:30 Israel time. Map is a schematic drawing in the style colours, not real tiles. -->'
           f'<style>{css}</style></head><body><div class="gal">{gal}</div></body></html>')
    open(os.path.join(out, 'mock.html'), 'w', encoding='utf-8').write(doc)
    json.dump(map_style(d), open(os.path.join(out, 'map-style.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    open(os.path.join(out, 'markers.svg'), 'w', encoding='utf-8').write(markers_sheet(d))
    open(os.path.join(out, 'README.md'), 'w', encoding='utf-8').write(readme(d, key))
    fails = [r for r in contrast_rows(d) if r[5] < r[6]]
    print(key, 'contrast fails:', [(r[0], r[1], r[2], round(r[5], 2)) for r in fails])

if __name__ == '__main__':
    for k in (sys.argv[1:] or DIRS):
        build(k)
