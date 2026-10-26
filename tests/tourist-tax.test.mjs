import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {calculateTouristTax,calculateExactTouristTaxCents,exportTouristTaxReviewCsv,exportTouristTaxReviewXlsx,renderTouristTaxCity,renderTouristTaxHub} from '../versions/v1/tourist-tax.mjs';
import {getPublicSitemapRoutes} from '../versions/v1/sitemap.mjs';
import {canCalculateTouristTaxPlace,canIndexTouristTaxPlace,hasPlaceSeoBlock,touristTaxCommunities,touristTaxPlaces,touristTaxCityRoutes,touristTaxSources,validateTouristTaxPlaces} from '../versions/v1/tourist-tax-data.mjs';
import {touristTaxReleasePlan} from '../versions/v1/tourist-tax-release.mjs';
import {renderTouristTaxFunnel} from '../microlandings/tourist-tax-funnel.mjs';
import {handleTop5Lead} from '../microlandings/top5-leads.mjs';
import {touristTaxCityEditorialFaq,touristTaxCityIntroductions} from '../versions/v1/tourist-tax-editorial.mjs';

test('supplemental city FAQs cover the 27 indexable city pages without tax figures',()=>{
  const expectedSlugs=['lutsk','berehove','cherkasy','chernihiv','chernivtsi','dnipro','irpin','ivano-frankivsk','khust','kolomyya','kyyiv','lviv','pivdenne','polyana','rivne','skole','slavsko','sumy','ternopil','tyachiv','uzhhorod','vinnytsya','vynohradiv','yaremche','yasinya','zaporizhzhya','zhytomyr'];
  assert.deepEqual(Object.keys(touristTaxCityEditorialFaq).sort(),expectedSlugs.sort());
  for(const [slug,item] of Object.entries(touristTaxCityEditorialFaq)){
    assert.ok(item.question&&item.answer,`${slug} has a complete FAQ item`);
    assert.doesNotMatch(`${item.question} ${item.answer}`,/\d|%|\u2014/,`${slug} supplemental copy contains no tax figures or em dash`);
    const page=renderTouristTaxCity(slug);
    assert.ok(page.includes(item.question),`${slug} page renders its local FAQ`);
    assert.ok(page.includes(item.answer),`${slug} page renders the local answer`);
    const structuredData=[...page.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match=>JSON.parse(match[1]));
    assert.ok(structuredData.some(data=>data['@graph']?.some(node=>node['@type']==='FAQPage'&&node.mainEntity?.some(question=>question.name===item.question))),`${slug} local FAQ is represented in structured data`);
  }
});

test('city introductions cover every indexable locality without rates or em dashes',()=>{
  const expectedSlugs=['lutsk','berehove','cherkasy','chernihiv','chernivtsi','dnipro','irpin','ivano-frankivsk','khust','kolomyya','kyyiv','lviv','pivdenne','polyana','rivne','skole','slavsko','sumy','ternopil','tyachiv','uzhhorod','vinnytsya','vynohradiv','yaremche','yasinya','zaporizhzhya','zhytomyr'];
  assert.deepEqual(Object.keys(touristTaxCityIntroductions).sort(),expectedSlugs.sort());
  for(const [slug,introduction] of Object.entries(touristTaxCityIntroductions)){
    assert.ok(introduction.length>=60,`${slug} has a useful local introduction`);
    assert.doesNotMatch(introduction,/[\d%\u2014]/,`${slug} introduction contains no unverified numeric claim or em dash`);
    const page=renderTouristTaxCity(slug);
    assert.ok(page.includes(`<p class="tt-city-intro">${introduction}</p>`),`${slug} page renders the local introduction`);
  }
});

test('exact rational calculation rounds once after guest-days are multiplied',()=>{
  assert.equal(calculateExactTouristTaxCents({minimumWage:8647,ratePercent:0.5,guests:2,nights:3}).toString(),'25941');
  assert.equal(calculateExactTouristTaxCents({minimumWage:8647,ratePercent:1.5,guests:1,nights:1}).toString(),'12971');
});

test('exact calculation rejects floating-point rates outside supported precision',()=>{
  assert.throws(()=>calculateExactTouristTaxCents({minimumWage:8647,ratePercent:0.333,guests:1,nights:1}),TypeError);
  assert.throws(()=>calculateExactTouristTaxCents({minimumWage:8647,ratePercent:0.5,guests:0,nights:1}),TypeError);
});

test('Lutsk calculator returns an amount from the published 2026 rate',()=>{
  const result=calculateTouristTax({placeSlug:'lutsk',start:'2026-10-10',days:3,guestGroups:[{category:'domestic',guests:2}]});
  assert.equal(result.state,'VERIFIED_RESULT');
  assert.equal(result.totalCents,'25941');
  assert.equal(result.exemptionReviewRequired,false);
});

test('Kyiv page uses the official 2026 DPS rates and calculates within the verified period',()=>{
  const place=touristTaxPlaces.find(item=>item.slug==='kyyiv');
  const community=touristTaxCommunities.find(item=>item.slug===place.communitySlug);
  assert.equal(place.katottgSettlementCode,'UA80000000000093317');
  assert.equal(community.katottgCode,'UA80000000000093317');
  assert.equal(community.taxRule.status,'VERIFIED');
  assert.equal(community.taxRule.effectiveFrom,'2026-01-01');
  assert.equal(community.taxRule.effectiveTo,'2026-12-31');
  assert.deepEqual(community.taxRule.rates,{domestic:0.4,inbound:1});
  assert.equal(canCalculateTouristTaxPlace(place),true);
  assert.equal(canIndexTouristTaxPlace(place),true);
  assert.equal(hasPlaceSeoBlock(place),true);
  assert.equal(touristTaxCityRoutes().includes(place.route),true);
  const page=renderTouristTaxCity('kyyiv');
  assert.match(page,/<title>Туристичний збір у Києві 2026: ставки та калькулятор \| VDALO<\/title>/);
  assert.match(page,/34,59 грн/);
  assert.match(page,/86,47 грн/);
  assert.match(page,/Наступна планова перевірка джерел: до 1 грудня 2026 року/);
  const domestic=calculateTouristTax({placeSlug:'kyyiv',start:'2026-10-20',days:3,guestGroups:[{category:'domestic',guests:2}]});
  const inbound=calculateTouristTax({placeSlug:'kyyiv',start:'2026-10-20',days:2,guestGroups:[{category:'inbound',guests:2}]});
  const nextYear=calculateTouristTax({placeSlug:'kyyiv',start:'2027-01-01',days:1,guestGroups:[{category:'domestic',guests:1}]});
  assert.equal(domestic.totalCents,'20753');
  assert.equal(inbound.totalCents,'34588');
  assert.equal(nextYear.state,'RATE_OUT_OF_PERIOD');
});

test('Odesa keeps a useful review URL and refuses calculations while official sources conflict',()=>{
  const place=touristTaxPlaces.find(item=>item.slug==='odesa');
  const community=touristTaxCommunities.find(item=>item.slug===place.communitySlug);
  assert.equal(place.katottgSettlementCode,'UA51100270010076757');
  assert.equal(community.katottgCode,'UA51100270000073549');
  assert.equal(community.taxRule.status,'CONFLICT');
  assert.equal(canCalculateTouristTaxPlace(place),false);
  assert.equal(canIndexTouristTaxPlace(place),false);
  const page=renderTouristTaxCity('odesa');
  assert.match(page,/<meta name="robots" content="noindex,follow"/);
  assert.match(page,/<link rel="canonical" href="https:\/\/www\.vdalo\.tech\/tourist-tax\/odesa\/"/);
  assert.match(page,/рішення №4314-VIII/);
  assert.match(page,/Чому зараз немає розрахунку/);
  assert.match(page,/0,50%/);assert.match(page,/1%/);
  assert.doesNotMatch(page,/id="tt-calculator"|name="odesaCompare"/);
  assert.ok(!touristTaxCityRoutes().includes('/tourist-tax/odesa/'));
  for(const category of ['domestic','inbound'])for(const start of ['2026-07-13','2026-10-20','2027-01-01'])for(const scenario of ['official','odesa-inbound-1-percent']){
    const result=calculateTouristTax({placeSlug:'odesa',start,days:3,guests:2,category,scenario});
    assert.equal(result.state,'SOURCE_CONFLICT');assert.equal(result.totalCents,undefined);
  }
  assert.equal(calculateTouristTax({placeSlug:'kyyiv',start:'2026-10-20',days:1,guests:1,category:'inbound',scenario:'odesa-inbound-1-percent'}).state,'INVALID_INPUT');
});

test('Sumy 2026 rate, city page and calculator are verified',()=>{
  const place=touristTaxPlaces.find(item=>item.slug==='sumy');
  const community=touristTaxCommunities.find(item=>item.slug===place.communitySlug);
  assert.equal(community.taxRule.status,'VERIFIED');
  assert.equal(community.taxRule.decisionNumber,'1238-МР');
  assert.deepEqual(community.taxRule.rates,{domestic:0.5,inbound:0.5});
  assert.equal(place.geoStatus,'ELIGIBLE');
  assert.equal(canCalculateTouristTaxPlace(place),true);
  assert.equal(touristTaxCityRoutes().includes(place.route),true);
  const page=renderTouristTaxCity(place.slug);
  assert.match(page,/<meta name="robots" content="index,follow">/);
  assert.match(page,/0,5\s*%|0,5%/);
  assert.equal(calculateTouristTax({placeSlug:'sumy',start:'2026-10-10',days:1,guestGroups:[{category:'domestic',guests:1}]}).state,'VERIFIED_RESULT');
});

