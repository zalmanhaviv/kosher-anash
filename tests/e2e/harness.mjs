// E2E harness: serves dist/ through Playwright request interception (no server, no network).
// Map tiles, glyphs and sprites from tiles.openfreemap.org get blank stand-ins; raw.githubusercontent.com
// gets the repository's data/ files (or a per-test override). Any other outside host is blocked and recorded.
import { createRequire } from 'node:module';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const DIST = join(ROOT, 'dist');
export const ORIGIN = 'http://localhost:4173'; // localhost = secure context (geolocation works), no service worker (http)
export const CHROME = process.env.CHROME || '/usr/bin/google-chrome';

function loadPlaywright() {
  const req = createRequire(import.meta.url);
  for (const p of [process.env.PLAYWRIGHT_MODULE, 'playwright', '/opt/node-tools/node_modules/playwright', '/opt/npm-tools/node_modules/playwright'].filter(Boolean)) {
    try { return req(p); } catch {}
  }
  throw new Error('playwright not found: npm install --no-save playwright');
}
export const { chromium } = loadPlaywright();

// a fully transparent 256x256 PNG
export const BLANK_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAABFUlEQVR42u3BMQEAAADCoPVP7WsIoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAeAMBPAAB2ClDBAAAAABJRU5ErkJggg==', 'base64');

export const DATA = JSON.parse(readFileSync(join(ROOT, 'data/places.json'), 'utf8'));
export const META = JSON.parse(readFileSync(join(ROOT, 'data/meta.json'), 'utf8'));
export const CITIES = JSON.parse(readFileSync(join(ROOT, 'data/cities.json'), 'utf8'));

// src/logic.js in node, to compute expected counts independently of the DOM
const ctx = { Intl, Date, Math, String, Number, Object };
vm.runInNewContext(readFileSync(join(ROOT, 'src/logic.js'), 'utf8') + ';globalThis.L={statusAt,normText,friRanges,NOINFO};', ctx);
export const L = ctx.L;

const TYPES = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.mjs':'text/javascript; charset=utf-8', '.css':'text/css', '.json':'application/json', '.webmanifest':'application/manifest+json', '.png':'image/png', '.woff2':'font/woff2', '.txt':'text/plain' };
// files the build expects from the live site (CONTEXT: vendor/ is not in the repo); stubbed when absent locally
// (/vendor/fonts.css is gone since S2-2: the page no longer asks for it, so a request for it is a plain 404)
const STUBS = { '/vendor/rtl-text.mjs': ['text/javascript', 'export default {};'] };

// headers of the '/*' block in dist/_headers (CSP with the build's script hashes), so CSP violations show up as console errors
const HEADERS = (() => { const h = {}; try { const t = readFileSync(join(DIST, '_headers'), 'utf8'); const blk = t.split(/\n(?=\S)/).find(b => b.startsWith('/*')); for (const line of (blk || '').split('\n').slice(1)) { const m = /^\s+([\w-]+):\s*(.*)$/.exec(line); if (m) h[m[1]] = m[2]; } } catch {} return h; })();
export const APPLIED_HEADERS = HEADERS;
// TileJSON stand-in lists every source-layer the two map styles use (as the real OpenFreeMap TileJSON does)
const VLAYERS = [...new Set(['light', 'dark'].flatMap(n => { try { return JSON.parse(readFileSync(join(ROOT, 'public/map-style', n + '.json'), 'utf8')).layers.map(l => l['source-layer']).filter(Boolean); } catch { return []; } }))].map(id => ({ id, fields: {} }));

// Israel wall clock -> UTC instant. Israel is UTC+2 in winter (Nov/Dec 2026); all frozen times here are in winter.
export const il = (y, mo, d, h, mi) => new Date(Date.UTC(y, mo - 1, d, h - 2, mi));
export const TUE = il(2026, 12, 1, 12, 30), FRI = il(2026, 11, 27, 12, 0), TUE_NIGHT = il(2026, 12, 1, 23, 30);

/**
 * opts: { time, clockInstall, viewport, dark, reduced, geo, mobile, ua, liveData: {places, meta} | null, ls: {key: value} }
 * returns { ctx, page, log } – log.errors (console + page errors), log.external (blocked hosts), log.req (urls)
 */
