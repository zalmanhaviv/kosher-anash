# כיוון: נרות (Neirot (candlelight))

הצעה בלבד (S1-2). שום דבר לא מומש ב-`src/template.html`; הבעלים בוחר קודם.

## הרעיון

- השעה שלפני הדלקת נרות: שולחן לבן, גביע יין, פמוטי פליז. רוב השימוש הוא ביום שישי בדרך – אז זמן ההדלקה הוא חלק מהמסך ולא הערה.
- צבע המותג יין עמוק ולא כחול, כך שכחול נשאר רק לחב״ד ולנקודת המיקום. פס ההדלקה כהה עם טקסט פליז – הדבר הכי בולט ביום שישי.
- שמות מקומות וכותרות בגופן ספרי קלאסי (Frank Ruhl Libre), טקסט רץ ב-Assistant הקיים: מכובד ומוכר למי שגדל על ספרים, בלי להיראות כמו אפליקציית טכנולוגיה.
- סמנים: אריח מעוגל עם אות, נקודת סטטוס קטנה בפינה. בלי סיכה.

## קבצים

- `mock.html` – הדמיה סטטית עצמאית: נייד 390×844 (בית, כרטיס מקום; בהיר וכהה) ומחשב 1280×800 (בהיר וכהה).
- `phone-light.png`, `phone-dark.png`, `card.png`, `desktop.png` (+ `card-dark.png`, `desktop-dark.png`).
- `map-style.json` – דריסות צבע לשכבות liberty (בהיר וכהה), והסרת רעש (POI, מספרי בתים, תלת-ממד).
- `markers.svg` – סמנים לכל כשרות ומצב, אשכול, ונקודת "המיקום שלי", על רקע המפה בבהיר ובכהה.

**הנתונים בהדמיה אמיתיים:** מקומות מצפת והסביבה מתוך `data/places.json`, הכשרות מילה במילה, והסטטוס חושב ב-`statusAt` של `src/logic.js` ליום שישי 27.11.2026 12:30 (שעון ישראל), עם סינון "פתוח עכשיו" כמו באפליקציה. הדלקת נרות בצפת: 16:14 (מנהג חב״ד, `candles`). המרחק לא מוצג כי לא נמסר מיקום (תיקון לבאג שבביקורת). המפה היא שרטוט סכמטי בצבעי הסגנון – לא אריחים אמיתיים (אין רשת בסביבת העבודה).

## גופנים

| תפקיד | גופן | רישיון | משקלים | שימוש |
|---|---|---|---|---|
| כותרות | Frank Ruhl Libre | SIL Open Font License 1.1 | 500 / 700 / 900 | כותרות, שמות מקומות, שעת ההדלקה |
| טקסט | Assistant | SIL Open Font License 1.1 (כבר מתארח באתר) | 400 / 600 / 700 | כל השאר |

כל הגופנים חינמיים, זמינים ב-Google Fonts וב-`@fontsource/*` ב-npm, ואפשר לארח אותם באתר (`vendor/`) כמו את Assistant היום. **בצילומי המסך** הגופנים לא היו זמינים (אין רשת) והוצגו גופני מערכת חלופיים (FreeSerif / Liberation / DejaVu) – האופי קרוב, הפרטים לא.

## אסימונים

### צבע (בהיר / כהה)