test('Vinnytsia 2026 rate, city page and calculator are verified against the effective decision',()=>{
  const place=touristTaxPlaces.find(item=>item.slug==='vinnytsya');
  const community=touristTaxCommunities.find(item=>item.slug===place.communitySlug);
  assert.equal(community.katottgCode,'UA05020030000031457');
  assert.equal(community.taxRule.status,'VERIFIED');
  assert.equal(community.taxRule.decisionNumber,'469');
  assert.deepEqual(community.taxRule.rates,{domestic:0.5,inbound:1.5});
  assert.deepEqual(community.taxRule.proposedRates,{domestic:0.3,inbound:1});
  assert.equal(community.taxRule.effectiveFrom,'2022-01-01');
  assert.equal(community.taxRule.effectiveTo,'2026-12-31');
  assert.equal(place.geoStatus,'ELIGIBLE');
  assert.equal(canCalculateTouristTaxPlace(place),true);
  assert.equal(touristTaxCityRoutes().includes(place.route),true);
  const page=renderTouristTaxCity(place.slug);
  assert.match(page,/<meta name="robots" content="index,follow">/);
  assert.match(page,/vmr\.gov\.ua/);
  assert.match(page,/1,5\s*%|1,5%/);
  assert.equal(calculateTouristTax({placeSlug:'vinnytsya',start:'2026-10-10',days:1,guestGroups:[{category:'inbound',guests:1}]}).state,'VERIFIED_RESULT');
});

test('Pivdenne 2026 rule and calculator use the current decision period',()=>{
  const place=touristTaxPlaces.find(item=>item.slug==='pivdenne');
  const community=touristTaxCommunities.find(item=>item.slug===place.communitySlug);
  assert.equal(community.katottgCode,'UA51100410000059549');
  assert.equal(community.taxRule.status,'VERIFIED');
  assert.equal(community.taxRule.decisionNumber,'422-VIII');
  assert.deepEqual(community.taxRule.rates,{domestic:0.5,inbound:0.5});
  assert.deepEqual(community.taxRule.proposedRates,{domestic:0.4,inbound:1.5});
  assert.equal(community.taxRule.effectiveFrom,'2022-01-01');
  assert.equal(community.taxRule.effectiveTo,'2026-12-31');
  assert.equal(place.geoStatus,'ELIGIBLE');
  assert.equal(canCalculateTouristTaxPlace(place),true);
  assert.equal(touristTaxCityRoutes().includes(place.route),true);
  assert.equal(calculateTouristTax({placeSlug:'pivdenne',start:'2026-10-10',days:1,guestGroups:[{category:'domestic',guests:1}]}).state,'VERIFIED_RESULT');
  assert.equal(calculateTouristTax({placeSlug:'pivdenne',start:'2027-01-01',days:1,guestGroups:[{category:'domestic',guests:1}]}).state,'RATE_OUT_OF_PERIOD');
});

test('Ternopil price-tiered 2026 rule is accurately represented and fails closed at the overlapping boundary',()=>{
  const place=touristTaxPlaces.find(item=>item.slug==='ternopil');
  const community=touristTaxCommunities.find(item=>item.slug===place.communitySlug);
  assert.equal(place.katottgSettlementCode,'UA61040490010069060');
  assert.equal(community.katottgCode,'UA61040490000035010');
  assert.equal(community.taxRule.status,'VERIFIED');
  assert.equal(community.taxRule.decisionNumber,'8/52/08');
  assert.equal(community.taxRule.effectiveFrom,'2026-01-01');
  assert.equal(community.taxRule.rates,null,'tiered rates must never be flattened into one misleading pair');
  assert.deepEqual(community.taxRule.rateSchedule.domestic.map(tier=>[tier.operator,tier.ratePercent]),[['lt',0.15],['gt',0.25]]);
  assert.deepEqual(community.taxRule.rateSchedule.inbound.map(tier=>[tier.operator,tier.ratePercent]),[['lt',0.3],['gt',0.5]]);
  assert.equal(canCalculateTouristTaxPlace(place),true);
  assert.equal(touristTaxCityRoutes().includes(place.route),true);
  assert.equal(canIndexTouristTaxPlace(place),true);
  const page=renderTouristTaxCity(place.slug);
  assert.match(page,/name="accommodationPricePerPersonPerDay"[^>]*required/);
  assert.match(page,/менше 320 грн/);
  assert.match(page,/понад 320 грн/);
  assert.match(page,/рівно 320 грн/);
  assert.match(page,/ternopilcity\.gov\.ua/);
  assert.match(page,/25,94 грн/);
  const lower=calculateTouristTax({placeSlug:'ternopil',start:'2026-10-10',days:2,guestGroups:[{category:'domestic',guests:1}],accommodationPricePerPersonPerDay:'300.00'});
  assert.equal(lower.state,'VERIFIED_RESULT');
  assert.equal(lower.totalCents,'2594');
  assert.equal(lower.guestGroups[0].ratePercent,0.15);
  const inbound=calculateTouristTax({placeSlug:'ternopil',start:'2026-10-10',days:1,guestGroups:[{category:'inbound',guests:1}],accommodationPricePerPersonPerDay:'300.00'});
  assert.equal(inbound.state,'VERIFIED_RESULT');
  assert.equal(inbound.totalCents,'2594');
  assert.equal(inbound.guestGroups[0].ratePercent,0.3);
  for(const price of ['319.99','320','320.00']){
    const result=calculateTouristTax({placeSlug:'ternopil',start:'2026-10-10',days:1,guestGroups:[{category:'domestic',guests:1}],accommodationPricePerPersonPerDay:price});
    if(Number(price)===320)assert.equal(result.state,'RATE_THRESHOLD_AMBIGUOUS');
    else assert.equal(result.state,'VERIFIED_RESULT');
  }
  const upper=calculateTouristTax({placeSlug:'ternopil',start:'2026-10-10',days:1,guestGroups:[{category:'domestic',guests:1}],accommodationPricePerPersonPerDay:'320.01'});
  assert.equal(upper.state,'VERIFIED_RESULT');
  assert.equal(upper.guestGroups[0].ratePercent,0.25);
  for(const price of [undefined,'','0','-1','not-a-price','320.001'])assert.equal(calculateTouristTax({placeSlug:'ternopil',start:'2026-10-10',days:1,guestGroups:[{category:'domestic',guests:1}],accommodationPricePerPersonPerDay:price}).state,'INVALID_INPUT');
  assert.equal(calculateTouristTax({placeSlug:'ternopil',start:'2027-01-01',days:1,guestGroups:[{category:'domestic',guests:1}],accommodationPricePerPersonPerDay:'300'}).state,'RATE_OUT_OF_PERIOD');
});

test('Lviv official 2026 multi-band schedule is preserved and calculator refuses overlapping price boundaries',()=>{
  const sourcePlace=touristTaxPlaces.find(item=>item.slug==='lviv');
  const community=touristTaxCommunities.find(item=>item.slug===sourcePlace.communitySlug);
  assert.equal(community.taxRule.status,'VERIFIED');
  assert.equal(community.taxRule.decisionNumber,'6373');
  assert.equal(community.taxRule.effectiveFrom,'2026-01-01');
  assert.equal(community.taxRule.rates,null,'price-dependent rates must not be flattened');
  assert.deepEqual(community.taxRule.rateSchedule.ambiguousBoundariesUahPerPersonPerDay,[750,1200]);
  assert.deepEqual(community.taxRule.rateSchedule.bands.map(band=>[band.minPriceUahPerPersonPerDay??null,band.maxPriceUahPerPersonPerDay??null,band.domesticRatePercent,band.inboundRatePercent]),[
    [null,750,0.3,1],[750,1200,0.4,1],[1200,null,0.5,1],
  ]);
  assert.equal(hasPlaceSeoBlock(sourcePlace),true);
  assert.equal(sourcePlace.editorial.seoBlock.sections.length,6);
  assert.match(sourcePlace.editorial.seoBlock.sections[2].paragraphs[0],/750 або 1 200 грн/);
  assert.equal(sourcePlace.indexable,true,'the signed 2026 Tax Service form confirms the city/community rates and the calculator fails closed at unclear boundaries');
  const calculatorPlace={...sourcePlace,geoStatus:'ELIGIBLE',readiness:{...sourcePlace.readiness,placeVerified:true,safetyEligible:true,calculatorQaPassed:true}};
  const calculate=price=>calculateTouristTax({placeSlug:'lviv',start:'2026-10-10',days:1,guestGroups:[{category:'domestic',guests:1}],accommodationPricePerPersonPerDay:price},[calculatorPlace],[community]);
  const cases=[['749.99',0.3,'2594'],['750.00',null,null],['750.01',0.4,'3459'],['1199.99',0.4,'3459'],['1200.00',null,null],['1200.01',0.5,'4324']];
  for(const [price,rate,cents] of cases){
    const result=calculate(price);
    if(rate===null){assert.equal(result.state,'RATE_THRESHOLD_AMBIGUOUS',`boundary ${price}`);assert.equal(result.thresholdUah,Number(price));}
    else {assert.equal(result.state,'VERIFIED_RESULT',`price ${price}`);assert.equal(result.guestGroups[0].ratePercent,rate);assert.equal(result.totalCents,cents);}
  }
  const inbound=calculateTouristTax({placeSlug:'lviv',start:'2026-10-10',days:1,guestGroups:[{category:'inbound',guests:1}],accommodationPricePerPersonPerDay:'800'},[calculatorPlace],[community]);
  assert.equal(inbound.state,'VERIFIED_RESULT');
  assert.equal(inbound.guestGroups[0].ratePercent,1);
  assert.equal(inbound.totalCents,'8647');
  assert.equal(canIndexTouristTaxPlace(sourcePlace),true);
});

