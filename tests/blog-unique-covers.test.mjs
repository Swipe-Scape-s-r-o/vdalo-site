import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {renderRouteForReview} from '../scripts/review-render.mjs';
import {overbookingArticles} from '../versions/v1/overbooking-articles.mjs';

const decode=value=>value.replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
const attr=(tag,name)=>decode(tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1]||'');

test('HTML entities are decoded only once',()=>{
 assert.equal(decode('&amp;lt;'), '&lt;');
 assert.equal(decode('&lt;'), '<');
});

test('blog cards have distinct, descriptive image files',async()=>{
 const {status,html}=await renderRouteForReview('/blog');
 assert.equal(status,200);
 const cards=[...html.matchAll(/<a class="blog-featured" href="([^"#]+)">(<img\b[^>]*>)/g)];
 assert.equal(cards.length,28);
 const seen=new Map();
 for(const [,slug,img] of cards){
  const src=attr(img,'src');
  assert.ok(src,slug);
  assert.ok(attr(img,'alt').trim(),slug);
  assert.ok(!seen.has(src),`${slug} shares ${src} with ${seen.get(src)}`);
  seen.set(src,slug);
 }
});

test('new covers are consistent in cards, articles and social metadata',async()=>{
 const blog=(await renderRouteForReview('/blog')).html;
 const slugs=[...overbookingArticles.map(article=>article.slug),'/blog/qr-kody-dlya-restoranu'];
 const hashes=new Set();
 for(const slug of slugs){
  const card=[...blog.matchAll(/<a class="blog-featured" href="([^"#]+)">(<img\b[^>]*>)/g)].find(match=>match[1]===slug);
  assert.ok(card,slug);
  const src=attr(card[2],'src');
  const expected=src.startsWith('/v1/')?src:`/v1${src}`;
  const {status,html}=await renderRouteForReview(slug);
  assert.equal(status,200,slug);
  const cover=html.match(/<figure class="article-cover">\s*(<img\b[^>]*>)/)?.[1];
  assert.ok(cover,slug);
  const coverSrc=attr(cover,'src');
  assert.equal(coverSrc.startsWith('/v1/')?coverSrc:`/v1${coverSrc}`,expected,slug);
  assert.equal(attr(cover,'alt'),attr(card[2],'alt'),slug);
  const imageUrl=`https://www.vdalo.tech${expected}`;
  const og=[...html.matchAll(/<meta property="og:image" content="([^"]*)"/g)].map(match=>decode(match[1]));
  assert.deepEqual(og,[imageUrl],slug);
  assert.ok(html.includes(`<meta name="twitter:image" content="${imageUrl}">`),slug);
  const schemas=[...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map(match=>JSON.parse(match[1]));
  const post=schemas.flatMap(schema=>schema['@graph']??[schema]).find(node=>node['@type']==='BlogPosting');
  assert.ok(post,slug);
  assert.ok((Array.isArray(post.image)?post.image:[post.image]).includes(imageUrl),slug);
  assert.equal((await renderRouteForReview(expected)).status,200,slug);
  const image=await readFile(new URL(`../versions/v1/public${expected.replace('/v1','')}`,import.meta.url));
  const hash=createHash('sha256').update(image).digest('hex');
  assert.ok(!hashes.has(hash),`${slug}: duplicate image bytes`);
  hashes.add(hash);
 }
});
