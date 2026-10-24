// Read-only production verification. No scripts are executed or leads submitted.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const origin='https://www.vdalo.tech';
const inventory=JSON.parse(readFileSync(new URL('../inline-trial-popup-2026-10-24/route-inventory.json',import.meta.url),'utf8'));
const rows=[];let index=0;
async function worker(){
 while(index<inventory.length){
  const item=inventory[index++];let result;
  for(let attempt=1;attempt<=2;attempt++){
   try{
    const response=await fetch(origin+item.route,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(15000)});
    const html=await response.text();
    result={kind:item.kind,route:item.route,status:response.status,url:response.url,offer:html.includes('data-site-trial-offer'),inline:html.includes('data-form-variant="timed-trial"'),popupAssets:/\/(?:v1\/)?trial-offer\.(?:js|css)\?/.test(html),attempt};
    if(response.status<500&&response.status!==429)break;
   }catch(error){result={kind:item.kind,route:item.route,status:0,error:error.name,attempt};}
   await new Promise(resolve=>setTimeout(resolve,500));
  }
  rows.push(result);
  await new Promise(resolve=>setTimeout(resolve,300));
 }
}
await Promise.all([worker(),worker()]);
const assets=[];
for(const file of ['trial-offer.js','trial-offer.css','app.js','clarity-consent.js','clarity-consent.css']){
 const source=execFileSync('git',['show',`63420da:versions/v1/public/${file}`]);
 const expected=createHash('sha256').update(source).digest('hex');
 const response=await fetch(`${origin}/v1/${file}?v=${expected.slice(0,12)}`);
 const actual=createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex');
 assets.push({file,status:response.status,expected,actual,match:expected===actual});
}
rows.sort((a,b)=>a.route.localeCompare(b.route));
const failures=rows.filter(r=>r.status!==200||r.offer!==(r.kind==='ordinary')||r.inline!==(r.kind==='ordinary')||r.popupAssets!==(r.kind==='ordinary'));
const result={origin,release:'63420da',checkedAt:new Date().toISOString(),ordinary:rows.filter(r=>r.kind==='ordinary').length,advertising:rows.filter(r=>r.kind==='campaign').length,failures,assets,rows};
writeFileSync(new URL('./HTTP-RESULTS.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({ordinary:result.ordinary,advertising:result.advertising,failures,assetFailures:assets.filter(a=>a.status!==200||!a.match)}));
if(failures.length||assets.some(a=>a.status!==200||!a.match))process.exitCode=1;
