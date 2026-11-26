// End-to-end tests of the built app (dist/) in local Chrome, fully offline.
// Run: python3 scripts/build.py && node --test --test-concurrency=1 tests/e2e/app.e2e.mjs
// Clock frozen: Tuesday 1.12.2026 12:30 / 23:30 and Friday 27.11.2026 12:00 (Israel).
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { launch, open, mapReady, vendorPresent, DATA, META, CITIES, L, il, TUE, FRI, TUE_NIGHT, wall, km, cityLL, LLof, nPl, ORIGIN, APPLIED_HEADERS } from './harness.mjs';

const PHONE = { width: 390, height: 844 }, DESK = { width: 1280, height: 800 };
const HC = { chabad: 'חב״ד', eda: 'העדה החרדית', landa: 'לנדא', products: 'מוצרי העדה/לנדא' };
const hay = p => L.normText([p.n, p.s, p.c, p.h, p.f, p.tt, HC[p.hc]].join(' '));
const restaurants = DATA.filter(p => p.k.startsWith('מסעדה'));
const st = (p, t) => L.statusAt(p, wall(t), false);
const search = q => { const terms = L.normText(q).split(' ').filter(Boolean); return restaurants.filter(p => terms.every(t => hay(p).includes(t))); };
const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

let B; const opened = [];
before(async () => { B = await launch(); });
after(async () => { await B.close(); });
async function go(path, opts) { const r = await open(B, path, opts); opened.push(r); return r; }
async function done(r, { allowNetErrors = false } = {}) {
  const errs = r.log.errors.filter(e => !(allowNetErrors && /Failed to load resource/.test(e)));
  assert.deepEqual(errs, [], 'console/page errors');
  assert.deepEqual(r.log.external, [], 'requests to hosts other than the app, OpenFreeMap and GitHub raw');
  await r.ctx.close();
}
const sub = page => page.textContent('#sSub');
const title = page => page.textContent('#sTitle');
const names = page => page.$$eval('#sbody .item .nm', a => a.map(x => x.textContent));
async function typeQ(page, q) { const before = await sub(page); await page.fill('#q', q); await page.waitForFunction(b => document.getElementById('sSub').textContent !== b || true, before); await page.waitForTimeout(350); }
// a tap on the grabber moves the phone sheet from peek to half, so rows are on screen
const halfSheet = page => page.click('#shead', { position: { x: 195, y: 10 } });

