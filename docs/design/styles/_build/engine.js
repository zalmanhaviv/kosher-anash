// Shared interaction engine for the four S1-5 style mockups. The look comes from each style's CSS and KA_STYLE hooks.
// Data: real places (data/places.json), statuses precomputed with src/logic.js statusAt (see data.mjs).
(function () {
'use strict';
const D = window.KA_DATA, ST = window.KA_STYLE;
const HL = { chabad: 'ח', eda: 'ע', landa: 'ל', products: 'מ' };
const HCN = { chabad: 'חב״ד', eda: 'העדה החרדית', landa: 'לנדא', products: 'מוצרי העדה/לנדא' };
const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
const NOINFO = 'אין מידע על שעות הפעילות', DOUBT = 'נראה שהמידע אינו מדוייק', FRI0 = 'פתוח בליל שישי (לפי המאגר), השעות לא ידועות';
const TODAY = 2; // Tuesday 1.12.2026
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const tx = t => esc(t).replace(/\d{1,2}:\d{2}(–\d{1,2}:\d{2})?/g, m => `<bdi dir="ltr" class="num">${m}</bdi>`);
const nPl = n => n === 1 ? 'מקום אחד' : n.toLocaleString('he-IL') + ' מקומות';
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sandboxed */ } } };

// normText – copied from src/logic.js so the mock searches exactly like the app
const EN = { pizza: 'פיצה', sushi: 'סושי', burger: 'המבורגר', burgers: 'המבורגר', hamburger: 'המבורגר', falafel: 'פלאפל', shawarma: 'שווארמה', shwarma: 'שווארמה', cafe: 'קפה', coffee: 'קפה', bakery: 'מאפייה', icecream: 'גלידה', gelato: 'גלידה', bagel: 'בייגל', bagels: 'בייגל', grill: 'גריל', catering: 'קייטרינג', hotel: 'מלון', restaurant: 'מסעדה', meat: 'בשרי', dairy: 'חלבי', parve: 'פרווה', pareve: 'פרווה', chabad: 'חבד', deli: 'מעדנייה' };
const FIN = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };
function normText(s) {
  s = String(s || '').toLowerCase().replace(/ice\s*cream/g, 'icecream');
  s = s.replace(/[a-z]+/g, w => EN[w] || w);
  s = s.replace(/[״"׳'’`\-–־.,]/g, '').replace(/[ךםןףץ]/g, c => FIN[c]);
  s = s.replace(/ו+/g, 'ו').replace(/י+/g, 'י');
  s = s.replace(/([א-ת])א(?=[א-ת])/g, '$1');
  s = s.replace(/א(?=\s|$)/g, 'ה');
  return s.replace(/\s+/g, ' ').trim();
}

// ---------- icons: one set drawn for this app, 24 grid, round caps; stroke width per style ----------
const IP = {
  search: '<circle cx="10.5" cy="10.5" r="6.25"/><path d="m15.2 15.2 4.8 4.8"/>',
  x: '<path d="m7 7 10 10M17 7 7 17"/>',
  sliders: '<path d="M4 7.5h8.5M16.5 7.5H20M4 16.5h3.5M11.5 16.5H20"/><circle cx="14.5" cy="7.5" r="2"/><circle cx="9.5" cy="16.5" r="2"/>',
  locate: '<path d="M12 3.5 19.5 20 12 16.2 4.5 20z" transform="rotate(45 12 12)"/>',
  plus: '<path d="M12 6v12M6 12h12"/>', minus: '<path d="M6 12h12"/>',
  nav: '<path d="M4.5 11.2 19.5 4.5l-6.7 15-1.9-6.4z"/>',
  map: '<path d="M9 4.5 3.5 6.6v12.9L9 17.4l6 2.1 5.5-2.1V4.5L15 6.6z"/><path d="M9 4.5v12.9M15 6.6v12.9"/>',
  share: '<path d="M12 14.5V4M8 8l4-4 4 4"/><path d="M6 11.5H5.5v8h13v-8H18"/>',
  tel: '<path d="M7 4h2.6l1.4 3.7-1.9 1.2a9.6 9.6 0 0 0 6 6l1.2-1.9 3.7 1.4V17a2 2 0 0 1-2 2A14 14 0 0 1 5 6a2 2 0 0 1 2-2z"/>',
  back: '<path d="m9.5 5.5 6.5 6.5-6.5 6.5"/>', chev: '<path d="m6.5 9.5 5.5 5.5 5.5-5.5"/>', chevL: '<path d="m14.5 5.5-6.5 6.5 6.5 6.5"/>',
  clock: '<circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/>',
  candle: '<rect x="8.5" y="11" width="7" height="9.5" rx="1.2"/><path d="M12 8.2c-1.9-.8-2.2-2.9 0-5.2 2.2 2.3 1.9 4.4 0 5.2z"/><path d="M12 8.2V11"/>',
  alert: '<path d="M12 4.2 3.2 19.5h17.6z"/><path d="M12 10v4.2M12 17.1v.1"/>',
  check: '<path d="m5.5 12.5 4 4 9-9"/>',
  pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
  meat: '<path d="M14.6 4.2a5.4 5.4 0 0 1 5.2 5.2c0 3.6-3.7 5.4-6.6 5.4l-3 3a1.9 1.9 0 1 1-2.6 2.6 1.9 1.9 0 1 1-2.6-2.6 1.9 1.9 0 1 1 2.6-2.6l3-3c0-2.9 1.8-8 4-8z"/>',
  dairy: '<path d="M9 3.5h6M9.5 3.5v3l-2 3v10a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1v-10l-2-3v-3"/><path d="M7.5 12.5h9"/>',
  parve: '<path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z"/><path d="M5 19 12.5 11.5"/>',
  kashrut: '<path d="M12 3.5 19 6v5.5c0 4.4-3 7.8-7 9-4-1.2-7-4.6-7-9V6z"/><path d="m8.8 12 2.2 2.2 4.2-4.4"/>',
  globe: '<circle cx="12" cy="12" r="8.2"/><path d="M3.8 12h16.4M12 3.8c2.4 2.4 3.4 5.2 3.4 8.2s-1 5.8-3.4 8.2c-2.4-2.4-3.4-5.2-3.4-8.2s1-5.8 3.4-8.2z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>',
};
const ic = (n, s = 20, cls = '') => `<svg class="ic ${cls}" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${ST.sw || 1.75}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IP[n]}</svg>`;

// ---------- data ----------
const TOWNS = D.towns, TOWN = Object.fromEntries(TOWNS.map(t => [t.c, t]));
const TORD = Object.fromEntries(TOWNS.map((t, i) => [t.c, i]));
const rad = x => x * Math.PI / 180;
const km = (a, b) => { const dLa = rad(b.lat - a.lat), dLo = rad(b.lng - a.lng); const x = Math.sin(dLa / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLo / 2) ** 2; return 12742 * Math.asin(Math.sqrt(x)); };
for (const p of D.places) {
  p.loc = { lat: p.la, lng: p.lo };
  p.stN = { s: p.st[0], t: p.st[1], r: p.st[2] };
  p.hay = normText([p.n, p.s, p.c, p.h, p.f, p.t.join(' '), HCN[p.hc]].join(' '));
}
const BYU = Object.fromEntries(D.places.map(p => [p.u, p]));
const NEAR = 12;
const distTo = (p, t) => km(p.loc, { lat: t.la, lng: t.lo });

// ---------- projection ----------
const merc = (lat, lng, z) => { const s = 256 * 2 ** z; return [(lng + 180) / 360 * s, (1 - Math.log(Math.tan(rad(lat)) + 1 / Math.cos(rad(lat))) / Math.PI) / 2 * s]; };
const unmerc = (x, y, z) => { const s = 256 * 2 ** z; const n = Math.PI - 2 * Math.PI * y / s; return { lat: 180 / Math.PI * Math.atan(Math.sinh(n)), lng: x / s * 360 - 180 }; };
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const hash = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return Math.abs(h) || 1; };
// built-up blobs for every town (irregular polygon, km radius)
const BLOBS = [];
for (const t of TOWNS) BLOBS.push({ c: t.c, la: t.la, lo: t.lo, r: GEO.size[t.c] || Math.min(2.4, .7 + Math.sqrt(t.n) * .28) });
for (const [c, la, lo, r] of GEO.extraTowns) BLOBS.push({ c, la, lo, r, extra: 1 });
for (const b of BLOBS) { seed = hash(b.c); b.pts = []; b.rot = rnd() * Math.PI; for (let i = 0; i < 11; i++) { const a = i / 11 * 6.283, rr = b.r * (.72 + rnd() * .45); b.pts.push([b.la + Math.sin(a) * rr / 111.3, b.lo + Math.cos(a) * rr / (111.3 * Math.cos(rad(b.la)))]); } }
function smooth(pts, closed) {
  const n = pts.length; if (n < 3) return 'M' + pts.map(p => p.map(v => v.toFixed(1)).join(',')).join('L');
  const P = i => pts[closed ? (i + n) % n : Math.max(0, Math.min(n - 1, i))]; let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) { const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2); d += `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`; }
  return d + (closed ? 'Z' : '');
}

