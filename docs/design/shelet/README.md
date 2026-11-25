# כיוון: שלט ברור (Clear sign)

הצעה בלבד (S1-2). שום דבר לא מומש ב-`src/template.html`; הבעלים בוחר קודם.

## הרעיון

- לסבא ולסבתא, לנהג שעוצר בצד הדרך ולמשפחה עם ילדים ביום שישי: הכול גדול, חד ובולט כמו שלט כשרות בחלון של חנות.
- הכשרות היא חותם עגול עם אות (כמו חותמת על תעודה), והסטטוס הוא תווית מלאה בצבע – לא טקסט צבעוני קטן. טקסט בסיס 17px, כפתורים 48px.
- מותג בדיו כהה עם צהוב שלט (צהוב דגל חב״ד) רק לבחירה ולהדגשה. גופן אחד – Rubik – עגול, ידידותי וחזק גם במשקל כבד.
- מפה ניטרלית כמעט אפורה, כדי שרק החותמות והאשכולות יבלטו. אשכול מראה בטבעת מחולקת אילו כשרויות יש בו.

## קבצים

- `mock.html` – הדמיה סטטית עצמאית: נייד 390×844 (בית, כרטיס מקום; בהיר וכהה) ומחשב 1280×800 (בהיר וכהה).
- `phone-light.png`, `phone-dark.png`, `card.png`, `desktop.png` (+ `card-dark.png`, `desktop-dark.png`).
- `map-style.json` – דריסות צבע לשכבות liberty (בהיר וכהה), והסרת רעש (POI, מספרי בתים, תלת-ממד).
- `markers.svg` – סמנים לכל כשרות ומצב, אשכול, ונקודת "המיקום שלי", על רקע המפה בבהיר ובכהה.

**הנתונים בהדמיה אמיתיים:** מקומות מצפת והסביבה מתוך `data/places.json`, הכשרות מילה במילה, והסטטוס חושב ב-`statusAt` של `src/logic.js` ליום שישי 27.11.2026 12:30 (שעון ישראל), עם סינון "פתוח עכשיו" כמו באפליקציה. הדלקת נרות בצפת: 16:14 (מנהג חב״ד, `candles`). המרחק לא מוצג כי לא נמסר מיקום (תיקון לבאג שבביקורת). המפה היא שרטוט סכמטי בצבעי הסגנון – לא אריחים אמיתיים (אין רשת בסביבת העבודה).

## גופנים

| תפקיד | גופן | רישיון | משקלים | שימוש |
|---|---|---|---|---|
| כותרות | Rubik | SIL Open Font License 1.1 | 400 / 500 / 700 / 800 (גופן משתנה) | הכול (כותרות 700–800, טקסט 400–500) |
| טקסט | Rubik | SIL Open Font License 1.1 | — | אותו גופן |

כל הגופנים חינמיים, זמינים ב-Google Fonts וב-`@fontsource/*` ב-npm, ואפשר לארח אותם באתר (`vendor/`) כמו את Assistant היום. **בצילומי המסך** הגופנים לא היו זמינים (אין רשת) והוצגו גופני מערכת חלופיים (FreeSerif / Liberation / DejaVu) – האופי קרוב, הפרטים לא.

## אסימונים

### צבע (בהיר / כהה)

