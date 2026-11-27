
import {assetUrl, assetVersion} from './assets.mjs';
import {escapeHtml as e} from './content-revisions/html-fragments.mjs';

const routeIcons = {
  checkin: ['/hotel-self-check-in-kiosk'],
  shift: ['/hotel-front-desk', '/blog/night-front-desk', '/tools/front-desk-shift-handover/'],
  glamping: ['/solutions/glamping', '/tools/glamping-season-planner/'],
  apartment: ['/solutions/apartments'],
  channels: ['/integrations/booking-com', '/integrations/airbnb', '/integrations/vrbo', '/integrations/google-hotels', '/integrations/expedia', '/integrations/hotels24', '/hotel-channel-sales-alerts', '/blog/hotel-channel-mix', '/blog/hotel-google-booking-links', '/tools/hotel-ota-payout-template/'],
  rates: ['/hotel-price-autopilot', '/hotel-market-rate-monitoring', '/blog/hotel-rate-plans', '/blog/hotel-rate-restrictions', '/blog/hotel-corporate-rates', '/tools/hotel-rate-calendar/', '/tools/long-stay-discount/'],
  multisite: ['/multi-property-booking-page'],
  hotel: ['/solutions/mini-hotel', '/solutions/hotel-owner', '/research/hotel-pms-ukraine'],
  guesthouse: ['/solutions/guest-house'],
  resort: ['/solutions/resort'],
  camping: ['/solutions/camping'],
  hostel: ['/solutions/hostel'],
  team: ['/solutions/hotel-manager', '/hotel-process-audit', '/hotelier-interview'],
  erp: ['/hotel-erp'],
  rooms: ['/hotel-room-inventory'],
  services: ['/hotel-upselling', '/hotel-resource-booking', '/blog/hotel-spa-upsell'],
  reports: ['/hotel-analytics', '/blog/night-audit-hotel', '/blog/hotel-occupancy-forecast', '/tools/hotel-pickup-report/', '/tools/hotel-owner-weekly-report/'],
  invoice: ['/hotel-invoicing', '/tools/group-booking-quote/'],
  profile: ['/hotel-guest-crm'],
  documents: ['/hotel-guest-register', '/hotel-foreign-guest-registration', '/hotel-passport-scanning', '/integrations/diia', '/blog/hotel-guest-data', '/help/export-hotel-data'],
  inventory: ['/hotel-laundry-inventory', '/tools/hotel-linen-par-stock/', '/tools/hotel-lost-and-found/'],
  pay: ['/hotel-online-payments', '/tools/pms-cost-calculator/', '/tools/hotel-cash-flow-budget/'],
  restaurant: ['/hotel-restaurant-management', '/tools/hotel-breakfast-list/', '/cases/hotel-restaurant-order'],
  messages: ['/hotel-unified-inbox', '/blog/hotel-guest-reviews'],
  integration: ['/developers/api'],
  access: ['/integrations/ttlock', '/security'],
  direct: ['/blog/google-business-profile-hotel', '/blog/hotel-website-conversion', '/cases/ukraine-direct-bookings'],
  booking: ['/hotel-group-bookings', '/compare/pms-vs-excel', '/blog/group-bookings-rooming-list', '/blog/hotel-no-show', '/blog/hotel-corporate-sales', '/blog/hotel-booking-lead-time', '/blog/hotel-room-allotment', '/blog/hotel-waiting-list', '/blog/hotel-one-night-gaps', '/tools/hotel-booking-calendar-excel/'],
  tasks: ['/blog/hotel-season-preparation', '/blog/opening-hotel-operations', '/hotel-pms-pilot', '/research/hotelier-pms-selection', '/cases/ukraine-hotel-pilot', '/updates'],
  pms: ['/demo', '/migration/spreadsheets'],
  repair: ['/tools/hotel-maintenance-log/'],
  help: ['/help', '/research/hotel-pms-support-topics']
};

const pageIcons = new Map(Object.entries(routeIcons).flatMap(([icon, routes]) => routes.map(route => [route, icon])));
const asset = name => '/v1' + assetUrl(name);
const iconSources = new Map();
const pathVisuals = {
  '/solutions/glamping': ['glamping', 'Архітектурна ілюстрація глемпінгу з купольними наметами на дерев’яних терасах'],
  '/solutions/apartments': ['apartments', 'Архітектурна ілюстрація будинку з апартаментами й окремими житловими зонами'],
  '/solutions/mini-hotel': ['hotels', 'Архітектурна ілюстрація готелю зі скляним фасадом і відкритим холом'],
  '/solutions/guest-house': ['guesthouses', 'Архітектурна ілюстрація гостьового будинку з верандою та садом'],
  '/solutions/resort': ['resorts', 'Архітектурна ілюстрація курортного комплексу з басейном і терасами'],
  '/solutions/camping': ['camping', 'Архітектурна ілюстрація кемпінгу з караваном і наметом'],
  '/solutions/hostel': ['hostels', 'Архітектурна ілюстрація хостелу в розрізі зі спільною спальнею'],
  '#cottage-complex-workflow': ['cottages', 'Архітектурна ілюстрація дерев’яного котеджу з високим дахом'],
  '#aparthotel-workflow': ['aparthotels', 'Архітектурна ілюстрація апарт-готелю з балконами']
};

export function pageIconPath(path) {
  return pageIcons.get(path);
}

function iconSource(icon, width) {
  const name = `design-2-${icon}-${width}.webp`;
  if (!iconSources.has(name)) iconSources.set(name, asset(name));
  return iconSources.get(name);
}

export function designIcon(icon, {lazy = false, hero = false} = {}) {
  const source = iconSource(icon, 192);
  const responsive = hero
    ? ` srcset="${source} 192w, ${iconSource(icon, 384)} 384w" sizes="(max-width: 800px) 74px, (max-width: 1320px) 17vw, 221px"`
    : '';
  return `<img class="design-icon" src="${source}"${responsive} width="192" height="192" alt="" decoding="async"${lazy ? ' loading="lazy"' : ''}>`;
}

export function pageMark(path, classes = '', options) {
  const icon = pageIconPath(path);
  return icon ? `<span class="design-mark ${classes}" aria-hidden="true">${designIcon(icon, options)}</span>` : '';
}

export function propertyArt(path, lazy = false) {
  const visual = pathVisuals[path];
  if (!visual) return '';
  const [type, alt] = visual;
  const source = width => asset('home-property-' + type + '-' + width + '.webp');
  const srcset = [480, 768, 1200].map(width => source(width) + ' ' + width + 'w').join(', ');
  return `<img class="design-property-art" src="${source(768)}" srcset="${srcset}" sizes="(max-width: 640px) calc(100vw - 40px), (max-width: 1200px) 42vw, 500px" width="1200" height="800" alt="${e(alt)}" decoding="async"${lazy ? ' loading="lazy"' : ''}>`;
}

export const pageDesignStyles = `<link rel="stylesheet" href="/v1/page-design.css?v=${assetVersion('page-design.css')}">`;
