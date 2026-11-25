# Tokens for direction "תכלת ואבן" v2 (S1-4). Source of truth for mock.html, map-style.json, README tables.
C = {
 'light': {
  'bg': '#E9E1D2', 'surface': '#FBF8F2', 'surface2': '#F3EDE2', 'line': '#DDD3C2',
  'stone': '#D9CCB3', 'stone-hi': '#F0E8D8', 'stone-lo': '#B3A07E', 'stone-ink': '#2A2219',
  'ink': '#211B14', 'sub': '#54493B', 'mut': '#665A4A',
  'brand': '#1F5D8C', 'brand-on': '#FFFFFF', 'brand-soft': '#DDE9F3', 'brand-ink': '#1B5280',
  'paint': '#3E7FB8', 'paint-hi': '#7FB0DA',
  'plaque': '#3A3733', 'plaque-ink': '#F1E8D6', 'plaque-time': '#EBC77E',
  'open': '#1E6B3B', 'open-plate': '#1E6B3B', 'open-on': '#FFFFFF',
  'soon': '#8F4E0C', 'soon-plate': '#E8AE50', 'soon-on': '#2B1C04',
  'closed': '#A1281D', 'noinfo': '#5D5345',
  'doubt': '#7E4407', 'doubt-bg': '#F6E6C6',
  'k-chabad': '#D29E1A', 'k-eda': '#7A1F45', 'k-landa': '#4B5A1F', 'k-products': '#5A6068',
  'k-chabad-on': '#1C1500', 'k-eda-on': '#FFFFFF', 'k-landa-on': '#FFFFFF', 'k-products-on': '#5A6068',
  'k-chabad-ink': '#755505', 'k-eda-ink': '#7A1F45', 'k-landa-ink': '#43501B', 'k-products-ink': '#4F5660',
  'me': '#2B7CFF', 'mk-edge': '#2B2318', 'focus': '#1F5D8C',
 },
 'dark': {
  'bg': '#16181C', 'surface': '#1E2126', 'surface2': '#262A30', 'line': '#343841',
  'stone': '#2D3138', 'stone-hi': '#41464F', 'stone-lo': '#0F1114', 'stone-ink': '#ECE6DA',
  'ink': '#ECE6DA', 'sub': '#BAB2A4', 'mut': '#A49C8E',
  'brand': '#8FC2EA', 'brand-on': '#0B2236', 'brand-soft': '#1D3347', 'brand-ink': '#9DCCEF',
  'paint': '#2F6898', 'paint-hi': '#5A92C4',
  'plaque': '#0E0F11', 'plaque-ink': '#E6DDCB', 'plaque-time': '#E9C46A',
  'open': '#66CB8C', 'open-plate': '#5CC486', 'open-on': '#06210F',
  'soon': '#EFA857', 'soon-plate': '#E0A54C', 'soon-on': '#2B1C04',
  'closed': '#FF8F86', 'noinfo': '#ADA597',
  'doubt': '#F2BD6E', 'doubt-bg': '#3A2C14',
  'k-chabad': '#E0B23A', 'k-eda': '#B0436F', 'k-landa': '#64752A', 'k-products': '#AEB5BC',
  'k-chabad-on': '#1C1500', 'k-eda-on': '#FFFFFF', 'k-landa-on': '#FFFFFF', 'k-products-on': '#AEB5BC',
  'k-chabad-ink': '#EBC45E', 'k-eda-ink': '#EF92B5', 'k-landa-ink': '#B9CB78', 'k-products-ink': '#B8BFC6',
  'me': '#4C94FF', 'mk-edge': '#ECE6DA', 'focus': '#8FC2EA',
 },
}
MAP = {
 'light': {'land': '#ECE5D7', 'resid': '#E6DDCC', 'building': '#D9CBB1', 'park': '#D8DCC0', 'wood': '#CAD1AD',
           'water': '#8EBFDF', 'waterline': '#6FA8D2', 'road': '#F9F5EE', 'casing': '#D3C6AD', 'major': '#FFFDF8',
           'major-casing': '#C2B293', 'motorway': '#F3E7CF', 'motorway-casing': '#B39D74', 'rail': '#CDBFA6',
           'boundary': '#AE9E83', 'label': '#3A3126', 'label-halo': '#F6F1E7', 'road-label': '#64584A', 'water-label': '#2A5B84'},
 'dark': {'land': '#191B20', 'resid': '#1D2025', 'building': '#272B32', 'park': '#1C231F', 'wood': '#1A211C',
          'water': '#0F2C46', 'waterline': '#1C4466', 'road': '#2B2F37', 'casing': '#2B2F37', 'major': '#363B44',
          'major-casing': '#363B44', 'motorway': '#40434B', 'motorway-casing': '#40434B', 'rail': '#30343B',
          'boundary': '#4A4F58', 'label': '#D2CBBE', 'label-halo': '#191B20', 'road-label': '#9C9486', 'water-label': '#86B6DA'},
}
TYPE = {'xs': '12px', 'sm': '13.5px', 'md': '15px', 'base': '16px', 'lg': '18px', 'xl': '22px', 'xxl': '28px'}
LH = {'tight': '1.15', 'title': '1.25', 'body': '1.5'}
RADIUS = {'xs': '3px', 'sm': '6px', 'md': '10px', 'lg': '14px'}
SPACE = {'s1': '4px', 's2': '8px', 's3': '12px', 's4': '16px', 's5': '20px', 's6': '24px', 's8': '32px'}
MOTION = {'fast': '150ms', 'base': '200ms', 'slow': '250ms', 'ease': 'cubic-bezier(.2,.7,.2,1)'}
SHADOW = {
 'light': {'sh1': '0 1px 0 rgba(60,45,25,.10),0 3px 10px rgba(60,45,25,.10)', 'sh2': '0 -2px 0 rgba(60,45,25,.06),0 -8px 24px rgba(60,45,25,.16)'},
 'dark': {'sh1': '0 1px 0 rgba(0,0,0,.5),0 3px 10px rgba(0,0,0,.4)', 'sh2': '0 -8px 24px rgba(0,0,0,.55)'},
}
FONTS = {
 'display': ('Suez One', '"Suez One","FreeSerif",serif'),
 'body': ('Assistant', '"Assistant","Liberation Sans",Arial,sans-serif'),
}
