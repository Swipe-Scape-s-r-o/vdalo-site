import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {seoRoutes,renderSeoPage} from '../versions/v1/seo-pages.mjs';
import {qrArticles} from '../versions/v1/qr-articles.mjs';
import {renderSecondPassArticle} from '../versions/v1/article-second-pass.mjs';
import {touristTaxCityRoutes,canIndexTouristTaxPlace,getTouristTaxPlace} from '../versions/v1/tourist-tax-data.mjs';
import {renderTouristTaxCity} from '../versions/v1/tourist-tax.mjs';

const internalHrefs=html=>[...html.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)].map(match=>match[1]).filter(href=>href.startsWith('/')||/^[a-z][a-z0-9-]*$/.test(href)).map(href=>href.startsWith('/')?href:'/'+href);

test('every SEO landing page ends with contextual internal links',()=>{
  for(const route of seoRoutes()){
    const html=renderSeoPage(route);
    const related=html.match(/<nav class="seo-section seo-related"[\s\S]*?<\/nav>/)?.[0]||'';
    const hrefs=internalHrefs(related);
    assert.ok(hrefs.length>=2,`${route} should have at least two related internal links`);
    assert.equal(new Set(hrefs).size,hrefs.length,`${route} should not repeat links in its related section`);
  }
});

test('QR articles link their topic cluster and QR Studio from the lower related section',()=>{
  for(const article of qrArticles){
    const html=renderSecondPassArticle(article.slug);
    const related=html.match(/<nav class="article-related-links"[\s\S]*?<\/nav>/)?.[0]||'';
    const hrefs=internalHrefs(related);
    assert.equal(hrefs.length,article.links.length,`${article.slug} should expose its configured related links`);
    for(const [href] of article.links)assert.ok(hrefs.includes(href),`${article.slug} should link to ${href}`);
  }
});

test('QR Studio connects to the pillar guide and both supporting QR articles',()=>{
  const html=readFileSync(new URL('../qr-lab/index.html',import.meta.url),'utf8');
  const related=html.match(/<div class="seo-related">[\s\S]*?<\/div>/)?.[0]||'';
  for(const href of qrArticles.map(article=>article.slug)){
    assert.ok(internalHrefs(related).includes(href),`QR Studio should link to ${href}`);
  }
});

test('every published city SEO block links to the city directory and both tax guides',()=>{
  for(const route of touristTaxCityRoutes()){
    const slug=route.split('/').filter(Boolean).at(-1);
    const place=getTouristTaxPlace(slug);
    if(!canIndexTouristTaxPlace(place))continue;
    const html=renderTouristTaxCity(slug);
    const seo=html.match(/<section class="tt-seo-content"[\s\S]*?<\/section>/)?.[0]||'';
    assert.ok(seo,`${route} should render its SEO block`);
    for(const href of ['/tourist-tax/','/blog/turystychnyi-zbir-gotel-ukraina','/blog/rozrakhunok-turystychnoho-zboru-2026']){
      assert.ok(internalHrefs(seo).includes(href),`${route} SEO block should link to ${href}`);
    }
    const related=seo.match(/<aside class="tt-city-related"[\s\S]*?<\/aside>/)?.[0]||'';
    const cityLinks=internalHrefs(related).filter(href=>href.startsWith('/tourist-tax/')&&href!=='/tourist-tax/');
    assert.ok(cityLinks.length>0,`${route} should cross-link to at least one other published city`);
    assert.ok(!cityLinks.some(href=>href===route),`${route} should not link to itself`);
  }
});
