// Checks of scripts/build.py output and guards (no browser). Run after the build:
//   python3 scripts/build.py && node --test tests/perf/build.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import vm from 'node:vm';
import { DIST, ROOT } from './serve.mjs';

const html = readFileSync(join(DIST, 'index.html'), 'utf8');
const schema = JSON.parse(readFileSync(join(ROOT, 'data/schema.json'), 'utf8'));
const py = code => execFileSync('python3', ['-I', '-c', `import sys; sys.path.insert(0, ${JSON.stringify(join(ROOT, 'scripts'))}); import build\n${code}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

test('live-data gate: allowed values are exactly the schema enums', () => {
  const line = /const K_OK = [^\n]*;/.exec(html)[0];
  const c0 = {}; vm.runInNewContext(line.replace(/^const /, 'var '), c0); const c = JSON.parse(JSON.stringify(c0));
  const P = schema.$defs.place.properties, G = schema.$defs.g.properties;
  assert.deepEqual(c.K_OK, P.k.enum); assert.deepEqual(c.F_OK, P.f.enum); assert.deepEqual(c.T_OK, P.t.items.enum);
  assert.deepEqual(c.PREC_OK, G.prec.enum); assert.deepEqual(c.CLOSED_OK, G.closed.enum);
  assert.ok(!html.includes('/*SCHEMA*/'));
});

test('build stops when the template HC groups and the schema hc enum differ', () => {
  assert.throws(() => py(`import json; s = json.load(open(${JSON.stringify(join(ROOT, 'data/schema.json'))}))
s['$defs']['place']['properties']['hc']['enum'].append('new')
build.schema_consts(s, open(${JSON.stringify(join(ROOT, 'src/template.html'))}).read())`), /HC in src\/template.html/);
});

test('vendor files are pinned by sha256 in fetch_vendor.sh; a changed file stops the build', () => {
  const pins = JSON.parse(py('import json; print(json.dumps(build.vendor_pins()))'));
  for (const f of ['maplibre-gl.mjs', 'maplibre-gl-worker.mjs', 'maplibre-gl.css']) assert.match(pins[f], /^[0-9a-f]{64}$/, f);
  assert.ok('rtl-text.mjs' in pins);
  assert.throws(() => py(`import pathlib, tempfile, shutil
d = pathlib.Path(tempfile.mkdtemp()); (d / 'vendor').mkdir(); (d / 'scripts').mkdir(); (d / 'dist').mkdir()
shutil.copy(build.ROOT / 'scripts/fetch_vendor.sh', d / 'scripts')
(d / 'vendor' / 'maplibre-gl.mjs').write_text('tampered')
build.ROOT = d; build.copy_vendor(d / 'dist')`), /sha256 .* != pinned/);
});

test('no Assistant font: no fonts.css link, Rubik preloaded with a metric fallback', () => {
  assert.ok(!html.includes('/vendor/fonts.css'));
  assert.match(html, /<link rel="preload" href="\/fonts\/rubik.woff2" as="font" type="font\/woff2" crossorigin>/);
  assert.match(html, /font-family:"Rubik Fallback";src:local\("Arial"\)/);
  assert.ok(!existsSync(join(DIST, 'vendor/fonts.css')));
});

test('CSP: script hashes only, no unsafe-inline for scripts; sw.js not cached by HTTP', () => {
  const h = readFileSync(join(DIST, '_headers'), 'utf8');
  const s = /script-src([^;]*)/.exec(h)[1];
  assert.ok(!s.includes("'unsafe-inline'"));
  const n = [...html.matchAll(/<script>/g)].length;
  assert.equal((s.match(/'sha256-/g) || []).length, n);
  assert.match(h, /\/sw\.js\n\s+Cache-Control: no-cache/);
});

test('manifest: installable (name, start_url, standalone, 192/512 icons, maskable), shortcuts with icons', () => {
  const m = JSON.parse(readFileSync(join(DIST, 'manifest.webmanifest'), 'utf8'));
  for (const k of ['name', 'short_name', 'start_url', 'scope', 'id', 'display', 'background_color', 'theme_color', 'lang', 'dir']) assert.ok(m[k], k);
  assert.equal(m.display, 'standalone');
  const sizes = m.icons.map(i => i.sizes + ':' + (i.purpose || 'any'));
  for (const s of ['192x192:any', '512x512:any', '512x512:maskable']) assert.ok(sizes.includes(s), s);
  for (const i of m.icons) assert.ok(existsSync(join(DIST, i.src)), i.src);
  assert.ok(m.shortcuts.length >= 2 && m.shortcuts.every(s => s.url.startsWith('/') && s.icons.every(i => existsSync(join(DIST, i.src)))));
  // the page's light theme-color matches the manifest (dark comes from the media meta in the page)
  assert.match(html, new RegExp(`<meta name="theme-color" content="${m.theme_color}" media="\\(prefers-color-scheme: light\\)">`, 'i'));
});
