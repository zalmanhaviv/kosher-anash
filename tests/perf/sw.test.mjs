// Service worker (public/sw.js as built by scripts/build.py) in local Chrome against a real HTTP server on localhost
// (a secure context, so the worker runs; the app itself registers it only on https, so the test registers it).
// Covers: precache of the build, offline start with the newest data, rev-consistent data cache, offline map answers,
// tile cache cap (also across worker restarts and on activate), the page streamed from the network (not held until
// it is cached) with the cached page after 4 s without an answer, and an update to a new build while a page stays open.
// Run: python3 scripts/build.py && node --test --test-concurrency=1 tests/perf/sw.test.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { launch } from '../e2e/harness.mjs';
import { serve, routeOutside, vectorLayers, DIST, ROOT } from './serve.mjs';

const SW = readFileSync(join(DIST, 'sw.js'), 'utf8');
const VER = /const V = "([0-9a-f]{12})"/.exec(SW)?.[1];
const PRE = JSON.parse(/PRE = (\[[^\]]*\])/.exec(SW)[1]);
const META = JSON.parse(readFileSync(join(ROOT, 'data/meta.json'), 'utf8'));
const PLACES = JSON.parse(readFileSync(join(ROOT, 'data/places.json'), 'utf8'));
let B, srv, swBody = null, pageBody = null;
before(async () => { B = await launch(); srv = await serve({ override: p => p === '/sw.js' && swBody != null ? swBody : p === '/index.html' && pageBody ? pageBody : null }); });
after(async () => { await B.close(); await srv.close(); });

async function openApp({ live } = {}) {
  let off = false;
  const ctx = await B.newContext({ viewport: { width: 390, height: 844 }, locale: 'he-IL', timezoneId: 'Asia/Jerusalem', serviceWorkers: 'allow' });
  const ext = await routeOutside(ctx, { offline: () => off, vlayers: vectorLayers(), live });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(srv.origin + '/');
  await page.waitForSelector('#sbody .item');
  await page.evaluate(() => navigator.serviceWorker.register('/sw.js'));
  await page.waitForFunction(() => navigator.serviceWorker.controller && navigator.serviceWorker.controller.state === 'activated', null, { timeout: 30000 });
  const setOffline = async v => { off = v; await ctx.setOffline(v); };
  return { ctx, page, ext, errors, setOffline };
}
const cacheKeys = page => page.evaluate(async () => { const o = {}; for (const k of await caches.keys()) o[k] = (await (await caches.open(k)).keys()).map(r => { const u = new URL(r.url); return u.origin === location.origin ? u.pathname : u.href; }); return o; });
const firstName = page => page.textContent('#sbody .item .nm');

test('build wrote a version and the precache list; every precached file is in this build\'s cache', async () => {
  assert.ok(VER, 'sw.js version written by build.py');
  assert.ok(!PRE.includes('/vendor/fonts.css'), 'no Assistant fonts.css');
  for (const f of ['/', '/fonts/rubik.woff2', '/map-style/light.json', '/map-style/dark.json', '/manifest.webmanifest']) assert.ok(PRE.includes(f), f);
  const r = await openApp();
  const k = await cacheKeys(r.page);
  assert.deepEqual(Object.keys(k).filter(x => x.startsWith('shell-')), ['shell-' + VER]);
  assert.deepEqual([...k['shell-' + VER]].sort(), [...PRE].sort());
  await r.ctx.close();
});

test('offline start: the app opens from the cache with the newest data it has seen, and the offline bar', async () => {
  const rev = META.rev + 1, places = structuredClone(PLACES);
  const i = places.findIndex(p => p.k === 'מסעדה' && p.c === 'בני ברק' && p.g && p.g.loc && !p.g.closed);
  places[i].n = 'שם מעודכן לבדיקה';
  const r = await openApp({ live: n => n === 'meta.json' ? JSON.stringify({ updated: META.updated, rev }) : n === 'places.json' ? JSON.stringify(places) : n === 'cities.json' ? readFileSync(join(ROOT, 'data/cities.json')) : null });
  // the page asked meta.json before the worker controlled it; this load goes through the worker
  await r.page.reload(); await r.page.waitForSelector('#sbody .item');
  await r.page.waitForTimeout(1000);
  const k = await cacheKeys(r.page);
  assert.ok(k['data-1'].some(u => u.endsWith('/places.json')), 'places.json cached');
  await r.setOffline(true);
  await r.page.reload(); await r.page.waitForSelector('#sbody .item');
  assert.equal(await r.page.isVisible('#offl'), true, 'offline bar');
  await r.page.fill('#q', 'שם מעודכן לבדיקה'); await r.page.waitForTimeout(400);
  assert.equal(await firstName(r.page), 'שם מעודכן לבדיקה', 'offline shows the cached newer data');
  // the map library is precached: the vector map opens offline (pins on the map background)
  await r.page.waitForSelector('#map .maplibregl-marker, #svgmap:not([hidden])', { state: 'attached', timeout: 25000 });
  if (PRE.includes('/vendor/maplibre-gl.mjs')) assert.equal(await r.page.$$eval('#map .maplibregl-marker', a => a.length > 0), true, 'GL map offline');
  assert.deepEqual(r.errors, []);
  await r.ctx.close();
});

