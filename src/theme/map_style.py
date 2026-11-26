#!/usr/bin/env python3
"""Builds public/map-style/light.json and dark.json – the app's own map look (hybrid direction, S1-7).

Base: OpenFreeMap "liberty" (src/theme/liberty-base.json, from github.com/hyperknot/openfreemap-styles,
styles/liberty/style.json, with __TILEJSON_DOMAIN__ = tiles.openfreemap.org; BSD licence in LICENSE-liberty.md).
Tiles, glyphs and sprites stay on tiles.openfreemap.org; only the colours and a few layers change:
  - quiet palette from the hybrid tokens (near-white land, soft green, light sea blue, white streets,
    pale-yellow motorways only), dark variant from the dark tokens;
  - shop/POI icons and 3D buildings removed so only our markers speak (transit stations stay);
  - name labels prefer Hebrew (the app does the same again in map.on('load'); road-number shields keep 'ref').
Run: python3 src/theme/map_style.py   (no network needed)"""
import copy, json, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent.parent
BASE = ROOT / 'src/theme/liberty-base.json'
OUT = ROOT / 'public/map-style'

# map palette = the --m-* tokens of the hybrid direction (docs/design/styles/_build/hybrid.css)
PAL = {
  'light': dict(land='#F5F4F0', desert='#F2ECDF', green='#DFEDD6', sea='#B5D8F2', river='#A1CBEB', urban='#ECE9E3',
                building='#E6E2DA', building_line='#DAD5CB', street='#FFFFFF', street_case='#E2DED6',
                mw='#F6DE9C', mw_case='#E3C67C', tr='#FFFFFF', tr_case='#DCD8CF', path='#FFFFFF', rail='#C9C5BD',
                border='#A39C8F', label='#3A3D42', label2='#5B626C', halo='#F8F7F3', water_label='#234F76',
                aero='#ECE9E3', special='#EEEAE2', tunnel_op=0.55, relief=0.35),
  'dark':  dict(land='#22252A', desert='#29271F', green='#1F2C25', sea='#132C44', river='#1C405F', urban='#2B2E34',
                building='#2E3238', building_line='#363A41', street='#383C43', street_case='#2A2D33',
                mw='#7A6840', mw_case='#4F4430', tr='#454951', tr_case='#1B1D21', path='#3E4249', rail='#4D5158',
                border='#6A675F', label='#E3E5E9', label2='#B8BEC7', halo='#1A1C20', water_label='#7FAAD0',
                aero='#2B2E34', special='#272A2F', tunnel_op=0.5, relief=0),
}
DROP = {'poi_r20', 'poi_r7', 'poi_r1', 'building-3d'}
HE = ['coalesce', ['get', 'name:he'], ['get', 'name']]

def road_color(lid, c):
    case = 'casing' in lid
    if 'rail' in lid: return c['rail']
    if 'path_pedestrian' in lid: return c['street_case'] if case else c['path']
    if 'motorway' in lid: return c['mw_case'] if case else c['mw']
    if any(k in lid for k in ('trunk_primary', 'secondary_tertiary', '_link')): return c['tr_case'] if case else c['tr']
    return c['street_case'] if case else c['street']  # minor, street, service_track

def build(name):
    c = PAL[name]
    s = json.loads(BASE.read_text(encoding='utf-8'))
    s['name'] = f'kosher-anash {name} (from OpenFreeMap liberty)'
    s['metadata'] = {'kosher-anash:source': 'openfreemap-styles liberty @006ea57', 'kosher-anash:theme': name}
    out = []
    for l in s['layers']:
        lid, t, sl = l['id'], l['type'], l.get('source-layer')
        if lid in DROP: continue
        if lid == 'natural_earth' and not c['relief']: continue
        p = l.setdefault('paint', {})
        if lid == 'background': p['background-color'] = c['land']
        elif lid == 'natural_earth': p['raster-opacity'] = ['interpolate', ['linear'], ['zoom'], 0, c['relief'], 6, 0.05]
        elif lid == 'park': p.update({'fill-color': c['green'], 'fill-opacity': 0.8}); p.pop('fill-outline-color', None)
        elif lid == 'park_outline': p['line-color'] = c['green']
        elif lid == 'landuse_residential': p['fill-color'] = c['urban']; p['fill-opacity'] = 0.6
        elif lid in ('landcover_wood', 'landcover_grass'): p['fill-color'] = c['green']; p['fill-opacity'] = 0.7
        elif lid == 'landcover_ice': p['fill-color'] = c['land']
        elif lid == 'landcover_sand': p['fill-color'] = c['desert']
        elif lid.startswith('landuse_'): p['fill-color'] = c['special']
        elif lid == 'water': p['fill-color'] = c['sea']
        elif sl == 'waterway' and t == 'line': p['line-color'] = c['river']
        elif lid == 'aeroway_fill': p['fill-color'] = c['aero']; p['fill-opacity'] = 1
        elif sl == 'aeroway' and t == 'line': p['line-color'] = c['street']
        elif lid == 'road_area_pattern': p.pop('fill-pattern', None); p['fill-color'] = c['street']
        elif sl == 'transportation' and t == 'line':
            p['line-color'] = road_color(lid, c)
            if lid.startswith('tunnel_'): p['line-opacity'] = c['tunnel_op']
        elif lid == 'building':
            p['fill-color'] = c['building']; p['fill-outline-color'] = c['building_line']
        elif sl == 'boundary': p['line-color'] = c['border']
        elif t == 'symbol':
            lay = l.setdefault('layout', {})
            tf = json.dumps(lay.get('text-field'))
            if lay.get('text-field') is not None and 'name' in tf and '"ref"' not in tf: lay['text-field'] = HE
            if sl in ('water_name', 'waterway'): p.update({'text-color': c['water_label'], 'text-halo-color': c['halo'], 'text-halo-width': 1.2})
            elif sl == 'transportation_name' and 'shield' not in lid and 'road_shield' not in lid:
                p.update({'text-color': c['label2'], 'text-halo-color': c['halo'], 'text-halo-width': 1.2}); p.pop('text-halo-blur', None)
            elif sl in ('place', 'aerodrome_label', 'poi'):
                p.update({'text-color': c['label'] if sl == 'place' else c['label2'], 'text-halo-color': c['halo'], 'text-halo-width': 1.4})
                p.pop('text-halo-blur', None)
        out.append(l)
    s['layers'] = out
    return s

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for n in PAL:
        st = build(n)
        (OUT / f'{n}.json').write_text(json.dumps(st, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
        print(OUT / f'{n}.json', len(st['layers']), 'layers')
    (OUT / 'LICENSE-liberty.md').write_text((ROOT / 'src/theme/LICENSE-liberty.md').read_text(encoding='utf-8'), encoding='utf-8')

if __name__ == '__main__':
    main()
