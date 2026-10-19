import { Readable } from 'node:stream';
import {caseSlugs} from '../versions/v1/cases.mjs';
import {editorialArticles} from '../versions/v1/article-library.mjs';
import {secondPassArticles} from '../versions/v1/article-second-pass.mjs';
import {pmsArticle} from '../versions/v1/article-pms.mjs';
import {pmsChoiceArticle} from '../versions/v1/article-pms-choice.mjs';
import {seoRoutes} from '../versions/v1/seo-pages.mjs';
import {offers} from '../microlandings/content.mjs';
import {touristTaxCityRoutes} from '../versions/v1/tourist-tax-data.mjs';

const base = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:4450';
let inProcessServer = null;
if (process.env.AUDIT_IN_PROCESS === '1') {
  process.env.VERCEL ||= '1';
  ({default: inProcessServer} = await import('../server.mjs'));
}
async function auditFetch(input, options = {}) {
  if (!inProcessServer) return fetch(input, options);
  let target = new URL(input);
  for (let redirects = 0; redirects <= 5; redirects++) {
    const method = options.method || 'GET';
    const request = new Readable({read() { this.push(null); }});
    request.method = method;
    request.url = `${target.pathname}${target.search}`;
    request.headers = { 'accept-encoding': '', ...(options.headers || {}) };
    const response = await new Promise(resolve => {
      let status = 200;
      const headers = {};
      let body = Buffer.alloc(0);
      const mockResponse = {
        writeHead(code, values = {}) { status = code; Object.assign(headers, values); return this; },
        end(value) {
          if (value !== undefined) body = Buffer.isBuffer(value) ? value : Buffer.from(String(value));
          resolve({status, headers: new Headers(headers), body,
            ok: status >= 200 && status < 300,
            text: async () => body.toString('utf8')});
        },
      };
      inProcessServer.emit('request', request, mockResponse);
    });
    const location = response.headers.get('location');
    if (options.redirect === 'follow' && statusIsRedirect(response.status) && location) {
      target = new URL(location, target);
      continue;
    }
    return response;
  }
  throw new Error(`Too many redirects while auditing ${input}`);
}
function statusIsRedirect(status) { return status >= 300 && status < 400; }
const campaignRoutes = [
  '/funnel', '/funnel/privacy', '/go', '/go/trial',
  ...offers.map(offer => offer.route),
  ...Array.from({length: 55}, (_, index) => `/${index + 1}`),
  ...Array.from({length: 5}, (_, index) => `/k${index + 1}`),
];
const routes = [...new Set([
  '/', '/solutions', '/integrations', '/pricing', '/hotel-booking-calendar',
  '/hotel-check-in', '/hotel-operations', '/guest-communication',
  '/hotel-automation', '/sign-up', '/about', '/contact',
  '/privacy', '/offer', '/refunds', '/cases', ...caseSlugs,
  '/blog', pmsArticle.slug, pmsChoiceArticle.slug,
  ...editorialArticles.map(article => article.slug), ...secondPassArticles.map(article => article.slug),
  ...seoRoutes(), '/authors', '/authors/oleh-stepeniev', '/authors/kostiantyn-tripailo', '/tools/', '/tools/qr-studio/', '/tools/pms-checklist/',
  '/tools/hotel-profitability-calculator/', ...campaignRoutes,
  '/tourist-tax/', '/tourist-tax/start', ...touristTaxCityRoutes(),
  '/robots.txt', '/sitemap.xml',
])];
const campaignRouteSet = new Set(campaignRoutes);
const errors = [];
const warnings = [];
const titles = new Map();
const checkedImages = new Set();
const checkedLinks = new Set();

