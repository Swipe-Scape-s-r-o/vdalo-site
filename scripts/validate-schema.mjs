import { mkdir, readFile, writeFile } from 'node:fs/promises';

process.env.VERCEL = '1';
const [render, cases, blog, editorial, secondPass, pms, pmsChoice, tools, seo, legal, author, legacyServer, sitemap] = await Promise.all([
  import('../versions/v1/render.mjs'),
  import('../versions/v1/cases.mjs'),
  import('../versions/v1/blog.mjs'),
  import('../versions/v1/article-library.mjs'),
  import('../versions/v1/article-second-pass.mjs'),
  import('../versions/v1/article-pms.mjs'),
  import('../versions/v1/article-pms-choice.mjs'),
  import('../versions/v1/tools.mjs'),
  import('../versions/v1/seo-pages.mjs'),
  import('../versions/v1/legal.mjs'),
  import('../versions/v1/author-page.mjs'),
  import('../versions/v1/server.mjs'),
  import('../versions/v1/sitemap.mjs'),
]);
const { applySitewideSchema } = await import('../versions/v1/schema.mjs');
const [touristTax,touristTaxData] = await Promise.all([
  import('../versions/v1/tourist-tax.mjs'),
  import('../versions/v1/tourist-tax-data.mjs'),
]);
const origin = 'https://www.vdalo.tech';
// Structured data and SEO metadata are authored in the source HTML. The Vite
// bundle is not needed for schema validation, which should also run pre-build.
const qrStudioHtml = await readFile(new URL('../qr-lab/index.html', import.meta.url), 'utf8');
const serviceRoutes = new Set(['/hotel-booking-calendar','/hotel-check-in','/hotel-operations','/guest-communication','/hotel-automation']);
const renderers = new Map([
  ['/', () => render.renderPage({ origin, full: true, homepage: true })],
  ...seo.seoRoutes().map(path => [path, () => seo.renderSeoPage(path)]),
  ['/authors/oleh-stepeniev', () => author.renderAuthorPage()],
  ['/authors/kostiantyn-tripailo', () => author.renderKostiantynAuthorPage()],
  ['/authors', () => author.renderAuthorsDirectory()],
  ['/privacy', () => legacyServer.privacyPage()],
  ['/offer', () => legal.renderOfferPage()],
  ['/refunds', () => legal.renderRefundPage()],
  ['/cases', () => cases.renderCaseList()],
  ...cases.caseData.map(item => [`/cases/${item.slug}`, () => cases.renderCase(item.slug)]),
  ['/blog', () => blog.renderBlogPage({ origin })],
  [pms.pmsArticle.slug, () => pms.renderPmsArticle()],
  [pmsChoice.pmsChoiceArticle.slug, () => pmsChoice.renderPmsChoiceArticle()],
  ...editorial.editorialArticles.map(item => [item.slug, () => editorial.renderEditorialArticle(item.slug)]),
  ...secondPass.secondPassArticles.map(item => [item.slug, () => secondPass.renderSecondPassArticle(item.slug)]),
  ['/tools/', () => tools.renderToolsIndex()],
  ['/tools/qr-studio/', () => qrStudioHtml],
  ['/tools/pms-checklist/', () => tools.renderPmsChecklist()],
  ['/tools/hotel-profitability-calculator/', () => tools.renderHotelProfitabilityCalculator()],
  ['/tourist-tax/', () => touristTax.renderTouristTaxHub()],
  ...touristTaxData.touristTaxCityRoutes().map(path => [path, () => touristTax.renderTouristTaxCity(path.split('/').filter(Boolean).at(-1))]),
]);
const sitemapRoutes = sitemap.getPublicSitemapRoutes({seoRoutes:seo.seoRoutes(),caseSlugs:cases.caseSlugs,pmsArticle:pms.pmsArticle,pmsChoiceArticle:pmsChoice.pmsChoiceArticle,editorialArticles:editorial.editorialArticles,secondPassArticles:secondPass.secondPassArticles,touristTaxRoutes:['/tourist-tax/',...touristTaxData.touristTaxCityRoutes()]});
const routes = sitemapRoutes.map(path => [path, renderers.get(path)]);
const indexableRoutes = new Set(routes.map(([path]) => path));
const errors = [];
const rows = [];

