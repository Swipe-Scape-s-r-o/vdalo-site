import fs from 'node:fs/promises';
import {Readable} from 'node:stream';
import {createHash} from 'node:crypto';
process.env.VERCEL='1';
const {default:server}=await import('../server.mjs');
export async function request(route){return new Promise(resolve=>{const req=new Readable({read(){this.push(null)}});Object.assign(req,{method:'GET',url:route,headers:{'accept-encoding':'',host:'www.vdalo.tech'}});let status=200,headers={};server.emit('request',req,{writeHead(s,h={}){status=s;headers=h;return this},end(data=''){resolve({status,headers,html:Buffer.isBuffer(data)?data.toString():String(data)})}})});}
const dir=new URL('../docs/seo-staging-2026-10-23/',import.meta.url);await fs.mkdir(dir,{recursive:true});
const sitemap=await request('/sitemap.xml');const paths=[...sitemap.html.matchAll(/<loc>https:\/\/www.vdalo.tech([^<]*)<\/loc>/g)].map(m=>m[1]);
const protectedPaths=[...paths.filter(p=>p==='/'||/^\/(?:hotel-|solutions$|integrations$|pricing$|sign-up$|guest-communication$)/.test(p)),...['q','q1','q2','q3','q4','q5','q6','q7','q8','q9','qa','qb','qc','qd','go/trial','funnel','55','53','54','50','47','k3','tourist-tax/start'].map(p=>'/'+p)];
const results=[];for(const route of [...new Set([...paths,...protectedPaths,'/authors/kostiantyn-tripailo','/tourist-tax/odesa/'])]){const r=await request(route);results.push({route,status:r.status,hash:createHash('sha256').update(r.html).digest('hex'),title:r.html.match(/<title>(.*?)<\/title>/s)?.[1],canonical:r.html.match(/<link rel="canonical" href="([^"]*)"/)?.[1],h1:[...r.html.matchAll(/<h1\b/g)].length,robots:r.html.match(/<meta name="robots" content="([^"]*)"/)?.[1],ogImages:[...r.html.matchAll(/<meta property="og:image" content="([^"]*)"/g)].map(m=>m[1]),schemaErrors:[...r.html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].filter(m=>{try{JSON.parse(m[1]);return false}catch{return true}}).length});}
const mode=process.argv[2]||'after';await fs.writeFile(new URL(mode+'.json',dir),JSON.stringify(results,null,2));
if(mode==='baseline'){console.log('Baseline saved:',results.length,'protected:',protectedPaths.length);process.exit(0);}
const baseline=JSON.parse(await fs.readFile(new URL('baseline.json',dir)));const changes=protectedPaths.filter(p=>results.find(r=>r.route===p)?.hash!==baseline.find(r=>r.route===p)?.hash);const bad=results.filter(r=>r.status!==200||r.h1!==1||r.schemaErrors);
console.log(JSON.stringify({routes:results.length,protected:protectedPaths.length,protectedChanges:changes,changed:results.filter(r=>r.hash!==baseline.find(b=>b.route===r.route)?.hash).map(r=>r.route),bad},null,2));
if(changes.length||bad.length)process.exitCode=1;
