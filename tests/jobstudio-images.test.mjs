import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderSeoPage } from '../versions/v1/seo-pages.mjs';
import { articleImageSeo } from '../versions/v1/image-seo.mjs';
import { caseData, renderCaseList } from '../versions/v1/cases.mjs';
import { caseImageSeo } from '../versions/v1/image-seo.mjs';
import { readerByline, readerAuthorCard } from '../versions/v1/editorial-layout.mjs';
import { renderRouteForReview } from '../scripts/review-render.mjs';

test('integration logos reserve space with the same proportions as their SVG viewBoxes',()=>{
 const html=renderSeoPage('/integrations');
 for(const file of ['booking-logo.svg','airbnb-logo.svg','agoda-logo.svg','expedia-logo.svg']){
  const tag=[...html.matchAll(/<img\b[^>]*>/g)].map(match=>match[0]).find(value=>value.includes(file));
  assert.ok(tag,`${file} is shown in the integration section`);
  const width=Number(tag.match(/\bwidth="(\d+)"/)?.[1]);
  const height=Number(tag.match(/\bheight="(\d+)"/)?.[1]);
  assert.ok(width>0&&height>0,`${file} should reserve intrinsic space`);
  const svg=readFileSync(new URL(`../versions/v1/public/assets/${file}`,import.meta.url),'utf8');
  const viewBox=svg.match(/viewBox="\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*"/i);
  assert.ok(viewBox,`${file} should declare its proportions`);
  assert.ok(Math.abs((width/height)/(Number(viewBox[1])/Number(viewBox[2]))-1)<0.005,`${file} must retain the original aspect ratio`);
  assert.match(tag,/\balt="[^"\s][^"]*"/,`${file} should identify the channel`);
 }
});

test('the PMS article cover and author card render the same concise descriptive alternative',async()=>{
 const alt=articleImageSeo['/blog/shcho-take-pms-dlya-gotelyu'].alt;
 assert.match(alt,/календар бронювань/iu);
 assert.ok(alt.length<=100,'the description should be concise in the article and cards');
 for(const route of ['/blog/shcho-take-pms-dlya-gotelyu','/authors/oleh-stepeniev']){
  const {html}=await renderRouteForReview(route);
  const tag=[...html.matchAll(/<img\b[^>]*>/g)].map(match=>match[0]).find(value=>value.includes('blog-pms-cover-natural.jpg'));
  assert.ok(tag,`${route} shows the article cover`);
  assert.ok(tag.includes(`alt="${alt}"`),`${route} renders the agreed description`);
 }
});

test('case thumbnails describe their illustration and remain hidden from duplicate navigation',()=>{
 const html=renderCaseList();
 for(const item of caseData){
  const tag=[...html.matchAll(/<img\b[^>]*>/g)].map(match=>match[0]).find(value=>value.includes(item.image));
  assert.ok(tag,item.slug);
  assert.ok(tag.includes(`alt="${caseImageSeo[item.slug].alt}"`),item.slug);
  assert.match(html,new RegExp(`<a class="case-card-image" href="/cases/${item.slug}" tabindex="-1" aria-hidden="true">`));
 }
});

test('author portraits have descriptive text without repeating the adjacent name for assistive technology',()=>{
 for(const slug of ['oleh-stepeniev','kostiantyn-tripailo']){
  for(const html of [readerByline({authorSlug:slug}),readerAuthorCard(slug)]){
   assert.match(html,/<img\b[^>]*alt="Портрет автора: [^"]+"[^>]*aria-hidden="true"/);
  }
 }
});