test('data cache: a newer meta.json is kept only together with its places.json', async () => {
  let rev = META.rev + 1, placesOk = true;
  const r = await openApp({ live: n => n === 'meta.json' ? JSON.stringify({ updated: META.updated, rev }) : n === 'places.json' ? (placesOk ? JSON.stringify(PLACES) : 503) : null });
  await r.page.reload(); await r.page.waitForSelector('#sbody .item'); await r.page.waitForTimeout(800);
  const cachedRev = () => r.page.evaluate(async () => { const c = await caches.open('data-1'); const m = (await c.keys()).find(q => q.url.endsWith('/meta.json')); return m ? (await (await c.match(m)).json()).rev : null; });
  assert.equal(await cachedRev(), META.rev + 1);
  rev = META.rev + 2; placesOk = false; // places.json of the new rev fails to arrive
  await r.page.reload(); await r.page.waitForSelector('#sbody .item'); await r.page.waitForTimeout(800);
  assert.equal(await cachedRev(), META.rev + 1, 'the cached meta.json still matches the cached places.json');
  // the page got rev+2 from the network but no places for it: the worker does not hand it the older cached places
  const got = await r.page.evaluate(() => fetch('https://raw.githubusercontent.com/zalmanhaviv/kosher-anash/main/data/places.json', { cache: 'no-cache' }).then(x => x.status, () => 'error'));
  assert.equal(got, 503, 'the network answer, not the older cached places.json');
  await r.ctx.close();
});

test('offline map: unseen tiles and glyphs are answered empty (no errors), seen tiles from the cache', async () => {
  const r = await openApp();
  const T = 'https://tiles.openfreemap.org/planet/20250101_000000_pt/9/306/207.pbf';
  assert.equal(await r.page.evaluate(u => fetch(u).then(x => x.status), T), 200);
  await r.page.waitForTimeout(300);
  await r.setOffline(true);
  const res = await r.page.evaluate(async u => { const a = await fetch(u); const b = await fetch(u.replace('306', '305')); const g = await fetch('https://tiles.openfreemap.org/fonts/Noto%20Sans%20Regular/0-255.pbf'); const n = await fetch('https://tiles.openfreemap.org/natural_earth/ne2sr/3/4/2.png'); return [a.status, b.status, (await b.arrayBuffer()).byteLength, g.status, n.status, n.headers.get('content-type')]; }, T);
  assert.deepEqual(res, [200, 200, 0, 200, 200, 'image/png']);
  await r.ctx.close();
});

test('tile cache is capped (oldest removed first, at most MAX_TILES + 40)', async () => {
  swBody = SW.replace('MAX_TILES = 900', 'MAX_TILES = 5');
  try {
    const r = await openApp();
    await r.page.evaluate(async () => { for (let i = 0; i < 120; i++) await fetch(`https://tiles.openfreemap.org/planet/v/12/${i}/1.pbf`); });
    await r.page.waitForTimeout(1000);
    const k = (await cacheKeys(r.page))['tiles-1'].filter(u => u.includes('/planet/v/'));
    assert.ok(k.length <= 45, 'count ' + k.length);
    assert.ok(k.some(u => u.endsWith('/12/119/1.pbf')), 'newest kept');
    assert.ok(!k.some(u => /\/12\/([0-9]|[1-6][0-9])\/1\.pbf$/.test(u)), 'oldest removed: ' + k.slice(0, 3).join(' '));
    await r.ctx.close();
  } finally { swBody = null; }
});

