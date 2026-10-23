import {Readable} from 'node:stream';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
process.env.VERCEL='1';
const {default:server}=await import('../server.mjs');
const previous=JSON.parse(await readFile(new URL('../docs/qr-marketing-author-2026-10-23/production-expected.json',import.meta.url)));
const routes=[...new Set([...previous.map(r=>r.route),'/go','/go/trial','/go/index.html','/k/index.html','/k','/k1','/k2','/k3','/k4','/k5',...Array.from({length:59},(_,i)=>'/'+(i+1))])];
async function get(route){return new Promise(resolve=>{const req=new Readable({read(){this.push(null)}});Object.assign(req,{method:'GET',url:route,headers:{host:'localhost'}});let status;server.emit('request',req,{writeHead(s){status=s;},end(html=''){resolve({status,html:String(html)})}});});}
const pages=[];
for(const route of routes){const {status,html}=await get(route);const forms=[...html.matchAll(/<form\b([^>]*)>([\s\S]*?)<\/form>/g)].map(m=>({attributes:m[1],fields:[...new Set([...m[2].matchAll(/<(?:input|select|textarea)\b[^>]*\bname="([^"]+)"/g)].map(f=>f[1]))]}));pages.push({route,status,forms});}
const target=new URL('../docs/form-delivery-repair-2026-10-23/',import.meta.url);await mkdir(target,{recursive:true});
await writeFile(new URL('form-inventory.json',target),JSON.stringify(pages,null,2));
console.log(JSON.stringify({routes:pages.length,pagesWithForms:pages.filter(p=>p.forms.length).length,forms:pages.reduce((n,p)=>n+p.forms.length,0),bad:pages.filter(p=>p.status>=400).map(p=>({route:p.route,status:p.status}))}));
