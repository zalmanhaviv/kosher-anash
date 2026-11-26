// Unit tests for src/logic.js. Run: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const code = readFileSync(new URL('../src/logic.js', import.meta.url), 'utf8');
const ctx = { Intl, Date, Math, String, Number, Object };
vm.runInNewContext(code + '\n;globalThis.L = { DAYS, IL, hhmm, sunset, candles, NOINFO, statusAt }; globalThis.L2 = { normText, friRanges };', ctx);
const { IL, hhmm, sunset, candles, NOINFO, statusAt } = ctx.L;

// wall-clock Date: d = 0 Sunday … 6 Saturday, using the week of 22 Nov 2026 (Sunday)
const at = (dow, h, m = 0) => new Date(2026, 10, 22 + dow, h, m);
const weekday = (oh, om, ch, cm, days = [0, 1, 2, 3, 4]) => ({ n: 'x', g: { periods: days.map(d => [d, oh, om, d, ch, cm]) } });

test('open with time left', () => {
  const p = weekday(9, 0, 22, 0);
  assert.deepEqual({ ...statusAt(p, at(1, 12), false) }, { s: 'y', t: 'פתוח עד 22:00', r: 0 });
});

test('closing within the hour', () => {
  const p = weekday(9, 0, 22, 0);
  assert.equal(statusAt(p, at(1, 21, 30), false).t, 'נסגר בעוד 30 דק׳');
  assert.equal(statusAt(p, at(1, 21, 30), true).t, 'נסגר ב־22:00');
});

test('closed: opens later today / tomorrow / on a named day', () => {
  const p = weekday(9, 0, 22, 0);
  assert.equal(statusAt(p, at(1, 7), false).t, 'נפתח היום ב־09:00');
  assert.equal(statusAt(p, at(1, 23), false).t, 'נפתח מחר ב־09:00');
  assert.equal(statusAt(p, at(4, 23), false).t, 'סגור עכשיו · נפתח ביום ראשון ב־09:00');
});

test('hours that cross midnight', () => {
  const p = { g: { periods: [[4, 20, 0, 5, 2, 0]] } }; // Thursday 20:00 → Friday 02:00
  assert.equal(statusAt(p, at(4, 23), false).s, 'y');
  assert.equal(statusAt(p, at(5, 0, 30), false).t, 'פתוח עד 02:00');
  assert.equal(statusAt(p, at(5, 1, 15), false).t, 'נסגר בעוד 45 דק׳');
  assert.equal(statusAt(p, at(5, 3), false).s, 'n');
});

test('Saturday-night opening wraps the week (Saturday → Sunday)', () => {
  const p = { g: { periods: [[6, 20, 0, 0, 1, 0]] } };
  assert.equal(statusAt(p, at(0, 0, 30), false).s, 's');
});

test('Friday: no assumption of closing before Shabbat, only published hours', () => {
  const p = { g: { periods: [[5, 8, 0, 5, 14, 0]] } };
  assert.equal(statusAt(p, at(5, 12), false).t, 'פתוח עד 14:00');
  assert.equal(statusAt(p, at(5, 15), false).s, 'n');
  const none = { n: 'y' };
  assert.equal(statusAt(none, at(5, 15), false).t, NOINFO);
});

test('no published hours: never guessed', () => {
  assert.deepEqual({ ...statusAt({}, at(2, 12), false) }, { s: 'u', t: NOINFO, r: 2 });
});

test('"Thursday night" in the source list is not treated as open', () => {
  const p = { fri: true };
  for (const t of [at(4, 21), at(5, 1), at(2, 12)]) assert.equal(statusAt(p, t, false).s, 'u');
});

test('closed by Google wins over hours', () => {
  const p = { g: { closed: 'סגור לצמיתות', periods: [[1, 0, 0, 1, 23, 59]] } };
  assert.equal(statusAt(p, at(1, 12), false).s, 'x');
});