test('Zaporizhzhia 2026 price bands, exact boundaries, page and calculator are verified',()=>{
  const place=touristTaxPlaces.find(item=>item.slug==='zaporizhzhya');
  const community=touristTaxCommunities.find(item=>item.slug===place.communitySlug);
  assert.equal(place.katottgSettlementCode,'UA23060070010069526');
  assert.equal(community.katottgCode,'UA23060070000082704');
  assert.equal(community.taxRule.status,'VERIFIED');
  assert.equal(community.taxRule.decisionNumber,'39');
  assert.equal(community.taxRule.effectiveFrom,'2019-02-04');
  assert.deepEqual(community.taxRule.rateSchedule.ambiguousBoundariesUahPerPersonPerDay,[]);
  assert.deepEqual(community.taxRule.rateSchedule.bands.map(band=>[
    band.minPriceExclusiveUahPerPersonPerDay??null,
    band.maxPriceUahPerPersonPerDay??null,
    band.domesticRatePercent,
    band.inboundRatePercent,
  ]),[[null,300,0.05,0.5],[300,600,0.25,1.5],[600,null,0.5,1.5]]);
  assert.equal(place.geoStatus,'ELIGIBLE');
  assert.equal(canCalculateTouristTaxPlace(place),true);
  assert.equal(canIndexTouristTaxPlace(place),true);
  assert.equal(touristTaxCityRoutes().includes(place.route),true);
  const page=renderTouristTaxCity(place.slug);
  assert.match(page,/<meta name="robots" content="index,follow">/);
  assert.match(page,/понад 300 грн/);
  assert.match(page,/понад 600 грн/);
  assert.match(page,/tax\.gov\.ua\/data\/material/);
  assert.equal(place.editorial.seoBlock.sections.length,6);

  const domesticCases=[['300.00',0.05,'432'],['300.01',0.25,'2162'],['600.00',0.25,'2162'],['600.01',0.5,'4324']];
  for(const [price,rate,cents] of domesticCases){
    const result=calculateTouristTax({placeSlug:'zaporizhzhya',start:'2026-10-10',days:1,guestGroups:[{category:'domestic',guests:1}],accommodationPricePerPersonPerDay:price});
    assert.equal(result.state,'VERIFIED_RESULT',`domestic price ${price}`);
    assert.equal(result.guestGroups[0].ratePercent,rate,`domestic rate at ${price}`);
    assert.equal(result.totalCents,cents,`domestic amount at ${price}`);
  }
  const inboundCases=[['300.00',0.5,'4324'],['300.01',1.5,'12971'],['600.00',1.5,'12971'],['600.01',1.5,'12971']];
  for(const [price,rate,cents] of inboundCases){
    const result=calculateTouristTax({placeSlug:'zaporizhzhya',start:'2026-10-10',days:1,guestGroups:[{category:'inbound',guests:1}],accommodationPricePerPersonPerDay:price});
    assert.equal(result.state,'VERIFIED_RESULT',`inbound price ${price}`);
    assert.equal(result.guestGroups[0].ratePercent,rate,`inbound rate at ${price}`);
    assert.equal(result.totalCents,cents,`inbound amount at ${price}`);
  }
});

test('Dnipro 2026 official price bands, ambiguous boundary, page and release gates are verified',()=>{
  const place=touristTaxPlaces.find(item=>item.slug==='dnipro');
  const community=touristTaxCommunities.find(item=>item.slug===place.communitySlug);
  const rule=community.taxRule;
  assert.equal(place.katottgSettlementCode,'UA12020010010037010');
  assert.equal(community.katottgCode,'UA12020010000033698');
  assert.equal(rule.status,'VERIFIED');
  assert.equal(rule.decisionNumber,'5/6 зі змінами №6/40');
  assert.equal(rule.effectiveFrom,'2026-01-01');
  assert.equal(rule.effectiveTo,'2026-12-31');
  assert.deepEqual(rule.rateSchedule.ambiguousBoundariesUahPerPersonPerDay,[200]);
  assert.equal(canCalculateTouristTaxPlace(place),true);
  assert.equal(canIndexTouristTaxPlace(place),true);
  assert.equal(touristTaxCityRoutes().includes(place.route),true);
  assert.equal(place.editorial.seoBlock.sections.length,6);
  const page=renderTouristTaxCity('dnipro');
  assert.match(page,/<meta name="robots" content="index,follow">/);
  assert.match(page,/до 200 грн включно/);
  assert.match(page,/від 200 до 3 000 грн включно/);
  assert.match(page,/понад 3 000 грн/);
  assert.match(page,/Значення у джерелах відрізняються/,'the source discrepancy is disclosed');
  assert.doesNotMatch(page,/undefined/i);
  const calc=(price,category='domestic',start='2026-10-10')=>calculateTouristTax({placeSlug:'dnipro',start,days:2,guestGroups:[{category,guests:1}],accommodationPricePerPersonPerDay:price});
  for(const [price,rate,cents] of [['199.99',0.35,'6053'],['500',0.5,'8647'],['3000',0.5,'8647']]){
    const result=calc(price);
    assert.equal(result.state,'VERIFIED_RESULT',`domestic price ${price}`);
    assert.equal(result.guestGroups[0].ratePercent,rate);
    assert.equal(result.totalCents,cents);
  }
  assert.equal(calc('200').state,'RATE_THRESHOLD_AMBIGUOUS');
  assert.equal(calc('3000.01','inbound').guestGroups[0].ratePercent,1.5);
  assert.equal(calc('3000.01','inbound').totalCents,'25941');
  assert.equal(calc('500','domestic','2027-01-01').state,'RATE_OUT_OF_PERIOD');
  assert.equal(calc('').state,'INVALID_INPUT');
});

test('Vynohradiv 2026 rate, KATOTTG, municipal confirmation, calculator and wave-three route are verified',()=>{
  const place=touristTaxPlaces.find(item=>item.slug==='vynohradiv');
  const community=touristTaxCommunities.find(item=>item.slug===place.communitySlug);
  assert.equal(place.katottgSettlementCode,'UA21020110010043238');
  assert.equal(community.katottgCode,'UA21020110000091104');
  assert.equal(community.taxRule.status,'VERIFIED');
  assert.deepEqual(community.taxRule.rates,{domestic:0.25,inbound:0.25});
  assert.equal(community.taxRule.effectiveFrom,'2026-01-01');
  assert.equal(community.taxRule.effectiveTo,'2026-12-31');
  assert.equal(canCalculateTouristTaxPlace(place),true);
  assert.equal(canIndexTouristTaxPlace(place),true);
  assert.equal(touristTaxReleasePlan.activeWave,3);
  assert.ok(touristTaxReleasePlan.waves[2].publishedSlugs.includes('vynohradiv'));
  const page=renderTouristTaxCity('vynohradiv');
  assert.match(page,/<meta name="robots" content="index,follow">/);
  assert.match(page,/0,25%\*/);
  assert.match(page,/Виноградівська міська рада: підтвердження ставки у 2026 році/);
  assert.match(page,/UA21020110010043238/);
  assert.match(page,/Значення у джерелах відрізняються/);
  assert.doesNotMatch(page,/undefined|Excel/i);
  for(const category of ['domestic','inbound']){
    const result=calculateTouristTax({placeSlug:'vynohradiv',start:'2026-10-10',days:1,guestGroups:[{category,guests:1}]});
    assert.equal(result.state,'VERIFIED_RESULT');
    assert.equal(result.totalCents,'2162');
  }
  assert.equal(calculateTouristTax({placeSlug:'vynohradiv',start:'2026-12-31',days:2,guestGroups:[{category:'domestic',guests:1}]}).state,'RATE_OUT_OF_PERIOD');
});

test('Zhytomyr 2026 city rates are distinct from Veresy and calculate within the verified period',()=>{
  const place=touristTaxPlaces.find(item=>item.slug==='zhytomyr');
  const community=touristTaxCommunities.find(item=>item.slug===place.communitySlug);
  assert.equal(place.katottgSettlementCode,'UA18040190010057814');
  assert.equal(community.katottgCode,'UA18040190000029215');
  assert.equal(community.taxRule.status,'VERIFIED');
  assert.equal(community.taxRule.decisionNumber,'1361 (підтверджено міською таблицею ставок на 2026 рік)');
  assert.deepEqual(community.taxRule.rates,{domestic:0.25,inbound:2.5});
  assert.equal(community.taxRule.effectiveFrom,'2026-01-01');
  assert.equal(community.taxRule.effectiveTo,'2026-12-31');
  assert.equal(canCalculateTouristTaxPlace(place),true);
  assert.equal(canIndexTouristTaxPlace(place),true);
  assert.equal(place.editorial.seoBlock.sections.length,6);
  const page=renderTouristTaxCity('zhytomyr');
  assert.match(page,/<meta name="robots" content="index,follow">/);
  assert.match(page,/села Вереси/);
  assert.match(page,/Значення у джерелах відрізняються/);
  assert.match(page,/0,30% \/ 1,00%/);
  assert.doesNotMatch(page,/undefined|Excel/i);
  const domestic=calculateTouristTax({placeSlug:'zhytomyr',start:'2026-10-10',days:3,guestGroups:[{category:'domestic',guests:2}]});
  assert.equal(domestic.state,'VERIFIED_RESULT');
  assert.equal(domestic.totalCents,'12971');
  const inbound=calculateTouristTax({placeSlug:'zhytomyr',start:'2026-10-10',days:2,guestGroups:[{category:'inbound',guests:1}]});
  assert.equal(inbound.state,'VERIFIED_RESULT');
  assert.equal(inbound.totalCents,'43235');
  assert.equal(calculateTouristTax({placeSlug:'zhytomyr',start:'2027-01-01',days:1,guestGroups:[{category:'inbound',guests:1}]}).state,'RATE_OUT_OF_PERIOD');
});

