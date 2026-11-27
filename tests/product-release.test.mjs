import assert from 'node:assert/strict';
import test from 'node:test';
import {renderRouteForReview} from '../scripts/review-render.mjs';

const release = [
  ['/hotel-self-check-in-kiosk', '/hotel-check-in', '/contact'],
  ['/hotel-front-desk', '/hotel-booking-calendar', '/sign-up'],
  ['/solutions/glamping', '/solutions', '/contact'],
  ['/solutions/apartments', '/hotel-multi-property', '/contact'],
  ['/integrations/booking-com', '/blog/yak-pidkliuchyty-booking-com-do-pms', '/contact'],
  ['/integrations/airbnb', '/hotel-channel-manager', '/contact'],
  ['/integrations/vrbo', '/integrations', '/contact'],
  ['/integrations/google-hotels', '/hotel-channel-manager', '/contact'],
  ['/hotel-channel-sales-alerts', '/hotel-channel-manager', '/contact'],
  ['/hotel-price-autopilot', '/hotel-pms-modules', '/contact']
];

test('product releases keep pages discoverable through their intended entry points', async () => {
  const {html: sitemap} = await renderRouteForReview('/sitemap.xml');
  const {status: styleStatus, headers} = await renderRouteForReview('/v1/page-design.css');
  assert.equal(styleStatus, 200);
  assert.match(headers['Content-Type'], /^text\/css/);
  for (const [route, source, cta] of release) {
    const {status, html} = await renderRouteForReview(route);
    assert.equal(status, 200, route);
    assert.ok(html.includes(`rel="canonical" href="https://www.vdalo.tech${route}"`), route);
    const entries = sitemap.split(`<loc>https://www.vdalo.tech${route}</loc>`).length - 1;
    assert.equal(entries, 1, route);
    assert.equal([...html.matchAll(/<h1\b/g)].length, 1, route);
    assert.match(html, /Часті запитання/);
    assert.match(html, /<div class="product-release-faq"><details><summary>[^<]+<\/summary><p>[^<]+<\/p><\/details>/);
    assert.match(html, /href="\/v1\/page-design\.css\?v=/);
    const hero = html.match(/<section class="seo-hero product-release-hero">[\s\S]*?<\/section>/)?.[0];
    const visual = hero?.match(/<img class="design-(?:icon|property-art)" src="([^"]+)"/)?.[1];
    assert.ok(visual, route + ' is missing a hero visual');
    const image = await renderRouteForReview(visual);
    assert.equal(image.status, 200, visual);
    assert.equal(image.headers['Content-Type'], 'image/webp', visual);
    assert.ok(html.includes(`class="button" href="${cta}" data-location="product-page" data-cta-placement="hero"`), route);
    assert.ok(html.includes(`class="button" href="${cta}" data-location="product-page" data-cta-placement="final"`), route);
    assert.doesNotMatch(html, /channex|\u2014/iu);

    const sourcePage = await renderRouteForReview(source);
    const main = sourcePage.html.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0] ?? '';
    assert.equal(sourcePage.status, 200, source);
    assert.ok(main.includes(`href="${route}"`), `Missing contextual link from ${source} to ${route}`);

    const redirect = await renderRouteForReview(`${route}/?ref=example`);
    assert.equal(redirect.status, 308, route);
    assert.equal(redirect.headers.Location, `${route}?ref=example`, route);
  }
});

test('product copy explains payment and contact-field boundaries', async () => {
  const {html: kiosk} = await renderRouteForReview('/hotel-self-check-in-kiosk');
  const {html: airbnb} = await renderRouteForReview('/integrations/airbnb');
  const {html: currentCalendar} = await renderRouteForReview('/hotel-booking-calendar');
  assert.match(kiosk, /Оплата на кіоску запланована/);
  assert.match(airbnb, /електронна адреса гостя Airbnb не надходить/);
  assert.match(currentCalendar, /«Перейти до дати»[^<]*92 дні/);
  const {html: frontDesk} = await renderRouteForReview('/hotel-front-desk');
  assert.match(frontDesk, /href="\/hotel-guest-profile">Картка гостя та історія проживань/);
});

test('channel checks and price modes keep their scope across the new and existing pages', async () => {
  const {html: vrbo} = await renderRouteForReview('/integrations/vrbo');
  const {html: google} = await renderRouteForReview('/integrations/google-hotels');
  const {html: signal} = await renderRouteForReview('/hotel-channel-sales-alerts');
  const {html: autopilot} = await renderRouteForReview('/hotel-price-autopilot');
  const {html: revenues} = await renderRouteForReview('/hotel-revenue-management');
  const {html: modules} = await renderRouteForReview('/hotel-pms-modules');
  const {html: integrations} = await renderRouteForReview('/integrations');
  assert.match(vrbo, /Контактні поля звіряйте в картці конкретного бронювання/);
  assert.doesNotMatch(google.match(/<main\b[\s\S]*?<\/main>/i)[0], /Google Hotel Ads|Free Booking Links/);
  assert.match(signal, /Адміністратор перевіряє пропозицію на майданчику/);
  assert.match(autopilot, /<th scope="row">Вручну<\/th><td>Працівник<\/td><td>Не застосовуються<\/td>/);
  assert.match(autopilot, /<th scope="row">Автопілот<\/th><td>Автоматичний режим<\/td><td>Застосовуються<\/td>/);
  for (const html of [revenues, modules]) {
    assert.match(html, /Автопілот ціни доступний/);
    assert.match(html, /href="\/hotel-price-autopilot"/);
    assert.match(html, /БЕТА/);
  }
  assert.match(integrations, /Підключення Agoda наразі на паузі/);
  for (const href of ['/integrations/vrbo', '/integrations/google-hotels', '/hotel-channel-sales-alerts']) {
    assert.ok(integrations.match(/<main\b[\s\S]*?<\/main>/i)[0].includes(`href="${href}"`), href);
  }
});

