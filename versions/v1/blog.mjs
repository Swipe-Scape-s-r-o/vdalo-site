import {renderPage, escape as e} from './render.mjs';
import {pmsArticle} from './article-pms.mjs';
import {pmsChoiceArticle} from './article-pms-choice.mjs';
import {editorialArticles} from './article-library.mjs';
import {secondPassArticles} from './article-second-pass.mjs';
import {caseData} from './cases.mjs';
import {authors, getAuthor} from './authors.mjs';
import {articleImageSeo,caseImageSeo} from './image-seo.mjs';

const allArticles=[pmsArticle,pmsChoiceArticle,...editorialArticles,...secondPassArticles];
const categories=[
 {id:'booking-pms',title:'Бронювання, PMS і канали',description:'Календар, прямі бронювання, вибір і зміна PMS, канали продажу та передавання даних.',slugs:['/blog/shcho-take-pms-dlya-gotelyu','/blog/yak-obraty-pms-dlya-gotelyu','/blog/pryami-bronyuvannya-ta-vidzhet-gotelyu','/blog/perehid-na-pms-bez-vtraty-danyh','/blog/shakhmatka-bronyuvan-gotelyu','/blog/channel-manager-ical-gotelyu']},
 {id:'guest-experience',title:'Гостьовий досвід і QR',description:'Заселення, інформація для гостя, QR-коди, додаткові послуги та готовність номера.',slugs:['/blog/yak-gotelyu-prodavaty-dodatkovi-poslugy','/blog/pidhotovka-zaselennya-gostya','/blog/status-gotovnosti-nomera-housekeeping','/blog/qr-kody-dlya-goteliv','/blog/qr-wifi-dlya-gotelyu','/blog/qr-kartka-v-nomer-gotelyu']},
 {id:'tourist-tax',title:'Туристичний збір',description:'Правила, ставки громад, формула та приклади розрахунку для готелів і власників житла.',slugs:['/blog/turystychnyi-zbir-gotel-ukraina','/blog/rozrakhunok-turystychnoho-zboru-2026']},
 {id:'automation',title:'Автоматизація роботи готелю',description:'Як обирати перші процеси для автоматизації та перевіряти зміни на практиці.',slugs:['/blog/shcho-avtomatyzuvaty-v-goteli-pershym']},
];
const futureCategory={id:'hotel-marketing-sales',title:'Маркетинг і продажі готелю',description:'Прямий попит, конверсія звернень, пропозиції гостям і використання QR у просуванні готельних послуг.'};

function articleCard(article,category){
 const author=getAuthor(article.authorSlug);
 const summary=article.lead||article.description||'';
 const minutes=article.minutes?`${article.minutes} хв читання`:'Практичний посібник';
 const image=article.image||'';
 const alt=articleImageSeo[article.slug]?.alt||article.imageAlt||article.alt||article.headline;
 const imageTitle=articleImageSeo[article.slug]?.title||article.imageTitle||article.headline;
 return `<a class="blog-featured" href="${e(article.slug)}"><img src="${e(image)}" width="1200" height="800" alt="${e(alt)}" title="${e(imageTitle)}" loading="lazy"><span class="blog-featured-copy"><span class="blog-topic-number">${e(category.title)} · ${e(minutes)}</span><strong>${e(article.headline)}</strong><span>${e(summary)}</span><span class="blog-featured-author">Автор: ${e(author.name)}</span><span class="blog-featured-link">Читати матеріал <span aria-hidden="true">↗</span></span></span></a>`;
}

function authorCard(author){
 const expertise=author.slug==='kostiantyn-tripailo'?'Можливі теми: маркетинг і продажі готелю, прямі бронювання, QR-сценарії.':`Напрями: ${author.expertise.join(', ')}.`;
 const articleCount=allArticles.filter(article=>(article.authorSlug||'oleh-stepeniev')===author.slug).length;
 const articlesCopy=articleCount?`${articleCount} ${articleCount===1?'матеріал':articleCount<5?'матеріали':'матеріалів'} VDALO`:'Профіль автора';
 return `<a class="blog-author-card" href="${e(author.profilePath)}"><img src="${e(author.image)}" width="160" height="180" alt="${e(author.name)}" loading="lazy"><span class="blog-author-copy"><span class="blog-author-role">${e(author.role)}</span><strong>${e(author.name)}</strong><span class="blog-author-focus">${e(expertise)}</span><span class="blog-author-link">${e(articlesCopy)} <span aria-hidden="true">↗</span></span></span></a>`;
}

function categorySection(category){
 const categoryArticles=category.slugs.map(slug=>allArticles.find(article=>article.slug===slug)).filter(Boolean);
 if(!categoryArticles.length)return '';
 return `<section class="blog-category-section" id="${e(category.id)}" aria-labelledby="${e(category.id)}-title"><div class="blog-category-heading"><div><p class="blog-eyebrow">РУБРИКА · ${categoryArticles.length} ${categoryArticles.length===1?'МАТЕРІАЛ':categoryArticles.length<5?'МАТЕРІАЛИ':'МАТЕРІАЛІВ'}</p><h2 id="${e(category.id)}-title">${e(category.title)}</h2><p>${e(category.description)}</p></div><a href="#blog-categories">До рубрик <span aria-hidden="true">↑</span></a></div><div class="blog-grid blog-articles">${categoryArticles.map(article=>articleCard(article,category)).join('')}</div></section>`;
}

