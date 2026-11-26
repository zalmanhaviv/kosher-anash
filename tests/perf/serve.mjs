// Static server for dist/ that behaves like the host: gzip for text, the '/*' headers of dist/_headers (CSP with the
// build's script hashes), Cache-Control per path, ETag/304. A real HTTP server (not request interception), so Chrome's
// network throttling and the service worker see real responses. Outside hosts are answered by routeOutside().
import http from 'node:http';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const DIST = process.env.DIST || join(ROOT, 'dist');
const TYPES = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.mjs':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json', '.webmanifest':'application/manifest+json', '.png':'image/png', '.woff2':'font/woff2', '.txt':'text/plain; charset=utf-8', '.md':'text/plain; charset=utf-8' };
const GZ = /^(text\/|application\/(json|manifest))/;

// Netlify-style _headers: path blocks, '*' as a prefix wildcard, every matching block applies
function headerRules(dist) {
  const rules = [];
  try {
    for (const blk of readFileSync(join(dist, '_headers'), 'utf8').split(/\n(?=\S)/)) {
      const [path, ...lines] = blk.split('\n'); const h = {};
      for (const l of lines) { const m = /^\s+([\w-]+):\s*(.*)$/.exec(l); if (m) h[m[1]] = m[2]; }
      rules.push({ path: path.trim(), h });
    }
  } catch {}
  return p => Object.assign({}, ...rules.filter(r => r.path.endsWith('*') ? p.startsWith(r.path.slice(0, -1)) : p === r.path).map(r => r.h));
}

// override(path) may return a Buffer/string to serve instead of the file (tests: a new sw.js for the update flow)
export function serve({ dist = DIST, port = 0, onRequest, override } = {}) {
  const hdr = headerRules(dist);
  const files = new Map(); // path -> { body, gz, etag, type } (read once; dist does not change while serving)
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (onRequest) onRequest(p, req);
    if (p.endsWith('/')) p += 'index.html';
    const ov = override && override(p);
    // a function answers the request itself (tests: slow or streamed responses), with this path's headers
    if (typeof ov === 'function') return ov(req, res, Object.assign({ 'Content-Type': TYPES[extname(p)] || 'application/octet-stream' }, hdr(p === '/index.html' ? '/' : p)));
    if (ov != null) { res.writeHead(200, Object.assign({ 'Content-Type': TYPES[extname(p)] || 'application/octet-stream' }, hdr(p))); return res.end(ov); }
    const f = join(dist, p);
    if (!f.startsWith(dist) || !existsSync(f) || !statSync(f).isFile()) { res.writeHead(404); return res.end('not found'); }
    let o = files.get(p);
    if (!o) { const body = readFileSync(f), type = TYPES[extname(f)] || 'application/octet-stream';
      o = { body, type, etag: '"' + crypto.createHash('sha1').update(body).digest('hex').slice(0, 16) + '"', gz: GZ.test(type) ? zlib.gzipSync(body, { level: 9 }) : null }; files.set(p, o); }
    const h = Object.assign({ 'Content-Type': o.type, 'ETag': o.etag, 'Cache-Control': 'public, max-age=0, must-revalidate' }, hdr(p === '/index.html' ? '/' : p));
    if (req.headers['if-none-match'] === o.etag) { res.writeHead(304, h); return res.end(); }
    const gz = o.gz && /gzip/.test(req.headers['accept-encoding'] || '');
    if (gz) { h['Content-Encoding'] = 'gzip'; h['Vary'] = 'Accept-Encoding'; }
    const body = gz ? o.gz : o.body; h['Content-Length'] = body.length;
    res.writeHead(200, h); res.end(req.method === 'HEAD' ? undefined : body);
  });
  return new Promise(r => server.listen(port, '127.0.0.1', () => r({ server, origin: 'http://localhost:' + server.address().port, close: () => new Promise(c => server.close(c)) })));
}

// a fully transparent 1x1 PNG
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
// OpenFreeMap and GitHub raw answered locally (empty tiles, the repo's data). Returns a counter of outside requests.
// live(name) may return a body (string/Buffer), null for 404 or 503 for a failure; default: the repo's data/ files
export async function routeOutside(context, { offline = () => false, vlayers = [], live = null } = {}) {
  const meta = readFileSync(join(ROOT, 'data/meta.json')), places = readFileSync(join(ROOT, 'data/places.json')), cities = readFileSync(join(ROOT, 'data/cities.json'));
  const n = { tiles: 0, raw: 0, other: [], urls: [] };
  await context.route(/^https:\/\//, route => {
    const u = new URL(route.request().url()); n.urls.push(u.href);
    if (offline()) return route.abort('internetdisconnected');
    if (u.hostname === 'tiles.openfreemap.org') { n.tiles++;
      if (u.pathname === '/planet') return route.fulfill({ contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ tilejson: '3.0.0', tiles: ['https://tiles.openfreemap.org/planet/t/{z}/{x}/{y}.pbf'], minzoom: 0, maxzoom: 14, vector_layers: vlayers }) });
      if (u.pathname.endsWith('.png')) return route.fulfill({ contentType: 'image/png', headers: { 'access-control-allow-origin': '*' }, body: PNG });
      if (u.pathname.endsWith('.json')) return route.fulfill({ contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{}' });
      return route.fulfill({ contentType: 'application/x-protobuf', headers: { 'access-control-allow-origin': '*' }, body: Buffer.alloc(0) });
    }
    if (u.hostname === 'raw.githubusercontent.com') { n.raw++;
      const name = u.pathname.split('/').pop(), body = live ? live(name) : { 'meta.json': meta, 'places.json': places, 'cities.json': cities }[name];
      if (body === 503) return route.fulfill({ status: 503, body: '' });
      return body ? route.fulfill({ contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body }) : route.fulfill({ status: 404, body: '' });
    }
    n.other.push(u.href); return route.abort();
  });
  return n;
}

export const vectorLayers = () => [...new Set(['light', 'dark'].flatMap(s => { try { return JSON.parse(readFileSync(join(ROOT, 'public/map-style', s + '.json'), 'utf8')).layers.map(l => l['source-layer']).filter(Boolean); } catch { return []; } }))].map(id => ({ id, fields: {} }));
