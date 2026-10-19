export function getPublicSitemapRoutes({ seoRoutes, caseSlugs, pmsArticle, pmsChoiceArticle, editorialArticles, secondPassArticles, touristTaxRoutes = [] }) {
  const preferredSeoOrder = ['/solutions','/integrations','/pricing','/hotel-booking-calendar','/hotel-check-in','/hotel-operations','/guest-communication','/hotel-automation','/sign-up','/about','/contact'];
  const seoSet = new Set(seoRoutes);
  const orderedSeoRoutes = [...preferredSeoOrder.filter(route => seoSet.has(route)), ...seoRoutes.filter(route => !preferredSeoOrder.includes(route))];
  return [
    '/',
    ...orderedSeoRoutes,
    '/authors',
    '/authors/oleh-stepeniev',
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
    ...touristTaxRoutes,
  ];
}
