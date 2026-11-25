#!/usr/bin/env python3
"""Screenshots of mock.html (local Chrome, all network blocked) + markers.svg rendered from the mock's own SVG functions."""
import os, json
from playwright.sync_api import sync_playwright
OUT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = 'file://' + os.path.join(OUT, 'mock.html')
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    ctx = b.new_context(viewport={'width': 1800, 'height': 1000}, device_scale_factor=2, locale='he-IL', reduced_motion='reduce')
    ctx.route('**/*', lambda r: r.continue_() if r.request.url.startswith('file:') else r.abort())
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
    pg.goto(URL); pg.wait_for_timeout(300)
    def shot(sel, name): pg.wait_for_timeout(350); pg.locator(sel).screenshot(path=os.path.join(OUT, name)); print(name)
    def fresh(t): pg.goto(URL); pg.wait_for_timeout(250); pg.evaluate(f"KA.theme('{t}')")
    for t in ('light', 'dark'):
        fresh(t); shot('#phone', 'phone-light.png' if t == 'light' else 'phone-dark.png')
        shot('#desk', 'desktop.png' if t == 'light' else 'desktop-dark.png')
        pg.evaluate("KA.phone.open('בוסלה')"); shot('#phone', 'card.png' if t == 'light' else 'card-dark.png')
    fresh('light'); pg.evaluate("KA.phone.open('מאפיית חלב חיטים')"); pg.evaluate("(()=>{const b=document.querySelector('#phone .sbody');b.scrollTop+=b.querySelector('.doubt').getBoundingClientRect().top-b.getBoundingClientRect().top-330})()"); shot('#phone', 'card-doubt.png')
    fresh('light')
    # list states for review
    pg.click('#phone [data-c=fri]'); pg.evaluate("KA.phone.setSnap(3)"); shot('#phone', 'friday.png')
    fresh('light'); pg.fill('#phone .q', 'פיצא'); shot('#phone', 'search.png')
    fresh('dark'); pg.click('#phone .flt'); shot('#phone', 'filter-dark.png')
    print('errors:', errs)
    b.close()
