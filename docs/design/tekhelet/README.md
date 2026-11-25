# כיוון: תכלת ואבן (Tekhelet & stone)

הצעה בלבד (S1-2). שום דבר לא מומש ב-`src/template.html`; הבעלים בוחר קודם.

## הרעיון

- צבעי הגליל וצפת: אבן אפורה-קרירה, תכלת של משקופי העיר העתיקה, ירוק זית רק במפה. מקום שמוכר לכל מי שנסע לציון הרשב״י או לצפת.
- המותג תכלת כהה (פטרול), והכשרויות צבועות כך שאף אחת מהן אינה כחולה: חב״ד בזהב (כמו דגל משיח), העדה ביין, לנדא בזית כהה, מוצרים בסמן חלול.
- כותרות ב-Secular One – עברית מקורית, יציבה ועבה, קריאה מאוד בשמש של יום שישי; טקסט ב-Assistant.
- רשימה מקובצת בבלוקים לפי אזור, ופס סטטוס צבעוני בקצה כל שורה – מבט אחד ויודעים מה פתוח.

## קבצים

- `mock.html` – הדמיה סטטית עצמאית: נייד 390×844 (בית, כרטיס מקום; בהיר וכהה) ומחשב 1280×800 (בהיר וכהה).
- `phone-light.png`, `phone-dark.png`, `card.png`, `desktop.png` (+ `card-dark.png`, `desktop-dark.png`).
- `map-style.json` – דריסות צבע לשכבות liberty (בהיר וכהה), והסרת רעש (POI, מספרי בתים, תלת-ממד).
- `markers.svg` – סמנים לכל כשרות ומצב, אשכול, ונקודת "המיקום שלי", על רקע המפה בבהיר ובכהה.

**הנתונים בהדמיה אמיתיים:** מקומות מצפת והסביבה מתוך `data/places.json`, הכשרות מילה במילה, והסטטוס חושב ב-`statusAt` של `src/logic.js` ליום שישי 27.11.2026 12:30 (שעון ישראל), עם סינון "פתוח עכשיו" כמו באפליקציה. הדלקת נרות בצפת: 16:14 (מנהג חב״ד, `candles`). המרחק לא מוצג כי לא נמסר מיקום (תיקון לבאג שבביקורת). המפה היא שרטוט סכמטי בצבעי הסגנון – לא אריחים אמיתיים (אין רשת בסביבת העבודה).

## גופנים

| תפקיד | גופן | רישיון | משקלים | שימוש |
|---|---|---|---|---|
| כותרות | Secular One | SIL Open Font License 1.1 | 400 (משקל יחיד, עבה) | כותרות ושמות מקומות |
| טקסט | Assistant | SIL Open Font License 1.1 (כבר מתארח באתר) | 400 / 600 / 700 | כל השאר |

כל הגופנים חינמיים, זמינים ב-Google Fonts וב-`@fontsource/*` ב-npm, ואפשר לארח אותם באתר (`vendor/`) כמו את Assistant היום. **בצילומי המסך** הגופנים לא היו זמינים (אין רשת) והוצגו גופני מערכת חלופיים (FreeSerif / Liberation / DejaVu) – האופי קרוב, הפרטים לא.

## אסימונים

### צבע (בהיר / כהה)

