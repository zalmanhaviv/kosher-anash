#!/usr/bin/env python3
"""Builds data/review-queue.md – the owner's manual-check list – from the data itself:
quality flags (g.q rules in scripts/validate.py), duplicate records, food types not stated in the
source, and the geocoding status (scripts/data/geocode.py, offline – reads the cache only).
Run: python3 scripts/data/review_queue.py      (rewrite after every data change)"""
import json, sys, pathlib, collections, urllib.parse
ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'scripts'))
sys.path.insert(0, str(ROOT / 'scripts/data'))
from validate import quality, shared_groups, days_24h  # noqa: E402
import geocode  # noqa: E402

DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']

def gmaps(p):
    q = ' '.join(x for x in (p['n'], p['s'], p['c']) if x)
    return 'https://www.google.com/maps/search/?api=1&query=' + urllib.parse.quote(q)

def cell(s):
    return str(s).replace('|', '\\|')

def link(p):
    return f"[חיפוש]({gmaps(p)})"

def fri_sat(p):
    w = (p.get('g') or {}).get('week') or []
    return ' · '.join(x.replace('יום ', '') for x in w if x.startswith(('יום שישי', 'יום שבת')))

def main():
    places = json.loads((ROOT / 'data/places.json').read_text(encoding='utf-8'))
    cities = json.loads((ROOT / 'data/cities.json').read_text(encoding='utf-8'))
    q = quality(places)
    out = []
    w = out.append
    w('# תור בדיקה ידנית – נתונים')
    w('')
    w('נוצר אוטומטית על ידי `python3 scripts/data/review_queue.py` – לא לערוך ידנית. שום דבר כאן לא שונה או נמחק בנתונים: כל שורה היא בקשה לבדיקה של הבעלים (גוגל מפות, אתר העסק או טלפון). אחרי בדיקה – מעדכנים את הנתון ואת `g.chk`, ומריצים מחדש.')
    w('קישור "חיפוש" פותח חיפוש רגיל בגוגל מפות בשם, ברחוב ובישוב (בלי API).')
    w('')
    counts = collections.Counter(c for cs in q.values() for c in cs)
    rows_total = 0

    # 1. Shabbat hours
    sh = [i for i, cs in q.items() if 'hours-shabbat' in cs]
    w(f'## 1. שעות בשבת או בליל שבת (`hours-shabbat`) – {len(sh)}')
    w('')
    w('שעה שפורסמה בגוגל פתוחה בין שישי 17:00 לשבת 17:00. במקום מהדרין זו כמעט תמיד התאמה שגויה בגוגל. אסור להניח סגירה – רק לאמת.')
    w('')
    w('| מקום | ישוב | סימון | מה לבדוק | קישור |')
    w('|---|---|---|---|---|')
    for i in sorted(sh, key=lambda i: (places[i]['c'], places[i]['n'])):
        p = places[i]
        w(f"| {cell(p['n'])} ({cell(p['s'] or 'אין רחוב')}) `{p['u']}` | {cell(p['c'])} | hours-shabbat | שעות שישי/שבת בגוגל: {cell(fri_sat(p))}. לוודא שזה העסק הנכון ומה השעות בשישי | {link(p)} |")
        rows_total += 1
    w('')

    # 2. 24 hours
    h24 = [i for i, cs in q.items() if 'hours-24h' in cs]
    w(f'## 2. פתוח 24 שעות (`hours-24h`) – {len(h24)}')
    w('')
    w('| מקום | ישוב | סימון | מה לבדוק | קישור |')
    w('|---|---|---|---|---|')
    for i in sorted(h24, key=lambda i: (places[i]['c'], places[i]['n'])):
        p = places[i]
        days = ', '.join(DAYS[d] for d in days_24h(p['g']))
        w(f"| {cell(p['n'])} ({cell(p['s'] or 'אין רחוב')}) `{p['u']}` | {cell(p['c'])} | hours-24h | לפי גוגל פתוח מסביב לשעון בימים: {days}. לוודא שזה נכון (מאפיות לפעמים כן) | {link(p)} |")
        rows_total += 1
    w('')

    # 3. shared Google matches
    groups = shared_groups(places)
    w(f'## 3. התאמת גוגל משותפת (`shared-google`) – {counts["shared-google"]} מקומות ב-{len(groups)} קבוצות')
    w('')
    w('אותו מיקום גוגל (ברמת עסק/בניין) או אותו טלפון אצל מקומות בכתובות שונות. ייתכן שגוגל התאים כמה סניפים לאותו עסק, ואז השעות והטלפון של סניף אחד שגויים. טלפון מרכזי של רשת (1-700) יכול להיות תקין – אז מספיק לוודא שהשעות של כל סניף נכונות.')
    w('')
    w('| מקום | ישוב | סימון | מה לבדוק | קישור |')
    w('|---|---|---|---|---|')
    for kind, key, idx in groups:
        what = 'אותו מיקום בגוגל' if kind == 'loc' else f'אותו טלפון ({places[idx[0]]["g"]["phone"]})'
        names = '; '.join(f"{places[j]['n']} – {places[j]['s'] or 'אין רחוב'}, {places[j]['c']}" for j in idx)
        for j in idx:
            p = places[j]
            w(f"| {cell(p['n'])} ({cell(p['s'] or 'אין רחוב')}) `{p['u']}` | {cell(p['c'])} | shared-google | {what} כמו: {cell(names)}. לוודא שהמיקום, הטלפון והשעות שייכים לסניף הזה | {link(p)} |")
            rows_total += 1
    w('')

    # 4. approximate location
    ap = [i for i, cs in q.items() if 'approx-loc' in cs]
    w(f'## 4. מיקום ברמת רחוב בלבד (`approx-loc`) – {len(ap)}')
    w('')
    w('הסמן נמצא איפשהו ברחוב ולא בעסק עצמו. כדאי למצוא את העסק בגוגל מפות ולעדכן ל-`prec:"poi"`.')
    w('')
    w('| מקום | ישוב | סימון | מה לבדוק | קישור |')
    w('|---|---|---|---|---|')
    for i in sorted(ap, key=lambda i: (places[i]['c'], places[i]['n'])):
        p = places[i]
        w(f"| {cell(p['n'])} ({cell(p['s'] or 'אין רחוב')}) `{p['u']}` | {cell(p['c'])} | approx-loc | מיקום משוער ברחוב – לאתר את העסק עצמו | {link(p)} |")
        rows_total += 1
    w('')

    # 5. duplicates
    seen = {}
    dups = []
    for i, p in enumerate(places):
        k = (p['n'], p['s'], p['c'], p['k'], p['h'])
        if k in seen:
            dups.append((seen[k], i))
        else:
            seen[k] = i
    w(f'## 5. רשומות כפולות – {len(dups)}')
    w('')
    w('לא אוחד ולא נמחק דבר (מיזוג רק באישור הבעלים).')
    w('')
    w('| מקום | ישוב | סימון | מה לבדוק / המלצה | קישור |')
    w('|---|---|---|---|---|')
    for a, b in dups:
        pa, pb = places[a], places[b]
        diff = [f for f in pa if f not in ('u',) and pa.get(f) != pb.get(f)]
        if diff == ['t'] or diff == ['t', 'tt']:
            rec = (f"שתי שורות זהות חוץ מסוג האוכל ({'/'.join(pa['t'])} מול {'/'.join(pb['t'])}). כנראה המקום מופיע במאגר פעמיים, בשני סוגים. "
                   f"המלצה: לבדוק ב-PDF; אם זה אותו מקום – לאחד לרשומה אחת עם שני הסוגים, לשמור `u` `{pa['u']}` ולהשאיר את `{pb['u']}` כ-alias (דורש תמיכה ב-alias באפליקציה)")
        elif not diff:
            closed = (pa.get('g') or {}).get('closed')
            rec = (f"זהות לחלוטין (רק `u` שונה){', ולפי גוגל ' + closed if closed else ''}. "
                   f"המלצה: לאחד – לשמור `{pa['u']}`, ו-`{pb['u']}` כ-alias כדי לא לשבור קישורים ומועדפים")
        else:
            rec = f"שונות בשדות {diff}. לבדוק ב-PDF"
        w(f"| {cell(pa['n'])} ({cell(pa['s'])}) `{pa['u']}` + `{pb['u']}` | {cell(pa['c'])} | duplicate | {cell(rec)} | {link(pa)} |")
        rows_total += 1
    w('')

    # 6. geocoding
    rows = geocode.run(places, cities, json.loads(geocode.CACHE.read_text(encoding='utf-8')) if geocode.CACHE.exists() else {})
    open_rows = [r for r in rows if r[2] != 'accepted']
    w(f'## 6. כתובת בלי מיקום מדויק (גיאוקוד) – {len(open_rows)}')
    w('')
    w('מקומות עם רחוב במאגר ובלי מיקום. כרגע מוצגים במרכז הישוב. `scripts/data/geocode.py` מנסה Nominatim (OSM) ומקבל תוצאה רק כשהרחוב והישוב תואמים; כל השאר כאן.')
    w('')
    w('| מקום | ישוב | סימון | מה לבדוק | קישור |')
    w('|---|---|---|---|---|')
    label = {'pending': 'עדיין לא נשאל Nominatim (אין רשת מהסביבה). להריץ `geocode.py --fetch` או לאתר ידנית בגוגל מפות',
             'doubtful': 'תשובת Nominatim לא תואמת', 'none': 'Nominatim לא מצא'}
    for i, p, status, detail, _ in open_rows:
        extra = '' if status == 'pending' else f': {detail}'
        w(f"| {cell(p['n'])} ({cell(p['s'])}) `{p['u']}` | {cell(p['c'])} | geocode-{status} | {cell(label[status] + extra)} | {link(p)} |")
        rows_total += 1
    w('')

    # 7. food type
    empty = [p for p in places if not p['t']]
    w(f'## 7. סוג אוכל לא ידוע – {len(empty)} (לידיעה, לא בטבלה)')
    w('')
    by_k = collections.Counter(p['k'] for p in empty)
    w('סוג האוכל (בשרי/חלבי/פרווה) לא כתוב במאגר, ולכן לא הושלם: ' + ', '.join(f'{k} {v}' for k, v in by_k.most_common()) + '. אם המאגר המקורי או בעל העסק מציין – לעדכן `t`.')
    w('')
    w(f'**סה״כ שורות לבדיקה: {rows_total}**')
    (ROOT / 'data/review-queue.md').write_text('\n'.join(out) + '\n', encoding='utf-8')
    print(f'data/review-queue.md: {rows_total} rows')

if __name__ == '__main__':
    main()