| אסימון | בהיר | כהה | תפקיד |
|---|---|---|---|
| `--bg` | `#F3F2F1` | `#151214` | רקע |
| `--surface` | `#FFFFFF` | `#1F1A1C` | משטח (גיליון, כרטיס) |
| `--surface2` | `#F7F5F5` | `#282225` | משטח משני |
| `--line` | `#E4DFDF` | `#3A3135` | קו מפריד (דקורטיבי) |
| `--ink` | `#1F191B` | `#F2EDEE` | טקסט ראשי |
| `--sub` | `#5A5053` | `#C2B6B9` | טקסט משני |
| `--mut` | `#6A6063` | `#A99DA0` | טקסט שקט |
| `--brand` | `#7A1F35` | `#B8455E` | מותג (כפתור ראשי, צ׳יפ נבחר) |
| `--brand-on` | `#FFFFFF` | `#FFFFFF` | טקסט על מותג |
| `--brand-soft` | `#F5E9EC` | `#3A2027` | רקע מותג רך |
| `--brand-ink` | `#6B1A2E` | `#F0B3C0` | טקסט מותג על משטח |
| `--band` | `#3B1420` | `#3B1420` | פס הדלקת נרות |
| `--band-ink` | `#F3D48A` | `#F3D48A` | טקסט בפס |
| `--open` | `#13753B` | `#5BC983` | פתוח |
| `--soon` | `#9A5500` | `#F2A541` | נסגר בקרוב |
| `--closed` | `#B3261E` | `#FF8F86` | סגור |
| `--noinfo` | `#5F5759` | `#B3A8AA` | אין מידע |
| `--k-chabad` | `#1A3570` | `#2F4FA3` | כשרות חב״ד – מילוי סמן |
| `--k-eda` | `#0B6C6F` | `#128083` | כשרות העדה החרדית – מילוי סמן |
| `--k-landa` | `#C58B0E` | `#D69C1F` | כשרות לנדא – מילוי סמן |
| `--k-products` | `#56606B` | `#AEB6C0` | כשרות מוצרי העדה/לנדא – מילוי סמן |
| `--k-chabad-on` | `#FFFFFF` | `#FFFFFF` | כשרות חב״ד – אות על המילוי |
| `--k-eda-on` | `#FFFFFF` | `#FFFFFF` | כשרות העדה החרדית – אות על המילוי |
| `--k-landa-on` | `#1F1600` | `#1F1600` | כשרות לנדא – אות על המילוי |
| `--k-products-on` | `#56606B` | `#AEB6C0` | כשרות מוצרי העדה/לנדא – אות על המילוי |
| `--k-chabad-ink` | `#1A3570` | `#9EB3F2` | כשרות חב״ד – טקסט על משטח |
| `--k-eda-ink` | `#0A6467` | `#63C9CB` | כשרות העדה החרדית – טקסט על משטח |
| `--k-landa-ink` | `#7E5600` | `#E8B84A` | כשרות לנדא – טקסט על משטח |
| `--k-products-ink` | `#4F5964` | `#B8C0C9` | כשרות מוצרי העדה/לנדא – טקסט על משטח |
| `--me` | `#2B7CFF` | `#4C94FF` | נקודת המיקום שלי |
| `--ring` | `#FFFFFF` | `#F2EDEE` | טבעת סמן |
| `--mk-edge` | `#4A3A3F` | `#F2EDEE` | קו מתאר חיצוני לכל סמן (ניגודיות מול המפה) |
| `--badge-edge` | `#FFFFFF` | `#1F1A1C` | מסגרת תג הסטטוס בסמן |

מוצרים (מ) מוצג תמיד כסמן **חלול** (מילוי משטח, מסגרת ואות בצבע) – הבדל צורה ולא רק צבע. מיקום משוער – מסגרת מקווקוות (כמו היום).

### צבעי מפה

| שכבה | בהיר | כהה |
|---|---|---|
| land | `#EEEDEB` | `#1A1618` |
| resid | `#E9E7E5` | `#1E1A1C` |
| park | `#DDE5D6` | `#1F2A20` |
| wood | `#D5DFCC` | `#1D281E` |
| water | `#BFD0DA` | `#0E1C24` |
| waterline | `#A9C0CD` | `#163040` |
| building | `#E2DFDC` | `#231E21` |
| road | `#FFFFFF` | `#2C2629` |
| casing | `#D8D2CF` | `#2C2629` |
| major | `#FFFFFF` | `#3A3236` |
| major-casing | `#CFC7C2` | `#3A3236` |
| motorway | `#F1E3C6` | `#4A3C26` |
| motorway-casing | `#D8C59A` | `#4A3C26` |
| rail | `#CFC9C6` | `#332C2F` |
| boundary | `#B9AFAD` | `#4D4246` |
| label | `#3D3335` | `#CFC4C6` |
| label-halo | `#FFFFFF` | `#1A1618` |
| road-label | `#6A6063` | `#9C9093` |
| water-label | `#4F6B7A` | `#7FA3B5` |