export async function open(browser, path = '/', opts = {}) {
  const log = { errors: [], external: [], req: [], stubbed: new Set() };
  const vp = opts.viewport || { width: 390, height: 844 };
  const ctxo = {
    viewport: vp, deviceScaleFactor: opts.dpr || 1, locale: 'he-IL', timezoneId: opts.tz || 'Asia/Jerusalem',
    colorScheme: opts.dark ? 'dark' : 'light', reducedMotion: opts.reduced ? 'reduce' : 'no-preference',
    hasTouch: !!opts.mobile, isMobile: !!opts.mobile, userAgent: opts.ua,
  };
  if (opts.geo) { ctxo.geolocation = opts.geo; ctxo.permissions = ['geolocation']; }
  const context = await browser.newContext(ctxo);
  // clockInstall: page timers are fake too and move only with page.clock.runFor (for the 60 s refresh)
  if (opts.clockInstall) await context.clock.install({ time: opts.time || TUE }); else await context.clock.setFixedTime(opts.time || TUE);
  if (opts.ls) await context.addInitScript(ls => { if (!sessionStorage.getItem('__lsdone')) { for (const [k, v] of Object.entries(ls)) localStorage.setItem(k, v); sessionStorage.setItem('__lsdone', '1'); } }, opts.ls);
  const live = opts.liveData === undefined ? { places: DATA, meta: META } : opts.liveData;
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    log.req.push(url.href);
    if (url.origin === ORIGIN) {
      let p = decodeURIComponent(url.pathname); if (p.endsWith('/')) p += 'index.html';
      const f = join(DIST, p);
      if (p === '/__blank.html') return route.fulfill({ status: 200, contentType: 'text/html', headers: HEADERS, body: '<!doctype html><html><body style="margin:0"><div id="m" style="width:400px;height:400px"></div></body></html>' });
      if (existsSync(f) && statSync(f).isFile()) return route.fulfill({ status: 200, contentType: TYPES[extname(f)] || 'application/octet-stream', headers: HEADERS, body: readFileSync(f) });
      if (STUBS[p]) { log.stubbed.add(p); return route.fulfill({ status: 200, contentType: STUBS[p][0], body: STUBS[p][1] }); }
      return route.fulfill({ status: 404, body: 'not found' });
    }
    if (url.hostname === 'tiles.openfreemap.org') {
      const p = url.pathname;
      if (p === '/planet') return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ tilejson: '3.0.0', tiles: ['https://tiles.openfreemap.org/planet/t/{z}/{x}/{y}.pbf'], minzoom: 0, maxzoom: 14, vector_layers: VLAYERS }) });
      if (p.endsWith('.png')) return route.fulfill({ contentType: 'image/png', body: BLANK_PNG });
      if (p.includes('/sprites/') && p.endsWith('.json')) return route.fulfill({ contentType: 'application/json', body: '{}' });
      return route.fulfill({ contentType: 'application/x-protobuf', body: Buffer.alloc(0) }); // empty vector tile / glyph range
    }
    if (url.hostname === 'raw.githubusercontent.com') {
      if (!live) return route.fulfill({ status: 503, body: '' });
      const name = url.pathname.split('/').pop();
      const body = name === 'places.json' ? live.places : name === 'meta.json' ? live.meta : name === 'cities.json' ? (live.cities ?? CITIES) : null;
      if (body == null) return route.fulfill({ status: 404, body: '' });
      return route.fulfill({ contentType: 'application/json', body: typeof body === 'string' ? body : JSON.stringify(body) });
    }
    if (url.protocol === 'data:' || url.protocol === 'blob:') return route.continue();
    log.external.push(url.href);
    return route.abort();
  });
  const page = await context.newPage();
  // the app asks for meta.json first and for places.json / cities.json only when rev went up
  const rawResp = (n, timeout) => page.waitForResponse(r => r.url().startsWith('https://raw.githubusercontent.com/') && r.url().endsWith(n), { timeout });
  const liveP = opts.waitLive ? rawResp('meta.json', 10000).then(() => rawResp('places.json', 1500).catch(() => null)) : null;
  page.on('console', m => { if (m.type() === 'error') log.errors.push('console: ' + m.text()); });
  page.on('pageerror', e => log.errors.push('pageerror: ' + e.message));
  await page.goto(ORIGIN + (opts.blank ? '/__blank.html' : path));
  if (opts.blank) return { ctx: context, page, log };
  await page.waitForSelector('#sbody .item, #sbody .det, #sbody .empty');
  if (liveP) { await liveP; await page.waitForTimeout(400); }
  return { ctx: context, page, log };
}

// wait until the map has settled: GL markers/clusters drawn, or the SVG fallback shown
export async function mapReady(page, timeout = 15000) {
  await page.waitForFunction(() => document.querySelector('#map .maplibregl-marker') || !document.getElementById('svgmap').hasAttribute('hidden'), null, { timeout });
  return page.evaluate(() => document.querySelector('#map .maplibregl-marker') ? 'gl' : 'svg');
}

export const vendorPresent = () => existsSync(join(DIST, 'vendor/maplibre-gl.mjs')) && statSync(join(DIST, 'vendor/maplibre-gl.mjs')).size > 1000;

export async function launch() {
  return chromium.launch({ executablePath: existsSync(CHROME) ? CHROME : undefined, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
}

// ---------- expected values from the data (same rules as the UI) ----------
const rad = x => x * Math.PI / 180;
export const km = (a, b) => { const dLa = rad(b.lat - a.lat), dLo = rad(b.lng - a.lng); const x = Math.sin(dLa / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLo / 2) ** 2; return 12742 * Math.asin(Math.sqrt(x)); };
export const cityLL = c => CITIES[c] ? { lat: CITIES[c][0], lng: CITIES[c][1] } : null;
export const LLof = p => (p.g && p.g.loc) ? p.g.loc : cityLL(p.c);
// Israel wall-clock Date for statusAt
export const wall = d => { const p = {}; for (const x of new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jerusalem', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(d)) p[x.type] = x.value; return new Date(+p.year, p.month - 1, +p.day, +p.hour % 24, +p.minute); };
export const nPl = n => n === 1 ? 'מקום אחד' : n + ' מקומות';
