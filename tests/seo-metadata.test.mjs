import test from 'node:test';
import assert from 'node:assert/strict';
import {renderRouteForReview} from '../scripts/review-render.mjs';
import {offers} from '../microlandings/content.mjs';
import {robotFunnelRoutes} from '../microlandings/robot-funnels.mjs';

const decode = value => value
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
const normalized = value => decode(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

test('every sitemap page has distinct, concise search metadata and an H1', async () => {
  const sitemap = await renderRouteForReview('/sitemap.xml');
  assert.equal(sitemap.status, 200);
  const urls = [...sitemap.html.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => decode(match[1]));
  assert.ok(urls.length > 0, 'sitemap must contain public URLs');
  assert.equal(new Set(urls).size, urls.length, 'sitemap URLs must be unique');
  const seen = {title:new Map(), description:new Map(), h1:new Map()};
  for (const url of urls) {
    const route = new URL(url).pathname;
    const {status,html} = await renderRouteForReview(route);
    assert.equal(status, 200, route);
    const title = normalized(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '');
    const description = normalized(html.match(/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i)?.[1] ?? '');
    const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map(match => normalized(match[1]));
    assert.ok(title, `${route}: missing title`);
    assert.ok(title.length <= 60, `${route}: title is ${title.length} characters`);
    assert.ok(description, `${route}: missing description`);
    assert.ok(description.length <= 160, `${route}: description is ${description.length} characters`);
    assert.equal(h1s.length, 1, `${route}: expected exactly one H1`);
    assert.ok(h1s[0], `${route}: empty H1`);
    for (const [key, value] of [['title',title],['description',description],['h1',h1s[0]]]) {
      const identity = value.toLocaleLowerCase('uk');
      assert.ok(!seen[key].has(identity), `${route}: duplicate ${key} with ${seen[key].get(identity)}`);
      seen[key].set(identity, route);
    }
  }
});

test('long locality titles retain the settlement, community and year on social metadata', async () => {
  const locations = [
    ['vilkhovets-010434','Вільховець','Богуславська'],
    ['berezhnytsya','Бережниця','Верховинська'],
    ['sukhodoly-029823','Суходоли','Володимирська'],
    ['dobrivlyany','Добрівляни','Заліщицька'],
    ['nadrichne-071178','Надрічне','Золотниківська'],
    ['novoselytsya-016362','Новоселиця','Королівська'],
    ['novoselytsya-023503','Новоселиця','Новоселицька'],
    ['volosyanka-054900','Волосянка','Ставненська'],
    ['dolyna-079740','Долина','Теребовлянська'],
    ['mshanets-096468','Мшанець','Теребовлянська'],
    ['trostyanets-060037','Тростянець','Тростянецька'],
    ['roztoky','Розтоки','Усть-Путильська'],
    ['mykhaylivka-018216','Михайлівка','Ямпільська'],
  ];
  for (const [slug, settlement, community] of locations) {
    const route = `/tourist-tax/${slug}/`;
    const {status,html} = await renderRouteForReview(route);
    assert.equal(status, 200, route);
    const title = normalized(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '');
    const ogTitle = normalized(html.match(/<meta property="og:title" content="([^"]*)">/)?.[1] ?? '');
    const twitterTitle = normalized(html.match(/<meta name="twitter:title" content="([^"]*)">/)?.[1] ?? '');
    assert.ok(title.length <= 60, route);
    for (const part of ['Туристичний збір','2026',settlement,community,'громада']) {
      assert.ok(title.includes(part), `${route}: missing ${part}`);
    }
    assert.equal(ogTitle, title, route);
    assert.equal(twitterTitle, title, route);
  }
});

test('campaign pages keep noindex while exposing concise metadata and an initial H1', async () => {
  const routes = [...new Set([
    '/funnel','/funnel/privacy','/go','/go/trial','/q','/free',
    ...[...robotFunnelRoutes.keys()].map(code => `/${code}`),
    ...offers.map(offer => offer.route),
    ...Array.from({length:59}, (_, index) => `/${index + 1}`),
    ...Array.from({length:5}, (_, index) => `/k${index + 1}`),
    ...['a','b','c','d','e'].map(variant => `/free?v=${variant}`),
  ])];
  for (const route of routes) {
    const {status,html} = await renderRouteForReview(route);
    assert.equal(status, 200, route);
    const title = normalized(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '');
    const description = normalized(html.match(/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i)?.[1] ?? '');
    const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map(match => normalized(match[1]));
    assert.ok(title && title.length <= 60, `${route}: title length ${title.length}`);
    assert.ok(description && description.length <= 160, `${route}: description length ${description.length}`);
    assert.equal(h1s.length, 1, `${route}: expected one H1`);
    assert.ok(h1s[0], `${route}: H1 is initially empty`);
    assert.match(html, /<meta\b[^>]*name=["']robots["'][^>]*content=["']noindex/i, route);
  }
});

test('calculator H1 fallback matches the heading used by its client script', async () => {
  for (let id = 1; id <= 5; id++) {
    const route = `/k${id}`;
    const {html} = await renderRouteForReview(route);
    const initial = html.match(/<h1 id="k-h1">([\s\S]*?)<\/h1>/)?.[1] ?? '';
    const client = html.match(new RegExp(`\\b${id}: \\{[^{}]*?\\bh1: '([^']+)'`, 's'))?.[1] ?? '';
    assert.ok(initial && client, route);
    assert.equal(initial, client, route);
  }
});

test('fuel calculator metadata describes the calculation actually shown', async () => {
  const {html} = await renderRouteForReview('/k5');
  const title = normalized(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '');
  const description = normalized(html.match(/<meta name="description" content="([^"]*)">/)?.[1] ?? '');
  assert.match(title,/пальн/iu);
  assert.match(description,/пальн/iu);
});