test('Rivne 2026 rates, territorial codes, decision period, page and calculator are verified',()=>{
  const place=touristTaxPlaces.find(item=>item.slug==='rivne');
  const community=touristTaxCommunities.find(item=>item.slug===place.communitySlug);
  assert.equal(place.katottgSettlementCode,'UA56060470010041018');
  assert.equal(community.katottgCode,'UA56060470000086729');
  assert.equal(community.taxRule.status,'VERIFIED');
  assert.equal(community.taxRule.decisionNumber,'783');
  assert.equal(community.taxRule.effectiveFrom,'2022-01-01');
  assert.deepEqual(community.taxRule.rates,{domestic:0.25,inbound:1});
  assert.equal(place.geoStatus,'ELIGIBLE');
  assert.equal(canCalculateTouristTaxPlace(place),true);
  assert.equal(canIndexTouristTaxPlace(place),true);
  assert.ok(place.editorial.seoBlock.sections.length>=5);
  const page=renderTouristTaxCity('rivne');
  assert.match(page,/<meta name="robots" content="index,follow">/);
  assert.match(page,/Рівненської міської територіальної громади/);
  assert.match(page,/21,62 грн/);
  assert.match(page,/86,47 грн/);
  const cases=[
    {category:'domestic',guests:1,days:1,rate:0.25,cents:'2162'},
    {category:'inbound',guests:1,days:1,rate:1,cents:'8647'},
    {category:'domestic',guests:2,days:3,rate:0.25,cents:'12971'},
  ];
  for(const example of cases){
    const result=calculateTouristTax({placeSlug:'rivne',start:'2026-10-10',days:example.days,guestGroups:[{category:example.category,guests:example.guests}]});
    assert.equal(result.state,'VERIFIED_RESULT');
    assert.equal(result.guestGroups[0].ratePercent,example.rate);
    assert.equal(result.totalCents,example.cents);
  }
});

test('Chernihiv 2026 rates, territorial code, decision period, page and calculator are verified',()=>{
  const place=touristTaxPlaces.find(item=>item.slug==='chernihiv');
  const community=touristTaxCommunities.find(item=>item.slug===place.communitySlug);
  assert.equal(community.katottgCode,'UA74100390000073425');
  assert.equal(community.taxRule.status,'VERIFIED');
  assert.equal(community.taxRule.decisionNumber,'18/VIII-19');
  assert.equal(community.taxRule.effectiveFrom,'2023-01-01');
  assert.deepEqual(community.taxRule.rates,{domestic:0.5,inbound:0.5});
  assert.equal(place.geoStatus,'ELIGIBLE');
  assert.equal(canCalculateTouristTaxPlace(place),true);
  assert.equal(canIndexTouristTaxPlace(place),true);
  const page=renderTouristTaxCity('chernihiv');
  assert.match(page,/<meta name="robots" content="index,follow">/);
  assert.match(page,/Чернігівської міської територіальної громади/);
  assert.match(page,/259,41 грн/);
  const result=calculateTouristTax({placeSlug:'chernihiv',start:'2026-10-10',days:3,guestGroups:[{category:'domestic',guests:2}]});
  assert.equal(result.state,'VERIFIED_RESULT');
  assert.equal(result.guestGroups[0].ratePercent,0.5);
  assert.equal(result.totalCents,'25941');
});

test('Ivano-Frankivsk 2026 local rate is sourced, calculated and published',()=>{
  const place=touristTaxPlaces.find(item=>item.slug==='ivano-frankivsk');
  const community=touristTaxCommunities.find(item=>item.slug===place.communitySlug);
  assert.equal(place.katottgSettlementCode,'UA26040190010045761');
  assert.equal(community.katottgCode,'UA26040190000081578');
  assert.equal(community.taxRule.status,'VERIFIED');
  assert.equal(community.taxRule.decisionNumber,'140-43');
  assert.equal(community.taxRule.effectiveFrom,'2025-01-01');
  assert.deepEqual(community.taxRule.rates,{domestic:0.3,inbound:1});
  assert.equal(canCalculateTouristTaxPlace(place),true);
  assert.equal(canIndexTouristTaxPlace(place),true);
  assert.equal(place.readiness.uniqueContentApproved,true);
  assert.equal(place.readiness.seoQaPassed,true);
  assert.equal(place.editorial.seoBlock.sections.length,6);
  const page=renderTouristTaxCity(place.slug);
  assert.match(page,/<meta name="robots" content="index,follow">/);
  assert.match(page,/140-43/);
  assert.match(page,/tax\.gov\.ua\/data\/material/);
  const cases=[
    {category:'domestic',rate:0.3,cents:'2594'},
    {category:'inbound',rate:1,cents:'8647'},
  ];
  for(const example of cases){
    const result=calculateTouristTax({placeSlug:'ivano-frankivsk',start:'2026-10-10',days:1,guestGroups:[{category:example.category,guests:1}]});
    assert.equal(result.state,'VERIFIED_RESULT');
    assert.equal(result.guestGroups[0].ratePercent,example.rate);
    assert.equal(result.totalCents,example.cents);
  }
});

test('Cherkasy 2026 rates match official DPS and council data and calculator examples',()=>{
  const place=touristTaxPlaces.find(item=>item.slug==='cherkasy');
  const community=touristTaxCommunities.find(item=>item.slug===place.communitySlug);
  assert.equal(place.katottgSettlementCode,'UA71080490010015879');
  assert.equal(community.katottgCode,'UA71080490000022110');
  assert.equal(community.taxRule.status,'VERIFIED');
  assert.equal(community.taxRule.decisionNumber,'2-4690');
  assert.equal(community.taxRule.effectiveFrom,'2026-01-01');
  assert.equal(community.taxRule.effectiveTo,'2026-12-31');
  assert.deepEqual(community.taxRule.rates,{domestic:0.5,inbound:5});
  assert.equal(canCalculateTouristTaxPlace(place),true);
  assert.equal(canIndexTouristTaxPlace(place),true);
  assert.equal(place.editorial.seoBlock.sections.length,7);
  const cases=[
    {category:'domestic',rate:0.5,cents:'4324'},
    {category:'inbound',rate:5,cents:'43235'},
  ];
  for(const example of cases){
    const result=calculateTouristTax({placeSlug:'cherkasy',start:'2026-10-10',days:1,guestGroups:[{category:example.category,guests:1}]});
    assert.equal(result.state,'VERIFIED_RESULT');
    assert.equal(result.guestGroups[0].ratePercent,example.rate);
    assert.equal(result.totalCents,example.cents);
  }
});

test('published city SEO calculation examples match the exact calculator',()=>{
  const examples=[
    {slug:'berehove',rate:0.25,guests:2,days:2,category:'domestic',amount:'86.47'},
    {slug:'cherkasy',rate:0.5,guests:2,days:2,category:'domestic',amount:'172.94'},
    {slug:'chernihiv',rate:0.5,guests:2,days:3,category:'domestic',amount:'259.41'},
    {slug:'lutsk',rate:1.5,guests:1,days:2,category:'inbound',amount:'259.41'},
    {slug:'sumy',rate:0.5,guests:1,days:4,category:'domestic',amount:'172.94'},
    {slug:'vinnytsya',rate:1.5,guests:2,days:3,category:'inbound',amount:'778.23'},
    {slug:'pivdenne',rate:0.5,guests:3,days:4,category:'domestic',amount:'518.82'},
    {slug:'rivne',rate:0.25,guests:2,days:3,category:'domestic',amount:'129.71'},
  ];
  for(const example of examples){
    const place=touristTaxPlaces.find(item=>item.slug===example.slug);
    const exampleText=place.editorial.seoBlock.sections.at(-1).paragraphs.join(' ');
    assert.ok(exampleText.includes(`${example.amount.replace('.',',')} грн`),`${example.slug} SEO example should state the expected amount`);
    assert.ok(renderTouristTaxCity(example.slug).includes(`${example.amount.replace('.',',')} грн`),`${example.slug} rendered page should display its example`);
    const exactCents=calculateExactTouristTaxCents({minimumWage:8647,ratePercent:example.rate,guests:example.guests,nights:example.days});
    assert.equal(exactCents.toString(),example.amount.replace('.',''),`${example.slug} example should match exact rounding`);
    const result=calculateTouristTax({placeSlug:example.slug,start:'2026-10-01',days:example.days,guestGroups:[{category:example.category,guests:example.guests}]});
    assert.equal(result.totalCents,exactCents.toString(),`${example.slug} example should match calculator output`);
  }
});

test('Berehove 2026 rate, geography, calculation period and page copy use the DPS form evidence',()=>{
  const place=touristTaxPlaces.find(item=>item.slug==='berehove');
  const community=touristTaxCommunities.find(item=>item.slug===place.communitySlug);
  assert.equal(place.katottgSettlementCode,'UA21020030010083215');
  assert.equal(community.katottgCode,'UA21020030000019624');
  assert.equal(place.geoStatus,'ELIGIBLE');
  assert.equal(community.taxRule.status,'VERIFIED');
  assert.equal(community.taxRule.decisionNumber,'794');
  assert.deepEqual(community.taxRule.rates,{domestic:0.25,inbound:0.25});
  assert.equal(community.taxRule.effectiveFrom,'2022-01-01');
  assert.equal(community.taxRule.effectiveTo,'2026-12-31');
  assert.equal(canCalculateTouristTaxPlace(place),true);
  assert.equal(canIndexTouristTaxPlace(place),true);
  assert.equal(calculateTouristTax({placeSlug:'berehove',start:'2026-10-14',days:2,guestGroups:[{category:'domestic',guests:2}]}).totalCents,'8647');
  assert.equal(calculateTouristTax({placeSlug:'berehove',start:'2027-01-01',days:2,guestGroups:[{category:'domestic',guests:2}]}).state,'RATE_OUT_OF_PERIOD');
  const page=renderTouristTaxCity('berehove');
  assert.match(page,/Ставку звірено 14 жовтня 2026 року/);
  assert.match(page,/Наступна планова перевірка джерел: до 1 грудня 2026 року/);
  assert.match(page,/0,25%/);
});

