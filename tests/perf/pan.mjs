// Map frame time while panning with every marker of the current list on the map (default list, near me in Bnei Brak,
// the densest town). Drags the map with the mouse in steps and records requestAnimationFrame intervals.
// Scenes: zoom 15 (individual markers, street level) and zoom 12 (all of Gush Dan as individual markers).
// CPU=4 (default 1) slows the CPU like vitals.mjs. Rendering is software WebGL (SwiftShader), so the absolute numbers
// are pessimistic for a phone GPU; compare before/after on the same machine.
// Run: python3 scripts/build.py && node tests/perf/pan.mjs        (OUT=file.json optional)
import { writeFileSync } from 'node:fs';
import { launch } from '../e2e/harness.mjs';
import { serve, routeOutside, vectorLayers } from './serve.mjs';

const CPU = +(process.env.CPU || 1), RUNS = +(process.env.RUNS || 3);
const BB = { latitude: 32.084, longitude: 34.834 };

async function scene(page, label) {
  const box = await page.locator('#map').boundingBox();
  const cx = box.x + box.width / 2, cy = box.y + Math.min(box.height / 2, 260);
  const res = [];
  for (let i = 0; i < RUNS; i++) {
    await page.evaluate(() => { window.__f = []; let t = performance.now(); window.__on = true; const loop = now => { window.__f.push(now - t); t = now; if (window.__on) requestAnimationFrame(loop); }; requestAnimationFrame(loop); });
    await page.mouse.move(cx, cy); await page.mouse.down();
    const dx = i % 2 ? -1 : 1;
    for (let s = 1; s <= 60; s++) { await page.mouse.move(cx + dx * s * 2.5, cy + s * 1.5); await page.waitForTimeout(16); }
    await page.mouse.up(); await page.waitForTimeout(600);
    const f = await page.evaluate(() => { window.__on = false; return window.__f.slice(2); });
    res.push(...f);
  }
  const s = [...res].sort((a, b) => a - b), avg = res.reduce((a, b) => a + b, 0) / res.length;
  const markers = await page.$$eval('#map .maplibregl-marker', a => a.length), clusters = await page.$$eval('#map .cl', a => a.length);
  return { label, markers, clusters, frames: res.length, avg: +avg.toFixed(1), p50: +s[Math.floor(s.length * .5)].toFixed(1), p95: +s[Math.floor(s.length * .95)].toFixed(1), dropped: +(res.filter(x => x > 20).length / res.length).toFixed(2), longest: +s[s.length - 1].toFixed(0) };
}

const srv = await serve(); const browser = await launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'he-IL', timezoneId: 'Asia/Jerusalem', geolocation: BB, permissions: ['geolocation'], reducedMotion: 'reduce' });
await routeOutside(context, { vlayers: vectorLayers() });
const page = await context.newPage();
if (CPU > 1) { const cdp = await context.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU }); }
await page.goto(srv.origin + '/');
await page.waitForSelector('#map .maplibregl-marker', { timeout: 60000 });
await page.waitForTimeout(2500);
if (process.env.HIDE) await page.addStyleTag({ content: '#map .maplibregl-marker{display:none!important}' });
const out = [await scene(page, 'zoom 15, Bnei Brak')];
// zoom out to ~12 with the wheel over the map (markers stay individual above zoom 11.5)
const box = await page.locator('#map').boundingBox();
await page.mouse.move(box.x + box.width / 2, box.y + 260);
for (let i = 0; i < 30; i++) { await page.mouse.wheel(0, 100); await page.waitForTimeout(500);
  if (await page.$('#map .cl')) { await page.mouse.wheel(0, -100); await page.waitForTimeout(500); if (await page.$('#map .cl')) { await page.mouse.wheel(0, -100); } break; } }
await page.waitForTimeout(1500);
out.push(await scene(page, 'lowest zoom before town badges, Gush Dan'));
await context.close();
// whole country (no location): every place of the list drawn as town badges
{
  const c2 = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'he-IL', timezoneId: 'Asia/Jerusalem', reducedMotion: 'reduce' });
  await routeOutside(c2, { vlayers: vectorLayers() });
  const p2 = await c2.newPage();
  if (CPU > 1) { const cdp = await c2.newCDPSession(p2); await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU }); }
  await p2.goto(srv.origin + '/');
  await p2.waitForSelector('#map .cl', { timeout: 60000 }); await p2.waitForTimeout(2500);
  if (process.env.HIDE) await p2.addStyleTag({ content: '#map .maplibregl-marker{display:none!important}' });
  out.push(Object.assign(await scene(p2, 'country view, town badges'), { listed: await p2.$$eval('#map .cl', a => a.reduce((n, e) => n + (+e.textContent || 0), 0)) }));
  await c2.close();
}
await browser.close(); await srv.close();
const o = { cpu: CPU, scenes: out };
if (process.env.OUT) writeFileSync(process.env.OUT, JSON.stringify(o, null, 1));
console.log(JSON.stringify(o, null, 1));
