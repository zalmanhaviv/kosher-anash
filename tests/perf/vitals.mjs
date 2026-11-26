// Load performance of the built dist/: phone 390x844 (DPR 1.75, touch), slow 4G (Lighthouse values: 562.5 ms RTT,
// 1.47 Mbit/s down, 675 kbit/s up) and 4x CPU slowdown through the Chrome DevTools Protocol; cold cache each run.
// Reports the median of RUNS (default 5): FCP, LCP, CLS (largest session window), TBT (FCP .. map ready + 2 s),
// list painted, map ready (first marker), bytes transferred. Outside hosts (tiles, GitHub raw) are answered locally
// and are therefore not throttled; the app's own files are.
// Run: python3 scripts/build.py && node tests/perf/vitals.mjs           (RUNS=5 OUT=file.json BUDGET=1 optional)
import { writeFileSync } from 'node:fs';
import { launch } from '../e2e/harness.mjs';
import { serve, routeOutside, vectorLayers } from './serve.mjs';

const RUNS = +(process.env.RUNS || 5);
export const SLOW4G = { offline: false, latency: 562.5, downloadThroughput: 1474560 / 8, uploadThroughput: 675000 / 8 };
export const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true, locale: 'he-IL', timezoneId: 'Asia/Jerusalem' };
// budget (docs/perf/stage2.md): a BUDGET=1 run fails above it. TBT varies a lot between runs on this machine
// (360-960 ms for the same build), so its budget is loose; LCP and CLS are the targets
export const BUDGET = { lcp: 2500, cls: 0.1, tbt: 1000 };

const OBS = () => {
  const V = window.__v = { lcp: 0, cls: 0, lt: [], fcp: 0, list: 0, map: 0 };
  new PerformanceObserver(l => { for (const e of l.getEntries()) V.lcp = e.renderTime || e.loadTime || e.startTime, V.lcpEl = (e.element && (e.element.id || e.element.className || e.element.tagName)) || ''; }).observe({ type: 'largest-contentful-paint', buffered: true });
  let win = 0, last = 0, first = 0;
  new PerformanceObserver(l => { for (const e of l.getEntries()) { if (e.hadRecentInput) continue;
    if (e.startTime - last > 1000 || e.startTime - first > 5000) { win = 0; first = e.startTime; } win += e.value; last = e.startTime; V.cls = Math.max(V.cls, win); } }).observe({ type: 'layout-shift', buffered: true });
  new PerformanceObserver(l => { for (const e of l.getEntries()) V.lt.push([e.startTime, e.duration]); }).observe({ type: 'longtask', buffered: true });
  new PerformanceObserver(l => { for (const e of l.getEntries()) if (e.name === 'first-contentful-paint') V.fcp = e.startTime; }).observe({ type: 'paint', buffered: true });
  const mo = new MutationObserver(() => {
    if (!V.list && document.querySelector('#sbody .item')) V.list = performance.now();
    if (!V.map && (document.querySelector('#map .maplibregl-marker') || (document.getElementById('svgmap') && !document.getElementById('svgmap').hasAttribute('hidden')))) { V.map = performance.now(); V.mapKind = document.querySelector('#map .maplibregl-marker') ? 'gl' : 'svg'; }
  });
  // the app's inline script renders the list before DOMContentLoaded, so check once there too
  addEventListener('DOMContentLoaded', () => { if (!V.list && document.querySelector('#sbody .item')) V.list = performance.now(); mo.observe(document.documentElement, { childList: true, subtree: true, attributes: true }); });
};

export async function runOnce(browser, origin, { path = '/', net = SLOW4G, cpu = 4, ctxOpts = {} } = {}) {
  const context = await browser.newContext(Object.assign({}, PHONE, ctxOpts));
  await routeOutside(context, { vlayers: vectorLayers() });
  await context.addInitScript(OBS);
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  if (net) await cdp.send('Network.emulateNetworkConditions', net);
  if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  let bytes = 0; const per = {};
  const urls = {};
  cdp.on('Network.responseReceived', e => { urls[e.requestId] = e.response.url; });
  cdp.on('Network.loadingFinished', e => { bytes += e.encodedDataLength; const u = urls[e.requestId] || ''; if (u.startsWith('http://localhost')) { const k = new URL(u).pathname; per[k] = (per[k] || 0) + e.encodedDataLength; } });
  await page.goto(origin + path, { waitUntil: 'load', timeout: 90000 });
  await page.waitForFunction(() => window.__v.map > 0, null, { timeout: 90000 }).catch(() => {});
  await page.waitForTimeout(2000);
  const v = await page.evaluate(() => { const V = window.__v; const end = (V.map || performance.now()) + 2000;
    const tbt = V.lt.filter(([s]) => s >= V.fcp && s <= end).reduce((a, [, d]) => a + Math.max(0, d - 50), 0);
    const nav = performance.getEntriesByType('navigation')[0];
    return { lt: V.lt.map(([s, d]) => [Math.round(s), Math.round(d)]), fcp: V.fcp, lcp: V.lcp, lcpEl: V.lcpEl, cls: V.cls, tbt, list: V.list, map: V.map, mapKind: V.mapKind, load: nav.loadEventEnd, fonts: [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family) }; });
  await context.close();
  return Object.assign(v, { bytes, per });
}

const med = a => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
export function summary(runs) {
  const o = {}; for (const k of ['fcp', 'lcp', 'cls', 'tbt', 'list', 'map', 'load', 'bytes']) o[k] = med(runs.map(r => r[k]));
  o.lcpEl = runs.map(r => r.lcpEl).sort().find(Boolean); o.longTasks = runs[0].lt; o.mapKind = runs[0].mapKind; o.per = runs[0].per; o.runs = runs.length;
  o.all = runs.map(r => ({ lcp: Math.round(r.lcp), cls: +r.cls.toFixed(3), tbt: Math.round(r.tbt), map: Math.round(r.map) }));
  return o;
}

if (import.meta.url === 'file://' + process.argv[1]) {
  const srv = await serve();
  const browser = await launch();
  const runs = [];
  for (let i = 0; i < RUNS; i++) { const r = await runOnce(browser, srv.origin); runs.push(r); console.error(`run ${i + 1}: LCP ${r.lcp.toFixed(0)} CLS ${r.cls.toFixed(3)} TBT ${r.tbt.toFixed(0)} map ${r.map.toFixed(0)} (${r.mapKind}) ${r.bytes} B`); }
  await browser.close(); await srv.close();
  const s = summary(runs);
  const out = JSON.stringify(s, null, 1);
  if (process.env.OUT) writeFileSync(process.env.OUT, out);
  console.log(out);
  if (process.env.BUDGET && (s.lcp > BUDGET.lcp || s.cls > BUDGET.cls || s.tbt > BUDGET.tbt)) { console.error('over budget', BUDGET); process.exit(1); }
}