test('Israel time is used whatever the device time zone', () => {
  const instant = new Date(Date.UTC(2026, 10, 27, 8, 0)); // Friday 10:00 in Israel (winter, UTC+2)
  const w = IL(instant);
  assert.equal(w.getDay(), 5); assert.equal(w.getHours(), 10);
  const summer = IL(new Date(Date.UTC(2026, 6, 1, 9, 0))); // UTC+3 in summer
  assert.equal(summer.getHours(), 12);
});

test('candle lighting: Chabad custom, Jerusalem 40 minutes, others 18', () => {
  const day = new Date(2026, 10, 27);
  const jlm = candles('ירושלים', { lat: 31.778, lng: 35.235 }, day);
  const tlv = candles('תל אביב', { lat: 32.08, lng: 34.78 }, day);
  const toM = s => +s.slice(0, 2) * 60 + +s.slice(3);
  assert.match(jlm, /^16:0\d$|^15:5\d$/); // published: about 16:00 (40 min)
  assert.match(tlv, /^16:2\d$|^16:1\d$/); // published: about 16:20 (18 min)
  assert.ok(toM(tlv) - toM(jlm) >= 15);
});

test('hhmm formatting', () => {
  assert.equal(hhmm(0), '00:00'); assert.equal(hhmm(9 * 60 + 5), '09:05'); assert.equal(hhmm(1440), '00:00');
});

test('search forgives spelling and English', () => {
  const { normText } = ctx.L2;
  const same = (a, b) => assert.equal(normText(a), normText(b), `${a} ≠ ${b}`);
  same('מאפיה', 'מאפייה'); same('שוורמה', 'שווארמה'); same('פיצא', 'פיצה'); same('בדץ', 'בד"ץ'); same('חבד', 'חב״ד');
  same('pizza', 'פיצה'); same('Ice Cream', 'גלידה'); same('SUSHI', 'סושי');
  assert.ok(normText('פיצה מילוס בני ברק').includes(normText('פיצה')));
  assert.equal(normText('770'), '770');
});

test('Friday ranges come only from published Friday hours', () => {
  const { friRanges } = ctx.L2;
  assert.deepEqual(friRanges({}).length, 0);
  const r = friRanges({ g: { periods: [[4, 9, 0, 4, 22, 0], [5, 8, 30, 5, 14, 0]] } });
  assert.deepEqual(Array.from(r, x => [...x]), [[510, 840]]);
});

// ---- S1-8: merged periods (P0-2), Shabbat edges, candle lighting ----
const day24 = d => [d, 0, 0, (d + 1) % 7, 0, 0];
const all24 = { g: { periods: [0, 1, 2, 3, 4, 5, 6].map(day24) } };
// the real shape of the flagged places (e.g. Logasi, Bnei Brak): 24h Sunday–Thursday, Friday until 14:00
const exShabbat = { g: { periods: [0, 1, 2, 3, 4].map(day24).concat([[5, 0, 0, 5, 14, 0]]) } };

test('24 hours every day: never a false closing, at any minute of the week', () => {
  assert.equal(statusAt(all24, at(0, 23, 30), false).t, 'פתוח 24 שעות'); // the verified bug said 'נסגר בעוד 30 דק׳'
  for (let d = 0; d < 7; d++) for (const [h, m] of [[0, 0], [23, 30], [23, 59], [12, 0]]) {
    const st = statusAt(all24, at(d, h, m), false);
    assert.equal(st.s, 'y', `day ${d} ${h}:${m}`); assert.equal(st.t, 'פתוח 24 שעות');
  }
  assert.equal(statusAt(all24, at(6, 23, 45), true).t, 'פתוח 24 שעות');
  // Google's single 'always open' period (close = open)
  assert.equal(statusAt({ g: { periods: [[0, 0, 0, 0, 0, 0]] } }, at(3, 3), false).t, 'פתוח 24 שעות');
});

