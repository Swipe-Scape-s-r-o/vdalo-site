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
  touristTaxBatch004WithheldNoNumericRateRows,
  touristTaxPublicationRoutes,
  touristTaxPlaces,
  touristTaxCommunities,
  getTouristTaxBatch004Place,
  getTouristTaxBatch004RateModel,
  canIndexTouristTaxPlace,
} from '../versions/v1/tourist-tax-data.mjs';
import {calculateTouristTax,renderTouristTaxBatch004Place,renderTouristTaxHub,renderTouristTaxRates} from '../versions/v1/tourist-tax.mjs';

test('batch004 imports only locality rows with a non-empty approved rate field',()=>{
  assert.deepEqual(touristTaxBatch004PublicationAudit,{
    sourceRows:1970,
    rowsWithRateText:1195,
    candidateNewPageRows:1147,
    newPageRows:1136,
    withheldNoNumericRateRows:11,
    alreadyPublishedRows:47,
    emptyRateRows:775,
    identityAliases:1,
  });
  assert.equal(touristTaxBatch004EmptyRateRows.length,775);
  assert.equal(touristTaxBatch004WithheldNoNumericRateRows.length,11);
  const emptyCodes=new Set(touristTaxBatch004EmptyRateRows.map(row=>row['КАТОТТГ поселення']));
  assert.ok(touristTaxBatch004Places.every(place=>!emptyCodes.has(place.katottgSettlementCode)));
  assert.equal(touristTaxBatch004Routes.length,1136);
  assert.equal(new Set(touristTaxBatch004Routes).size,1136);
  assert.equal(new Set(touristTaxPublicationRoutes()).size,touristTaxPublicationRoutes().length);
});

test('localities without numeric rates are withheld from all public discovery surfaces',()=>{
  const hub=renderTouristTaxHub();
  const rates=renderTouristTaxRates();
  const configuration=JSON.parse(hub.match(/<script type="application\/json" id="tourist-tax-config">([^<]+)<\/script>/)[1]);
  for(const place of touristTaxBatch004WithheldNoNumericRateRows){
    assert.equal(getTouristTaxBatch004Place(place.slug),null,`${place.slug} must not be a public batch place`);
    assert.equal(renderTouristTaxBatch004Place(place.slug),null,`${place.slug} must not render a public page`);
    assert.ok(!touristTaxBatch004Routes.includes(place.route),`${place.slug} route must not enter route registration`);
    assert.ok(!touristTaxPublicationRoutes().includes(place.route),`${place.slug} route must not enter the sitemap route source`);
    assert.ok(!hub.includes(place.route),`${place.slug} route must not appear in the catalogue or client data`);
    assert.ok(!hub.includes(place.name),`${place.name} must not appear in the public catalogue`);
    assert.ok(!rates.includes(place.route),`${place.slug} route must not appear in the rates register`);
    assert.ok(!rates.includes(place.name),`${place.name} must not appear in the rates register`);
    assert.ok(!JSON.stringify(configuration).includes(place.slug),`${place.slug} must not enter calculator or search data`);
    assert.ok(!JSON.stringify(configuration).includes(place.name),`${place.name} must not enter public search data`);
  }
  for(const place of touristTaxBatch004Places){
    const html=renderTouristTaxBatch004Place(place.slug);
    for(const withheld of touristTaxBatch004WithheldNoNumericRateRows)
      assert.ok(!html.includes(withheld.route),`${place.slug} must not link to withheld ${withheld.slug}`);
  }
});

