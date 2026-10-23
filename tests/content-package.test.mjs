import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {preparedPages,applyPreparedContent,getPreparedPage} from '../versions/v1/content-revisions/content.mjs';
import {renderRouteForReview} from '../scripts/review-render.mjs';
import {elements,inner,hasClass,textOf,decodeText} from '../versions/v1/content-revisions/html-fragments.mjs';
import {formContract,portableHtmlHash} from '../versions/v1/content-revisions/form-contract.mjs';
import {renderArticleMarkdown} from '../versions/v1/article-markdown.mjs';
const baseline=JSON.parse(readFileSync(new URL('../docs/content-package-2026-10-23/BASELINE_FORM_CONTRACTS.json',import.meta.url)));
const unchanged=JSON.parse(readFileSync(new URL('../docs/content-package-2026-10-23/BASELINE_EXCLUDED_ROUTES.json',import.meta.url)));
const cache=new Map();
const rendered=async route=>{if(!cache.has(route))cache.set(route,await renderRouteForReview(route));return cache.get(route);};
const meta=(html,key)=>elements(html).filter(n=>n.tag==='meta'&&(n.attrs.name===key||n.attrs.property===key)).map(n=>n.attrs.content);

test('all 70 complete revisions render with one H1, matching metadata and preserved index policy',async()=>{
 assert.equal(preparedPages.length,70);
 assert.equal(new Set(preparedPages.map(p=>p.title)).size,70);
 assert.equal(new Set(preparedPages.map(p=>p.description)).size,70);
 for(const page of preparedPages){
  const {html,status}=await rendered(page.route),nodes=elements(html);
  assert.equal(status,200,page.route);
  assert.equal(nodes.filter(n=>n.tag==='h1').length,1,page.route);
  assert.deepEqual(meta(html,'description'),[page.description],page.route);
  assert.deepEqual(meta(html,'og:title'),[page.ogTitle],page.route);
  assert.deepEqual(meta(html,'robots'),[page.robots],page.route);
  assert.deepEqual(nodes.filter(n=>n.tag==='link'&&n.attrs.rel==='canonical').map(n=>n.attrs.href),[page.canonical],page.route);
  assert.equal(textOf(inner(html,nodes.find(n=>n.tag==='title'))),page.title,page.route);
  assert.match(html,/prepared-content\.css/);
  assert.doesNotMatch(textOf(html),/КІНЕЦЬ ПУБЛІЧНОГО ТЕКСТУ|ПЕРЕД ПУБЛІКАЦІЄЮ|РЕДАКТОРСЬКІ ПРИМІТКИ|ЩО ДОПОВНЕНО ПОВТОРНО/);
 }
});

test('every existing form preserves its action, fields, required constraints and submit controls',async()=>{
 for(const page of preparedPages){
  const {html}=await rendered(page.route);
  assert.deepEqual(formContract(html),baseline[page.route],page.route);
 }
});

test('23 deferred product pages and all 13 new funnels retain their complete HTML across platforms',async()=>{
 assert.equal(Object.keys(unchanged).length,36);
 for(const [route,hash] of Object.entries(unchanged)){
  const {html}=await rendered(route);
  assert.equal(portableHtmlHash(html),hash.portableSha256,route);
  assert.equal(applyPreparedContent(html,route),html,route);
 }
});

