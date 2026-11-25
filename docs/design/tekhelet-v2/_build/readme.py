#!/usr/bin/env python3
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.dirname(HERE); sys.path.insert(0, HERE)
from tokens import C, MAP, TYPE, LH, RADIUS, SPACE, MOTION
from check import pairs, sep
body = open(os.path.join(HERE, 'README.head.md'), encoding='utf-8').read()
L = ['\n## אסימונים\n', '### צבע (בהיר / כהה)\n', '| אסימון | בהיר | כהה |', '|---|---|---|']
L += [f'| `--{k}` | `{v}` | `{C["dark"][k]}` |' for k, v in C['light'].items()]
L += ['\n### צבעי מפה\n', '| שכבה | בהיר | כהה |', '|---|---|---|'] + [f'| {k} | `{v}` | `{MAP["dark"][k]}` |' for k, v in MAP['light'].items()]
L += ['\n### טיפוגרפיה, רדיוסים, רווחים, תנועה\n', '| | |', '|---|---|',
      '| סולם (xs…xxl) | ' + ' / '.join(TYPE.values()) + ' – שמות מקומות ברשימה 19px, בכרטיס 28px; קלט החיפוש 16px (בלי זום ב-iOS) |',
      '| גובה שורה | ' + ', '.join(f'{k} {v}' for k, v in LH.items()) + ' |',
      '| רדיוס | ' + ', '.join(f'{k} {v}' for k, v in RADIUS.items()) + ' – פינות כמעט ישרות: אבן ועץ צבוע, לא כדורים |',
      '| רווחים | ' + ', '.join(f'{k} {v}' for k, v in SPACE.items()) + ' |',
      '| תנועה | ' + ', '.join(f'{k} {v}' for k, v in MOTION.items()) + ' – מכובד ב-`prefers-reduced-motion` |']
L += ['\n## בדיקת ניגודיות\n', 'WCAG 2.x. טקסט ≥ 4.5:1, רכיבי ממשק וסמנים מול המפה ≥ 3:1. נבדק ב-`_build/check.py` מתוך `tokens.py` (אותם ערכים שבהדמיה).\n',
      '| מצב | זוג | צבעים | יחס | נדרש | |', '|---|---|---|---|---|---|']
fails = 0
for t in ('light', 'dark'):
    for th, a, b, ca, cb, r, n in pairs(t):
        ok = r >= n; fails += not ok
        L.append(f'| {"בהיר" if th == "light" else "כהה"} | `{a}` על `{b}` | `{ca}` / `{cb}` | {r:.2f} | {n} | {"עובר" if ok else "**נכשל**"} |')
L.append(f'\nסה״כ כשלים: {fails}.\n')
L += ['### הבחנה בין צבעי הכשרות, צבע הדלת (תכלת) ונקודת המיקום – ΔE00, כולל הדמיית עיוורון צבעים (Machado 2009, חומרה מלאה)\n',
      'שלושת הזוגות הקרובים בכל מצב. מעל ~10 מובחן היטב; 5–10 מובחן בסמיכות. מוצרים לא בטבלה – הדלת שלו חלולה (הבדל צורה).\n',
      '| מצב | ראייה | הזוגות הקרובים |', '|---|---|---|']
for t in ('light', 'dark'):
    for th, kind, ws in sep(t):
        L.append(f'| {"בהיר" if th == "light" else "כהה"} | {kind} | ' + ' · '.join(f'{a}/{b} {v:.1f}' for v, a, b in ws) + ' |')
L.append('\nהזוג הקרוב ביותר הוא תכלת המסגרת מול נקודת "המיקום שלי" בבהיר (7.5–10). הם לא מתבלבלים כי הצורה שונה לגמרי (קשת עם אות מול עיגול עם הילה), והתכלת אף פעם אינה הסימן של כשרות. בין הכשרויות עצמן הזוג הקרוב הוא העדה/לנדא בעיוורון ירוק (15.2) – ועדיין מובחן, ונושא אות שונה.\n')
open(os.path.join(OUT, 'README.md'), 'w', encoding='utf-8').write(body + '\n'.join(L) + '\n')
print('fails', fails)
