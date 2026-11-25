# בקשות בין סוכנים

| תאריך | מבקש | בעל הקובץ | קובץ | בקשה | מצב |
|---|---|---|---|---|---|
| 25.11 | data | map-ux | `src/template.html` (`srcLine`) | מקום עם `g.src:"osm"` – המיקום מ-OpenStreetMap ואין בו שעות; אסור להציג "לפי Google Maps, נבדק ב…". כרגע אין אף מקום כזה (הגיאוקוד לא רץ), אבל לפני שירוץ צריך נוסח אחר (למשל "מיקום לפי OpenStreetMap") | פתוח |
| 25.11 | data | map-ux, hours-shabbat | `src/template.html`, `src/logic.js` | P0-3: הסימון שנקבע הוא `g.q` (מערך קודים), לא `g.flag`. קודים: `hours-shabbat`, `hours-24h`, `shared-google`, `approx-loc` (פירוט ב-`data/README.md` וב-`data/schema.json`). `approx-loc` = `prec:"street"` – כדאי לטפל כמו מיקום משוער (`exact()` מחזיר היום true) | פתוח |
| 25.11 | data | map-ux | `src/template.html` (`okPlace`) | P0-4: בדיקת הנתונים החיים יכולה להשתמש באותם ערכים מותרים כמו `data/schema.json` (`k`, `f`, `t`, `hc`, מבנה `g`, כולל השדות החדשים `g.q`, `g.src`) | פתוח |
| 25.11 | data | map-ux (+ הבעלים) | `src/template.html` | P1-2: מיזוג 2 הכפילויות (`data/review-queue.md` §5) דורש תמיכה ב-alias ל-`u` (קישור/מועדף ישן → המזהה שנשמר). data ימזג רק אחרי אישור הבעלים ותמיכה כזו | פתוח |
| 25.11 | data | qa (+ הבעלים) | `.github/workflows/` | (א) צעד ב-check.yml: `python3 scripts/data/flags.py --check` (נכשל אם `g.q` לא עודכן). (ב) workflow ידני (workflow_dispatch) שמריץ `python3 scripts/data/geocode.py --fetch` ומעלה את `data/geocode-cache.json` כ-artifact – הסביבה של הסוכנים חסומה ל-Nominatim. דורש אישור הבעלים לפנייה לשירות חיצוני מ-Actions | פתוח |
