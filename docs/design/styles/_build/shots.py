#!/usr/bin/env python3
"""Screenshots + interaction checks for the mockups (local Chrome, ALL network blocked: Google Fonts do not load,
so the screenshots use the local fallback fonts). Writes docs/design/styles/<style>-phone.png, -card.png, -desktop.png, -dark.png."""
import os, sys
from playwright.sync_api import sync_playwright
B = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.dirname(B)
STYLES = sys.argv[1:] or ['apple', 'wolt', 'airbnb', 'google', 'hybrid']
ok = True
def check(cond, msg):
    global ok
    print(('  ok   ' if cond else '  FAIL ') + msg); ok = ok and bool(cond)
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    for st in STYLES:
        print(st)
        URL = 'file://' + os.path.join(OUT, st + '.html')
        ctx = b.new_context(viewport={'width': 1300, 'height': 1000}, device_scale_factor=2, locale='he-IL', reduced_motion='reduce'); ctx.set_default_timeout(8000)
        ctx.route('**/*', lambda r: r.continue_() if r.request.url.startswith('file:') else r.abort())
        pg = ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: m.type == 'error' and 'ERR_FAILED' not in m.text and errs.append(m.text))
        def fresh(t='light'):
            pg.goto(URL); pg.wait_for_timeout(300); pg.evaluate(f"KA.theme('{t}')"); pg.wait_for_timeout(120)
        def shot(sel, name): pg.wait_for_timeout(400); pg.locator(sel).screenshot(path=os.path.join(OUT, f'{st}-{name}.png'))
        fresh(); shot('.phwrap', 'phone'); shot('.dkwrap', 'desktop')
        pg.evaluate("KA.phone.setTown('כפר חב\"ד')"); pg.wait_for_timeout(500); pg.evaluate("KA.phone.open('מסעדת נחום')"); pg.evaluate("KA.phone.setSnap(2)"); shot('.phwrap', 'card')
        fresh('dark'); shot('.phwrap', 'dark')
        # ---- interactions on the phone instance ----
        fresh(); P = '#phone '
        check(pg.inner_text(P + '.shd h2') == 'כל הארץ' and '457' in pg.inner_text(P + '.cnt'), 'default: כל הארץ + 457')
        n0 = pg.inner_text(P + '[data-c=open] .n'); pg.click(P + '[data-c=open]')
        check(pg.inner_text(P + '.cnt').startswith(n0 + ' מקומות פתוחים'), f'פתוח עכשיו: chip count {n0} = list header')
        pg.click(P + '[data-t=חלבי]'); n1 = pg.inner_text(P + '[data-c=open] .n'); check(int(n1) < int(n0), f'live count follows other filters ({n0} -> {n1})')
        pg.click(P + '[data-c=fri]'); check(pg.inner_text(P + '.shd h2') == 'פתוח בשישי' and pg.get_attribute(P + '[data-c=open]', 'aria-pressed') == 'false', 'פתוח בשישי replaces open-now')
        pg.click(P + '[data-c=hc]'); pg.wait_for_timeout(200); check(pg.is_visible(P + '.mbox .opt'), 'kashrut sheet opens')
        pg.click(P + '.opt[data-g=chabad]'); pg.click(P + '.mok'); pg.wait_for_timeout(250)
        hs = pg.eval_on_selector_all(P + '.item .kb', 'e=>e.map(x=>x.className)'); check(hs and all('chabad' in h for h in hs), f'kashrut filter applied ({len(hs)} rows, all ח)')
        fresh(); pg.fill(P + '.q', 'פיצא'); pg.wait_for_timeout(150)
        check('תוצאות חיפוש' in pg.inner_text(P + '.shd h2') and pg.locator(P + '.item').count() > 20, 'search normText: פיצא finds pizza places')
        pg.fill(P + '.q', 'צפת'); pg.wait_for_timeout(150); check(pg.locator(P + '.townrow').count() >= 1, 'search offers the town צפת')
        pg.click(P + '.townrow'); pg.wait_for_timeout(500); check(pg.inner_text(P + '.shd h2') == 'צפת והסביבה', 'town row switches to צפת והסביבה')
        check('הדלקת נרות' in pg.inner_text(P + '.cand'), 'candle lighting shown for the town')
        pg.click(P + '.townbtn'); pg.wait_for_timeout(200); pg.fill(P + '.msearch input', 'באר שבע'); pg.wait_for_timeout(100); pg.click(P + '.trow'); pg.wait_for_timeout(500)
        check(pg.inner_text(P + '.shd h2') == 'באר שבע והסביבה', 'town picker: באר שבע')
        pg.click(P + '.allc'); pg.wait_for_timeout(300); check(pg.inner_text(P + '.shd h2') == 'כל הארץ', 'back to כל הארץ')
        pg.locator(P + '.item').first.click(); pg.wait_for_timeout(300)
        check(pg.locator(P + '.card h3').count() == 1 and pg.locator(P + '.mk.sel').count() == 1, 'row opens card + selected marker')
        pg.locator(P + '.act[data-act=nav]').click(); pg.wait_for_timeout(100); check('בהדמיה בלבד' in pg.inner_text(P + '.toast'), 'action shows toast')
        pg.keyboard.press('Escape'); pg.wait_for_timeout(200); check(pg.locator(P + '.card').count() == 0, 'Escape closes the card')
        pg.evaluate("KA.phone.zoomAt(13,195,300)"); pg.wait_for_timeout(200)
        pg.evaluate("KA.phone.setTown('בני ברק')"); pg.wait_for_timeout(600); pg.evaluate("KA.phone.flyTo({lat:32.084,lng:34.834},15.6)"); pg.wait_for_timeout(200)
        mk = pg.locator(P + '.mk[data-u]').first; check(mk.count() == 1, 'single markers visible at town zoom')
        mk.click(force=True); pg.wait_for_timeout(300); check(pg.locator(P + '.card h3').count() == 1, 'marker opens card')
        pg.click(P + '.back'); pg.wait_for_timeout(200)
        pg.evaluate("KA.phone.zoomAt(11)"); pg.wait_for_timeout(200); cl = pg.locator(P + '.mk.cl').first
        if cl.count():
            z0 = pg.evaluate('KA.phone.V.z'); cl.click(force=True); pg.wait_for_timeout(200); check(pg.evaluate('KA.phone.V.z') > z0 or pg.evaluate('KA.phone.S.spider') is not None, 'cluster tap zooms in')
        # sheet drag
        g = pg.locator(P + '.grab').bounding_box(); y0 = pg.evaluate("document.querySelector('#phone').dataset.snap")
        pg.mouse.move(g['x'] + g['width'] / 2, g['y'] + 10); pg.mouse.down(); pg.mouse.move(g['x'] + g['width'] / 2, g['y'] - 300, steps=8); pg.mouse.up(); pg.wait_for_timeout(200)
        check(pg.evaluate("document.querySelector('#phone').dataset.snap") == 'full', f'drag sheet {y0} -> full')
        # map pan
        c0 = pg.evaluate('JSON.stringify(KA.phone.V.c)'); pg.evaluate("KA.phone.setSnap(0)"); pg.wait_for_timeout(100)
        pg.mouse.move(700, 600); pg.mouse.down(); pg.mouse.move(600, 520, steps=6); pg.mouse.up(); pg.wait_for_timeout(100)
        check(pg.evaluate('JSON.stringify(KA.phone.V.c)') != c0, 'map pans')
        # desktop instance
        D = '#desk '; pg.locator(D + '.item').first.click(); pg.wait_for_timeout(300); check(pg.locator(D + '.card').count() == 1, 'desktop: row opens card in the side panel')
        # wording rules
        html = pg.content()
        check('מנהג חב' not in html and 'דיווח על טעות' not in html, 'no "(מנהג חב״ד)" and no report button')
        check(not errs, 'no console errors ' + ('' if not errs else str(errs[:3])))
        ctx.close()
    # sandboxed iframe (no storage, no network) – served over local http, as a host page would embed it
    import threading, http.server, functools
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(type('Q', (http.server.SimpleHTTPRequestHandler,), {'log_message': lambda *a: None}), directory=OUT))
    threading.Thread(target=srv.serve_forever, daemon=True).start(); base = f'http://127.0.0.1:{srv.server_port}/'
    ctx = b.new_context(); ctx.set_default_timeout(8000)
    ctx.route('https://**/*', lambda r: r.abort())
    pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    for st in STYLES:
        pg.route(base + 'host.html', lambda r, *a, _s=st: r.fulfill(content_type='text/html', body=f'<iframe sandbox="allow-scripts" src="{base}{_s}.html" width="1300" height="900"></iframe>'))
        pg.goto(base + 'host.html'); pg.wait_for_timeout(900)
        fr = pg.frames[1]; fr.wait_for_function('window.KA'); n = fr.evaluate("document.querySelectorAll('#phone .item').length"); fr.evaluate("KA.theme('dark')")
        check(n > 0 and not errs, f'{st}: runs in sandboxed iframe ({n} rows) {errs[:2]}'); pg.unroute(base + 'host.html')
    srv.shutdown()
    b.close()
print('ALL OK' if ok else 'SOME CHECKS FAILED'); sys.exit(0 if ok else 1)