test('24 hours except Shabbat: closes only at the published Friday hour', () => {
  assert.equal(statusAt(exShabbat, at(0, 23, 30), false).t, 'פתוח עד יום שישי ב־14:00');
  assert.equal(statusAt(exShabbat, at(1, 0, 0), false).t, 'פתוח עד יום שישי ב־14:00');
  assert.equal(statusAt(exShabbat, at(4, 14, 30), false).t, 'פתוח עד מחר ב־14:00');
  assert.equal(statusAt(exShabbat, at(4, 14, 30), true).t, 'פתוח עד למחרת ב־14:00');
  assert.equal(statusAt(exShabbat, at(5, 9), false).t, 'פתוח עד 14:00');
  assert.equal(statusAt(exShabbat, at(5, 13, 20), false).t, 'נסגר בעוד 40 דק׳');
  assert.equal(statusAt(exShabbat, at(5, 15), false).t, 'סגור עכשיו · נפתח ביום ראשון ב־00:00');
  assert.equal(statusAt(exShabbat, at(6, 21), false).t, 'נפתח מחר ב־00:00');
});

test('a far close at 00:00 is told as midnight of the day before', () => {
  const p = { g: { periods: [0, 1, 2, 3].map(day24).concat([[4, 0, 0, 5, 0, 0], [5, 6, 0, 5, 16, 0]]) } }; // 24h until Thursday night
  assert.equal(statusAt(p, at(0, 23, 30), false).t, 'פתוח עד יום חמישי ב־00:00');
  assert.equal(statusAt(p, at(3, 23), false).t, 'פתוח עד מחר ב־00:00');
  assert.equal(statusAt(p, at(4, 0), false).t, 'פתוח עד 00:00');
  assert.equal(statusAt(p, at(4, 23, 15), false).t, 'נסגר בעוד 45 דק׳');
});

test('back-to-back periods across midnight are one opening (08:00–00:00 then 00:00–02:00)', () => {
  const p = { g: { periods: [[1, 8, 0, 2, 0, 0], [2, 0, 0, 2, 2, 0]] } };
  assert.equal(statusAt(p, at(1, 23, 30), false).t, 'פתוח עד 02:00');
  assert.equal(statusAt(p, at(1, 23, 30), false).s, 'y');
  assert.equal(statusAt(p, at(2, 0, 0), false).t, 'פתוח עד 02:00');
  assert.equal(statusAt(p, at(2, 1, 30), false).t, 'נסגר בעוד 30 דק׳');
  assert.equal(statusAt(p, at(2, 2, 0), false).s, 'n');
  // the same day split in two touching periods
  const q = { g: { periods: [[3, 8, 0, 3, 14, 0], [3, 14, 0, 3, 22, 0]] } };
  assert.equal(statusAt(q, at(3, 13, 30), false).t, 'פתוח עד 22:00');
});

test('overlapping periods are merged; a real gap still closes', () => {
  const p = { g: { periods: [[2, 8, 0, 2, 15, 0], [2, 12, 0, 2, 20, 0]] } };
  assert.equal(statusAt(p, at(2, 14, 30), false).t, 'פתוח עד 20:00');
  const gap = { g: { periods: [[2, 8, 0, 2, 13, 0], [2, 16, 0, 2, 20, 0]] } };
  assert.equal(statusAt(gap, at(2, 12, 30), false).t, 'נסגר בעוד 30 דק׳');
  assert.equal(statusAt(gap, at(2, 14), false).t, 'נפתח היום ב־16:00');
});

test('week wrap: Saturday night into Sunday, merged with Sunday hours', () => {
  const p = { g: { periods: [[6, 20, 0, 0, 0, 0], [0, 0, 0, 0, 2, 0]] } };
  assert.equal(statusAt(p, at(6, 23, 30), false).t, 'פתוח עד 02:00');
  assert.equal(statusAt(p, at(0, 1, 30), false).t, 'נסגר בעוד 30 דק׳');
  // Motzei Shabbat opening that continues into a 24h Sunday (shape of several flagged bakeries)
  const b = { g: { periods: exShabbat.g.periods.concat([[6, 20, 0, 0, 0, 0]]) } };
  assert.equal(statusAt(b, at(6, 23, 30), false).t, 'פתוח עד יום שישי ב־14:00');
});

