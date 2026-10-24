import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderRouteForReview} from '../scripts/review-render.mjs';
import {withSiteTrialOffer} from '../versions/v1/trial-offer.mjs';
import {offers} from '../microlandings/content.mjs';
import {robotFunnelRoutes,robotFunnelLegacyRoutes} from '../microlandings/robot-funnels.mjs';
import {formContract} from '../versions/v1/content-revisions/form-contract.mjs';
import {renderTouristTaxHub} from '../versions/v1/tourist-tax.mjs';
import {renderAuditDialog} from '../versions/v1/render.mjs';
import {touristTaxPlaces} from '../versions/v1/tourist-tax-data.mjs';

test('every published ordinary route receives exactly one offer, form and controller',async()=>{
 const sitemap=await renderRouteForReview('/sitemap.xml');
 const routes=[...sitemap.html.matchAll(/<loc>https:\/\/www\.vdalo\.tech([^<]*)<\/loc>/g)].map(m=>m[1]);
 assert.ok(routes.length>80);
 for(const route of [...routes,'/v1/','/v1/privacy','/tools/qr-studio/index.html']){
  const response=await renderRouteForReview(route);
  assert.equal(response.status,200,route);
  assert.equal((response.html.match(/\bdata-site-trial-offer\b/g)||[]).length,1,route);
  assert.equal((response.html.match(/id="audit-dialog"/g)||[]).length,1,route);
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

test('ordinary tax pages outside the sitemap also opt in, preserving their noindex policy',async()=>{
 let unindexed=0;
 for(const place of touristTaxPlaces){
  const response=await renderRouteForReview(place.route);
  if(response.status===404){assert.doesNotMatch(response.html,/data-site-trial-offer/);continue;}
  assert.equal(response.status,200,place.route);
  assert.match(response.html,/data-site-trial-offer/,place.route);
  if(/name="robots" content="noindex/.test(response.html))unindexed++;
 }
 assert.ok(unindexed>0,'known ordinary noindex pages remain covered');
});

test('legacy funnel redirects preserve campaign parameters without an offer',async()=>{
 for(const [old,current] of robotFunnelLegacyRoutes){
  const response=await renderRouteForReview(`/${old}?utm_source=qa&t=test`);
  assert.equal(response.status,308,old);
  assert.equal(response.headers.Location,`/${current}?utm_source=qa&t=test`,old);
  assert.doesNotMatch(response.html,/data-site-trial-offer/);
 }
});

test('standalone pages reuse the existing audit delivery contract without changing their forms',()=>{
 const before=renderTouristTaxHub(),after=withSiteTrialOffer(before,true);
 const contracts=formContract(after);
 assert.deepEqual(contracts.slice(0,-1),formContract(before));
 assert.deepEqual(contracts.at(-1),formContract(renderAuditDialog())[0]);
 assert.match(after,/action="\/api\/leads\/audit"/);
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
 assert.match(css,/\.site-trial-request \[hidden\]/);
 assert.match(css,/\.home-trial-offer button:focus-visible/);
 assert.match(app,/querySelector\('\.header'\)\?\.classList/);
});
