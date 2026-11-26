// ---- pure logic: no DOM, no state. Unit-tested in tests/logic.test.mjs ----
const DAYS = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
const IL_F = (() => { try { return new Intl.DateTimeFormat('en-US', { timeZone:'Asia/Jerusalem', year:'numeric', month:'numeric', day:'numeric', hour:'numeric', minute:'numeric', second:'numeric', hourCycle:'h23' }); } catch { return null; } })();
// Israel wall-clock time as a Date, so 'open now' is right even when the phone's clock zone is not Israel
const IL = (d = new Date()) => { if (!IL_F) return new Date(d); const p = {}; for (const x of IL_F.formatToParts(d)) p[x.type] = x.value; return new Date(+p.year, p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second); };
const rad = x => x * Math.PI / 180;
const hhmm = m => String(Math.floor(m/60)%24).padStart(2,'0') + ':' + String(m%60).padStart(2,'0');
// sunset at sea level by the NOAA solar calculator (Meeus; the algorithm Hebcal and KosherJava use), computed
// on the device with no external service; evaluated again at the sunset instant for accuracy.
// candles(): Chabad custom, 18 min before sunset, Jerusalem 40; seconds are dropped (never later than the minute).
function sunset(ll, day) {
  const y = day.getFullYear(), mo = day.getMonth(), d = day.getDate(), s = x => Math.sin(rad(x)), co = x => Math.cos(rad(x));
  let t = 1080;                                   // minutes after 00:00 UTC, first guess
  for (let i = 0; i < 3; i++) {
    const T = (Date.UTC(y, mo, d) / 864e5 + 2440587.5 + t / 1440 - 2451545) / 36525;
    const L = ((280.46646 + T*(36000.76983 + T*0.0003032)) % 360 + 360) % 360;
    const M = 357.52911 + T*(35999.05029 - 0.0001537*T), e = 0.016708634 - T*(0.000042037 + 0.0000001267*T);
    const C = s(M)*(1.914602 - T*(0.004817 + 0.000014*T)) + s(2*M)*(0.019993 - 0.000101*T) + s(3*M)*0.000289;
    const om = 125.04 - 1934.136*T, lam = L + C - 0.00569 - 0.00478*s(om);
    const eps = 23 + (26 + (21.448 - T*(46.815 + T*(0.00059 - T*0.001813))) / 60) / 60 + 0.00256*co(om);
    const dec = Math.asin(s(eps) * s(lam)), v = Math.tan(rad(eps) / 2) ** 2;
    const eq = 4 * 180 / Math.PI * (v*s(2*L) - 2*e*s(M) + 4*e*v*s(M)*co(2*L) - 0.5*v*v*s(4*L) - 1.25*e*e*s(2*M));
    const la = rad(ll.lat), ha = Math.acos(co(90.833) / (Math.cos(la)*Math.cos(dec)) - Math.tan(la)*Math.tan(dec)) * 180 / Math.PI;
    t = 720 - 4*ll.lng - eq + 4*ha;
  }
  return new Date(Date.UTC(y, mo, d) + t * 60000);
}
function candles(city, ll, day) { const ss = sunset(ll, day); const min = city === 'ירושלים' ? 40 : 18; const c = IL(new Date(ss.getTime() - min*60000)); return hhmm(c.getHours()*60 + c.getMinutes()); }
const NOINFO = 'אין מידע על שעות הפעילות';
const WEEK = 7 * 1440;
// published periods -> merged opening intervals in week-minutes (0 = Sunday 00:00), sorted.
// Back-to-back, overlapping and midnight-crossing periods become one interval, so a 24-hour place or
// one open 08:00-00:00 then 00:00-02:00 has no false boundary. Copies a week before and after cover the
// Saturday -> Sunday wrap. An interval of a full week or more means open around the clock.
// A period whose close equals its open is a whole week (Google's convention for 'always open').
function openIntervals(periods) {
  const raw = [];
  for (const [od, oh, om, cd, ch, cm] of periods || []) {
    const o = od*1440 + oh*60 + om; let c = cd*1440 + ch*60 + cm; if (c <= o) c += WEEK;
    for (const k of [-WEEK, 0, WEEK]) raw.push([o + k, c + k]);
  }
  raw.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const out = [];
  for (const [o, c] of raw) { const last = out[out.length - 1]; if (last && o <= last[1]) last[1] = Math.max(last[1], c); else out.push([o, c]); }
  return out;
}
// status of a place at a given Israel wall-clock time. planned = the user picked a future time.
function statusAt(p, now, planned) {
  if (p.g && p.g.closed) return { s:'x', t: p.g.closed === 'סגור לצמיתות' ? 'נסגר לצמיתות (לפי גוגל)' : 'סגור זמנית (לפי גוגל)', r:4 };
  const g = p.g, wm = now.getDay()*1440 + now.getHours()*60 + now.getMinutes();
  if (g && g.periods && g.periods.length) {
    const iv = openIntervals(g.periods);
    for (const [o, c] of iv) if (wm >= o && wm < c) {
      if (c - o >= WEEK) return { s:'y', t:'פתוח 24 שעות', r:0 };
      const left = c - wm;
      if (left <= 60) return { s:'s', t: planned ? 'נסגר ב־' + hhmm(c % 1440) : 'נסגר בעוד ' + left + ' דק׳', r:0 };
      // the day of the close, with 00:00 counted as midnight of the day before
      const cm = c % 1440, k = c - (cm === 0 ? 1 : 0), kd = Math.floor((wm % 1440 + k - wm) / 1440);
      // tonight, or a late-night close (until 06:00 next morning): the hour alone; further away the day is named
      if (kd === 0 || (kd === 1 && cm > 0 && cm <= 360)) return { s:'y', t:'פתוח עד ' + hhmm(cm), r:0 };
      const day = kd === 1 ? (planned ? 'למחרת' : 'מחר') : 'יום ' + DAYS[Math.floor(k / 1440) % 7];
      return { s:'y', t:'פתוח עד ' + day + (cm === 0 ? ' בחצות' : ' ב־' + hhmm(cm)), r:0 };
    }
    const shut = planned ? 'סגור בשעה הזו' : 'סגור עכשיו';
    const nx = iv.find(([o]) => o > wm);
    if (!nx) return { s:'n', t:shut, r:3 };
    const u = nx[0] - wm, od = Math.floor(nx[0] / 1440) % 7;
    const dd = Math.floor((wm % 1440 + u) / 1440);
    const when = dd === 0 ? (planned ? '' : 'היום ') : dd === 1 ? (planned ? 'למחרת ' : 'מחר ') : 'ביום ' + DAYS[od] + ' ';
    const opens = 'נפתח ' + when + 'ב־' + hhmm(nx[0] % 1440);
    return u < 20*60 ? { s:'n', t:opens, r:1 } : { s:'n', t:shut + ' · ' + opens, r:3 };
  }
  // the source list only says 'open Thursday night'; no hours were published, so never compute open/closed from it
  if (p.fri) return { s:'u', t:'פתוח בליל שישי (לפי המאגר), השעות לא ידועות', r:2 };
  return { s:'u', t:NOINFO, r:2 };
}
// search text: forgiving of Hebrew spelling (full/defective, final letters, alef) and common English words
const EN = { pizza:'פיצה', sushi:'סושי', burger:'המבורגר', burgers:'המבורגר', hamburger:'המבורגר', falafel:'פלאפל', shawarma:'שווארמה', shwarma:'שווארמה', shawarma2:'שווארמה', cafe:'קפה', coffee:'קפה', bakery:'מאפייה', icecream:'גלידה', gelato:'גלידה', bagel:'בייגל', bagels:'בייגל', grill:'גריל', catering:'קייטרינג', hotel:'מלון', restaurant:'מסעדה', meat:'בשרי', dairy:'חלבי', parve:'פרווה', pareve:'פרווה', chabad:'חבד', deli:'מעדנייה' };
const FIN = { 'ך':'כ', 'ם':'מ', 'ן':'נ', 'ף':'פ', 'ץ':'צ' };
function normText(s) {
  s = String(s || '').toLowerCase().replace(/ice\s*cream/g, 'icecream');
  s = s.replace(/[a-z]+/g, w => EN[w] || w);
  s = s.replace(/[״"׳'’`\-–־.,]/g, '').replace(/[ךםןףץ]/g, c => FIN[c]);
  s = s.replace(/ו+/g, 'ו').replace(/י+/g, 'י');
  s = s.replace(/([א-ת])א(?=[א-ת])/g, '$1');   // medial alef: שווארמה = שוורמה
  s = s.replace(/א(?=\s|$)/g, 'ה');            // final alef as he: פיצא = פיצה
  return s.replace(/\s+/g, ' ').trim();
}
// Friday opening ranges in minutes from Friday 00:00 [open, close], from published hours only.
// Uses the merged intervals: an interval that opens on Friday is kept whole (its close may pass midnight);
// one that opened earlier and is still open after 06:00 on Friday starts at 0 (a Thursday-night spill that
// ends before dawn is not a Friday opening). Open around the clock -> [0, 1440].
function friRanges(p) {
  const F = 5 * 1440, out = [];
  for (const [o, c] of openIntervals(p.g && p.g.periods)) {
    if (c - o >= WEEK) { if (o <= F) return [[0, 1440]]; continue; }
    if (o >= F && o < F + 1440) out.push([o - F, c - F]);
    else if (o < F && c > F + 360) out.push([0, c - F]);
  }
  return out.sort((a, b) => a[0] - b[0]);
}
