import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {seoRoutes,renderSeoPage} from '../versions/v1/seo-pages.mjs';
import {qrArticles} from '../versions/v1/qr-articles.mjs';
import {renderSecondPassArticle} from '../versions/v1/article-second-pass.mjs';
import {overbookingArticles} from '../versions/v1/overbooking-articles.mjs';
import {touristTaxCityRoutes,canIndexTouristTaxPlace,getTouristTaxPlace} from '../versions/v1/tourist-tax-data.mjs';
import {renderTouristTaxCity} from '../versions/v1/tourist-tax.mjs';
import {renderRouteForReview} from '../scripts/review-render.mjs';
import {getPreparedPage,preparedPages} from '../versions/v1/content-revisions/content.mjs';

const internalHrefs=html=>[...html.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)].map(match=>match[1]).filter(href=>href.startsWith('/')||/^[a-z][a-z0-9-]*$/.test(href)).map(href=>href.startsWith('/')?href:'/'+href);

test('homepage qualifies document scanning and keeps minibar status aligned with the feature page',async()=>{
 const home=await renderRouteForReview('/');
 const features=await renderRouteForReview('/hotel-housekeeping');
 assert.equal(home.status,200);
 assert.equal(features.status,200);
 assert.match(home.html,/Мінібар тестується в бета-режимі/);
 assert.match(features.html,/Мінібар із прив’язкою до проживання/);
 assert.doesNotMatch(home.html,/Розширений облік пральні, мінібару й (?:запасів|витратних матеріалів) - у розробці/);
 assert.match(home.html,/Доступність зчитування документів уточнюйте для свого об’єкта/);
});

test('solutions hero leads to feature statuses and supports a pricing comparison',async()=>{
 const {status,html}=await renderRouteForReview('/solutions');
 assert.equal(status,200);
 const hero=html.match(/<section class="seo-hero">[\s\S]*?<\/section>/)?.[0]??'';
 assert.match(hero,/<a class="seo-secondary" href="\/hotel-pms-modules">Переглянути статуси функцій/);
 assert.doesNotMatch(hero,/<a class="seo-secondary" href="\/solutions"/);
 assert.match(html,/бета-сценарії та розробку/);
 for(const route of ['/hotel-pms-modules','/pricing'])assert.equal((await renderRouteForReview(route)).status,200,route);
});

