const ORIGIN = 'https://www.vdalo.tech';
const WEBSITE_ID = `${ORIGIN}/#website`;
const ORGANIZATION_ID = `${ORIGIN}/#organization`;
const AUTHOR_URL = `${ORIGIN}/authors/oleh-stepeniev`;
const AUTHOR_ID = `${AUTHOR_URL}#person`;
const LOGO_URL = `${ORIGIN}/v1/assets/vdalo-app-icon.svg`;

const collectionPages = new Set(['/solutions', '/integrations', '/blog', '/cases', '/tools/', '/resources', '/authors', '/tourist-tax/']);
const servicePages = new Set([
  '/hotel-booking-calendar',
  '/hotel-check-in',
  '/hotel-operations',
  '/guest-communication',
  '/hotel-automation',
]);
const softwarePages = new Set(['/tools/qr-studio/']);

function readMeta(html, selector) {
  const match = html.match(selector);
  return match?.[1] ?? '';
}

function decodeHtml(value) {
  return value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

function pageText(html, selector) {
  const value = readMeta(html, selector).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return decodeHtml(value);
}

function nodeTypes(node) {
  return new Set(Array.isArray(node?.['@type']) ? node['@type'] : [node?.['@type']]);
}

function existingNodes(html) {
  const nodes = [];
  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(match[1]);
      nodes.push(...(Array.isArray(data) ? data : Array.isArray(data?.['@graph']) ? data['@graph'] : [data]));
    } catch {
      // Invalid legacy JSON-LD is dropped and replaced with the page's canonical graph.
    }
  }
  return nodes;
}

function pageType(pathname) {
  if (pathname === '/about') return 'AboutPage';
  if (pathname === '/contact') return 'ContactPage';
  if (/^\/authors\/[^/]+$/.test(pathname)) return 'ProfilePage';
  if (collectionPages.has(pathname)) return 'CollectionPage';
  return 'WebPage';
}

