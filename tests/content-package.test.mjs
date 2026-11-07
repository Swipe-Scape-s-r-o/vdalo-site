import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {preparedPages,applyPreparedContent,getPreparedPage,getRevisionDate} from '../versions/v1/content-revisions/content.mjs';
import {renderRouteForReview} from '../scripts/review-render.mjs';
import {elements,inner,hasClass,textOf,decodeText} from '../versions/v1/content-revisions/html-fragments.mjs';
import {formContract,portableHtmlHash} from '../versions/v1/content-revisions/form-contract.mjs';
import {renderArticleMarkdown} from '../versions/v1/article-markdown.mjs';
import {renderTrialOffer} from '../versions/v1/trial-offer.mjs';
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
  // The shared invitation now contains its own contact form. Keep every
  // original page form contract byte-for-byte outside this explicit addition.
  const withoutOffer=html.replace(renderTrialOffer(),'');
  if(page.route==='/tourist-tax/odesa/'){
   const odesaForm=elements(withoutOffer).find(node=>node.tag==='form'&&node.attrs.id==='tourist-tax-calculator');
   assert.ok(odesaForm,'released Odesa calculation page should expose its date-aware calculator');
   assert.equal(odesaForm.attrs.action,'/api/tourist-tax/calculate');
   for(const name of ['start','days','domesticGuests','inboundGuests','exemption'])assert.ok(elements(withoutOffer).some(node=>node.attrs.name===name),`Odesa calculator should retain ${name}`);
   assert.equal(formContract(withoutOffer).length,1,'Odesa now has one intentionally added calculator form');
   assert.deepEqual(formContract(withoutOffer.replace(/<form class="tt-calc" id="tourist-tax-calculator"[\s\S]*?<\/form>/,'')),baseline[page.route],page.route);
  }else assert.deepEqual(formContract(withoutOffer),baseline[page.route],page.route);
 }
});

const reviewedProductRoutes=new Set(['/hotel-direct-booking','/hotel-finance','/hotel-channel-manager','/hotel-revenue-management','/hotel-guest-profile','/hotel-housekeeping','/hotel-access-control','/hotel-pms-modules','/hotel-ai-assistant','/hotel-guest-app','/hotel-pms-migration','/hotel-site-builder','/hotel-multi-property','/hotel-energy-management','/hotel-prro','/hotel-events','/solutions','/integrations','/hotel-check-in','/hotel-operations','/guest-communication']);

test('unrevised pages retain their content apart from approved metadata and calendar link',async()=>{
 assert.equal(Object.keys(unchanged).length,36);
 assert.equal([...reviewedProductRoutes].filter(route=>route in unchanged).length,21);
 for(const [route,hash] of Object.entries(unchanged)){
  if(reviewedProductRoutes.has(route))continue;
  const {html}=await rendered(route);
  // This release intentionally adds only these links and the integration-page
  // bridge to the old chrome; continue comparing every other byte to the baseline.
  let previousChrome=html
   // Header navigation is deliberately updated for the requested simpler menu.
   .replace(/<header class="header">[\s\S]*?<\/header>/,'')
   // Approved shared invitation is outside all original page content/forms.
   .replace(renderTrialOffer(),'')
   .replace(/<link rel="stylesheet" href="\/v1\/trial-offer\.css\?v=[a-f0-9]{12}"><script src="\/v1\/trial-offer\.js\?v=[a-f0-9]{12}" defer><\/script>/g,'')
   // Consent assets now use content hashes. Keep the historical fixture's
   // version token while continuing to compare every other markup byte.
   .replace(/(clarity-consent\.(?:css|js)\?v=)[a-f0-9]{12}\b/g,(_,prefix)=>prefix+'3')
   .replace(/<li class="nav-item nav-item-level-2"><a href="\/partners">Партнери та інтегратори<\/a><\/li>/g,'')
   .replace(/<a href="\/partners">Партнери та інтегратори<\/a>/g,'')
   .replace(/<section class="seo-section partner-integration-bridge"[^>]*>[\s\S]*?<\/section>/g,'');
  // The current content pass adds a practical checklist to feature pages.
  previousChrome=previousChrome.replace(/<section class="seo-section"><div class="seo-content"><p class="eyebrow">ПРАКТИЧНИЙ ЧЕКЛІСТ<\/p>[\s\S]*?<\/section>/g,'');
  if(route==='/hotel-booking-calendar'){
   const approvedLink='<p>Якщо внутрішня доступність відрізняється від каналу, скористайтеся <a href="/blog/pms-booking-rizna-dostupnist">інструкцією зі звірки PMS і Booking.com</a>.</p>';
   assert.ok(previousChrome.includes(approvedLink),route);
   assert.equal(previousChrome.split(approvedLink).length,2,route);
   previousChrome=previousChrome.replace(approvedLink,'');
  }
  // The short campaign titles are intentional; every other byte remains checked.
  const campaignTitles={
   '/q6':['Бронювання в зошиті та месенджерах | VDALO','Бронювання в зошиті, а заявки губляться у Viber та Instagram? | VDALO'],
   '/qc':['Гість знайшов готель, але не забронював? | VDALO','Гість знайшов вас на картах, але не зміг забронювати? | VDALO'],
  };
  if(route in campaignTitles){
   const [current,old]=campaignTitles[route];
   for(const [open,close] of [['<title>','</title>'],['<meta property="og:title" content="','">'],['<meta name="twitter:title" content="','">']]){
    assert.ok(previousChrome.includes(`${open}${current}${close}`),route);
    previousChrome=previousChrome.replace(`${open}${current}${close}`,`${open}${old}${close}`);
   }
  }
  assert.equal(portableHtmlHash(previousChrome),hash.portableSha256,route);
  assert.equal(applyPreparedContent(html,route),html,route);
 }
});

