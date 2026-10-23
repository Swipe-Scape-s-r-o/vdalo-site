// Production GET/HEAD checks only. Never submits a form or creates records.
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {elements,inner,textOf} from '../versions/v1/content-revisions/html-fragments.mjs';
const root=new URL('../docs/content-package-2026-10-23/release-review/',import.meta.url);
const expected=JSON.parse(readFileSync(new URL('expectations.json',root)));
const origin='https://www.vdalo.tech';
const output={checkedAt:new Date().toISOString(),pages:[],resources:[],redirects:[],policy:[],unmodifiedRoutes:[]};
const failures=[];const resources=new Set();
async function request(url,options={}){return fetch(url,{signal:AbortSignal.timeout(20000),redirect:'manual',...options});}
for(let start=0;start<expected.length;start+=4){
 await Promise.all(expected.slice(start,start+4).map(async e=>{
  const response=await request(origin+e.route),html=await response.text(),nodes=elements(html);
  const meta=key=>nodes.filter(n=>n.tag==='meta'&&(n.attrs.name===key||n.attrs.property===key)).map(n=>n.attrs.content);
  const row={route:e.route,status:response.status,title:textOf(inner(html,nodes.find(n=>n.tag==='title'))),h1:nodes.filter(n=>n.tag==='h1').map(n=>textOf(inner(html,n))),description:meta('description'),robots:meta('robots'),canonical:nodes.filter(n=>n.tag==='link'&&n.attrs.rel==='canonical').map(n=>n.attrs.href),xRobotsTag:response.headers.get('x-robots-tag'),preparedCss:nodes.find(n=>n.tag==='link'&&n.attrs.href?.includes('prepared-content.css'))?.attrs.href,errors:[]};
  if(row.status!==200)row.errors.push('status');
  if(row.title!==e.title)row.errors.push('title');
  if(JSON.stringify(row.description)!==JSON.stringify([e.description]))row.errors.push('description');
  if(JSON.stringify(row.robots)!==JSON.stringify([e.robots]))row.errors.push('robots');
  if(JSON.stringify(row.canonical)!==JSON.stringify([e.canonical]))row.errors.push('canonical');
  if(JSON.stringify(row.h1)!==JSON.stringify(e.h1))row.errors.push('h1');
  if(!row.preparedCss)row.errors.push('revision missing');
  if(row.xRobotsTag?.includes('noindex')&&!e.robots.includes('noindex'))row.errors.push('unexpected HTTP noindex');
  for(const node of nodes){
   const address=['img','source','video','script'].includes(node.tag)?node.attrs.src:node.tag==='link'&&node.attrs.rel==='stylesheet'?node.attrs.href:null;
   if(!address)continue;const url=new URL(address,origin+e.route);if(url.origin===origin)resources.add(url.href);
  }
  output.pages.push(row);failures.push(...row.errors.map(error=>`${e.route}: ${error}`));
 }));
}
const lazyFile=new URL('production-lazy-image-urls.json',root);
if(existsSync(lazyFile))for(const address of JSON.parse(readFileSync(lazyFile))){
 const url=new URL(address,origin);if(url.origin===origin)resources.add(url.href);
}
for(let start=0,urls=[...resources];start<urls.length;start+=4){
 await Promise.all(urls.slice(start,start+4).map(async url=>{
  const response=await request(url,{method:'HEAD'});const row={url,status:response.status,type:response.headers.get('content-type')};output.resources.push(row);if(response.status!==200)failures.push(`Resource ${response.status}: ${url}`);
 }));
}
for(const path of ['/blog/qr-wifi-dlya-gotelyu/','/blog/qr-kody-dlya-goteliv/','/blog/qr-kartka-v-nomer-gotelyu/']){
 const response=await request(origin+path+'?utm_source=qa_content_release&utm_medium=check');
 const location=response.headers.get('location');const expectedLocation=path.slice(0,-1)+'?utm_source=qa_content_release&utm_medium=check';
 const row={path,status:response.status,location};output.redirects.push(row);
 if(response.status!==308||new URL(location,origin).href!==origin+expectedLocation)failures.push(`Redirect/UTM: ${path}`);
}
for(const path of ['/robots.txt','/sitemap.xml']){
 const response=await request(origin+path),text=await response.text();const row={path,status:response.status};
 if(path==='/robots.txt')row.blocksEverything=/Disallow:\s*\/\s*(?:\r?\n|$)/.test(text);
 else {row.updatedRoutesListed=expected.filter(e=>!e.robots.includes('noindex')).every(e=>text.includes(e.canonical));row.stagingUrls=text.includes('https://staging.vdalo.tech');}
 output.policy.push(row);if(response.status!==200||row.blocksEverything||row.stagingUrls||row.updatedRoutesListed===false)failures.push(`Policy: ${path}`);
}
const excluded=Object.keys(JSON.parse(readFileSync(new URL('../BASELINE_EXCLUDED_ROUTES.json',root))));
const retained=[...new Set([...excluded,'/q','/go','/k1','/k2','/k3','/k4','/k5','/47'])];
for(let start=0;start<retained.length;start+=4){
 await Promise.all(retained.slice(start,start+4).map(async route=>{
  const response=await request(origin+route),html=await response.text();
  const row={route,status:response.status,location:response.headers.get('location'),preparedRevision:html.includes('/v1/prepared-content.css')};
  output.unmodifiedRoutes.push(row);if(response.status<200||response.status>=400||row.preparedRevision)failures.push(`Retained route: ${route} (${response.status})`);
 }));
}
output.pages.sort((a,b)=>a.route.localeCompare(b.route));output.failures=failures;
writeFileSync(new URL('production-http.json',root),JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({pages:output.pages.length,resources:output.resources.length,redirects:output.redirects.length,retainedRoutes:output.unmodifiedRoutes.length,failures},null,2));
if(failures.length)process.exitCode=1;