// ---------- status text ----------
const FRI_ST = p => p.fr ? { s: 'y', t: 'בשישי ' + p.fr, r: 0, close: p.fc } : { s: 'u', t: 'אוכל לשבת · ' + NOINFO, r: 2, close: -1 };
const statusHTML = (st, cls = '') => (ST.status ? ST.status(st, tx) : `<span class="stt st-${st.s} ${cls}">${tx(st.t)}</span>`);
const shortSt = st => { // for pill markers: the status in a few characters, same wording family as the list
  if (st.s === 'y') { const m = st.t.match(/עד (\d{1,2}:\d{2})/); if (m) return 'עד ' + m[1]; const f = st.t.match(/–(\d{1,2}:\d{2})(?!.*–)/); if (f) return 'עד ' + f[1]; return 'פתוח'; }
  if (st.s === 's') return st.t.replace('נסגר בעוד ', 'עוד ');
  if (st.s === 'n') return 'סגור';
  return '';
};

// ---------- app instance ----------
function App(root, layout) {
  const PH = layout === 'phone';
  const S = { open: false, fri: false, t: [], hc: [], q: '', town: null, sel: null, spider: null };
  const V = { z: 7.45, c: { lat: 32.1, lng: 34.98 } };
  root.classList.add('app', PH ? 'ph' : 'dk');
  root.innerHTML = `
    <div class="map" tabindex="0" role="application" aria-label="מפה. אפשר להזיז בחצים ולהתקרב בפלוס ומינוס"><svg class="bgm" aria-hidden="true"></svg><div class="mks"></div><div class="attr">שרטוט להדמיה · © OpenStreetMap</div></div>
    ${PH ? '<div class="osbar" aria-hidden="true"><span class="num">12:30</span></div>' : ''}
    <div class="top">
      <div class="sbar" role="search">${ic('search', 20, 'sic')}<label class="sr" for="${root.id}-q">חיפוש</label>
        <input id="${root.id}-q" class="q" type="search" placeholder="${ST.placeholder || 'חיפוש מקום, אוכל או ישוב'}" autocomplete="off" enterkeyhint="search">
        <button class="ib qx" hidden aria-label="ניקוי החיפוש">${ic('x', 18)}</button></div>
      <div class="chips" role="toolbar" aria-label="סינון מהיר">
        <button class="chip" data-c="open" aria-pressed="false">${ic('clock', 17)}<span class="ct">פתוח עכשיו</span><span class="n num"></span></button>
        <button class="chip" data-c="fri" aria-pressed="false">${ic('candle', 17)}<span class="ct">פתוח בשישי</span></button>
        <button class="chip" data-t="בשרי" aria-pressed="false">${ic('meat', 17)}<span class="ct">בשרי</span></button>
        <button class="chip" data-t="חלבי" aria-pressed="false">${ic('dairy', 17)}<span class="ct">חלבי</span></button>
        <button class="chip" data-t="פרווה" aria-pressed="false">${ic('parve', 17)}<span class="ct">פרווה</span></button>
        <button class="chip ksh" data-c="hc" aria-pressed="false" aria-haspopup="dialog">${ic('kashrut', 17)}<span class="ct">כשרות</span>${ic('chev', 15, 'cv')}</button>
      </div>
    </div>
    <div class="ctl">${PH ? '' : `<div class="zoom"><button class="zin" aria-label="התקרבות">${ic('plus', 20)}</button><button class="zout" aria-label="התרחקות">${ic('minus', 20)}</button></div>`}
      <button class="fab loc" aria-label="איתור מיקום">${ic('locate', 21)}</button></div>
    <section class="sheet" aria-label="רשימת מקומות">
      ${PH ? '<div class="grab" role="button" tabindex="0" aria-label="שינוי גובה הרשימה"><span></span></div>' : ''}
      <div class="shd"></div><div class="sbody"><div class="view"></div></div></section>
    <div class="modal" hidden><div class="mback"></div><div class="mbox" role="dialog" aria-modal="true"></div></div>
    <div class="toast" role="status" aria-live="polite"></div>`;
  const $ = s => root.querySelector(s);
  const map = $('.map'), bg = $('.bgm'), mks = $('.mks'), sheet = $('.sheet'), shd = $('.shd'), sbody = $('.sbody'), q = $('.q'), top = $('.top');
  if (!PH) sheet.prepend(top);
  const W = () => map.clientWidth, H = () => map.clientHeight;

  // ----- sheet snaps (phone) -----
  let snapI = 1, sheetY = 0;
  const topB = () => top.offsetTop + top.offsetHeight;
  const snaps = () => { const h = root.clientHeight; return [h - (ST.peek || 176), Math.round(h * .5), topB() + 6]; };
  function setSnap(i, anim = true) {
    if (!PH) return; snapI = Math.max(0, Math.min(2, i)); sheetY = snaps()[snapI];
    sheet.style.transition = anim && !reduce() ? 'transform .32s cubic-bezier(.2,.8,.2,1)' : 'none';
    sheet.style.transform = `translateY(${sheetY}px)`; sheet.style.height = (root.clientHeight - snaps()[2]) + 'px';
    root.dataset.snap = ['peek', 'half', 'full'][snapI]; posCtl(); drawMap();
  }
  function posCtl() { root.style.setProperty('--top-h', topB() + 'px'); if (PH && ST.fabAbove) $('.ctl').style.top = (Math.min(sheetY, snaps()[1]) - (ST.fab || 48) - 14) + 'px'; }
  const visTop = () => PH ? Math.min(sheetY, snaps()[1]) : H();
  const focus = () => PH ? [W() / 2, (topB() + visTop()) / 2 + 8] : [(W() - 404) / 2, H() / 2];

  // ----- data -----
  function scopeOf(p) { if (!S.town) return true; const t = TOWN[S.town]; return p.c === t.c || distTo(p, t) <= NEAR; }
  function results() {
    const terms = normText(S.q).split(' ').filter(Boolean), base = [];
    for (const p of D.places) {
      if (!terms.length && !scopeOf(p)) continue;
      if (S.hc.length && !S.hc.includes(p.hc)) continue;
      if (S.t.length && !S.t.some(t => p.t.includes(t))) continue;
      if (terms.length && !terms.every(t => p.hay.includes(t))) continue;
      base.push(p);
    }
    const nOpen = base.filter(p => /[ys]/.test(p.stN.s)).length, out = [];
    for (const p of base) {
      let st = p.stN;
      if (S.fri) { if (st.s === 'x' || (!p.fr && p.f !== 'אוכל לשבת')) continue; st = FRI_ST(p); }
      if (S.open && (st.s === 'n' || st.s === 'x')) continue;
      const d = S.town ? distTo(p, TOWN[S.town]) : null;
      out.push({ p, st, d, inS: scopeOf(p) });
    }
    const byD = (a, b) => (a.d != null ? a.d - b.d : (TORD[a.p.c] ?? 99) - (TORD[b.p.c] ?? 99)) || a.p.n.localeCompare(b.p.n, 'he');
    if (S.fri) out.sort((a, b) => b.st.close - a.st.close || byD(a, b));
    else out.sort((a, b) => (terms.length ? b.inS - a.inS : 0) || a.st.r - b.st.r || byD(a, b));
    const rows = out.filter(r => r.st.s !== 'x').concat(out.filter(r => r.st.s === 'x'));
    const tm = terms.length ? TOWNS.filter(t => terms.every(w => t.hay.includes(w))).slice(0, 3) : [];
    return { rows, nOpen, terms, tm };
  }
  let R = { rows: [] };
  const filtersOn = () => S.hc.length + S.t.length + (S.q ? 1 : 0) + (S.open ? 1 : 0) + (S.fri ? 1 : 0);
  const title = () => S.q ? 'תוצאות חיפוש' : S.fri ? (S.town ? 'פתוח בשישי · ' + S.town : 'פתוח בשישי') : S.town ? S.town + ' והסביבה' : 'כל הארץ';

  // ----- list -----
  const joinS = p => [p.s, p.c].filter(Boolean).join(', ');
  const badge = (hc, big) => `<span class="kb kb-${hc}${big ? ' big' : ''}" aria-hidden="true">${HL[hc]}</span>`;
  function rowHTML(r, i) {
    if (ST.row) return ST.row(r, i, { esc, tx, ic, badge, statusHTML, joinS, DOUBT, HL });
    const { p, st } = r, meta = [p.f, p.t.join(' · '), joinS(p)].filter(Boolean).join(' · ');
    return `<button class="item" data-u="${esc(p.u)}" style="--i:${i}" aria-label="${esc(p.n)}, ${esc(p.c)}, כשרות ${esc(p.h)}, ${esc(st.t)}">
      ${badge(p.hc)}<span class="bd"><span class="nm">${esc(p.n)}</span>
      <span class="l2">${esc(meta)}</span>
      <span class="l3">${statusHTML(st)}<span class="sep" aria-hidden="true">·</span><span class="kh">${esc(p.h)}</span></span>
      ${p.db ? `<span class="dbt">${ic('alert', 15)}${DOUBT}</span>` : ''}</span></button>`;
  }
  function headHTML() {
    const t = S.town ? TOWN[S.town] : null;
    const nu = R.rows.filter(r => r.st.s === 'u').length;
    const cnt = !R.rows.length ? 'אין מקומות להצגה' : S.open && !S.q ? `${nPl(R.rows.length - nu)} פתוחים עכשיו${nu ? `, ועוד ${nu} שאין עליהם מידע על שעות הפעילות` : ''}` : nPl(R.rows.length);
    return `<div class="hrow"><div class="htxt"><h2>${esc(title())}</h2><span class="cnt num" aria-live="polite">${cnt}</span></div>
      <button class="townbtn" aria-haspopup="dialog">${ic('pin', 18)}<span>${S.town ? 'החלפת ישוב' : 'בחירת ישוב'}</span></button></div>
      ${t ? `<div class="cand">${ic('candle', 17)}<span>הדלקת נרות ב${esc(t.c)} ביום שישי: <b class="num">${t.cn}</b></span>${!S.q ? '<button class="allc">כל הארץ</button>' : ''}</div>` : ''}`;
  }
  function listHTML() {
    let h = '';
    if (S.fri) h += '<p class="note">מקומות שפתוחים ביום שישי לפי השעות שפורסמו, מהנסגר הכי מאוחר. בסוף: מקומות לאוכל לשבת שאין עליהם מידע על שעות.</p>';
    else if (S.open) h += '<p class="note">מקומות שפתוחים עכשיו לפי השעות שפורסמו ברשת. בסוף הרשימה גם מקומות שאין עליהם מידע על שעות הפעילות.</p>';
    for (const t of R.tm) h += `<button class="townrow" data-town="${esc(t.c)}">${ic('pin', 20)}<span><b>${esc(t.c)}</b><small>${nPl(t.n)} בישוב ובסביבה</small></span>${ic('chevL', 18)}</button>`;
    const rows = R.rows;
    if (!rows.length) return h + `<div class="empty">${ic('search', 34)}<b>${S.q ? `לא נמצאו מקומות עבור ״${esc(S.q)}״` : 'לא נמצאו מקומות'}</b><span>${S.q ? 'אפשר לחפש לפי שם, רחוב, ישוב, סוג אוכל או כשרות.' : 'אפשר להסיר חלק מהסינונים.'}</span><button class="btn clr">ניקוי סינון</button></div>`;
    if (S.q || S.fri) { h += rows.slice(0, 200).map(rowHTML).join(''); if (rows.length > 200) h += `<p class="note">מוצגים 200 הראשונים מתוך ${rows.length}. אפשר לצמצם בחיפוש או בבחירת ישוב.</p>`; }
    else if (!S.town) { // country: towns as sections, a few places each
      const by = new Map(); for (const r of rows) { if (!by.has(r.p.c)) by.set(r.p.c, []); by.get(r.p.c).push(r); }
      let i = 0;
      for (const [c, rs] of [...by.entries()].sort((a, b) => b[1].length - a[1].length)) {
        h += `<div class="sec-h"><span>${esc(c)}</span><span class="c num">${rs.length}</span></div>` + rs.slice(0, 3).map(r => rowHTML(r, i++)).join('');
        if (rs.length > 3) h += `<button class="more" data-town="${esc(c)}">כל ${rs.length} המקומות ב${esc(c)} והסביבה${ic('chevL', 16)}</button>`;
      }
    } else {
      const a = rows.filter(r => r.p.c === S.town), b = rows.filter(r => r.p.c !== S.town);
      if (a.length) h += `<div class="sec-h"><span>ב${esc(S.town)}</span><span class="c num">${a.length}</span></div>` + a.map(rowHTML).join('');
      if (b.length) h += `<div class="sec-h"><span>בסביבה (עד ${NEAR} ק״מ)</span><span class="c num">${b.length}</span></div>` + b.map((r, i) => rowHTML(r, i + a.length)).join('');
    }
    return h + '<div class="foot">המקומות והכשרויות מתוך מאגר מסעדות לאנ״ש חב״ד, ניסן ה׳תשפ״ה. יש לבדוק את תעודת הכשרות במקום. שעות, טלפונים ומיקומים: Google Maps ו־OpenStreetMap. כדאי לוודא שעות לפני שיוצאים.</div>';
  }
  function cardHTML(p) {
    const st = p.stN, meta = [p.f, p.t.join(' · ')].filter(Boolean).join(' · ');
    let hrs;
    if (p.wk && p.wk.length === 7) {
      hrs = '<div class="hrs">' + DAYS.map((n, i) => { const v = (p.wk[(i + 6) % 7] || '').replace(/^[^:]+:\s*/, ''), t = i === TODAY;
        return `<div class="hr${t ? ' tday' : ''}"><span class="d">${n}${t ? '<span class="tg">היום</span>' : ''}</span><span class="v num">${/\d/.test(v) ? v.split(/,\s*/).map(x => `<bdi dir="ltr">${esc(x)}</bdi>`).join(', ') : esc(v)}</span></div>`; }).join('') + '</div>';
    } else hrs = `<p class="nohrs">${p.f0 ? FRI0 : NOINFO}</p>`;
    let src = '';
    if (p.wk) { if (p.chk) { const [y, m] = p.chk.split('-').map(Number); src = `לפי Google Maps, נבדק ב${MONTHS[m - 1]} ${y}. כדאי לוודא לפני שיוצאים.`; } else src = 'כדאי לוודא את השעות לפני שיוצאים.'; }
    const t = TOWN[p.c];
    const acts = [['nav', 'ניווט', 'nav'], ['gm', 'גוגל מפות', 'map'], ['share', 'שיתוף', 'share']].concat(p.ph ? [['tel', 'חיוג', 'tel']] : []);
    const frS = p.fr ? `ביום שישי: ${p.fr}` : '';
    return `<article class="card">
      <header class="chead"><h3>${esc(p.n)}</h3><p class="addr">${esc(joinS(p))}</p>${meta ? `<p class="meta">${esc(meta)}</p>` : ''}
        <div class="cst">${statusHTML(st, 'big')}${frS && st.s !== 'x' ? `<span class="frl">${tx(frS)}</span>` : ''}</div>
        ${p.db ? `<p class="dbt big">${ic('alert', 17)}<span>${DOUBT}</span></p>` : ''}</header>
      <div class="acts">${acts.map(([k, l, i], j) => `<button class="act${j === 0 ? ' pri' : ''}" data-act="${k}"${k === 'tel' ? ` aria-label="חיוג ${esc(p.ph)}"` : ''}>${ic(i, 21)}<span>${l}</span></button>`).join('')}</div>
      <section class="kbox">${badge(p.hc, true)}<div><h4>כשרות</h4><p class="kn">${esc(p.h)}</p><p class="ksrc">לפי מאגר מסעדות לאנ״ש חב״ד, ניסן ה׳תשפ״ה. יש לבדוק את תעודת הכשרות במקום.</p></div></section>
      <section class="dl"><h4>${ic('clock', 18)}שעות פתיחה</h4>${hrs}
        ${p.db ? `<p class="doubt">${ic('alert', 18)}<span>${DOUBT}. השעות מוצגות כפי שפורסמו, כדאי להתקשר לפני שיוצאים.</span></p>` : ''}
        ${src ? `<p class="src">${src}</p>` : ''}</section>
      ${t ? `<section class="dl cn">${ic('candle', 18)}<span>הדלקת נרות ב${esc(p.c)} ביום שישי: <b class="num">${t.cn}</b></span></section>` : ''}
      ${p.ph ? `<section class="dl ph1">${ic('tel', 18)}<span class="num" dir="ltr">${esc(p.ph)}</span></section>` : ''}
      <div class="report-slot" aria-hidden="true"></div>
      ${p.ex ? '' : '<p class="src">המיקום במפה משוער, לפי מרכז הישוב.</p>'}
    </article>`;
  }

  // ----- render -----
  function render(dir) {
    R = results();
    const cO = $('[data-c=open]'); cO.setAttribute('aria-pressed', S.open); cO.querySelector('.n').textContent = R.nOpen.toLocaleString('he-IL');
    cO.setAttribute('aria-label', `פתוח עכשיו, ${R.nOpen} מקומות`);
    $('[data-c=fri]').setAttribute('aria-pressed', S.fri);
    root.querySelectorAll('[data-t]').forEach(b => b.setAttribute('aria-pressed', S.t.includes(b.dataset.t)));
    const kc = $('[data-c=hc]'); kc.setAttribute('aria-pressed', S.hc.length > 0);
    kc.querySelector('.ct').textContent = S.hc.length ? 'כשרות · ' + S.hc.length : 'כשרות';
    $('.qx').hidden = !S.q;
    const view = document.createElement('div'); view.className = 'view' + (dir && !reduce() ? ' in ' + dir : '');
    if (S.sel) {
      const p = BYU[S.sel];
      shd.innerHTML = `<div class="hrow"><button class="back">${ic('back', 20)}<span>${S.q ? 'לתוצאות' : 'לרשימה'}</span></button>${ST.cardClose ? `<button class="ib xclose" aria-label="סגירה">${ic('x', 18)}</button>` : ''}</div>`;
      sheet.setAttribute('aria-label', p.n); view.innerHTML = cardHTML(p);
    } else { shd.innerHTML = headHTML(); sheet.setAttribute('aria-label', 'רשימת מקומות'); view.innerHTML = listHTML(); }
    root.classList.toggle('carding', !!S.sel);
    sbody.replaceChild(view, sbody.querySelector('.view'));
    if (dir) sbody.scrollTop = 0;
    drawMap();
  }
  function open(u, from) {
    S.sel = u; S.spider = null; render('fwd');
    if (PH && snapI === 0) setSnap(1);
    const p = BYU[u]; if (p) flyTo(p.loc, Math.max(V.z, 13.5));
    setTimeout(() => { const b = shd.querySelector('.back'); if (b && from !== 'quiet') b.focus({ preventScroll: true }); }, 40);
  }
  function close() {
    const u = S.sel; S.sel = null; render('back');
    const b = sbody.querySelector(`.item[data-u="${CSS.escape(u)}"]`); if (b) { sbody.scrollTop = Math.max(0, b.offsetTop - 80); b.focus({ preventScroll: true }); }
  }
  function setTown(c) {
    S.town = c; S.sel = null; S.q = ''; q.value = ''; S.spider = null; render('fwd');
    if (c) { const t = TOWN[c]; fitTo(D.places.filter(p => p.c === c && p.ex).map(p => p.loc).concat([{ lat: t.la, lng: t.lo }]), 14); } else home();
    if (PH && snapI === 2) setSnap(1);
  }
  function clearAll() { Object.assign(S, { open: false, fri: false, t: [], hc: [], q: '' }); q.value = ''; render('back'); }

  // ----- toast -----
  let tT; const toast = (m) => { const t = $('.toast'); t.textContent = m; t.classList.add('on'); clearTimeout(tT); tT = setTimeout(() => t.classList.remove('on'), 2400); };

  // ----- modals: kashrut filter and town picker -----
  let lastFocus = null;
  function modal(html, label, onBind) {
    const m = $('.modal'), box = $('.mbox'); lastFocus = document.activeElement;
    box.innerHTML = `<div class="mgrab" aria-hidden="true"></div>${html}`; box.setAttribute('aria-label', label); m.hidden = false;
    requestAnimationFrame(() => m.classList.add('on')); onBind(box);
    setTimeout(() => { const f = box.querySelector('input,button.opt,button'); if (f) f.focus(); }, 30);
  }
  function closeModal() { const m = $('.modal'); m.classList.remove('on'); setTimeout(() => { m.hidden = true; }, reduce() ? 0 : 180); if (lastFocus && root.contains(lastFocus)) lastFocus.focus(); }
  function kashrutSheet() {
    const tmp = new Set(S.hc);
    const cnt = hc => { const sv = S.hc; S.hc = [hc]; const n = results().rows.length; S.hc = sv; return n; };
    const totalWith = () => { const sv = S.hc; S.hc = [...tmp]; const n = results().rows.length; S.hc = sv; return n; };
    const groups = ['chabad', 'eda', 'landa', 'products'];
    modal(`<h2 class="mt">כשרות</h2><p class="msub">הכשרות של כל מקום מוצגת מילה במילה כפי שבמאגר. הסינון לפי קבוצות.</p>
      <div class="opts">${groups.map(g => `<button class="opt" data-g="${g}" role="checkbox" aria-checked="${tmp.has(g)}">${badge(g)}<span class="on1">${HCN[g]}</span><span class="oc num">${cnt(g)}</span><span class="box">${ic('check', 16)}</span></button>`).join('')}</div>
      <div class="mact"><button class="btn ghost mclr">ניקוי סינון</button><button class="btn pri mok"></button></div>`, 'סינון כשרות', box => {
      const upd = () => { box.querySelectorAll('.opt').forEach(b => b.setAttribute('aria-checked', tmp.has(b.dataset.g))); const n = totalWith(); box.querySelector('.mok').textContent = n ? 'הצגת ' + nPl(n) : 'אין מקומות להצגה'; };
      box.querySelectorAll('.opt').forEach(b => b.onclick = () => { tmp.has(b.dataset.g) ? tmp.delete(b.dataset.g) : tmp.add(b.dataset.g); upd(); });
      box.querySelector('.mclr').onclick = () => { tmp.clear(); upd(); };
      box.querySelector('.mok').onclick = () => { S.hc = [...tmp]; S.sel = null; closeModal(); render(); };
      upd();
    });
  }
  function townSheet() {
    modal(`<h2 class="mt">בחירת ישוב</h2><p class="msub">מוצגים המקומות בישוב ובסביבה, עד ${NEAR} ק״מ.</p>
      <label class="msearch">${ic('search', 18)}<span class="sr">חיפוש ישוב</span><input type="search" placeholder="חיפוש ישוב" autocomplete="off"></label>
      <div class="tlist"></div>`, 'בחירת ישוב', box => {
      const inp = box.querySelector('input'), list = box.querySelector('.tlist');
      const draw = () => { const w = normText(inp.value).split(' ').filter(Boolean); const ts = TOWNS.filter(t => w.every(x => t.hay.includes(x)));
        list.innerHTML = (w.length ? '' : `<button class="trow${!S.town ? ' cur' : ''}" data-c="">${ic('globe', 20)}<span class="tn">כל הארץ</span><span class="tc num">${nPl(D.places.length)}</span></button>`) +
          ts.map(t => `<button class="trow${S.town === t.c ? ' cur' : ''}" data-c="${esc(t.c)}">${ic('pin', 20)}<span class="tn">${esc(t.c)}</span><span class="tc num">${t.n}</span></button>`).join('') +
          (ts.length ? '' : '<p class="msub">לא נמצא ישוב בשם הזה ברשימה.</p>');
        list.querySelectorAll('.trow').forEach(b => b.onclick = () => { closeModal(); setTown(b.dataset.c || null); }); };
      inp.oninput = draw; draw();
    });
  }

  // ----- map drawing -----
  let raf = 0; const drawMap = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; drawNow(); }); };
  function drawNow() {
    const w = W(), h = H(); if (!w) return;
    const z = V.z, [fx, fy] = focus(), [cx, cy] = merc(V.c.lat, V.c.lng, z);
    const P = (la, lo) => { const [x, y] = merc(la, lo, z); return [x - cx + fx, y - cy + fy]; };
    const pp = pts => pts.map(([a, b]) => P(a, b));
    const ppk = 256 * 2 ** z / (40075 * Math.cos(rad(31.8))); // px per km
    const g = [`<rect width="${w}" height="${h}" fill="var(--m-land)"/>`];
    g.push(`<path d="${smooth(pp(GEO.desert), true)}" fill="var(--m-desert)"/>`);
    for (const gr of GEO.green) g.push(`<path d="${smooth(pp(gr), true)}" fill="var(--m-green)"/>`);
    const sea = pp(GEO.coast.concat(GEO.seaClose));
    g.push(`<path d="M${sea.map(p => p.map(v => v.toFixed(1)).join(',')).join('L')}Z" fill="var(--m-sea)"/>`);
    g.push(`<path d="M${pp(GEO.coast).map(p => p.map(v => v.toFixed(1)).join(',')).join('L')}" fill="none" stroke="var(--m-coast)" stroke-width="1"/>`);
    for (const l of GEO.lakes) g.push(`<path d="${smooth(pp(l), true)}" fill="var(--m-sea)" stroke="var(--m-coast)" stroke-width=".8"/>`);
    for (const r of GEO.rivers) g.push(`<path d="${smooth(pp(r))}" fill="none" stroke="var(--m-sea-line)" stroke-width="${Math.max(1, Math.min(3, (z - 6) * .6))}" stroke-linecap="round"/>`);
    g.push(`<path d="M${pp(GEO.border).map(p => p.map(v => v.toFixed(1)).join(',')).join('L')}" fill="none" stroke="var(--m-border)" stroke-width="${z < 9 ? 1.2 : 1.6}" stroke-dasharray="${ST.borderDash || '5 4'}" stroke-linejoin="round"/>`);
    // built-up areas, with a street pattern once zoomed in
    const defs = [];
    for (const b of BLOBS) {
      const [bx, by] = P(b.la, b.lo), rp = b.r * ppk * 1.25; if (bx + rp < -50 || by + rp < -50 || bx - rp > w + 50 || by - rp > h + 50) continue;
      const d = smooth(pp(b.pts), true);
      g.push(`<path d="${d}" fill="var(--m-urban)"/>`);
      if (z >= 11.2) {
        const id = `${root.id}-cl${hash(b.c)}`; defs.push(`<clipPath id="${id}"><path d="${d}"/></clipPath>`);
        const sp = Math.max(16, .3 * ppk), n = Math.ceil(rp / sp) + 1, s = [], art = []; seed = hash(b.c) + 3;
        for (const rot0 of [b.rot, b.rot + Math.PI / 2 + .1]) {
          for (let i = -n; i <= n; i++) {
            const rot = rot0 + (rnd() - .5) * .14, ca = Math.cos(rot), sa = Math.sin(rot), off = (i + (rnd() - .5) * .55) * sp;
            const ox = bx + Math.cos(rot0) * off, oy = by + Math.sin(rot0) * off, isA = i % 4 === 0;
            for (let t = -rp; t < rp;) { const len = sp * (isA ? 6 + rnd() * 6 : 1.5 + rnd() * 4); if (isA || rnd() > .22) (isA ? art : s).push(`M${(ox - sa * t).toFixed(1)},${(oy + ca * t).toFixed(1)}L${(ox - sa * (t + len)).toFixed(1)},${(oy + ca * (t + len)).toFixed(1)}`); t += len + (isA ? 0 : sp * rnd() * .9); }
          }
        }
        g.push(`<g clip-path="url(#${id})"><path d="${s.join('')}" stroke="var(--m-street)" stroke-width="${z >= 13 ? 2.4 : 1.3}" fill="none" stroke-linecap="round"/><path d="${art.join('')}" stroke="var(--m-tr-case)" stroke-width="${z >= 13 ? 5.5 : 3}" fill="none" stroke-linecap="round"/><path d="${art.join('')}" stroke="var(--m-tr)" stroke-width="${z >= 13 ? 4 : 2}" fill="none" stroke-linecap="round"/></g>`);
      }
    }
    // roads
    const rw = { mw: Math.max(1.3, Math.min(8, .9 + (z - 7) * 1.15)), tr: Math.max(.8, Math.min(6, .4 + (z - 7) * .9)) };
    if (ST.casing !== false) for (const [c, pts] of GEO.roads) g.push(`<path d="${smooth(pp(pts))}" fill="none" stroke="var(--m-${c}-case)" stroke-width="${rw[c] + 1.6}" stroke-linecap="round" stroke-linejoin="round"/>`);
    for (const [c, pts] of GEO.roads) g.push(`<path d="${smooth(pp(pts))}" fill="none" stroke="var(--m-${c})" stroke-width="${rw[c]}" stroke-linecap="round" stroke-linejoin="round"/>`);
    // labels with collision
    const boxes = [], lab = [];
    const fits = (x, y, bw, bh) => { const b = [x - bw / 2, y - bh / 2, x + bw / 2, y + bh / 2]; if (b[2] < 0 || b[0] > w || b[3] < 0 || b[1] > h) return false; if (boxes.some(o => !(b[2] < o[0] || b[0] > o[2] || b[3] < o[1] || b[1] > o[3]))) return false; boxes.push(b); return true; };
    for (const [nm, la, lo, zmin] of GEO.water) { if (z < zmin - .5) continue; const [x, y] = P(la, lo); if (fits(x, y, nm.length * 7.5, 16)) lab.push(`<text class="mwl" x="${x.toFixed(1)}" y="${y.toFixed(1)}">${nm}</text>`); }
    const order = BLOBS.map(b => ({ b, pr: GEO.tier1.includes(b.c) ? 0 : GEO.tier2.includes(b.c) ? 1 : 2 })).sort((a, b) => a.pr - b.pr || b.b.r - a.b.r);
    for (const { b, pr } of order) {
      if ((pr === 1 && z < 7.6) || (pr === 2 && z < 9.2)) continue;
      const [x, y] = P(b.la, b.lo), big = pr === 0 || (pr === 1 && z >= 9.5), fs = big ? 13.5 : 12;
      if (fits(x, y, b.c.length * fs * .58 + 8, fs + 6)) lab.push(`<text class="mpl${big ? ' big' : ''}${S.town === b.c ? ' cur' : ''}" x="${x.toFixed(1)}" y="${y.toFixed(1)}">${esc(b.c)}</text>`);
    }
    bg.setAttribute('width', w); bg.setAttribute('height', h);
    bg.innerHTML = `<defs>${defs.join('')}</defs>` + g.join('') + lab.join('');
    drawMarkers(P, w, h, boxes);
  }
  function drawMarkers(P, w, h) {
    const rows = R.rows.filter(r => r.st.s !== 'x');
    const pts = []; let sel = null;
    for (const r of rows) { const [x, y] = P(r.p.loc.lat, r.p.loc.lng); if (x < -60 || y < -60 || x > w + 60 || y > h + 60) continue; const o = { x, y, r }; if (r.p.u === S.sel) sel = o; else pts.push(o); }
    const RAD = ST.clusterR || 40, groups = [];
    for (const pt of pts) {
      const gr = V.z < 15.5 ? groups.find(g => Math.abs(g.x0 - pt.x) < RAD && Math.abs(g.y0 - pt.y) < RAD * (ST.clusterRY || 1)) : null;
      if (gr) { gr.m.push(pt); gr.x += (pt.x - gr.x) / gr.m.length; gr.y += (pt.y - gr.y) / gr.m.length; } else groups.push({ x0: pt.x, y0: pt.y, x: pt.x, y: pt.y, m: [pt] });
    }
    const out = [];
    const mk = (o, isSel, x = o.x, y = o.y) => { const p = o.r.p, m = ST.marker(p, o.r.st, isSel, { badge, HL, shortSt, esc, ic, fri: S.fri });
      return `<button class="mk${isSel ? ' sel' : ''}${m.cls ? ' ' + m.cls : ''}" data-u="${esc(p.u)}" style="transform:translate(${(x - m.ax).toFixed(1)}px,${(y - m.ay).toFixed(1)}px)" aria-label="${esc(p.n)}, כשרות ${esc(p.h)}, ${esc(o.r.st.t)}">${m.html}</button>`; };
    for (const gr of groups) {
      const key = gr.m.map(m => m.r.p.u).sort().join(','), spread = S.spider === key;
      if (gr.m.length === 1) { out.push(mk(gr.m[0], false)); continue; }
      if (spread) { gr.m.forEach((m, i) => { const a = i / gr.m.length * 6.283 - 1.57, rr = 26 + gr.m.length * 4; out.push(mk(m, false, gr.x + Math.cos(a) * rr, gr.y + Math.sin(a) * rr)); }); continue; }
      const hcs = {}; let open = 0; for (const m of gr.m) { hcs[m.r.p.hc] = (hcs[m.r.p.hc] || 0) + 1; if (/[ys]/.test(m.r.st.s)) open++; }
      const c = ST.cluster(gr.m.length, { hcs, open, esc });
      out.push(`<button class="mk cl" data-key="${esc(key)}" data-x="${gr.x}" data-y="${gr.y}" style="transform:translate(${(gr.x - c.ax).toFixed(1)}px,${(gr.y - c.ay).toFixed(1)}px)" aria-label="${gr.m.length} מקומות, התקרבות">${c.html}</button>`);
    }
    if (sel) out.push(mk(sel, true));
    mks.innerHTML = out.join('');
  }
  function zoomAt(nz, sx, sy) {
    nz = Math.max(6.5, Math.min(16.5, nz)); const [fx, fy] = focus();
    if (sx == null) { sx = fx; sy = fy; }
    const [cx, cy] = merc(V.c.lat, V.c.lng, V.z), ll = unmerc(cx + sx - fx, cy + sy - fy, V.z);
    const [lx, ly] = merc(ll.lat, ll.lng, nz); V.z = nz; V.c = unmerc(lx - (sx - fx), ly - (sy - fy), nz); drawMap();
  }
  let anim = 0;
  function flyTo(ll, z) {
    cancelAnimationFrame(anim); const z0 = V.z, c0 = { ...V.c }, z1 = z == null ? V.z : z;
    if (reduce()) { V.c = { lat: ll.lat, lng: ll.lng }; V.z = z1; drawMap(); return; }
    const t0 = performance.now(), dur = 420;
    const step = t => { const k = Math.min(1, (t - t0) / dur), e = 1 - (1 - k) ** 3; V.z = z0 + (z1 - z0) * e; V.c = { lat: c0.lat + (ll.lat - c0.lat) * e, lng: c0.lng + (ll.lng - c0.lng) * e }; drawNow(); if (k < 1) anim = requestAnimationFrame(step); };
    anim = requestAnimationFrame(step);
  }
  function fitTo(lls, zmax = 14) {
    if (!lls.length) return; let a = 90, b = -90, c = 180, d = -180; for (const l of lls) { a = Math.min(a, l.lat); b = Math.max(b, l.lat); c = Math.min(c, l.lng); d = Math.max(d, l.lng); }
    const [x0, y0] = merc(b, c, 0), [x1, y1] = merc(a, d, 0), aw = W() - (PH ? 70 : 474), ah = (PH ? snaps()[1] - topB() : H()) - 70;
    const z = Math.min(zmax, Math.log2(Math.min(aw / Math.max(1e-6, x1 - x0), ah / Math.max(1e-6, y1 - y0))));
    flyTo({ lat: (a + b) / 2, lng: (c + d) / 2 }, z);
  }
  const HOME = PH ? [{ lat: 32.1, lng: 34.98 }, 7.45] : [{ lat: 31.75, lng: 35.0 }, 7.85];
  const home = () => flyTo(HOME[0], HOME[1]);

  // ----- events -----
  q.addEventListener('input', () => { S.q = q.value; S.sel = null; render(); });
  q.addEventListener('focus', () => { if (PH && snapI < 1) setSnap(1); });
  q.addEventListener('keydown', e => { if (e.key === 'Enter') { q.blur(); if (R.rows.length && R.rows.length < 60) fitTo(R.rows.filter(r => r.st.s !== 'x').map(r => r.p.loc)); } });
  $('.qx').onclick = () => { q.value = ''; S.q = ''; render(); q.focus(); };
  $('[data-c=open]').onclick = () => { S.open = !S.open; if (S.open) S.fri = false; S.sel = null; render(); };
  $('[data-c=fri]').onclick = () => { S.fri = !S.fri; if (S.fri) S.open = false; S.sel = null; render(); };
  $('[data-c=hc]').onclick = kashrutSheet;
  root.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { const t = b.dataset.t; S.t = S.t.includes(t) ? S.t.filter(x => x !== t) : [...S.t, t]; S.sel = null; render(); });
  root.addEventListener('click', e => {
    const t = e.target.closest('button,[role=button]'); if (!t || !root.contains(t)) return;
    if (t.matches('.item')) open(t.dataset.u);
    else if (t.matches('.back')) close();
    else if (t.matches('.xclose')) close();
    else if (t.matches('.townbtn')) townSheet();
    else if (t.matches('.more,.townrow')) setTown(t.dataset.town);
    else if (t.matches('.allc')) setTown(null);
    else if (t.matches('.clr')) clearAll();
    else if (t.matches('.act')) toast(({ nav: 'ניווט', gm: 'גוגל מפות', share: 'שיתוף', tel: 'חיוג' }[t.dataset.act]) + ' · בהדמיה בלבד');
    else if (t.matches('.loc')) toast('איתור מיקום · בהדמיה בלבד');
    else if (t.matches('.zin')) zoomAt(V.z + 1);
    else if (t.matches('.zout')) zoomAt(V.z - 1);
    else if (t.matches('.mback') || t.matches('.mclose')) closeModal();
  });
  $('.mback').addEventListener('click', closeModal);
  root.addEventListener('keydown', e => {
    if (e.key === 'Escape') { if (!$('.modal').hidden) closeModal(); else if (S.sel) close(); }
    if (e.key === 'Tab' && !$('.modal').hidden) { const f = [...$('.mbox').querySelectorAll('button,input')]; if (!f.length) return; const a = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { z.focus(); e.preventDefault(); } else if (!e.shiftKey && document.activeElement === z) { a.focus(); e.preventDefault(); } }
  });
  map.addEventListener('keydown', e => {
    const k = { ArrowLeft: [-60, 0], ArrowRight: [60, 0], ArrowUp: [0, -60], ArrowDown: [0, 60] }[e.key];
    if (k) { const [cx, cy] = merc(V.c.lat, V.c.lng, V.z); V.c = unmerc(cx + k[0], cy + k[1], V.z); drawMap(); e.preventDefault(); }
    if (e.key === '+' || e.key === '=') zoomAt(V.z + 1); if (e.key === '-') zoomAt(V.z - 1);
  });
  mks.addEventListener('click', e => {
    const b = e.target.closest('.mk'); if (!b) return; e.stopPropagation();
    if (b.dataset.u) { open(b.dataset.u); return; }
    if (V.z >= 14.5) { S.spider = b.dataset.key; drawMap(); return; }
    zoomAt(V.z + 2, +b.dataset.x, +b.dataset.y);
  });
  // pan, wheel and pinch
  const ptrs = new Map(); let pan = null;
  map.addEventListener('pointerdown', e => {
    if (e.target.closest('.mk')) return; ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); map.setPointerCapture(e.pointerId);
    if (ptrs.size === 1) pan = { x: e.clientX, y: e.clientY, c: { ...V.c }, z: V.z, moved: 0 };
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pan = { pinch: Math.hypot(a.x - b.x, a.y - b.y), z: V.z, moved: 1 }; }
    map.classList.add('drag'); cancelAnimationFrame(anim);
  });
  map.addEventListener('pointermove', e => {
    if (!pan || !ptrs.has(e.pointerId)) return; ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pan.pinch && ptrs.size === 2) { const [a, b] = [...ptrs.values()], r = map.getBoundingClientRect(); zoomAt(pan.z + Math.log2(Math.hypot(a.x - b.x, a.y - b.y) / pan.pinch), (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top); return; }
    const dx = e.clientX - pan.x, dy = e.clientY - pan.y; if (Math.abs(dx) + Math.abs(dy) > 3) pan.moved = 1;
    const [cx, cy] = merc(pan.c.lat, pan.c.lng, V.z); V.c = unmerc(cx - dx, cy - dy, V.z); drawMap();
  });
  const endPan = e => { ptrs.delete(e.pointerId); if (!ptrs.size) { pan = null; map.classList.remove('drag'); } };
  map.addEventListener('pointerup', endPan); map.addEventListener('pointercancel', endPan);
  map.addEventListener('wheel', e => { e.preventDefault(); const r = map.getBoundingClientRect(); zoomAt(V.z - e.deltaY / 300, e.clientX - r.left, e.clientY - r.top); }, { passive: false });
  map.addEventListener('dblclick', e => { const r = map.getBoundingClientRect(); zoomAt(V.z + 1, e.clientX - r.left, e.clientY - r.top); });
  // sheet drag (phone): grabber and header
  if (PH) {
    const grab = $('.grab'); let sd = null;
    const down = e => { if (e.target.closest('button:not(.grab),input')) return; sd = { y: e.clientY, y0: sheetY, t: performance.now(), moved: 0 }; sheet.style.transition = 'none'; e.currentTarget.setPointerCapture(e.pointerId); };
    const move = e => { if (!sd) return; const dy = e.clientY - sd.y; if (Math.abs(dy) > 4) sd.moved = 1; const s = snaps(); sheetY = Math.max(s[2], Math.min(s[0] + 40, sd.y0 + dy)); sheet.style.transform = `translateY(${sheetY}px)`; posCtl(); drawMap(); };
    const up = e => { if (!sd) return; const dy = e.clientY - sd.y, v = dy / Math.max(1, performance.now() - sd.t), s = snaps();
      if (!sd.moved) { if (e.currentTarget === grab) setSnap(snapI === 2 ? 0 : snapI + 1); else setSnap(snapI); sd = null; return; }
      let i = s.map((y, j) => [Math.abs(y - sheetY), j]).sort((a, b) => a[0] - b[0])[0][1];
      if (v < -.5) i = Math.min(2, (sheetY < s[1] ? 2 : 1)); if (v > .5) i = sheetY > s[1] ? 0 : 1; sd = null; setSnap(i); };
    for (const el of [grab, shd]) { el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); }
    grab.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { setSnap(snapI === 2 ? 0 : snapI + 1); e.preventDefault(); } if (e.key === 'ArrowUp') setSnap(snapI + 1); if (e.key === 'ArrowDown') setSnap(snapI - 1); });
  }
  // press feedback for touch (CSS :active handles mouse)
  root.addEventListener('pointerdown', e => { const b = e.target.closest('button'); if (b) { b.classList.add('press'); const off = () => { b.classList.remove('press'); window.removeEventListener('pointerup', off); }; window.addEventListener('pointerup', off); } });
  new ResizeObserver(() => { setSnap(snapI, false); drawMap(); }).observe(root);

  render(); setSnap(1, false); V.c = { ...HOME[0] }; V.z = HOME[1]; drawMap();
  return { S, V, open: n => { const p = D.places.find(x => x.n === n || x.u === n); if (p) open(p.u, 'quiet'); }, close, setTown, setSnap, render, search: s => { q.value = s; S.q = s; render(); }, toggle: k => root.querySelector(`[data-c=${k}]`).click(), kashrutSheet, townSheet, zoomAt, flyTo };
}

// ---------- review page: theme + layout toggles ----------
function theme(t) { const r = document.documentElement; if (t === 'system') delete r.dataset.theme; else r.dataset.theme = t; document.querySelectorAll('[data-theme-b]').forEach(b => b.setAttribute('aria-pressed', b.dataset.themeB === t)); store.set('ka-s15-theme', t); }
function boot() {
  const KA = window.KA = { phone: App(document.getElementById('phone'), 'phone'), desk: App(document.getElementById('desk'), 'desk'), theme };
  document.querySelectorAll('[data-theme-b]').forEach(b => b.onclick = () => theme(b.dataset.themeB));
  document.querySelectorAll('[data-view-b]').forEach(b => b.onclick = () => { document.body.dataset.view = b.dataset.viewB; document.querySelectorAll('[data-view-b]').forEach(x => x.setAttribute('aria-pressed', x === b)); setTimeout(() => { KA.phone.render(); KA.desk.render(); }, 30); });
  theme(store.get('ka-s15-theme') || 'system');
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