test('rates register formats every published batch rate in Ukrainian review lines',()=>{
  const rates=renderTouristTaxRates();
  for(const place of touristTaxBatch004Places){
    const start=rates.indexOf(`href="${place.route}"`);
    assert.notEqual(start,-1,`${place.slug} should appear in the rates register`);
    const end=rates.indexOf('</tr>',start);
    const row=rates.slice(start,end);
    const rateMarkup=row.match(/<ul class="tt-batch-rate-lines">([\s\S]*?)<\/ul>/)?.[1]||'';
    assert.ok(rateMarkup,`${place.slug} should use readable rate lines in the register`);
    assert.ok(!row.includes('VDALO_PARTIAL_RATE_DATA'),`${place.slug} must not expose an internal status code in the register`);
    assert.ok(!row.includes('перевірити оригінал і зміни'),`${place.slug} must not expose the internal review instruction in the register`);
    const visibleRateText=rateMarkup.replace(/<[^>]+>/g,' ').replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#39;/g,"'");
    assert.doesNotMatch(visibleRateText.replace(/\b(?:IX-VIII|VIII|IX|II)\b/g,''),/[A-Za-z]{2,}/u,`${place.slug} register rate should use Ukrainian wording`);
    for(const line of rateMarkup.matchAll(/<li>([\s\S]*?)<\/li>/g))assert.ok((line[1].match(/\d+(?:[,.]\d+)?\s*%/gu)||[]).length<=1,`${place.slug} should show each percentage on its own line in the register`);
  }
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

test('every batch row with a numeric rate receives a preliminary calculator model',()=>{
  const supported=touristTaxBatch004Places.filter(place=>getTouristTaxBatch004RateModel(place));
  const numeric=touristTaxBatch004Places.filter(place=>/\d+(?:[,.]\d+)?\s*%/u.test(place.rateText));
  const protectedBar=touristTaxBatch004Places.find(place=>place.slug==='bar');
  assert.equal(supported.length,1135,'all numeric batch rates calculate except Bar, which retains its explicit existing review gate');
  assert.equal(numeric.length,1136);
  assert.ok(numeric.every(place=>getTouristTaxBatch004RateModel(place)||place.slug==='bar'));
  assert.equal(getTouristTaxBatch004RateModel(protectedBar),null);
  assert.equal(touristTaxPlaces.find(place=>place.slug==='bar').geoStatus,'REVIEW_REQUIRED');
  assert.ok(touristTaxBatch004Places.filter(place=>!/\d+(?:[,.]\d+)?\s*%/u.test(place.rateText)).every(place=>!getTouristTaxBatch004RateModel(place)));
  const aktove=getTouristTaxBatch004RateModel('aktove');
  assert.deepEqual(aktove,{kind:'preliminary-estimate',rates:{domestic:0.5,inbound:0.5},scope:'AS_RECORDED',year:2026,hasMultipleRates:false});
  assert.deepEqual(getTouristTaxBatch004RateModel('hrebinka').rates,{domestic:0.3,inbound:2});
  assert.deepEqual(getTouristTaxBatch004RateModel('kherson').rates,{domestic:0.5,inbound:1});
  assert.deepEqual(getTouristTaxBatch004RateModel('khmelnytskyy').rates,{domestic:0.5,inbound:5});
  assert.deepEqual(getTouristTaxBatch004RateModel('smila').rates,{domestic:0,inbound:5});
  assert.equal(getTouristTaxBatch004RateModel({...touristTaxBatch004Places[0],rateText:'Ставку ще не зазначено'}),null);
  const supportedWithoutGeoGate=supported[0];
  assert.equal(getTouristTaxBatch004RateModel({...supportedWithoutGeoGate,dataStatus:'READY_FROM_DPS_FILE'}).rates.domestic,getTouristTaxBatch004RateModel(supportedWithoutGeoGate).rates.domestic);
});

test('preliminary batch calculations are explicit, bounded to 2026, and use exact cents',()=>{
  const oneGuest=calculateTouristTax({placeSlug:'aktove',start:'2026-01-01',days:1,guestGroups:[{category:'domestic',guests:1}]});
  assert.equal(oneGuest.state,'PRELIMINARY_RESULT');
  assert.equal(oneGuest.totalCents,'4324');
  assert.equal(oneGuest.verificationStatus,'PRELIMINARY');
  assert.match(oneGuest.warning,/\* Дані ще перебувають на стадії підтвердження/u);
  const multipleGuests=calculateTouristTax({placeSlug:'aktove',start:'2026-01-01',days:2,guestGroups:[{category:'domestic',guests:2},{category:'inbound',guests:1}]});
  assert.equal(multipleGuests.state,'PRELIMINARY_RESULT');
  assert.equal(multipleGuests.totalCents,'25941');
  assert.equal(calculateTouristTax({placeSlug:'aktove',start:'2026-12-31',days:2,guestGroups:[{category:'domestic',guests:1}]}).state,'RATE_OUT_OF_PERIOD');
  assert.equal(calculateTouristTax({placeSlug:'aktove',start:'2027-01-01',days:1,guestGroups:[{category:'domestic',guests:1}]}).state,'RATE_OUT_OF_PERIOD');
  assert.equal(calculateTouristTax({placeSlug:'aktove',start:'2026-01-01',days:1,guestGroups:[{category:'domestic',guests:1}],accommodationType:'hotel'}).state,'INVALID_INPUT');
  assert.equal(calculateTouristTax({placeSlug:'bar',start:'2026-01-01',days:1,guestGroups:[{category:'domestic',guests:1}]}).state,'AMBIGUOUS_PLACE');
});

test('every new locality route renders indexable page with its exact approved rate and unique SEO fields',()=>{
  const titles=new Set();
  const descriptions=new Set();
  const h1s=new Set();
  const normalizeRegion=value=>String(value||'').replace(/\s+область$/iu,'').trim();
  const linkTargets=[
    ...touristTaxPlaces.filter(place=>canIndexTouristTaxPlace(place,touristTaxCommunities)).map(place=>({route:place.route,region:normalizeRegion(place.region),communityCode:touristTaxCommunities.find(item=>item.slug===place.communitySlug)?.katottgCode||''})),
    ...touristTaxBatch004Places.map(place=>({route:place.route,region:normalizeRegion(place.region),communityCode:place.communityCode||''})),
  ];
  for(const place of touristTaxBatch004Places){
    const html=renderTouristTaxBatch004Place(place.slug);
    assert.ok(html,`${place.slug} should render`);
    assert.match(html,new RegExp(`<link rel="canonical" href="https://www\\.vdalo\\.tech${place.route.replaceAll('/','\\/')}">`));
    assert.match(html,/<meta name="robots" content="index,follow">/);
    const rateValues=[...place.rateText.matchAll(/\d+(?:[,.]\d+)?\s*%/gu)].map(([rate])=>rate.replace(/\./g,','));
    const rateSection=html.match(/<ul class="tt-batch-rate-lines">([\s\S]*?)<\/ul>/)?.[1]||'';
    assert.equal((html.match(/class="tt-batch-rate-lines"/g)||[]).length,1,`${place.slug} should display the rate once, in the summary card`);
    for(const rate of rateValues)assert.ok(rateSection.includes(rate),`${place.slug} should preserve approved rate ${rate}`);
    assert.ok(rateSection.includes('<li>'),`${place.slug} should put rate statements on separate lines`);
    assert.ok(!html.includes('VDALO_PARTIAL_RATE_DATA'),`${place.slug} must not expose internal status codes`);
    assert.ok(!html.includes('Статус даних:'),`${place.slug} must not show the internal data-status field`);
    assert.ok(!/перевірити оригінал і зміни/iu.test(html),`${place.slug} must not show the internal review instruction`);
    assert.match(html,/VDALO не несе відповідальності за неточності/u,`${place.slug} should include the review disclaimer`);
    assert.match(html,/самостійно звірте чинне рішення/u,`${place.slug} should ask visitors to verify the decision`);
    const visibleRateText=rateSection.replace(/<[^>]+>/g,' ').replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#39;/g,"'");
    assert.doesNotMatch(visibleRateText.replace(/-(?:IX-)?VIII\b|-IX\b/g,''),/[A-Za-z]{2,}/u,`${place.slug} rate display should use Ukrainian wording`);
    for(const line of rateSection.matchAll(/<li>([\s\S]*?)<\/li>/g))assert.ok((line[1].match(/\d+(?:[,.]\d+)?\s*%/gu)||[]).length<=1,`${place.slug} should place each percentage on its own line`);
    if(place.dataStatus==='VDALO_PARTIAL_RATE_DATA'||place.dataStatus==='RATE_FROM_PUBLISHED_SITE_PRELIMINARY'||String(place.source['Статус ставки на сайті']||'').includes('Попередні')||String(place.source['Статус ставки на сайті']||'').includes('Не зазначено в реєстрі')){
      assert.match(html,/Попередні дані|перевірка триває/iu,`${place.slug} should visibly retain its preliminary state`);
      assert.match(html,/Дані ще перебувають на стадії підтвердження/iu,`${place.slug} should explain that the value is still under review`);
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
    const normalizedCommunity=String(place.community||'громада не зазначена').replace(/\s+територіальна громада$/iu,' громада').replace(/\s+(?:міська|селищна|сільська)\s+ТГ$/iu,' громада').replace(/\s+ТГ$/iu,' громада');
    const escapedCommunity=normalizedCommunity.replaceAll('&','&amp;').replaceAll("'",'&#39;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
    assert.ok(description.includes(escapedCommunity),`${place.slug} description should identify the locality's community`);
    assert.match(description,/джерела й статус даних/iu,`${place.slug} description should direct visitors to the page's source and status details`);
    assert.doesNotMatch(`${title} ${description}`,/UA\d{17}/iu,`${place.slug} metadata should not expose a KATOTTG code`);
    assert.match(h1,/2026/u,`${place.slug} H1 should identify the tax year`);
    assert.ok(!titles.has(title),`duplicate title: ${title}`);
    assert.ok(!descriptions.has(description),`duplicate description: ${description}`);
    assert.ok(!h1s.has(h1),`duplicate H1: ${h1}`);
    assert.equal((html.match(/<details>/g)||[]).length,4,`${place.slug} should have four useful FAQs`);
    assert.match(html,/<section class="tt-section tt-batch-seo"/u,`${place.slug} should have a locality-specific SEO section`);
    for(const href of ['/tourist-tax/','/tourist-tax/rates/','/blog/turystychnyi-zbir-gotel-ukraina','/blog/rozrakhunok-turystychnoho-zboru-2026','/hotel-tourist-tax'])
      assert.ok(html.includes(`href="${href}"`),`${place.slug} should link to ${href}`);
    assert.ok(html.includes('Знайти рішення місцевої ради в реєстрі ДПС'),`${place.slug} should link to the official decisions register`);
    assert.doesNotMatch(html,/Інші локації поруч/iu,`${place.slug} should not imply geographic proximity without distance data`);
    const relatedSection=html.match(/<section class="tt-batch-related"[\s\S]*?<\/section>/)?.[0]||'';
    if(relatedSection){
      if(relatedSection.includes('громади'))assert.ok(relatedSection.includes(place.community),`${place.slug} related links should use its community`);
      else assert.ok(relatedSection.includes('області'),`${place.slug} regional links should be labeled by region`);
      const linkedRoutes=[...relatedSection.matchAll(/<a href="([^"#]+)">/g)].map(([,route])=>route);
      assert.ok(linkedRoutes.length>0,`${place.slug} related section should contain crawlable links`);
      for(const route of linkedRoutes){
        const target=linkTargets.find(item=>item.route===route);
        assert.ok(target,`${place.slug} related link ${route} should resolve to a published locality`);
        if(relatedSection.includes('громади'))assert.equal(target.communityCode,place.communityCode,`${place.slug} related locality should share the community`);
        else assert.equal(target.region,normalizeRegion(place.region),`${place.slug} related locality should share the region`);
      }
    }
    const regionStem=String(place.region||'').replace(/\s+область$/iu,'');
    assert.ok(!html.includes(`у ${regionStem} область`)&&!html.includes(`в ${regionStem} область`),`${place.slug} should not use an uninflected region name after a preposition`);
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
  assert.match(html,/1184 локац/);
});

test('calculator search includes only released batch localities and marks supported rates calculable',()=>{
  const client=readFileSync(fileURLToPath(new URL('../versions/v1/public/tourist-tax.js',import.meta.url)),'utf8');
  assert.match(client,/const placesByRoute = new Map\(\)/);
  assert.match(client,/const calculatorPlaces = \[\.\.\.new Map\(\[/);
  assert.match(client,/batchPlaces\) \? config\.batchPlaces : \[\]/);
  assert.match(client,/preliminaryPlaces\.filter\(place => place\.calculatorAvailable\)/);
  const hub=renderTouristTaxHub();
  const config=JSON.parse(hub.match(/<script type="application\/json" id="tourist-tax-config">([^<]+)<\/script>/)[1]);
  assert.equal(config.batchPlaces.length,1136);
  assert.equal(config.batchPlaces.filter(place=>place.calculatorAvailable).length,1135);
  assert.equal(config.batchPlaces.filter(place=>place.calculatorUnavailableReason==='GEO_REVIEW').length,1);
  assert.ok(config.batchPlaces.every(place=>place.verified===false));
});
