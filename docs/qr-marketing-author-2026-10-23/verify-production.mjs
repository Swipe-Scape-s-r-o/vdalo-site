import {readFile,writeFile} from 'node:fs/promises';
const origin='https://www.vdalo.tech';
// Frozen release expectations: first compared with the local ef4eb1a render,
// then retained after restoring the earlier SEO audit's historical artifacts.
const expected=JSON.parse(await readFile(new URL('./production-expected.json',import.meta.url)));
const results=[],errors=[];
let next=0;
async function inspect(row){
 const res=await fetch(origin+row.route,{signal:AbortSignal.timeout(20000)}),html=await res.text();
 const result={route:row.route,status:res.status,url:res.url,title:html.match(/<title>(.*?)<\/title>/s)?.[1],h1:[...html.matchAll(/<h1\b/g)].length,robots:html.match(/<meta name="robots" content="([^"]*)"/)?.[1],canonical:html.match(/<link rel="canonical" href="([^"]*)"/)?.[1],xRobots:res.headers.get('x-robots-tag'),schemaErrors:0};
 for(const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)){try{JSON.parse(m[1]);}catch{result.schemaErrors++;}}
 for(const key of ['status','title','h1','robots','canonical'])if(result[key]!==row[key])errors.push({route:row.route,key,expected:row[key],actual:result[key]});
 if(result.xRobots?.includes('noindex')&&row.robots?.startsWith('index'))errors.push({route:row.route,key:'xRobots',actual:result.xRobots});
 if(result.schemaErrors)errors.push({route:row.route,key:'schemaErrors',actual:result.schemaErrors});
 results.push(result);
}
await Promise.all(Array.from({length:4},async()=>{while(next<expected.length){const row=expected[next++];try{await inspect(row);}catch(e){errors.push({route:row.route,error:String(e)});}}}));
const xmlRes=await fetch(origin+'/sitemap.xml'),xml=await xmlRes.text();
const sitemap={status:xmlRes.status,urls:[...xml.matchAll(/<loc>/g)].length,author:xml.includes(origin+'/authors/kostiantyn-tripailo</loc>'),article:xml.includes(origin+'/blog/qr-kody-dlya-restoranu</loc>')};
if(!sitemap.author||!sitemap.article||sitemap.urls!==91)errors.push({sitemap});
const robotsRes=await fetch(origin+'/robots.txt'),robots=await robotsRes.text();
if(/^Disallow:\s*\/\s*$/m.test(robots))errors.push({robots:'Site disallows all crawling'});
const resources=[];
for(const path of ['/v1/reading-layout.css','/v1/editorial-seo.css','/v1/cases.css','/v1/assets/blog-qr-pillar-natural.jpg']){const res=await fetch(origin+path);resources.push({path,status:res.status,type:res.headers.get('content-type')});await res.body?.cancel();if(res.status!==200)errors.push({resource:path,status:res.status});}
const redirects=[];
for(const path of ['/blog/qr-kody-dlya-restoranu/','/blog/qr-wifi-dlya-gotelyu/']){const res=await fetch(origin+path+'?utm_source=release_qa',{redirect:'manual'});const location=res.headers.get('location');redirects.push({path,status:res.status,location});await res.body?.cancel();if(![301,302,307,308].includes(res.status)||!location?.includes('utm_source=release_qa'))errors.push({redirect:path,status:res.status,location});}
const report={checkedAt:new Date().toISOString(),expectedCommit:'76b3cba822cf79ac247b94c8277a09efeaf22818',routes:results.sort((a,b)=>a.route.localeCompare(b.route)),sitemap,robots:{status:robotsRes.status,text:robots},resources,redirects,errors};
await writeFile(new URL('./production-http.json',import.meta.url),JSON.stringify(report,null,2));
console.log(JSON.stringify({routes:results.length,sitemap,resources,redirects,errors},null,2));
if(errors.length)process.exitCode=1;
