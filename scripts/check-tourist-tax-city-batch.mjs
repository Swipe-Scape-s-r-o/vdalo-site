import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import workbook from '../versions/v1/tourist-tax-workbook-data.json' with {type:'json'};
import {renderTouristTaxCity,renderTouristTaxHub} from '../versions/v1/tourist-tax.mjs';
import {touristTaxPlaces,touristTaxCommunities,touristTaxCityRoutes,touristTaxSources,validateTouristTaxPlaces,hasPlaceSeoBlock,canCalculateTouristTaxPlace,canIndexTouristTaxPlace} from '../versions/v1/tourist-tax-data.mjs';
import {touristTaxReleasePlan} from '../versions/v1/tourist-tax-release.mjs';

const report=validateTouristTaxPlaces();
assert.equal(report.ok,true,report.errors.join('\n'));
assert.equal(touristTaxPlaces.length,377);
assert.equal(touristTaxCommunities.length,280);
assert.equal(touristTaxSources.katottg.imported,true);
assert.equal(touristTaxPlaces.filter(place=>place.katottgSettlementCode).length,365);
assert.equal(touristTaxCommunities.filter(community=>community.katottgCode).length,279);
assert.equal(touristTaxReleasePlan.waves[0].candidateSlugs.length,30);
assert.equal(touristTaxReleasePlan.waves[0].publishedSlugs.length,21);
assert.equal(touristTaxCityRoutes().length,28,'only released and fully verified places enter public routes and sitemap');

const preparedBySlug=new Map(workbook.places.map(place=>[place.slug,place]));
const publicPlaces=touristTaxPlaces.filter(place=>canIndexTouristTaxPlace(place));
for(const place of touristTaxPlaces){
  assert.equal(hasPlaceSeoBlock(place),true,`missing editorial draft SEO block: ${place.slug}`);
  const html=renderTouristTaxCity(place.slug);
  if(!canIndexTouristTaxPlace(place)){
    assert.equal(html,null,`unreleased city page must return no HTML: ${place.slug}`);
    assert.equal(canCalculateTouristTaxPlace(place),false,`unreleased place must not pass calculator gate: ${place.slug}`);
    continue;
  }
  assert.ok(html,`missing published page render: ${place.slug}`);
  assert.equal((html.match(/<h1\b/g)||[]).length,1,`expected exactly one H1 for ${place.slug}`);
  assert.match(html,/<title>[^<]{20,120}<\/title>/,`missing or overlong title for ${place.slug}`);
  assert.match(html,/<meta name="description" content="[^\"]{80,180}">/,`missing or overlong description for ${place.slug}`);
  assert.match(html,new RegExp(`<link rel="canonical" href="https://www\\.vdalo\\.tech${place.route.replaceAll('/','\\/')}">`),`bad canonical: ${place.slug}`);
  assert.match(html,/<meta name="robots" content="index,follow">/);
  assert.doesNotMatch(html,/noindex/i);
  assert.match(html,/<section class="tt-seo-content" aria-labelledby="tt-city-seo-title">/);
  const prepared=preparedBySlug.get(place.slug)?.preparedSeo??{};
  for(const field of ['intro','calculator','exemptions','agents','faq','faqJsonLd']){
    const unreviewed=String(prepared[field]??'').trim();
    if(unreviewed.length>80)assert.ok(!html.includes(unreviewed),`unreviewed workbook field leaked into ${place.slug}`);
  }
  assert.doesNotMatch(html,/(?<![A-Z0-9])8\s?000(?!\d)/i,`outdated wage leaked into ${place.slug}`);
}

const hub=renderTouristTaxHub();
const hubConfig=JSON.parse(hub.match(/<script type="application\/json" id="tourist-tax-config">([^<]+)<\/script>/)[1]);
assert.deepEqual(hubConfig.publicPlaces.map(place=>place.slug).sort(),publicPlaces.map(place=>place.slug).sort());
for(const slug of ['bukovel','bar','aktove'])assert.doesNotMatch(hub, new RegExp(`tourist-tax/${slug}/`),`hub links to unreleased place ${slug}`);
assert.match(hub,/tourist-tax\/yaremche\//,'verified Yaremche route should be linked from the city directory');
assert.match(hub,/tourist-tax\/yasinya\//,'verified Yasinya route should be linked from the city directory');
for(const slug of ['tyachiv','irpin','skole'])assert.match(hub,new RegExp(`tourist-tax/${slug}/`),`verified ${slug} route should be linked from the city directory`);
const browserSearch=await readFile(new URL('../versions/v1/public/tourist-tax.js',import.meta.url),'utf8');
assert.match(browserSearch,/matches\.slice\(0, 6\)/,'directory should limit suggestions');
assert.equal(renderTouristTaxCity('missing-city-slug'),null);

console.log(JSON.stringify({ok:true,places:touristTaxPlaces.length,plannedWaveOne:touristTaxReleasePlan.waves[0].candidateSlugs.length,publishedAndIndexable:publicPlaces.length,unreleasedAndUnavailable:touristTaxPlaces.length-publicPlaces.length,publicCityRoutes:touristTaxCityRoutes().length,reviewWarnings:report.warnings.length},null,2));