| אסימון | בהיר | כהה | תפקיד |
|---|---|---|---|
| `--bg` | `#F4F4F2` | `#111214` | רקע |
| `--surface` | `#FFFFFF` | `#1B1D20` | משטח (גיליון, כרטיס) |
| `--surface2` | `#F0F0EE` | `#24272B` | משטח משני |
| `--line` | `#CBCED2` | `#3A3E44` | קו מפריד (דקורטיבי) |
| `--ink` | `#101214` | `#F4F5F6` | טקסט ראשי |
| `--sub` | `#3F4449` | `#C3C8CE` | טקסט משני |
| `--mut` | `#50565C` | `#A8AEB5` | טקסט שקט |
| `--brand` | `#101214` | `#F5C518` | מותג (כפתור ראשי, צ׳יפ נבחר) |
| `--brand-on` | `#FFFFFF` | `#101214` | טקסט על מותג |
| `--brand-soft` | `#FFF4C7` | `#3A3214` | רקע מותג רך |
| `--brand-ink` | `#101214` | `#FFE07A` | טקסט מותג על משטח |
| `--signal` | `#F5C518` | `#F5C518` | צהוב שלט (בחירה) |
| `--signal-on` | `#101214` | `#101214` | טקסט על צהוב |
| `--band` | `#FFF4C7` | `#3A3214` | פס הדלקת נרות |
| `--band-ink` | `#3D2F00` | `#FFE07A` | טקסט בפס |
| `--open` | `#12703A` | `#4ED17F` | פתוח |
| `--soon` | `#8F4F00` | `#F2A541` | נסגר בקרוב |
| `--closed` | `#B0201A` | `#FF8F86` | סגור |
| `--noinfo` | `#4E555B` | `#B5BBC2` | אין מידע |
| `--open-bg` | `#12703A` | `#1F6F40` | תווית פתוח |
| `--open-on` | `#FFFFFF` | `#FFFFFF` | טקסט תווית פתוח |
| `--soon-bg` | `#FFE2B8` | `#5A3A0C` | תווית נסגר בקרוב |
| `--soon-on` | `#5C3200` | `#FFD9A3` | טקסט |
| `--noinfo-bg` | `#E7E8EA` | `#2E3236` | תווית אין מידע |
| `--noinfo-on` | `#3F4449` | `#D4D8DD` | טקסט |
| `--k-chabad` | `#1E3A8A` | `#3B5BC4` | כשרות חב״ד – מילוי סמן |
| `--k-eda` | `#9B2C6E` | `#C2448F` | כשרות העדה החרדית – מילוי סמן |
| `--k-landa` | `#5C3A1E` | `#8A5A30` | כשרות לנדא – מילוי סמן |
| `--k-products` | `#56606B` | `#B0B8C1` | כשרות מוצרי העדה/לנדא – מילוי סמן |
| `--k-chabad-on` | `#FFFFFF` | `#FFFFFF` | כשרות חב״ד – אות על המילוי |
| `--k-eda-on` | `#FFFFFF` | `#FFFFFF` | כשרות העדה החרדית – אות על המילוי |
| `--k-landa-on` | `#FFFFFF` | `#FFFFFF` | כשרות לנדא – אות על המילוי |
| `--k-products-on` | `#56606B` | `#B0B8C1` | כשרות מוצרי העדה/לנדא – אות על המילוי |
| `--k-chabad-ink` | `#1E3A8A` | `#A9BBF5` | כשרות חב״ד – טקסט על משטח |
| `--k-eda-ink` | `#8E2765` | `#F09ACB` | כשרות העדה החרדית – טקסט על משטח |
| `--k-landa-ink` | `#5C3A1E` | `#DDB38A` | כשרות לנדא – טקסט על משטח |
| `--k-products-ink` | `#4B5563` | `#B8C0C9` | כשרות מוצרי העדה/לנדא – טקסט על משטח |
| `--me` | `#2B7CFF` | `#4C94FF` | נקודת המיקום שלי |
| `--ring` | `#FFFFFF` | `#F4F5F6` | טבעת סמן |
| `--mk-edge` | `#2A2D31` | `#F4F5F6` | קו מתאר חיצוני לכל סמן (ניגודיות מול המפה) |
| `--badge-edge` | `#FFFFFF` | `#1B1D20` | מסגרת תג הסטטוס בסמן |

מוצרים (מ) מוצג תמיד כסמן **חלול** (מילוי משטח, מסגרת ואות בצבע) – הבדל צורה ולא רק צבע. מיקום משוער – מסגרת מקווקוות (כמו היום).

### צבעי מפה

| שכבה | בהיר | כהה |
|---|---|---|
| land | `#F2F2F0` | `#141517` |
| resid | `#EDEDEB` | `#17181B` |
| park | `#E0E8DC` | `#1A231C` |
| wood | `#D8E2D3` | `#18211A` |
| water | `#CCD7DF` | `#121E26` |
| waterline | `#B5C4CE` | `#1B2C38` |
| building | `#E6E6E3` | `#1C1E21` |
| road | `#FFFFFF` | `#2B2E33` |
| casing | `#BDBFC2` | `#2B2E33` |
| major | `#FFFFFF` | `#3A3E44` |
| major-casing | `#A9ACB0` | `#3A3E44` |
| motorway | `#FFE58A` | `#5A4A10` |
| motorway-casing | `#C9A400` | `#5A4A10` |
| rail | `#C4C6C9` | `#30343A` |
| boundary | `#9DA2A7` | `#4A4F56` |
| label | `#1E2124` | `#D9DCDF` |
| label-halo | `#FFFFFF` | `#141517` |
| road-label | `#50565C` | `#A0A6AD` |
| water-label | `#4A6475` | `#8AA6B8` |