test('author article cards agree with their rendered article title, reading time and byline',async()=>{
 const displayed=[];
 for(const [profile,name] of [['/authors/oleh-stepeniev','Олег Степенєв'],['/authors/kostiantyn-tripailo','Костянтин Тріпайло']]){
  const author=await renderRouteForReview(profile);
  assert.equal(author.status,200,profile);
  const cards=[...author.html.matchAll(/<a class="author-article-card" href="([^"]+)">([\s\S]*?)<\/a>/g)];
  assert.ok(cards.length>0,profile);
  for(const [,route,card] of cards){
   displayed.push(route);
   const article=await renderRouteForReview(route);
   assert.equal(article.status,200,route);
   const title=article.html.match(/<h1[^>]*>([^<]+)<\/h1>/)?.[1];
   const source=getPreparedPage(route)??overbookingArticles.find(item=>item.slug===route);
   assert.ok(source,route);
   const duration=`${source.minutes} хв читання`;
   const displayedDuration=article.html.match(/class="reader-duration"[^>]*>(\d+ хв читання)/)?.[1];
   assert.ok(title,route);
   if(displayedDuration)assert.equal(displayedDuration,duration,route);
   assert.ok(card.includes(`<strong>${title}</strong>`),route);
   assert.ok(card.includes(duration),route);
   assert.match(article.html,new RegExp(`href="${profile}"[^>]*>${name}<`),route);
   const schema=[...article.html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap(m=>{const value=JSON.parse(m[1]);return value['@graph']??[value];});
   const item=schema.find(node=>['Article','BlogPosting'].includes(node['@type']));
   assert.equal(item?.author?.name,name,route);
   assert.equal(item?.author?.url,`https://www.vdalo.tech${profile}`,route);
  }
 }
 assert.deepEqual(displayed.sort(),[...preparedPages.map(page=>page.route).filter(route=>route.startsWith('/blog/')),...overbookingArticles.map(article=>article.slug)].sort());
});

test('fiscalization guidance distinguishes payment methods and links to tax authority explanations',async()=>{
 const {status,html}=await renderRouteForReview('/hotel-prro');
 assert.equal(status,200);
 assert.doesNotMatch(html,/Для кожної оплати перевіряйте фіскальний чек/);
 assert.match(html,/Коли для конкретної операції потрібен фіскальний чек/);
 assert.match(html,/https:\/\/zir\.tax\.gov\.ua\/main\/bz\/view\/\?id=42313&amp;src=ques/);
 assert.match(html,/https:\/\/ck\.tax\.gov\.ua\/media-ark\/news-ark\/1011194\.html/);
 assert.match(html,/Модуль ПРРО й інтеграція з Дією розробляються/);
});

test('booking guides distinguish source-specific calendar limits and hypothetical card payments',async()=>{
 const channels=await renderRouteForReview('/blog/channel-manager-ical-gotelyu');
 const direct=await renderRouteForReview('/blog/pryami-bronyuvannya-ta-vidzhet-gotelyu');
 assert.equal(channels.status,200);assert.equal(direct.status,200);
 assert.match(channels.html,/Кількість запитів на ручне оновлення обмежена/u);
 assert.match(channels.html,/із п’яти однакових номерів два продані, а один закритий на ремонт/iu);
 assert.match(channels.html,/це загальне пояснення платформи, а не підтвердження роботи певного підключення VDALO/iu);
 assert.ok(channels.html.includes('https://developers.booking.com/connectivity/docs/ari'));
 assert.match(direct.html,/не означає, що така оплата доступна у віджеті VDALO/u);
});

test('housekeeping and arrival articles connect timing and access guidance to relevant tools',async()=>{
 const cleaning=await renderRouteForReview('/blog/status-gotovnosti-nomera-housekeeping');
 const arrival=await renderRouteForReview('/blog/pidhotovka-zaselennya-gostya');
 assert.equal(cleaning.status,200);assert.equal(arrival.status,200);
 assert.match(cleaning.html,/виконання тривало 25 хвилин, очікування огляду – 15 хвилин, а сам огляд – 15 хвилин/u);
 assert.match(cleaning.html,/не доводить, що кожен номер встигнуть підготувати/u);
 assert.ok(internalHrefs(cleaning.html).includes('/tools/housekeeping-workload-calculator/'));
 assert.match(arrival.html,/не припускайте, що всі коди автоматично перестають діяти/u);
 assert.ok(internalHrefs(arrival.html).includes('/hotel-access-control'));
 for(const route of ['/tools/housekeeping-workload-calculator/','/hotel-access-control'])assert.equal((await renderRouteForReview(route)).status,200,route);
});

test('migration, website and automation guidance reaches the relevant practical resources',async()=>{
 const expected={
  '/hotel-pms-migration':['/blog/perehid-na-pms-bez-vtraty-danyh','/resources'],
  '/hotel-site-builder':['/tools/hotel-website-checklist/'],
  '/hotel-automation':['/tools/hotel-admin-time-calculator/'],
 };
 for(const [route,links] of Object.entries(expected)){
  const {status,html}=await renderRouteForReview(route);
  assert.equal(status,200,route);
  for(const link of links){assert.ok(internalHrefs(html).includes(link),`${route}: ${link}`);assert.equal((await renderRouteForReview(link)).status,200,link);}
 }
 const migration=(await renderRouteForReview('/hotel-pms-migration')).html;
 assert.match(migration,/iCal може використовуватися для обміну календарною доступністю, але не гарантує перенесення всієї історії чи фінансових даних/);
 assert.doesNotMatch(migration,/У коді VDALO передбачені окремі сценарії/);
 const automation=(await renderRouteForReview('/hotel-automation')).html;
 assert.match(automation,/60 повторюваних операцій[\s\S]*300 хвилин[\s\S]*5 годин[\s\S]*одну годину[\s\S]*4 години/u);
 assert.equal(60*(10-5)/60-1,4);
 const roles=(await renderRouteForReview('/hotel-multi-property')).html;
 assert.match(roles,/тестовий акаунт рецепції/);
 assert.match(roles,/Фактичні дозволи залежать від конфігурації/);
});

test('guest and access pages qualify unverified product details and link related guides',async()=>{
 const expected={
  '/hotel-guest-app':['/blog/qr-wifi-dlya-gotelyu','/blog/qr-kartka-v-nomer-gotelyu'],
  '/hotel-access-control':['/blog/pidhotovka-zaselennya-gostya'],
  '/hotel-ai-assistant':['/blog/shcho-avtomatyzuvaty-v-goteli-pershym'],
 };
 for(const [route,links] of Object.entries(expected)){
  const {status,html}=await renderRouteForReview(route);
  assert.equal(status,200,route);
  for(const link of links){assert.ok(internalHrefs(html).includes(link),`${route}: ${link}`);assert.equal((await renderRouteForReview(link)).status,200,link);}
 }
 for(const route of ['/hotel-guest-profile','/hotel-pms-modules']){
  const {status,html}=await renderRouteForReview(route);
  assert.equal(status,200,route);
  assert.doesNotMatch(html,/MRZ зчитується локально|зображення документа не зберігається/iu,route);
  assert.match(html,/умови обробки документа|місце обробки та зберігання зображень/iu,route);
 }
 const access=(await renderRouteForReview('/hotel-access-control')).html;
 assert.doesNotMatch(access,/код доступу з’являється на сторінці гостя в ніч заїзду/u);
 assert.match(access,/час його видачі та доступність гостьової сторінки потрібно перевірити/u);
});

test('check-in and housekeeping pages connect to tools for their actual tasks',async()=>{
 const expected={
  '/hotel-check-in':['/tools/guest-message-builder/'],
  '/guest-communication':['/tools/guest-message-builder/','/tools/hotel-review-response/'],
  '/hotel-operations':['/tools/housekeeping-workload-calculator/'],
  '/hotel-housekeeping':['/tools/housekeeping-checklist/','/tools/housekeeping-workload-calculator/'],
 };
 for(const [route,links] of Object.entries(expected)){
  const {status,html}=await renderRouteForReview(route);
  assert.equal(status,200,route);
  for(const link of links){assert.ok(internalHrefs(html).includes(link),`${route}: ${link}`);assert.equal((await renderRouteForReview(link)).status,200,link);}
 }
});

test('finance pages distinguish local tax guidance and link practical calculation tools',async()=>{
 const expected={
  '/hotel-finance':['/tools/hotel-room-cost-calculator/'],
  '/hotel-revenue-management':['/tools/hotel-profitability-calculator/'],
 };
 for(const [route,links] of Object.entries(expected)){
  const {status,html}=await renderRouteForReview(route);
  assert.equal(status,200,route);
  for(const link of links){
   assert.ok(internalHrefs(html).includes(link),`${route} should link to ${link}`);
   assert.equal((await renderRouteForReview(link)).status,200,link);
  }
 }
 const finance=(await renderRouteForReview('/hotel-finance')).html;
 assert.match(finance,/4 000 грн[\s\S]*1 000 грн[\s\S]*3 000 грн/);
 assert.equal(4000-1000,3000);
 const revenue=(await renderRouteForReview('/hotel-revenue-management')).html;
 assert.match(revenue,/300 доступних номероночей[\s\S]*180 номероночей[\s\S]*60%[\s\S]*270 000 грн[\s\S]*1 500 грн[\s\S]*900 грн/);
 assert.equal(10*30,300);
 assert.equal(180/300,0.6);
 assert.equal(270000/180,1500);
 assert.equal(270000/300,900);
});

test('booking and integration pages connect to relevant guides and qualify channel availability',async()=>{
 const targets={
  '/hotel-direct-booking':['/tools/hotel-website-checklist/','/blog/pryami-bronyuvannya-ta-vidzhet-gotelyu'],
  '/hotel-channel-manager':['/blog/channel-manager-ical-gotelyu'],
 };
 for(const [route,links] of Object.entries(targets)){
  const page=await renderRouteForReview(route);
  assert.equal(page.status,200,route);
  for(const link of links){
   assert.ok(internalHrefs(page.html).includes(link),`${route} should link to ${link}`);
   assert.equal((await renderRouteForReview(link)).status,200,link);
  }
 }
 const integrations=await renderRouteForReview('/integrations');
 assert.equal(integrations.status,200);
 assert.doesNotMatch(integrations.html,/підключає понад 60 каналів|доступність без імен гостей/iu);
 assert.match(integrations.html,/Склад даних, зокрема наявність імен чи контактів, залежить від джерела та налаштувань/);
});

test('every SEO landing page ends with contextual internal links',()=>{
  for(const route of seoRoutes()){
    const html=renderSeoPage(route);
    const related=html.match(/<nav class="seo-section seo-related"[\s\S]*?<\/nav>/)?.[0]||'';
    const hrefs=internalHrefs(related);
    assert.ok(hrefs.length>=2,`${route} should have at least two related internal links`);
    assert.equal(new Set(hrefs).size,hrefs.length,`${route} should not repeat links in its related section`);
  }
});

test('QR articles link their topic cluster and QR Studio from the lower related section',()=>{
  for(const article of qrArticles){
    const html=renderSecondPassArticle(article.slug);
    const related=html.match(/<nav class="article-related-links"[\s\S]*?<\/nav>/)?.[0]||'';
    const hrefs=internalHrefs(related);
    assert.equal(hrefs.length,article.links.length,`${article.slug} should expose its configured related links`);
    for(const [href] of article.links)assert.ok(hrefs.includes(href),`${article.slug} should link to ${href}`);
  }
});

test('QR Studio connects to the pillar guide and both supporting QR articles',()=>{
  const html=readFileSync(new URL('../qr-lab/index.html',import.meta.url),'utf8');
  const related=html.match(/<div class="seo-related">[\s\S]*?<\/div>/)?.[0]||'';
  for(const href of qrArticles.map(article=>article.slug)){
    assert.ok(internalHrefs(related).includes(href),`QR Studio should link to ${href}`);
  }
});

test('every published city SEO block links to the city directory and both tax guides',()=>{
  for(const route of touristTaxCityRoutes()){
    const slug=route.split('/').filter(Boolean).at(-1);
    const place=getTouristTaxPlace(slug);
    if(!canIndexTouristTaxPlace(place))continue;
    const html=renderTouristTaxCity(slug);
    const seo=html.match(/<section class="tt-seo-content"[\s\S]*?<\/section>/)?.[0]||'';
    assert.ok(seo,`${route} should render its SEO block`);
    for(const href of ['/tourist-tax/','/blog/turystychnyi-zbir-gotel-ukraina','/blog/rozrakhunok-turystychnoho-zboru-2026']){
      assert.ok(internalHrefs(seo).includes(href),`${route} SEO block should link to ${href}`);
    }
    const related=seo.match(/<aside class="tt-city-related"[\s\S]*?<\/aside>/)?.[0]||'';
    const cityLinks=internalHrefs(related).filter(href=>href.startsWith('/tourist-tax/')&&href!=='/tourist-tax/');
    assert.ok(cityLinks.length>0,`${route} should cross-link to at least one other published city`);
    assert.ok(!cityLinks.some(href=>href===route),`${route} should not link to itself`);
  }
});
