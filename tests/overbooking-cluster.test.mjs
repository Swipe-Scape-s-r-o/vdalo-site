import test from 'node:test';
import assert from 'node:assert/strict';
import {renderRouteForReview} from '../scripts/review-render.mjs';
import {overbookingArticles} from '../versions/v1/overbooking-articles.mjs';

const host='https://www.vdalo.tech';
const decode=value=>String(value??'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
const plain=value=>decode(value).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const links=html=>[...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/gi)].map(match=>decode(match[1]));
const main=html=>html.match(/<main\b[\s\S]*?<\/main>/i)?.[0]??'';

test('overbooking cluster is complete, indexable and exposes the source content',async()=>{
  assert.equal(overbookingArticles.length,12);
  const sitemap=(await renderRouteForReview('/sitemap.xml')).html;
  const blog=main((await renderRouteForReview('/blog')).html);
  const pillar='/blog/overbuking-u-goteli';
  for(const article of overbookingArticles){
    const {status,html}=await renderRouteForReview(article.slug);
    assert.equal(status,200,article.slug);
    assert.ok(sitemap.includes(`<loc>${host}${article.slug}</loc>`),article.slug);
    assert.ok(links(blog).includes(article.slug),article.slug);
    assert.equal(plain(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]),article.title);
    assert.ok(article.title.length<=60,article.slug);
    assert.ok(article.description.length<=160,article.slug);
    assert.equal(plain(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]),article.headline);
    assert.equal((html.match(/<h1\b/gi)||[]).length,1,article.slug);
    assert.match(html,/<meta name="robots" content="index,follow">/i);
    assert.ok(html.includes(`<link rel="canonical" href="${host}${article.slug}">`),article.slug);
    assert.match(main(html),/Поширені запитання/u,article.slug);
    assert.doesNotMatch(main(html),/\u2014/u,article.slug);
    assert.doesNotMatch(main(html),/<p>---<\/p>/u,article.slug);
    const schemas=[...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map(match=>JSON.parse(match[1]));
    const graph=schemas.flatMap(schema=>schema['@graph']??[schema]);
    const post=graph.find(node=>node['@type']==='BlogPosting');
    assert.ok(post,article.slug);
    assert.equal(post.url,`${host}${article.slug}`);
    assert.equal(post.headline,article.headline);
    assert.equal(post.publisher?.['@id'],`${host}/#organization`);
    assert.equal(post.author?.url,`${host}/authors/${article.authorSlug}`,article.slug);
    assert.ok(links(main(html)).includes(`/authors/${article.authorSlug}`),article.slug);
    assert.equal(post.datePublished,undefined,'publication date must not be invented');
    assert.ok(!graph.some(node=>node['@type']==='FAQPage'),article.slug);
    if(article.slug!==pillar)assert.ok(links(main(html)).includes(pillar),article.slug);
    else for(const other of overbookingArticles.filter(item=>item.slug!==pillar))assert.ok(links(main(html)).includes(other.slug),`missing ${other.slug}`);
    const redirect=await renderRouteForReview(article.slug+'/?utm_source=test');
    assert.equal(redirect.status,308,article.slug);
    assert.equal(redirect.headers.Location??redirect.headers.location,article.slug+'?utm_source=test');
  }
});

test('contextual links from existing guides and tools reach the new cluster',async()=>{
  const expected=[
    ['/hotel-booking-calendar','/blog/pms-booking-rizna-dostupnist'],
    ['/hotel-channel-manager','/blog/yak-pidkliuchyty-booking-com-do-pms'],
    ['/hotel-channel-manager','/blog/channel-manager-perevirky-pered-sezonom'],
    ['/blog/channel-manager-ical-gotelyu','/blog/pms-booking-rizna-dostupnist'],
    ['/blog/pryami-bronyuvannya-ta-vidzhet-gotelyu','/blog/bronyuvannya-telefonom-mesendzherakh'],
    ['/blog/status-gotovnosti-nomera-housekeeping','/blog/stop-sell-remont-nomera'],
    ['/tools/pms-checklist/','/blog/channel-manager-perevirky-pered-sezonom'],
    ['/tools/hotel-profitability-calculator/','/blog/vartist-overbukingu-gotelyu'],
  ];
  for(const [from,to] of expected){
    const source=await renderRouteForReview(from);
    assert.equal(source.status,200,from);
    assert.ok(links(main(source.html)).includes(to),`${from} -> ${to}`);
    assert.equal((await renderRouteForReview(to)).status,200,to);
  }
});

test('new articles do not contain broken same-site links or missing section targets',async()=>{
  const cache=new Map();
  for(const article of overbookingArticles){
    const response=await renderRouteForReview(article.slug);
    for(const raw of links(main(response.html))){
      const target=new URL(raw,host+article.slug);
      if(target.origin!==host)continue;
      const request=target.pathname+target.search;
      if(!cache.has(request))cache.set(request,await renderRouteForReview(request));
      let result=cache.get(request);
      if(result.status>=300&&result.status<400){
        const location=result.headers.Location??result.headers.location;
        assert.ok(location,`${article.slug}: ${raw}`);
        const redirected=new URL(location,host);
        if(redirected.origin!==host)continue;
        result=await renderRouteForReview(redirected.pathname+redirected.search);
      }
      assert.equal(result.status,200,`${article.slug}: ${raw}`);
      if(target.hash){
        const id=decodeURIComponent(target.hash.slice(1));
        assert.ok(result.html.includes(`id="${id}"`),`${article.slug}: missing ${raw}`);
      }
    }
  }
});

test('article checklist items have usable, labelled controls',async()=>{
  const {html}=await renderRouteForReview('/blog/overbuking-u-goteli');
  const items=[...main(html).matchAll(/<li class="article-task"><label><input type="checkbox"([^>]*)><span>([\s\S]*?)<\/span><\/label><\/li>/g)];
  assert.ok(items.length>=12);
  for(const [,attributes,label] of items){
    assert.doesNotMatch(attributes,/disabled/i);
    assert.ok(plain(label));
  }
});

test('overbooking cost guide describes its three examples as a manual calculation',async()=>{
  const article=overbookingArticles.find(item=>item.slug==='/blog/vartist-overbukingu-gotelyu');
  assert.ok(article);
  assert.match(article.headline,/формула та приклади/u);
  assert.match(article.body,/три приклади/u);
  assert.equal((article.body.match(/^## Приклад [1-3]:/gm)||[]).length,3);
  assert.match(article.body,/Калькулятор вартості овербукінгу: розрахунок вручну/u);
  assert.match(article.body,/Скопіюйте таблицю в документ або перенесіть на папір/u);
});
