# Token sets for the three proposed directions (S1-2). Source of truth for mock.html,
# map-style.json, markers.svg and the contrast tables in each README.
# Nothing here is used by the app yet; the owner chooses a direction first.

COMMON_SCALE = {
    # 4-based spacing, shared by all directions (current app already uses it)
    'space': {'s1': '4px', 's2': '8px', 's3': '12px', 's4': '16px', 's5': '20px', 's6': '24px', 's8': '32px'},
}

DIRS = {
 'neirot': {
  'title': 'נרות', 'title_en': 'Neirot (candlelight)',
  'concept': [
   'השעה שלפני הדלקת נרות: שולחן לבן, גביע יין, פמוטי פליז. רוב השימוש הוא ביום שישי בדרך – אז זמן ההדלקה הוא חלק מהמסך ולא הערה.',
   'צבע המותג יין עמוק ולא כחול, כך שכחול נשאר רק לחב״ד ולנקודת המיקום. פס ההדלקה כהה עם טקסט פליז – הדבר הכי בולט ביום שישי.',
   'שמות מקומות וכותרות בגופן ספרי קלאסי (Frank Ruhl Libre), טקסט רץ ב-Assistant הקיים: מכובד ומוכר למי שגדל על ספרים, בלי להיראות כמו אפליקציית טכנולוגיה.',
   'סמנים: אריח מעוגל עם אות, נקודת סטטוס קטנה בפינה. בלי סיכה.',
  ],
  'fonts': {
   'display': ('Frank Ruhl Libre', 'SIL Open Font License 1.1', '"Frank Ruhl Libre","FreeSerif","Liberation Serif",serif', 'כותרות, שמות מקומות, שעת ההדלקה', '500 / 700 / 900'),
   'body': ('Assistant', 'SIL Open Font License 1.1 (כבר מתארח באתר)', '"Assistant","Liberation Sans",Arial,sans-serif', 'כל השאר', '400 / 600 / 700'),
  },
  'type': {'xs': '12px', 'sm': '13px', 'md': '14.5px', 'base': '16px', 'lg': '18px', 'xl': '24px', 'xxl': '28px'},
  'radius': {'xs': '6px', 'sm': '10px', 'md': '14px', 'lg': '22px', 'pill': '999px', 'marker': '9px'},
  'shadow': {
   'light': {'sh1': '0 1px 0 rgba(58,20,32,.06),0 2px 10px rgba(58,20,32,.08)', 'sh2': '0 -6px 24px rgba(58,20,32,.16)'},
   'dark': {'sh1': '0 1px 0 rgba(0,0,0,.4),0 2px 10px rgba(0,0,0,.35)', 'sh2': '0 -6px 24px rgba(0,0,0,.5)'},
  },
  'c': {
   'light': {
    'bg': '#F3F2F1', 'surface': '#FFFFFF', 'surface2': '#F7F5F5', 'line': '#E4DFDF',
    'ink': '#1F191B', 'sub': '#5A5053', 'mut': '#6A6063',
    'brand': '#7A1F35', 'brand-on': '#FFFFFF', 'brand-soft': '#F5E9EC', 'brand-ink': '#6B1A2E',
    'band': '#3B1420', 'band-ink': '#F3D48A',
    'open': '#13753B', 'soon': '#9A5500', 'closed': '#B3261E', 'noinfo': '#5F5759',
    'k-chabad': '#1A3570', 'k-eda': '#0B6C6F', 'k-landa': '#C58B0E', 'k-products': '#56606B',
    'k-chabad-on': '#FFFFFF', 'k-eda-on': '#FFFFFF', 'k-landa-on': '#1F1600', 'k-products-on': '#56606B',
    'k-chabad-ink': '#1A3570', 'k-eda-ink': '#0A6467', 'k-landa-ink': '#7E5600', 'k-products-ink': '#4F5964',
    'me': '#2B7CFF', 'ring': '#FFFFFF', 'mk-edge': '#4A3A3F', 'badge-edge': '#FFFFFF',
   },
   'dark': {
    'bg': '#151214', 'surface': '#1F1A1C', 'surface2': '#282225', 'line': '#3A3135',
    'ink': '#F2EDEE', 'sub': '#C2B6B9', 'mut': '#A99DA0',
    'brand': '#B8455E', 'brand-on': '#FFFFFF', 'brand-soft': '#3A2027', 'brand-ink': '#F0B3C0',
    'band': '#3B1420', 'band-ink': '#F3D48A',
    'open': '#5BC983', 'soon': '#F2A541', 'closed': '#FF8F86', 'noinfo': '#B3A8AA',
    'k-chabad': '#2F4FA3', 'k-eda': '#128083', 'k-landa': '#D69C1F', 'k-products': '#AEB6C0',
    'k-chabad-on': '#FFFFFF', 'k-eda-on': '#FFFFFF', 'k-landa-on': '#1F1600', 'k-products-on': '#AEB6C0',
    'k-chabad-ink': '#9EB3F2', 'k-eda-ink': '#63C9CB', 'k-landa-ink': '#E8B84A', 'k-products-ink': '#B8C0C9',
    'me': '#4C94FF', 'ring': '#F2EDEE', 'mk-edge': '#F2EDEE', 'badge-edge': '#1F1A1C',
   },
  },
  'map': {
   'light': {'land': '#EEEDEB', 'resid': '#E9E7E5', 'park': '#DDE5D6', 'wood': '#D5DFCC', 'water': '#BFD0DA', 'waterline': '#A9C0CD',
             'building': '#E2DFDC', 'road': '#FFFFFF', 'casing': '#D8D2CF', 'major': '#FFFFFF', 'major-casing': '#CFC7C2',
             'motorway': '#F1E3C6', 'motorway-casing': '#D8C59A', 'rail': '#CFC9C6', 'boundary': '#B9AFAD',
             'label': '#3D3335', 'label-halo': '#FFFFFF', 'road-label': '#6A6063', 'water-label': '#4F6B7A'},
   'dark': {'land': '#1A1618', 'resid': '#1E1A1C', 'park': '#1F2A20', 'wood': '#1D281E', 'water': '#0E1C24', 'waterline': '#163040',
            'building': '#231E21', 'road': '#2C2629', 'casing': '#2C2629', 'major': '#3A3236', 'major-casing': '#3A3236',
            'motorway': '#4A3C26', 'motorway-casing': '#4A3C26', 'rail': '#332C2F', 'boundary': '#4D4246',
            'label': '#CFC4C6', 'label-halo': '#1A1618', 'road-label': '#9C9093', 'water-label': '#7FA3B5'},
  },
  'marker': 'tile', 'cluster': 'wine',
 },

 'tekhelet': {
  'title': 'תכלת ואבן', 'title_en': 'Tekhelet & stone',
  'concept': [
   'צבעי הגליל וצפת: אבן אפורה-קרירה, תכלת של משקופי העיר העתיקה, ירוק זית רק במפה. מקום שמוכר לכל מי שנסע לציון הרשב״י או לצפת.',
   'המותג תכלת כהה (פטרול), והכשרויות צבועות כך שאף אחת מהן אינה כחולה: חב״ד בזהב (כמו דגל משיח), העדה ביין, לנדא בזית כהה, מוצרים בסמן חלול.',
   'כותרות ב-Secular One – עברית מקורית, יציבה ועבה, קריאה מאוד בשמש של יום שישי; טקסט ב-Assistant.',
   'רשימה מקובצת בבלוקים לפי אזור, ופס סטטוס צבעוני בקצה כל שורה – מבט אחד ויודעים מה פתוח.',
  ],
  'fonts': {
   'display': ('Secular One', 'SIL Open Font License 1.1', '"Secular One","DejaVu Sans",sans-serif', 'כותרות ושמות מקומות', '400 (משקל יחיד, עבה)'),
   'body': ('Assistant', 'SIL Open Font License 1.1 (כבר מתארח באתר)', '"Assistant","Liberation Sans",Arial,sans-serif', 'כל השאר', '400 / 600 / 700'),
  },
  'type': {'xs': '12px', 'sm': '13px', 'md': '14.5px', 'base': '16px', 'lg': '18px', 'xl': '23px', 'xxl': '26px'},
  'radius': {'xs': '6px', 'sm': '8px', 'md': '12px', 'lg': '18px', 'pill': '999px', 'marker': '7px'},
  'shadow': {
   'light': {'sh1': '0 1px 2px rgba(15,40,50,.10),0 4px 14px rgba(15,40,50,.08)', 'sh2': '0 -4px 20px rgba(15,40,50,.14)'},
   'dark': {'sh1': '0 1px 2px rgba(0,0,0,.45),0 4px 14px rgba(0,0,0,.35)', 'sh2': '0 -4px 20px rgba(0,0,0,.5)'},
  },
  'c': {
   'light': {
    'bg': '#E8EBEA', 'surface': '#FFFFFF', 'surface2': '#F2F4F3', 'line': '#D3D9D8',
    'ink': '#13232A', 'sub': '#44565D', 'mut': '#56676E',
    'brand': '#0F4C5C', 'brand-on': '#FFFFFF', 'brand-soft': '#E1EDEF', 'brand-ink': '#0D4452',
    'band': '#E1EDEF', 'band-ink': '#0D4452',
    'open': '#17743A', 'soon': '#985600', 'closed': '#B42318', 'noinfo': '#55636A',
    'k-chabad': '#D4A017', 'k-eda': '#7A1F45', 'k-landa': '#3F4A1E', 'k-products': '#56606B',
    'k-chabad-on': '#1C1500', 'k-eda-on': '#FFFFFF', 'k-landa-on': '#FFFFFF', 'k-products-on': '#56606B',
    'k-chabad-ink': '#7A5A06', 'k-eda-ink': '#7A1F45', 'k-landa-ink': '#3F4A1E', 'k-products-ink': '#4F5964',
    'me': '#2B7CFF', 'ring': '#FFFFFF', 'mk-edge': '#23363D', 'badge-edge': '#FFFFFF',
   },
   'dark': {
    'bg': '#0D171B', 'surface': '#15232A', 'surface2': '#1C2D35', 'line': '#2A3E47',
    'ink': '#E9F0F2', 'sub': '#A9BCC3', 'mut': '#93A7AE',
    'brand': '#7CC4D6', 'brand-on': '#06222A', 'brand-soft': '#173A45', 'brand-ink': '#9FD6E3',
    'band': '#173A45', 'band-ink': '#CFEAF1',
    'open': '#5CCB86', 'soon': '#EFA54A', 'closed': '#FF8F86', 'noinfo': '#A6B5BB',
    'k-chabad': '#E2B33A', 'k-eda': '#B0436F', 'k-landa': '#66762F', 'k-products': '#AEB9C0',
    'k-chabad-on': '#1C1500', 'k-eda-on': '#FFFFFF', 'k-landa-on': '#FFFFFF', 'k-products-on': '#AEB9C0',
    'k-chabad-ink': '#EBC45E', 'k-eda-ink': '#EF92B5', 'k-landa-ink': '#B5C776', 'k-products-ink': '#B8C3C9',
    'me': '#4C94FF', 'ring': '#E9F0F2', 'mk-edge': '#E9F0F2', 'badge-edge': '#15232A',
   },
  },
  'map': {
   'light': {'land': '#E4E8E6', 'resid': '#DFE4E2', 'park': '#D3E0D2', 'wood': '#C9D9C8', 'water': '#9EC8D6', 'waterline': '#86B8C8',
             'building': '#D9DFDD', 'road': '#FFFFFF', 'casing': '#C9D1D0', 'major': '#FFFFFF', 'major-casing': '#B9C5C4',
             'motorway': '#D6E6EA', 'motorway-casing': '#9FBFC8', 'rail': '#C3CCCB', 'boundary': '#A3B1B3',
             'label': '#24363D', 'label-halo': '#FFFFFF', 'road-label': '#56676E', 'water-label': '#2F6575'},
   'dark': {'land': '#0E1A1F', 'resid': '#111F25', 'park': '#13261F', 'wood': '#12241D', 'water': '#0B3442', 'waterline': '#11475A',
            'building': '#142328', 'road': '#1E3038', 'casing': '#1E3038', 'major': '#27404A', 'major-casing': '#27404A',
            'motorway': '#2E5562', 'motorway-casing': '#2E5562', 'rail': '#22343B', 'boundary': '#36505A',
            'label': '#B9CDD3', 'label-halo': '#0E1A1F', 'road-label': '#86A0A9', 'water-label': '#7FBACB'},
  },
  'marker': 'tag', 'cluster': 'square',
 },

 'shelet': {
  'title': 'שלט ברור', 'title_en': 'Clear sign',
  'concept': [
   'לסבא ולסבתא, לנהג שעוצר בצד הדרך ולמשפחה עם ילדים ביום שישי: הכול גדול, חד ובולט כמו שלט כשרות בחלון של חנות.',
   'הכשרות היא חותם עגול עם אות (כמו חותמת על תעודה), והסטטוס הוא תווית מלאה בצבע – לא טקסט צבעוני קטן. טקסט בסיס 17px, כפתורים 48px.',
   'מותג בדיו כהה עם צהוב שלט (צהוב דגל חב״ד) רק לבחירה ולהדגשה. גופן אחד – Rubik – עגול, ידידותי וחזק גם במשקל כבד.',
   'מפה ניטרלית כמעט אפורה, כדי שרק החותמות והאשכולות יבלטו. אשכול מראה בטבעת מחולקת אילו כשרויות יש בו.',
  ],
  'fonts': {
   'display': ('Rubik', 'SIL Open Font License 1.1', '"Rubik","DejaVu Sans",sans-serif', 'הכול (כותרות 700–800, טקסט 400–500)', '400 / 500 / 700 / 800 (גופן משתנה)'),
   'body': ('Rubik', 'SIL Open Font License 1.1', '"Rubik","DejaVu Sans",sans-serif', 'אותו גופן', ''),
  },
  'type': {'xs': '13px', 'sm': '14px', 'md': '15.5px', 'base': '17px', 'lg': '19px', 'xl': '25px', 'xxl': '30px'},
  'radius': {'xs': '6px', 'sm': '10px', 'md': '12px', 'lg': '20px', 'pill': '999px', 'marker': '50%'},
  'shadow': {
   'light': {'sh1': '0 0 0 1px rgba(16,18,20,.10),0 2px 6px rgba(16,18,20,.10)', 'sh2': '0 -2px 0 rgba(16,18,20,.06),0 -8px 24px rgba(16,18,20,.12)'},
   'dark': {'sh1': '0 0 0 1px rgba(255,255,255,.08),0 2px 6px rgba(0,0,0,.4)', 'sh2': '0 -8px 24px rgba(0,0,0,.55)'},
  },
  'c': {
   'light': {
    'bg': '#F4F4F2', 'surface': '#FFFFFF', 'surface2': '#F0F0EE', 'line': '#CBCED2',
    'ink': '#101214', 'sub': '#3F4449', 'mut': '#50565C',
    'brand': '#101214', 'brand-on': '#FFFFFF', 'brand-soft': '#FFF4C7', 'brand-ink': '#101214',
    'signal': '#F5C518', 'signal-on': '#101214',
    'band': '#FFF4C7', 'band-ink': '#3D2F00',
    'open': '#12703A', 'soon': '#8F4F00', 'closed': '#B0201A', 'noinfo': '#4E555B',
    'open-bg': '#12703A', 'open-on': '#FFFFFF', 'soon-bg': '#FFE2B8', 'soon-on': '#5C3200', 'noinfo-bg': '#E7E8EA', 'noinfo-on': '#3F4449',
    'k-chabad': '#1E3A8A', 'k-eda': '#9B2C6E', 'k-landa': '#5C3A1E', 'k-products': '#56606B',
    'k-chabad-on': '#FFFFFF', 'k-eda-on': '#FFFFFF', 'k-landa-on': '#FFFFFF', 'k-products-on': '#56606B',
    'k-chabad-ink': '#1E3A8A', 'k-eda-ink': '#8E2765', 'k-landa-ink': '#5C3A1E', 'k-products-ink': '#4B5563',
    'me': '#2B7CFF', 'ring': '#FFFFFF', 'mk-edge': '#2A2D31', 'badge-edge': '#FFFFFF',
   },
   'dark': {
    'bg': '#111214', 'surface': '#1B1D20', 'surface2': '#24272B', 'line': '#3A3E44',
    'ink': '#F4F5F6', 'sub': '#C3C8CE', 'mut': '#A8AEB5',
    'brand': '#F5C518', 'brand-on': '#101214', 'brand-soft': '#3A3214', 'brand-ink': '#FFE07A',
    'signal': '#F5C518', 'signal-on': '#101214',
    'band': '#3A3214', 'band-ink': '#FFE07A',
    'open': '#4ED17F', 'soon': '#F2A541', 'closed': '#FF8F86', 'noinfo': '#B5BBC2',
    'open-bg': '#1F6F40', 'open-on': '#FFFFFF', 'soon-bg': '#5A3A0C', 'soon-on': '#FFD9A3', 'noinfo-bg': '#2E3236', 'noinfo-on': '#D4D8DD',
    'k-chabad': '#3B5BC4', 'k-eda': '#C2448F', 'k-landa': '#8A5A30', 'k-products': '#B0B8C1',
    'k-chabad-on': '#FFFFFF', 'k-eda-on': '#FFFFFF', 'k-landa-on': '#FFFFFF', 'k-products-on': '#B0B8C1',
    'k-chabad-ink': '#A9BBF5', 'k-eda-ink': '#F09ACB', 'k-landa-ink': '#DDB38A', 'k-products-ink': '#B8C0C9',
    'me': '#4C94FF', 'ring': '#F4F5F6', 'mk-edge': '#F4F5F6', 'badge-edge': '#1B1D20',
   },
  },
  'map': {
   'light': {'land': '#F2F2F0', 'resid': '#EDEDEB', 'park': '#E0E8DC', 'wood': '#D8E2D3', 'water': '#CCD7DF', 'waterline': '#B5C4CE',
             'building': '#E6E6E3', 'road': '#FFFFFF', 'casing': '#BDBFC2', 'major': '#FFFFFF', 'major-casing': '#A9ACB0',
             'motorway': '#FFE58A', 'motorway-casing': '#C9A400', 'rail': '#C4C6C9', 'boundary': '#9DA2A7',
             'label': '#1E2124', 'label-halo': '#FFFFFF', 'road-label': '#50565C', 'water-label': '#4A6475'},
   'dark': {'land': '#141517', 'resid': '#17181B', 'park': '#1A231C', 'wood': '#18211A', 'water': '#121E26', 'waterline': '#1B2C38',
            'building': '#1C1E21', 'road': '#2B2E33', 'casing': '#2B2E33', 'major': '#3A3E44', 'major-casing': '#3A3E44',
            'motorway': '#5A4A10', 'motorway-casing': '#5A4A10', 'rail': '#30343A', 'boundary': '#4A4F56',
            'label': '#D9DCDF', 'label-halo': '#141517', 'road-label': '#A0A6AD', 'water-label': '#8AA6B8'},
  },
  'marker': 'seal', 'cluster': 'ring',
 },
}
