import fs from 'fs';
const R='/home/claude/kosher-anash/';
const m = {}; new Function('M', fs.readFileSync(R+'src/logic.js','utf8') + '\nM.statusAt=statusAt;M.candles=candles;M.friRanges=friRanges;')(m);
const P = JSON.parse(fs.readFileSync(R+'data/places.json','utf8'));
const CITY = JSON.parse(fs.readFileSync(R+'data/cities.json','utf8'));
const rad=x=>x*Math.PI/180;
const km=(a,b)=>{const dLa=rad(b.lat-a.lat),dLo=rad(b.lng-a.lng);const x=Math.sin(dLa/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLo/2)**2;return 12742*Math.asin(Math.sqrt(x));};
const cityLL=c=>CITY[c]?{lat:CITY[c][0],lng:CITY[c][1]}:null;
const exact=p=>!!(p.g&&p.g.loc); const LLof=p=>exact(p)?p.g.loc:cityLL(p.c);
const now = new Date(2026,10,27,12,30); // Friday 27.11.2026 12:30 Israel wall clock
const city='צפת', c0=cityLL(city);
let nOpen=0; for (const p of P) if (p.k==='מסעדה' && /[ys]/.test(m.statusAt(p,now).s)) nOpen++;
const out=[];
for (const p of P){ if(!p.k.startsWith('מסעדה')) continue;
  if (p.c!==city){const ll=LLof(p); if(!ll||km(c0,ll)>12) continue;}
  const st=m.statusAt(p,now); if(st.s==='n'||st.s==='x') continue;
  out.push({p,st,d:km(c0,LLof(p))});}
out.sort((a,b)=>a.st.r-b.st.r||a.d-b.d||a.p.n.localeCompare(b.p.n,'he'));
const pick=p=>({u:p.u,n:p.n,s:p.s,c:p.c,h:p.h,hc:p.hc,t:p.t,f:p.f,fri:p.fri,phone:(p.g&&p.g.phone)||p.p||'',exact:exact(p),prec:p.g&&p.g.prec,loc:LLof(p),week:p.g&&p.g.week,chk:p.g&&p.g.chk});
const all = P.filter(p=>{const ll=LLof(p);return ll&&km(c0,ll)<=12;}).map(p=>({...pick(p),st:m.statusAt(p,now)}));
const res={now:'יום שישי, 27.11.2026, 12:30 (שעון ישראל)',candles:m.candles(city,c0,new Date(2026,10,27)),nOpen,count:out.length,
 rows:out.map(r=>({...pick(r.p),st:r.st,inCity:r.p.c===city})), all};
fs.writeFileSync(R+'docs/design/_build/mockdata.json',JSON.stringify(res,null,1));
console.log(res.candles,nOpen,out.length,out.filter(r=>r.p.c!==city).map(r=>r.p.n+' '+r.p.c+' '+r.st.t));
console.log(out.slice(0,12).map(r=>r.p.n+' | '+r.st.t+' | '+r.p.hc).join('\n'));
