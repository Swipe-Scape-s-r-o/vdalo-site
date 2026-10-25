(() => {
 const keys=['utm_source','utm_medium','utm_campaign','utm_content','utm_term'];
 const storageKey='vdalo-attribution-v1',lifetime=30*24*60*60*1000,now=()=>Date.now();
 const clean=value=>typeof value==='string'?value.trim().slice(0,150):'';
 const pick=value=>Object.fromEntries(keys.flatMap(key=>{const item=clean(value?.[key]);return item?[[key,item]]:[]}));
 const readCookie=()=>{try{const match=document.cookie.match(/(?:^|;\s*)vdalo_attribution=([^;]+)/);return match?JSON.parse(decodeURIComponent(match[1])):null;}catch{return null;}};
 const writeCookie=value=>{try{document.cookie=`vdalo_attribution=${encodeURIComponent(JSON.stringify(value))}; Max-Age=2592000; Path=/; SameSite=Lax${location.protocol==='https:'?'; Secure':''}`;}catch{}};
 const read=()=>{let saved=null;try{saved=JSON.parse(localStorage.getItem(storageKey)||'null');}catch{}if(!saved)saved=readCookie();if(!saved||typeof saved!=='object'||Number(saved.expires_at)<=now())return null;return saved;};
 const write=value=>{try{localStorage.setItem(storageKey,JSON.stringify(value));}catch{}writeCookie(value);};
 const current=pick(Object.fromEntries(new URLSearchParams(location.search)));
 let record=read();
 if(!record){const timestamp=new Date(now()).toISOString();record={first_touch:current,last_touch:current,first_touch_at:timestamp,latest_touch_at:Object.keys(current).length?timestamp:'',expires_at:now()+lifetime};}
 else if(Object.keys(current).length){record.last_touch=current;record.latest_touch_at=new Date(now()).toISOString();}
 if(!record.first_touch||typeof record.first_touch!=='object')record.first_touch={};
 if(!record.last_touch||typeof record.last_touch!=='object')record.last_touch={};
 record.first_touch=pick(record.first_touch);record.last_touch=pick(record.last_touch);write(record);
 window.vdaloAttribution={get(){const value=read()||record;return {first_touch:pick(value.first_touch),last_touch:pick(value.last_touch),first_touch_at:clean(value.first_touch_at),latest_touch_at:clean(value.latest_touch_at)};}};
})();