// ---------- layout / a11y probes (run inside the page) ----------
const overflowProbe = () => {
  const out = [], vw = innerWidth;
  const se = document.scrollingElement; if (se.scrollWidth > vw + 1) out.push('document scrollWidth ' + se.scrollWidth + ' > ' + vw);
  for (const root of [document.getElementById('sbody'), document.getElementById('dlg'), document.querySelector('.sbar')]) {
    if (!root || root.getBoundingClientRect().width === 0) continue;
    if (root.scrollWidth > root.clientWidth + 1) out.push((root.id || root.className) + ' scrollWidth ' + root.scrollWidth + ' > ' + root.clientWidth);
    const rr = root.getBoundingClientRect();
    for (const el of root.querySelectorAll('*')) {
      if (el.closest('.recent,.chips') && el !== root) continue; // deliberate side scrollers
      const r = el.getBoundingClientRect(); if (!r.width) continue;
      if (r.right > rr.right + 1 || r.left < rr.left - 1) out.push((el.className || el.tagName) + ' [' + Math.round(r.left) + ',' + Math.round(r.right) + '] outside ' + (root.id || root.className));
    }
  }
  return [...new Set(out)].slice(0, 15);
};
const tapProbe = () => {
  const out = [];
  for (const el of document.querySelectorAll('button, a[href], input, select, [role=button], [tabindex]:not([tabindex="-1"])')) {
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none' || el.closest('[hidden]')) continue;
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
    if (r.bottom <= 0 || r.top >= innerHeight || r.right <= 0 || r.left >= innerWidth) continue; // off screen
    // what a finger hits: the element unless it is covered at its centre
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); if (!hit || !(el === hit || el.contains(hit))) continue;
    if (r.width < 43.5 || r.height < 43.5) out.push({ el: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ').join('.') : ''), text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30), w: Math.round(r.width), h: Math.round(r.height), inAttr: !!el.closest('.attr') });
  }
  return out;
};

// ================= load =================
describe('load', () => {
  test('phone light: list, counts, map, no errors, CSP applied', async () => {
    const r = await go('/', { viewport: PHONE, mobile: true, time: TUE });
    const { page } = r;
    assert.ok(APPLIED_HEADERS['Content-Security-Policy'], 'CSP from dist/_headers applied in the harness');
    assert.equal(await title(page), 'מקומות כשרים');
    assert.equal(await sub(page), nPl(restaurants.length));
    assert.equal(await page.locator('#sbody .item').count(), 40, 'first page of 40 rows');
    assert.match(await page.textContent('#more'), /עוד 40 מקומות/);
    assert.ok(await page.isVisible('#ctaGps') && await page.isVisible('#ctaCity'), 'near-me / town card');
    const mode = await mapReady(page);
    assert.equal(mode, vendorPresent() ? 'gl' : 'svg');
    assert.match(await page.textContent('.foot'), /עודכן לאחרונה ב־25 בנובמבר 2026/);
    await page.click('#more'); assert.equal(await page.locator('#sbody .item').count(), 80);
    await done(r);
  });
  test('desktop 1280: side panel, list visible', async () => {
    const r = await go('/', { viewport: DESK, time: TUE });
    const box = await r.page.locator('#sheet').boundingBox();
    assert.ok(box.width <= 410 && box.x > 800, 'panel on the right: ' + JSON.stringify(box));
    assert.ok(await r.page.isVisible('#sbody .item'));
    await mapReady(r.page);
    await done(r);
  });
  test('device time zone does not change statuses (New York phone)', async () => {
    const r = await go('/', { viewport: PHONE, time: TUE, tz: 'America/New_York' });
    const n = restaurants.filter(p => /[ys]/.test(st(p, TUE).s)).length;
    assert.equal(await r.page.textContent('#cOpenT'), 'פתוח עכשיו · ' + n);
    await done(r);
  });
});

// ================= search =================
describe('search (normText)', () => {
  const cases = [['פיצה', 'פיצא'], ['שווארמה', 'שוורמה'], ['פיצה', 'pizza'], ['פלאפל', 'falafel'], ['שלום', 'שלומ'], ['מטעמים', 'מטעמימ'], ['ביגל', 'בייגל']];
  test('Hebrew spelling variants, final letters and English give the same results as normText', async () => {
    const r = await go('/', { viewport: PHONE, mobile: true, time: TUE });
    for (const [a, b] of cases) {
      const exp = search(a);
      assert.ok(exp.length > 0, 'data has results for ' + a);
      assert.equal(search(b).length, exp.length, `normText: ${b} = ${a}`);
      await typeQ(r.page, b);
      assert.equal(await sub(r.page), nPl(exp.length), `UI count for "${b}"`);
    }
    await typeQ(r.page, 'קקקזזז');
    assert.match(await r.page.textContent('#sbody'), /לא נמצאו מקומות/);
    await r.page.click('#clr'); assert.equal(await r.page.inputValue('#q'), '');
    assert.equal(await sub(r.page), nPl(restaurants.length));
    await done(r);
  });
  test('multi-word search across name and town', async () => {
    const r = await go('/', { viewport: PHONE, time: TUE });
    const exp = search('פיצה צפת'); assert.ok(exp.length > 0);
    await typeQ(r.page, 'פיצה צפת');
    assert.equal(await sub(r.page), nPl(exp.length));
    for (const n of await names(r.page)) assert.ok(exp.some(p => p.n === n), n);
    await done(r);
  });
});

// ================= chips =================
describe('chips', () => {
  for (const [label, t] of [['Tuesday 12:30', TUE], ['Friday 12:00', FRI]]) {
    test('פתוח עכשיו count and filter – ' + label, async () => {
      const r = await go('/', { viewport: PHONE, mobile: true, time: t });
      const openN = restaurants.filter(p => /[ys]/.test(st(p, t).s)).length;
      assert.equal(await r.page.textContent('#cOpenT'), 'פתוח עכשיו · ' + openN);
      await r.page.click('#cOpen');
      assert.equal(await r.page.getAttribute('#cOpen', 'aria-pressed'), 'true');
      const shown = restaurants.filter(p => !/[nx]/.test(st(p, t).s)), noInfo = shown.filter(p => st(p, t).s === 'u').length;
      // the header says how many are open (the same number as the chip) and how many have no hours (S2-1, P1-10)
      assert.equal(await sub(r.page), `${openN} פתוחים` + (noInfo ? ` · ${noInfo} בלי מידע על שעות` : ''));
      assert.equal(openN + noInfo, shown.length);
      // open places first (r=0), then 'opens soon', then no-info
      const first = await r.page.$$eval('#sbody .item .l3 [class^="st-"]', a => a.slice(0, 5).map(x => x.className));
      assert.ok(first.every(c => /st-[ys]/.test(c)), first.join());
      await done(r);
    });
  }
  test('פתוח בשישי: hidden on Tuesday, on Friday lists Friday hours, latest close first', async () => {
    const r1 = await go('/', { viewport: PHONE, time: TUE });
    assert.equal(await r1.page.isVisible('#cFri'), false); await done(r1);
    const r = await go('/', { viewport: PHONE, mobile: true, time: FRI });
    assert.ok(await r.page.isVisible('#cFri'));
    await r.page.click('#cFri');
    assert.equal(await title(r.page), 'פתוח בשישי');
    const exp = restaurants.filter(p => st(p, FRI).s !== 'x' && (L.friRanges(p).length || p.f === 'אוכל לשבת' || p.k === 'אוכל לשבת'));
    assert.equal(await sub(r.page), nPl(exp.length));
    const sts = await r.page.$$eval('#sbody .item .l3 [class^="st-"]', a => a.map(x => x.textContent));
    assert.match(sts[0], /^בשישי /);
    assert.equal(await r.page.getAttribute('#cOpen', 'aria-pressed'), 'false');
    await done(r);
  });
  test('food type and meat/dairy chips', async () => {
    const r = await go('/', { viewport: PHONE, time: TUE });
    await r.page.click('.chip[data-f="פיצה"]');
    assert.equal(await sub(r.page), nPl(restaurants.filter(p => p.f === 'פיצה').length));
    await r.page.click('.chip[data-t="חלבי"]');
    assert.equal(await sub(r.page), nPl(restaurants.filter(p => p.f === 'פיצה' && p.t.includes('חלבי')).length));
    await r.page.click('.chip[data-f="פיצה"]'); await r.page.click('.chip[data-t="חלבי"]');
    await r.page.click('.chip[data-t="בשרי"]');
    assert.equal(await sub(r.page), nPl(restaurants.filter(p => p.t.includes('בשרי')).length));
    assert.equal(await r.page.getAttribute('.chip[data-t="בשרי"]', 'aria-pressed'), 'true');
    await done(r);
  });
  test('kashrut sheet: options, count on the button, badge, Esc returns focus', async () => {
    const r = await go('/', { viewport: PHONE, mobile: true, time: TUE });
    await r.page.focus('#fBtn'); await r.page.keyboard.press('Enter');
    await r.page.waitForSelector('#dlg.on');
    assert.equal(await r.page.evaluate(() => document.activeElement.tagName), 'H3', 'focus moves into the sheet');
    await r.page.keyboard.press('Escape');
    assert.equal(await r.page.evaluate(() => document.activeElement.id), 'fBtn', 'Esc without a choice returns focus');
    await r.page.click('#fBtn'); await r.page.waitForSelector('#dlg.on');
    const opts = await r.page.$$eval('#dlg [data-hc]', a => a.map(x => x.textContent.trim()));
    assert.deepEqual(opts, Object.values(HC));
    await r.page.click('#dlg [data-hc="chabad"]');
    const n = restaurants.filter(p => p.hc === 'chabad').length;
    assert.equal((await r.page.textContent('#fOk')).trim(), `הצגת ${n} מקומות`);
    assert.equal(await r.page.textContent('#fN'), '1');
    // every row shows the kashrut text exactly as in the source list
    for (const k of await r.page.$$eval('#sbody .item .kh', a => a.map(x => x.textContent))) assert.ok(DATA.some(p => p.hc === 'chabad' && p.h === k), k);
    await r.page.click('#fOk');
    assert.equal(await r.page.evaluate(() => document.getElementById('dlg').classList.contains('on')), false);
    assert.equal(await sub(r.page), nPl(n));
    await done(r);
  });
});

// ================= fixed stage-1 bugs (docs/qa/stage1.md, REVIEW-stage1) – regression guards (S1-9) =================
describe('stage 1 fixes', () => {
  // the sheet title / card back button must be what a finger hits at full height, on a common and a small phone
  for (const vp of [PHONE, { width: 360, height: 640 }]) {
    test(`QA1-1 ${vp.width}x${vp.height}, sheet at full height: title and "חזרה לרשימה" are not under the search/chips bar`, async () => {
      const r = await go('/', { viewport: vp, mobile: true, time: TUE });
      const { page } = r;
      const hitOk = sel => page.evaluate(s => { const e = document.querySelector(s), t = e.getBoundingClientRect(); const h = document.elementFromPoint(t.left + t.width / 2, t.top + t.height / 2); return { ok: !!h && (h === e || e.contains(h)), top: Math.round(t.top), bar: Math.round(document.querySelector('.topbar').getBoundingClientRect().bottom) }; }, sel);
      await page.evaluate(() => { document.getElementById('sbody').scrollTop = 10; }); await page.waitForTimeout(500); // the app snaps to full
      const t = await hitOk('#sTitle'); assert.ok(t.ok && t.top >= t.bar, 'title ' + JSON.stringify(t));
      await page.click('#sbody .item'); await page.waitForSelector('.det');
      await page.evaluate(() => { document.getElementById('sbody').scrollTop = 10; }); await page.waitForTimeout(500);
      const b = await hitOk('#back'); assert.ok(b.ok && b.top >= b.bar, 'back ' + JSON.stringify(b));
      await page.click('#back'); await page.waitForSelector('#sbody .item');
      await done(r);
    });
  }
  test('QA1-1 offline bar makes the top bar taller: full sheet still starts below it', async () => {
    const r = await go('/', { viewport: PHONE, mobile: true, time: TUE });
    const { page } = r;
    await r.ctx.setOffline(true); await page.waitForSelector('#offl:not([hidden])');
    await page.evaluate(() => { document.getElementById('sbody').scrollTop = 10; }); await page.waitForTimeout(500);
    const g = await page.evaluate(() => ({ sheet: document.getElementById('sheet').getBoundingClientRect().top, bar: document.querySelector('.topbar').getBoundingClientRect().bottom }));
    assert.ok(g.sheet >= g.bar, JSON.stringify(g));
    await r.ctx.setOffline(false);
    await done(r, { allowNetErrors: true });
  });
  test('QA1-2 filter sheet: focus returns to the filter button after a choice (Esc and "הצגה")', async () => {
    const r = await go('/', { viewport: DESK, time: TUE });
    const { page } = r;
    await page.focus('#fBtn'); await page.keyboard.press('Enter'); await page.waitForSelector('#dlg.on');
    await page.focus('#dlg [data-hc="chabad"]'); await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => document.activeElement.dataset.hc), 'chabad', 'focus stays on the chosen option after the re-render');
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'fBtn', 'after Esc');
    await page.keyboard.press('Enter'); await page.waitForSelector('#dlg.on');
    await page.focus('#dlg [data-hc="chabad"]'); await page.keyboard.press('Enter');
    await page.focus('#fOk'); await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'fBtn', 'after "הצגה"');
    await done(r);
  });
  test('QA1-3 open sheet keeps focus inside (aria-modal); closed sheet is inert', async () => {
    const r = await go('/', { viewport: DESK, time: TUE });
    const { page } = r;
    assert.equal(await page.evaluate(() => document.getElementById('dlg').inert), true, 'inert before the first opening');
    await page.focus('#fBtn'); await page.keyboard.press('Enter'); await page.waitForSelector('#dlg.on');
    await page.keyboard.press('Shift+Tab'); // from the heading, backwards
    assert.ok(await page.evaluate(() => !!document.activeElement.closest('#dlg')), 'Shift+Tab stays in the dialog');
    for (let i = 0; i < 40; i++) await page.keyboard.press('Tab');
    assert.ok(await page.evaluate(() => !!document.activeElement.closest('#dlg')), 'Tab cycles inside the dialog');
    await page.keyboard.press('Escape');
    const hidden = await page.evaluate(() => [...document.querySelectorAll('#dlg button, #dlg select')].filter(e => !e.disabled && !e.closest('[inert]') && getComputedStyle(e).visibility !== 'hidden').length);
    assert.equal(hidden, 0, 'no focusable controls in the closed dialog');
    await page.keyboard.press('Tab');
    assert.ok(await page.evaluate(() => !document.activeElement.closest('#dlg')), 'Tab after closing does not land in the dialog');
    await done(r);
  });
  test('QA1-4 every dialog is named by its own heading', async () => {
    const r = await go('/', { viewport: PHONE, time: TUE });
    const { page } = r;
    const name = () => page.evaluate(() => { const d = document.getElementById('dlg'); return d.getAttribute('aria-label') || (document.getElementById(d.getAttribute('aria-labelledby')) || {}).textContent; });
    for (const [open, exp] of [['#fBtn', 'סינון'], ['#cWhen', 'מתי רוצים להגיע?'], ['#ctaCity', 'באיזה ישוב?']]) {
      await page.click(open); await page.waitForSelector('#dlg.on');
      assert.equal(await name(), exp);
      await page.keyboard.press('Escape'); await page.waitForFunction(() => !document.getElementById('dlg').classList.contains('on'));
    }
    await done(r);
  });
  test('QA1-5 closing a card right after the map loads throws no error', { skip: !vendorPresent() && 'needs the GL map' }, async () => {
    const r = await go('/?p=347ac19', { viewport: PHONE, time: TUE });
    const { page } = r;
    // the first marker is drawn inside the map 'load' handler, which also schedules panTo(PLACES[sel]) 50 ms later
    await page.evaluate(() => new Promise(res => { const o = new MutationObserver(() => { if (document.querySelector('#map .maplibregl-marker')) { o.disconnect(); document.getElementById('back').click(); res(); } }); o.observe(document.getElementById('map'), { childList: true, subtree: true }); }));
    await page.waitForTimeout(300);
    await done(r);
  });
  test('QA1-6 footer e-mail link is at least 44px tall', async () => {
    const r = await go('/', { viewport: PHONE, mobile: true, time: TUE });
    const h = await r.page.evaluate(() => document.querySelector('.foot a').getBoundingClientRect().height);
    assert.ok(h >= 44, 'height ' + h);
    await done(r);
  });
  for (const vp of [PHONE, DESK]) {
    test(`QA1-7 ${vp.width}px, country zoom: town clusters do not overlap`, { skip: !vendorPresent() && 'needs the GL map' }, async () => {
      const r = await go('/', { viewport: vp, mobile: vp === PHONE, time: TUE });
      await mapReady(r.page); await r.page.waitForTimeout(300);
      const res = await r.page.evaluate(() => {
        const bs = [...document.querySelectorAll('#map .cl')].map(e => ({ r: e.getBoundingClientRect(), n: +e.textContent }));
        const hits = [];
        for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) { const a = bs[i].r, b = bs[j].r; if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) hits.push([bs[i].n, bs[j].n]); }
        return { n: bs.length, total: bs.reduce((s, b) => s + b.n, 0), hits };
      });
      assert.ok(res.n > 3, 'clusters drawn: ' + res.n);
      assert.deepEqual(res.hits, [], 'overlapping clusters');
      assert.equal(res.total, DATA.filter(p => p.k.startsWith('מסעדה') && CITIES[p.c] && L.statusAt(p, wall(TUE), false).s !== 'x').length, 'merged clusters keep every place');
      await done(r);
    });
  }
  test('REVIEW-2 list rows show the kashrut text in full (wraps, never cut)', async () => {
    const r = await go('/', { viewport: PHONE, mobile: true, time: TUE });
    await halfSheet(r.page); await r.page.click('#more'); await r.page.click('#more');
    const cut = await r.page.$$eval('#sbody .item .kh', a => a.filter(k => k.scrollWidth > k.clientWidth + 1 || getComputedStyle(k).textOverflow === 'ellipsis').map(k => k.textContent));
    assert.deepEqual(cut, []);
    await done(r);
  });
  test('REVIEW-3 SVG fallback map follows the dark tokens (and switches live)', async () => {
    const r = await go('/', { viewport: PHONE, dark: true, time: TUE });
    await r.ctx.route('**/vendor/maplibre-gl.mjs', x => x.fulfill({ status: 404, body: '' }));
    await r.page.reload(); await r.page.waitForSelector('#sbody .item');
    await r.page.waitForFunction(() => !document.getElementById('svgmap').hasAttribute('hidden'), null, { timeout: 15000 });
    const col = () => r.page.evaluate(() => { const t = n => { const d = document.createElement('div'); d.style.color = `var(${n})`; document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c; };
      return { land: getComputedStyle(document.querySelector('#svgmap polygon')).fill, mapBg: t('--map-bg'), dot: getComputedStyle(document.querySelector('#svgmap circle')).fill, brand: t('--brand'), raw: document.getElementById('svgmap').innerHTML.match(/#[0-9a-f]{3,6}\b|Assistant/gi) }; });
    const d = await col();
    assert.equal(d.land, d.mapBg); assert.equal(d.dot, d.brand); assert.equal(d.raw, null, 'no hard-coded colours or old font');
    await r.page.emulateMedia({ colorScheme: 'light' });
    const l = await col();
    assert.equal(l.land, l.mapBg); assert.notEqual(l.land, d.land, 'light differs from dark');
    await done(r, { allowNetErrors: true });
  });
  test('REVIEW-3 GL map: style switches live with the system colour scheme', { skip: !vendorPresent() && 'needs the GL map' }, async () => {
    const r = await go('/', { viewport: PHONE, time: TUE });
    await mapReady(r.page);
    assert.ok(r.log.req.some(u => u.endsWith('/map-style/light.json')));
    assert.ok(!r.log.req.some(u => u.endsWith('/map-style/dark.json')));
    await r.page.emulateMedia({ colorScheme: 'dark' });
    await r.page.waitForFunction(() => document.querySelector('#map .maplibregl-marker'), null, { timeout: 5000 });
    await r.page.waitForTimeout(800);
    assert.ok(r.log.req.some(u => u.endsWith('/map-style/dark.json')), 'dark style requested after the switch');
    await done(r);
  });
  test('theme-color: light and dark values by media query; no inline Assistant font', async () => {
    const r = await go('/', { viewport: PHONE, time: TUE });
    const m = await r.page.$$eval('meta[name="theme-color"]', a => a.map(x => [x.getAttribute('media'), x.content]));
    assert.deepEqual(m, [['(prefers-color-scheme: light)', '#F6F7F9'], ['(prefers-color-scheme: dark)', '#0F1114']]);
    await r.page.click('#sbody .item'); await r.page.waitForSelector('.det');
    assert.equal(await r.page.$$eval('[style*="Assistant"]', a => a.length), 0);
    await done(r);
  });
  test('list row second line is "type · address"', async () => {
    const r = await go('/', { viewport: PHONE, time: TUE });
    await typeQ(r.page, 'כמיסה');
    const id = await r.page.$eval('#sbody .item', e => +e.dataset.id);
    const l2 = await r.page.$eval('#sbody .item .l2', e => e.textContent);
    const nm = await r.page.$eval('#sbody .item .nm', e => e.textContent);
    const place = DATA.find(x => x.n === nm);
    assert.equal(l2, [place.f, [place.s, place.c].filter(Boolean).join(', ')].filter(Boolean).join(' · '), 'row ' + id);
    await done(r);
  });
});

// ================= town / near =================
describe('town and near', () => {
  test('town from the card: same-town first, then within 12 km; kept after reload', async () => {
    const r = await go('/', { viewport: PHONE, mobile: true, time: TUE });
    await r.page.click('#ctaCity'); await r.page.selectOption('#cSel', 'צפת'); await r.page.click('#cOk');
    assert.equal(await title(r.page), 'צפת והסביבה');
    const c = cityLL('צפת');
    const exp = restaurants.filter(p => p.c === 'צפת' || (LLof(p) && km(c, LLof(p)) <= 12));
    assert.equal(await sub(r.page), nPl(exp.length));
    const heads = await r.page.$$eval('#sbody .sec-h', a => a.map(x => x.textContent));
    assert.equal(heads[0], 'בצפת');
    if (exp.some(p => p.c !== 'צפת')) assert.ok(heads.includes('בסביבה · המרחק ממרכז צפת'), heads.join('|'));
    await r.page.reload(); await r.page.waitForSelector('#sbody .item');
    assert.equal(await title(r.page), 'צפת והסביבה', 'town kept');
    await done(r);
  });
  test('near me (permission granted): sorted by distance, bands, position never stored', async () => {
    const geo = { latitude: 32.0805, longitude: 34.8338 }; // Bnei Brak
    const r = await go('/', { viewport: PHONE, mobile: true, time: TUE, geo });
    await r.page.waitForFunction(() => document.getElementById('sTitle').textContent === 'קרוב אליך');
    const heads = await r.page.$$eval('#sbody .sec-h', a => a.map(x => x.textContent));
    assert.ok(heads.includes('במרחק הליכה'), heads.join('|'));
    const ds = await r.page.$$eval('#sbody .item', a => a.map(x => +x.dataset.id));
    assert.ok(ds.length > 5);
    const ls = await r.page.evaluate(() => JSON.stringify(localStorage));
    assert.ok(!ls.includes('32.08') && !ls.includes('34.83'), 'no coordinates in localStorage');
    await done(r);
  });
  test('?near=1 without permission: list still works and a message explains', async () => {
    const r = await go('/?near=1', { viewport: PHONE, time: TUE });
    await r.page.waitForFunction(() => /אין הרשאת מיקום|לא הצלחנו לאתר מיקום/.test(document.getElementById('toast').textContent), null, { timeout: 12000 });
    assert.equal(await title(r.page), 'מקומות כשרים');
    assert.equal(await r.page.evaluate(() => location.search), '', 'query string cleared');
    await done(r);
  });
});

// ================= list -> card -> back, favourites, recent =================
describe('card, favourites, recent', () => {
  test('list -> card -> back, Esc closes, favourite and recent persist', async () => {
    const r = await go('/', { viewport: PHONE, mobile: true, time: TUE });
    const { page } = r; await mapReady(page);
    await typeQ(page, 'כמיסה');
    const nm = (await names(page))[0];
    await page.click('#sbody .item');
    await page.waitForSelector('.det');
    assert.equal(await page.textContent('.det h3'), nm);
    assert.equal(await page.getAttribute('#fav', 'aria-pressed'), 'false');
    await page.click('#fav');
    assert.equal(await page.getAttribute('#fav', 'aria-pressed'), 'true');
    assert.match(await page.textContent('#toast'), /נשמר ברשימה שלי/);
    await page.click('#back');
    await page.waitForSelector('#sbody .item');
    await page.fill('#q', ''); await page.waitForTimeout(350);
    const heads = await page.$$eval('#sbody .sec-h', a => a.map(x => x.textContent));
    assert.deepEqual(heads.slice(0, 1), ['הרשימה שלי']);
    assert.equal(await page.textContent('#sbody .item .nm'), nm, 'favourite first');
    // a second place -> recent chips (favourites are not repeated there)
    await page.click('#sbody .sec-h:has-text("כל המקומות") ~ .item >> nth=0');
    await page.waitForSelector('.det'); const second = await page.textContent('.det h3');
    await page.keyboard.press('Escape'); await page.waitForSelector('#sbody .item');
    assert.deepEqual(await page.$$eval('[data-rec]', a => a.map(x => x.textContent)), [second]);
    await page.reload(); await page.waitForSelector('#sbody .item');
    assert.equal(await page.textContent('#sbody .item .nm'), nm, 'favourite kept after reload');
    await page.click('[data-rec]'); await page.waitForSelector('.det');
    assert.equal(await page.textContent('.det h3'), second);
    await done(r);
  });
  test('card actions: navigation links, phone, kashrut as in the list', async () => {
    const p = DATA.find(x => x.u === '565847f');
    const r = await go('/?p=565847f', { viewport: PHONE, mobile: true, time: TUE });
    const { page } = r;
    assert.equal(await page.textContent('.det h3'), p.n);
    assert.equal(await page.textContent('.kbox .kn'), p.h);
    assert.match(await page.getAttribute('.acts a.pri', 'href'), /^https:\/\/waze\.com\/ul\?ll=33\.028978,35\.477659/);
    assert.equal(await page.getAttribute('.acts a[href^="tel:"]', 'href'), 'tel:' + p.g.phone.replace(/[^\d+]/g, ''));
    assert.equal(await page.evaluate(() => location.search), '');
    await done(r);
  });
});

// ================= deep links =================
describe('deep links', () => {
  test('?p=<u> opens the card; unknown id falls back to the list', async () => {
    const r = await go('/?p=347ac19', { viewport: DESK, time: TUE });
    assert.equal(await r.page.textContent('.det h3'), DATA.find(p => p.u === '347ac19').n);
    await done(r);
    const r2 = await go('/?p=deadbee', { viewport: PHONE, time: TUE });
    assert.ok(await r2.page.isVisible('#sbody .item'));
    await done(r2);
  });
  test('?open=1 turns on פתוח עכשיו', async () => {
    const r = await go('/?open=1', { viewport: PHONE, time: TUE });
    assert.equal(await r.page.getAttribute('#cOpen', 'aria-pressed'), 'true');
    await done(r);
  });
});

// ================= hours spot-check =================
describe('hours in the UI', () => {
  test('24/7 place at 23:30 shows "פתוח 24 שעות" (synthetic place through the live-data path)', async () => {
    // the real data has no place open around the clock all week (kosher places close on Shabbat), so one is injected
    const places = structuredClone(DATA); const p = places.find(x => x.u === '565847f');
    p.g.periods = [0, 1, 2, 3, 4, 5, 6].map(d => [d, 0, 0, (d + 1) % 7, 0, 0]);
    const r = await go('/', { viewport: PHONE, time: TUE_NIGHT, waitLive: true, liveData: { places, meta: { ...META, rev: META.rev + 1 } } });
    await typeQ(r.page, p.n);
    assert.equal(await r.page.textContent('#sbody .item .l3 .st-y'), 'פתוח 24 שעות');
    await done(r);
  });
  test('Google-flagged "24h" places at 23:30: real close time + doubt note in list and card', async () => {
    const r = await go('/?p=347ac19', { viewport: PHONE, time: TUE_NIGHT });
    await mapReady(r.page); await r.page.waitForTimeout(200); 
    assert.equal(await r.page.textContent('.det .row [class^="st-"]'), 'פתוח עד יום חמישי בחצות');
    assert.match(await r.page.textContent('.det .dl'), /נראה שהמידע אינו מדוייק/);
    await r.page.click('#back'); await typeQ(r.page, 'חלב חיטים מירון');
    assert.match(await r.page.textContent('#sbody .item'), /נראה שהמידע אינו מדוייק/);
    await done(r);
  });
  test('no hours -> "אין מידע על שעות הפעילות"; Thursday-night only -> the source wording', async () => {
    const r = await go('/?p=8fdcf99', { viewport: PHONE, time: TUE });
    assert.equal(await r.page.textContent('.det .row .st-u'), 'אין מידע על שעות הפעילות');
    assert.match(await r.page.textContent('.det .dl'), /אין מידע על שעות הפעילות/);
    await done(r);
    const fri = DATA.find(p => p.fri && !(p.g && p.g.periods));
    const r2 = await go('/?p=' + fri.u, { viewport: PHONE, time: TUE });
    assert.match(await r2.page.textContent('.det'), /פתוח בליל שישי \(לפי המאגר\), השעות לא ידועות/);
    await done(r2);
  });
  test('no "(מנהג חב״ד)" anywhere; Friday candle-lighting line present', async () => {
    const r = await go('/?p=565847f', { viewport: PHONE, time: FRI });
    await mapReady(r.page); await r.page.waitForTimeout(200);
    let txt = await r.page.textContent('body');
    assert.match(txt, /הדלקת נרות בדלתון ביום שישי: \d\d:\d\d/);
    await r.page.click('#back'); await r.page.click('#ctaCity'); await r.page.selectOption('#cSel', 'ירושלים'); await r.page.click('#cOk');
    txt += await r.page.textContent('body');
    assert.match(txt, /הדלקת נרות בירושלים היום: \d\d:\d\d/);
    const html = await r.page.content();
    assert.ok(!/מנהג/.test(txt) && !/מנהג/.test(html), 'no minhag text');
    await done(r);
  });
});

// ================= offline / install =================
describe('offline and install', () => {
  test('offline bar appears when the connection drops and goes when it returns', async () => {
    const r = await go('/', { viewport: PHONE, time: TUE });
    assert.equal(await r.page.isVisible('#offl'), false);
    await r.ctx.setOffline(true);
    await r.page.waitForSelector('#offl', { state: 'visible' });
    assert.match(await r.page.textContent('#offl'), /אין חיבור\. מוצג המידע השמור מ־25 בנובמבר 2026/);
    await r.ctx.setOffline(false);
    await r.page.waitForSelector('#offl', { state: 'hidden' });
    await done(r);
  });
  test('install card: not on the first day, shown on the second with a prompt, "לא" hides it for good', async () => {
    const fire = page => page.evaluate(() => { const e = new Event('beforeinstallprompt', { cancelable: true }); e.prompt = () => { window.__prompted = (window.__prompted || 0) + 1; }; e.userChoice = Promise.resolve({ outcome: 'dismissed' }); dispatchEvent(e); });
    const r1 = await go('/', { viewport: PHONE, time: TUE });
    await fire(r1.page);
    assert.equal(await r1.page.isVisible('.instc'), false, 'first day: no card');
    assert.ok(await r1.page.isVisible('#inst'), 'list-end install button when the browser offers it');
    await done(r1);
    const r = await go('/', { viewport: PHONE, time: TUE, ls: { kl3_v: JSON.stringify({ n: 1, d: 'Mon Nov 30 2026' }) } });
    assert.equal(await r.page.isVisible('.instc'), false, 'no card without a browser prompt (not iOS)');
    await fire(r.page);
    await r.page.waitForSelector('.instc');
    await r.page.click('#instY');
    assert.equal(await r.page.evaluate(() => window.__prompted), 1);
    await fire(r.page); await r.page.waitForSelector('.instc');
    await r.page.click('#instN');
    assert.equal(await r.page.isVisible('.instc'), false);
    await r.page.reload(); await r.page.waitForSelector('#sbody .item'); await fire(r.page);
    assert.equal(await r.page.isVisible('.instc'), false, 'declined: never again');
    await done(r);
  });
  test('install card on iPhone Safari from the second day (no browser prompt)', async () => {
    const r = await go('/', { viewport: PHONE, mobile: true, ua: IPHONE_UA, time: TUE, ls: { kl3_v: JSON.stringify({ n: 1, d: 'Mon Nov 30 2026' }) } });
    assert.ok(await r.page.isVisible('.instc'));
    await r.page.click('#instY');
    // an illustrated guide in a sheet that stays until closed, not a 2-second toast (S2-1, P2-4)
    await r.page.waitForSelector('#dlg.on');
    assert.equal(await r.page.textContent('#dlgT'), 'הוספה למסך הבית');
    assert.match(await r.page.textContent('#dlg'), /כפתור השיתוף[\s\S]*הוספה למסך הבית/);
    assert.ok(await r.page.locator('#dlg svg').count() >= 2, 'icons for the steps');
    await r.page.waitForTimeout(2600); assert.ok(await r.page.isVisible('#dlg.on'), 'still open');
    await r.page.click('#iosOk'); await r.page.waitForFunction(() => !document.getElementById('dlg').classList.contains('on'));
    // the list-end button opens the same guide
    await r.page.click('#inst'); await r.page.waitForSelector('#dlg.on');
    assert.equal(await r.page.textContent('#dlgT'), 'הוספה למסך הבית');
    await done(r);
  });
});

// ================= live data =================
describe('live data from GitHub', () => {
  const live = (mut, metaMut) => { const places = structuredClone(DATA); const meta = { ...META, rev: META.rev + 1, updated: '2026-11-30' }; mut && mut(places); metaMut && metaMut(meta); return { places, meta }; };
  const NEW = 'מקום בדיקה חי';
  const rename = a => { a[0].n = NEW; };
  async function applied(liveData) {
    const r = await go('/', { viewport: PHONE, time: TUE, waitLive: true, liveData });
    await typeQ(r.page, NEW);
    const n = await r.page.locator('#sbody .item').count();
    const foot = await r.page.textContent('.foot');
    return { r, n, foot };
  }
  test('newer rev and valid -> replaces the built-in copy', async () => {
    const { r, n, foot } = await applied(live(a => { rename(a); a[1].n = '<img src=x onerror="window.__xss=1">'; }));
    assert.equal(n, 1); assert.match(foot, /30 בנובמבר 2026/);
    await typeQ(r.page, 'img src');
    assert.equal(await r.page.evaluate(() => window.__xss), undefined, 'names are escaped');
    assert.match(await r.page.textContent('#sbody .item .nm'), /<img/);
    await done(r);
  });
  for (const [why, data] of [
    ['same rev', live(rename, m => { m.rev = META.rev; })],
    ['older rev', live(rename, m => { m.rev = META.rev - 1; })],
    ['one row with an unknown kashrut group', live(a => { rename(a); a[5].hc = 'other'; })],
    ['one row with a bad hours period', live(a => { rename(a); a.find(p => p.g && p.g.periods).g.periods.push([7, 0, 0, 1, 0, 0]); })],
    ['duplicate ids', live(a => { rename(a); a[3].u = a[4].u; })],
    ['too few rows', live(a => { rename(a); a.length = 50; })],
    ['meta.rev as text', live(rename, m => { m.rev = String(META.rev + 1); })],
    ['meta.updated malformed', live(rename, m => { m.updated = '30.11.2026'; })],
    ['places not JSON', { places: '<html>rate limited</html>', meta: { ...META, rev: META.rev + 1 } }],
  ]) test('rejected: ' + why, async () => {
    const { r, n, foot } = await applied(data);
    assert.equal(n, 0, 'built-in copy kept'); assert.match(foot, /25 בנובמבר 2026/);
    await done(r, { allowNetErrors: true });
  });
  test('GitHub unreachable -> built-in copy, no page errors', async () => {
    const r = await go('/', { viewport: PHONE, time: TUE, liveData: null });
    await r.page.waitForTimeout(500);
    assert.equal(await sub(r.page), nPl(restaurants.length));
    await done(r, { allowNetErrors: true });
  });
});

// ================= map style =================
describe('map style', () => {
  for (const name of ['light', 'dark']) test(name + '.json loads in MapLibre with every layer resolved', { skip: !vendorPresent() && 'dist/vendor missing (scripts/fetch_vendor.sh)' }, async () => {
    const r = await go('/', { blank: true });
    const res = await r.page.evaluate(async name => {
      const ml = await import('/vendor/maplibre-gl.mjs');
      const style = await (await fetch('/map-style/' + name + '.json')).json();
      const errors = [];
      const map = new ml.Map({ container: 'm', style: '/map-style/' + name + '.json', center: [34.8, 32.08], zoom: 13, attributionControl: false });
      map.on('error', e => errors.push(String(e.error && e.error.message || e)));
      await new Promise(res => { map.on('load', res); setTimeout(res, 10000); });
      const got = map.getStyle();
      const srcs = Object.keys(got.sources || {});
      const unresolved = style.layers.filter(l => l.source && !srcs.includes(l.source)).map(l => l.id);
      const missing = style.layers.map(l => l.id).filter(id => !map.getLayer(id));
      return { loaded: map.isStyleLoaded(), n: style.layers.length, got: got.layers.length, unresolved, missing, errors };
    }, name);
    assert.deepEqual(res.errors, []); assert.deepEqual(res.unresolved, []); assert.deepEqual(res.missing, []);
    assert.equal(res.got, res.n); assert.ok(res.loaded);
    await done(r);
  });
  test('app picks the dark style in dark mode', { skip: !vendorPresent() && 'dist/vendor missing' }, async () => {
    const r = await go('/', { viewport: PHONE, dark: true, time: TUE });
    await mapReady(r.page);
    assert.ok(r.log.req.some(u => u.endsWith('/map-style/dark.json')) && !r.log.req.some(u => u.endsWith('/map-style/light.json')));
    await done(r);
  });
});

// ================= layout, tap targets, focus, motion =================
describe('layout and accessibility', () => {
  for (const [label, o] of [['phone light', { viewport: PHONE, mobile: true }], ['phone dark', { viewport: PHONE, mobile: true, dark: true }], ['desktop', { viewport: DESK }]]) {
    test('no horizontal overflow – ' + label + ' (list, card, filter sheet, Friday)', async () => {
      const r = await go('/', { ...o, time: FRI });
      const { page } = r; const found = []; await mapReady(page);
      if (o.mobile) await halfSheet(page);
      found.push(...(await page.evaluate(overflowProbe)).map(x => 'list: ' + x));
      await page.click('#cFri'); found.push(...(await page.evaluate(overflowProbe)).map(x => 'friday: ' + x)); await page.click('#cFri');
      // a card with the longest kashrut text
      const longest = DATA.filter(p => p.k.startsWith('מסעדה')).sort((a, b) => b.h.length - a.h.length)[0];
      await typeQ(page, longest.n); await page.click('#sbody .item');
      await page.waitForSelector('.det'); found.push(...(await page.evaluate(overflowProbe)).map(x => 'card: ' + x));
      await page.click('#back'); await page.click('#fBtn'); await page.waitForSelector('#dlg.on'); await page.waitForTimeout(300);
      found.push(...(await page.evaluate(overflowProbe)).map(x => 'filter: ' + x));
      assert.deepEqual(found, []);
      await done(r);
    });
  }
  for (const [label, o] of [['phone', { viewport: PHONE, mobile: true }], ['desktop', { viewport: DESK }]]) {
    test('tap targets >= 44px – ' + label, async () => {
      const r = await go('/', { ...o, time: FRI });
      const { page } = r; await mapReady(page);
      if (o.mobile) await halfSheet(page);
      await page.waitForTimeout(400);
      let small = await page.evaluate(tapProbe);
      await page.click('#sbody .item'); await page.waitForSelector('.det'); await page.waitForTimeout(400);
      small = small.concat(await page.evaluate(tapProbe));
      await page.click('#back'); await page.click('#fBtn'); await page.waitForSelector('#dlg.on'); await page.waitForTimeout(400);
      small = small.concat(await page.evaluate(tapProbe));
      // map attribution links are inline text (WCAG 2.5.8 inline exception); reported separately in docs/qa
      const real = small.filter(x => !x.inAttr);
      assert.deepEqual([...new Map(real.map(x => [x.el + x.text, x])).values()], []);
      await done(r);
    });
  }
  test('keyboard: every tab stop shows a visible focus indicator (desktop)', async () => {
    const r = await go('/', { viewport: DESK, time: TUE });
    const { page } = r; await mapReady(page);
    const bad = [];
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('Tab');
      const f = await page.evaluate(() => {
        const el = document.activeElement; if (!el || el === document.body) return null;
        const cs = getComputedStyle(el), ring = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2;
        const within = el.closest('.sbar') && /0px 0px 0px 2px/.test(getComputedStyle(el.closest('.sbar')).boxShadow);
        return { ok: ring || within, el: el.tagName + (el.id ? '#' + el.id : '') + '.' + (typeof el.className === 'string' ? el.className : ''), text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 25) };
      });
      if (f && !f.ok) bad.push(f);
    }
    assert.deepEqual(bad, []);
    await done(r);
  });
  test('reduced motion: no sheet/dialog transitions', async () => {
    const r = await go('/', { viewport: PHONE, mobile: true, reduced: true, time: TUE });
    const d = await r.page.evaluate(() => ['sheet', 'dlg', 'toast'].map(id => getComputedStyle(document.getElementById(id)).transitionDuration));
    assert.ok(d.every(x => x.split(',').every(v => parseFloat(v) === 0)), d.join('|'));
    await done(r);
  });
});

