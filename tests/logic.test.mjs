// Unit tests for src/logic.js. Run: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const code = readFileSync(new URL('../src/logic.js', import.meta.url), 'utf8');
const ctx = { Intl, Date, Math, String, Number, Object };
vm.runInNewContext(code + '\n;globalThis.L = { DAYS, IL, hhmm, sunset, candles, NOINFO, statusAt }; globalThis.L2 = { normText, friRanges };', ctx);
const { IL, hhmm, candles, NOINFO, statusAt } = ctx.L;

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
