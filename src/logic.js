// ---- pure logic: no DOM, no state. Unit-tested in tests/logic.test.mjs ----
const DAYS = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
const IL_F = (() => { try { return new Intl.DateTimeFormat('en-US', { timeZone:'Asia/Jerusalem', year:'numeric', month:'numeric', day:'numeric', hour:'numeric', minute:'numeric', second:'numeric', hourCycle:'h23' }); } catch { return null; } })();
// Israel wall-clock time as a Date, so 'open now' is right even when the phone's clock zone is not Israel
const IL = (d = new Date()) => { if (!IL_F) return new Date(d); const p = {}; for (const x of IL_F.formatToParts(d)) p[x.type] = x.value; return new Date(+p.year, p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second); };
const rad = x => x * Math.PI / 180;
const hhmm = m => String(Math.floor(m/60)%24).padStart(2,'0') + ':' + String(m%60).padStart(2,'0');
// sunset (NOAA approximation, no external service) -> candle lighting by Chabad custom: 18 min before sunset, Jerusalem 40
function sunset(ll, day) {
  const y = day.getFullYear(), mo = day.getMonth(), d = day.getDate();
  const N = Math.round((Date.UTC(y, mo, d) - Date.UTC(y, 0, 1)) / 864e5) + 1;
  const g = 2 * Math.PI / 365 * (N - 1 + (18 - 12) / 24);
  const eq = 229.18 * (0.000075 + 0.001868*Math.cos(g) - 0.032077*Math.sin(g) - 0.014615*Math.cos(2*g) - 0.040849*Math.sin(2*g));
  const dec = 0.006918 - 0.399912*Math.cos(g) + 0.070257*Math.sin(g) - 0.006758*Math.cos(2*g) + 0.000907*Math.sin(2*g) - 0.002697*Math.cos(3*g) + 0.00148*Math.sin(3*g);
  const la = rad(ll.lat), ha = Math.acos(Math.cos(rad(90.833)) / (Math.cos(la)*Math.cos(dec)) - Math.tan(la)*Math.tan(dec)) * 180 / Math.PI;
  return new Date(Date.UTC(y, mo, d) + (720 - 4*(ll.lng - ha) - eq) * 60000);
}
function candles(city, ll, day) { const ss = sunset(ll, day); const min = city === 'ירושלים' ? 40 : 18; const c = IL(new Date(ss.getTime() - min*60000)); return hhmm(c.getHours()*60 + c.getMinutes()); }
const NOINFO = 'אין מידע על שעות הפעילות';
// status of a place at a given Israel wall-clock time. planned = the user picked a future time.
function statusAt(p, now, planned) {
  if (p.g && p.g.closed) return { s:'x', t: p.g.closed === 'סגור לצמיתות' ? 'נסגר לצמיתות (לפי גוגל)' : 'סגור זמנית (לפי גוגל)', r:4 };
  const g = p.g, wm = now.getDay()*1440 + now.getHours()*60 + now.getMinutes();
  if (g && g.periods && g.periods.length) {
    let next = null;
    for (const [od,oh,om,cd,ch,cm] of g.periods) {
      const o = od*1440 + oh*60 + om; let c = cd*1440 + ch*60 + cm; if (c <= o) c += 7*1440;
      for (const w of [wm, wm + 7*1440]) if (w >= o && w < c) {
        const left = c - w;
        if (left <= 60) return { s:'s', t: planned ? 'נסגר ב־' + hhmm(c % 1440) : 'נסגר בעוד ' + left + ' דק׳', r:0 };
        return { s:'y', t:'פתוח עד ' + hhmm(c % 1440), r:0 };
      }
      const u = (o - wm + 7*1440) % (7*1440); if (!next || u < next.u) next = { u, o };
    }
    const shut = planned ? 'סגור בשעה הזו' : 'סגור עכשיו';
    if (!next) return { s:'n', t:shut, r:3 };
    const dd = Math.floor((wm % 1440 + next.u) / 1440), od = Math.floor(next.o / 1440) % 7;
    const when = dd === 0 ? (planned ? '' : 'היום ') : dd === 1 ? (planned ? 'למחרת ' : 'מחר ') : 'ביום ' + DAYS[od] + ' ';
    const opens = 'נפתח ' + when + 'ב־' + hhmm(next.o % 1440);
    return next.u < 20*60 ? { s:'n', t:opens, r:1 } : { s:'n', t:shut + ' · ' + opens, r:3 };
  }
  // the source list only says 'open Thursday night'; no hours were published, so never compute open/closed from it
  if (p.fri) return { s:'u', t:'פתוח בליל שישי (לפי המאגר), השעות לא ידועות', r:2 };
  return { s:'u', t:NOINFO, r:2 };
}