// ================= stage 2, map-ux (S2-1): AUDIT P1-8…P1-16, P2-3/4/6 =================
describe('S2-1 map-ux', () => {
  const back = async (page, until) => { await page.evaluate(() => history.back()); await page.waitForFunction(until); await page.waitForTimeout(150); };
  const isCard = () => !!document.querySelector('#sbody .det'), isList = () => !!document.querySelector('#sbody .item') && !document.querySelector('#sbody .det');
  const exactP = p => !!(p.g && p.g.loc) && p.g.prec !== 'street' && !(p.g.q || []).includes('approx-loc');

  test('P1-8 Back closes the card, not the app; repeated open/close adds no entries', async () => {
    const r = await go('/', { viewport: PHONE, mobile: true, time: TUE });
    const { page } = r; const len0 = await page.evaluate(() => history.length);
    await halfSheet(page);
    await page.click('#sbody .item'); await page.waitForSelector('.det');
    assert.equal(await page.evaluate(() => history.length), len0 + 1, 'one entry for the card');
    await back(page, () => !document.querySelector('#sbody .det'));
    assert.ok(await page.evaluate(isList), 'list shown again');
    assert.equal(await page.evaluate(() => location.href), ORIGIN + '/', 'still in the app');
    for (let i = 0; i < 4; i++) { await page.click('#sbody .item'); await page.waitForSelector('.det'); await page.click('#back'); await page.waitForSelector('#sbody .item'); await page.waitForTimeout(80); }
    await page.click('#sbody .item'); await page.waitForSelector('.det'); await page.keyboard.press('Escape'); await page.waitForSelector('#sbody .item'); await page.waitForTimeout(150);
    assert.equal(await page.evaluate(() => history.length), len0 + 1, 'no history spam');
    assert.equal(await page.evaluate(() => (history.state && history.state.kd) | 0), 0, 'back on the base entry');
    await done(r);
  });
  test('P1-8 Back closes a dialog first, then the card under it; forward reopens the card', async () => {
    const r = await go('/', { viewport: DESK, time: TUE });
    const { page } = r;
    await page.click('#sbody .item'); await page.waitForSelector('.det'); const nm = await page.textContent('.det h3');
    await page.click('#cWhen'); await page.waitForSelector('#dlg.on');
    await back(page, () => !document.getElementById('dlg').classList.contains('on'));
    assert.ok(await page.evaluate(isCard), 'card still open under the closed dialog');
    await back(page, () => !document.querySelector('#sbody .det'));
    await page.evaluate(() => history.forward()); await page.waitForSelector('.det');
    assert.equal(await page.textContent('.det h3'), nm, 'forward = the same card');
    await done(r);
  });
  test('P1-8 a filter change inside the dialog closes the card: both entries go away', async () => {
    const r = await go('/', { viewport: DESK, time: TUE });
    const { page } = r; const len0 = await page.evaluate(() => history.length);
    await page.click('#sbody .item'); await page.waitForSelector('.det');
    await page.click('#fBtn'); await page.waitForSelector('#dlg.on');
    await page.click('#dlg [data-hc="chabad"]'); await page.click('#fOk');
    await page.waitForSelector('#sbody .item'); await page.waitForTimeout(200);
    assert.equal(await page.evaluate(() => (history.state && history.state.kd) | 0), 0);
    assert.ok(await page.evaluate(() => history.length) <= len0 + 2);
    await done(r);
  });
  test('P1-8 shared link ?p=: Back goes to the list (address stays clean)', async () => {
    const r = await go('/?p=347ac19', { viewport: PHONE, mobile: true, time: TUE });
    const { page } = r;
    assert.ok(await page.evaluate(isCard));
    await back(page, () => !document.querySelector('#sbody .det'));
    assert.ok(await page.evaluate(isList));
    assert.equal(await page.evaluate(() => location.pathname + location.search), '/');
    await done(r);
  });
  test('P1-8 phone sheet at full height: Back lowers it', async () => {
    const r = await go('/', { viewport: PHONE, mobile: true, time: TUE });
    const { page } = r;
    const ty = () => page.evaluate(() => document.getElementById('sheet').style.transform);
    await page.evaluate(() => { document.getElementById('sbody').scrollTop = 10; }); await page.waitForTimeout(400);
    assert.equal(await ty(), 'translateY(0px)', 'full');
    await back(page, () => document.getElementById('sheet').style.transform !== 'translateY(0px)');
    assert.equal(await page.evaluate(() => location.href), ORIGIN + '/');
    await done(r);
  });

  test('P1-9 chosen town (no GPS): no walking time, town rows without distance, others whole km from the centre', async () => {
    const r = await go('/', { viewport: PHONE, mobile: true, time: TUE });
    const { page } = r;
    await page.click('#ctaCity'); await page.selectOption('#cSel', 'צפת'); await page.click('#cOk');
    const rows = await page.$$eval('#sbody .item', a => a.map(x => ({ u: x.dataset.u, ds: x.querySelector('.ds').textContent })));
    assert.ok(rows.length > 10);
    for (const x of rows) {
      const p = DATA.find(q => q.u === x.u);
      assert.ok(!/הליכה/.test(x.ds), 'no walking time from a town centre: ' + x.ds);
      if (p.c === 'צפת') assert.equal(x.ds, '', p.n); else assert.match(x.ds, /^\d+ ק״מ$/, p.n);
    }
    await done(r);
  });
  test('P1-9 near me: approximate places say "בערך" (or the town) and come after exact ones in their band', async () => {
    const geo = { latitude: 31.7525, longitude: 34.7712 }; // Kiryat Malachi: two places there have only the town
    const r = await go('/', { viewport: PHONE, mobile: true, time: TUE, geo });
    const { page } = r;
    await page.waitForFunction(() => document.getElementById('sTitle').textContent === 'קרוב אליך');
    await page.click('#more'); await page.click('#more');
    const secs = await page.evaluate(() => { const out = []; let cur = null; for (const el of document.querySelectorAll('#sbody > *')) { if (el.classList.contains('sec-h')) { cur = { h: el.textContent, rows: [] }; out.push(cur); } else if (el.classList.contains('item') && cur) cur.rows.push({ u: el.dataset.u, ds: el.querySelector('.ds').textContent }); } return out; });
    let approxSeen = 0;
    for (const s of secs.filter(s => /הליכה|ק״מ|רחוק/.test(s.h))) {
      let afterApprox = false;
      for (const x of s.rows) {
        const p = DATA.find(q => q.u === x.u);
        if (exactP(p)) { assert.ok(!afterApprox, `exact ${p.n} after an approximate place in "${s.h}"`); assert.ok(!/בערך/.test(x.ds), x.ds); }
        else { afterApprox = true; approxSeen++; assert.match(x.ds, /^(בערך [\d.]+ ק״מ|ב.+)$/, p.n + ': ' + x.ds); assert.ok(!/הליכה/.test(x.ds)); }
      }
      if (s.h === 'במרחק הליכה') assert.ok(s.rows.every(x => exactP(DATA.find(q => q.u === x.u))), 'walking band: exact places only');
    }
    assert.ok(approxSeen >= 2, 'approximate places checked: ' + approxSeen);
    await done(r);
  });
  test('P1-9 card: approximate location said at the top; no street -> "אין כתובת במאגר"', async () => {
    const r = await go('/?p=d5c9ab7', { viewport: PHONE, mobile: true, time: TUE }); // town only, has a street
    assert.match(await r.page.textContent('.det .addr + .src'), /המיקום במפה משוער, לפי מרכז הישוב/);
    await done(r);
    const noStreet = DATA.find(p => !p.s && !(p.g && p.g.loc));
    const r2 = await go('/?p=' + noStreet.u, { viewport: PHONE, mobile: true, time: TUE });
    assert.equal(await r2.page.textContent('.det .addr'), noStreet.c + ' · אין כתובת במאגר');
    await done(r2);
    const street = DATA.find(p => p.g && p.g.prec === 'street');
    const r3 = await go('/?p=' + street.u, { viewport: PHONE, mobile: true, time: TUE });
    assert.match(await r3.page.textContent('.det .addr + .src'), /ברמת הרחוב/);
    await done(r3);
  });

  test('P1-10 open-now count follows the town view and matches the list header', async () => {
    const r = await go('/', { viewport: PHONE, mobile: true, time: TUE });
    const { page } = r;
    await page.click('#ctaCity'); await page.selectOption('#cSel', 'צפת'); await page.click('#cOk');
    const c = cityLL('צפת'), view = restaurants.filter(p => p.c === 'צפת' || (LLof(p) && km(c, LLof(p)) <= 12));
    const openN = view.filter(p => /[ys]/.test(st(p, TUE).s)).length;
    assert.ok(openN < restaurants.filter(p => /[ys]/.test(st(p, TUE).s)).length);
    assert.equal(await page.textContent('#cOpenT'), 'פתוח עכשיו · ' + openN);
    await page.click('#cOpen');
    assert.match(await sub(page), new RegExp('^' + openN + ' פתוחים'));
    assert.equal(await page.textContent('#cOpenT'), 'פתוח עכשיו · ' + openN, 'same number with the chip on');
    await typeQ(page, 'פיצה');
    const pz = view.filter(p => /[ys]/.test(st(p, TUE).s) && hay(p).includes(L.normText('פיצה'))).length;
    assert.equal(await page.textContent('#cOpenT'), 'פתוח עכשיו · ' + pz, 'and the search');
    await done(r);
  });

  test('P1-11 periodic refresh keeps focus and list scroll', async () => {
    const r = await go('/', { viewport: DESK, time: TUE, clockInstall: true });
    const { page } = r;
    await page.evaluate(() => { const sb = document.getElementById('sbody'); sb.querySelectorAll('.item')[6].focus(); sb.scrollTop = 300; });
    const foc = () => page.evaluate(() => document.activeElement.classList.contains('item') ? document.activeElement.querySelector('.nm').textContent + '|' + document.activeElement.dataset.id : 'not an item: ' + document.activeElement.tagName);
    const u = await foc(), y = await page.evaluate(() => document.getElementById('sbody').scrollTop);
    assert.match(u, /\|\d+$/);
    const marker = await page.evaluate(() => { document.querySelector('#sbody .item').__old = 1; return 1; });
    await page.clock.runFor(61000);
    assert.equal(await page.evaluate(() => !!document.querySelector('#sbody .item').__old), false, 'the list was rendered again');
    assert.equal(await foc(), u, 'focus on the same place');
    assert.equal(await page.evaluate(() => document.getElementById('sbody').scrollTop), y, 'scroll kept');
    assert.ok(marker);
    await done(r);
  });
  test('P1-11 refresh with an open card and with the search caret', async () => {
    const r = await go('/', { viewport: DESK, time: TUE, clockInstall: true });
    const { page } = r;
    await page.click('#sbody .item'); await page.waitForSelector('.det'); const nm = await page.textContent('.det h3');
    await page.focus('#share');
    await page.evaluate(() => document.querySelector('.det').__old = 1);
    await page.clock.runFor(61000);
    assert.equal(await page.evaluate(() => !!document.querySelector('.det').__old), false, 'the card was refreshed');
    assert.equal(await page.textContent('.det h3'), nm, 'card stays open');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'share');
    await page.click('#back'); await page.waitForSelector('#sbody .item');
    await page.focus('#q'); await page.keyboard.type('פיצה צפת'); await page.clock.runFor(300);
    await page.evaluate(() => document.getElementById('q').setSelectionRange(2, 4));
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange'))); // returning to the app refreshes too
    await page.clock.runFor(61000);
    assert.deepEqual(await page.evaluate(() => [document.activeElement.id, document.getElementById('q').selectionStart, document.getElementById('q').selectionEnd]), ['q', 2, 4]);
    await done(r);
  });

  test('search typos: one-letter mistakes and sound-alike letters, with a note; exact words stay exact', async () => {
    const r = await go('/', { viewport: PHONE, time: TUE });
    const { page } = r;
    const pizza = search('פיצה').length;
    for (const q of ['פציה', 'פיזה']) {
      await typeQ(page, q);
      assert.match(await page.textContent('#sbody .note'), /לא נמצאה התאמה מדויקת/);
      const fs = await page.$$eval('#sbody .item', a => a.slice(0, 20).map(x => x.dataset.u));
      assert.ok(fs.every(u => hay(DATA.find(p => p.u === u)).includes('פיצה')), q + ': closest (pizza) first');
      assert.ok(+((await sub(page)).match(/\d+/) || [0])[0] >= pizza, q);
    }
    await typeQ(page, 'שושי'); // ס/ש sound alike
    const su = await page.$$eval('#sbody .item', a => a.map(x => x.dataset.u));
    assert.ok(su.length >= search('סושי').length);
    assert.ok(su.slice(0, search('סושי').length).every(u => hay(DATA.find(p => p.u === u)).includes('סושי')), 'sushi first');
    await typeQ(page, 'פיצה');
    assert.equal(await page.locator('#sbody .note:has-text("התאמה מדויקת")').count(), 0, 'no note for an exact word');
    assert.equal(await sub(page), nPl(pizza));
    await typeQ(page, 'פיתה'); // found exactly somewhere: never widened to 'פיצה'
    assert.equal(await sub(page), nPl(search('פיתה').length));
    await done(r);
  });

  test('empty list offers ways out with real counts (no dead buttons)', async () => {
    const r = await go('/', { viewport: PHONE, time: TUE });
    const { page } = r;
    await page.click('#ctaCity'); await page.selectOption('#cSel', 'צפת'); await page.click('#cOk');
    const far = restaurants.find(p => p.c === 'אשדוד' && search(p.n).every(q => q.c !== 'צפת' && km(cityLL('צפת'), LLof(q) || cityLL(q.c)) > 12));
    await typeQ(page, far.n);
    assert.match(await page.textContent('#sbody .empty'), /לא נמצאו מקומות/);
    const btns = await page.$$eval('#sbody [data-widen]', a => a.map(x => x.textContent));
    assert.ok(btns.some(t => /^חיפוש בכל הארץ · \d+$/.test(t)), btns.join('|'));
    const n = +btns.find(t => t.startsWith('חיפוש בכל הארץ')).match(/\d+$/)[0];
    await page.click('#sbody [data-widen]:has-text("חיפוש בכל הארץ")');
    assert.equal(await sub(page), nPl(n)); assert.equal(await title(page), 'מקומות כשרים');
    await typeQ(page, 'קקקזזז');
    for (const b of await page.$$eval('#sbody [data-widen]', a => a.map(x => x.textContent))) assert.match(b, / · [1-9]\d*$/, 'every offer has results');
    assert.ok(await page.isVisible('#clr'));
    await done(r);
  });

  test('"מתי?" quick picks: never in the past, none on Friday evening', async () => {
    const picks = async t => { const r = await go('/', { viewport: PHONE, time: t }); await r.page.click('#cWhen'); await r.page.waitForSelector('#dlg.on'); const a = await r.page.$$eval('#dlg [data-at], #dlg [data-now]', x => x.map(b => b.textContent)); await done(r); return a; };
    assert.deepEqual(await picks(TUE), ['עכשיו', 'שישי בבוקר 09:00', 'שישי בצהריים 12:00', 'היום בערב 19:00']);
    assert.deepEqual(await picks(TUE_NIGHT), ['עכשיו', 'שישי בבוקר 09:00', 'שישי בצהריים 12:00']);
    assert.deepEqual(await picks(FRI), ['עכשיו'], 'Friday 12:00: the morning has passed, no Friday evening');
    assert.deepEqual(await picks(il(2026, 11, 27, 8, 0)), ['עכשיו', 'היום בבוקר 09:00', 'היום בצהריים 12:00']);
  });
  test('P1-13 one name per thing: kind "מקומות אוכל", food type labels as on the chips', async () => {
    const r = await go('/', { viewport: PHONE, time: TUE });
    await r.page.click('#fBtn'); await r.page.waitForSelector('#dlg.on');
    assert.equal((await r.page.textContent('#dlg [data-kind="מסעדה"]')).trim(), 'מקומות אוכל');
    for (const [f, label] of [['מסעדה', 'מסעדות'], ['מאפייה וקונדיטוריה', 'מאפיות'], ['המבורגר וגריל', 'בשרים וגריל']]) {
      assert.equal((await r.page.textContent(`#dlg [data-food="${f}"]`)).trim(), label);
      assert.equal((await r.page.textContent(`.chip[data-f="${f}"]`)).trim(), label);
    }
    await done(r);
  });

  test('P2-3 hours table: 07:00 format, whole day = "פתוח 24 שעות", today line on top', async () => {
    const p = DATA.find(x => x.u === '347ac19');
    assert.ok(p.g.week.some(w => /0:00–24:00/.test(w)));
    const r = await go('/?p=347ac19', { viewport: PHONE, mobile: true, time: TUE });
    const hrs = await r.page.textContent('.det .hrs');
    assert.match(hrs, /פתוח 24 שעות/); assert.ok(!/(^|[^\d])\d:\d\d/.test(hrs), hrs);
    assert.match(await r.page.textContent('.det .dl h4'), /^שעות פתיחה · היום: /);
    await done(r);
  });
  test('P2-6 privacy line in the footer', async () => {
    const r = await go('/', { viewport: PHONE, time: TUE });
    assert.match(await r.page.textContent('.foot'), /המיקום שלך נשאר במכשיר ולא נשמר[\s\S]*OpenFreeMap[\s\S]*GitHub/);
    await done(r);
  });

  test('live data: meta first, places only when rev went up; a new town from cities.json gets its centre; aka keeps old links', async () => {
    const r0 = await go('/', { viewport: PHONE, time: TUE, waitLive: true });
    assert.ok(!r0.log.req.some(u => u.endsWith('/places.json')), 'same rev: places.json not downloaded');
    await done(r0);
    const places = structuredClone(DATA), cities = { ...CITIES, 'ישוב בדיקה': [32.5, 35.0] };
    const old = places[2].u; places[2].u = 'abcdef12'; places[2].aka = [old]; places[2].c = 'ישוב בדיקה'; places[2].n = 'מקום אוחד';
    const live = { places, cities, meta: { ...META, rev: META.rev + 1, updated: '2026-11-30' } };
    const r = await go('/?p=' + old, { viewport: PHONE, time: TUE, waitLive: true, liveData: live, ls: { kl3_fav: JSON.stringify([old]) } });
    const { page } = r;
    await page.waitForFunction(() => document.querySelector('.det h3') && document.querySelector('.det h3').textContent === 'מקום אוחד');
    assert.equal(await page.getAttribute('#fav', 'aria-pressed'), 'true', 'favourite under the old id is still a favourite');
    assert.deepEqual(JSON.parse(await page.evaluate(() => localStorage.getItem('kl3_fav'))), ['abcdef12'], 'stored id migrated');
    await page.click('#back'); await page.click('#ctaCity'); await page.selectOption('#cSel', 'ישוב בדיקה'); await page.click('#cOk');
    assert.equal(await title(page), 'ישוב בדיקה והסביבה');
    assert.ok((await names(page)).includes('מקום אוחד'));
    await done(r);
  });

  test('P1-12 map: places with only a town are one badge per town; markers survive a map move; list hover lifts the marker', { skip: !vendorPresent() && 'needs the GL map' }, async () => {
    const r = await go('/', { viewport: DESK, time: TUE, reduced: true });
    const { page } = r; await mapReady(page);
    await page.click('#fBtn'); await page.waitForSelector('#dlg.on'); await page.selectOption('#fCity', 'קריית מלאכי'); await page.keyboard.press('Escape');
    await page.waitForFunction(() => [...document.querySelectorAll('#map .mk.ap')].some(e => e.textContent.trim() === '2'), null, { timeout: 8000 });
    const lbl = await page.$$eval('#map .mkw', a => a.map(x => x.textContent));
    assert.ok(lbl.some(t => t.includes('2 מקומות בקריית מלאכי')), 'town badge label');
    const townOnly = DATA.filter(p => p.c === 'קריית מלאכי' && !(p.g && p.g.loc) && p.k.startsWith('מסעדה'));
    assert.equal(townOnly.length, 2);
    await page.evaluate(() => document.querySelectorAll('#map .maplibregl-marker').forEach(m => { m.__keep = 1; }));
    await page.focus('#map canvas'); await page.keyboard.press('ArrowUp'); await page.waitForTimeout(600);
    const kept = await page.evaluate(() => { const a = [...document.querySelectorAll('#map .maplibregl-marker')]; return [a.filter(m => m.__keep).length, a.length]; });
    assert.ok(kept[0] > 0 && kept[0] >= kept[1] - 3, 'markers reused after a move: ' + kept);
    const p = DATA.find(x => x.c === 'קריית מלאכי' && exactP(x) && x.k.startsWith('מסעדה') && st(x, TUE).s !== 'x');
    await page.hover(`#sbody .item[data-u="${p.u}"]`);
    await page.waitForFunction(() => document.querySelector('#map .mkw.hov'), null, { timeout: 3000 });
    assert.equal(await page.$$eval('#map .mkw.hov', a => a.length), 1, 'hovered row lifts one marker');
    await page.mouse.move(5, 790); await page.waitForFunction(() => !document.querySelector('#map .mkw.hov'));
    await done(r);
  });
});