for (const route of routes) {
  const response = await auditFetch(new URL(route, base));
  if (!response.ok) {
    errors.push(`${route}: HTTP ${response.status}`);
    continue;
  }
  const type = response.headers.get('content-type') || '';
  const html = await response.text();
  if (route === '/authors') {
    for (const [name, profile] of [['Олег Степенєв', '/authors/oleh-stepeniev'], ['Костянтин Тріпайло', '/authors/kostiantyn-tripailo']]) {
      if (!html.includes(name) || !html.includes(`href="${profile}"`)) errors.push(`/authors: missing visible profile link for ${name}`);
    }
  }
  if (route === '/robots.txt') {
    if (!html.includes('Sitemap: https://www.vdalo.tech/sitemap.xml')) errors.push('/robots.txt: sitemap pointer does not use canonical host');
    continue;
  }
  if (route === '/sitemap.xml') {
    if (!/<loc>https:\/\/www\.vdalo\.tech\//i.test(html)) errors.push('/sitemap.xml: locations do not use canonical host');
    if (/<loc>https:\/\/vdalo\.tech\//i.test(html)) errors.push('/sitemap.xml: contains non-canonical host locations');
    const sitemapPaths = new Set([...html.matchAll(/<loc>(https:\/\/www\.vdalo\.tech[^<]*)<\/loc>/gi)].map(match => new URL(match[1]).pathname));
    const noindexRoutes = new Set(['/authors/kostiantyn-tripailo', '/tourist-tax/start']);
    const expectedIndexableRoutes = routes.filter(path => !campaignRouteSet.has(path) && !noindexRoutes.has(path) && !['/robots.txt', '/sitemap.xml'].includes(path));
    for (const path of expectedIndexableRoutes) if (!sitemapPaths.has(path)) errors.push(`/sitemap.xml: missing indexable route ${path}`);
    for (const path of sitemapPaths) if (campaignRouteSet.has(path)) errors.push(`/sitemap.xml: campaign/noindex route should not be included: ${path}`);
    continue;
  }
  if (!type.includes('text/html')) {
    errors.push(`${route}: expected HTML, got ${type}`);
    continue;
  }
  const title = html.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim();
  const description = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i)?.[1];
  const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]*)"/i)?.[1];
  const h1Count = (html.match(/<h1\b/gi) || []).length;
  for (const image of html.matchAll(/<img\b[^>]*>/gi)) {
    if (!/\salt="/i.test(image[0])) errors.push(`${route}: image is missing an alt attribute`);
  }
  if (!title) errors.push(`${route}: missing title`);
  else if (!campaignRouteSet.has(route)) {
    const previous = titles.get(title);
    if (previous) warnings.push(`${route}: duplicate title with ${previous}: ${title}`);
    else titles.set(title, route);
  }
  if (!description) warnings.push(`${route}: missing meta description`);
  if (campaignRouteSet.has(route)) {
    if (!/noindex,nofollow/.test(html)) warnings.push(`${route}: campaign landing should be noindex`);
  } else {
    const expectedCanonical = `https://www.vdalo.tech${route}`;
    if (!canonical || canonical !== expectedCanonical) warnings.push(`${route}: canonical missing or unexpected (${canonical || 'none'}; expected ${expectedCanonical})`);
    if (h1Count !== 1) warnings.push(`${route}: expected one H1, found ${h1Count}`);
  }
  const schemaTypesOnPage = [];
  for (const match of html.matchAll(/<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(match[1]);
      schemaTypesOnPage.push(...[parsed, ...(Array.isArray(parsed['@graph']) ? parsed['@graph'] : [])]
        .map(node => node?.['@type']).filter(Boolean));
    }
    catch { errors.push(`${route}: invalid JSON-LD`); }
  }
  if (route === '/' && !schemaTypesOnPage.includes('WebPage')) errors.push(`${route}: missing homepage WebPage schema`);
  if (route !== '/' && route !== '/tools/qr-studio/' && schemaTypesOnPage.includes('SoftwareApplication')) errors.push(`${route}: unexpected SoftwareApplication schema`);
  for (const match of html.matchAll(/<(?:img|source|video)\b[^>]*\s(?:src|srcset|poster)="([^"]+)"/gi)) {
    const raw = match[1].split(',')[0].trim().split(/\s+/)[0];
    if (!raw || raw.startsWith('data:') || raw.startsWith('https://')) continue;
    const target = new URL(raw, new URL(route, base));
    if (checkedImages.has(target.pathname)) continue;
    checkedImages.add(target.pathname);
    const image = await auditFetch(target, {method: 'HEAD'});
    if (!image.ok) errors.push(`${route}: image ${target.pathname} returned HTTP ${image.status}`);
  }
  for (const match of html.matchAll(/<a\b[^>]*\shref="([^"]+)"/gi)) {
    const raw = match[1];
    if (!raw || raw.startsWith('#') || /^(?:mailto:|tel:|javascript:|https?:\/\/)/i.test(raw)) continue;
    const target = new URL(raw, new URL(route, base));
    if (target.origin !== new URL(base).origin || checkedLinks.has(target.pathname)) continue;
    checkedLinks.add(target.pathname);
    const linked = await auditFetch(target, {method: 'HEAD', redirect: 'follow'});
    if (!linked.ok) errors.push(`${route}: link ${target.pathname} returned HTTP ${linked.status}`);
  }
}