// the browser stops an idle worker (~30 s) and every module variable starts again; CDP does the same on demand
const BOOT = ";const __BOOT = Math.random(); self.addEventListener('message', e => e.source.postMessage(__BOOT));";
const bootId = page => page.evaluate(() => new Promise(ok => { navigator.serviceWorker.addEventListener('message', e => ok(e.data), { once: true }); navigator.serviceWorker.controller.postMessage(1); }));
// polls in node (waitForFunction does not wait for a promise the page returns)
const until = async (f, ms) => { const end = Date.now() + ms; while (!(await f())) { if (Date.now() > end) throw new Error('timeout'); await new Promise(z => setTimeout(z, 100)); } };
const tileCount = page => page.evaluate(async () => (await (await caches.open('tiles-1')).keys()).filter(r => r.url.includes('/planet/v/')).length);

test('tile cache cap holds across worker restarts: 8 visits of 10 new tiles, the worker stopped between visits', async () => {
  swBody = SW.replace('MAX_TILES = 900', 'MAX_TILES = 5') + BOOT;
  try {
    const r = await openApp();
    const cdp = await r.ctx.newCDPSession(r.page); await cdp.send('ServiceWorker.enable');
    const boots = new Set(), counts = [];
    for (let v = 0; v < 8; v++) {
      await cdp.send('ServiceWorker.stopAllWorkers');
      boots.add(await bootId(r.page)); // wakes a fresh worker
      await r.page.evaluate(async v => { for (let i = 0; i < 10; i++) await fetch(`https://tiles.openfreemap.org/planet/v/13/${v * 10 + i}/1.pbf`); }, v);
      await r.page.waitForTimeout(300);
      counts.push(await tileCount(r.page));
    }
    console.log('# tiles after each visit:', counts.join(','));
    assert.equal(boots.size, 8, 'a new worker for every visit');
    // first tile of each worker's life trims to 5, then up to 9 more of that visit
    assert.ok(counts.every(n => n <= 5 + 10), 'per visit ' + counts.join(','));
    assert.ok(counts.every(n => n <= 5 + 40), 'cap MAX_TILES + 40');
    const k = (await cacheKeys(r.page))['tiles-1'];
    const ids = k.filter(u => u.includes('/planet/v/13/')).map(u => +/\/13\/(\d+)\//.exec(u)[1]);
    assert.ok(ids.includes(79) && ids.every(i => i >= 65), 'oldest removed: ' + ids.join(','));
    await r.ctx.close();
  } finally { swBody = null; }
});

test('tile cache is trimmed on activate (a full cache from an older worker)', async () => {
  // the first worker keeps the real cap, so the map's own tiles (GL map in CI) do not trim the 60 put here
  const r = await openApp();
  try {
    await r.page.evaluate(async () => { const c = await caches.open('tiles-1'); for (let i = 0; i < 60; i++) await c.put(`https://tiles.openfreemap.org/planet/v/14/${i}/1.pbf`, new Response('x')); });
    assert.equal(await tileCount(r.page), 60);
    swBody = SW.replace('MAX_TILES = 900', 'MAX_TILES = 5').replace(`const V = "${VER}"`, 'const V = "trimbuild000"');
    await r.page.evaluate(() => navigator.serviceWorker.getRegistration().then(g => g.update()));
    await until(() => r.page.evaluate(() => caches.keys().then(k => k.includes('shell-trimbuild000') && k.filter(x => x.startsWith('shell-')).length === 1)), 20000);
    await until(async () => await tileCount(r.page) <= 5, 5000);
    const all = (await cacheKeys(r.page))['tiles-1'];
    assert.ok(all.length <= 5, 'all tiles ' + all.length);
    // the newest are kept (the map may have stored a few of its own after these)
    const ids = all.filter(u => u.includes('/planet/v/')).map(u => +/\/14\/(\d+)\//.exec(u)[1]);
    assert.ok(ids.length > 0 && ids.every(i => i >= 55) && ids.includes(59), 'kept ' + ids.join(','));
  } finally { swBody = null; await r.ctx.close(); }
});

// the page through the worker on a slow connection: headers and the first part at once, the rest after SLOW ms
const HTML = readFileSync(join(DIST, 'index.html'), 'utf8');
const navTiming = page => page.evaluate(() => new Promise(ok => {
  const done = () => { const n = performance.getEntriesByType('navigation')[0], f = performance.getEntriesByName('first-contentful-paint')[0];
    ok({ responseStart: Math.round(n.responseStart), fcp: f ? Math.round(f.startTime) : null, net: !!document.querySelector('meta[name=x-net]') }); };
  if (performance.getEntriesByName('first-contentful-paint').length) done();
  else new PerformanceObserver((l, o) => { o.disconnect(); done(); }).observe({ type: 'paint', buffered: true });
}));

test('page navigation streams from the network: first paint does not wait for the whole page or the cache', async () => {
  const r = await openApp();
  const SLOW = 6000, cut = HTML.indexOf('<script>', HTML.indexOf('<body'));
  const marked = HTML.replace('<head>', '<head><meta name="x-net" content="1">'), at = cut + marked.length - HTML.length;
  let t0 = 0;
  pageBody = (req, res, h) => { t0 = Date.now(); res.writeHead(200, Object.assign(h, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' }));
    res.write(marked.slice(0, at)); setTimeout(() => res.end(marked.slice(at)), SLOW); };
  try {
    await r.page.goto(srv.origin + '/', { waitUntil: 'commit' });
    const t = await navTiming(r.page);
    console.log('# slow streamed page:', JSON.stringify(t));
    assert.equal(t.net, true, 'the network page, not the cached one after the 4 s fallback');
    assert.ok(t.responseStart < 1500, 'first byte ' + t.responseStart + ' ms');
    assert.ok(t.fcp != null && t.fcp < SLOW - 1000, 'first paint ' + t.fcp + ' ms, before the end of the page');
    await r.page.waitForSelector('#sbody .item', { timeout: SLOW + 10000 });
    // stored in the background once the whole body arrived
    await until(() => r.page.evaluate(() => caches.keys().then(async ks => (await (await caches.open(ks.find(k => k.startsWith('shell-')))).match('/')).text()).then(x => x.includes('x-net'))), 5000);
    assert.deepEqual(r.errors, []);
  } finally { pageBody = null; await r.ctx.close(); }
});

test('page navigation: no answer within 4 s gives the cached page; offline the cached page at once', async () => {
  const r = await openApp();
  const pending = [];
  pageBody = (req, res, h) => { pending.push(setTimeout(() => { res.writeHead(200, Object.assign(h, { 'Content-Type': 'text/html; charset=utf-8' })); res.end(HTML.replace('<head>', '<head><meta name="x-net" content="1">')); }, 8000)); };
  try {
    await r.page.goto(srv.origin + '/', { waitUntil: 'commit' });
    const t = await navTiming(r.page);
    console.log('# no answer for 8 s:', JSON.stringify(t));
    assert.equal(t.net, false, 'the cached page');
    assert.ok(t.responseStart >= 3800 && t.responseStart < 6000, 'fallback after ~4 s: ' + t.responseStart);
    await r.page.waitForSelector('#sbody .item');
    pageBody = null;
    await r.setOffline(true);
    await r.page.reload({ waitUntil: 'commit' });
    const o = await navTiming(r.page);
    assert.equal(o.net, false); assert.ok(o.responseStart < 1500, 'offline at once: ' + o.responseStart);
    await r.page.waitForSelector('#sbody .item');
  } finally { pageBody = null; pending.forEach(clearTimeout); await r.ctx.close(); }
});

test('update to a new build while the page stays open: no reload, old shell removed, data kept, app keeps working', async () => {
  const r = await openApp();
  await r.page.evaluate(() => { window.__same = 1; });
  await r.page.reload(); await r.page.waitForSelector('#sbody .item'); await r.page.waitForTimeout(500); // data cached through the worker
  await r.page.evaluate(() => { window.__same = 1; });
  const before = await cacheKeys(r.page);
  swBody = SW.replace(`const V = "${VER}"`, 'const V = "nextbuild000"');
  try {
    await r.page.evaluate(() => navigator.serviceWorker.getRegistration().then(g => g.update()));
    await r.page.waitForFunction(v => caches.keys().then(k => k.includes('shell-nextbuild000') && !k.includes('shell-' + v)), VER, { timeout: 20000, polling: 200 });
    assert.equal(await r.page.evaluate(() => window.__same), 1, 'the open page was not reloaded');
    const k = await cacheKeys(r.page);
    assert.deepEqual(k['data-1'], before['data-1'], 'data cache kept');
    await r.page.fill('#q', 'פיצה'); await r.page.waitForTimeout(400);
    assert.match(await r.page.textContent('#sSub'), /\d/, 'search still works');
    await r.setOffline(true);
    await r.page.reload(); await r.page.waitForSelector('#sbody .item');
    assert.deepEqual(r.errors, []);
    await r.ctx.close();
  } finally { swBody = null; }
});
