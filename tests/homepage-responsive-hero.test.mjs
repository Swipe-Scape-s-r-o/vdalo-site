import test from 'node:test';
import assert from 'node:assert/strict';
import { statSync } from 'node:fs';
import { renderPage } from '../versions/v1/render.mjs';
import { assetUrl } from '../versions/v1/assets.mjs';
import { renderRouteForReview } from '../scripts/review-render.mjs';

test('homepage preloads the same responsive hotel photograph used by the visible hero',()=>{
 const html=renderPage({origin:'https://www.vdalo.tech',full:true,homepage:true});
 const preload=html.match(/<link\b[^>]*rel="preload"[^>]*as="image"[^>]*>/)?.[0];
 const image=html.match(/<div class="home-room-cut">\s*(<img\b[^>]*>)/)?.[1];
 assert.ok(preload&&image,'the hero image and its preload are present');
 const srcset=image.match(/\bsrcset="([^"]+)"/)?.[1];
 const sizes=image.match(/\bsizes="([^"]+)"/)?.[1];
 assert.ok(srcset&&sizes,'the hero offers responsive sources and viewport sizes');
 assert.ok(preload.includes(`imagesrcset="${srcset}"`));
 assert.ok(preload.includes(`imagesizes="${sizes}"`));
 assert.ok(image.includes(`src="${assetUrl('hero-hotel.webp')}"`),'the original photograph remains the fallback');
 assert.match(image,/fetchpriority="high"/);
 assert.doesNotMatch(image,/loading="lazy"/);
 for(const width of [560,800]){
  const file=`hero-hotel-${width}.webp`;
  assert.ok(srcset.includes(`/v1${assetUrl(file)} ${width}w`));
  assert.ok(statSync(new URL(`../versions/v1/public/assets/${file}`,import.meta.url)).size<statSync(new URL('../versions/v1/public/assets/hero-hotel.webp',import.meta.url)).size);
 }
});

test('every responsive hero candidate is served as a WebP by the real site router',async()=>{
 const {status,html}=await renderRouteForReview('/');
 assert.equal(status,200);
 const img=html.match(/<div class="home-room-cut">\s*(<img\b[^>]*>)/)?.[1];
 const srcset=img?.match(/\bsrcset="([^"]+)"/)?.[1];
 assert.ok(srcset);
 for(const item of srcset.split(',')){
  const url=item.trim().split(/\s+/)[0];
  const result=await renderRouteForReview(url);
  assert.equal(result.status,200,url);
  assert.match(String(result.headers['Content-Type']||result.headers['content-type']),/^image\/webp/i,url);
 }
});

test('unrelated editorial and product pages do not preload the homepage photograph',async()=>{
 for(const route of ['/solutions','/cases/guest-services-glamping','/blog/shcho-take-pms-dlya-gotelyu']){
  const {status,html}=await renderRouteForReview(route);
  assert.equal(status,200,route);
  const preloads=[...html.matchAll(/<link\b[^>]*rel="preload"[^>]*>/g)].map(match=>match[0]);
  assert.ok(!preloads.some(tag=>tag.includes('hero-hotel.webp')),route);
 }
 const home=await renderRouteForReview('/');
 assert.match(home.html,/<link\b[^>]*rel="preload"[^>]*as="image"[^>]*hero-hotel\.webp/);
});
