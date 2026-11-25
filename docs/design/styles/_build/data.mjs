// Real data for the S1-5 style mockups: every restaurant-type place (k starts with מסעדה) in data/places.json,
// across the whole country. Status from src/logic.js statusAt:
//   st  = Tuesday 1.12.2026 12:30 Israel wall clock (the mock's "now")
//   stF = Friday 27.11.2026 12:00 (planned time) – used by the "פתוח בשישי" chip together with friRanges
// Candle lighting per town for the coming Friday 4.12.2026 (Chabad custom, from logic.js candles). Nothing invented.
import fs from 'fs';
const R = new URL('../../../../', import.meta.url).pathname;
const m = {}; new Function('M', fs.readFileSync(R + 'src/logic.js', 'utf8') + '\nM.statusAt=statusAt;M.candles=candles;M.friRanges=friRanges;M.normText=normText;M.hhmm=hhmm;')(m);
const P = JSON.parse(fs.readFileSync(R + 'data/places.json', 'utf8'));
const CITY = JSON.parse(fs.readFileSync(R + 'data/cities.json', 'utf8'));
const HC = { chabad: 'חב״ד', eda: 'העדה החרדית', landa: 'לנדא', products: 'מוצרי העדה/לנדא' };
const cityLL = c => CITY[c] ? { lat: CITY[c][0], lng: CITY[c][1] } : null;
const exact = p => !!(p.g && p.g.loc);
const now = new Date(2026, 11, 1, 12, 30);      // Tue 1.12.2026 12:30
const fri = new Date(2026, 10, 27, 12, 0);      // Fri 27.11.2026 12:00
const friC = new Date(2026, 11, 4);             // coming Friday for candle lighting
const out = [], towns = {};
for (const p of P) {
  if (!p.k.startsWith('מסעדה')) continue;
  const ll = exact(p) ? p.g.loc : cityLL(p.c); if (!ll) continue;
  const g = p.g || {};
  const st = m.statusAt(p, now), sf = m.statusAt(p, fri, true), fr = m.friRanges(p);
  const frT = st.s === 'x' || !fr.length ? null : fr.map(([o, c]) => c - o >= 1440 ? 'פתוח 24 שעות' : m.hhmm(o) + '–' + m.hhmm(c % 1440)).join(', ');
  out.push({ u: p.u, n: p.n, s: p.s, c: p.c, h: p.h || HC[p.hc], hc: p.hc, t: p.t || [], f: p.f, ph: g.phone || p.p || '',
    ex: exact(p) ? 1 : 0, la: +ll.lat.toFixed(5), lo: +ll.lng.toFixed(5), wk: g.week || null, chk: g.chk || null, f0: p.fri ? 1 : 0,
    db: g.q && (g.q.includes('hours-shabbat') || g.q.includes('hours-24h')) ? 1 : 0,
    st: [st.s, st.t, st.r], sf: [sf.s, sf.t, sf.r], fr: frT, fc: fr.length ? Math.max(...fr.map(x => x[1])) : -1,
    hay: m.normText([p.n, p.s, p.c, p.h, p.f, (p.t || []).join(' '), HC[p.hc]].join(' ')) });
  towns[p.c] = (towns[p.c] || 0) + 1;
}
const T = Object.entries(towns).filter(([c]) => CITY[c]).map(([c, n]) => ({ c, n, la: CITY[c][0], lo: CITY[c][1], cn: m.candles(c, cityLL(c), friC), hay: m.normText(c) }))
  .sort((a, b) => b.n - a.n || a.c.localeCompare(b.c, 'he'));
const res = { now: 'יום שלישי, 1.12.2026, 12:30', places: out, towns: T };
fs.writeFileSync(new URL('./data.json', import.meta.url), JSON.stringify(res));
const cnt = s => out.filter(p => s.includes(p.st[0])).length;
console.log('places', out.length, 'towns', T.length, 'open/soon', cnt('ys'), 'closed now', cnt('n'), 'noinfo', cnt('u'), 'google-closed', cnt('x'),
  'friday hours', out.filter(p => p.fr).length, 'doubt', out.filter(p => p.db).length, 'bytes', JSON.stringify(res).length);
console.log(T.slice(0, 12).map(t => t.c + ' ' + t.n + ' ' + t.cn).join(' | '));
