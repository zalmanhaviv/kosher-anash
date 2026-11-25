#!/usr/bin/env python3
"""Screenshots of each direction's mock.html frames (Chrome at /usr/bin/google-chrome, no network)."""
import os, sys
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
SHOTS = {'home-light': 'phone-light.png', 'home-dark': 'phone-dark.png', 'card-light': 'card.png', 'card-dark': 'card-dark.png',
         'desktop-light': 'desktop.png', 'desktop-dark': 'desktop-dark.png'}
dirs = sys.argv[1:] or ['neirot', 'tekhelet', 'shelet']
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    ctx = b.new_context(viewport={'width': 1400, 'height': 1000}, device_scale_factor=2, locale='he-IL')
    ctx.route('**/*', lambda r: r.continue_() if r.request.url.startswith('file:') else r.abort())
    for d in dirs:
        pg = ctx.new_page()
        pg.goto('file://' + os.path.join(ROOT, d, 'mock.html'))
        pg.wait_for_timeout(300)
        for fid, name in SHOTS.items():
            pg.locator(f'#{d}-{fid}').screenshot(path=os.path.join(ROOT, d, name))
        pg.close()
        print(d, 'ok')
    b.close()
