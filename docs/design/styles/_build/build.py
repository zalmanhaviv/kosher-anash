#!/usr/bin/env python3
"""Assemble the four self-contained mockups: docs/design/styles/<style>.html
Run from anywhere:  node docs/design/styles/_build/data.mjs && python3 docs/design/styles/_build/build.py"""
import os, re, json
B = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.dirname(B)
rd = lambda f: open(os.path.join(B, f), encoding='utf-8').read()
STYLES = {
    'apple': ('שקט ומדויק', 'השראה: Apple Maps', 'family=Noto+Sans+Hebrew:wght@400;500;600;700;800'),
    'wolt': ('נועז וידידותי', 'השראה: Wolt', 'family=Rubik:wght@400;500;600;700&family=Varela+Round'),
    'airbnb': ('חם ורך', 'השראה: Airbnb', 'family=Assistant:wght@400;500;600;700;800'),
    'google': ('מעשי וצפוף', 'השראה: Google Maps', 'family=Heebo:wght@400;500;600;700'),
}
def dark_dup(css):
    # every ':root[data-theme=dark]{…}' block is also emitted for the system setting (unless the reviewer forced light)
    out = css
    for m in re.finditer(r':root\[data-theme=dark\]\{([^}]*)\}', css):
        out += '\n@media (prefers-color-scheme:dark){:root:not([data-theme=light]){' + m.group(1) + '}}'
    return out
data = json.load(open(os.path.join(B, 'data.json'), encoding='utf-8'))
for p in data['places']: p.pop('hay', None)
DATA = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
for st, (label, insp, fonts) in STYLES.items():
    if not os.path.exists(os.path.join(B, st + ".css")): continue
    css = dark_dup(rd('common.css')) + '\n' + rd('base.css') + '\n' + dark_dup(rd(st + '.css'))
    nav = ''.join(f'<a href="{k}.html"{" aria-current=page" if k == st else ""}>{v[0]}</a>' for k, v in STYLES.items())
    html = f'''<!doctype html>
<html lang="he" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="color-scheme" content="light dark">
<title>כשר לאנ״ש · הדמיית סגנון: {label}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?{fonts}&display=swap">
<style>
{css}
</style></head>
<body data-view="both">
<header class="rv">
  <div class="rvt"><b>כשר לאנ״ש · הדמיית סגנון</b><span>{label} · {insp}</span></div>
  <nav class="rvn" aria-label="סגנונות">{nav}</nav>
  <div class="rvg" role="group" aria-label="תצוגה"><button data-view-b="both" aria-pressed="true">נייד ומחשב</button><button data-view-b="phone" aria-pressed="false">נייד</button><button data-view-b="desk" aria-pressed="false">מחשב</button></div>
  <div class="rvg" role="group" aria-label="מראה"><button data-theme-b="system" aria-pressed="true">לפי המערכת</button><button data-theme-b="light" aria-pressed="false">בהיר</button><button data-theme-b="dark" aria-pressed="false">כהה</button></div>
  <p class="rvnote">הדמיה לבחירת סגנון בלבד – הפס הזה אינו חלק מהעיצוב. נתונים אמיתיים מהמאגר ({len(data["places"])} מקומות בכל הארץ). השעה בהדמיה: {data["now"]}, שעון ישראל. המפה היא שרטוט, באפליקציה יוצגו אריחי OpenFreeMap בסגנון הזה.</p>
</header>
<main class="stage"><div class="phwrap"><div id="phone" class="frame"></div></div><div class="dkwrap"><div id="desk" class="frame"></div></div></main>
<script>
window.KA_DATA={DATA};
{rd("geo.js")}
{rd(st + ".js")}
{rd("engine.js")}
</script>
</body></html>
'''
    open(os.path.join(OUT, st + '.html'), 'w', encoding='utf-8').write(html)
    print(st, len(html))
