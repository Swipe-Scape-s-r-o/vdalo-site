import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {request} from './seo-staging-review.mjs';
import {articlePractice} from '../versions/v1/article-practice.mjs';
import {getTouristTaxPlace,canCalculateTouristTaxPlace} from '../versions/v1/tourist-tax-data.mjs';
import {calculateTouristTax} from '../versions/v1/tourist-tax.mjs';

const rows=JSON.parse(await readFile(new URL('../docs/seo-staging-2026-10-23/after.json',import.meta.url)));
const pages=rows.filter(r=>!/^\/(?:hotel-|solutions$|integrations$|pricing$|sign-up$|guest-communication$|q|go\/|funnel|\d|k3|tourist-tax\/start)/.test(r.route)&&r.route!=='/');
const cache=new Map();const get=async route=>{if(!cache.has(route))cache.set(route,await request(route));return cache.get(route)};
const errors=[],assets=new Set();let anchors=0,links=0;
for(const row of pages){
 const {html}=await get(row.route);
 if(row.ogImages.length!==1)errors.push(`${row.route}: ${row.ogImages.length} OG images`);
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 const duplicateIds=ids.filter((id,i)=>ids.indexOf(id)!==i);if(duplicateIds.length)errors.push(`${row.route}: duplicate IDs ${duplicateIds}`);
 // Check editorial content, avoiding unrelated legacy menus and modal controls.
 const content=html.match(/<main\b[\s\S]*?<\/main>/)?.[0]||html.match(/<article class="hotel-case"[\s\S]*<\/article>/)?.[0]||'';
 for(const match of content.matchAll(/href="(#[^"]+|\/[^"#]*#[^"]+)"/g)){
  const [pathname,hash]=match[1].split('#');if(pathname&&pathname!==row.route)continue;
  anchors++;if(!ids.includes(decodeURIComponent(hash)))errors.push(`${row.route}: missing anchor ${match[1]}`);
 }
 for(const m of content.matchAll(/href="(\/[^"#?]*)"/g)){
  const r=await get(m[1]);links++;if(r.status>=400)errors.push(`${row.route}: link ${m[1]} HTTP ${r.status}`);
 }
 for(const m of html.matchAll(/<(?:img|link)\b[^>]*(?:src|href)="(\/(?:v1\/)?(?:assets\/[^"?]*|editorial-seo\.css))[^"\s]*"/g))assets.add(m[1]);
}
for(const route of assets){const r=await get(route);if(r.status!==200)errors.push(`${route}: asset HTTP ${r.status}`)}
for(const slug of Object.keys(articlePractice)){
 const {html}=await get(slug);assert.match(html,/id="practice"/);assert.match(html,/href="#practice"/);assert.match(html,/Навчальний приклад із вигаданими даними/);
}
const research=(await get('/cases/booking-widget-study-2118')).html;
assert.doesNotMatch(research,/87%/);assert.match(research,/Первинної таблиці немає/);
const odesa=await get('/tourist-tax/odesa/');assert.equal(odesa.status,200);assert.match(odesa.html,/<meta name="robots" content="noindex,follow"/);assert.equal(canCalculateTouristTaxPlace(getTouristTaxPlace('odesa')),false);
assert.match((await get('/contact')).html,/href="tel:\+380939082254"/);
assert.match((await get('/contact')).html,/href="https:\/\/t.me\/tripailo_ads"/);
assert.doesNotMatch((await get('/tourist-tax/sumy/')).html,/1238-mr\.zip/);
assert.match((await get('/v1/editorial-seo.css')).headers['Content-Type'],/text\/css/);
for(const placeSlug of ['sumy','kolomyya']){
 const result=calculateTouristTax({placeSlug,start:'2026-11-01',days:3,guests:2,category:'domestic'});
 assert.equal(result.state,'VERIFIED_RESULT');assert.equal(result.totalCents,'25941');
}
assert.equal(calculateTouristTax({placeSlug:'odesa',start:'2026-11-01',days:3,guests:2,category:'inbound'}).state,'SOURCE_CONFLICT');
const redirects=[];
for(const slug of ['qr-kody-dlya-goteliv','qr-wifi-dlya-gotelyu','qr-kartka-v-nomer-gotelyu']){
 const path=`/blog/${slug}/?utm_source=seo-qa`,r=await get(path);assert.ok([301,302,307,308].includes(r.status));assert.equal(r.headers.Location,`/blog/${slug}?utm_source=seo-qa`);redirects.push(path);
}
const report={pages:pages.length,anchors,internalLinks:links,assets:assets.size,redirects,practiceArticles:Object.keys(articlePractice).length,taxControls:{sumy:'259.41 UAH',kolomyya:'259.41 UAH',odesa:'SOURCE_CONFLICT; calculator unavailable'},errors};
await writeFile(new URL('../docs/seo-staging-2026-10-23/editorial-checks.json',import.meta.url),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));if(errors.length)process.exitCode=1;
