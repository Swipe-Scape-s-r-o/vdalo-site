import test from 'node:test';
import assert from 'node:assert/strict';
import {assetUrl} from '../versions/v1/assets.mjs';
import {renderRouteForReview} from '../scripts/review-render.mjs';

test('ordinary pages load available site fonts from versioned routes',async()=>{
 for(const route of ['/','/solutions','/integrations','/blog/shcho-take-pms-dlya-gotelyu','/cases/guest-services-glamping','/tools/pms-checklist/']){
  const page=await renderRouteForReview(route);
  assert.equal(page.status,200,route);
  const css=page.html.match(/<style data-vdalo-fonts>([\s\S]*?)<\/style>/)?.[1];
  assert.ok(css,`${route} should provide working font-face declarations`);
  for(const font of ['inter-cyrillic.woff2','inter-latin.woff2','inter-tight-cyrillic.woff2','inter-tight-latin.woff2']){
   const url=`/v1${assetUrl(font)}`;
   assert.ok(css.includes(url),`${route}: ${font}`);
   const response=await renderRouteForReview(url);
   assert.equal(response.status,200,url);
   assert.match(String(response.headers['Content-Type']||response.headers['content-type']),/font\/woff2/i,url);
  }
 }
});

test('font fix does not alter the tourist-tax page head',async()=>{
 const page=await renderRouteForReview('/tourist-tax/kyyiv/');
 assert.equal(page.status,200);
 assert.doesNotMatch(page.html,/<style data-vdalo-fonts>/);
});

test('legacy font URLs resolve to the existing versioned files without changing old page markup',async()=>{
 for(const font of ['inter-cyrillic.woff2','inter-latin.woff2','inter-tight-cyrillic.woff2','inter-tight-latin.woff2']){
  const oldUrl=assetUrl(font);
  const redirect=await renderRouteForReview(oldUrl);
  assert.equal(redirect.status,307,oldUrl);
  assert.equal(redirect.headers.Location||redirect.headers.location,`/v1${oldUrl}`,oldUrl);
  const target=await renderRouteForReview(redirect.headers.Location||redirect.headers.location);
  assert.equal(target.status,200,font);
  assert.match(String(target.headers['Content-Type']||target.headers['content-type']),/font\/woff2/i,font);
 }
 assert.equal((await renderRouteForReview('/assets/not-a-font.woff2')).status,404);
});