test('Polyana 2026 city page passes source, calculator and SEO checks in wave two',()=>{
  const place=touristTaxPlaces.find(item=>item.slug==='polyana');
  const community=touristTaxCommunities.find(item=>item.slug===place.communitySlug);
  const page=renderTouristTaxCity('polyana');
  assert.ok(page);
  assert.match(page,/<title>Туристичний збір у Поляні у 2026 році \| Ставки<\/title>/);
  assert.match(page,/<meta name="robots" content="index,follow">/);
  assert.match(page,/<h1>Туристичний збір у Поляні у 2026 році<\/h1>/);
  assert.match(page,/UA21040210010063908/);
  assert.match(page,/рішення №1778/i);
  assert.match(page,/0,5\s*%|0,5%/);
  assert.match(page,/1\s*%|1%/);
  assert.match(page,/значення у джерелах відрізняються|попередніми довідковими даними/i);
  const title=page.match(/<title>([^<]+)<\/title>/)?.[1]||'';
  const description=page.match(/<meta name="description" content="([^"]+)"/)?.[1]||'';
  assert.ok(title.length<=60,`title should fit the recommended length (${title.length})`);
  assert.ok(description.length<=160,`description should fit the recommended length (${description.length})`);
  assert.ok(community.katottgCode);
  assert.equal(canIndexTouristTaxPlace(place,touristTaxCommunities),true);
  assert.equal(calculateTouristTax({placeSlug:'polyana',start:'2026-10-18',days:1,guestGroups:[{category:'domestic',guests:1}]}).totalCents,'4324');
  assert.equal(calculateTouristTax({placeSlug:'polyana',start:'2026-10-18',days:1,guestGroups:[{category:'inbound',guests:1}]}).totalCents,'8647');
  assert.equal(calculateTouristTax({placeSlug:'polyana',start:'2026-10-18',days:3,guestGroups:[{category:'domestic',guests:2}]}).totalCents,'25941');
  assert.equal(calculateTouristTax({placeSlug:'polyana',start:'2027-01-01',days:1,guestGroups:[{category:'domestic',guests:1}]}).state,'RATE_OUT_OF_PERIOD');
});

test('Khust 2026 city page passes source, conflict disclosure, calculator and SEO checks in wave two',()=>{
  const place=touristTaxPlaces.find(item=>item.slug==='khust');
  const community=touristTaxCommunities.find(item=>item.slug===place.communitySlug);
  const page=renderTouristTaxCity('khust');
  assert.ok(page);
  assert.match(page,/<title>Туристичний збір у Хусті на 2026 рік: ставки й калькулятор<\/title>/);
  assert.match(page,/<meta name="robots" content="index,follow">/);
  assert.match(page,/<h1>Туристичний збір у Хусті у 2026 році<\/h1>/);
  assert.match(page,/UA21120250010053148/);
  assert.match(page,/рішення №344/i);
  assert.match(page,/0,5\s*%|0,5%/);
  assert.match(page,/1,5\s*%|1,5%/);
  assert.match(page,/0,4\s*%\s*\/\s*1,0\s*%/);
  assert.match(page,/значення у джерелах відрізняються/i);
  assert.doesNotMatch(page,/Excel/i);
  const title=page.match(/<title>([^<]+)<\/title>/)?.[1]||'';
  const description=page.match(/<meta name="description" content="([^"]+)"/)?.[1]||'';
  assert.ok(title.length<=60,`title should fit the recommended length (${title.length})`);
  assert.ok(description.length<=160,`description should fit the recommended length (${description.length})`);
  assert.ok(community.katottgCode);
  assert.equal(canIndexTouristTaxPlace(place,touristTaxCommunities),true);
  assert.equal(calculateTouristTax({placeSlug:'khust',start:'2026-10-18',days:3,guestGroups:[{category:'domestic',guests:2}]}).totalCents,'25941');
  assert.equal(calculateTouristTax({placeSlug:'khust',start:'2026-10-18',days:1,guestGroups:[{category:'inbound',guests:1}]}).totalCents,'12971');
  assert.equal(calculateTouristTax({placeSlug:'khust',start:'2026-10-18',days:2,guestGroups:[{category:'domestic',guests:1},{category:'inbound',guests:1}]}).totalCents,'34588');
  assert.equal(calculateTouristTax({placeSlug:'khust',start:'2027-01-01',days:1,guestGroups:[{category:'domestic',guests:1}]}).state,'RATE_OUT_OF_PERIOD');
});

test('Bar 2026 rate evidence is recorded while publication stays blocked pending full act review',()=>{
  const place=touristTaxPlaces.find(item=>item.slug==='bar');
  const community=touristTaxCommunities.find(item=>item.slug===place.communitySlug);
  assert.equal(community.katottgCode,'UA05060010000053179');
  assert.equal(community.taxRule.status,'VERIFIED');
  assert.equal(community.taxRule.decisionNumber,'19');
  assert.deepEqual(community.taxRule.rates,{domestic:0.4,inbound:1});
  assert.deepEqual(community.taxRule.proposedRates,{domestic:0.25,inbound:1});
  assert.equal(community.taxRule.effectiveFrom,'2022-01-01');
  assert.equal(community.taxRule.effectiveTo,'2026-12-31');
  assert.equal(place.katottgSettlementCode,'UA05060010010059821');
  assert.equal(place.geoStatus,'REVIEW_REQUIRED');
  assert.equal(canCalculateTouristTaxPlace(place),false);
  assert.equal(touristTaxCityRoutes().includes(place.route),false);
  assert.equal(renderTouristTaxCity(place.slug),null);
  assert.equal(calculateTouristTax({placeSlug:'bar',start:'2026-10-10',days:1,guestGroups:[{category:'domestic',guests:1}]}).state,'AMBIGUOUS_PLACE');
});

test('Chernivtsi 2026 official schedule, city boundary and calculator are verified',()=>{
  const place=touristTaxPlaces.find(item=>item.slug==='chernivtsi');
  const community=touristTaxCommunities.find(item=>item.slug===place.communitySlug);
  assert.equal(place.katottgSettlementCode,'UA73060610010033137');
  assert.equal(community.katottgCode,'UA73060610000066784');
  assert.equal(community.taxRule.status,'VERIFIED');
  assert.equal(community.taxRule.decisionNumber,'1635');
  assert.deepEqual(community.taxRule.rates,{domestic:0.3,inbound:0.3});
  assert.equal(community.taxRule.effectiveFrom,'2026-01-01');
  assert.equal(community.taxRule.effectiveTo,'2026-12-31');
  assert.equal(place.geoStatus,'ELIGIBLE');
  assert.equal(canCalculateTouristTaxPlace(place),true);
  assert.equal(canIndexTouristTaxPlace(place),true);
  assert.equal(touristTaxCityRoutes().includes(place.route),true);
  const page=renderTouristTaxCity(place.slug);
  assert.match(page,/<meta name="robots" content="index,follow">/);
  assert.match(page,/0,3\s*%|0,3%/);
  assert.match(page,/підписана форма №6 ДПС/i);
  assert.match(page,/UA73060610010033137/);
  assert.equal(calculateTouristTax({placeSlug:'chernivtsi',start:'2026-10-10',days:2,guestGroups:[{category:'domestic',guests:3}]}).totalCents,'15565');
  assert.equal(calculateTouristTax({placeSlug:'chernivtsi',start:'2026-10-10',days:1,guestGroups:[{category:'inbound',guests:1}]}).totalCents,'2594');
  assert.equal(calculateTouristTax({placeSlug:'chernivtsi',start:'2027-01-01',days:1,guestGroups:[{category:'domestic',guests:1}]}).state,'RATE_OUT_OF_PERIOD');
});

test('calculator validates dates, guest counts and category',()=>{
  assert.equal(calculateTouristTax({placeSlug:'lutsk',start:'2026-10-13',end:'2026-10-10',nights:3,guests:2,category:'domestic'}).state,'INVALID_INPUT');
  assert.equal(calculateTouristTax({placeSlug:'lutsk',start:'2026-10-10',end:'2026-10-13',nights:3,guests:0,category:'domestic'}).state,'INVALID_INPUT');
  assert.equal(calculateTouristTax({placeSlug:'unknown',start:'2026-10-10',end:'2026-10-13',nights:3,guests:2,category:'domestic'}).state,'AMBIGUOUS_PLACE');
});

test('verified calculation supports mixed guest categories, possible exemptions and rejects tax-year crossings',()=>{
  const place={...touristTaxPlaces[0],geoStatus:'ELIGIBLE',katottgSettlementCode:'UA00000000000000000',readiness:{placeVerified:true,safetyEligible:true,calculatorQaPassed:true}};
  const community={...touristTaxCommunities[0],katottgCode:'UA00000000000000000',taxRule:{...touristTaxCommunities[0].taxRule,status:'VERIFIED',verificationBasis:'QA fixture'}};
  const result=calculateTouristTax({placeSlug:'lutsk',start:'2026-10-10',days:1,guestGroups:[{category:'domestic',guests:2},{category:'inbound',guests:1}]},[place],[community]);
  assert.equal(result.state,'VERIFIED_RESULT');
  assert.equal(result.totalCents,'21618');
  assert.equal(result.guestGroups.length,2);
  const exemption=calculateTouristTax({placeSlug:'lutsk',start:'2026-10-10',days:1,guestGroups:[{category:'domestic',guests:1}],exemption:'claimed'},[place],[community]);
  assert.equal(exemption.state,'VERIFIED_RESULT');
  assert.equal(exemption.exemptionReviewRequired,true);
  assert.equal(calculateTouristTax({placeSlug:'lutsk',start:'2026-12-31',days:2,guestGroups:[{category:'domestic',guests:1}]},[place],[community]).state,'RATE_OUT_OF_PERIOD');
  assert.equal(calculateTouristTax({placeSlug:'lutsk',start:'2026-10-10',days:1,guestGroups:[{category:'domestic',guests:0}]},[place],[community]).state,'INVALID_INPUT');
});

