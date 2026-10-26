import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderPage } from '../versions/v1/render.mjs';
import { renderCaseList, renderCase, caseData } from '../versions/v1/cases.mjs';
import { renderBlogPage } from '../versions/v1/blog.mjs';
import { renderAuthorPage, renderKostiantynAuthorPage, renderAuthorsDirectory } from '../versions/v1/author-page.mjs';
import { renderEditorialArticle, editorialArticles } from '../versions/v1/article-library.mjs';
import { renderSecondPassArticle, secondPassArticles } from '../versions/v1/article-second-pass.mjs';
import { renderPmsArticle, pmsArticle } from '../versions/v1/article-pms.mjs';
import { renderPmsChoiceArticle, pmsChoiceArticle } from '../versions/v1/article-pms-choice.mjs';
import { renderToolsIndex, renderPmsChecklist, renderHotelProfitabilityCalculator, renderDirectBookingCostCalculator, renderHotelRoomCostCalculator, renderHousekeepingChecklist } from '../versions/v1/tools.mjs';
import { renderAdminTimeCalculator, renderWebsiteChecklist, renderGuestMessageBuilder, renderHousekeepingWorkloadCalculator, renderCancellationCalculator, renderReviewReplyTemplates } from '../versions/v1/advanced-tools.mjs';
import { renderResourceLibrary } from '../versions/v1/resource-library.mjs';
import { renderSeoPage, seoRoutes } from '../versions/v1/seo-pages.mjs';
import { renderOfferPage, renderRefundPage } from '../versions/v1/legal.mjs';
import { privacyPage } from '../versions/v1/server.mjs';
import { renderTouristTaxHub, renderTouristTaxCity, renderTouristTaxRates } from '../versions/v1/tourist-tax.mjs';
import { touristTaxCityRoutes } from '../versions/v1/tourist-tax-data.mjs';
import { renderTouristTaxFunnel } from '../microlandings/tourist-tax-funnel.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// The page metadata lives in the source HTML; the built asset bundle is only
// required for runtime/browser checks. Keep content audits runnable before build.
const qrStudioDist = path.join(root, 'qr-lab', 'dist', 'index.html');
const qrStudioHtml = readFileSync(existsSync(qrStudioDist) ? qrStudioDist : path.join(root, 'qr-lab', 'index.html'), 'utf8');
const pages = new Map([
  ['/', renderPage({ origin: 'https://www.vdalo.tech', full: true })],
  ['/cases', renderCaseList()], ['/blog', renderBlogPage({ origin: 'https://www.vdalo.tech' })],
  ['/authors', renderAuthorsDirectory()], ['/authors/oleh-stepeniev', renderAuthorPage()],
  ['/authors/kostiantyn-tripailo', renderKostiantynAuthorPage()], ['/privacy', privacyPage()],
  ['/offer', renderOfferPage()], ['/refunds', renderRefundPage()],
  ['/tools/', renderToolsIndex()], ['/tools/pms-checklist/', renderPmsChecklist()],
  ['/tools/qr-studio/', qrStudioHtml],
  ['/tools/hotel-profitability-calculator/', renderHotelProfitabilityCalculator()],
  ['/tools/direct-booking-cost-calculator/', renderDirectBookingCostCalculator()],
  ['/tools/hotel-room-cost-calculator/', renderHotelRoomCostCalculator()],
  ['/tools/housekeeping-checklist/', renderHousekeepingChecklist()],
  ['/tools/hotel-admin-time-calculator/', renderAdminTimeCalculator()],
  ['/tools/hotel-website-checklist/', renderWebsiteChecklist()],
  ['/tools/guest-message-builder/', renderGuestMessageBuilder()],
  ['/tools/housekeeping-workload-calculator/', renderHousekeepingWorkloadCalculator()],
  ['/tools/hotel-cancellation-cost-calculator/', renderCancellationCalculator()],
  ['/tools/hotel-review-response/', renderReviewReplyTemplates()],
  ['/resources', renderResourceLibrary()],
  ['/tourist-tax/', renderTouristTaxHub()], ['/tourist-tax/rates/', renderTouristTaxRates()], ['/tourist-tax/start', renderTouristTaxFunnel()],
  ...touristTaxCityRoutes().map(route => [route, renderTouristTaxCity(route.split('/').filter(Boolean).at(-1))]),
  [pmsArticle.slug, renderPmsArticle()], [pmsChoiceArticle.slug, renderPmsChoiceArticle()],
]);
for (const route of seoRoutes()) pages.set(route, renderSeoPage(route));
for (const c of caseData) pages.set(`/cases/${c.slug}`, renderCase(c.slug));
for (const a of editorialArticles) pages.set(a.slug, renderEditorialArticle(a.slug));
for (const a of secondPassArticles) pages.set(a.slug, renderSecondPassArticle(a.slug));