function typesOf(node) { return new Set(Array.isArray(node?.['@type']) ? node['@type'] : [node?.['@type']]); }
function flatten(json) { return Array.isArray(json?.['@graph']) ? json['@graph'] : [json]; }
function validDateOnly(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
function expectedType(path) {
  if (path === '/about') return 'AboutPage';
  if (path === '/contact') return 'ContactPage';
  if (/^\/authors\/[^/]+$/.test(path)) return 'ProfilePage';
  if (['/solutions','/integrations','/blog','/cases','/tools/','/authors','/tourist-tax/'].includes(path)) return 'CollectionPage';
  return 'WebPage';
}

for (const [path, renderHtml] of routes) {
  if (!renderHtml) { errors.push(`${path}: sitemap route has no matching HTML renderer`); continue; }
  const rawHtml = renderHtml();
  const html = applySitewideSchema(rawHtml, path, indexableRoutes);
  const blocks = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  if (blocks.length !== 1) { errors.push(`${path}: expected one JSON-LD script, found ${blocks.length}`); continue; }
  let graph;
  try { graph = flatten(JSON.parse(blocks[0][1])); }
  catch (error) { errors.push(`${path}: invalid JSON-LD (${error.message})`); continue; }

  const ids = graph.map(node => node['@id']).filter(Boolean);
  if (new Set(ids).size !== ids.length) errors.push(`${path}: duplicate @id in graph`);
  const byId = new Map(graph.filter(node => node['@id']).map(node => [node['@id'], node]));
  const page = graph.find(node => node['@id'] === `${origin}${path}#webpage`);
  if (!page) errors.push(`${path}: missing canonical WebPage node`);
  else {
    if (!typesOf(page).has(expectedType(path))) errors.push(`${path}: expected ${expectedType(path)}, got ${[...typesOf(page)].join(',')}`);
    if (!page.name || !page.description) errors.push(`${path}: WebPage is missing a visible page name or description`);
  }
  if (!byId.has(`${origin}/#website`)) errors.push(`${path}: missing shared WebSite node`);
  if (!byId.has(`${origin}/#organization`)) errors.push(`${path}: missing shared Organization node`);
  for (const node of graph) {
    const nodeTypes = typesOf(node);
    if ((nodeTypes.has('SoftwareApplication') && path !== '/tools/qr-studio/') || ['FAQPage','AggregateRating','Review','Offer'].some(type => nodeTypes.has(type))) errors.push(`${path}: unsupported/unsubstantiated schema type ${[...nodeTypes].join(',')}`);
    for (const key of ['isPartOf','publisher','provider','mainEntity','mainEntityOfPage']) {
      const ref = node[key]?.['@id'];
      if (ref && ref.startsWith(`${origin}/`) && !byId.has(ref) && !ref.endsWith('#organization')) errors.push(`${path}: dangling ${key} reference ${ref}`);
    }
  }
  const canonical = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1] || '';
  if (canonical !== `${origin}${path}` && !(path === '/' && canonical === `${origin}/`)) errors.push(`${path}: canonical mismatch (${canonical})`);

  const isAnyBlogArticle = path.startsWith('/blog/') && path !== '/blog';
  const isCaseArticle = path.startsWith('/cases/') && path !== '/cases';
  if (isAnyBlogArticle || isCaseArticle) {
    const article = graph.find(node => typesOf(node).has('BlogPosting') || typesOf(node).has('Article'));
    if (!article) errors.push(`${path}: missing article entity`);
    else {
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      if (article.datePublished && (!datePattern.test(article.datePublished) || !validDateOnly(article.datePublished))) errors.push(`${path}: invalid datePublished`);
      if (article.dateModified && (!datePattern.test(article.dateModified) || !validDateOnly(article.dateModified))) errors.push(`${path}: invalid dateModified`);
      if (isCaseArticle && article.datePublished) errors.push(`${path}: case schema includes a publication date absent from visible content`);
      if (article.datePublished && !new RegExp(`<time\\b[^>]*datetime=["']${article.datePublished}["']`, 'i').test(html)) errors.push(`${path}: datePublished is not represented by a visible article time`);
      if (article.dateModified && !isCaseArticle && !new RegExp(`<time\\b[^>]*datetime=["']${article.dateModified}["']`, 'i').test(html)) errors.push(`${path}: dateModified is not represented by a visible article time`);
      if (article.dateModified && isCaseArticle) {
        const [,year,month,day] = article.dateModified.match(/^(\d{4})-(\d{2})-(\d{2})$/) || [];
        const months = ['січня','лютого','березня','квітня','травня','червня','липня','серпня','вересня','жовтня','листопада','грудня'];
        const hasUpdatedTime = new RegExp(`<time\\b[^>]*datetime=["']${article.dateModified}["']`, 'i').test(html);
        if (!hasUpdatedTime && !html.toLocaleLowerCase('uk').includes(`оновлено ${Number(day)} ${months[Number(month)-1]} ${year}`)) errors.push(`${path}: dateModified is not represented in visible case text`);
      }
      if (article.url !== canonical || !article.headline || !article.image) errors.push(`${path}: article is missing canonical URL, headline, or image`);
      const sourceArticle=[pms.pmsArticle,pmsChoice.pmsChoiceArticle,...editorial.editorialArticles,...secondPass.secondPassArticles].find(item=>item.slug===path);
      const expectedAuthorSlug=sourceArticle?.authorSlug||'oleh-stepeniev';
      if (article.author?.url !== `${origin}/authors/${expectedAuthorSlug}`) errors.push(`${path}: author is not linked to the configured author profile`);
      if (article.publisher?.['@id'] !== `${origin}/#organization`) errors.push(`${path}: publisher is not linked to shared Organization`);
    }
  }
  if (/^\/authors\/[^/]+$/.test(path) && !graph.some(node => typesOf(node).has('Person'))) errors.push(`${path}: missing author Person entity`);
  if (serviceRoutes.has(path)) {
    const service = graph.find(node => typesOf(node).has('Service'));
    if (!service) errors.push(`${path}: missing Service entity`);
    else if (service.provider?.['@id'] !== `${origin}/#organization`) errors.push(`${path}: Service provider reference is invalid`);
  }
  if (path === '/tools/qr-studio/') {
    const application = graph.find(node => typesOf(node).has('SoftwareApplication'));
    if (!application) errors.push(`${path}: missing SoftwareApplication entity`);
    else if (application.provider?.['@id'] !== `${origin}/#organization` || application.isAccessibleForFree !== true || application.featureList?.length < 4) errors.push(`${path}: incomplete SoftwareApplication details`);
    const title = html.match(/<title>([^<]*)<\/title>/i)?.[1] || '';
    const description = html.match(/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)?.[1] || '';
    const robots = html.match(/<meta\b[^>]*name=["']robots["'][^>]*content=["']([^"']*)["']/i)?.[1] || '';
    if (!/qr/i.test(title) || title.length > 60) errors.push(`${path}: title is missing the QR topic or exceeds 60 characters`);
    if (!description || description.length > 160) errors.push(`${path}: meta description is missing or exceeds 160 characters`);
    if (/noindex/i.test(robots)) errors.push(`${path}: QR Studio should be indexable`);
    if (!html.includes('og:image') || !html.includes('qr-studio-social-card.png')) errors.push(`${path}: missing page-specific social image`);
  }
  const crumb = graph.find(node => typesOf(node).has('BreadcrumbList'));
  if (crumb && (!Array.isArray(crumb.itemListElement) || crumb.itemListElement.some((item,index) => !Number.isInteger(item.position) || !item.name || (index < crumb.itemListElement.length - 1 && !item.item)))) errors.push(`${path}: malformed BreadcrumbList`);
  rows.push({ path, type: expectedType(path), canonical, graphNodes: graph.length, hasArticle: Boolean(graph.find(node => typesOf(node).has('BlogPosting') || typesOf(node).has('Article'))), hasService: Boolean(graph.find(node => typesOf(node).has('Service'))), hasSoftware: Boolean(graph.find(node => typesOf(node).has('SoftwareApplication'))), hasBreadcrumb: Boolean(crumb) });
}

if (new Set(routes.map(([path]) => path)).size !== routes.length) errors.push('Route matrix includes duplicates.');
const appIcon = await readFile(new URL('../versions/v1/public/assets/vdalo-app-icon.svg', import.meta.url), 'utf8');
if (!/viewBox=["']0 0 512 512["']/.test(appIcon)) errors.push('Organization logo app icon is missing its square 512 by 512 viewBox.');
const outputDir = new URL('../seo-workspace/schema/', import.meta.url);
await mkdir(outputDir, { recursive: true });
const csv = ['path,page_type,canonical,graph_nodes,article,service,software,breadcrumb', ...rows.map(row => [row.path,row.type,row.canonical,row.graphNodes,row.hasArticle,row.hasService,row.hasSoftware,row.hasBreadcrumb].map(value => `"${String(value).replace(/"/g,'""')}"`).join(','))].join('\n') + '\n';
await writeFile(new URL('SCHEMA_PAGE_MATRIX.csv', outputDir), csv, 'utf8');
const report = `# JSON-LD local validation report\n\n- Date: ${new Date().toISOString().slice(0,10)}\n- Rendered indexable routes: ${routes.length}\n- Passed routes: ${rows.length}\n- Errors: ${errors.length}\n- Method: direct server-template rendering, centralized schema transformation, JSON parsing, node-ID/reference checks, page-type checks, and content-policy checks.\n- External Google Rich Results Test and Schema.org Validator: not run; local changes are not deployed and those validators need public URLs.\n\n## Results\n\n${errors.length ? errors.map(error => `- FAIL: ${error}`).join('\n') : 'All local assertions passed.'}\n`;
await writeFile(new URL('SCHEMA_VALIDATION_REPORT.md', outputDir), report, 'utf8');
console.log(`Validated ${rows.length}/${routes.length} routes; ${errors.length} errors.`);
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