### טיפוגרפיה, רדיוסים, רווחים, צללים

| | |
|---|---|
| סולם (xs…xxl) | 13px / 14px / 15.5px / 17px / 19px / 25px / 30px (קלטים 16px לפחות – בלי זום ב-iOS) |
| רדיוס | xs 6px, sm 10px, md 12px, lg 20px, pill 999px, marker 50% |
| רווחים | s1 4px, s2 8px, s3 12px, s4 16px, s5 20px, s6 24px, s8 32px |
| צל (light) | sh1 `0 0 0 1px rgba(16,18,20,.10),0 2px 6px rgba(16,18,20,.10)` · sh2 `0 -2px 0 rgba(16,18,20,.06),0 -8px 24px rgba(16,18,20,.12)` |
| צל (dark) | sh1 `0 0 0 1px rgba(255,255,255,.08),0 2px 6px rgba(0,0,0,.4)` · sh2 `0 -8px 24px rgba(0,0,0,.55)` |

## בדיקת ניגודיות

חושב לפי WCAG 2.x (יחס בהירות יחסית). טקסט רגיל ≥ 4.5:1; רכיבי ממשק וסמנים מול המפה ≥ 3:1. "קו מפריד" דקורטיבי – בלי דרישה.

| מצב | זוג | צבעים | יחס | נדרש | |
|---|---|---|---|---|---|
| light | `ink` על `surface` | `#101214` / `#FFFFFF` | 18.77 | 4.5 | עובר |
| light | `ink` על `bg` | `#101214` / `#F4F4F2` | 17.05 | 4.5 | עובר |
| light | `sub` על `surface` | `#3F4449` / `#FFFFFF` | 9.84 | 4.5 | עובר |
| light | `sub` על `bg` | `#3F4449` / `#F4F4F2` | 8.93 | 4.5 | עובר |
| light | `mut` על `surface` | `#50565C` / `#FFFFFF` | 7.43 | 4.5 | עובר |
| light | `mut` על `bg` | `#50565C` / `#F4F4F2` | 6.75 | 4.5 | עובר |
| light | `mut` על `surface2` | `#50565C` / `#F0F0EE` | 6.51 | 4.5 | עובר |
| light | `brand-ink` על `surface` | `#101214` / `#FFFFFF` | 18.77 | 4.5 | עובר |
| light | `brand-ink` על `brand-soft` | `#101214` / `#FFF4C7` | 17.00 | 4.5 | עובר |
| light | `brand-on` על `brand` | `#FFFFFF` / `#101214` | 18.77 | 4.5 | עובר |
| light | `band-ink` על `band` | `#3D2F00` / `#FFF4C7` | 11.85 | 4.5 | עובר |
| light | `open` על `surface` | `#12703A` / `#FFFFFF` | 6.17 | 4.5 | עובר |
| light | `soon` על `surface` | `#8F4F00` / `#FFFFFF` | 6.39 | 4.5 | עובר |
| light | `closed` על `surface` | `#B0201A` / `#FFFFFF` | 6.85 | 4.5 | עובר |
| light | `noinfo` על `surface` | `#4E555B` / `#FFFFFF` | 7.57 | 4.5 | עובר |
| light | `open-on` על `open-bg` | `#FFFFFF` / `#12703A` | 6.17 | 4.5 | עובר |
| light | `soon-on` על `soon-bg` | `#5C3200` / `#FFE2B8` | 8.80 | 4.5 | עובר |
| light | `noinfo-on` על `noinfo-bg` | `#3F4449` / `#E7E8EA` | 8.02 | 4.5 | עובר |
| light | `signal-on` על `signal` | `#101214` / `#F5C518` | 11.52 | 4.5 | עובר |
| light | `k-chabad-ink` על `surface` | `#1E3A8A` / `#FFFFFF` | 10.36 | 4.5 | עובר |
| light | `k-chabad-on` על `k-chabad` | `#FFFFFF` / `#1E3A8A` | 10.36 | 4.5 | עובר |
| light | `k-eda-ink` על `surface` | `#8E2765` / `#FFFFFF` | 7.99 | 4.5 | עובר |
| light | `k-eda-on` על `k-eda` | `#FFFFFF` / `#9B2C6E` | 7.05 | 4.5 | עובר |
| light | `k-landa-ink` על `surface` | `#5C3A1E` / `#FFFFFF` | 10.10 | 4.5 | עובר |
| light | `k-landa-on` על `k-landa` | `#FFFFFF` / `#5C3A1E` | 10.10 | 4.5 | עובר |
| light | `k-products-ink` על `surface` | `#4B5563` / `#FFFFFF` | 7.56 | 4.5 | עובר |
| light | `marker edge (outline of every marker)` על `m-land` | `#2A2D31` / `#F2F2F0` | 12.34 | 3.0 | עובר |
| light | `marker edge` על `m-park` | `#2A2D31` / `#E0E8DC` | 11.03 | 3.0 | עובר |
| light | `marker k-products (border)` על `surface` | `#56606B` / `#FFFFFF` | 6.40 | 3.0 | עובר |
| light | `me dot` על `m-land` | `#2B7CFF` / `#F2F2F0` | 3.45 | 3.0 | עובר |
| light | `cluster core` על `m-land` | `#101214` / `#F2F2F0` | 16.75 | 3.0 | עובר |
| light | `status open (marker badge)` על `badge-edge` | `#12703A` / `#FFFFFF` | 6.17 | 3.0 | עובר |
| light | `status soon (marker badge)` על `badge-edge` | `#8F4F00` / `#FFFFFF` | 6.39 | 3.0 | עובר |
| light | `map label` על `m-land` | `#1E2124` / `#F2F2F0` | 14.43 | 3.0 | עובר |
| light | `road label` על `m-road` | `#50565C` / `#FFFFFF` | 7.43 | 3.0 | עובר |
| light | `line` על `surface` | `#CBCED2` / `#FFFFFF` | 1.58 | — | עובר |
| dark | `ink` על `surface` | `#F4F5F6` / `#1B1D20` | 15.47 | 4.5 | עובר |
| dark | `ink` על `bg` | `#F4F5F6` / `#111214` | 17.17 | 4.5 | עובר |
| dark | `sub` על `surface` | `#C3C8CE` / `#1B1D20` | 10.03 | 4.5 | עובר |
| dark | `sub` על `bg` | `#C3C8CE` / `#111214` | 11.13 | 4.5 | עובר |
| dark | `mut` על `surface` | `#A8AEB5` / `#1B1D20` | 7.55 | 4.5 | עובר |
| dark | `mut` על `bg` | `#A8AEB5` / `#111214` | 8.38 | 4.5 | עובר |
| dark | `mut` על `surface2` | `#A8AEB5` / `#24272B` | 6.70 | 4.5 | עובר |
| dark | `brand-ink` על `surface` | `#FFE07A` / `#1B1D20` | 13.03 | 4.5 | עובר |
| dark | `brand-ink` על `brand-soft` | `#FFE07A` / `#3A3214` | 9.84 | 4.5 | עובר |
| dark | `brand-on` על `brand` | `#101214` / `#F5C518` | 11.52 | 4.5 | עובר |
| dark | `band-ink` על `band` | `#FFE07A` / `#3A3214` | 9.84 | 4.5 | עובר |
| dark | `open` על `surface` | `#4ED17F` / `#1B1D20` | 8.65 | 4.5 | עובר |
| dark | `soon` על `surface` | `#F2A541` / `#1B1D20` | 8.23 | 4.5 | עובר |
| dark | `closed` על `surface` | `#FF8F86` / `#1B1D20` | 7.66 | 4.5 | עובר |
| dark | `noinfo` על `surface` | `#B5BBC2` / `#1B1D20` | 8.73 | 4.5 | עובר |
| dark | `open-on` על `open-bg` | `#FFFFFF` / `#1F6F40` | 6.17 | 4.5 | עובר |
| dark | `soon-on` על `soon-bg` | `#FFD9A3` / `#5A3A0C` | 7.68 | 4.5 | עובר |
| dark | `noinfo-on` על `noinfo-bg` | `#D4D8DD` / `#2E3236` | 9.02 | 4.5 | עובר |
| dark | `signal-on` על `signal` | `#101214` / `#F5C518` | 11.52 | 4.5 | עובר |
| dark | `k-chabad-ink` על `surface` | `#A9BBF5` / `#1B1D20` | 8.94 | 4.5 | עובר |
| dark | `k-chabad-on` על `k-chabad` | `#FFFFFF` / `#3B5BC4` | 6.04 | 4.5 | עובר |
| dark | `k-eda-ink` על `surface` | `#F09ACB` / `#1B1D20` | 8.20 | 4.5 | עובר |
| dark | `k-eda-on` על `k-eda` | `#FFFFFF` / `#C2448F` | 4.65 | 4.5 | עובר |
| dark | `k-landa-ink` על `surface` | `#DDB38A` / `#1B1D20` | 8.76 | 4.5 | עובר |
| dark | `k-landa-on` על `k-landa` | `#FFFFFF` / `#8A5A30` | 5.86 | 4.5 | עובר |
| dark | `k-products-ink` על `surface` | `#B8C0C9` / `#1B1D20` | 9.19 | 4.5 | עובר |
| dark | `marker edge (outline of every marker)` על `m-land` | `#F4F5F6` / `#141517` | 16.74 | 3.0 | עובר |
| dark | `marker edge` על `m-park` | `#F4F5F6` / `#1A231C` | 14.79 | 3.0 | עובר |
| dark | `marker k-products (border)` על `surface` | `#B0B8C1` / `#1B1D20` | 8.42 | 3.0 | עובר |
| dark | `me dot` על `m-land` | `#4C94FF` / `#141517` | 6.08 | 3.0 | עובר |
| dark | `cluster outer ring` על `m-land` | `#F4F5F6` / `#141517` | 16.74 | 3.0 | עובר |
| dark | `status open (marker badge)` על `badge-edge` | `#4ED17F` / `#1B1D20` | 8.65 | 3.0 | עובר |
| dark | `status soon (marker badge)` על `badge-edge` | `#F2A541` / `#1B1D20` | 8.23 | 3.0 | עובר |
| dark | `map label` על `m-land` | `#D9DCDF` / `#141517` | 13.27 | 3.0 | עובר |
| dark | `road label` על `m-road` | `#A0A6AD` / `#2B2E33` | 5.55 | 3.0 | עובר |
| dark | `line` על `surface` | `#3A3E44` / `#1B1D20` | 1.57 | — | עובר |

