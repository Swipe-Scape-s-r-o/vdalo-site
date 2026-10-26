import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderRouteForReview} from '../scripts/review-render.mjs';
import {withSiteTrialOffer,renderTrialOffer} from '../versions/v1/trial-offer.mjs';
import {offers} from '../microlandings/content.mjs';
import {robotFunnelRoutes,robotFunnelLegacyRoutes} from '../microlandings/robot-funnels.mjs';
import {formContract} from '../versions/v1/content-revisions/form-contract.mjs';
import {renderTouristTaxHub} from '../versions/v1/tourist-tax.mjs';
import {validateLead} from '../versions/v1/server.mjs';
import {touristTaxPlaces} from '../versions/v1/tourist-tax-data.mjs';

test('every published ordinary route receives exactly one offer, form and controller',async()=>{
 const sitemap=await renderRouteForReview('/sitemap.xml');
 const routes=[...sitemap.html.matchAll(/<loc>https:\/\/www\.vdalo\.tech([^<]*)<\/loc>/g)].map(m=>m[1]);
 assert.ok(routes.length>80);
 for(const route of [...routes.filter(route=>route!=='/tourist-tax/start'),'/v1/','/v1/privacy','/tools/qr-studio/index.html']){
  const response=await renderRouteForReview(route);
  assert.equal(response.status,200,route);
  assert.equal((response.html.match(/\bdata-site-trial-offer\b/g)||[]).length,1,route);
  assert.equal((response.html.match(/id="home-offer-name"/g)||[]).length,1,route);
  assert.equal((response.html.match(/id="home-offer-phone"/g)||[]).length,1,route);
  assert.ok((response.html.match(/id="audit-dialog"/g)||[]).length<=1,route);
  assert.equal((response.html.match(/src="\/v1\/app\.js\?/g)||[]).length,1,route);
  assert.equal((response.html.match(/src="\/v1\/trial-offer\.js\?/g)||[]).length,1,route);
 }
});

test('all marketing funnel families exclude offer markup, scripts and styles',async()=>{
 const routes=[...robotFunnelRoutes.keys()].map(code=>'/'+code);
 routes.push('/q','/go','/go/trial','/funnel','/funnel/privacy','/tourist-tax/start',...offers.map(o=>o.route),'/k','/k/',...Array.from({length:5},(_,i)=>`/k${i+1}`),'/k/index.html','/go/index.html');
 for(let n=1;n<=59;n++)routes.push('/'+n,'/go/'+n);
 for(const route of routes){
  const response=await renderRouteForReview(route+'?utm_source=qa');
  assert.equal(response.status,200,route);
  assert.doesNotMatch(response.html,/data-site-trial-offer|home-trial-offer|\/trial-offer\.(?:js|css)/,route);
 }
});

test('the newly released Odesa city page opts into the site offer and indexation',async()=>{
 const place=touristTaxPlaces.find(item=>item.slug==='odesa');
 const response=await renderRouteForReview(place.route);
 assert.equal(response.status,200,place.route);
 assert.match(response.html,/data-site-trial-offer/);
 assert.match(response.html,/name="robots" content="index,follow"/);
});

test('legacy funnel redirects preserve campaign parameters without an offer',async()=>{
 for(const [old,current] of robotFunnelLegacyRoutes){
  const response=await renderRouteForReview(`/${old}?utm_source=qa&t=test`);
  assert.equal(response.status,308,old);
  assert.equal(response.headers.Location,`/${current}?utm_source=qa&t=test`,old);
  assert.doesNotMatch(response.html,/data-site-trial-offer/);
 }
});

test('standalone pages add one inline contact form without changing their own forms',()=>{
 const before=renderTouristTaxHub(),after=withSiteTrialOffer(before,true);
 const contracts=formContract(after);
 assert.deepEqual(contracts.slice(0,-1),formContract(before));
 assert.deepEqual(contracts.at(-1),formContract(renderTrialOffer())[0]);
 assert.match(after,/action="\/api\/leads\/audit"/);
 assert.doesNotMatch(after,/id="audit-dialog"/);
 assert.equal(withSiteTrialOffer(after,true),after,'idempotent decoration');
 assert.equal(withSiteTrialOffer(before,false),before,'disabled renderer unchanged');
});

test('static assets and 404 pages do not receive the invitation',async()=>{
 const missing=await renderRouteForReview('/not-a-real-landing');assert.equal(missing.status,404);assert.doesNotMatch(missing.html,/data-site-trial-offer/);
 for(const ext of ['js','css']){
  const asset=await renderRouteForReview(`/v1/trial-offer.${ext}`);assert.equal(asset.status,200);
  assert.doesNotMatch(asset.html,/<dialog/);
 }
});

test('standalone form styles stay scoped and controller safely supports a page without the main header',()=>{
 const css=readFileSync(new URL('../versions/v1/public/trial-offer.css',import.meta.url),'utf8');
 const app=readFileSync(new URL('../versions/v1/public/app.js',import.meta.url),'utf8');
 assert.match(css,/\.home-trial-offer \[hidden\]/);
 assert.match(css,/\.home-trial-offer :is\(button,a,input\):focus-visible/);
 assert.match(css,/padding:64px 0 0/);
 assert.match(css,/\.home-trial-offer \.home-offer-scroll\{[^}]*padding:12px 36px 20px;overflow:auto/);
 assert.match(css,/\.home-trial-offer h2\{[^}]*text-align:center/);
 assert.match(app,/querySelector\('\.header'\)\?\.classList/);
});

test('inline trial request needs only name, phone and unchecked consent, with replay masking',()=>{
 const html=renderTrialOffer();
 assert.match(html,/data-clarity-mask="true"/);
 assert.match(html,/name="consent" required/);
 assert.doesNotMatch(html,/name="consent"[^>]*checked|name="(?:email|property|city)"/);
 const accepted=validateLead('audit',{form_kind:'contact',name:'Тест VDALO',contact:'+380501234567',pain:'Заявка на 14-денний тест VDALO з попапу',consent:true});
 assert.deepEqual(accepted.errors,{});assert.match(accepted.data.pain,/14-денний тест/);
 const rejected=validateLead('audit',{form_kind:'contact',name:'Тест',contact:'test@example.com',consent:true});
 assert.ok(rejected.errors.contact);
});

test('narrow tax directory rows wrap instead of widening the viewport behind the popup',async()=>{
 const css=readFileSync(new URL('../versions/v1/public/tourist-tax-interactions.css',import.meta.url),'utf8');
 assert.match(css,/@media\(max-width:760px\)\{\.tt-place-list\{grid-template-columns:minmax\(0,1fr\)\}/);
 assert.match(css,/\.tt-place-row a\{white-space:normal;overflow-wrap:anywhere\}/);
 const page=await renderRouteForReview('/tourist-tax/');
 assert.match(page.html,/tourist-tax-interactions\.css\?v=[a-f0-9]{12}/);
});
