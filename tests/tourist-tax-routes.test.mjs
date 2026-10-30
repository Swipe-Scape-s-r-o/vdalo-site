import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {assetVersion} from '../versions/v1/assets.mjs';

process.env.VERCEL='1';
const {default:server}=await import('../server.mjs');
const {touristTaxPlaces,touristTaxCityRoutes,touristTaxBatch004Places,touristTaxBatch004Routes,touristTaxBatch004WithheldNoNumericRateRows,canIndexTouristTaxPlace,getTouristTaxBatch004RateModel}=await import('../versions/v1/tourist-tax-data.mjs');
const {getPreparedPage}=await import('../versions/v1/content-revisions/content.mjs');

async function request(url,method='GET',host='www.vdalo.tech'){
  const req={url,method,headers:{host},on(){},once(){},resume(){}};
  let status=0,headers={},body='';
  const res={writeHead(code,value={}){status=code;headers=value;},end(value){if(value)body=Buffer.isBuffer(value)?value.toString('utf8'):String(value);}};
  await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error(`No response for ${url}`)),3000);
    res.end=value=>{if(value)body=Buffer.isBuffer(value)?value.toString('utf8'):String(value);clearTimeout(timer);resolve();};
    server.emit('request',req,res);
  });
  return {status,headers,body};
}

