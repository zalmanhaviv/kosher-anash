#!/usr/bin/env python3
"""S1-7 visual check of a built dist/ (local Chrome; every outside host is blocked, so map tiles never load).
Usage: python3 docs/design/impl/shots.py <dist dir> <prefix: before|after>
Writes docs/design/impl/<prefix>-{phone,phone-dark,card,card-dark,filter,desktop,desktop-dark}.png and prints checks:
no console/page errors, visible tap targets >= 44px, nothing wider than the screen, map style JSON loads and
every layer resolves (after only). Clock fixed to Tue 1.12.2026 12:30 Israel time, like the style mockups."""
import functools, http.server, os, sys, threading, json
from playwright.sync_api import sync_playwright
DIST, PRE = os.path.abspath(sys.argv[1]), sys.argv[2]
OUT = os.path.dirname(os.path.abspath(__file__))
H = functools.partial(http.server.SimpleHTTPRequestHandler, directory=DIST)
class Q(H.func):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Q, directory=DIST))
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = f'http://127.0.0.1:{srv.server_port}/'
ok = True
def check(c, m):
    global ok
    print(('  ok   ' if c else '  FAIL ') + m); ok = ok and bool(c)
TAP = """() => { const bad = []; for (const e of document.querySelectorAll('button,a[href],input,select,[role=button]')) {
  const r = e.getBoundingClientRect(), s = getComputedStyle(e); if (!r.width || !r.height || s.visibility === 'hidden' || e.closest('[hidden],.maplibregl-ctrl-attrib,.attr,.foot')) continue;
  if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
  if (e.closest('#sheet') && r.top > innerHeight - 4) continue;
  if (Math.min(r.width, r.height) < 43.5) bad.push((e.id || e.className || e.tagName) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height)); } return bad; }"""
