// Stage 2 QA (docs/qa/stage2.md): known bugs in src/logic.js, kept as `todo` so CI stays green.
// When a bug is fixed, drop its `todo` (the test must then pass). Run: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const code = readFileSync(new URL('../src/logic.js', import.meta.url), 'utf8');
const ctx = { Intl, Date, Math, String, Number, Object };
vm.runInNewContext(code + '\n;globalThis.L = { DAYS, statusAt };', ctx);
const { DAYS, statusAt } = ctx.L;

// wall-clock Date: d = 0 Sunday … 6 Saturday in the week of 22 Nov 2026; d = 7 is the next Sunday
const at = (dow, h, m = 0) => new Date(2026, 10, 22 + dow, h, m);
const day24 = d => [d, 0, 0, (d + 1) % 7, 0, 0];
// open around the clock Sunday–Thursday, closes Thursday at 24:00 (= Friday 00:00), Friday 06:00–16:00
const toThuNight = { g: { periods: [0, 1, 2, 3].map(day24).concat([[4, 0, 0, 5, 0, 0], [5, 6, 0, 5, 16, 0]]) } };
// open around the clock Sunday 00:00 – Friday 14:00
const exShabbat = { g: { periods: [0, 1, 2, 3, 4].map(day24).concat([[5, 0, 0, 5, 14, 0]]) } };

// The instant a reader takes from "<day> ב־HH:MM": 'מחר' = tomorrow, 'יום X' / 'ביום X' = the next day named X,
// at HH:MM on that day (00:00 = the start of that day, as on any clock). A night ("הלילה", "מחר בלילה",
// "יום X בלילה", "מוצאי שבת") at 00:00 is the 00:00 that ends it, i.e. the start of the next day (rule of QA2-1).
function literal(now, text) {
  const m = /(הלילה |היום |מחר (?:בלילה )?|(?:ב)?מוצאי שבת |(?:ב)?יום (\S+) (?:בלילה )?)?ב־(\d\d):(\d\d)/.exec(text); if (!m) return null;
  const d = new Date(now); d.setHours(0, 0, 0, 0);
  const w = m[1] || '', night = w.includes('לילה') || w.includes('מוצאי');
  if (w.startsWith('מחר')) d.setDate(d.getDate() + 1);
  else if (w.includes('מוצאי')) d.setDate(d.getDate() + (6 - d.getDay() + 7) % 7);
  else if (m[2]) { const dow = DAYS.indexOf(m[2]); let k = (dow - d.getDay() + 7) % 7; d.setDate(d.getDate() + k); }
  if (night && +m[3] === 0 && +m[4] === 0) d.setDate(d.getDate() + 1);
  d.setHours(+m[3], +m[4]);
  return d;
}

test('QA2-1 control: an opening at 00:00 on Motzei Shabbat points at Sunday 00:00 ("נפתח הלילה ב־00:00")', () => {
  const now = at(6, 21), t = statusAt(exShabbat, now, false).t;
  assert.equal(+literal(now, t), +at(7, 0), t);
});

// QA2-1 (fixed in S2-5): a far close at 00:00 was named by the day before ("עד יום חמישי ב־00:00" for Thursday 24:00),
// so "מחר ב־00:00" meant two instants 24 hours apart. Now a 00:00 boundary is named by the night it ends.
test('QA2-1 a far close at 00:00 points at the real close (Sunday 23:30, closes Friday 00:00)', () => {
  const now = at(0, 23, 30), t = statusAt(toThuNight, now, false).t;
  assert.equal(+literal(now, t), +at(5, 0), t);
});
test('QA2-1 a far close at 00:00 points at the real close (Wednesday 23:00, closes Friday 00:00)', () => {
  const now = at(3, 23), t = statusAt(toThuNight, now, false).t;
  assert.equal(+literal(now, t), +at(5, 0), t);
});

test('QA2-1 an opening at 00:00 two nights ahead points at the real opening (Friday 15:00, opens Sunday 00:00)', () => {
  const now = at(5, 15), t = statusAt(exShabbat, now, false).t;
  assert.equal(+literal(now, t), +at(7, 0), t);
});
test('QA2-1 before 06:00 a close at the coming 00:00 names its weekday (Thursday 01:00, closes Friday 00:00)', () => {
  const now = at(4, 1), t = statusAt(toThuNight, now, false).t;
  assert.equal(+literal(now, t), +at(5, 0), t);
});