test('help instructions link to the working calendar and contact routes', async () => {
  const {status, html} = await renderRouteForReview('/help');
  assert.equal(status, 200);
  assert.match(html, /href="\/hotel-booking-calendar">вебдемо календаря/);
  assert.match(html, /href="\/contact">зверніться до команди VDALO/);
  for (const id of ['help-open-booking', 'help-calendar-week']) {
    assert.ok(html.includes(`href="#${id}"`), id);
    assert.ok(html.includes(`id="${id}"`), id);
  }
});

test('content drafts require an explicitly enabled loopback request', async (context) => {
  const previews = [
    ['/multi-property-booking-page', /Потрібна жива перевірка/],
    ['/demo', /id="reservation-grid"/],
    ['/updates', /datetime="2026-11-07"/],
    ['/hotel-process-audit', /id="audit-example"/],
    ['/hotelier-interview', /id="interview-topics"/],
    ['/migration/spreadsheets', /id="migration-csv"/],
    ['/solutions/mini-hotel', /id="reservation-grid"/],
    ['/solutions/guest-house', /id="reservation-grid"/],
    ['/solutions/resort', /id="resort-handoff"/],
    ['/solutions/camping', /id="camping-pitch-workflow"/],
    ['/solutions/hostel', /id="hostel-bed-workflow"/],
    ['/solutions/hotel-owner', /id="owner-week-decisions"/],
    ['/solutions/hotel-manager', /id="manager-delay"/],
    ['/hotel-room-inventory', /id="room-stock-scenario"/],
    ['/hotel-erp', /id="erp-financial-flow"/],
    ['/hotel-analytics', /id="hotel-analytics-week"/],
    ['/hotel-invoicing', /id="hotel-invoice-example"/],
    ['/hotel-upselling', /id="guest-service-order"/],
    ['/hotel-guest-crm', /id="repeat-guest-segment"/],
    ['/hotel-unified-inbox', /id="guest-message-handoff"/],
    ['/hotel-laundry-inventory', /id="linen-movement"/],
    ['/hotel-restaurant-management', /id="restaurant-room-charge"/],
    ['/hotel-group-bookings', /id="group-booking-changes"/],
    ['/hotel-guest-register', /id="guest-register-sample"/],
    ['/hotel-foreign-guest-registration', /id="foreign-guest-check"/],
    ['/hotel-passport-scanning', /id="document-reading-check"/],
    ['/blog/hotel-guest-data', /id="guest-data-review"/],
    ['/hotel-online-payments', /id="website-payment-check"/],
    ['/integrations/diia', /id="diia-handoff-check"/],
    ['/integrations/ttlock', /id="ttlock-acceptance"/],
    ['/integrations/expedia', /id="expedia-connection-check"/],
    ['/developers/api', /id="api-first-request"/],
    ['/security', /id="hotel-access-review"/],
    ['/help/export-hotel-data', /id="hotel-export-sample"/],
    ['/research/hotel-pms-ukraine', /id="lviv-booking-observations"/],
    ['/research/hotel-pms-support-topics', /id="pms-review-topics"/],
    ['/research/hotelier-pms-selection', /id="hotel-pms-selection-interviews"/],
    ['/cases/ukraine-direct-bookings', /id="direct-booking-case-check"/],
    ['/cases/ukraine-hotel-pilot', /id="hotel-pilot-case-check"/],
    ['/cases/hotel-restaurant-order', /id="hotel-restaurant-case-check"/],
    ['/hotel-resource-booking', /id="spa-hotel-workflow"/],
    ['/tools/hotel-ota-payout-template/', /download="vdalo-ota-payout.csv"/],
    ['/hotel-pms-pilot', /id="pilot-checklist"/]
  ];
  const previous = process.env.VDALO_LOCAL_CONTENT_PREVIEW;
  context.after(() => {
    if (previous === undefined) delete process.env.VDALO_LOCAL_CONTENT_PREVIEW;
    else process.env.VDALO_LOCAL_CONTENT_PREVIEW = previous;
  });
  delete process.env.VDALO_LOCAL_CONTENT_PREVIEW;
  for (const [route] of previews) {
    assert.equal((await renderRouteForReview(route)).status, 404, route);
  }

  const workbookRoute = '/tools/hotel-ota-payout-template/download.xlsx';
  const exportRoute = '/help/export-hotel-data?download=csv';
  assert.equal((await renderRouteForReview(workbookRoute)).status, 404);
  assert.equal((await renderRouteForReview(exportRoute)).status, 404);
  process.env.VDALO_LOCAL_CONTENT_PREVIEW = '1';
  const deferredMigrationRoutes = ['/migration/servio-hms', '/cases/ukraine-pms-migration'];
  const {html: sitemap} = await renderRouteForReview('/sitemap.xml');
  for (const route of deferredMigrationRoutes) {
    assert.equal((await renderRouteForReview(route)).status, 404, route);
    assert.ok(!sitemap.includes(`<loc>https://www.vdalo.tech${route}</loc>`), route);
  }
  const workbook = await renderRouteForReview(workbookRoute);
  assert.equal(workbook.status, 200);
  assert.equal(workbook.headers['Cache-Control'], 'no-store');
  assert.equal(workbook.headers['X-Robots-Tag'], 'noindex, nofollow');
  assert.match(workbook.headers['Content-Type'], /spreadsheetml/);
  assert.match(workbook.html, /^PK/);
  const sample = await renderRouteForReview(exportRoute);
  assert.equal(sample.status, 200);
  assert.equal(sample.headers['Content-Type'], 'text/csv; charset=utf-8');
  assert.equal(sample.headers['Content-Disposition'], 'attachment; filename="vdalo-export-check-example.csv"');
  assert.equal(sample.headers['Cache-Control'], 'no-store');
  assert.equal(sample.headers['X-Robots-Tag'], 'noindex, nofollow');
  assert.equal(sample.html, '\uFEFFкод,дата,категорія,сума,валюта\r\nЕК-01,2026-12-07,Надходження,1250,UAH\r\nЕК-02,2026-12-09,Витрата,450,UAH\r\n');
  for (const opts of [{host: 'www.vdalo.tech'}, {host: 'staging.vdalo.tech'}, {remoteAddress: '192.0.2.10'}]) {
    assert.equal((await renderRouteForReview(workbookRoute, undefined, opts)).status, 404);
    assert.equal((await renderRouteForReview(exportRoute, undefined, opts)).status, 404);
  }
  for (const [route, marker] of previews) {
    for (const opts of [{host: 'www.vdalo.tech'}, {host: 'staging.vdalo.tech'}, {remoteAddress: '192.0.2.10'}]) {
      assert.equal((await renderRouteForReview(route, undefined, opts)).status, 404, route);
    }
    const {status, html, headers} = await renderRouteForReview(route);
    assert.equal(status, 200, route);
    assert.equal(headers['Cache-Control'], 'no-store');
    assert.equal(headers['X-Robots-Tag'], 'noindex, nofollow');
    assert.match(html, /name="robots" content="noindex,nofollow"/);
    assert.match(html, /Внутрішній перегляд/);
    assert.match(html, marker);
    if (route === '/updates') {
      assert.match(html, /href="\/help"[^>]*>Відкрити інструкції/);
      assert.doesNotMatch(html, /href="\/v1\/help"/);
      assert.equal((await renderRouteForReview('/help')).status, 200);
    }
    assert.doesNotMatch(html, /rel="canonical"|application\/ld\+json/);
  }

  const solutions = await renderRouteForReview('/solutions');
  assert.match(solutions.html, /id="independent-hotel-workflow"/);
  assert.equal((await renderRouteForReview('/solutions/independent-hotel')).status, 404);
  const operations = await renderRouteForReview('/hotel-operations');
  assert.match(operations.html, /id="downtime-reception-workflow"/);
  assert.equal((await renderRouteForReview('/blog/hotel-downtime-plan')).status, 404);
  assert.match((await renderRouteForReview('/integrations')).html, /id="hotels24-compatibility"/);
  assert.match((await renderRouteForReview('/hotel-revenue-management')).html, /id="market-price-comparison"/);
  for (const candidate of ['/integrations/hotels24', '/hotel-rate-shopping']) {
    assert.equal((await renderRouteForReview(candidate)).status, 404);
  }

  for (const path of ['/', '/solutions', '/sign-up', '/hotel-direct-booking', '/integrations', '/privacy', '/help', '/hotel-access-control', '/hotel-multi-property', '/hotel-pms-migration', '/hotel-operations', '/hotel-housekeeping', '/hotel-booking-calendar', '/hotel-finance', '/hotel-guest-app', '/hotel-guest-profile', '/hotel-check-in', '/guest-communication', '/hotel-events', '/contact', '/resources', '/blog', '/cases', '/cases/direct-bookings-calendar', '/cases/hotel-data-migration', '/cases/booking-widget-study-2118', '/cases/hotel-booking-reconciliation', '/sitemap.xml']) {
    const publicPage = await renderRouteForReview(path);
    for (const [route] of previews) {
      assert.ok(!publicPage.html.includes(`href="${route}"`), path);
      assert.ok(!publicPage.html.includes(`https://www.vdalo.tech${route}</loc>`), path);
    }
  }
});