test('Motzei Shabbat opening: only the published hour', () => {
  const p = { g: { periods: [[0, 9, 0, 0, 22, 0], [6, 18, 30, 0, 1, 0]] } };
  assert.equal(statusAt(p, at(6, 12), false).t, 'נפתח היום ב־18:30');
  assert.equal(statusAt(p, at(6, 12), true).t, 'נפתח ב־18:30');
  assert.equal(statusAt(p, at(6, 19), false).t, 'פתוח עד 01:00');
  assert.equal(statusAt(p, at(0, 0, 30), false).t, 'נסגר בעוד 30 דק׳');
  assert.equal(statusAt(p, at(0, 9, 30), false).t, 'פתוח עד 22:00');
});

test('Erev Shabbat: a close before candle lighting comes only from published hours', () => {
  const early = { g: { periods: [[5, 7, 0, 5, 15, 30]] } };
  assert.equal(statusAt(early, at(5, 15, 0), false).t, 'נסגר בעוד 30 דק׳');
  assert.equal(statusAt(early, at(5, 15, 30), false).s, 'n');
  // published Friday hours that run past candle lighting are shown as published – no Shabbat close is assumed
  const late = { g: { periods: [[5, 9, 0, 6, 1, 30]] } };
  assert.equal(statusAt(late, at(5, 17), false).t, 'פתוח עד 01:30');
  assert.equal(statusAt(late, at(5, 21), false).s, 'y');
  // no Friday period at all: closed on Friday by the published week, not by Shabbat
  assert.equal(statusAt(weekday(9, 0, 22, 0), at(5, 10), false).s, 'n');
});

test('no hours -> "אין מידע על שעות הפעילות", also for empty periods', () => {
  assert.equal(NOINFO, 'אין מידע על שעות הפעילות');
  assert.equal(statusAt({ g: { periods: [] } }, at(5, 12), false).t, NOINFO);
  assert.equal(statusAt({ g: {} }, at(5, 12), true).t, NOINFO);
});

test('quality flags g.q do not change the computed status (the UI adds the note)', () => {
  for (const q of [['hours-shabbat'], ['hours-24h'], ['hours-shabbat', 'shared-google']]) for (const base of [all24, exShabbat, weekday(9, 0, 22, 0)])
    for (const t of [at(0, 23, 30), at(5, 13, 30), at(6, 12)]) {
      const flagged = { g: { ...base.g, q } };
      assert.deepEqual({ ...statusAt(flagged, t, false) }, { ...statusAt(base, t, false) });
    }
});

test('friRanges merges back-to-back Friday periods and handles 24h places', () => {
  const { friRanges } = ctx.L2;
  const fr = p => Array.from(friRanges(p), x => [...x]);
  assert.deepEqual(fr(all24), [[0, 1440]]);
  assert.deepEqual(fr({ g: { periods: [[4, 0, 0, 5, 0, 0], [5, 0, 0, 6, 0, 0]] } }), [[0, 1440]]); // shape of a flagged Jerusalem place
  assert.deepEqual(fr(exShabbat), [[0, 840]]);
  assert.deepEqual(fr({ g: { periods: [[5, 8, 0, 5, 14, 0], [5, 14, 0, 5, 18, 0]] } }), [[480, 1080]]);
  assert.deepEqual(fr({ g: { periods: [[5, 8, 0, 6, 0, 0], [6, 0, 0, 6, 2, 0]] } }), [[480, 1560]]);
  assert.deepEqual(fr({ g: { periods: [[5, 7, 0, 5, 11, 0], [5, 12, 0, 5, 14, 0]] } }), [[420, 660], [720, 840]]);
  // a Thursday-night spill that ends before dawn is not a Friday opening
  assert.deepEqual(fr({ g: { periods: [[4, 20, 0, 5, 2, 0]] } }), []);
});