| אסימון | בהיר | כהה | תפקיד |
|---|---|---|---|
| `--bg` | `#E8EBEA` | `#0D171B` | רקע |
| `--surface` | `#FFFFFF` | `#15232A` | משטח (גיליון, כרטיס) |
| `--surface2` | `#F2F4F3` | `#1C2D35` | משטח משני |
| `--line` | `#D3D9D8` | `#2A3E47` | קו מפריד (דקורטיבי) |
| `--ink` | `#13232A` | `#E9F0F2` | טקסט ראשי |
| `--sub` | `#44565D` | `#A9BCC3` | טקסט משני |
| `--mut` | `#56676E` | `#93A7AE` | טקסט שקט |
| `--brand` | `#0F4C5C` | `#7CC4D6` | מותג (כפתור ראשי, צ׳יפ נבחר) |
| `--brand-on` | `#FFFFFF` | `#06222A` | טקסט על מותג |
| `--brand-soft` | `#E1EDEF` | `#173A45` | רקע מותג רך |
| `--brand-ink` | `#0D4452` | `#9FD6E3` | טקסט מותג על משטח |
| `--band` | `#E1EDEF` | `#173A45` | פס הדלקת נרות |
| `--band-ink` | `#0D4452` | `#CFEAF1` | טקסט בפס |
| `--open` | `#17743A` | `#5CCB86` | פתוח |
| `--soon` | `#985600` | `#EFA54A` | נסגר בקרוב |
| `--closed` | `#B42318` | `#FF8F86` | סגור |
| `--noinfo` | `#55636A` | `#A6B5BB` | אין מידע |
| `--k-chabad` | `#D4A017` | `#E2B33A` | כשרות חב״ד – מילוי סמן |
| `--k-eda` | `#7A1F45` | `#B0436F` | כשרות העדה החרדית – מילוי סמן |
| `--k-landa` | `#3F4A1E` | `#66762F` | כשרות לנדא – מילוי סמן |
| `--k-products` | `#56606B` | `#AEB9C0` | כשרות מוצרי העדה/לנדא – מילוי סמן |
| `--k-chabad-on` | `#1C1500` | `#1C1500` | כשרות חב״ד – אות על המילוי |
| `--k-eda-on` | `#FFFFFF` | `#FFFFFF` | כשרות העדה החרדית – אות על המילוי |
| `--k-landa-on` | `#FFFFFF` | `#FFFFFF` | כשרות לנדא – אות על המילוי |
| `--k-products-on` | `#56606B` | `#AEB9C0` | כשרות מוצרי העדה/לנדא – אות על המילוי |
| `--k-chabad-ink` | `#7A5A06` | `#EBC45E` | כשרות חב״ד – טקסט על משטח |
| `--k-eda-ink` | `#7A1F45` | `#EF92B5` | כשרות העדה החרדית – טקסט על משטח |
| `--k-landa-ink` | `#3F4A1E` | `#B5C776` | כשרות לנדא – טקסט על משטח |
| `--k-products-ink` | `#4F5964` | `#B8C3C9` | כשרות מוצרי העדה/לנדא – טקסט על משטח |
| `--me` | `#2B7CFF` | `#4C94FF` | נקודת המיקום שלי |
| `--ring` | `#FFFFFF` | `#E9F0F2` | טבעת סמן |
| `--mk-edge` | `#23363D` | `#E9F0F2` | קו מתאר חיצוני לכל סמן (ניגודיות מול המפה) |
| `--badge-edge` | `#FFFFFF` | `#15232A` | מסגרת תג הסטטוס בסמן |

מוצרים (מ) מוצג תמיד כסמן **חלול** (מילוי משטח, מסגרת ואות בצבע) – הבדל צורה ולא רק צבע. מיקום משוער – מסגרת מקווקוות (כמו היום).

### צבעי מפה

| שכבה | בהיר | כהה |
|---|---|---|
| land | `#E4E8E6` | `#0E1A1F` |
| resid | `#DFE4E2` | `#111F25` |
| park | `#D3E0D2` | `#13261F` |
| wood | `#C9D9C8` | `#12241D` |
| water | `#9EC8D6` | `#0B3442` |
| waterline | `#86B8C8` | `#11475A` |
| building | `#D9DFDD` | `#142328` |
| road | `#FFFFFF` | `#1E3038` |
| casing | `#C9D1D0` | `#1E3038` |
| major | `#FFFFFF` | `#27404A` |
| major-casing | `#B9C5C4` | `#27404A` |
| motorway | `#D6E6EA` | `#2E5562` |
| motorway-casing | `#9FBFC8` | `#2E5562` |
| rail | `#C3CCCB` | `#22343B` |
| boundary | `#A3B1B3` | `#36505A` |
| label | `#24363D` | `#B9CDD3` |
| label-halo | `#FFFFFF` | `#0E1A1F` |
| road-label | `#56676E` | `#86A0A9` |
| water-label | `#2F6575` | `#7FBACB` |

### טיפוגרפיה, רדיוסים, רווחים, צללים