for (const name of ['staff-checkin.webp', 'night-answers.webp', 'channel-sync.webp', 'direct-bookings.webp', 'power-mobile.webp']) {
  const response = await auditFetch(new URL(`/sms-trial-assets/top5/art/${name}`, base));
  if (!response.ok) errors.push(`/sms-trial-assets/top5/art/${name}: HTTP ${response.status}`);
  else if (!response.headers.get('content-type')?.includes('image/webp')) errors.push(`${name}: expected image/webp response`);
  else if (Number(response.headers.get('content-length')) > 300_000) warnings.push(`${name}: optimized artwork exceeds 300 KB`);
}

const redirectCases = new Map([
  ['/blog/', '/blog'], ['/cases/', '/cases'], ['/authors/', '/authors'],
  ['/authors/oleh-stepeniev/', '/authors/oleh-stepeniev'],
  ['/authors/kostiantyn-tripailo/', '/authors/kostiantyn-tripailo'],
  ['/tools', '/tools/'], ['/tools/pms-checklist', '/tools/pms-checklist/'],
  ['/tools/hotel-profitability-calculator', '/tools/hotel-profitability-calculator/'],
  ['/cases/hotel-ai-reception', '/cases/night-self-checkin-germany'], ['/go/', '/go'],
  ['/k1/', '/k1'], ...caseSlugs.map(route => [`${route}/`, route]),
  ...seoRoutes().map(route => [`${route}/`, route]),
  ...[pmsArticle.slug, pmsChoiceArticle.slug, ...editorialArticles.map(article => article.slug), ...secondPassArticles.map(article => article.slug)]
    .map(route => [`${route}/`, route]),
  ...Array.from({length:5}, (_, index) => [`/k${index + 1}/`, `/k${index + 1}`]),
]);
for (const [source, expectedTarget] of redirectCases) {
  const response = await auditFetch(new URL(source, base));
  const location = response.headers.get('location');
  if (response.status !== 308) errors.push(`${source}: expected a single 308 canonical redirect, got ${response.status}`);
  else if (!location || new URL(location, new URL(source, base)).pathname !== expectedTarget) errors.push(`${source}: redirect target is ${location || 'missing'}, expected ${expectedTarget}`);
  else {
    const target = await auditFetch(new URL(location, new URL(source, base)));
    if (!target.ok) errors.push(`${source}: redirect target ${expectedTarget} returned HTTP ${target.status}`);
  }
}

console.log(`Checked ${routes.length} routes; ${redirectCases.size} canonical redirects; ${checkedImages.size} unique local media assets; 5 funnel WebP assets; ${checkedLinks.size} internal links; ${titles.size} unique page titles.`);
for (const warning of warnings) console.log(`WARN ${warning}`);
for (const error of errors) console.log(`FAIL ${error}`);
if (errors.length) process.exitCode = 1;