const featuredCases=caseData.map(c=>`<a class="blog-case-card" href="/cases/${e(c.slug)}"><img class="blog-case-thumb" src="${e(c.image)}" width="1200" height="800" alt="${e(caseImageSeo[c.slug]?.alt||c.alt)}" title="${e(caseImageSeo[c.slug]?.title||c.title)}" loading="lazy" decoding="async"><span class="blog-case-card-body"><span class="blog-case-meta">${e(c.short)}</span><strong>${e(c.title)}</strong><span class="blog-case-lead">${e(c.lead)}</span><span class="blog-case-result"><b>${e(c.metrics[0][0])}</b><span>${e(c.metrics[0][1])}</span></span><span class="blog-case-read">Читати кейс <span aria-hidden="true">↗</span></span></span></a>`).join('');
const categoryNav=[...categories.map(category=>`<a href="#${e(category.id)}">${e(category.title)} <span>${category.slugs.filter(slug=>allArticles.some(article=>article.slug===slug)).length}</span></a>`),`<a href="#blog-cases">Кейси <span>${caseData.length}</span></a>`].join('');
const content=`<main id="main" class="blog-page"><section class="blog-hero"><div class="blog-wrap blog-hero-grid"><div class="blog-hero-copy"><p class="blog-eyebrow">БЛОГ VDALO</p><h1>Практичні матеріали для готельного бізнесу</h1><p class="blog-lead">Статті, інструкції та кейси про бронювання, досвід гостей, туристичний збір і щоденну роботу готелю.</p></div><figure class="blog-hero-visual"><img src="/assets/hotel-management-blog.webp" width="1536" height="1024" alt="Робочий стіл у готелі з нотатником і ключ-карткою для матеріалів про керування готелем" title="Матеріали про керування готелем і готельні системи" fetchpriority="high"></figure><a class="blog-cta" href="/sign-up">Обговорити процеси мого готелю <span aria-hidden="true">↗</span></a></div></section><section class="blog-topics blog-published" id="blog-categories"><div class="blog-wrap"><div class="blog-section-heading"><p class="blog-eyebrow">${allArticles.length} ПРАКТИЧНИХ МАТЕРІАЛІВ</p><h2>Оберіть тему</h2><p>Згрупували матеріали за задачами готелю. Коли з’являтимуться нові статті, додаватимемо їх до відповідних рубрик.</p></div><nav class="blog-category-nav" aria-label="Рубрики блогу">${categoryNav}</nav>${categories.map(categorySection).join('')}</div></section><section class="blog-authors" id="blog-authors"><div class="blog-wrap"><div class="blog-authors-heading"><div><p class="blog-eyebrow">АВТОРИ VDALO</p><h2>Хто готує матеріали</h2><p>Досвід, практичні напрями та всі статті кожного автора зібрані в окремому профілі.</p></div><a href="/authors">Усі автори <span aria-hidden="true">↗</span></a></div><div class="blog-authors-grid">${authors.map(authorCard).join('')}</div></div></section><section class="blog-case" id="blog-cases"><div class="blog-wrap"><p class="blog-eyebrow">КЕЙСИ VDALO · ${caseData.length} ІСТОРІЙ</p><h2>Як готелі змінюють щоденну роботу</h2><p class="blog-case-intro">Практичні історії з умовами, процесом і результатами конкретного об’єкта. Кожен кейс пояснює, що можна перевірити у схожій ситуації.</p><div class="blog-case-grid">${featuredCases}</div><a class="blog-cta blog-cta-light" href="/cases">Переглянути всі кейси <span aria-hidden="true">↗</span></a></div></section><section class="blog-editorial"><div class="blog-wrap"><h2>Як ми готуємо матеріали</h2><p>Пояснюємо терміни на прикладах готельної роботи, відокремлюємо підтверджені можливості продукту від сценаріїв, що залежать від налаштувань, а правову інформацію звіряємо з офіційними джерелами. Згенеровані обкладинки позначаємо як ілюстрації.</p><p>Скористайтеся <a href="/tools/">інструментами для готельєрів</a> або відкрийте <a href="/authors">каталог авторів VDALO</a>.</p></div></section></main>`;

export function renderBlogPage({origin=''}={}) {
  let html=renderPage({origin,full:false});
  html=html.replace(/<title>[\s\S]*?<\/title>/, '<title>Блог для готелів: статті, кейси й інструкції | VDALO</title>');
  html=html.replace(/<meta name="description" content="[^"]*">/, '<meta name="description" content="Статті, кейси й інструкції для готельєрів: PMS, бронювання, QR-коди, досвід гостей, туристичний збір і автоматизація.">');
  html=html.replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="index,follow">');
  html=html.replace(/<meta property="og:title" content="[^"]*">/, '<meta property="og:title" content="Блог для готелів: статті, кейси й інструкції | VDALO">');
  html=html.replace(/<meta property="og:description" content="[^"]*">/, '<meta property="og:description" content="Практичні матеріали про готельні системи, бронювання, досвід гостей і роботу команди.">');
  html=html.replace(/<link rel="canonical" href="[^"]*">/, '<link rel="canonical" href="https://www.vdalo.tech/blog">');
  html=html.replace(/<meta property="og:url" content="[^"]*">/, '<meta property="og:url" content="https://www.vdalo.tech/blog">');
  html=html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, '<script type="application/ld+json">{"@context":"https://schema.org","@type":"CollectionPage","name":"Блог VDALO про готельний бізнес","url":"https://www.vdalo.tech/blog","inLanguage":"uk"}</script>');
  html=html.replace('</head>', '<link rel="stylesheet" href="/blog.css"></head>');
  html=html.replace(/<main id="main">[\s\S]*?<\/main>/,content);
  html=html.replace(/href="#/g,'href="/#');
  html=html.replace(/href="\/#(blog-categories|blog-cases|blog-authors|booking-pms|guest-experience|tourist-tax|automation)"/g,'href="#$1"');
  return html;
}