function visibleBreadcrumb(html) {
  const nav = html.match(/<nav\b(?=[^>]*aria-label=["']Навігаційний ланцюжок["'])[^>]*>([\s\S]*?)<\/nav>/i)?.[1];
  if (!nav) return null;
  const entries = [];
  const pattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>|<span\b[^>]*aria-current=["']page["'][^>]*>([\s\S]*?)<\/span>/gi;
  for (const match of nav.matchAll(pattern)) {
    const name = decodeHtml((match[2] || match[3] || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
    const href = match[1] ? new URL(decodeHtml(match[1]), ORIGIN).href : '';
    if (name && (href || entries.length)) entries.push({ '@type': 'ListItem', position: entries.length + 1, name, ...(href ? { item: href } : {}) });
  }
  return entries.length > 1 ? { '@type': 'BreadcrumbList', itemListElement: entries } : null;
}

function visibleCityDirectory(html, pathname) {
  if (pathname !== '/tourist-tax/') return null;
  const list = html.match(/<ul\b[^>]*class=["'][^"']*tt-seo-city-links[^"']*["'][^>]*>([\s\S]*?)<\/ul>/i)?.[1];
  if (!list) return null;
  const itemListElement = [...list.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)].map((match, index) => {
    const name = decodeHtml(match[2].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
    const url = new URL(decodeHtml(match[1]), ORIGIN).href;
    return { '@type': 'ListItem', position: index + 1, name, url };
  });
  if (!itemListElement.length) return null;
  return {
    '@type': 'ItemList',
    '@id': `${ORIGIN}${pathname}#city-directory`,
    name: 'Опубліковані сторінки ставок туристичного збору за містами України',
    numberOfItems: itemListElement.length,
    itemListElement,
  };
}

function articleNode(nodes, pathname, canonical, title, description, image) {
  const source = nodes.find(node => nodeTypes(node).has('BlogPosting') || nodeTypes(node).has('Article'));
  if (!source) return null;
  const isCase = pathname.startsWith('/cases/');
  const article = {
    ...source,
    '@type': nodeTypes(source).has('BlogPosting') ? 'BlogPosting' : 'Article',
    '@id': `${canonical}#article`,
    headline: source.headline || title,
    description: source.description || description,
    url: canonical,
    mainEntityOfPage: { '@id': `${canonical}#webpage` },
    publisher: { '@id': ORGANIZATION_ID },
    inLanguage: 'uk',
  };
  if (image && !article.image) article.image = image;
  if (isCase) {
    // Case pages show the author and update date, but not a publication date.
    delete article.datePublished;
    article.author = { '@type': 'Person', '@id': AUTHOR_ID, name: 'Олег Степенєв', url: AUTHOR_URL };
  } else if (source.author) {
    const sourceAuthor = Array.isArray(source.author) ? source.author[0] : source.author;
    const authorUrl = sourceAuthor.url || (sourceAuthor['@id'] || '').replace(/#person$/, '');
    article.author = {
      ...sourceAuthor,
      '@type': 'Person',
      ...(authorUrl ? { '@id': `${authorUrl}#person`, url: authorUrl } : { '@id': AUTHOR_ID, url: AUTHOR_URL }),
      name: sourceAuthor.name || 'Олег Степенєв',
    };
  }
  return article;
}

function personNode(nodes) {
  const person = nodes.find(node => nodeTypes(node).has('Person'));
  if (!person) return null;
  const personUrl = person.url || (person['@id'] || '').replace(/#person$/, '') || AUTHOR_URL;
  return { ...person, '@id': person['@id'] || `${personUrl}#person`, '@type': 'Person', name: person.name || 'Автор VDALO', url: personUrl };
}

function canonicalFor(html, pathname) {
  const canonical = readMeta(html, /<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
  if (canonical && canonical.startsWith(`${ORIGIN}/`)) return canonical;
  if (canonical === ORIGIN) return ORIGIN;
  return `${ORIGIN}${pathname}`;
}

export function applySitewideSchema(html, pathname, indexableRoutes) {
  if (!indexableRoutes.has(pathname)) return html;

  const robots = readMeta(html, /<meta\b[^>]*name=["']robots["'][^>]*content=["']([^"']+)["']/i).toLowerCase();
  if (/noindex/.test(robots)) return html;

  const canonical = canonicalFor(html, pathname);
  const title = pageText(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const description = decodeHtml(readMeta(html, /<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i));
  const h1 = pageText(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  const image = readMeta(html, /<meta\b[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
  const oldNodes = existingNodes(html);
  const article = articleNode(oldNodes, pathname, canonical, h1 || title, description, image);
  const author = /^\/authors\/[^/]+$/.test(pathname) ? personNode(oldNodes) : null;
  const breadcrumb = visibleBreadcrumb(html);

  const webpage = {
    '@type': pageType(pathname),
    '@id': `${canonical}#webpage`,
    url: canonical,
    name: h1 || title,
    description,
    inLanguage: 'uk',
    isPartOf: { '@id': WEBSITE_ID },
  };
  if (image) webpage.primaryImageOfPage = { '@type': 'ImageObject', url: image };
  if (article) webpage.mainEntity = { '@id': `${canonical}#article` };
  if (author) webpage.mainEntity = { '@id': author['@id'] };
  const cityDirectory = visibleCityDirectory(html, pathname);
  if (cityDirectory) webpage.mainEntity = { '@id': cityDirectory['@id'] };
  if (servicePages.has(pathname)) {
    const serviceId = `${canonical}#service`;
    webpage.mainEntity = { '@id': serviceId };
  }
  if (softwarePages.has(pathname)) {
    webpage.mainEntity = { '@id': `${canonical}#software` };
  }

  const graph = [
    {
      '@type': 'Organization',
      '@id': ORGANIZATION_ID,
      name: 'VDALO',
      legalName: 'Фізична особа-підприємець Проценко Марта Олександрівна',
      url: ORIGIN,
      description: 'Програмне забезпечення VDALO допомагає готелям керувати бронюваннями, номерним фондом і щоденними процесами.',
      areaServed: { '@type': 'Country', name: 'Україна' },
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+380939082254',
        contactType: 'customer support',
        availableLanguage: ['Ukrainian'],
      },
      logo: { '@type': 'ImageObject', '@id': `${LOGO_URL}#logo`, url: LOGO_URL },
    },
    {
      '@type': 'WebSite',
      '@id': WEBSITE_ID,
      name: 'VDALO',
      url: `${ORIGIN}/`,
      inLanguage: 'uk',
      publisher: { '@id': ORGANIZATION_ID },
    },
    webpage,
  ];
  if (servicePages.has(pathname)) {
    graph.push({
      '@type': 'Service',
      '@id': `${canonical}#service`,
      name: h1 || title,
      description,
      url: canonical,
      provider: { '@id': ORGANIZATION_ID },
      mainEntityOfPage: { '@id': `${canonical}#webpage` },
      inLanguage: 'uk',
    });
  }
  if (softwarePages.has(pathname)) {
    graph.push({
      '@type': 'SoftwareApplication',
      '@id': `${canonical}#software`,
      name: 'QR Studio VDALO',
      url: canonical,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web browser',
      description,
      isAccessibleForFree: true,
      featureList: [
        'Створення QR-кодів для вебпосилань, Wi-Fi та текстової інформації',
        'Оформлення кольорів, форми модулів і маркерів QR-коду',
        'Додавання логотипу, фонової фотографії та підпису',
        'Завантаження PNG, JPG, WebP, SVG і PDF у різних розмірах',
        'Локальне створення коду у браузері без передавання введених даних на сервер',
      ],
      provider: { '@id': ORGANIZATION_ID },
      inLanguage: 'uk',
    });
  }
  if (author) graph.push(author);
  if (article) graph.push(article);
  if (cityDirectory) graph.push(cityDirectory);
  if (breadcrumb) graph.push(breadcrumb);

  const jsonLd = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
  const script = `<script type="application/ld+json">${jsonLd}</script>`;
  let cleaned = html.replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '');
  if (pathname.startsWith('/cases/')) cleaned = cleaned.replace(/<meta\b[^>]*property=["']article:published_time["'][^>]*>/gi, '');
  return cleaned.includes('</head>') ? cleaned.replace('</head>', `${script}</head>`) : cleaned;
}
