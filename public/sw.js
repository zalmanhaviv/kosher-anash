// Service worker (S2-2). scripts/build.py writes the version (a hash of every file of the build) and the precache list,
// so any change to the app, the data built into it, the map styles, the font or vendor/ installs a fresh copy.
// Caches: shell-<build> = this build's files (old ones are deleted on activate); data/map/tiles survive builds, so
// offline the app shows the newest data and map areas it has seen.
const V = '__BUILD__', PRE = __PRECACHE__;
const SHELL = 'shell-' + V, DATA = 'data-1', MAPX = 'map-1', TILES = 'tiles-1', KEEP = [SHELL, DATA, MAPX, TILES];
const MAX_TILES = 900, NAV_WAIT = 4000, META_WAIT = 5000;
const TILEJSON = 'https://tiles.openfreemap.org/planet';
const PRE_SET = new Set(PRE);
const EMPTY_PNG = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='), ch => ch.charCodeAt(0));

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    // revalidated (304 when unchanged), so files the page has just loaded are not downloaded twice
    await (await caches.open(SHELL)).addAll(PRE.map(u => new Request(u, { cache: 'no-cache' })));
    // the map's TileJSON, so a map opened offline finds its tiles; optional
    try { const r = await fetch(TILEJSON, { mode: 'cors' }); if (r.ok) await (await caches.open(MAPX)).put(TILEJSON, r); } catch {}
  })());
  // the open page keeps working: it already has its files, and nothing is reloaded (see activate)
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => !KEEP.includes(k)).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

const timeout = (p, ms) => Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error('timeout')), ms))]);
const okNet = r => fetch(r).then(res => res.ok ? res : Promise.reject(new Error('http ' + res.status)));

// tiles: trimmed to the MAX_TILES most recently stored every 40 new tiles (so never more than MAX_TILES + 40), oldest first
let added = 0, trimming = null;
function trimTiles() {
  if (++added < 40 || trimming) return; added = 0;
  trimming = (async () => { const c = await caches.open(TILES); const k = await c.keys(); for (const r of k.slice(0, Math.max(0, k.length - MAX_TILES))) await c.delete(r); })().finally(() => { trimming = null; });
}

// the page: from the network, but after NAV_WAIT on a weak connection (or offline) from the cache
async function page(e) {
  const c = await caches.open(SHELL);
  const net = okNet(e.request).then(async res => { if ((res.headers.get('content-type') || '').includes('text/html')) await c.put('/', res.clone()); return res; });
  e.waitUntil(net.catch(() => {}));
  const hit = await c.match('/') || await caches.match('/');
  try { return await (hit ? timeout(net, NAV_WAIT) : net); } catch { return hit || net; }
}

// this build's files: from its cache (same version = same bytes)
async function shell(r) {
  const c = await caches.open(SHELL);
  const hit = await c.match(r, { ignoreSearch: true });
  if (hit) return hit;
  try { const res = await fetch(r); if (res.ok) c.put(r, res.clone()); return res; }
  catch { return (await caches.match(r, { ignoreSearch: true })) || Response.error(); }
}

// live data (raw GitHub): meta.json from the network with a time limit, else the cached copy (stale while the network
// answer still updates the cache). The cached meta.json is advanced only together with places.json, so offline the
// app gets a meta.json whose rev matches the cached places.json, never a newer rev with older places.
const revOf = async r => { try { return r ? (await r.clone().json()).rev | 0 : 0; } catch { return 0; } };
async function data(e, r) {
  const c = await caches.open(DATA), u = new URL(r.url), key = u.origin + u.pathname, name = u.pathname.split('/').pop();
  const META = key.replace(/[^/]+$/, 'meta.json'), NEXT = META + '?next=1';
  if (name === 'meta.json') {
    const net = okNet(r).then(async res => { await c.put(NEXT, res.clone()); return res; });
    e.waitUntil(net.catch(() => {}));
    const hit = await c.match(META);
    try { return await (hit ? timeout(net, META_WAIT) : net); }
    catch { if (hit) { await c.delete(NEXT); return hit; } return fetch(r).catch(() => Response.error()); }
  }
  let res = null;
  try {
    res = await fetch(r);
    if (!res.ok) throw new Error('http ' + res.status);
    await c.put(key, res.clone());
    if (name === 'places.json') { const next = await c.match(NEXT); if (next) { await c.put(META, next); await c.delete(NEXT); } }
    return res;
  } catch {
    const hit = await c.match(key);
    if (!hit) return res || Response.error();
    // the page got a newer meta.json than the cached places.json: no older places for it, it keeps what it shows
    if (name === 'places.json' && await revOf(await c.match(NEXT)) > await revOf(await c.match(META))) return res || Response.error();
    return hit;
  }
}

// OpenFreeMap: tiles stale-while-revalidate (capped); TileJSON, glyphs and sprites the same in their own cache.
// Offline, a tile or glyph range never seen is answered empty: the map shows its background and the pins, no errors.
async function map(e, r, isTile) {
  const c = await caches.open(isTile ? TILES : MAPX);
  const hit = await c.match(r, { ignoreVary: true });
  const net = fetch(r).then(async res => { if (res.ok) { await c.put(r, res.clone()); if (isTile) trimTiles(); } return res; });
  if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
  try { return await net; } catch {
    const p = new URL(r.url).pathname;
    if (p.endsWith('.png') && isTile) return new Response(EMPTY_PNG, { headers: { 'content-type': 'image/png' } });
    if (p.endsWith('.pbf')) return new Response(new Uint8Array(0), { headers: { 'content-type': 'application/x-protobuf' } });
    return Response.error();
  }
}

self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin === location.origin) {
    if (r.mode === 'navigate' && (u.pathname === '/' || u.pathname === '/index.html')) return e.respondWith(page(e));
    if (PRE_SET.has(u.pathname)) return e.respondWith(shell(r));
    return e.respondWith(fetch(r).catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || Response.error())));
  }
  if (u.hostname === 'raw.githubusercontent.com') return e.respondWith(data(e, r));
  if (u.hostname === 'tiles.openfreemap.org') return e.respondWith(map(e, r, /\/\d+\/\d+\/\d+\.(pbf|png)$/.test(u.pathname)));
});
