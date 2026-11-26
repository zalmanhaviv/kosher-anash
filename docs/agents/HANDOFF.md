# העברה בין סשנים

## מצב נוכחי
שלב 0 (ביקורת) הושלם 25.11. ממתין להחלטת הבעלים לפני שלב 1.

## הושלם
- 25.11: תשתית הצוות (CONTEXT, OWNERSHIP, BOARD, REQUESTS, DECISIONS, CHANGELOG, הגדרות סוכנים).
- 25.11: S0-1 auditor – `docs/AUDIT.md` (commit 9e51a92). ציונים: נתונים 6, שעות ושבת 7, מפה ורשימה 6, עיצוב 4, ביצועים 7, נגישות 5, פרטיות 8, הנדסה 5. המתאם אימת את באג 24 השעות (statusAt מחזיר "נסגר בעוד 30 דק׳" ב-23:30).

## פתוח
- S1-7 (design-system, 26.11): הסגנון המשולב מומש ב-branch `agent/design-system/S1-7` (ממתין ל-PR, reviewer ו-qa). צילומי לפני/אחרי ב-`docs/design/impl/`. בדיקה: `python3 docs/design/impl/shots.py dist after`. נוצרו 4 בקשות ל-map-ux ובקשה ל-perf-pwa ב-REQUESTS.md. שינוי שורה אחת בסקריפט (כתובת סגנון המפה) ושינויים ב-sw.js, `_headers` ו-check.yml נעשו לפי הוראת המתאם במשימה.
- ממתין להעלאה (רק באישור): תיקון שלטי כבישים ריקים + רטט (PR #3, ב-main).
- החלטות לבעלים לפני שלב 1: נוסח לשעות חשודות (P0-3); אישור הגנת ענף על main (P0-4).

- S1-8 (hours-shabbat, 26.11): branch `agent/hours-shabbat/S1-8` (נדחף, בלי PR). P0-2 תוקן ב-`src/logic.js` (איחוד תקופות, שקיעה NOAA מלאה), 28 בדיקות עוברות ב-3 אזורי זמן, validate ו-build עוברים. אין שינוי חתימה ואין שינוי ב-template. פתוח: אימות נרות מול לוח מפורסם (חסום ברשת) ושאלת גובה; הדלקת נרות לערב חג (REQUESTS.md). ממתין ל-reviewer ו-qa.

- S1-9 (map-ux, 26.11): branch `agent/map-ux/S1-9` (נדחף, בלי PR, בלי deploy). תוקנו QA1-1 עד QA1-7, ביקורת #2, #3 ו-#5, ו-3 בקשות של design-system (REQUESTS מסומנות). לפי הוראת המתאם נערכו גם קבצים שאינם של map-ux: בלוק הסגנון (design-system) – `.kh` עוטף לשורה שנייה, `.foot a` בגובה 44px, גודל האות ב-`.kbox .ks` עבר מהסגנון המוטבע ל-CSS, הוסר הבורר `[style*="Assistant"]`. ובנוסף `tests/e2e/app.e2e.mjs` וצילומי הבסיס (qa) ו-CHANGELOG/HANDOFF/REQUESTS (מתאם). בלי צבעים חדשים: ל-theme-color הוזנו ערכי `--bg` כפי שביקש design-system. בדיקות: validate 0 שגיאות, contrast 60 זוגות (הנמוך 5.07), logic 28/28 בשלושה אזורי זמן, flags --check 0, build עובר, e2e 60/60 ו-0 todo. 15 הבדיקות החדשות נכשלות על `main` ועוברות על ה-branch. visual: אחרי עדכון 3 הבסיסים, כל השישה ≤0.14%. פתוח: `/vendor/fonts.css` (ביקורת #4, perf-pwa). `docs/qa/stage1.md` עדיין מציין 53 בדיקות ו-8 todo (qa). ממתין ל-reviewer.

## השלב הבא (סשן חדש)
שלב 1 לפי AUDIT §8: data (P0-1: שעות שבת/ליל שישי חשודות, התאמות גוגל משותפות, הרחבת validate.py) → design-system (2–3 כיוונים, הבעלים בוחר) → hours-shabbat (P0-2: איחוד תקופות רצופות, בדיקות 24 שעות ונרות ±1 דק׳) → reviewer → qa.
P0-4 (בדיקת נתונים חיים מלאה + escaping של t) ו-P0-5 (נוסח ליל שישי בכרטיס) – map-ux בתחילת שלב 1 לפי AUDIT.
