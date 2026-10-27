import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {seoRoutes,renderSeoPage} from '../versions/v1/seo-pages.mjs';
import {productFeaturePages} from '../versions/v1/product-pages.mjs';
import {renderPage} from '../versions/v1/render.mjs';
import '../versions/v1/public/pricing-core.js';
import {renderPricing} from '../versions/v1/pricing.mjs';

test('new product pages render metadata, omit available-status badges, and keep a local hero image',()=>{
  for(const [route,config] of productFeaturePages){
    const html=renderSeoPage(route);
    assert.ok(html,`${route} should render`);
    assert.equal((html.match(/<h1\b/g)||[]).length,1,`${route} should have one H1`);
    assert.ok(html.includes(`<title>${config.title}</title>`),`${route} should have its unique title`);
    assert.ok(html.includes(`name="description" content="${config.description}"`),`${route} should have its description`);
    assert.ok(html.includes('rel="canonical"'),`${route} should have a canonical`);
    assert.ok(!html.includes('<p class="eyebrow">ДОСТУПНО</p>'),`${route} should not label available functionality as a status`);
    assert.ok(!html.includes('<p class="eyebrow">ДОСТУПНО ЗАРАЗ</p>'),`${route} should not label available functionality as a status`);
    const statusPill=html.match(/<p class="seo-status-pill"><span>СТАТУС<\/span>(.*?)<\/p>/)?.[1]||'';
    assert.ok(!statusPill.includes('ДОСТУПНО'),`${route} should not show an available-status pill`);
    const graph=html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
    assert.ok(graph,`${route} should render JSON-LD`);
    assert.equal(JSON.parse(graph)['@type'],'WebPage',`${route} should use WebPage structured data`);
    const image=config.heroImage;
    assert.ok(existsSync(fileURLToPath(new URL(`../versions/v1/public/assets/${image}`,import.meta.url))),`${route} hero ${image} should exist`);
  }
});

test('unavailable product modules are explicitly marked as in development',()=>{
  for(const route of ['/hotel-site-builder','/hotel-energy-management','/hotel-prro']){
    const html=renderSeoPage(route);
    assert.ok(html.includes('У РОЗРОБЦІ'),`${route} should state that the unavailable module is in development`);
  }
  const guestProfile=renderSeoPage('/hotel-guest-profile');
  assert.match(guestProfile,/У РОЗРОБЦІ[\s\S]*?Сценарії з Дією/);
  assert.doesNotMatch(guestProfile,/Сценарії з Дією доступні/);
  const catalog=renderSeoPage('/hotel-pms-modules');
  assert.match(catalog,/ПРРО та інтеграція з Дією/);
  assert.doesNotMatch(catalog,/ПРРО та сценарії з Дією доступні/);
});

test('PMS status catalog uses distinct responsive cards for beta and development modules',()=>{
  const html=renderSeoPage('/hotel-pms-modules');
  assert.equal([...html.matchAll(/class="module-status-card"/g)].length,12);
  assert.equal([...html.matchAll(/class="module-status-icon" aria-hidden="true"/g)].length,12);
  for(const label of ['AI-асистент для працівників','Онлайн-оплата бронювання','Аналітика QR','ПРРО та інтеграція з Дією'])assert.ok(html.includes(label),`${label} should be presented as a scannable status card`);
  assert.match(html,/class="module-status-grid"[\s\S]*?class="module-status-card"/);
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
  assert.ok(css.includes('@media(min-width:901px){.ds2 .site-nav>.nav-item>.nav-disclosure[open]>.nav-submenu::before{content:"";position:absolute;left:0;right:0;top:-9px;height:10px;background:transparent}}'));
  assert.ok(js.includes("'(min-width: 901px) and (hover: hover) and (pointer: fine)'"));
  assert.ok(js.includes("detail.addEventListener('pointerenter'"));
  assert.ok(js.includes("detail.addEventListener('focusin'"));
  assert.ok(js.includes("summary?.addEventListener('click'"));
  assert.ok(js.includes("if(event.key!=='Escape'"));
  assert.ok(js.includes("detail.dataset.suppressFocusOpen==='true'"));
  assert.ok(js.includes("last.dataset.suppressFocusOpen='true';summary.focus()"));
});

test('mobile navigation keeps its plum surface behind light menu text',()=>{
  const css=readFileSync(fileURLToPath(new URL('../versions/v1/public/design-system-2.css',import.meta.url)),'utf8');
  assert.match(css,/@media\(max-width:900px\)\{\.ds2 \.header nav\{[^}]*background:var\(--plum\)/);
  assert.match(css,/\.ds2 \.header nav\.open \.nav-submenu a,\s*\.ds2 \.header nav\.open \.nav-submenu \.nav-disclosure>summary\{color:var\(--soft\)!important;background:transparent!important\}/);
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