test('batch 24 and 25 pages are public preliminary references with clear warnings and no calculator',async()=>{
  const {touristTaxBatch24_25PreviewSlugs}=await import('../versions/v1/tourist-tax.mjs');
  const {touristTaxBatch24_25Drafts}=await import('../versions/v1/tourist-tax-draft-batch24-25.mjs');
  const {touristTaxPlaces,touristTaxCommunities}=await import('../versions/v1/tourist-tax-data.mjs');
  const slugs=touristTaxBatch24_25PreviewSlugs();
  assert.equal(slugs.length,20,'both research batches must have exactly 20 preview routes');
  assert.equal(new Set(slugs).size,20,'preview slugs must be unique');
  const titles=new Set();
  for(const slug of slugs){
    const place=touristTaxPlaces.find(item=>item.slug===slug);
    const community=touristTaxCommunities.find(item=>item.slug===place?.communitySlug);
    assert.ok(place&&community,`${slug} must map to a known locality and community`);
    assert.equal(place.indexable,false,`${slug} must remain non-indexable`);
    const route=place.route;
    const preview=await request(route,'GET','staging.vdalo.tech');
    const previewHtml=preview.body.replaceAll('&#39;',"'");
    assert.equal(preview.status,200,`${route} should resolve on staging`);
    assert.match(preview.body,/name="robots" content="noindex,nofollow"/);
    assert.match(preview.body,/ПОПЕРЕДНІ ДАНІ · ПЕРЕВІРКА ТРИВАЄ/);
    assert.match(previewHtml,new RegExp(place.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
    assert.match(previewHtml,new RegExp(community.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
    assert.match(preview.body,new RegExp(`<link rel="canonical" href="https://www\\.vdalo\\.tech${route.replaceAll('/','\\/')}"`),'public page should have a canonical URL');
    assert.ok(preview.body.includes(touristTaxBatch24_25Drafts[slug].sourceUrl),`${slug} must link to its review source`);
    assert.match(preview.body,/Поширені запитання/);
    assert.equal((preview.body.match(/<details(?:\s|>)/g)||[]).length,4,`${slug} should render four useful FAQs`);
    assert.match(preview.body,/Яка ставка туристичного збору діє (?:у|в) /,'visible questions should explain the unverified status');
    assert.doesNotMatch(previewHtml,/Туристичний збір (?:у|в) (?:у|в) /,'location phrases must not repeat the preposition');
    assert.doesNotMatch(preview.body,/id="tt-calculator"|name="accommodationType"/,'a preliminary page must not offer a tax calculator');
    assert.match(preview.body,/id="home-trial-offer"/,'a public tourist-tax page should receive the ordinary sitewide conversion dialog');
    assert.match(preview.body,/Попередні значення зі зведених матеріалів|Ставка потребує додаткової звірки/);
    assert.match(preview.body,/Не використовуйте їх для нарахування чи сплати збору/);
    assert.match(preview.body,/VDALO не несе відповідальності за неточності/);
    for(const category of ['domestic','inbound']){
      const proposedRate=place.sourceRecord?.proposedRates?.[category];
      assert.ok(Number.isFinite(proposedRate),`${slug} needs an analyzed ${category} rate before inclusion in this batch`);
      const renderedRate=`${new Intl.NumberFormat('uk-UA',{maximumFractionDigits:2}).format(proposedRate)}%`;
      assert.ok(preview.body.includes(renderedRate),`${slug} should show its analyzed ${category} rate as a preliminary value`);
    }
    assert.match(preview.body,/Самостійно звірте місцеве рішення/);
    assert.match(preview.body,/Не покладайтеся лише на цей матеріал/);
    assert.match(preview.body,/tax\.gov\.ua\/nk\/rozdil-xii--mistsevi-podatki-i/);
    const title=preview.body.match(/<title>([^<]+)<\/title>/)?.[1];
    assert.ok(title,`${slug} must have a title`);
    assert.ok(!titles.has(title),`${slug} should have a unique title`);
    titles.add(title);
    const production=await request(route,'GET','www.vdalo.tech');
    assert.equal(production.status,200,`${route} should be available on the public host`);
    assert.match(production.body,/name="robots" content="index,follow"/);
    assert.match(production.body,new RegExp(`<link rel="canonical" href="https://www\\.vdalo\\.tech${route.replaceAll('/','\\/')}"`));
    assert.doesNotMatch(production.body,/id="tt-calculator"/);
    assert.match(production.body,/Попередні значення зі зведених матеріалів|Ставка потребує додаткової звірки/);
  }
  const izyaslav=await request('/tourist-tax/izyaslav/','GET','staging.vdalo.tech');
  assert.equal(izyaslav.status,200);
  assert.match(izyaslav.body,/<title>Туристичний збір в Ізяславі: 2026 \| VDALO<\/title>/);
  assert.match(izyaslav.body,/<h1>Туристичний збір в Ізяславі на 2026 рік<\/h1>/);
  assert.doesNotMatch(izyaslav.body,/Туристичний збір у Ізяславі/);
});

test('hub, city, assets and sitemap resolve through the actual app router',async()=>{
  const hub=await request('/tourist-tax/');
  assert.equal(hub.status,200);
  assert.match(hub.body,/<h1>Туристичний збір в Україні у 2026 році: довідник громад і розрахунок<\/h1>/);
  assert.match(hub.body,/У довіднику 1184 локацій/);
  assert.match(hub.body,/tourist-tax-assets\/tourist-tax\.css\?v=[a-f0-9]+/,'the standalone tax stylesheet must be cache-versioned after updates');
  assert.match(hub.body,new RegExp(`tourist-tax-assets/tourist-tax\\.js\\?v=${assetVersion('tourist-tax.js')}`),'the calculator script URL must change whenever its bytes change');
  assert.ok(hub.body.indexOf('class="tt-infographic"')<hub.body.indexOf('id="tt-calculator"'));
  assert.ok(hub.body.indexOf('id="tt-calculator"')<hub.body.indexOf('class="tt-section tt-directory"'));
  assert.ok(hub.body.lastIndexOf('class="tt-sources"')>hub.body.indexOf('class="tt-seo-content"'));
  assert.match(hub.body,/tax\.gov\.ua\/rishennya-mistsevih-rad-/);
  assert.match(hub.body,/rada\/show\/v0011201-11/);
  assert.match(hub.body,/Реквізити для оплати залежать від громади/);
  assert.match(hub.body,/href="\/tourist-tax\/rates\/"/,'hub should link to the confirmed rates register');
  assert.match(hub.body,/href="\/tourist-tax\/kitsman\/"/);
  assert.match(hub.body,/href="\/tourist-tax\/tsarychanka\/"/);
  assert.doesNotMatch(hub.body,/Сторінки, що проходять перевірку|Попередні дані, перевірка триває/);
  const city=await request('/tourist-tax/lutsk/');
  assert.equal(city.status,200);
  assert.match(city.body,/index,follow/);
  assert.match(city.body,/Розрахуйте туристичний збір/);
  assert.match(city.body,/tax\.gov\.ua\/rishennya-mistsevih-rad-/);
  assert.match(city.body,/Ставку звірено 14 жовтня 2026 року/);
  assert.match(city.body,/Наступна планова перевірка джерел: до 1 грудня 2026 року/);
  assert.match(city.body,/а не гарантія незмінності ставки/);
  assert.match(city.body,/href="\/tourist-tax\/rates\/"/,'published city pages should link to the register');
  for(const slug of ['sumy','vinnytsya','pivdenne','ternopil','zaporizhzhya','rivne','chernihiv','kolomyya','ivano-frankivsk','chernivtsi','lviv','cherkasy','berehove','uzhhorod','slavsko','vynohradiv','yasinya','tyachiv','irpin','skole','odesa']){
    const verifiedCity=await request(`/tourist-tax/${slug}/`);
    assert.equal(verifiedCity.status,200);
    assert.match(verifiedCity.body,/name="robots" content="index,follow"/);
    assert.match(verifiedCity.body,/Розрахуйте туристичний збір/);
    assert.match(verifiedCity.body,/href="\/tourist-tax\/rates\/"/);
    assert.match(verifiedCity.body,slug==='odesa'?/Ставку звірено 26 жовтня 2026 року/:['vynohradiv','yasinya','tyachiv','irpin','skole'].includes(slug)?/Ставку звірено 18 жовтня 2026 року/:/Ставку звірено 14 жовтня 2026 року/);
    assert.match(verifiedCity.body,/Наступна планова перевірка джерел: до 1 грудня 2026 року/);
  }
  const pendingCity=await request('/tourist-tax/aktove/');
  assert.equal(pendingCity.status,200,'a locality with an approved non-empty rate field should have a page');
  assert.match(pendingCity.body,/name="robots" content="index,follow"/);
  assert.doesNotMatch(pendingCity.body,/VDALO_PARTIAL_RATE_DATA|READY_FROM_DPS_FILE|Статус даних:/);
  assert.match(pendingCity.body,/Попередні дані · перевірка триває/);
  assert.match(pendingCity.body,/id="tourist-tax-calculator"/,'the unambiguous preliminary rate should have a calculator');
  assert.match(pendingCity.body,/Дані ще перебувають на стадії підтвердження/);
  assert.match(pendingCity.body,/Сума є попередньою\. Перед нарахуванням або сплатою звірте ставку/u);
  for(const slug of ['bukovel']){
    const unreleased=await request(`/tourist-tax/${slug}/`);
    assert.equal(unreleased.status,404,`${slug} is not approved for the current release wave`);
    assert.match(unreleased.body,/name="robots" content="noindex,follow"/);
    assert.match(unreleased.body,/Сторінку не знайдено/);
  }
  const hubConfig=JSON.parse(hub.body.match(/<script type="application\/json" id="tourist-tax-config">([^<]+)<\/script>/)[1]);
  assert.deepEqual(hubConfig.publicPlaces.map(place=>place.slug).sort(),['berehove','cherkasy','chernihiv','chernivtsi','dnipro','irpin','ivano-frankivsk','khust','kolomyya','kyyiv','lutsk','lviv','odesa','pivdenne','polyana','rivne','skole','slavsko','sumy','ternopil','tyachiv','uzhhorod','vinnytsya','vynohradiv','yaremche','yasinya','zaporizhzhya','zhytomyr']);
  assert.equal(hubConfig.preliminaryPlaces.length,20);
  assert.equal(hubConfig.batchPlaces.length,1136,'only batch rows with numeric rate text should be public');
  assert.ok(hubConfig.batchPlaces.every(place=>place.route&&place.verified===false));
  assert.equal(hubConfig.batchPlaces.length,1136,'the calculator should include the same released numeric-rate locations');
  assert.equal(hubConfig.batchPlaces.filter(place=>place.calculatorAvailable).length,1135,'all numeric rates in the batch are calculable except the existing Bar review gate');
  assert.equal(hubConfig.batchPlaces.filter(place=>place.calculatorUnavailableReason==='GEO_REVIEW').length,1);
  assert.ok(hubConfig.preliminaryPlaces.every(place=>place.verified===false));
  for(const withheld of touristTaxBatch004WithheldNoNumericRateRows){
    const removed=await request(withheld.route);
    assert.equal(removed.status,404,`${withheld.slug} should not resolve publicly`);
    assert.ok(!hub.body.includes(withheld.route),`${withheld.slug} should not appear in the catalogue`);
  }
  const yaremche=await request('/tourist-tax/yaremche/');
  assert.equal(yaremche.status,200);
  assert.match(yaremche.body,/name="accommodationType"/);
  assert.match(yaremche.body,/UA26120150010047425/);
  const yasinya=await request('/tourist-tax/yasinya/');
  assert.equal(yasinya.status,200);
  assert.match(yasinya.body,/0,30% \/ 1,00%/);
  assert.match(yasinya.body,/UA21060070010074038/);
  assert.match(yasinya.body,/Наступна планова перевірка джерел: до 1 грудня 2026 року/);
  assert.doesNotMatch(hub.body,/tourist-tax\/bukovel\//);
  const css=await request('/tourist-tax-assets/tourist-tax.css');
  assert.equal(css.status,200);
  assert.match(css.headers['Content-Type'],/text\/css/);
  const interactions=await request('/tourist-tax-assets/tourist-tax-interactions.css');
  assert.equal(interactions.status,200);
  const js=await request('/tourist-tax-assets/tourist-tax.js');
  assert.equal(js.status,200);
  const sitemap=await request('/sitemap.xml');
  assert.match(sitemap.body,/<loc>https:\/\/www\.vdalo\.tech\/tourist-tax\/rates\/<\/loc>/,'the public confirmed rates register should be in the sitemap');
  assert.equal(sitemap.status,200);
  assert.match(sitemap.body,/https:\/\/www\.vdalo\.tech\/tourist-tax\//);
  assert.match(sitemap.body,/tourist-tax\/lutsk/);
  assert.match(sitemap.body,/tourist-tax\/aktove/,'approved batch rows with rate text should enter the sitemap');
  for(const withheld of touristTaxBatch004WithheldNoNumericRateRows)assert.ok(!sitemap.body.includes(withheld.route),`${withheld.slug} must not enter the sitemap`);
  const citySitemapEntries=[...sitemap.body.matchAll(/<loc>https:\/\/www\.vdalo\.tech\/tourist-tax\/(?!rates\/|start<\/loc>)[^<]+<\/loc>/g)];
  const expectedTaxRoutes=new Set([...touristTaxCityRoutes(),...touristTaxBatch004Routes,...(await import('../versions/v1/tourist-tax.mjs')).touristTaxBatch24_25PreviewSlugs().map(slug=>`/tourist-tax/${slug}/`)]);
  assert.equal(citySitemapEntries.length,expectedTaxRoutes.size,'the sitemap should include published, approved preliminary, and batch004 routes exactly once');
  assert.equal(new Set(citySitemapEntries.map(entry=>entry[0])).size,citySitemapEntries.length,'the sitemap must not contain duplicate tourist-tax URLs');
  for(const slug of ['kyyiv','sumy','vinnytsya','pivdenne','ternopil','zaporizhzhya','rivne','chernihiv','kolomyya','ivano-frankivsk','chernivtsi','lviv','cherkasy','berehove','uzhhorod','slavsko','dnipro','zhytomyr','vynohradiv','yasinya','tyachiv','irpin','skole'])assert.match(sitemap.body,new RegExp(`tourist-tax/${slug}/`));
  const preliminarySlugs=(await import('../versions/v1/tourist-tax.mjs')).touristTaxBatch24_25PreviewSlugs();
  for(const place of touristTaxPlaces.filter(place=>!canIndexTouristTaxPlace(place)&&!preliminarySlugs.includes(place.slug)&&!touristTaxBatch004Routes.includes(place.route)))assert.doesNotMatch(sitemap.body,new RegExp(`tourist-tax/${place.slug}/`),`sitemap contains unreleased place: ${place.slug}`);
});

test('rates register exposes the 48 existing records and all batch004 locality rates',async()=>{
  const response=await request('/tourist-tax/rates/');
  const {touristTaxBatch24_25PreviewSlugs}=await import('../versions/v1/tourist-tax.mjs');
  const {touristTaxBatch24_25Drafts}=await import('../versions/v1/tourist-tax-draft-batch24-25.mjs');
  assert.equal(response.status,200);
  assert.match(response.body,/<title>Туристичний збір 2026: реєстр ставок \| VDALO<\/title>/);
  assert.match(response.body,/<meta name="robots" content="index,follow">/);
  assert.match(response.body,/<link rel="canonical" href="https:\/\/www\.vdalo\.tech\/tourist-tax\/rates\/">/);
  assert.match(response.body,/Реєстр ставок туристичного збору на 2026 рік за 1184 локаціями/);
  assert.match(response.body,new RegExp(`<script src="\\/tourist-tax-assets\\/tourist-tax-rates\\.js\\?v=${assetVersion('tourist-tax-rates.js')}" defer><\\/script>`),'the rates filter script URL must change whenever its bytes change');
  assert.match(response.body,/Пошук за містом, громадою або КАТОТТГ/);
  assert.match(response.body,/id="tt-rates-year"/);
  assert.match(response.body,/Категорія туризму/);
  assert.match(response.body,/id="tt-rates-status"/);
  assert.match(response.body,/Джерело та примітка/);
  assert.equal((response.body.match(/class="tt-rates-status(?: is-review)?"/g)||[]).length,1184);
  assert.equal((response.body.match(/class="tt-rates-status"/g)||[]).length,28,'28 entries should show confirmed status');
  assert.equal((response.body.match(/class="tt-rates-status is-review"/g)||[]).length,1156,'existing preliminary rows and new batch rows should show review status');
  for(const place of touristTaxPlaces.filter(place=>canIndexTouristTaxPlace(place))) assert.ok(response.body.includes(`href="${place.route}"`),`${place.slug} should appear in the register`);
  for(const slug of touristTaxBatch24_25PreviewSlugs()){
    const place=touristTaxPlaces.find(item=>item.slug===slug);
    const row=response.body.split('<tr data-search="').find(item=>item.includes(`href="${place.route}"`))||'';
    const rates=place.sourceRecord.proposedRates;
    const rateLabel=value=>new Intl.NumberFormat('uk-UA',{minimumFractionDigits:2,maximumFractionDigits:2}).format(value);
    assert.ok(row,`${slug} should appear in the register`);
    const rateLines=row.match(/<ul class="tt-batch-rate-lines">([\s\S]*?)<\/ul>/)?.[1]||'';
    assert.ok(rateLines.includes(`${rateLabel(rates.domestic)}%`)&&rateLines.includes(`${rateLabel(rates.inbound)}%`),`${slug} should preserve collected preliminary rates on separate lines`);
    assert.match(row,/Попередні дані · перевірка триває/);
    assert.ok(row.includes(touristTaxBatch24_25Drafts[slug].sourceUrl),`${slug} should link to its source`);
  }
  assert.match(response.body,/1184 локацій/);
  assert.match(response.body,/28<\/strong> перевірених/);
  assert.match(response.body,/1156 попередніх або таких, що потребують звірки/);
  assert.match(response.body,/href="\/tourist-tax\/odesa\/"/,'the verified Odesa page should be listed in the rates register');
  const renderedRows=[...response.body.matchAll(/<tr data-search="[\s\S]*?<\/tr>/g)].map(match=>match[0]);
  const rowsByRoute=new Map(renderedRows.map(row=>[row.match(/<a href="([^"]+)"/)?.[1],row]));
  assert.equal(rowsByRoute.size,1184,'every register row should have a unique locality route');
  for(const row of rowsByRoute.values()){
    const rateMarkup=row.match(/<ul class="tt-batch-rate-lines">([\s\S]*?)<\/ul>/)?.[1]||'';
    for(const line of rateMarkup.matchAll(/<li>([\s\S]*?)<\/li>/g))assert.ok((line[1].match(/\d+(?:[,.]\d+)?\s*%/gu)||[]).length<=1,'the register should put each percentage on its own line');
  }
  for(const place of touristTaxBatch004Places){
    const row=rowsByRoute.get(place.route);
    assert.ok(row,`${place.slug} should appear in the register`);
    const rateMarkup=row.match(/<ul class="tt-batch-rate-lines">([\s\S]*?)<\/ul>/)?.[1]||'';
    for(const [rate] of place.rateText.matchAll(/\d+(?:[,.]\d+)?\s*%/gu))assert.ok(rateMarkup.includes(rate.replace(/\./g,',')),`${place.slug} should preserve approved rate ${rate}`);
    assert.match(row,/data-status="review"/);
    assert.match(row,/Попередні дані · перевірка триває/);
  }
  for(const withheld of touristTaxBatch004WithheldNoNumericRateRows)assert.ok(!rowsByRoute.has(withheld.route),`${withheld.slug} must not appear in the rates register`);
  const odesaRow=response.body.match(/<tr data-search="[^"]*одеса[^"]*"[\s\S]*?<\/tr>/)?.[0]||'';
  assert.match(odesaRow,/Перевірено/);
  assert.match(odesaRow,/0,50%/);
  assert.match(odesaRow,/1,00%/);
  assert.match(odesaRow,/з 16 липня/);
  assert.ok(response.body.includes('href="/tourist-tax/aktove/"'),'the newly released Aktove locality should appear in the expanded register');
  const asset=await request('/tourist-tax-assets/tourist-tax-rates.js');
  assert.equal(asset.status,200);
  assert.match(asset.body,/tt-rates-filters/);
  const noSlash=await request('/tourist-tax/rates');
  assert.equal(noSlash.status,308);
  assert.equal(noSlash.headers.Location,'/tourist-tax/rates/');
});

test('tourist-tax funnel route is served with analytics, privacy, accessibility and both video assets',async()=>{
  const funnel=await request('/tourist-tax/start');
  assert.equal(funnel.status,200);
  assert.ok(funnel.body.includes(`<title>${getPreparedPage('/tourist-tax/start').title}</title>`));
  assert.match(funnel.body,/<meta name="robots" content="index,follow">/);
  assert.match(funnel.body,/<link rel="canonical" href="https:\/\/www\.vdalo\.tech\/tourist-tax\/start">/);
  assert.match(funnel.body,/GTM-PKDT7MMT/);
  assert.match(funnel.body,/href="\/privacy"/);
  assert.match(funnel.body,/id="ttf-phone" name="phone" type="tel"/);
  assert.match(funnel.body,/id="ttf-consent" type="checkbox" required/);
  assert.match(funnel.body,/id="ttf-error" role="alert"/);
  assert.match(funnel.body,/id="ttf-result" tabindex="-1" role="status"/);
  assert.match(funnel.body,/tourist_tax_ab_exposure/);
  assert.match(funnel.body,/tourist_tax_lead_submit/);
  assert.match(funnel.body,/prefers-reduced-motion: reduce/);
  assert.doesNotMatch(funnel.body,/<video[^>]+autoplay/);
  for(const name of ['t-tax-docs-pile.mp4','t-tax-reports.mp4']){
    assert.ok(existsSync(fileURLToPath(new URL(`../microlandings/public/top5/${name}`,import.meta.url))),`${name} must be present on disk`);
    const video=await request(`/sms-trial-assets/top5/${name}`,'HEAD');
    assert.equal(video.status,200,`${name} should resolve from the public asset route`);
    assert.match(video.headers['Content-Type'],/video\/mp4/);
  }
  const sitemap=await request('/sitemap.xml');
  assert.match(sitemap.body,/https:\/\/www\.vdalo\.tech\/tourist-tax\/start<\/loc>/,'the indexable tourist-tax guide must appear in the sitemap');
});

test('only released city routes resolve through the actual app router',async()=>{
  const preliminarySlugs=new Set((await import('../versions/v1/tourist-tax.mjs')).touristTaxBatch24_25PreviewSlugs());
  for(const place of touristTaxPlaces){
    const response=await request(place.route);
    if(canIndexTouristTaxPlace(place)){
      assert.equal(response.status,200,`released route failed: ${place.route}`);
      assert.match(response.body,/<link rel="canonical" href="https:\/\/www\.vdalo\.tech/);
      assert.match(response.body,/name="robots" content="index,follow"/);
      assert.match(response.body,/class="tt-seo-content"/,`city SEO block missing: ${place.slug}`);
      const title=response.body.match(/<title>([^<]+)<\/title>/)?.[1]||'';
      assert.ok(title.length<=65,`city title should stay concise: ${place.slug} (${title.length} chars)`);
      if(getPreparedPage(place.route))assert.equal(title,getPreparedPage(place.route).title);
      else if(place.slug==='kyyiv')assert.match(title,/Туристичний збір у Києві 2026: ставки та калькулятор \| VDALO/);
       else if(place.slug==='odesa')assert.match(title,/Туристичний збір в Одесі у 2026 році: ставки та калькулятор \| VDALO/);
       else if(place.slug==='polyana')assert.match(title,/Туристичний збір у Поляні у 2026 році \| Ставки/);
       else if(place.slug==='khust')assert.match(title,/Туристичний збір у Хусті на 2026 рік: ставки й калькулятор/);
      else if(['tyachiv','irpin','skole'].includes(place.slug))assert.match(title,new RegExp(`Туристичний збір .* 2026: .* \\| VDALO`));
      else assert.match(title,/Туристичний збір .+2026.+/);
    }else if(touristTaxBatch004Routes.includes(place.route)){
      assert.equal(response.status,200,`approved batch route failed: ${place.route}`);
      assert.match(response.body,/name="robots" content="index,follow"/);
      if(getTouristTaxBatch004RateModel(place.slug)){
        assert.match(response.body,/id="tourist-tax-calculator"/);
        assert.match(response.body,/Дані ще перебувають на стадії підтвердження/);
      }else assert.doesNotMatch(response.body,/id="tourist-tax-calculator"/);
    }else if(preliminarySlugs.has(place.slug)){
      assert.equal(response.status,200,`preliminary public route failed: ${place.route}`);
      assert.match(response.body,/name="robots" content="index,follow"/);
      assert.match(response.body,/Попередні значення зі зведених матеріалів|Ставка потребує додаткової звірки/);
      assert.match(response.body,/Самостійно звірте місцеве рішення/);
      assert.doesNotMatch(response.body,/id="tt-calculator"/);
    }else{
      assert.equal(response.status,404,`unreleased route should be unavailable: ${place.route}`);
      assert.match(response.body,/name="robots" content="noindex,follow"/);
      assert.match(response.body,/Сторінку не знайдено/);
    }
  }
  const sitemap=await request('/sitemap.xml');
  for(const place of touristTaxBatch004Places){
    const response=await request(place.route);
    assert.equal(response.status,200,`approved batch route failed: ${place.route}`);
    assert.match(response.body,/name="robots" content="index,follow"/);
    assert.ok(response.body.includes(`href="https://www.vdalo.tech${place.route}"`),`${place.route} should have its canonical URL`);
    const rateMarkup=response.body.match(/<ul class="tt-batch-rate-lines">([\s\S]*?)<\/ul>/)?.[1]||'';
    for(const [rate] of place.rateText.matchAll(/\d+(?:[,.]\d+)?\s*%/gu))assert.ok(rateMarkup.includes(rate.replace(/\./g,',')),`${place.route} should preserve approved rate ${rate}`);
    assert.ok(sitemap.body.includes(`<loc>https://www.vdalo.tech${place.route}</loc>`),`${place.route} should be in the sitemap`);
  }
});

test('calculation API accepts same-origin minimal inputs and fails closed',async()=>{
  const body={placeSlug:'lutsk',start:'2026-10-10',end:'2026-10-13',nights:3,guests:2,category:'domestic',exemption:'none'};
  const send=async({origin='https://www.vdalo.tech',method='POST',contentType='application/json',payload=JSON.stringify(body),host='www.vdalo.tech'}={})=>{
    const req=Readable.from([payload]);req.url='/api/tourist-tax/calculate';req.method=method;req.headers={origin,host,'content-type':contentType,'content-length':String(Buffer.byteLength(payload))};
    let status,content='';const res={writeHead(code){status=code;},end(value){content=String(value??'');}};
    await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error('API response timeout')),3000);res.end=value=>{content=String(value??'');clearTimeout(timeout);resolve();};server.emit('request',req,res);});
    return {status,body:JSON.parse(content)};
  };
  const calculation=await send();
  assert.equal(calculation.status,200);
  assert.equal(calculation.body.state,'VERIFIED_RESULT');
  assert.equal(calculation.body.totalCents,'25941');
  const preliminaryAktove=await send({payload:JSON.stringify({placeSlug:'aktove',start:'2026-10-10',days:1,guestGroups:[{category:'domestic',guests:1}]})});
  assert.equal(preliminaryAktove.status,200);
  assert.equal(preliminaryAktove.body.state,'PRELIMINARY_RESULT');
  assert.equal(preliminaryAktove.body.totalCents,'4324');
  assert.equal(preliminaryAktove.body.verificationStatus,'PRELIMINARY');
  assert.match(preliminaryAktove.body.warning,/не для нарахування чи сплати/u);
  const unsupportedResponse=await send({payload:JSON.stringify({placeSlug:'bar',start:'2026-10-10',days:1,guestGroups:[{category:'domestic',guests:1}]})});
  assert.equal(unsupportedResponse.status,200);
  assert.equal(unsupportedResponse.body.state,'AMBIGUOUS_PLACE');
  const odesaOfficial=await send({payload:JSON.stringify({placeSlug:'odesa',start:'2026-10-10',days:1,guestGroups:[{category:'inbound',guests:1}]})});
  assert.equal(odesaOfficial.status,200);
  assert.equal(odesaOfficial.body.state,'VERIFIED_RESULT');
  assert.equal(odesaOfficial.body.totalCents,'8647');
  const wrongPlaceScenario=await send({payload:JSON.stringify({placeSlug:'kyyiv',start:'2026-10-10',days:1,guestGroups:[{category:'inbound',guests:1}],scenario:'odesa-inbound-1-percent'})});
  assert.equal(wrongPlaceScenario.body.state,'INVALID_INPUT');
  const ternopilPayload={...body,placeSlug:'ternopil',start:'2026-10-10',end:undefined,nights:undefined,days:2,guestGroups:[{category:'domestic',guests:1}],accommodationPricePerPersonPerDay:'300.00'};
  const ternopilResponse=await send({payload:JSON.stringify(ternopilPayload)});
  assert.equal(ternopilResponse.status,200);
  assert.equal(ternopilResponse.body.state,'VERIFIED_RESULT');
  assert.equal(ternopilResponse.body.totalCents,'2594');
  const ambiguousTernopil=await send({payload:JSON.stringify({...ternopilPayload,accommodationPricePerPersonPerDay:'320'})});
  assert.equal(ambiguousTernopil.status,200,'ambiguous boundary is a safe user-facing calculation state, not an HTTP error');
  assert.equal(ambiguousTernopil.body.state,'RATE_THRESHOLD_AMBIGUOUS');
  const yaremchePayload={placeSlug:'yaremche',start:'2026-10-18',days:1,guestGroups:[{category:'domestic',guests:1}],accommodationType:'other'};
  const yaremcheResponse=await send({payload:JSON.stringify(yaremchePayload)});
  assert.equal(yaremcheResponse.status,200);
  assert.equal(yaremcheResponse.body.state,'VERIFIED_RESULT');
  assert.equal(yaremcheResponse.body.totalCents,'2594');
  const yaremcheMissingType=await send({payload:JSON.stringify({...yaremchePayload,accommodationType:undefined})});
  assert.equal(yaremcheMissingType.body.state,'INVALID_INPUT');
  const pending={...body,placeSlug:'aktove'};
  const pendingResponse=await send({payload:JSON.stringify(pending)});
  assert.equal(pendingResponse.status,200);
  assert.equal(pendingResponse.body.state,'PRELIMINARY_RESULT');
  assert.equal((await send({origin:'https://attacker.example'})).status,403);
  assert.equal((await send({contentType:'text/plain'})).status,415);
  assert.equal((await send({method:'GET'})).status,405);
  assert.equal((await send({payload:'x'.repeat(5000)})).status,413);
});

test('hub canonical redirect and HEAD behavior are correct',async()=>{
  const canonical=await request('/tourist-tax');
  assert.equal(canonical.status,308);
  assert.equal(canonical.headers.Location,'/tourist-tax/');
  const head=await request('/tourist-tax/','HEAD');
  assert.equal(head.status,200);
  assert.equal(head.body,'');
});