### טיפוגרפיה, רדיוסים, רווחים, צללים

| | |
|---|---|
| סולם (xs…xxl) | 12px / 13px / 14.5px / 16px / 18px / 24px / 28px (קלטים 16px לפחות – בלי זום ב-iOS) |
| רדיוס | xs 6px, sm 10px, md 14px, lg 22px, pill 999px, marker 9px |
| רווחים | s1 4px, s2 8px, s3 12px, s4 16px, s5 20px, s6 24px, s8 32px |
| צל (light) | sh1 `0 1px 0 rgba(58,20,32,.06),0 2px 10px rgba(58,20,32,.08)` · sh2 `0 -6px 24px rgba(58,20,32,.16)` |
| צל (dark) | sh1 `0 1px 0 rgba(0,0,0,.4),0 2px 10px rgba(0,0,0,.35)` · sh2 `0 -6px 24px rgba(0,0,0,.5)` |

## בדיקת ניגודיות

חושב לפי WCAG 2.x (יחס בהירות יחסית). טקסט רגיל ≥ 4.5:1; רכיבי ממשק וסמנים מול המפה ≥ 3:1. "קו מפריד" דקורטיבי – בלי דרישה.

| מצב | זוג | צבעים | יחס | נדרש | |
|---|---|---|---|---|---|
| light | `ink` על `surface` | `#1F191B` / `#FFFFFF` | 17.31 | 4.5 | עובר |
| light | `ink` על `bg` | `#1F191B` / `#F3F2F1` | 15.48 | 4.5 | עובר |
| light | `sub` על `surface` | `#5A5053` / `#FFFFFF` | 7.76 | 4.5 | עובר |
| light | `sub` על `bg` | `#5A5053` / `#F3F2F1` | 6.94 | 4.5 | עובר |
| light | `mut` על `surface` | `#6A6063` / `#FFFFFF` | 6.06 | 4.5 | עובר |
| light | `mut` על `bg` | `#6A6063` / `#F3F2F1` | 5.42 | 4.5 | עובר |
| light | `mut` על `surface2` | `#6A6063` / `#F7F5F5` | 5.58 | 4.5 | עובר |
| light | `brand-ink` על `surface` | `#6B1A2E` / `#FFFFFF` | 11.59 | 4.5 | עובר |
| light | `brand-ink` על `brand-soft` | `#6B1A2E` / `#F5E9EC` | 9.79 | 4.5 | עובר |
| light | `brand-on` על `brand` | `#FFFFFF` / `#7A1F35` | 10.12 | 4.5 | עובר |
| light | `band-ink` על `band` | `#F3D48A` / `#3B1420` | 11.17 | 4.5 | עובר |
| light | `open` על `surface` | `#13753B` / `#FFFFFF` | 5.78 | 4.5 | עובר |
| light | `soon` על `surface` | `#9A5500` / `#FFFFFF` | 5.72 | 4.5 | עובר |
| light | `closed` על `surface` | `#B3261E` / `#FFFFFF` | 6.54 | 4.5 | עובר |
| light | `noinfo` על `surface` | `#5F5759` / `#FFFFFF` | 7.01 | 4.5 | עובר |
| light | `k-chabad-ink` על `surface` | `#1A3570` / `#FFFFFF` | 11.75 | 4.5 | עובר |
| light | `k-chabad-on` על `k-chabad` | `#FFFFFF` / `#1A3570` | 11.75 | 4.5 | עובר |
| light | `k-eda-ink` על `surface` | `#0A6467` / `#FFFFFF` | 6.93 | 4.5 | עובר |
| light | `k-eda-on` על `k-eda` | `#FFFFFF` / `#0B6C6F` | 6.20 | 4.5 | עובר |
| light | `k-landa-ink` על `surface` | `#7E5600` / `#FFFFFF` | 6.53 | 4.5 | עובר |
| light | `k-landa-on` על `k-landa` | `#1F1600` / `#C58B0E` | 6.03 | 4.5 | עובר |
| light | `k-products-ink` על `surface` | `#4F5964` / `#FFFFFF` | 7.13 | 4.5 | עובר |
| light | `marker edge (outline of every marker)` על `m-land` | `#4A3A3F` / `#EEEDEB` | 9.12 | 3.0 | עובר |
| light | `marker edge` על `m-park` | `#4A3A3F` / `#DDE5D6` | 8.26 | 3.0 | עובר |
| light | `marker k-products (border)` על `surface` | `#56606B` / `#FFFFFF` | 6.40 | 3.0 | עובר |
| light | `me dot` על `m-land` | `#2B7CFF` / `#EEEDEB` | 3.31 | 3.0 | עובר |
| light | `cluster brand` על `m-land` | `#7A1F35` / `#EEEDEB` | 8.65 | 3.0 | עובר |
| light | `status open (marker badge)` על `badge-edge` | `#13753B` / `#FFFFFF` | 5.78 | 3.0 | עובר |
| light | `status soon (marker badge)` על `badge-edge` | `#9A5500` / `#FFFFFF` | 5.72 | 3.0 | עובר |
| light | `map label` על `m-land` | `#3D3335` / `#EEEDEB` | 10.41 | 3.0 | עובר |
| light | `road label` על `m-road` | `#6A6063` / `#FFFFFF` | 6.06 | 3.0 | עובר |
| light | `line` על `surface` | `#E4DFDF` / `#FFFFFF` | 1.32 | — | עובר |
| dark | `ink` על `surface` | `#F2EDEE` / `#1F1A1C` | 14.82 | 4.5 | עובר |
| dark | `ink` על `bg` | `#F2EDEE` / `#151214` | 16.06 | 4.5 | עובר |
| dark | `sub` על `surface` | `#C2B6B9` / `#1F1A1C` | 8.74 | 4.5 | עובר |
| dark | `sub` על `bg` | `#C2B6B9` / `#151214` | 9.47 | 4.5 | עובר |
| dark | `mut` על `surface` | `#A99DA0` / `#1F1A1C` | 6.56 | 4.5 | עובר |
| dark | `mut` על `bg` | `#A99DA0` / `#151214` | 7.10 | 4.5 | עובר |
| dark | `mut` על `surface2` | `#A99DA0` / `#282225` | 5.96 | 4.5 | עובר |
| dark | `brand-ink` על `surface` | `#F0B3C0` / `#1F1A1C` | 9.74 | 4.5 | עובר |
| dark | `brand-ink` על `brand-soft` | `#F0B3C0` / `#3A2027` | 8.42 | 4.5 | עובר |
| dark | `brand-on` על `brand` | `#FFFFFF` / `#B8455E` | 5.18 | 4.5 | עובר |
| dark | `band-ink` על `band` | `#F3D48A` / `#3B1420` | 11.17 | 4.5 | עובר |
| dark | `open` על `surface` | `#5BC983` / `#1F1A1C` | 8.28 | 4.5 | עובר |
| dark | `soon` על `surface` | `#F2A541` / `#1F1A1C` | 8.37 | 4.5 | עובר |
| dark | `closed` על `surface` | `#FF8F86` / `#1F1A1C` | 7.79 | 4.5 | עובר |
| dark | `noinfo` על `surface` | `#B3A8AA` / `#1F1A1C` | 7.44 | 4.5 | עובר |
| dark | `k-chabad-ink` על `surface` | `#9EB3F2` / `#1F1A1C` | 8.33 | 4.5 | עובר |
| dark | `k-chabad-on` על `k-chabad` | `#FFFFFF` / `#2F4FA3` | 7.59 | 4.5 | עובר |
| dark | `k-eda-ink` על `surface` | `#63C9CB` / `#1F1A1C` | 8.79 | 4.5 | עובר |
| dark | `k-eda-on` על `k-eda` | `#FFFFFF` / `#128083` | 4.73 | 4.5 | עובר |
| dark | `k-landa-ink` על `surface` | `#E8B84A` / `#1F1A1C` | 9.31 | 4.5 | עובר |
| dark | `k-landa-on` על `k-landa` | `#1F1600` / `#D69C1F` | 7.36 | 4.5 | עובר |
| dark | `k-products-ink` על `surface` | `#B8C0C9` / `#1F1A1C` | 9.34 | 4.5 | עובר |
| dark | `marker edge (outline of every marker)` על `m-land` | `#F2EDEE` / `#1A1618` | 15.47 | 3.0 | עובר |
| dark | `marker edge` על `m-park` | `#F2EDEE` / `#1F2A20` | 12.85 | 3.0 | עובר |
| dark | `marker k-products (border)` על `surface` | `#AEB6C0` / `#1F1A1C` | 8.38 | 3.0 | עובר |
| dark | `me dot` על `m-land` | `#4C94FF` / `#1A1618` | 5.96 | 3.0 | עובר |
| dark | `cluster brand` על `m-land` | `#B8455E` / `#1A1618` | 3.46 | 3.0 | עובר |
| dark | `status open (marker badge)` על `badge-edge` | `#5BC983` / `#1F1A1C` | 8.28 | 3.0 | עובר |
| dark | `status soon (marker badge)` על `badge-edge` | `#F2A541` / `#1F1A1C` | 8.37 | 3.0 | עובר |
| dark | `map label` על `m-land` | `#CFC4C6` / `#1A1618` | 10.55 | 3.0 | עובר |
| dark | `road label` על `m-road` | `#9C9093` / `#2C2629` | 4.82 | 3.0 | עובר |
| dark | `line` על `surface` | `#3A3135` / `#1F1A1C` | 1.37 | — | עובר |

