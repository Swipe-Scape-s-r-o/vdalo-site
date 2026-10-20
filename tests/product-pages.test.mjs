import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {seoRoutes,renderSeoPage} from '../versions/v1/seo-pages.mjs';
import {productFeaturePages} from '../versions/v1/product-pages.mjs';
import {renderPage} from '../versions/v1/render.mjs';
import '../versions/v1/public/pricing-core.js';
import {renderPricing} from '../versions/v1/pricing.mjs';

test('new product pages render metadata, schema, status and a local hero image',()=>{
  for(const [route,config] of productFeaturePages){
    const html=renderSeoPage(route);
    assert.ok(html,`${route} should render`);
    assert.equal((html.match(/<h1\b/g)||[]).length,1,`${route} should have one H1`);
    assert.ok(html.includes(`<title>${config.title}</title>`),`${route} should have its unique title`);
    assert.ok(html.includes(`name="description" content="${config.description}"`),`${route} should have its description`);
    assert.ok(html.includes('rel="canonical"'),`${route} should have a canonical`);
    assert.ok(html.includes('seo-status-pill'),`${route} should show a product status`);
    const graph=html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
    assert.ok(graph,`${route} should render JSON-LD`);
    assert.equal(JSON.parse(graph)['@type'],'WebPage',`${route} should use WebPage structured data`);
    const image=config.heroImage;
    assert.ok(existsSync(fileURLToPath(new URL(`../versions/v1/public/assets/${image}`,import.meta.url))),`${route} hero ${image} should exist`);
  }
});

test('product page routes are unique and represented in the public SEO route registry',()=>{
  const paths=productFeaturePages.map(([route])=>route);
  assert.equal(new Set(paths).size,paths.length);
  for(const route of paths)assert.ok(seoRoutes().includes(route),`${route} should be registered`);
});

test('feature page links use registered root feature routes',()=>{
  const publicRoutes=new Set(seoRoutes());
  for(const [route] of productFeaturePages){
    const html=renderSeoPage(route);
    const hotelHrefs=[...html.matchAll(/href="(\/(?:v1\/)?hotel-[a-z0-9-]+)"/g)].map(match=>match[1]);
    assert.ok(hotelHrefs.every(href=>href.startsWith('/hotel-')&&publicRoutes.has(href)),`${route} must link only to registered root feature routes, never /v1 routes`);
  }
});

test('desktop nested navigation keeps submenu text dark on its light panel',()=>{
  const css=readFileSync(fileURLToPath(new URL('../versions/v1/public/design-system-2.css',import.meta.url)),'utf8');
  assert.ok(css.includes('@media(min-width:901px){.ds2 .header nav .nav-submenu a,.ds2 .header nav .nav-submenu a:hover,.ds2 .header nav .nav-submenu .nav-disclosure>summary,.ds2 .header nav .nav-submenu .nav-disclosure>summary:hover{color:var(--plum)}}'));
  assert.ok(css.includes('.ds2 .header nav.open .nav-disclosure>summary{color:var(--soft)}'));
});

test('site navigation uses hover, focus and touch disclosure without chevron icons',()=>{
  const html=renderPage({full:true});
  const js=readFileSync(fileURLToPath(new URL('../versions/v1/public/app.js',import.meta.url)),'utf8');
  const css=readFileSync(fileURLToPath(new URL('../versions/v1/public/design-system-2.css',import.meta.url)),'utf8');
  assert.ok(html.includes('class="nav-disclosure"'));
  assert.ok(!html.includes('nav-chevron'));
  assert.ok(css.includes('.ds2 .nav-disclosure>summary::marker{content:""}'));
  assert.ok(css.includes('.ds2 .nav-disclosure[open]>.nav-submenu::before{content:"";position:absolute;left:0;right:0;top:-9px;height:10px;background:transparent}'));
  assert.ok(js.includes("'(min-width: 901px) and (hover: hover) and (pointer: fine)'"));
  assert.ok(js.includes("detail.addEventListener('pointerenter'"));
  assert.ok(js.includes("detail.addEventListener('focusin'"));
  assert.ok(js.includes("summary?.addEventListener('click'"));
  assert.ok(js.includes("if(event.key!=='Escape'"));
  assert.ok(js.includes("detail.dataset.suppressFocusOpen==='true'"));
  assert.ok(js.includes("last.dataset.suppressFocusOpen='true';summary.focus()"));
});

test('beta and development modules cannot be priced or selected from pricing UI',()=>{
  const pricing=renderPricing();
  for(const id of ['prro','rms','assistant','access','energy','messages','laundry']){
    assert.match(pricing,new RegExp(`data-module="${id}"[^>]*disabled`),`${id} selector should be disabled`);
  }
  const core=globalThis.VDALO_PRICING;
  const estimate=core.modulesPrice('hotel',20,['prro','assistant','access','energy','messages','laundry']);
  assert.equal(estimate.sum,0);
  assert.equal(estimate.notes.length,6);
});
