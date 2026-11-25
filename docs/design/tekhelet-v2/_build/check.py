import sys, os, itertools
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '_build'))
from tokens import C, MAP
from color import cr, de
def pairs(t):
    c, m = C[t], MAP[t]
    P = [('ink','surface',4.5),('ink','bg',4.5),('ink','surface2',4.5),('sub','surface',4.5),('sub','bg',4.5),('sub','surface2',4.5),
         ('mut','surface',4.5),('mut','bg',4.5),('mut','surface2',4.5),('stone-ink','stone',4.5),('sub','stone',4.5),
         ('brand-ink','surface',4.5),('brand-ink','brand-soft',4.5),('brand-on','brand',4.5),
         ('plaque-ink','plaque',4.5),('plaque-time','plaque',4.5),
         ('open-on','open-plate',4.5),('soon-on','soon-plate',4.5),('open','surface',4.5),('soon','surface',4.5),('closed','surface',4.5),('noinfo','surface',4.5),
         ('doubt','doubt-bg',4.5),('doubt','surface',4.5)]
    for k in ('chabad','eda','landa','products'):
        P.append((f'k-{k}-ink','surface',4.5))
        if k!='products': P.append((f'k-{k}-on',f'k-{k}',4.5))
    out=[(t,a,b,c[a],c[b],cr(c[a],c[b]),n) for a,b,n in P]
    ui=[('mk-edge','m-land',c['mk-edge'],m['land']),('mk-edge','m-park',c['mk-edge'],m['park']),('mk-edge','m-resid',c['mk-edge'],m['resid']),
        ('paint (frame)','mk-edge',c['paint'],c['mk-edge']),('focus','surface',c['focus'],c['surface']),('focus','bg',c['focus'],c['bg']),
        ('brand (selected chip)','surface',c['brand'],c['surface']),
        ('k-products (hollow)','surface',c['k-products'],c['surface']),('open-plate','surface',c['open-plate'],c['surface']),
        ('open step (marker)','m-land',c['open-plate'],m['land']),(('soon step outline (mk-edge)','soon-plate',c['mk-edge'],c['soon-plate']) if t=='light' else ('soon step (marker)','m-land',c['soon-plate'],m['land'])),
        ('me','m-land',c['me'],m['land']),('map label','m-land',m['label'],m['land']),('map label','m-resid',m['label'],m['resid']),
        ('road label','m-road',m['road-label'],m['road']),('water label','m-water',m['water-label'],m['water'])]
    out+=[(t,a,b,ca,cb,cr(ca,cb),3.0) for a,b,ca,cb in ui]
    return out
def sep(t):
    c=C[t]; keys={'chabad':c['k-chabad'],'eda':c['k-eda'],'landa':c['k-landa'],'paint':c['paint'],'me':c['me']}
    return [(t,kind,sorted((de(keys[a],keys[b],kind),a,b) for a,b in itertools.combinations(keys,2))[:3]) for kind in ('normal','deutan','protan','tritan')]
if __name__=='__main__':
    for t in ('light','dark'):
        for r in pairs(t):
            print(('FAIL ' if r[5]<r[6] else '     ')+f'{t} {r[1]} / {r[2]} {r[5]:.2f}')
        for r in sep(t): print(r[0],r[1],[(f'{v:.1f}',a,b) for v,a,b in r[2]])
