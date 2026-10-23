import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

// Read-only production check. No contacts or form submissions are sent.
const origin='https://www.vdalo.tech';
const reportDir=new URL('../docs/form-delivery-repair-2026-10-23/',import.meta.url);
const expected=JSON.parse(await readFile(new URL('form-inventory.json',reportDir)));
const pages=[],assets=new Set();let cursor=0;
function formsOf(html){return [...html.matchAll(/<form\b([^>]*)>([\s\S]*?)<\/form>/g)].map(m=>({attributes:m[1],fields:[...new Set([...m[2].matchAll(/<(?:input|select|textarea)\b[^>]*\bname="([^"]+)"/g)].map(f=>f[1]))]}));}
await Promise.all(Array.from({length:4},async()=>{
 while(cursor<expected.length){
  const local=expected[cursor++];
  try{
   const res=await fetch(origin+local.route,{signal:AbortSignal.timeout(20000),cache:'no-store'}),html=await res.text(),forms=formsOf(html);
   for(const m of html.matchAll(/<script\b[^>]*src="([^"]+)"/g))if(m[1].startsWith('/'))assets.add(m[1]);
   pages.push({route:local.route,status:res.status,finalUrl:res.url,formCount:forms.length,expectedFormCount:local.forms.length,fieldsMatch:local.status!==200||JSON.stringify(forms.map(f=>f.fields))===JSON.stringify(local.forms.map(f=>f.fields)),disabledDelivery:forms.some(f=>/data-ready="false"/.test(f.attributes)),robotScript:html.match(/src="([^\"]*robot-funnels\.js[^\"]*)"/)?.[1]||null});
  }catch(error){pages.push({route:local.route,error:error.name});}
 }
}));
pages.sort((a,b)=>a.route.localeCompare(b.route));
const scripts=[];
for(const src of [...assets].sort()){
 try{const response=await fetch(origin+src,{signal:AbortSignal.timeout(20000)});const bytes=Buffer.from(await response.arrayBuffer());scripts.push({src,status:response.status,sha256:createHash('sha256').update(bytes).digest('hex')});}
 catch(error){scripts.push({src,error:error.name});}
}
const summary={routes:pages.length,bad:pages.filter(p=>p.error||p.status>=400||!p.fieldsMatch||p.disabledDelivery),formElements:pages.reduce((n,p)=>n+(p.formCount||0),0),scripts:scripts.length,badScripts:scripts.filter(s=>s.error||s.status>=400),robotVersions:[...new Set(pages.map(p=>p.robotScript).filter(Boolean))]};
await writeFile(new URL('production-form-inventory.json',reportDir),JSON.stringify({checkedAt:new Date().toISOString(),origin,summary,pages,scripts},null,2));
console.log(JSON.stringify(summary));
if(summary.bad.length||summary.badScripts.length)process.exitCode=1;