const errors = [], warnings = [], titleRoutes = new Map(), descriptionRoutes = new Map();
const localAssets = new Set();
const internalEdges = new Set();
const incomingRoutes = new Set();
for (const [route, html] of pages) {
  const normalizedDashes = html.replace(/&mdash;|&#0*8212;|&#x0*2014;/gi, '\u2014');
  if (normalizedDashes.includes('\u2014')) errors.push(`${route}: public HTML contains the prohibited U+2014 dash`);
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  const description = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i)?.[1];
  const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]*)"/i)?.[1];
  const h1Count = (html.match(/<h1\b/gi) || []).length;
  if (!html.includes('<html lang="uk">')) errors.push(`${route}: missing Ukrainian document language`);
  if (!title) errors.push(`${route}: missing title`);
  if (!description) errors.push(`${route}: missing meta description`);
  const expectedCanonical = `https://www.vdalo.tech${route}`;
  if (!canonical) errors.push(`${route}: missing canonical`);
  else if (canonical !== expectedCanonical) errors.push(`${route}: canonical points to ${canonical}, expected ${expectedCanonical}`);
  if (/https:\/\/vdalo\.tech(?=\/|["'])/i.test(html)) errors.push(`${route}: contains an absolute first-party URL on the non-canonical host`);
  if (h1Count !== 1) errors.push(`${route}: expected one H1, got ${h1Count}`);
  if (titleRoutes.has(title)) warnings.push(`${route}: title duplicates ${titleRoutes.get(title)}`); else titleRoutes.set(title, route);
  if (descriptionRoutes.has(description)) warnings.push(`${route}: description duplicates ${descriptionRoutes.get(description)}`); else descriptionRoutes.set(description, route);
  for (const img of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = img[0];
    if (!/\salt="[^"]*"/i.test(tag)) errors.push(`${route}: image missing alt attribute`);
    const src = tag.match(/\ssrc="([^"]+)"/i)?.[1];
    if (src?.startsWith('/v1/assets/')) localAssets.add(src.replace('/v1/', 'versions/v1/public/').split('?')[0]);
    else if (src?.startsWith('/assets/')) localAssets.add(src.replace('/assets/', 'versions/v1/public/assets/').split('?')[0]);
  }
  for (const schema of html.matchAll(/<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    try { JSON.parse(schema[1]); } catch { errors.push(`${route}: invalid JSON-LD`); }
  }
  const schemaTypes = [...html.matchAll(/<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].flatMap(match => {
    try {
      const parsed = JSON.parse(match[1]);
      return [parsed, ...(Array.isArray(parsed['@graph']) ? parsed['@graph'] : [])]
        .map(node => node?.['@type']).filter(Boolean);
    } catch { return []; }
  });
  if (route === '/' && !schemaTypes.includes('WebPage')) errors.push(`${route}: missing WebPage structured data on the homepage`);
  if (route !== '/' && route !== '/tools/qr-studio/' && schemaTypes.includes('SoftwareApplication')) errors.push(`${route}: SoftwareApplication schema is not appropriate as inherited page-level markup`);
  for (const href of html.matchAll(/<a\b[^>]*\shref="([^"]+)"/gi)) {
    const value = href[1];
    if ((value.startsWith('/') && !value.startsWith('//')) || value.startsWith('https://www.vdalo.tech/')) {
      const target = new URL(value, `https://www.vdalo.tech${route}`);
      let targetPath = target.pathname;
      if (targetPath.endsWith('/') && targetPath !== '/') targetPath = targetPath.slice(0, -1);
      if (targetPath === '/tools') targetPath = '/tools/';
      // Public downloads are allowlisted and byte-checked by the resource test,
      // rather than rendered as HTML pages in this route audit.
      if (targetPath.startsWith('/downloads/hotel/')) {
        const filename = path.join(root, 'versions', 'v1', 'public', targetPath.replace(/^\//, ''));
        if (!existsSync(filename)) errors.push(`${route}: linked public download is missing ${targetPath}`);
        continue;
      }
      const targetRoute = pages.has(targetPath) ? targetPath : pages.has(`${targetPath}/`) ? `${targetPath}/` : null;
      if (!targetRoute) errors.push(`${route}: internal link points to an unrendered route ${targetPath}`);
      else if (targetRoute !== route) {
        internalEdges.add(`${route} -> ${targetRoute}`);
        incomingRoutes.add(targetRoute);
      }
    }
    if (value.startsWith('#') || value.startsWith('/#')) {
      const id = decodeURIComponent(value.startsWith('/#') ? value.slice(2) : value.slice(1));
      const anchorPage = value.startsWith('/#') ? pages.get('/') : html;
      if (!(anchorPage || '').includes(`id="${id}"`)) errors.push(`${route}: broken local anchor #${id}`);
    }
  }
}
for (const asset of localAssets) if (!existsSync(path.join(root, asset))) errors.push(`Missing referenced image: ${asset}`);

const articleRoutes = [pmsArticle.slug, pmsChoiceArticle.slug, ...editorialArticles.map(a => a.slug), ...secondPassArticles.map(a => a.slug)];
for (const route of articleRoutes) {
  const html = pages.get(route) || '';
  const schemaText = html.match(/<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i)?.[1];
  const graph = schemaText ? JSON.parse(schemaText) : {};
  const posting = graph['@graph']?.find(node => ['BlogPosting', 'Article'].includes(node['@type'])) || graph;
  const authorPath = typeof posting.author?.url === 'string' ? new URL(posting.author.url).pathname : null;
  if (!authorPath || !html.includes(`href="${authorPath}"`)) errors.push(`${route}: visible author link does not match Article schema`);
  if (!html.includes('BlogPosting') && !html.includes('"@type":"Article"')) errors.push(`${route}: missing Article/BlogPosting structured data`);
  const published = html.match(/article:published_time" content="([^"]+)/)?.[1];
  const modified = html.match(/article:modified_time" content="([^"]+)/)?.[1];
  if (!published || !modified) errors.push(`${route}: missing publication/update metadata`);
  if (schemaText) {
    if (published && posting.datePublished !== published) errors.push(`${route}: visible publication date and schema differ`);
    if (modified && posting.dateModified !== modified) errors.push(`${route}: visible update date and schema differ`);
  }
  if (modified && !html.includes(`datetime="${modified}"`)) errors.push(`${route}: visible update date and machine-readable date differ`);
}
for (const c of caseData) {
  const route = `/cases/${c.slug}`, html = pages.get(route) || '';
  if (!html.includes('href="/authors/oleh-stepeniev"')) errors.push(`${route}: missing linked author attribution`);
  if (!html.includes('Метод і межі висновку')) errors.push(`${route}: missing evidence/method note`);
  if (!html.includes('Що перевірити у своєму готелі')) errors.push(`${route}: missing practical application step`);
}

console.log(`Rendered ${pages.size} active content pages: ${articleRoutes.length} articles, ${caseData.length} cases, ${seoRoutes().length} product/brand pages, blog, author, home, tools and legal.`);
const orphanRoutes = [...pages.keys()].filter(route => route !== '/' && !incomingRoutes.has(route));
console.log(`Unique titles: ${titleRoutes.size}; unique descriptions: ${descriptionRoutes.size}; local images checked: ${localAssets.size}.`);
console.log(`Observed internal route edges: ${internalEdges.size}; pages without an incoming internal link: ${orphanRoutes.length}${orphanRoutes.length ? ` (${orphanRoutes.join(', ')})` : ''}.`);
if (process.env.SEO_LINK_PROPOSALS && existsSync(process.env.SEO_LINK_PROPOSALS)) {
  const proposals = JSON.parse(readFileSync(process.env.SEO_LINK_PROPOSALS, 'utf8')).links || [];
  const present = proposals.filter(edge => internalEdges.has(`${edge.source_path} -> ${edge.target_path}`));
  console.log(`Proposed-link matrix: ${present.length}/${proposals.length} source→target route pairs already exist in rendered HTML (edge check; anchor wording not evaluated).`);
  for (const edge of proposals.filter(edge => !internalEdges.has(`${edge.source_path} -> ${edge.target_path}`))) {
    console.log(`MISSING PROPOSED EDGE ${edge.source_path} -> ${edge.target_path}: ${edge.anchor} [${edge.placement}]`);
  }
}
for (const warning of warnings) console.log(`WARN ${warning}`);
for (const error of errors) console.log(`FAIL ${error}`);
if (errors.length) process.exitCode = 1;
