const V='v8',SHELL='shell-'+V,RT='rt-'+V,MAX=900;
self.addEventListener('install',e=>{e.waitUntil(caches.open(SHELL).then(c=>c.addAll(['/','/manifest.webmanifest','/icon-192.png','/vendor/fonts.css'])).catch(()=>{}));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==SHELL&&k!==RT).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
async function trim(){const c=await caches.open(RT);const k=await c.keys();for(const r of k.slice(0,Math.max(0,k.length-MAX)))await c.delete(r);}
async function cacheFirst(r,name,lim){const c=await caches.open(name);const hit=await c.match(r,{ignoreSearch:true});if(hit)return hit;try{const res=await fetch(r);if(res.ok){c.put(r,res.clone());if(lim)trim();}return res;}catch(e){return Response.error();}}
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);
if(u.origin===location.origin&&u.pathname.startsWith('/vendor/')){e.respondWith(cacheFirst(r,SHELL,false));return;}
if(r.mode==='navigate'||u.origin===location.origin){const key=r.mode==='navigate'?'/':r;e.respondWith(fetch(r).then(res=>{if(res.ok){const cl=res.clone();caches.open(SHELL).then(c=>c.put(key,cl));}return res;}).catch(()=>caches.match(key,{ignoreSearch:true}).then(m=>m||Response.error())));return;}
if(u.hostname==='raw.githubusercontent.com'){e.respondWith(fetch(r).then(res=>{if(res.ok){const cl=res.clone();caches.open(SHELL).then(c=>c.put(r.url,cl));}return res;}).catch(()=>caches.match(r.url).then(m=>m||Response.error())));return;}
if(u.hostname==='tiles.openfreemap.org'){e.respondWith(caches.open(RT).then(async c=>{const hit=await c.match(r);const net=fetch(r).then(res=>{if(res.ok){c.put(r,res.clone());trim();}return res;}).catch(()=>hit||Response.error());return hit||net;}));}
});
