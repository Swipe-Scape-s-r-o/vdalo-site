import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {
  touristTaxBatch004Aliases,
  touristTaxBatch004EmptyRateRows,
  touristTaxBatch004Places,
  touristTaxBatch004PublicationAudit,
  touristTaxBatch004Routes,
  touristTaxPublicationRoutes,
  getTouristTaxBatch004Place,
} from '../versions/v1/tourist-tax-data.mjs';
import {renderTouristTaxBatch004Place,renderTouristTaxHub} from '../versions/v1/tourist-tax.mjs';

test('batch004 imports only locality rows with a non-empty approved rate field',()=>{
  assert.deepEqual(touristTaxBatch004PublicationAudit,{
    sourceRows:1970,
    rowsWithRateText:1195,
    newPageRows:1147,
    alreadyPublishedRows:47,
    emptyRateRows:775,
    identityAliases:1,
  });
  assert.equal(touristTaxBatch004EmptyRateRows.length,775);
  const emptyCodes=new Set(touristTaxBatch004EmptyRateRows.map(row=>row['КАТОТТГ поселення']));
  assert.ok(touristTaxBatch004Places.every(place=>!emptyCodes.has(place.katottgSettlementCode)));
  assert.equal(touristTaxBatch004Routes.length,1147);
  assert.equal(new Set(touristTaxBatch004Routes).size,1147);
  assert.equal(new Set(touristTaxPublicationRoutes()).size,touristTaxPublicationRoutes().length);
});

test('Drahobrat resolves as a Yasinya alias, without a settlement code or duplicate route',()=>{
  assert.equal(touristTaxBatch004Aliases.length,1);
  const alias=touristTaxBatch004Aliases[0];
  assert.equal(alias.slug,'drahobrat');
  assert.equal(alias.route,'/tourist-tax/yasinya/');
  assert.equal(alias.aliasOf,'yasinya');
  assert.equal(alias.katottgSettlementCode,null);
  assert.equal(getTouristTaxBatch004Place('drahobrat'),null);
});

test('every new locality route renders indexable page with its exact approved rate and unique SEO fields',()=>{
  const titles=new Set();
  const descriptions=new Set();
  const h1s=new Set();
  for(const place of touristTaxBatch004Places){
    const html=renderTouristTaxBatch004Place(place.slug);
    assert.ok(html,`${place.slug} should render`);
    assert.match(html,new RegExp(`<link rel="canonical" href="https://www\\.vdalo\\.tech${place.route.replaceAll('/','\\/')}">`));
    assert.match(html,/<meta name="robots" content="index,follow">/);
    const escapedRate=place.rateText.replace(/\u2014/g,'\u2013').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
    assert.ok(html.includes(escapedRate),`${place.slug} should show the approved rate text`);
    assert.ok(html.includes(place.dataStatus),`${place.slug} should retain its data status`);
    if(place.source['Статус ставки на сайті'])assert.ok(html.includes(place.source['Статус ставки на сайті']),`${place.slug} should retain the source rate status`);
    if(place.dataStatus==='VDALO_PARTIAL_RATE_DATA'||place.dataStatus==='RATE_FROM_PUBLISHED_SITE_PRELIMINARY'||String(place.source['Статус ставки на сайті']||'').includes('Попередні')){
      assert.match(html,/Попередні дані|перевірка триває/iu,`${place.slug} should visibly retain its preliminary state`);
      assert.match(html,/можуть потребувати подальшої звірки/iu,`${place.slug} should explain that the value is still under review`);
    }
    assert.ok(!html.includes('\u2014'),`${place.slug} public HTML must not contain U+2014`);
    const title=html.match(/<title>(.*?)<\/title>/)?.[1];
    const description=html.match(/<meta name="description" content="(.*?)">/)?.[1];
    const h1=html.match(/<h1>(.*?)<\/h1>/)?.[1];
    assert.ok(title&&description&&h1,`${place.slug} should have title, description, and H1`);
    assert.ok(title.length<=65,`${place.slug} title should stay within 65 characters`);
    assert.ok(description.length<=160,`${place.slug} description should stay within 160 characters`);
    assert.match(title,/Туристичний збір/u,`${place.slug} title should reflect the search intent`);
    assert.match(title,/2026/u,`${place.slug} title should identify the tax year`);
    assert.match(description,/туристичного збору/u,`${place.slug} description should reflect the search intent`);
    assert.match(description,new RegExp(place.katottgSettlementCode.slice(-8)),`${place.slug} description should disambiguate the locality`);
    assert.match(h1,/2026/u,`${place.slug} H1 should identify the tax year`);
    assert.ok(!titles.has(title),`duplicate title: ${title}`);
    assert.ok(!descriptions.has(description),`duplicate description: ${description}`);
    assert.ok(!h1s.has(h1),`duplicate H1: ${h1}`);
    assert.equal((html.match(/<details>/g)||[]).length,4,`${place.slug} should have four useful FAQs`);
    assert.match(html,/<section class="tt-section tt-batch-seo"/u,`${place.slug} should have a locality-specific SEO section`);
    for(const href of ['/tourist-tax/','/tourist-tax/rates/','/blog/turystychnyi-zbir-gotel-ukraina','/blog/rozrakhunok-turystychnoho-zboru-2026'])
      assert.ok(html.includes(`href="${href}"`),`${place.slug} should link to ${href}`);
    const escapedName=place.name.replaceAll('&','&amp;').replaceAll("'",'&#39;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
    assert.ok(html.includes(`Туристичний збір: дані для локації «${escapedName}»`),`${place.slug} bottom SEO heading should identify the locality`);
    titles.add(title);descriptions.add(description);h1s.add(h1);
  }
});

test('catalog includes all new routes and Drahobrat search alias',()=>{
  const html=renderTouristTaxHub();
  for(const route of touristTaxBatch004Routes)assert.ok(html.includes(`href="${route}"`),`${route} should appear in the catalogue`);
  assert.match(html,/"name":"Драгобрат"/);
  assert.match(html,/"route":"\/tourist-tax\/yasinya\/"/);
  assert.match(html,/1188 локац|1195 локац/);
});

test('catalog search includes the batch without offering unsupported calculator results',()=>{
  const client=readFileSync(fileURLToPath(new URL('../versions/v1/public/tourist-tax.js',import.meta.url)),'utf8');
  assert.match(client,/const placesByRoute = new Map\(\)/);
  assert.match(client,/const calculatorPlaces = \[/);
  assert.match(client,/filter\(place => !batchRouteSet\.has\(place\.route\)\)/);
  assert.match(client,/preliminaryPlaces\.filter\(place => place\.calculatorAvailable\)/);
});
