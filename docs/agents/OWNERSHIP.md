# בעלות על קבצים

סוכן עורך רק את מה שבבעלותו. צריך שינוי בקובץ של אחר → שורה ב-`REQUESTS.md`.
`src/template.html` הוא קובץ אחד שמתחלק לפי אזורים (עד שיפוצל באישור הבעלים):

| סוכן | בבעלותו |
|---|---|
| auditor | `docs/AUDIT.md` בלבד |
| data | `data/`, `scripts/validate.py`, סקריפטי נתונים חדשים ב-`scripts/data/` |
| design-system | בלוק `<style>` ב-`src/template.html` (כולל `:root`), `public/map-style/`, `public/icon-*`, `public/og.png`, `src/theme/` (חדש, אם יפוצל) |
| map-ux | ה-markup והסקריפט של היישום ב-`src/template.html` (חוץ מבלוק הסגנון), `docs/terms.md`, `src/screens/`, `src/features/` (אם יפוצלו) |
| hours-shabbat | `src/logic.js` (שעות, שבת, שעון ישראל), `src/lib/hours/` (אם יפוצל) |
| perf-pwa | `public/sw.js`, `public/manifest.webmanifest`, `public/_headers`, `scripts/build.py`, `scripts/fetch_vendor.sh` |
| a11y-i18n | `src/i18n/` (חדש); בכל השאר – בקשות ובדיקות בלבד |
| qa | `tests/`, `.github/workflows/` |
| reviewer | הערות בלבד (ב-PR או ב-`HANDOFF.md` דרך המתאם) |
| מתאם | `docs/agents/*`, `docs/DECISIONS.md`, `docs/CHANGELOG.md`, `.claude/agents/`, `README.md` |