test('article schema, author, visible dates and real publication dates agree',async()=>{
 for(const page of preparedPages.filter(p=>/^\/(blog|cases)\//.test(p.route))){
  const {html}=await rendered(page.route);
  const graphs=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(m=>{const v=JSON.parse(m[1]);return v['@graph']??[v];});
  const article=graphs.find(n=>['Article','BlogPosting'].includes(n['@type']));
  assert.ok(article,page.route);
  assert.equal(article.headline,page.h1,page.route);
  assert.equal(article.description,page.description,page.route);
  assert.equal(article.dateModified,'2026-10-23',page.route);
  if(page.route.includes('qr-kody-dlya-restoranu'))assert.match(article.author.url,/kostiantyn-tripailo$/);
  else assert.match(article.author.url,/oleh-stepeniev$/);
  if(page.route.startsWith('/cases/'))assert.equal(article.datePublished,undefined);
 }
 const first=await rendered('/blog/channel-manager-ical-gotelyu');
 assert.match(first.html,/"datePublished":"2026-10-09"/);
 const qr=await rendered('/blog/qr-wifi-dlya-gotelyu');
 assert.match(qr.html,/"datePublished":"2026-10-15"/);
});

test('revised card headlines and author profile identity links stay current',async()=>{
 for(const route of ['/blog','/authors/oleh-stepeniev','/authors/kostiantyn-tripailo']){
  const {html}=await rendered(route);
  for(const node of elements(html).filter(n=>n.tag==='a'&&(hasClass(n,'blog-featured')||hasClass(n,'author-article-card')))){
   const page=getPreparedPage(node.attrs.href);if(!page)continue;
   const title=elements(inner(html,node)).find(n=>n.tag==='strong');
   assert.equal(textOf(inner(inner(html,node),title)),page.h1,`${route} ${page.route}`);
  }
 }
 const profile=await rendered('/authors/kostiantyn-tripailo');
 assert.match(profile.html,/href="https:\/\/ministrysale.com\/kostiantyn-tripailo"/);
 assert.doesNotMatch(profile.html,/rel="[^"]*(?:nofollow|sponsored)[^"]*"/);
 const cases=await rendered('/cases');assert.doesNotMatch(cases.html,/case-card-metric/);
});

test('internal links and published section anchors resolve after copy replacement',async()=>{
 const failures=[];
 for(const page of preparedPages){
  const {html}=await rendered(page.route);
  const ids=elements(html).map(n=>n.attrs.id).filter(Boolean);
  const duplicates=ids.filter((id,i)=>ids.indexOf(id)!==i);
  if(duplicates.length)failures.push(`${page.route}: duplicate IDs ${[...new Set(duplicates)].join(',')}`);
  for(const node of elements(html).filter(n=>n.tag==='a'&&n.attrs.href)){
   let url;try{url=new URL(node.attrs.href,'https://www.vdalo.tech'+page.route);}catch{continue;}
   if(url.origin!=='https://www.vdalo.tech')continue;
   let route=url.pathname;let response=await rendered(route);
   for(let i=0;i<4&&response.status>=300&&response.status<400;i++){
    const destination=new URL(response.headers.Location??response.headers.location,url);
    route=destination.pathname;response=await rendered(route);
   }
   if(response.status!==200){failures.push(`${page.route}: ${node.attrs.href} (${response.status})`);continue;}
   const hash=decodeURIComponent(url.hash.slice(1));
   if(hash&&!elements(response.html).some(n=>n.attrs.id===hash))failures.push(`${page.route}: missing ${node.attrs.href}`);
  }
 }
 assert.deepEqual([...new Set(failures)],[]);
});

test('responsive tables, Wi-Fi payload, consent settings and unavailable email states survive',async()=>{
 const wifi=await rendered('/blog/qr-wifi-dlya-gotelyu');assert.match(wifi.html,/<pre><code>WIFI:/);
 const privacy=await rendered('/privacy');assert.match(privacy.html,/<button id="cookie-preferences" type="button" data-open-cookie-settings>/);
 const checklist=await rendered('/tools/pms-checklist/');assert.match(checklist.html,/Надсилання email-звіту наразі недоступне/);assert.match(checklist.html,/data-email-ready="false"/);
 const html=renderArticleMarkdown('## Секція\n\n[Телефон](tel:+380939082254)\n\nhttps://example.com/a\n\n## Секція\n\n<script>alert(1)</script>').html;
 assert.match(html,/href="tel:\+380939082254"/);assert.match(html,/id="секція-2"/);assert.match(html,/href="https:\/\/example.com\/a"/);assert.doesNotMatch(html,/<script>/);
 assert.equal(applyPreparedContent('<h1>Product</h1>','/solutions'),'<h1>Product</h1>');
});

test('all local four-person-day examples have exact products and independent half-up rounding',()=>{
 let checked=0;
 const milli=value=>{
  const [whole,fraction='']=value.replace(/\s/g,'').replace(',','.').split('.');
  const scale=10n**BigInt(fraction.length);
  const numerator=BigInt(whole+fraction)*1000n;
  assert.equal(numerator%scale,0n,`Example needs finer precision: ${value}`);
  return numerator/scale;
 };
 for(const page of preparedPages.filter(p=>/^\/tourist-tax\/[^/]+\/$/.test(p.route))){
  const section=page.sections.find(s=>s.title==='Контрольна арифметика за чотири людино-доби');
  if(!section)continue;
  for(const line of section.markdown.split('\n')){
   const cells=line.split('|').slice(1,-1).map(s=>s.trim());
   if(cells.length!==4||!/^\d+(?:,\d+)?%$/.test(cells[1]))continue;
   const rateMilli=milli(cells[1].replace('%',''));
   const exactMilli=8647n*4n*rateMilli/100n;
   assert.equal(milli(cells[2]),exactMilli,`${page.route} ${line}`);
   const roundedCents=(exactMilli+5n)/10n;
   assert.equal(milli(cells[3])/10n,roundedCents,`${page.route} ${line}`);
   checked++;
  }
 }
 assert.equal(checked,55);
});

test('four established alias addresses show the revised canonical content',async()=>{
 for(const route of ['/v1/privacy','/blog/qr-wifi-dlya-gotelyu/','/blog/qr-kody-dlya-goteliv/','/blog/qr-kartka-v-nomer-gotelyu/']){
  let {html,status,headers}=await rendered(route);
  const canonical=route==='/v1/privacy'?'/privacy':route.slice(0,-1);
  if(status===308){
   assert.equal(headers.Location,canonical,route);
   const campaign=await rendered(route+'?utm_source=content-review');
   assert.equal(campaign.headers.Location,canonical+'?utm_source=content-review');
   ({html,status}=await rendered(canonical));
  }
  assert.equal(status,200,route);
  assert.deepEqual(meta(html,'description'),[getPreparedPage(canonical).description],route);
  assert.match(html,/prepared-content\.css/);
 }
});