| | |
|---|---|
| סולם (xs…xxl) | 12px / 13px / 14.5px / 16px / 18px / 23px / 26px (קלטים 16px לפחות – בלי זום ב-iOS) |
| רדיוס | xs 6px, sm 8px, md 12px, lg 18px, pill 999px, marker 7px |
| רווחים | s1 4px, s2 8px, s3 12px, s4 16px, s5 20px, s6 24px, s8 32px |
| צל (light) | sh1 `0 1px 2px rgba(15,40,50,.10),0 4px 14px rgba(15,40,50,.08)` · sh2 `0 -4px 20px rgba(15,40,50,.14)` |
| צל (dark) | sh1 `0 1px 2px rgba(0,0,0,.45),0 4px 14px rgba(0,0,0,.35)` · sh2 `0 -4px 20px rgba(0,0,0,.5)` |

## בדיקת ניגודיות

חושב לפי WCAG 2.x (יחס בהירות יחסית). טקסט רגיל ≥ 4.5:1; רכיבי ממשק וסמנים מול המפה ≥ 3:1. "קו מפריד" דקורטיבי – בלי דרישה.

| מצב | זוג | צבעים | יחס | נדרש | |
|---|---|---|---|---|---|
| light | `ink` על `surface` | `#13232A` / `#FFFFFF` | 16.13 | 4.5 | עובר |
| light | `ink` על `bg` | `#13232A` / `#E8EBEA` | 13.45 | 4.5 | עובר |
| light | `sub` על `surface` | `#44565D` / `#FFFFFF` | 7.68 | 4.5 | עובר |
| light | `sub` על `bg` | `#44565D` / `#E8EBEA` | 6.40 | 4.5 | עובר |
| light | `mut` על `surface` | `#56676E` / `#FFFFFF` | 5.90 | 4.5 | עובר |
| light | `mut` על `bg` | `#56676E` / `#E8EBEA` | 4.92 | 4.5 | עובר |
| light | `mut` על `surface2` | `#56676E` / `#F2F4F3` | 5.34 | 4.5 | עובר |
| light | `brand-ink` על `surface` | `#0D4452` / `#FFFFFF` | 10.68 | 4.5 | עובר |
| light | `brand-ink` על `brand-soft` | `#0D4452` / `#E1EDEF` | 8.93 | 4.5 | עובר |
| light | `brand-on` על `brand` | `#FFFFFF` / `#0F4C5C` | 9.51 | 4.5 | עובר |
| light | `band-ink` על `band` | `#0D4452` / `#E1EDEF` | 8.93 | 4.5 | עובר |
| light | `open` על `surface` | `#17743A` / `#FFFFFF` | 5.84 | 4.5 | עובר |
| light | `soon` על `surface` | `#985600` / `#FFFFFF` | 5.73 | 4.5 | עובר |
| light | `closed` על `surface` | `#B42318` / `#FFFFFF` | 6.57 | 4.5 | עובר |
| light | `noinfo` על `surface` | `#55636A` / `#FFFFFF` | 6.21 | 4.5 | עובר |
| light | `open` על `bg` | `#17743A` / `#E8EBEA` | 4.87 | 4.5 | עובר |
| light | `soon` על `bg` | `#985600` / `#E8EBEA` | 4.77 | 4.5 | עובר |
| light | `noinfo` על `bg` | `#55636A` / `#E8EBEA` | 5.18 | 4.5 | עובר |
| light | `sub` על `surface2` | `#44565D` / `#F2F4F3` | 6.95 | 4.5 | עובר |
| light | `k-chabad-ink` על `surface` | `#7A5A06` / `#FFFFFF` | 6.38 | 4.5 | עובר |
| light | `k-chabad-on` על `k-chabad` | `#1C1500` / `#D4A017` | 7.64 | 4.5 | עובר |
| light | `k-eda-ink` על `surface` | `#7A1F45` / `#FFFFFF` | 9.96 | 4.5 | עובר |
| light | `k-eda-on` על `k-eda` | `#FFFFFF` / `#7A1F45` | 9.96 | 4.5 | עובר |
| light | `k-landa-ink` על `surface` | `#3F4A1E` / `#FFFFFF` | 9.50 | 4.5 | עובר |
| light | `k-landa-on` על `k-landa` | `#FFFFFF` / `#3F4A1E` | 9.50 | 4.5 | עובר |
| light | `k-products-ink` על `surface` | `#4F5964` / `#FFFFFF` | 7.13 | 4.5 | עובר |
| light | `marker edge (outline of every marker)` על `m-land` | `#23363D` / `#E4E8E6` | 10.19 | 3.0 | עובר |
| light | `marker edge` על `m-park` | `#23363D` / `#D3E0D2` | 9.22 | 3.0 | עובר |
| light | `marker k-products (border)` על `surface` | `#56606B` / `#FFFFFF` | 6.40 | 3.0 | עובר |
| light | `me dot` על `m-land` | `#2B7CFF` / `#E4E8E6` | 3.13 | 3.0 | עובר |
| light | `cluster brand` על `m-land` | `#0F4C5C` / `#E4E8E6` | 7.69 | 3.0 | עובר |
| light | `status open (marker badge)` על `badge-edge` | `#17743A` / `#FFFFFF` | 5.84 | 3.0 | עובר |
| light | `status soon (marker badge)` על `badge-edge` | `#985600` / `#FFFFFF` | 5.73 | 3.0 | עובר |
| light | `map label` על `m-land` | `#24363D` / `#E4E8E6` | 10.17 | 3.0 | עובר |
| light | `road label` על `m-road` | `#56676E` / `#FFFFFF` | 5.90 | 3.0 | עובר |
| light | `line` על `surface` | `#D3D9D8` / `#FFFFFF` | 1.43 | — | עובר |
| dark | `ink` על `surface` | `#E9F0F2` / `#15232A` | 13.95 | 4.5 | עובר |
| dark | `ink` על `bg` | `#E9F0F2` / `#0D171B` | 15.76 | 4.5 | עובר |
| dark | `sub` על `surface` | `#A9BCC3` / `#15232A` | 8.17 | 4.5 | עובר |
| dark | `sub` על `bg` | `#A9BCC3` / `#0D171B` | 9.23 | 4.5 | עובר |
| dark | `mut` על `surface` | `#93A7AE` / `#15232A` | 6.42 | 4.5 | עובר |
| dark | `mut` על `bg` | `#93A7AE` / `#0D171B` | 7.25 | 4.5 | עובר |
| dark | `mut` על `surface2` | `#93A7AE` / `#1C2D35` | 5.68 | 4.5 | עובר |
| dark | `brand-ink` על `surface` | `#9FD6E3` / `#15232A` | 10.11 | 4.5 | עובר |
| dark | `brand-ink` על `brand-soft` | `#9FD6E3` / `#173A45` | 7.64 | 4.5 | עובר |
| dark | `brand-on` על `brand` | `#06222A` / `#7CC4D6` | 8.44 | 4.5 | עובר |
| dark | `band-ink` על `band` | `#CFEAF1` / `#173A45` | 9.66 | 4.5 | עובר |
| dark | `open` על `surface` | `#5CCB86` / `#15232A` | 7.92 | 4.5 | עובר |
| dark | `soon` על `surface` | `#EFA54A` / `#15232A` | 7.77 | 4.5 | עובר |
| dark | `closed` על `surface` | `#FF8F86` / `#15232A` | 7.29 | 4.5 | עובר |
| dark | `noinfo` על `surface` | `#A6B5BB` / `#15232A` | 7.62 | 4.5 | עובר |
| dark | `open` על `bg` | `#5CCB86` / `#0D171B` | 8.95 | 4.5 | עובר |
| dark | `soon` על `bg` | `#EFA54A` / `#0D171B` | 8.79 | 4.5 | עובר |
| dark | `noinfo` על `bg` | `#A6B5BB` / `#0D171B` | 8.61 | 4.5 | עובר |
| dark | `sub` על `surface2` | `#A9BCC3` / `#1C2D35` | 7.23 | 4.5 | עובר |
| dark | `k-chabad-ink` על `surface` | `#EBC45E` / `#15232A` | 9.64 | 4.5 | עובר |
| dark | `k-chabad-on` על `k-chabad` | `#1C1500` / `#E2B33A` | 9.29 | 4.5 | עובר |
| dark | `k-eda-ink` על `surface` | `#EF92B5` / `#15232A` | 7.24 | 4.5 | עובר |
| dark | `k-eda-on` על `k-eda` | `#FFFFFF` / `#B0436F` | 5.41 | 4.5 | עובר |
| dark | `k-landa-ink` על `surface` | `#B5C776` / `#15232A` | 8.73 | 4.5 | עובר |
| dark | `k-landa-on` על `k-landa` | `#FFFFFF` / `#66762F` | 5.00 | 4.5 | עובר |
| dark | `k-products-ink` על `surface` | `#B8C3C9` / `#15232A` | 8.95 | 4.5 | עובר |
| dark | `marker edge (outline of every marker)` על `m-land` | `#E9F0F2` / `#0E1A1F` | 15.35 | 3.0 | עובר |
| dark | `marker edge` על `m-park` | `#E9F0F2` / `#13261F` | 13.75 | 3.0 | עובר |
| dark | `marker k-products (border)` על `surface` | `#AEB9C0` / `#15232A` | 8.04 | 3.0 | עובר |
| dark | `me dot` על `m-land` | `#4C94FF` / `#0E1A1F` | 5.89 | 3.0 | עובר |
| dark | `cluster brand` על `m-land` | `#7CC4D6` / `#0E1A1F` | 9.04 | 3.0 | עובר |
| dark | `status open (marker badge)` על `badge-edge` | `#5CCB86` / `#15232A` | 7.92 | 3.0 | עובר |
| dark | `status soon (marker badge)` על `badge-edge` | `#EFA54A` / `#15232A` | 7.77 | 3.0 | עובר |
| dark | `map label` על `m-land` | `#B9CDD3` / `#0E1A1F` | 10.74 | 3.0 | עובר |
| dark | `road label` על `m-road` | `#86A0A9` / `#1E3038` | 4.96 | 3.0 | עובר |
| dark | `line` על `surface` | `#2A3E47` / `#15232A` | 1.44 | — | עובר |

