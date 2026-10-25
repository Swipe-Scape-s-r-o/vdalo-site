export function getPublicSitemapRoutes({ seoRoutes, caseSlugs, pmsArticle, pmsChoiceArticle, editorialArticles, secondPassArticles, touristTaxRoutes = [] }) {
  const preferredSeoOrder = ['/solutions','/integrations','/pricing','/hotel-booking-calendar','/hotel-direct-booking','/hotel-channel-manager','/hotel-revenue-management','/hotel-check-in','/hotel-guest-profile','/hotel-guest-app','/hotel-ai-assistant','/hotel-access-control','/hotel-operations','/hotel-housekeeping','/hotel-finance','/hotel-tourist-tax','/hotel-prro','/hotel-energy-management','/hotel-events','/hotel-pms-migration','/hotel-multi-property','/hotel-site-builder','/hotel-pms-modules','/guest-communication','/hotel-automation','/sign-up','/about','/partners','/contact'];
  const seoSet = new Set(seoRoutes);
  const orderedSeoRoutes = [...preferredSeoOrder.filter(route => seoSet.has(route)), ...seoRoutes.filter(route => !preferredSeoOrder.includes(route))];
  return [
    '/',
    ...orderedSeoRoutes,
    '/authors',
    '/authors/oleh-stepeniev',
    '/authors/kostiantyn-tripailo',
    '/privacy',
    '/offer',
    '/refunds',
    '/cases',
    ...caseSlugs,
    '/blog',
    pmsArticle.slug,
    pmsChoiceArticle.slug,
    ...editorialArticles.map(article => article.slug),
    ...secondPassArticles.map(article => article.slug),
    '/tools/',
    '/tools/qr-studio/',
    '/tools/pms-checklist/',
    '/tools/hotel-profitability-calculator/',
    '/tools/direct-booking-cost-calculator/',
    '/tools/hotel-room-cost-calculator/',
    '/tools/housekeeping-checklist/',
    '/tools/hotel-admin-time-calculator/',
    '/tools/hotel-website-checklist/',
    '/tools/guest-message-builder/',
    '/tools/housekeeping-workload-calculator/',
    '/tools/hotel-cancellation-cost-calculator/',
    '/tools/hotel-review-response/',
    '/resources',
    ...touristTaxRoutes,
  ];
}

export function serializeSitemapXml(routes, lastModifiedByRoute = new Map()) {
  const entries = routes.map(route => {
    const safeRoute = String(route).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]));
    const lastmod = lastModifiedByRoute.get(route);
    const validLastmod = /^\d{4}-\d{2}-\d{2}$/.test(lastmod || '')
      && Number.isFinite(Date.parse(`${lastmod}T00:00:00Z`))
      && new Date(`${lastmod}T00:00:00Z`).toISOString().slice(0,10) === lastmod;
    return `<url><loc>https://www.vdalo.tech${safeRoute}</loc>${validLastmod?`<lastmod>${lastmod}</lastmod>`:''}</url>`;
  }).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`;
}