test('directory and all reviewed city pages are indexable and included in the sitemap',()=>{
  const hub=renderTouristTaxHub();
  const city=renderTouristTaxCity('lutsk');
  assert.match(hub,/<meta name="robots" content="index,follow">/);
  assert.match(hub,/<link rel="canonical" href="https:\/\/www\.vdalo\.tech\/tourist-tax\/">/);
  assert.equal([...hub.matchAll(/\bid="tt-calc-place"/g)].length,1);
  assert.match(hub,/Луцьк/);
  assert.match(city,/<meta name="robots" content="index,follow">/);
  assert.match(city,/Розрахуйте туристичний збір/);
  assert.match(city,/0,5\s*%|0,5%/);
  assert.match(city,/1,5\s*%|1,5%/);
  assert.equal(touristTaxSources.territoryList.currentAsOf,'2026-08-21');
  assert.equal(touristTaxSources.territoryList.matchedToKatottg,false);
  assert.match(city,/Податковий кодекс України, стаття 268/);
  assert.doesNotMatch(`${hub}${city}`,/наказ №376|z0782-26|z1117-26/i);
  assert.doesNotMatch(`${hub}${city}`,/пілот|на перевірці|ще перевіряємо/i);
  const routes=getPublicSitemapRoutes({seoRoutes:[],caseSlugs:[],pmsArticle:{slug:'/blog/a'},pmsChoiceArticle:{slug:'/blog/b'},editorialArticles:[],secondPassArticles:[],touristTaxRoutes:['/tourist-tax/',...touristTaxCityRoutes()]});
  assert.ok(routes.includes('/tourist-tax/'));
  assert.ok(routes.includes('/tourist-tax/lutsk/'));
  for(const route of ['/tourist-tax/sumy/','/tourist-tax/vinnytsya/','/tourist-tax/pivdenne/'])assert.ok(routes.includes(route));
  assert.equal(routes.filter(route=>route.startsWith('/tourist-tax/')&&route!=='/tourist-tax/').length,27);
  assert.ok(routes.includes('/tourist-tax/kyyiv/'));
  assert.ok(routes.includes('/tourist-tax/ternopil/'));
  assert.ok(routes.includes('/tourist-tax/zaporizhzhya/'));
});

test('tourist-tax hub and every published city page direct operators to the tracked funnel',()=>{
  const hub=renderTouristTaxHub();
  const hubCta=hub.indexOf('utm_source=tourist_tax_hub');
  assert.ok(hubCta>hub.indexOf('id="tt-calculator"'));
  assert.ok(hub.includes('Впорядкуйте облік туристичного збору'));
  assert.ok(hub.includes('Побачити, як це працює'));
  const publishedPlaces=touristTaxPlaces.filter(place=>canIndexTouristTaxPlace(place,touristTaxCommunities));
  for(const place of publishedPlaces){
    const page=renderTouristTaxCity(place.slug);
    assert.ok(page,`${place.slug} should render`);
    assert.ok(page.includes('utm_source=tourist_tax_city'),`${place.slug} should link to funnel`);
    assert.ok(page.includes(`utm_content=${place.slug}`),`${place.slug} should be preserved for attribution`);
  }
  const lutsk=renderTouristTaxCity('lutsk');
  assert.ok(lutsk.includes('location=%D0%9B%D1%83%D1%86%D1%8C%D0%BA'));
  const funnel=renderTouristTaxFunnel();
  assert.ok(funnel.includes('locationField.value=sourceLocation.slice(0,120)'));
  assert.ok(funnel.includes('id="ttf-city" name="location" autocomplete="address-level2" maxlength="120"'));
  assert.ok(funnel.includes("reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches"));
  assert.ok(funnel.includes("if(reduceMotion){placeholder.hidden=false;play.hidden=false"));
  assert.ok(funnel.includes('--pink:#c22d70'), 'pink text and CTA must use the accessible contrast token');
  assert.ok(funnel.includes("data.entry_page=sourcePage"));
  assert.ok(funnel.includes("track('tourist_tax_lead_success')"));
  assert.ok(funnel.includes("track('tourist_tax_lead_error'"));
  assert.match(funnel,/<form[^>]+id="ttf-form"[^>]+novalidate>/);
  assert.match(funnel,/<input[^>]+type="tel"[^>]+required/);
  assert.match(funnel,/<p[^>]+id="ttf-error"[^>]+role="alert"/);
  assert.match(funnel,/<div[^>]+id="ttf-result"[^>]+role="status"/);
  assert.doesNotMatch(funnel,/<video[^>]+autoplay/, 'video should not autoplay against reduced-motion preference');
});

test('the ten latest city SEO blocks link to relevant published cities, the hub and tax guides',()=>{
  const latestTen=['kyyiv','dnipro','zhytomyr','vynohradiv','yaremche','yasinya','tyachiv','irpin','skole','khust'];
  const latestRoutes=new Set(latestTen.map(slug=>touristTaxPlaces.find(place=>place.slug===slug)?.route));
  for(const slug of latestTen){
    const html=renderTouristTaxCity(slug);
    const start=html.indexOf('<section class="tt-seo-content"');
    const end=html.indexOf('</section>',start);
    assert.ok(start>=0&&end>start,`${slug} should have a lower SEO block`);
    const seoBlock=html.slice(start,end);
    const links=[...seoBlock.matchAll(/<a href="([^"]+)"[^>]*>/g)].map(match=>match[1]);
    assert.ok(links.includes('/tourist-tax/'),`${slug} should link back to the tourist-tax hub`);
    assert.ok(links.includes('/blog/turystychnyi-zbir-gotel-ukraina'),`${slug} should link to the tourist-tax guide`);
    assert.ok(links.includes('/blog/rozrakhunok-turystychnoho-zboru-2026'),`${slug} should link to the calculation article`);
    const related=links.filter(href=>latestRoutes.has(href)&&href!==touristTaxPlaces.find(place=>place.slug===slug)?.route);
    assert.ok(related.length>0,`${slug} should link contextually to another page among the ten latest cities`);
    for(const href of related){
      const targetSlug=href.match(/^\/tourist-tax\/([^/]+)\/$/)?.[1];
      assert.ok(targetSlug&&canIndexTouristTaxPlace(touristTaxPlaces.find(place=>place.slug===targetSlug)),`${slug} links to an unpublished or invalid city route: ${href}`);
    }
  }
});

test('tourist-tax lead preserves city and entry attribution and only succeeds after receiver acknowledgement',async()=>{
  const req=Readable.from([JSON.stringify({name:'QA',email:'qa@example.com',phone:'+380 501234567',contact_method:'viber',hotel:'QA готель',location:'Одеса',property_type:'hotel',rooms:'1-12',consent:true,funnel:'tourist_tax',source:'website',code:'tax-docs',video:'t-tax-docs-pile',watched:50,entry_page:'/tourist-tax/odesa/',utm_source:'tourist_tax_city',utm_medium:'internal',utm_campaign:'tourist_tax',utm_content:'odesa'})]);
  req.method='POST';req.headers={'content-type':'application/json',origin:'https://www.vdalo.tech',host:'www.vdalo.tech'};req.socket={remoteAddress:'192.0.2.144'};
  let status=0,body='',payload;
  const res={writeHead(code){status=code;},end(value){body=JSON.parse(value);}};
  await handleTop5Lead(req,res,{env:{VDALO_LEAD_WEBHOOK_URL:'https://receiver.example.invalid/leads',VDALO_TRIAL_WEBHOOK_URL:'https://fallback.example.invalid/leads'},sendRequest:async(url,options)=>{assert.equal(url,'https://receiver.example.invalid/leads');payload=JSON.parse(options.body);return new Response(JSON.stringify({ok:true}),{status:200});}});
  assert.equal(status,200);assert.equal(body.ok,true);assert.equal(payload.kind,'tourist_tax_inquiry');
  assert.equal(payload.contact.location,'Одеса');assert.equal(payload.contact.preferred_method,'viber');
  assert.equal(payload.attribution.entry_page,'/tourist-tax/odesa/');assert.equal(payload.attribution.utm.utm_content,'odesa');
  assert.equal(payload.permissions.respond_to_request,true);
  const missing=Readable.from([JSON.stringify({name:'QA',email:'qa@example.com',phone:'+380501234567',hotel:'QA готель',location:'Одеса',property_type:'hotel',rooms:'1-12',consent:true,funnel:'tourist_tax',source:'website'})]);
  missing.method='POST';missing.headers={'content-type':'application/json',origin:'https://www.vdalo.tech',host:'www.vdalo.tech'};missing.socket={remoteAddress:'192.0.2.145'};
  status=0;body='';let called=false;
  await handleTop5Lead(missing,{writeHead(code){status=code;},end(value){body=JSON.parse(value);}},{env:{},sendRequest:async()=>{called=true;return {ok:true};}});
  assert.equal(status,503);assert.equal(body.ok,false);assert.equal(called,false);
});

test('Uzhhorod and Slavsko use the signed 2026 universal Form 6 rates and disclose conflicts',()=>{
  const uzhhorod=calculateTouristTax({placeSlug:'uzhhorod',start:'2026-10-10',days:2,guestGroups:[{category:'domestic',guests:2}]});
  const slavsko=calculateTouristTax({placeSlug:'slavsko',start:'2026-10-10',days:2,guestGroups:[{category:'domestic',guests:2}]});
  assert.equal(uzhhorod.state,'VERIFIED_RESULT');
  assert.equal(uzhhorod.totalCents,'17294');
  assert.equal(slavsko.state,'VERIFIED_RESULT');
  assert.equal(slavsko.totalCents,'6918');
  for(const slug of ['uzhhorod','slavsko']){
    const place=touristTaxPlaces.find(item=>item.slug===slug);
    const rule=touristTaxCommunities.find(item=>item.slug===place.communitySlug).taxRule;
    assert.ok(rule.supportingSources.some(source=>source.url.includes('tax.gov.ua/data/material/')));
    const html=renderTouristTaxCity(slug);
    assert.match(html,/Зірочка до ставки/);
    assert.match(html,/попередніми довідковими даними/);
    assert.doesNotMatch(html,/Excel/i,'internal workbook names should not appear on public city pages');
  }
});