סה״כ כשלים: 0.

### הבחנה בין צבעי הכשרות, המותג ונקודת המיקום (CIEDE2000, כולל הדמיית עיוורון צבעים)

שלושת הזוגות הקרובים ביותר בכל מצב (ΔE00; מעל ~10 מובחן היטב, 5–10 מובחן בסמיכות, מתחת ל-5 – רק עם האות). מוצרים לא בטבלה – הסמן שלו חלול (הבדל צורה). ההדמיה לפי Machado 2009 בחומרה מלאה.

| מצב | ראייה | הזוגות הקרובים |
|---|---|---|
| light | normal | brand/landa 24.3 · brand/chabad 24.7 · me/chabad 25.8 |
| light | deutan | chabad/eda 20.4 · brand/landa 23.8 · me/chabad 24.0 |
| light | protan | chabad/eda 8.0 · brand/landa 21.1 · brand/eda 23.3 |
| light | tritan | eda/landa 14.3 · brand/chabad 22.4 · brand/landa 25.1 |
| dark | normal | me/chabad 21.3 · chabad/eda 29.9 · eda/landa 37.1 |
| dark | deutan | me/chabad 18.9 · me/eda 20.8 · chabad/eda 21.5 |
| dark | protan | chabad/eda 9.9 · me/chabad 19.2 · me/eda 23.0 |
| dark | tritan | eda/landa 12.3 · me/chabad 19.7 · brand/eda 28.3 |

בכל מקרה הסמן נושא אות (ח/ע/ל/מ) והטקסט המלא של הכשרות מופיע ברשימה ובכרטיס – הצבע אינו הסימן היחיד.

## סמנים ואשכולות

חותם עגול 32px עם טבעת פנימית דקה (כמו חותמת כשרות). סטטוס: תג עגול בפינה – ירוק עם ✓ = פתוח, כתום עם שעון = נסגר בקרוב. אשכול: עיגול דיו עם מספר צהוב וטבעת מחולקת לפי הכשרויות שבו (MapLibre `clusterProperties`).

אזור לחיצה 44px לכל סמן (`::before` כמו היום). מומלץ לממש כשכבת GeoJSON עם clustering מובנה (כפי שהומלץ בביקורת) – הסמנים כ-SDF/תמונות שנוצרות מה-SVG.

## מאמץ מימוש משוער

בינוני-גבוה. Rubik במקום Assistant (גופן משתנה ~70KB), גדלים גדולים יותר משפיעים על כל המסכים, תוויות סטטוס מלאות וטבעת אשכול מחולקת (clusterProperties) – כמה בקשות ל-map-ux.
