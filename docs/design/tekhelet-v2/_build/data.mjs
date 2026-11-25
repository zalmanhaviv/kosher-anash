// Real sample data for the tekhelet-v2 mock: every place within 12 km of Safed (default kind מסעדה*),
// status from src/logic.js statusAt at Friday 27.11.2026 12:30 Israel wall clock. Nothing invented.
import fs from 'fs';
const R = new URL('../../../../', import.meta.url).pathname;
const m = {}; new Function('M', fs.readFileSync(R + 'src/logic.js', 'utf8') + '\nM.statusAt=statusAt;M.candles=candles;M.friRanges=friRanges;M.normText=normText;M.hhmm=hhmm;')(m);
const P = JSON.parse(fs.readFileSync(R + 'data/places.json', 'utf8'));
const CITY = JSON.parse(fs.readFileSync(R + 'data/cities.json', 'utf8'));
const HC = { chabad: 'חב״ד', eda: 'העדה החרדית', landa: 'לנדא', products: 'מוצרי העדה/לנדא' };
const rad = x => x * Math.PI / 180;
const km = (a, b) => { const dLa = rad(b.lat - a.lat), dLo = rad(b.lng - a.lng); const x = Math.sin(dLa / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLo / 2) ** 2; return 12742 * Math.asin(Math.sqrt(x)); };
const cityLL = c => CITY[c] ? { lat: CITY[c][0], lng: CITY[c][1] } : null;
const exact = p => !!(p.g && p.g.loc); const LLof = p => exact(p) ? p.g.loc : cityLL(p.c);
const now = new Date(2026, 10, 27, 12, 30);
const city = 'צפת', c0 = cityLL(city);
let nOpen = 0; for (const p of P) if (p.k === 'מסעדה' && /[ys]/.test(m.statusAt(p, now).s)) nOpen++;
const WHEN = ['13:00', '14:00', '15:00', '16:00'];
const atW = w => new Date(2026, 10, 27, +w.slice(0, 2), +w.slice(3));
const nOpenW = {}; for (const w of WHEN) { nOpenW[w] = 0; for (const p of P) if (p.k === 'מסעדה' && /[ys]/.test(m.statusAt(p, atW(w), true).s)) nOpenW[w]++; }
const NOINFO = 'אין מידע על שעות הפעילות';
const out = [];
for (const p of P) {
  if (!p.k.startsWith('מסעדה')) continue;
  const ll = LLof(p); if (!ll) continue;
  const d = km(c0, ll); if (p.c !== city && d > 12) continue;
  const st = m.statusAt(p, now);
  const fr = m.friRanges(p);
  const fri = st.s === 'x' ? null : fr.length
    ? { s: 'y', t: 'בשישי ' + fr.map(([o, c]) => c - o >= 1440 ? 'פתוח 24 שעות' : m.hhmm(o) + '–' + m.hhmm(c % 1440)).join(', '), close: Math.max(...fr.map(x => x[1])) }
    : (p.f === 'אוכל לשבת' ? { s: 'u', t: 'אוכל לשבת · ' + NOINFO, close: -1 } : null);
  const g = p.g || {};
  out.push({ u: p.u, n: p.n, s: p.s, c: p.c, h: p.h || HC[p.hc], hc: p.hc, t: p.t, f: p.f, phone: g.phone || p.p || '',
    exact: exact(p), loc: ll, week: g.week || null, chk: g.chk || null, fri0: !!p.fri,
    doubt: !!(g.q && (g.q.includes('hours-shabbat') || g.q.includes('hours-24h'))),
    st: { s: st.s, t: st.t, r: st.r }, stw: Object.fromEntries(WHEN.map(w => { const x = m.statusAt(p, atW(w), true); return [w, { s: x.s, t: x.t, r: x.r }]; })), fr: fri, inCity: p.c === city, d: +d.toFixed(2),
    hay: m.normText([p.n, p.s, p.c, p.h, p.f, (p.t || []).join(' '), HC[p.hc]].join(' ')) });
}
out.sort((a, b) => a.st.r - b.st.r || a.d - b.d || a.n.localeCompare(b.n, 'he'));
const res = { now: 'יום שישי, 27.11.2026, 12:30', candles: m.candles(city, c0, new Date(2026, 10, 27)), nOpen, nOpenW, center: c0, places: out };
fs.writeFileSync(new URL('./mockdata.json', import.meta.url), JSON.stringify(res));
console.log(res.candles, nOpen, out.length, 'open/soon', out.filter(p => /[ys]/.test(p.st.s)).length, 'doubt', out.filter(p => p.doubt).map(p => p.n), 'fri', out.filter(p => p.fr).length);
console.log(out.slice(0, 14).map(p => [p.n, p.c, p.st.t, p.hc, p.f, p.t.join('/')].join(' | ')).join('\n'));
