#!/usr/bin/env python3
"""Writes map-style.json and markers.svg for tekhelet-v2. markers.svg uses the mock's own SVG functions (one source)."""
import json, os, sys
from playwright.sync_api import sync_playwright
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.dirname(HERE); sys.path.insert(0, HERE)
from tokens import C, MAP, FONTS

def rules(m):
    return [
     {'match': {'id': 'background'}, 'paint': {'background-color': m['land']}},
     {'match': {'source-layer': 'landuse', 'class': ['residential', 'suburb', 'neighbourhood']}, 'paint': {'fill-color': m['resid'], 'fill-opacity': 1}},
     {'match': {'source-layer': 'landuse', 'class': ['commercial', 'industrial', 'retail', 'hospital', 'school', 'cemetery', 'stadium', 'railway']}, 'paint': {'fill-color': m['resid'], 'fill-opacity': 0.6}},
     {'match': {'source-layer': 'park'}, 'paint': {'fill-color': m['park'], 'fill-outline-color': m['park']}},
     {'match': {'source-layer': 'landcover', 'class': ['wood', 'forest']}, 'paint': {'fill-color': m['wood'], 'fill-opacity': 0.85}},
     {'match': {'source-layer': 'landcover', 'class': ['grass', 'farmland', 'scrub', 'wetland', 'sand', 'rock', 'ice']}, 'paint': {'fill-color': m['park'], 'fill-opacity': 0.35}},
     {'match': {'source-layer': 'water', 'type': 'fill'}, 'paint': {'fill-color': m['water']}},
     {'match': {'source-layer': 'waterway', 'type': 'line'}, 'paint': {'line-color': m['waterline']}},
     {'match': {'source-layer': 'building', 'type': 'fill'}, 'paint': {'fill-color': m['building'], 'fill-outline-color': m['casing']}, 'minzoom': 15,
      '$why': 'buildings read as cut stone blocks: one shade darker than the land, a thin joint line'},
     {'match': {'source-layer': 'transportation', 'class': ['minor', 'service', 'track'], 'casing': True}, 'paint': {'line-color': m['casing'], 'line-width-scale': 0.8}},
     {'match': {'source-layer': 'transportation', 'class': ['minor', 'service', 'track'], 'casing': False}, 'paint': {'line-color': m['road'], 'line-width-scale': 0.8}},
     {'match': {'source-layer': 'transportation', 'class': ['primary', 'secondary', 'tertiary'], 'casing': True}, 'paint': {'line-color': m['major-casing']}},
     {'match': {'source-layer': 'transportation', 'class': ['primary', 'secondary', 'tertiary'], 'casing': False}, 'paint': {'line-color': m['major']}},
     {'match': {'source-layer': 'transportation', 'class': ['motorway', 'trunk'], 'casing': True}, 'paint': {'line-color': m['motorway-casing']}},
     {'match': {'source-layer': 'transportation', 'class': ['motorway', 'trunk'], 'casing': False}, 'paint': {'line-color': m['motorway']}},
     {'match': {'source-layer': 'transportation', 'class': ['path', 'pedestrian']}, 'paint': {'line-color': m['casing'], 'line-opacity': 0.6, 'line-dasharray': [1.5, 1.5]},
      '$why': 'the old city alleys and stairs: a quiet dashed line, like steps'},
     {'match': {'source-layer': 'transportation', 'class': ['rail', 'transit']}, 'paint': {'line-color': m['rail']}},
     {'match': {'source-layer': 'boundary'}, 'paint': {'line-color': m['boundary']}},
     {'match': {'source-layer': 'place', 'type': 'symbol'}, 'paint': {'text-color': m['label'], 'text-halo-color': m['label-halo'], 'text-halo-width': 1.6}},
     {'match': {'source-layer': 'transportation_name', 'type': 'symbol'}, 'paint': {'text-color': m['road-label'], 'text-halo-color': m['label-halo'], 'text-halo-width': 1.4}},
     {'match': {'source-layer': ['water_name'], 'type': 'symbol'}, 'paint': {'text-color': m['water-label'], 'text-halo-color': m['label-halo'], 'text-halo-width': 1.2}},
    ]
