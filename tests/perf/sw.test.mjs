// Service worker (public/sw.js as built by scripts/build.py) in local Chrome against a real HTTP server on localhost
// (a secure context, so the worker runs; the app itself registers it only on https, so the test registers it).
// Covers: precache of the build, offline start with the newest data, rev-consistent data cache, offline map answers,
// tile cache cap, and an update to a new build while a page stays open.
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
let B, srv, swBody = null;
before(async () => { B = await launch(); srv = await serve({ override: p => p === '/sw.js' && swBody != null ? swBody : null }); });
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