סה״כ כשלים: 0.

### הבחנה בין צבעי הכשרות, המותג ונקודת המיקום (CIEDE2000, כולל הדמיית עיוורון צבעים)

שלושת הזוגות הקרובים ביותר בכל מצב (ΔE00; מעל ~10 מובחן היטב, 5–10 מובחן בסמיכות, מתחת ל-5 – רק עם האות). מוצרים לא בטבלה – הסמן שלו חלול (הבדל צורה). ההדמיה לפי Machado 2009 בחומרה מלאה.

| מצב | ראייה | הזוגות הקרובים |
|---|---|---|
| light | normal | brand/landa 27.8 · brand/me 27.9 · brand/eda 41.3 |
| light | deutan | eda/landa 12.1 · brand/eda 16.8 · brand/me 27.2 |
| light | protan | brand/eda 6.3 · eda/landa 27.1 · brand/landa 28.6 |
| light | tritan | brand/landa 16.1 · brand/me 28.2 · eda/landa 30.6 |
| dark | normal | brand/me 22.0 · chabad/landa 30.7 · me/eda 40.9 |
| dark | deutan | eda/landa 17.2 · brand/me 18.8 · chabad/landa 27.3 |
| dark | protan | brand/me 18.8 · chabad/landa 23.9 · me/eda 30.2 |
| dark | tritan | brand/me 10.4 · me/landa 27.8 · chabad/eda 28.1 |

בכל מקרה הסמן נושא אות (ח/ע/ל/מ) והטקסט המלא של הכשרות מופיע ברשימה ובכרטיס – הצבע אינו הסימן היחיד.

## סמנים ואשכולות

תגית עם חוד קטן שמצביע על המיקום (לא סיכה), 28px. סטטוס: פס קצר בתחתית התגית – ירוק = פתוח, כתום = נסגר בקרוב. אשכול: ריבוע מעוגל בתכלת כהה עם מספר.

אזור לחיצה 44px לכל סמן (`::before` כמו היום). מומלץ לממש כשכבת GeoJSON עם clustering מובנה (כפי שהומלץ בביקורת) – הסמנים כ-SDF/תמונות שנוצרות מה-SVG.

## מאמץ מימוש משוער

בינוני. אסימונים + Secular One (~30KB). דורש שינוי markup קטן ברשימה (קיבוץ בבלוקים, תגית כשרות) – בקשה ל-map-ux. סמן תגית עם עוגן תחתון.