test('every published city with an Excel rate mismatch marks the public rate and explains the source choice',()=>{
  const conflictingPlaces=touristTaxReleasePlan.waves[0].publishedSlugs
    .map(slug=>touristTaxPlaces.find(place=>place.slug===slug))
    .filter(place=>{
      const candidate=place?.sourceRecord?.proposedRates;
      const rule=place&&touristTaxCommunities.find(community=>community.slug===place.communitySlug)?.taxRule;
      return canIndexTouristTaxPlace(place)&&Number.isFinite(candidate?.domestic)&&Number.isFinite(candidate?.inbound)&&(
        Boolean(rule?.rateSchedule)||candidate.domestic!==rule?.rates?.domestic||candidate.inbound!==rule?.rates?.inbound
      );
    });
  assert.equal(conflictingPlaces.length,17);
  for(const place of conflictingPlaces){
    const html=renderTouristTaxCity(place.slug);
    assert.ok(html,`published city page should render: ${place.slug}`);
    assert.match(html,/<strong>[^<]*%\*<\/strong>/,`verified rate should carry an asterisk: ${place.slug}`);
    assert.doesNotMatch(html,/Excel/i,`internal workbook names should not appear publicly: ${place.slug}`);
    assert.match(html,/попередн.{0,40}довідков|значення у джерелах відрізняються|ставки.*відрізняються|форма ДПС/i,`page should explain the source discrepancy: ${place.slug}`);
    if(place.slug!=='uzhhorod'&&place.slug!=='slavsko')assert.match(html,/офіційного джерела|офіційне джерело|тарифні діапазони/i,`page should explain the selected official value/model: ${place.slug}`);
  }
});

test('editorial CSV is valid UTF-8 CSV and quotes fields',()=>{
  const csv=exportTouristTaxReviewCsv();
  assert.ok(csv.startsWith('\uFEFF"settlement_slug","settlement"'));
  assert.match(csv,/"77\/72"/);
  assert.match(csv,/"ELIGIBLE"/);
  assert.match(csv,/"VERIFIED"/);
});

test('editorial XLSX is a ZIP-based OOXML workbook with worksheet entries',()=>{
  const workbook=exportTouristTaxReviewXlsx();
  assert.equal(workbook.readUInt32LE(0),0x04034b50);
  assert.equal(workbook.readUInt32LE(workbook.length-22),0x06054b50);
  const directoryOffset=workbook.readUInt32LE(workbook.length-6);
  const directorySize=workbook.readUInt32LE(workbook.length-10);
  const directory=workbook.subarray(directoryOffset,directoryOffset+directorySize).toString('utf8');
  assert.match(directory,/\[Content_Types\]\.xml/);
  assert.match(directory,/xl\/workbook\.xml/);
  assert.match(directory,/xl\/worksheets\/sheet1\.xml/);
});

test('city data, sources and publication state reconcile',()=>{
  const report=validateTouristTaxPlaces();
  assert.equal(report.ok,true);
  assert.deepEqual(report.counts,{all:377,eligible:28,excluded:0,reviewRequired:349});
  assert.equal(touristTaxCommunities.length,280);
  assert.equal(touristTaxSources.katottg.imported,true);
  assert.equal(touristTaxPlaces.filter(place=>place.katottgSettlementCode).length,365);
  assert.equal(touristTaxPlaces.filter(place=>place.district).length,363);
  assert.equal(touristTaxPlaces.find(place=>place.slug==='bar')?.katottgSettlementCode,'UA05060010010059821');
  assert.equal(touristTaxPlaces.find(place=>place.slug==='pivdenne')?.katottgSettlementCode,'UA51100410010044384');
  assert.equal(touristTaxPlaces.find(place=>place.slug==='yuzhnoukrayinsk')?.katottgSettlementCode,'UA48040250010045068');
  assert.equal(touristTaxPlaces.find(place=>place.slug==='kolomyya')?.katottgSettlementCode,'UA26080070010075786');
  assert.equal(touristTaxCommunities.find(community=>community.slug===touristTaxPlaces.find(place=>place.slug==='kolomyya')?.communitySlug)?.katottgCode,'UA26080070000092582');
  const expectedQualifiedMatches={
    'buky-cherkaska':'UA71060050010072245',
    'buky-kyyivska':'UA32020150040057367',
    'karpaty-selyshche':'UA21040250080037844',
    'melnyky-kholodnyy-yar':'UA71080230060050532',
    'oleksandriya-rivnenska':'UA56060430010051905',
    'shepit-chernivetska':'UA73020150100021548',
    'shepit-kosivskyy':'UA26100010130039840',
    'trostyanets-chernihivska':'UA74080110210090525',
    'yavoriv-kosivskyy':'UA26100010150096657',
  };
  for(const [slug,code] of Object.entries(expectedQualifiedMatches))assert.equal(touristTaxPlaces.find(place=>place.slug===slug)?.katottgSettlementCode,code,`${slug} should resolve via the exact locality, oblast, and community after dropping only its editorial parenthetical`);
  for(const slug of ['kolochava-muzeyi','opishnya-muzey','skhidnytsya-selyshche'])assert.equal(touristTaxPlaces.find(place=>place.slug===slug)?.katottgSettlementCode,null,`${slug} must not duplicate an existing settlement code`);
  assert.ok(touristTaxPlaces.find(place=>place.slug==='kyyiv')?.katottgSettlementCode,'Kyiv must retain its special-city code');
  assert.ok(touristTaxPlaces.filter(place=>place.district).every(place=>place.district.endsWith(' район')),'district labels should come from official KATOTTG names');
  assert.equal(touristTaxCommunities.filter(community=>community.katottgCode).length,279);
  const ivanoFrankivskSolotvyn= touristTaxPlaces.find(place=>place.slug==='huta');
  const zakarpattiaSolotvyn= touristTaxPlaces.find(place=>place.slug==='solotvyno');
  assert.notEqual(ivanoFrankivskSolotvyn.communitySlug,zakarpattiaSolotvyn.communitySlug,'same-name communities in different oblasts must remain separate');
  assert.notEqual(touristTaxCommunities.find(item=>item.slug===ivanoFrankivskSolotvyn.communitySlug).katottgCode,touristTaxCommunities.find(item=>item.slug===zakarpattiaSolotvyn.communitySlug).katottgCode);
  assert.equal(new Set(touristTaxCommunities.map(community=>community.katottgCode).filter(Boolean)).size,touristTaxCommunities.filter(community=>community.katottgCode).length,'mapped community codes must be unique');
  assert.equal(new Set(touristTaxPlaces.map(place=>place.editorial.title)).size,377,'every city route must have a unique title');
  assert.equal(new Set(touristTaxPlaces.map(place=>place.editorial.seoBlock.title)).size,377,'every city route must have a unique H1');
  assert.equal(report.warnings.length,350);
  assert.equal(touristTaxCityRoutes().length,27);
  const unsafe={...touristTaxPlaces[0],readiness:{...touristTaxPlaces[0].readiness,seoQaPassed:false}};
  assert.ok(validateTouristTaxPlaces([unsafe]).errors.some(error=>error.includes('incomplete readiness gates')));
});

test('imported city drafts stay unavailable until explicitly released and verified',()=>{
  const page=renderTouristTaxCity('aktove');
  assert.equal(page,null);
  assert.equal(renderTouristTaxCity('not-a-place'),null);
  const result=calculateTouristTax({placeSlug:'aktove',start:'2026-10-10',days:1,guestGroups:[{category:'domestic',guests:1}]});
  assert.equal(result.state,'RATE_UNVERIFIED');
});

