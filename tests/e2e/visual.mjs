// Visual regression: four fixed screens (clock frozen Tuesday 1.12.2026 12:30 Israel, blank map tiles, reduced motion).
//   node tests/e2e/visual.mjs            compare with tests/visual/baseline/*.png (writes diffs to tests/visual/out/)
//   node tests/e2e/visual.mjs --update   write a new baseline
// Not in CI: the map is drawn by WebGL (SwiftShader) and fonts are rasterised by the local Chrome, so pixels differ
// between machines. Compare on the same machine that made the baseline. Threshold: 0.5% of pixels.
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { launch, open, mapReady, TUE, ROOT } from './harness.mjs';

const BASE = join(ROOT, 'tests/visual/baseline'), OUT = join(ROOT, 'tests/visual/out');
const UPDATE = process.argv.includes('--update');
const PHONE = { width: 390, height: 844 }, DESK = { width: 1280, height: 800 };
const SHOTS = [
  ['phone-light-list', '/', { viewport: PHONE, mobile: true }],
  ['phone-dark-list', '/', { viewport: PHONE, mobile: true, dark: true }],
  ['phone-light-card', '/?p=565847f', { viewport: PHONE, mobile: true }],
  ['phone-dark-card', '/?p=565847f', { viewport: PHONE, mobile: true, dark: true }],
  ['desktop-light', '/', { viewport: DESK }],
  ['desktop-dark-card', '/?p=347ac19', { viewport: DESK, dark: true }],
];

const b = await launch(); mkdirSync(BASE, { recursive: true }); mkdirSync(OUT, { recursive: true });
let failed = 0;
for (const [name, path, o] of SHOTS) {
  const r = await open(b, path, { ...o, time: TUE, reduced: true });
  await mapReady(r.page); await r.page.evaluate(() => document.fonts.ready); await r.page.waitForTimeout(1200);
  const png = await r.page.screenshot({ animations: 'disabled', caret: 'hide' });
  const f = join(BASE, name + '.png');
  if (UPDATE || !existsSync(f)) { writeFileSync(f, png); console.log('baseline', name); await r.ctx.close(); continue; }
  // pixel diff inside the browser (no extra npm packages)
  const res = await r.page.evaluate(async ([a, c]) => {
    const img = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = 'data:image/png;base64,' + src; });
    const [A, C] = await Promise.all([img(a), img(c)]);
    if (A.width !== C.width || A.height !== C.height) return { ratio: 1, size: true };
    const cv = document.createElement('canvas'); cv.width = A.width; cv.height = A.height; const x = cv.getContext('2d');
    x.drawImage(A, 0, 0); const da = x.getImageData(0, 0, A.width, A.height).data;
    x.clearRect(0, 0, A.width, A.height); x.drawImage(C, 0, 0); const dc = x.getImageData(0, 0, A.width, A.height);
    let n = 0; for (let i = 0; i < da.length; i += 4) { const d = Math.abs(da[i] - dc.data[i]) + Math.abs(da[i + 1] - dc.data[i + 1]) + Math.abs(da[i + 2] - dc.data[i + 2]); if (d > 40) { n++; dc.data[i] = 255; dc.data[i + 1] = 0; dc.data[i + 2] = 255; } }
    x.putImageData(dc, 0, 0);
    return { ratio: n / (A.width * A.height), diff: cv.toDataURL('image/png').split(',')[1] };
  }, [readFileSync(f).toString('base64'), png.toString('base64')]);
  const ok = res.ratio <= 0.005;
  console.log(ok ? 'ok  ' : 'DIFF', name, (res.ratio * 100).toFixed(2) + '%');
  if (!ok) { failed++; writeFileSync(join(OUT, name + '.png'), png); if (res.diff) writeFileSync(join(OUT, name + '.diff.png'), Buffer.from(res.diff, 'base64')); }
  await r.ctx.close();
}
await b.close();
process.exit(failed ? 1 : 0);
