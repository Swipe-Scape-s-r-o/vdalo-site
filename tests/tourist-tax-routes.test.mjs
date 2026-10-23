import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

process.env.VERCEL='1';
const {default:server}=await import('../server.mjs');
const {touristTaxPlaces,touristTaxCityRoutes,canIndexTouristTaxPlace}=await import('../versions/v1/tourist-tax-data.mjs');
const {getPreparedPage}=await import('../versions/v1/content-revisions/content.mjs');

async function request(url,method='GET'){
  const req={url,method,headers:{},on(){},once(){},resume(){}};
  let status=0,headers={},body='';
  const res={writeHead(code,value={}){status=code;headers=value;},end(value){if(value)body=Buffer.isBuffer(value)?value.toString('utf8'):String(value);}};
  await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error(`No response for ${url}`)),3000);
    res.end=value=>{if(value)body=Buffer.isBuffer(value)?value.toString('utf8'):String(value);clearTimeout(timer);resolve();};
    server.emit('request',req,res);
  });
  return {status,headers,body};
}

test('hub, city, assets and sitemap resolve through the actual app router',async()=>{
  const hub=await request('/tourist-tax/');
  assert.equal(hub.status,200);
  assert.match(hub.body,/Туристичний збір в Україні/);
  assert.ok(hub.body.indexOf('class="tt-infographic"')<hub.body.indexOf('id="tt-calculator"'));
  assert.ok(hub.body.indexOf('id="tt-calculator"')<hub.body.indexOf('class="tt-section tt-directory"'));
  assert.ok(hub.body.lastIndexOf('class="tt-sources"')>hub.body.indexOf('class="tt-seo-content"'));
  assert.match(hub.body,/tax\.gov\.ua\/rishennya-mistsevih-rad-/);
  assert.match(hub.body,/rada\/show\/v0011201-11/);
  assert.match(hub.body,/Реквізити для оплати залежать від громади/);
  const city=await request('/tourist-tax/lutsk/');
  assert.equal(city.status,200);
  assert.match(city.body,/index,follow/);
  assert.match(city.body,/Розрахуйте туристичний збір/);
  assert.match(city.body,/tax\.gov\.ua\/rishennya-mistsevih-rad-/);
  assert.match(city.body,/Ставку звірено 14 жовтня 2026 року/);
  assert.match(city.body,/Наступна планова перевірка джерел: до 1 грудня 2026 року/);
  assert.match(city.body,/а не гарантія незмінності ставки/);
  for(const slug of ['sumy','vinnytsya','pivdenne','ternopil','zaporizhzhya','rivne','chernihiv','kolomyya','ivano-frankivsk','chernivtsi','lviv','cherkasy','berehove','uzhhorod','slavsko','vynohradiv','yasinya','tyachiv','irpin','skole']){
    const verifiedCity=await request(`/tourist-tax/${slug}/`);
    assert.equal(verifiedCity.status,200);
    assert.match(verifiedCity.body,/name="robots" content="index,follow"/);
    assert.match(verifiedCity.body,/Розрахуйте туристичний збір/);
    assert.match(verifiedCity.body,['odesa','vynohradiv','yasinya','tyachiv','irpin','skole'].includes(slug)?/Ставку звірено 18 жовтня 2026 року/:/Ставку звірено 14 жовтня 2026 року/);
    assert.match(verifiedCity.body,/Наступна планова перевірка джерел: до 1 грудня 2026 року/);
  }
  const pendingCity=await request('/tourist-tax/aktove/');
  assert.equal(pendingCity.status,404,'unreleased settlements should not have public pages');
  assert.match(pendingCity.body,/name="robots" content="noindex,follow"/,'branded 404 pages should stay out of search results');
  assert.match(pendingCity.body,/Сторінку не знайдено/);
  assert.doesNotMatch(pendingCity.body,/0,3\s*%|24,00|80,00/);
  for(const slug of ['bukovel','bar']){
    const unreleased=await request(`/tourist-tax/${slug}/`);
    assert.equal(unreleased.status,404,`${slug} is not approved for the current release wave`);
    assert.match(unreleased.body,/name="robots" content="noindex,follow"/);
    assert.match(unreleased.body,/Сторінку не знайдено/);
  }
  const hubConfig=JSON.parse(hub.body.match(/<script type="application\/json" id="tourist-tax-config">([^<]+)<\/script>/)[1]);
  assert.deepEqual(hubConfig.publicPlaces.map(place=>place.slug).sort(),['berehove','cherkasy','chernihiv','chernivtsi','dnipro','irpin','ivano-frankivsk','khust','kolomyya','kyyiv','lutsk','lviv','pivdenne','polyana','rivne','skole','slavsko','sumy','ternopil','tyachiv','uzhhorod','vinnytsya','vynohradiv','yaremche','yasinya','zaporizhzhya','zhytomyr']);
  const yaremche=await request('/tourist-tax/yaremche/');
  assert.equal(yaremche.status,200);
  assert.match(yaremche.body,/name="accommodationType"/);
  assert.match(yaremche.body,/UA26120150010047425/);
  const yasinya=await request('/tourist-tax/yasinya/');
  assert.equal(yasinya.status,200);
  assert.match(yasinya.body,/0,30% \/ 1,00%/);
  assert.match(yasinya.body,/UA21060070010074038/);
  assert.match(yasinya.body,/Наступна планова перевірка джерел: до 1 грудня 2026 року/);
  assert.doesNotMatch(hub.body,/tourist-tax\/(?:bukovel|bar|aktove)\//);
  const css=await request('/tourist-tax-assets/tourist-tax.css');
  assert.equal(css.status,200);
  assert.match(css.headers['Content-Type'],/text\/css/);
  const interactions=await request('/tourist-tax-assets/tourist-tax-interactions.css');
  assert.equal(interactions.status,200);
  const js=await request('/tourist-tax-assets/tourist-tax.js');
  assert.equal(js.status,200);
  const sitemap=await request('/sitemap.xml');
  assert.equal(sitemap.status,200);
  assert.match(sitemap.body,/https:\/\/www\.vdalo\.tech\/tourist-tax\//);
  assert.match(sitemap.body,/tourist-tax\/lutsk/);
  assert.doesNotMatch(sitemap.body,/tourist-tax\/aktove/);
  const citySitemapEntries=[...sitemap.body.matchAll(/<loc>https:\/\/www\.vdalo\.tech\/tourist-tax\/[^<]+<\/loc>/g)];
  assert.equal(citySitemapEntries.length,27,'only verified city routes should appear in the city sitemap');
  for(const slug of ['kyyiv','sumy','vinnytsya','pivdenne','ternopil','zaporizhzhya','rivne','chernihiv','kolomyya','ivano-frankivsk','chernivtsi','lviv','cherkasy','berehove','uzhhorod','slavsko','dnipro','zhytomyr','vynohradiv','yasinya','tyachiv','irpin','skole'])assert.match(sitemap.body,new RegExp(`tourist-tax/${slug}/`));
  for(const place of touristTaxPlaces.filter(place=>!canIndexTouristTaxPlace(place)))assert.doesNotMatch(sitemap.body,new RegExp(`tourist-tax/${place.slug}/`),`sitemap contains unreleased place: ${place.slug}`);
});

test('tourist-tax funnel route is served with analytics, privacy, accessibility and both video assets',async()=>{
  const funnel=await request('/tourist-tax/start');
  assert.equal(funnel.status,200);
  assert.ok(funnel.body.includes(`<title>${getPreparedPage('/tourist-tax/start').title}</title>`));
  assert.match(funnel.body,/<meta name="robots" content="noindex,follow">/);
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
  assert.doesNotMatch(sitemap.body,/tourist-tax\/start/,'campaign funnel must stay out of the indexable sitemap');
});

test('only released city routes resolve through the actual app router',async()=>{
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
       else if(place.slug==='odesa')assert.match(title,/Туристичний збір в Одесі 2026: ставки й калькулятор \| VDALO/);
       else if(place.slug==='polyana')assert.match(title,/Туристичний збір у Поляні у 2026 році \| Ставки/);
       else if(place.slug==='khust')assert.match(title,/Туристичний збір у Хусті на 2026 рік: ставки й калькулятор/);
      else if(['tyachiv','irpin','skole'].includes(place.slug))assert.match(title,new RegExp(`Туристичний збір .* 2026: .* \\| VDALO`));
      else assert.match(title,/Туристичний збір .+2026.+/);
    }else if(place.slug==='odesa'){
      assert.equal(response.status,200);
      assert.match(response.body,/name="robots" content="noindex,follow"/);
      assert.match(response.body,/Чому зараз немає розрахунку/);
      assert.doesNotMatch(response.body,/id="tt-calculator"/);
    }else{
      assert.equal(response.status,404,`unreleased route should be unavailable: ${place.route}`);
      assert.match(response.body,/name="robots" content="noindex,follow"/);
      assert.match(response.body,/Сторінку не знайдено/);
    }
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
  const odesaScenario=await send({payload:JSON.stringify({placeSlug:'odesa',start:'2026-10-10',days:1,guestGroups:[{category:'inbound',guests:1}],scenario:'odesa-inbound-1-percent'})});
  assert.equal(odesaScenario.status,404);
  assert.equal(odesaScenario.body.state,'PLACE_UNAVAILABLE');
  const odesaOfficial=await send({payload:JSON.stringify({...body,placeSlug:'odesa'})});
  assert.equal(odesaOfficial.status,404);
  assert.equal(odesaOfficial.body.state,'PLACE_UNAVAILABLE');
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
  assert.equal(pendingResponse.status,404);
  assert.equal(pendingResponse.body.state,'PLACE_UNAVAILABLE');
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