test('reviewed product pages render with metadata and structured data',async()=>{
 for(const route of reviewedProductRoutes){
  const {status,html}=await rendered(route);
  assert.equal(status,200,route);
  const nodes=elements(html);
  assert.equal(nodes.filter(node=>node.tag==='h1').length,1,route);
  assert.deepEqual(nodes.filter(node=>node.tag==='link'&&node.attrs.rel==='canonical').map(node=>node.attrs.href),[`https://www.vdalo.tech${route}`],route);
  assert.ok(nodes.some(node=>node.tag==='meta'&&node.attrs.name==='description'&&node.attrs.content),route);
  const schemas=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  assert.ok(schemas.length,route);for(const item of schemas)JSON.parse(item[1]);
  assert.ok(!html.includes('\u2014'),route);
 }
});

test('check-in metadata describes the Diia integration as in development',async()=>{
 const {html}=await rendered('/hotel-check-in');
 const descriptions=meta(html,'description');
 assert.equal(descriptions.length,1);
 assert.match(descriptions[0],/Дією перебуває у розробці/);
 const graph=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  .flatMap(match=>{const value=JSON.parse(match[1]);return value['@graph']??[value];});
 const page=graph.find(node=>node['@id']==='https://www.vdalo.tech/hotel-check-in#webpage');
 assert.match(page?.description??'',/Дією перебуває у розробці/);
});

test('article schema, author, visible dates and real publication dates agree',async()=>{
 for(const page of preparedPages.filter(p=>/^\/(blog|cases)\//.test(p.route))){
  const {html}=await rendered(page.route);
  const graphs=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(m=>{const v=JSON.parse(m[1]);return v['@graph']??[v];});
  const article=graphs.find(n=>['Article','BlogPosting'].includes(n['@type']));
  assert.ok(article,page.route);
  assert.equal(article.headline,page.h1,page.route);
  assert.equal(article.description,page.description,page.route);
  const expectedModified=getRevisionDate(page.route);
  assert.equal(article.dateModified,expectedModified,page.route);
  assert.match(html,new RegExp(`<time datetime="${expectedModified}">Оновлено`),page.route);
  const expectedAuthor=page.route.includes('qr-kody-dlya-restoranu')?'kostiantyn-tripailo':'oleh-stepeniev';
  assert.match(article.author.url,new RegExp(`${expectedAuthor}$`));
  assert.ok(html.includes(`href="/authors/${expectedAuthor}"`),`${page.route}: visible author link should match Article schema`);
  if(page.route.startsWith('/cases/'))assert.equal(article.datePublished,undefined);
 }
 const first=await rendered('/blog/channel-manager-ical-gotelyu');
 assert.match(first.html,/"datePublished":"2026-10-09"/);
 assert.match(first.html,/"dateModified":"2026-11-06"/);
 const tax=await rendered('/blog/turystychnyi-zbir-gotel-ukraina');
 assert.match(tax.html,/"dateModified":"2026-10-23"/);
 const revisedCase=await rendered('/cases/guest-services-glamping');
 assert.match(revisedCase.html,/"dateModified":"2026-11-06"/);
 const qr=await rendered('/blog/qr-wifi-dlya-gotelyu');
 assert.match(qr.html,/"datePublished":"2026-10-15"/);
});

test('revised case reading times match the prepared content',async()=>{
 for(const page of preparedPages.filter(page=>page.route.startsWith('/cases/'))){
  const {html}=await rendered(page.route);
  const duration=elements(html).find(node=>hasClass(node,'reader-duration'));
  assert.ok(duration,`${page.route}: missing reading time`);
  assert.equal(textOf(inner(html,duration)),`${page.minutes} хв читання`,page.route);
 }
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
 const css=readFileSync(new URL('../versions/v1/public/prepared-content.css',import.meta.url),'utf8');
 // The reading layout also uses this pale surface: keep its inherited ink dark.
 assert.match(css,/\.prepared-copy pre\{[^}]*background:#f5eef3;color:#39233e/);
 assert.match(css,/\.prepared-copy pre>code\{color:inherit;background:transparent\}/);
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
  // Prepared page revisions store their complete source in `markdown`; the
  // `sections` array is intentionally empty for these Markdown-backed pages.
  const heading='## Контрольна арифметика за чотири людино-доби';
  const start=page.markdown.indexOf(heading);
  if(start<0)continue;
  const remainder=page.markdown.slice(start+heading.length).replace(/^\s*\n/,'');
  const section=remainder.split(/^## /m,1)[0];
  for(const line of section.split('\n')){
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