test('review export keeps proposed rates separate from verified rates',()=>{
  const csv=exportTouristTaxReviewCsv();
  assert.match(csv,/proposed_domestic_rate_unverified/);
  assert.match(csv,/"rate_model","rate_schedule","domestic_rate_percent","inbound_rate_percent"/);
  const ternopilRow=csv.split(/\r?\n/).find(line=>line.startsWith('"ternopil"'));
  assert.match(ternopilRow,/"BANDED","\{""thresholdUahPerPersonPerDay"":320/);
  assert.match(ternopilRow,/"","","VERIFIED"/);
  assert.match(csv,/SECONDARY_SOURCE_ONLY/);
  assert.match(csv,/CONFLICT/);
  assert.match(csv,/Актове/);
});

test('Yaremche calculator requires and applies the selected accommodation category',()=>{
  const base={placeSlug:'yaremche',start:'2026-10-18',days:2,guestGroups:[{category:'domestic',guests:1},{category:'inbound',guests:1}]};
  assert.equal(calculateTouristTax(base).state,'INVALID_INPUT','category-based rates must never default silently');
  const hotel=calculateTouristTax({...base,accommodationType:'hotel'});
  assert.equal(hotel.state,'VERIFIED_RESULT');
  assert.equal(hotel.totalCents,'17294');
  assert.equal(hotel.guestGroups[0].ratePercent,0.5);
  assert.equal(hotel.guestGroups[0].accommodationTypeLabel,'Готель');
  const other=calculateTouristTax({...base,accommodationType:'other'});
  assert.equal(other.totalCents,'10376');
  assert.equal(other.guestGroups[1].ratePercent,0.3);
  assert.match(other.guestGroups[1].accommodationTypeLabel,/Мотель/);
  assert.equal(calculateTouristTax({...base,accommodationType:'unknown'}).state,'INVALID_INPUT');
  assert.equal(calculateTouristTax({...base,start:'2027-01-01',accommodationType:'hotel'}).state,'RATE_OUT_OF_PERIOD');
  const page=renderTouristTaxCity('yaremche');
  assert.match(page,/name="accommodationType"/);
  assert.match(page,/0,50% \/ 0,50%/);
  assert.match(page,/0,30% \/ 0,30%/);
  assert.equal(canIndexTouristTaxPlace(touristTaxPlaces.find(place=>place.slug==='yaremche')),true);
});

test('Yasinya 2026 page uses the universal signed DPS row and discloses form conflict',()=>{
  const place=touristTaxPlaces.find(item=>item.slug==='yasinya');
  const community=touristTaxCommunities.find(item=>item.slug===place.communitySlug);
  assert.equal(place.katottgSettlementCode,'UA21060070010074038');
  assert.equal(community.katottgCode,'UA21060070000049340');
  assert.equal(community.taxRule.status,'VERIFIED');
  assert.equal(community.taxRule.decisionNumber,'3860');
  assert.equal(community.taxRule.effectiveFrom,'2026-01-01');
  assert.equal(community.taxRule.effectiveTo,'2026-12-31');
  assert.deepEqual(community.taxRule.rates,{domestic:0.3,inbound:1.0});
  assert.equal(canCalculateTouristTaxPlace(place),true);
  assert.equal(canIndexTouristTaxPlace(place),true);
  assert.equal(hasPlaceSeoBlock(place),true);
  const domestic=calculateTouristTax({placeSlug:'yasinya',start:'2026-10-20',days:3,guestGroups:[{category:'domestic',guests:2}]});
  const inbound=calculateTouristTax({placeSlug:'yasinya',start:'2026-10-20',days:3,guestGroups:[{category:'inbound',guests:2}]});
  const nextYear=calculateTouristTax({placeSlug:'yasinya',start:'2027-01-01',days:1,guestGroups:[{category:'domestic',guests:1}]});
  assert.equal(domestic.totalCents,'15565');
  assert.equal(inbound.totalCents,'51882');
  assert.equal(nextYear.state,'RATE_OUT_OF_PERIOD');
  const page=renderTouristTaxCity('yasinya');
  assert.match(page,/0,30% \/ 1,00%/);
  assert.match(page,/нульов(і|і рядки)/i);
  assert.match(page,/UA21060070010074038/);
});

test('Tyachiv, Irpin and Skole use 2026 DPS city rows and disclose reference conflicts',()=>{
  const cases=[
    {slug:'tyachiv',placeCode:'UA21080150010051267',communityCode:'UA21080150000014443',decision:'2936',rates:{domestic:0.5,inbound:1},inboundCents:'51882',conflict:/нульов.*категор|універсальн.*деталізован/i},
    {slug:'irpin',placeCode:'UA32080150010049888',communityCode:'UA32080150000035443',decision:'3989-52-VIII',rates:{domestic:0.5,inbound:5},inboundCents:'259410',conflict:/попередні довідкові дані|відрізнялися/i},
    {slug:'skole',placeCode:'UA46100190010093837',communityCode:'UA46100190000081766',decision:'5663, 5664, 5662',rates:{domestic:0.5,inbound:2.5},inboundCents:'129705',conflict:/нульов.*категор|міськ.*рядок/i},
  ];
  for(const item of cases){
    const place=touristTaxPlaces.find(candidate=>candidate.slug===item.slug);
    const community=touristTaxCommunities.find(candidate=>candidate.slug===place.communitySlug);
    assert.equal(place.katottgSettlementCode,item.placeCode);
    assert.equal(community.katottgCode,item.communityCode);
    assert.equal(community.taxRule.decisionNumber,item.decision);
    assert.equal(community.taxRule.effectiveFrom,'2026-01-01');
    assert.equal(community.taxRule.effectiveTo,'2026-12-31');
    assert.deepEqual(community.taxRule.rates,item.rates);
    assert.equal(canCalculateTouristTaxPlace(place),true);
    assert.equal(canIndexTouristTaxPlace(place),true);
    assert.equal(hasPlaceSeoBlock(place),true);
    const domestic=calculateTouristTax({placeSlug:item.slug,start:'2026-10-20',days:3,guestGroups:[{category:'domestic',guests:2}]});
    const inbound=calculateTouristTax({placeSlug:item.slug,start:'2026-10-20',days:3,guestGroups:[{category:'inbound',guests:2}]});
    const nextYear=calculateTouristTax({placeSlug:item.slug,start:'2027-01-01',days:1,guestGroups:[{category:'domestic',guests:1}]});
    assert.equal(domestic.totalCents,'25941',`${item.slug} domestic calculation`);
    assert.equal(inbound.totalCents,item.inboundCents,`${item.slug} inbound calculation`);
    assert.equal(nextYear.state,'RATE_OUT_OF_PERIOD',`${item.slug} must fail closed for 2027`);
    const page=renderTouristTaxCity(item.slug);
    assert.ok(page,`${item.slug} page should render`);
    assert.match(page,new RegExp(item.placeCode));
    assert.match(page,item.conflict);
  }
});

test('the ten reviewed city pages have complete metadata, unique canonical URLs and matching structured FAQ data',()=>{
  const slugs=['kyyiv','dnipro','zhytomyr','vynohradiv','yaremche','yasinya','tyachiv','irpin','skole','khust'];
  const titles=new Set();
  const descriptions=new Set();
  for(const slug of slugs){
    const html=renderTouristTaxCity(slug);
    assert.ok(html,`${slug} should render`);
    const title=html.match(/<title>(.*?)<\/title>/)?.[1];
    const description=html.match(/<meta name="description" content="(.*?)">/)?.[1];
    const canonical=html.match(/<link rel="canonical" href="(.*?)">/)?.[1];
    assert.ok(title&&title.length>=45&&title.length<=65,`${slug} title should be a useful search snippet`);
    assert.ok(description&&description.length>=120&&description.length<=160,`${slug} description should fit a search snippet`);
    assert.ok(canonical?.endsWith(`/tourist-tax/${slug}/`),`${slug} canonical should point to its public route`);
    assert.equal((html.match(/<h1\b/g)||[]).length,1,`${slug} should have exactly one H1`);
    assert.match(html,/<meta name="robots" content="index,follow">/);
    assert.equal(titles.has(title),false,`${slug} title should be unique`);
    assert.equal(descriptions.has(description),false,`${slug} description should be unique`);
    titles.add(title);
    descriptions.add(description);

    const match=html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    assert.ok(match,`${slug} should include JSON-LD`);
    const schema=JSON.parse(match[1]);
    assert.equal(schema['@context'],'https://schema.org');
    const page=schema['@graph'].find(item=>item['@type']==='WebPage');
    const breadcrumb=schema['@graph'].find(item=>item['@type']==='BreadcrumbList');
    const faq=schema['@graph'].find(item=>item['@type']==='FAQPage');
    assert.ok(page&&breadcrumb&&faq,`${slug} should include WebPage, BreadcrumbList and FAQPage`);
    assert.equal(page.url,canonical);
    assert.equal(page.name,title);
    assert.equal(page.description,description);
    const visibleQuestions=[...html.matchAll(/<summary>(.*?)<\/summary>/g)].map(item=>item[1]);
    assert.equal(faq.mainEntity.length,visibleQuestions.length,`${slug} structured FAQ count should match visible FAQ`);
    for(let index=0;index<visibleQuestions.length;index++){
      assert.equal(faq.mainEntity[index].name,visibleQuestions[index],`${slug} FAQ question should match visible copy`);
      assert.ok(faq.mainEntity[index].acceptedAnswer.text,`${slug} FAQ answer should be populated`);
    }
    const seo=html.match(/<section class="tt-seo-content"[\s\S]*?<\/section>/)?.[0]??'';
    const seoText=seo.replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
    const seoHeadings=[...seo.matchAll(/<h3\b/g)].length;
    assert.ok(seoText.split(' ').length>=250,`${slug} SEO section should contain substantive page-specific copy`);
    assert.ok(seoHeadings>=5,`${slug} SEO section should use a clear subheading structure`);
    assert.ok([...seo.matchAll(/<h3[^>]*>(.*?)<\/h3>/g)].filter(item=>/приклад розрахунку/i.test(item[1])).length<=1,`${slug} should not repeat its calculation example section`);
  }
});

test('all ten reviewed city calculators return only within their supported 2026 rules',()=>{
  const slugs=['kyyiv','dnipro','zhytomyr','vynohradiv','yaremche','yasinya','tyachiv','irpin','skole','khust'];
  for(const slug of slugs){
    const result=calculateTouristTax({placeSlug:slug,start:'2026-10-20',days:2,guestGroups:[{category:'domestic',guests:2}],...(slug==='dnipro'?{accommodationPricePerPersonPerDay:'500'}:{}),...(slug==='yaremche'?{accommodationType:'other'}:{})});
    assert.equal(result.state,'VERIFIED_RESULT',`${slug} should calculate for its confirmed 2026 rule`);
    assert.ok(BigInt(result.totalCents)>0n,`${slug} should return a positive exact amount`);
    const nextYear=calculateTouristTax({placeSlug:slug,start:'2027-01-01',days:1,guestGroups:[{category:'domestic',guests:1}],...(slug==='dnipro'?{accommodationPricePerPersonPerDay:'500'}:{}),...(slug==='yaremche'?{accommodationType:'other'}:{})});
    assert.equal(nextYear.state,'RATE_OUT_OF_PERIOD',`${slug} should stop at the end of the verified tax year`);
  }
  const dnieproBoundary=calculateTouristTax({placeSlug:'dnipro',start:'2026-10-20',days:1,guestGroups:[{category:'domestic',guests:1}],accommodationPricePerPersonPerDay:'200'});
  assert.equal(dnieproBoundary.state,'RATE_THRESHOLD_AMBIGUOUS');
  const yaremcheMissingType=calculateTouristTax({placeSlug:'yaremche',start:'2026-10-20',days:1,guestGroups:[{category:'domestic',guests:1}]});
  assert.equal(yaremcheMissingType.state,'INVALID_INPUT');
});
