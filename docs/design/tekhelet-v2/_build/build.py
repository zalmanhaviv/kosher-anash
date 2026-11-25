#!/usr/bin/env python3
"""Builds docs/design/tekhelet-v2/mock.html from mock.src.html + tokens.py + mockdata.json.
Run: node data.mjs && python3 build.py && python3 shots.py   (from this folder)"""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from tokens import C, MAP, TYPE, LH, RADIUS, SPACE, MOTION, SHADOW, FONTS
def tokens_css():
    out = ''
    for t in ('light', 'dark'):
        vs = {**C[t], **{'m-' + k: v for k, v in MAP[t].items()}, **SHADOW[t]}
        out += f'.f[data-theme={t}]{{' + ';'.join(f'--{k}:{v}' for k, v in vs.items()) + f';color-scheme:{t}}}\n'
    root = {**{f'fs-{k}': v for k, v in TYPE.items()}, **{f'lh-{k}': v for k, v in LH.items()}, **{f'r-{k}': v for k, v in RADIUS.items()},
            **SPACE, **{f'dur-{k}': v for k, v in MOTION.items() if k != 'ease'}, 'ease': MOTION['ease'],
            'font-display': '"KA Display",' + FONTS['display'][1], 'font-body': '"KA Text",' + FONTS['body'][1]}
    return out + ':root{' + ';'.join(f'--{k}:{v}' for k, v in root.items()) + '}\n'
src = open(os.path.join(HERE, 'mock.src.html'), encoding='utf-8').read()
data = json.load(open(os.path.join(HERE, 'mockdata.json'), encoding='utf-8'))
js = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
html = src.replace('/*TOKENS*/', tokens_css()).replace('/*DATA*/null', js)
open(os.path.join(OUT, 'mock.html'), 'w', encoding='utf-8').write(html)
print('mock.html', len(html))
