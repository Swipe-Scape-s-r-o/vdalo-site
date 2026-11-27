import test from 'node:test';
import assert from 'node:assert/strict';
import { statSync } from 'node:fs';
import { renderPage } from '../versions/v1/render.mjs';
import { renderRouteForReview } from '../scripts/review-render.mjs';

const staticHero = html => html.match(/data-property-frame>\s*(<img\b[^>]*>)/)?.[1];
const slidesFrom = html => JSON.parse(html.match(/<script type="application\/json" data-property-slides>([\s\S]*?)<\/script>/)?.[1]);
const sources = srcset => srcset.split(',').map(entry => entry.trim().split(/\s+/)[0]);

test('homepage preloads only the displayed responsive property illustration',()=>{
 const html=renderPage({origin:'https://www.vdalo.tech',full:true,homepage:true});
 const preloads=[...html.matchAll(/<link\b[^>]*rel="preload"[^>]*as="image"[^>]*>/g)].map(match=>match[0]);
 assert.equal(preloads.length,1);
 assert.match(html,/<link rel="stylesheet" href="\/home\.css\?v=[^"]+" fetchpriority="high">/,
  'shared homepage styles apply before the first painted layout');
 const image=staticHero(html);
 assert.ok(image);
 const srcset=image.match(/\bsrcset="([^"]+)"/)?.[1];
 const sizes=image.match(/\bsizes="([^"]+)"/)?.[1];
 assert.ok(srcset&&sizes);
 assert.ok(preloads[0].includes(`imagesrcset="${srcset}"`));
 assert.ok(preloads[0].includes(`imagesizes="${sizes}"`));
 assert.match(image,/src="\/v1\/assets\/home-property-hotels-768\.webp\?/);
 assert.match(image,/width="1200" height="800"/);
 assert.match(image,/fetchpriority="high"/);
 assert.doesNotMatch(image,/loading="lazy"/);
 assert.match(html,/data-property-controls hidden/,'controls appear only once JavaScript initializes them');

 const slides=slidesFrom(html);
 assert.equal(slides.length,10);
 assert.equal(new Set(slides.map(slide=>slide.label)).size,10);
 assert.equal(new Set(slides.map(slide=>slide.alt)).size,10);
 for(const slide of slides){
  const sizes=sources(slide.srcset).map(url=>statSync(new URL(`../versions/v1/public${url.slice('/v1'.length).split('?')[0]}`,import.meta.url)).size);
  assert.equal(sizes.length,3);
  assert.ok(sizes[0]<sizes[1]&&sizes[1]<sizes[2],slide.label);
  assert.equal((html.match(new RegExp(`\\bsrc="${slide.src.split('?')[0]}\\?`,'g'))||[]).length,slide===slides[0]?1:0);
 }
});

test('all responsive candidates and slide destinations are served by the real router',async()=>{
 const {status,html}=await renderRouteForReview('/');
 assert.equal(status,200);
 const slides=slidesFrom(html);
 for(const slide of slides){
  for(const url of sources(slide.srcset)){
   const result=await renderRouteForReview(url);
   assert.equal(result.status,200,url);
   assert.match(String(result.headers['Content-Type']||result.headers['content-type']),/^image\/webp/i,url);
  }
  if(slide.href){
   const [path,fragment]=slide.href.split('#');
   const result=await renderRouteForReview(path);
   assert.equal(result.status,200,slide.href);
   if(fragment)assert.ok(result.html.includes(`id="${fragment}"`),slide.href);
  }
 }
});

test('unrelated editorial and product routes keep homepage imagery out of their preloads',async()=>{
 for(const route of ['/solutions','/cases/guest-services-glamping','/blog/shcho-take-pms-dlya-gotelyu']){
  const {status,html}=await renderRouteForReview(route);
  assert.equal(status,200,route);
  const preloads=[...html.matchAll(/<link\b[^>]*rel="preload"[^>]*>/g)].map(match=>match[0]);
  assert.ok(!preloads.some(tag=>/hero-hotel\.webp|\/home-property-/.test(tag)),route);
 }
});