// Independent transcription of the NOAA Solar Calculator (the sea-level algorithm Hebcal/KosherJava use).
function refSunsetMin(lat, lng, y, mo, d) {
  const R = Math.PI / 180, sn = x => Math.sin(x * R), cs = x => Math.cos(x * R), tn = x => Math.tan(x * R);
  let t = 1080;
  for (let i = 0; i < 4; i++) {
    const T = (Date.UTC(y, mo, d) / 864e5 + 2440587.5 + t / 1440 - 2451545) / 36525;
    const L0 = ((280.46646 + T * (36000.76983 + T * 0.0003032)) % 360 + 360) % 360;
    const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
    const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
    const C = sn(M) * (1.914602 - T * (0.004817 + 0.000014 * T)) + sn(2 * M) * (0.019993 - 0.000101 * T) + sn(3 * M) * 0.000289;
    const app = L0 + C - 0.00569 - 0.00478 * sn(125.04 - 1934.136 * T);
    const ob = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60 + 0.00256 * cs(125.04 - 1934.136 * T);
    const dec = Math.asin(sn(ob) * sn(app)) / R, yy = tn(ob / 2) ** 2;
    const eq = 4 / R * (yy * sn(2 * L0) - 2 * e * sn(M) + 4 * e * yy * sn(M) * cs(2 * L0) - 0.5 * yy * yy * sn(4 * L0) - 1.25 * e * e * sn(2 * M));
    const ha = Math.acos(cs(90.833) / (cs(lat) * cs(dec)) - tn(lat) * tn(dec)) / R;
    t = 720 - 4 * lng - eq + 4 * ha;
  }
  return t; // minutes after 00:00 UTC
}
const CITY = { 'ירושלים': [31.778, 35.235], 'תל אביב': [32.08, 34.78], 'צפת': [32.965, 35.496], 'חיפה': [32.794, 34.989], 'אילת': [29.558, 34.952], 'כפר חב״ד': [31.988, 34.853] };
const toM = s => +s.slice(0, 2) * 60 + +s.slice(3);

test('candle lighting within ±1 minute of the NOAA reference, all year, Jerusalem 40 / elsewhere 18', () => {
  for (const [c, [lat, lng]] of Object.entries(CITY)) for (let n = 0; n < 730; n += 3) {
    const day = new Date(2026, 0, 1 + n);
    const ssUTC = refSunsetMin(lat, lng, day.getFullYear(), day.getMonth(), day.getDate());
    const il = IL(new Date(Date.UTC(day.getFullYear(), day.getMonth(), day.getDate()) + ssUTC * 60000));
    const want = il.getHours() * 60 + il.getMinutes() + il.getSeconds() / 60 - (c === 'ירושלים' ? 40 : 18);
    const got = toM(candles(c, { lat, lng }, day));
    assert.ok(Math.abs(got - want) <= 1, `${c} ${day.toDateString()}: ${got} vs ${want.toFixed(2)}`);
  }
});

test('candle lighting table: winter and summer (Israel time, DST), sea level', () => {
  const T = [ // date, city, expected (computed from the NOAA reference; ±1 minute)
    ['2026-11-27', 'ירושלים', '15:55'], ['2026-11-27', 'תל אביב', '16:18'], ['2026-11-27', 'צפת', '16:13'],
    ['2026-12-18', 'ירושלים', '15:57'], ['2026-12-18', 'חיפה', '16:18'], ['2026-12-18', 'אילת', '16:26'],
    ['2027-03-19', 'ירושלים', '17:09'], ['2027-03-19', 'תל אביב', '17:33'],
    ['2026-06-19', 'ירושלים', '19:07'], ['2026-06-19', 'תל אביב', '19:31'], ['2026-06-19', 'צפת', '19:31'], ['2026-06-19', 'אילת', '19:24'],
  ];
  for (const [ds, c, want] of T) {
    const [y, m, d] = ds.split('-').map(Number);
    const got = candles(c, { lat: CITY[c][0], lng: CITY[c][1] }, new Date(y, m - 1, d));
    assert.ok(Math.abs(toM(got) - toM(want)) <= 1, `${ds} ${c}: ${got} vs ${want}`);
  }
});

test('candle lighting is never later than sunset minus the custom (seconds dropped)', () => {
  const day = new Date(2026, 5, 19), ll = { lat: CITY['תל אביב'][0], lng: CITY['תל אביב'][1] };
  const ss = IL(sunset(ll, day)), exact = ss.getHours() * 60 + ss.getMinutes() + ss.getSeconds() / 60 - 18;
  const got = toM(candles('תל אביב', ll, day));
  assert.ok(got <= exact && exact - got < 1);
});