WIDE = """() => { const bad = []; for (const e of document.querySelectorAll('.topbar *, #sheet *, .dlg *')) { const r = e.getBoundingClientRect();
  if (!r.width || e.closest('.chips,.recent,[hidden]') ) continue; if (r.right > innerWidth + 1 || r.left < -1) bad.push(e.tagName + '.' + e.className + ' ' + Math.round(r.left) + '..' + Math.round(r.right)); } return bad.slice(0, 8); }"""
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    def ctx(w, h, scheme):
        c = b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=2, locale='he-IL', color_scheme=scheme,
                          reduced_motion='reduce', has_touch=w < 900, is_mobile=w < 900, timezone_id='Asia/Jerusalem')
        c.route('**/*', lambda r: r.continue_() if r.request.url.startswith(URL) else r.abort())
        c.clock.set_fixed_time('2026-12-01T10:30:00Z')
        return c
    def page(c):
        p = c.new_page(); errs = []
        p.on('pageerror', lambda e: errs.append('pageerror ' + str(e)))
        p.on('console', lambda m: m.type == 'error' and 'net::ERR_FAILED' not in m.text and 'Failed to load resource' not in m.text and errs.append(m.text))
        p.goto(URL); p.wait_for_timeout(2500)
        return p, errs
    def shot(p, name): p.wait_for_timeout(300); p.screenshot(path=os.path.join(OUT, f'{PRE}-{name}.png'))
    for scheme in ('light', 'dark'):
        sfx = '' if scheme == 'light' else '-dark'
        print(f'phone 390x844 {scheme}')
        c = ctx(390, 844, scheme); p, errs = page(c)
        p.evaluate("localStorage.setItem('kl3_f', JSON.stringify({city:'בני ברק'}))"); p.reload(); p.wait_for_timeout(2500)
        p.evaluate("document.querySelector('#sheet').style.transform='translateY('+(document.querySelector('#sheet').offsetHeight-(innerHeight-innerHeight*0.45))+'px)'")
        shot(p, 'phone' + sfx)
        check(not p.evaluate(TAP), f'tap targets >= 44px: {p.evaluate(TAP)}')
        check(not p.evaluate(WIDE), f'no horizontal overflow: {p.evaluate(WIDE)}')
        p.click('.item'); p.wait_for_timeout(700); shot(p, 'card' + sfx)
        check(not p.evaluate(TAP), f'card tap targets >= 44px: {p.evaluate(TAP)}')
        check(not p.evaluate(WIDE), f'card: no horizontal overflow: {p.evaluate(WIDE)}')
        if scheme == 'light':
            p.click('#back'); p.wait_for_timeout(300); p.click('#fBtn'); p.wait_for_timeout(500); shot(p, 'filter')
            check(not p.evaluate(TAP), f'filter tap targets >= 44px: {p.evaluate(TAP)}')
        if PRE == 'after':
            st = p.evaluate("""async () => { const u = '/map-style/' + (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') + '.json';
              const s = await (await fetch(u)).json(); return { u, n: s.layers.length, src: Object.keys(s.sources), tiles: JSON.stringify(s.sources).includes('tiles.openfreemap.org') }; }""")
            check(st['n'] > 90 and st['tiles'], f'style {st["u"]}: {st["n"]} layers, tiles from openfreemap')
            gl = p.evaluate("""() => new Promise(res => { if (!window.maplibregl) return res({ err: 'no maplibre' });
              const d = document.createElement('div'); d.style.cssText = 'position:fixed;width:300px;height:300px;left:-400px;top:0'; document.body.appendChild(d);
              const errs = []; const u = '/map-style/' + (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') + '.json';
              const m = new maplibregl.Map({ container: d, style: u, center: [34.83, 32.08], zoom: 14 });
              m.on('error', e => errs.push(String(e.error && e.error.message || e)));
              m.once('style.load', () => { const L = m.getStyle().layers; const bad = L.filter(l => !m.getLayer(l.id)).map(l => l.id);
                const sh = L.filter(l => /shield/.test(l.id)).map(l => JSON.stringify(m.getLayoutProperty(l.id, 'text-field')));
                const he = L.filter(l => l.type === 'symbol' && /name/.test(JSON.stringify(m.getLayoutProperty(l.id, 'text-field') || ''))).every(l => JSON.stringify(m.getLayoutProperty(l.id, 'text-field')).includes('name:he'));
                res({ n: L.length, bad, sh, he, errs: errs.filter(x => !/Failed to fetch|NetworkError|AJAXError|load/i.test(x)) }); });
              setTimeout(() => res({ err: 'timeout', errs }), 8000); })""")
            check(not gl.get('err') and not gl['bad'] and not gl['errs'], f'MapLibre parses the style, all {gl.get("n")} layers resolve, style errors: {gl.get("errs")} {gl.get("err","")}')
            check(gl.get('sh') and all('ref' in s for s in gl['sh']), f'road shields keep ref text ({len(gl.get("sh") or [])} shield layers)')
            check(gl.get('he'), 'every name label prefers name:he')
            app = p.evaluate("() => { const s = getComputedStyle(document.body); return { font: s.fontFamily, fontsOk: [...document.fonts].some(f => f.family.replace(/\"/g,'') === 'Rubik' && f.status === 'loaded') }; }")
            check(app['fontsOk'] and app['font'].startswith('Rubik'), f'Rubik loaded and used ({app["font"][:30]})')
        check(not errs, f'no console errors: {errs}')
        c.close()
    for scheme in ('light', 'dark'):
        sfx = '' if scheme == 'light' else '-dark'
        print(f'desktop 1280x800 {scheme}')
        c = ctx(1280, 800, scheme); p, errs = page(c)
        p.evaluate("localStorage.setItem('kl3_f', JSON.stringify({city:'כפר חב\"ד'}))"); p.reload(); p.wait_for_timeout(2500)
        shot(p, 'desktop' + sfx)
        g = p.evaluate("() => [document.querySelector('#sheet').getBoundingClientRect().top, document.querySelector('.topbar').getBoundingClientRect().bottom]")
        check(g[0] >= g[1], f'desktop panel below the search bar (panel top {g[0]:.0f}, bar bottom {g[1]:.0f})')
        check(not p.evaluate(TAP), f'desktop tap targets >= 44px: {p.evaluate(TAP)}')
        check(not errs, f'no console errors: {errs}')
        c.close()
    b.close()
print('ALL OK' if ok else 'SOME CHECKS FAILED'); sys.exit(0 if ok else 1)