סה״כ כשלים: 0.

### הבחנה בין צבעי הכשרות, המותג ונקודת המיקום (CIEDE2000, כולל הדמיית עיוורון צבעים)

שלושת הזוגות הקרובים ביותר בכל מצב (ΔE00; מעל ~10 מובחן היטב, 5–10 מובחן בסמיכות, מתחת ל-5 – רק עם האות). מוצרים לא בטבלה – הסמן שלו חלול (הבדל צורה). ההדמיה לפי Machado 2009 בחומרה מלאה.

| מצב | ראייה | הזוגות הקרובים |
|---|---|---|
| light | normal | me/chabad 28.6 · chabad/eda 29.1 · brand/chabad 30.7 |
| light | deutan | chabad/eda 18.1 · brand/eda 22.4 · me/eda 23.1 |
| light | protan | brand/eda 17.5 · brand/chabad 20.6 · chabad/eda 21.4 |
| light | tritan | chabad/eda 16.5 · me/eda 19.2 · me/chabad 31.3 |
| dark | normal | me/chabad 27.1 · me/eda 29.9 · chabad/eda 30.4 |
| dark | deutan | chabad/eda 18.3 · me/eda 21.6 · brand/eda 23.2 |
| dark | protan | brand/eda 11.7 · chabad/eda 22.0 · brand/chabad 23.0 |
| dark | tritan | chabad/eda 14.5 · me/eda 15.5 · brand/landa 21.6 |

בכל מקרה הסמן נושא אות (ח/ע/ל/מ) והטקסט המלא של הכשרות מופיע ברשימה ובכרטיס – הצבע אינו הסימן היחיד.

## סמנים ואשכולות

אריח מעוגל 30px (נבחר 39px) עם אות בגופן הכותרות, טבעת לבנה. סטטוס: נקודה ירוקה מלאה = פתוח, טבעת כתומה = נסגר בקרוב, בלי סימן = אין מידע. אשכול: עיגול יין עם טבעת פליז ומספר.

אזור לחיצה 44px לכל סמן (`::before` כמו היום). מומלץ לממש כשכבת GeoJSON עם clustering מובנה (כפי שהומלץ בביקורת) – הסמנים כ-SDF/תמונות שנוצרות מה-SVG.

## מאמץ מימוש משוער

בינוני. החלפת אסימונים + גופן כותרות אחד חדש (~40KB woff2 לתת-קבוצה עברית). פס ההדלקה כבר קיים (`.shab`) – רק עיצוב. סמנים: צורה דומה להיום.