style = {
 '$comment': [
  'S1-4 proposal – direction "תכלת ואבן" v2 (Tekhelet & stone). Paint overrides for the OpenFreeMap liberty style (https://tiles.openfreemap.org/styles/liberty), OpenMapTiles schema. Not used by the app yet.',
  'Idea: Safed limestone land and stone-block buildings, tekhelet water, quiet warm roads (no yellow), labels in a dark stone tone; dark = the same stone under moonlight with deepened tekhelet.',
  'Layers are matched by source-layer (+ geometry type, + class values in the layer filter, + casing = layer id contains "casing"), not by liberty ids, so the override survives liberty id renames. "id" is used only for "background".',
  '"line-width-scale" is not a MapLibre property: the build step multiplies the layer\'s existing line-width stops by it (minor streets 20% thinner = quieter).',
  'A small build step (after the owner approves) fetches liberty once, applies these rules, keeps name:he labels, and writes public/map-style/light.json and dark.json into the repo; the app loads them from the site.',
  'Glyphs stay the liberty font stack (Hebrew renders with the rtl-text plugin). Suez One on the map would need self-hosted glyph PBFs – not proposed.',
 ],
 'base': 'https://tiles.openfreemap.org/styles/liberty',
 'remove_layers': [
  {'source-layer': 'poi', '$why': 'all POI icons/labels: shops, banks, other restaurants – only our door markers should speak'},
  {'source-layer': 'housenumber'}, {'source-layer': 'aerodrome_label'}, {'source-layer': 'mountain_peak'},
  {'source-layer': 'transportation_name', 'class': ['minor', 'service', 'track', 'path'], 'maxzoom': 15, '$why': 'minor street names only from z15'},
  {'type': 'fill-extrusion', '$why': '3D buildings off'},
  {'source-layer': 'landcover', 'type': 'fill-pattern', '$why': 'no texture patterns behind labels or markers'},
 ],
 'keep_labels': ['place: city, town, village, suburb, neighbourhood, quarter', 'transportation_name: motorway–tertiary (all zooms), minor from z15', 'water_name'],
 'light': rules(MAP['light']), 'dark': rules(MAP['dark']),
}
json.dump(style, open(os.path.join(OUT, 'map-style.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox']); pg = b.new_page()
    pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith('file:') else r.abort())
    pg.goto('file://' + os.path.join(OUT, 'mock.html')); pg.wait_for_timeout(200)
    get = lambda js: pg.evaluate(js)
    specs = [("chabad", "y", False, 'ח · פתוח'), ("eda", "s", False, 'ע · נסגר בקרוב'), ("landa", "u", False, 'ל · אין מידע'),
             ("products", "y", False, 'מ · מוצרים (חלול)'), ("chabad", "u", True, 'מיקום משוער'), ("eda", "y", 'sel', 'נבחר')]
    svgs = [get(f"KA_SVG.doorSVG('{hc}',{{state:'{st}',approx:{'true' if ap is True else 'false'},w:{36.4 if ap == 'sel' else 26}}})") for hc, st, ap, _ in specs]
    cl = [get("KA_SVG.blockSVG(7)"), get("KA_SVG.blockSVG(24)")]
    b.close()
inner = lambda s: s.split('>', 1)[1].rsplit('</svg>', 1)[0]
import re
def size(s): return float(re.search(r'width="([\d.]+)"', s).group(1)), float(re.search(r'height="([\d.]+)"', s).group(1)), re.search(r'viewBox="([^"]+)"', s).group(1)
def block(theme, y0):
    c = C[theme]; m = MAP[theme]
    css = ';'.join(f'--{k}:{v}' for k, v in c.items()) + f";--font-display:{FONTS['display'][1]};--font-body:{FONTS['body'][1]}".replace('"', "'")
    it = [f'<text x="1020" y="{y0 + 24}" class="h" text-anchor="start" fill="{c["ink"]}">{"בהיר" if theme == "light" else "כהה – אבן לאור ירח"}</text>']
    for i, (sv, sp) in enumerate(zip(svgs, specs)):
        w, h, vb = size(sv); cx = 70 + i * 120; vbw = float(vb.split()[2])
        it.append(f'<g transform="translate({cx - w / 2},{y0 + 92 - h}) scale({w / vbw})">{inner(sv)}</g>')
        it.append(f'<text x="{cx}" y="{y0 + 122}" text-anchor="middle" class="l" fill="{c["sub"]}">{sp[3]}</text>')
    for j, (sv, lab) in enumerate(zip(cl, ('אשכול – גוש אבן (7)', 'אשכול (24)'))):
        w, h, vb = size(sv); cx = 800 + j * 120
        it.append(f'<g transform="translate({cx - w / 2},{y0 + 75 - h / 2})">{inner(sv)}</g>')
        it.append(f'<text x="{cx}" y="{y0 + 122}" text-anchor="middle" class="l" fill="{c["sub"]}">{lab}</text>')
    return f'<g style="{css}"><rect x="0" y="{y0}" width="1040" height="140" fill="{m["land"]}"/>{"".join(it)}</g>'
f = FONTS['display'][1].replace('"', "'"); fb = FONTS['body'][1].replace('"', "'")
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="1040" height="280" viewBox="0 0 1040 280" direction="rtl">'
       f'<style>.mkt{{font-family:{f};font-weight:700}}.l{{font:600 12px {fb}}}.h{{font:700 14px {fb}}}</style>{block("light", 0)}{block("dark", 140)}</svg>')
open(os.path.join(OUT, 'markers.svg'), 'w', encoding='utf-8').write(svg)
print('ok')
