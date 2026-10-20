import {renderPage,escape} from './render.mjs';
import {pmsArticle} from './article-pms.mjs';
import {pmsChoiceArticle} from './article-pms-choice.mjs';
import {editorialArticles} from './article-library.mjs';
import {secondPassArticles} from './article-second-pass.mjs';
import {authors} from './authors.mjs';

const origin='https://www.vdalo.tech';
const profilePath='/authors/oleh-stepeniev';
const profileUrl=`${origin}${profilePath}`;
const imagePath='/v1/assets/oleg-stepeniev-profile.jpg';
const e=escape;

const articles=[pmsArticle,pmsChoiceArticle,...editorialArticles,...secondPassArticles];

function profileSchema(){
 return JSON.stringify({'@context':'https://schema.org','@graph':[
  {'@type':'Person','@id':`${profileUrl}#person`,'name':'Олег Степенєв','url':profileUrl,'image':`${origin}${imagePath}`,'description':'Підприємець із досвідом понад 20 років у нерухомості, меблевому виробництві, розробці програмного забезпечення та криптографії. Останні сім років працює з модульними будинками й готельною нерухомістю; має магістерську освіту у сфері будівництва та виробництва будівельних матеріалів.','knowsAbout':['готельна нерухомість','модульні будинки','нерухомість','меблеве виробництво','розробка програмного забезпечення','криптографія'],'hasCredential':{'@type':'EducationalOccupationalCredential','name':'Магістерська освіта у сфері будівництва та виробництва будівельних матеріалів'},'sameAs':['https://www.linkedin.com/in/olegalisio/']},
  {'@type':'ProfilePage','@id':profileUrl,'url':profileUrl,'name':'Олег Степенєв - автор матеріалів VDALO','mainEntity':{'@id':`${profileUrl}#person`},'inLanguage':'uk'},
  {'@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':1,'name':'Головна','item':origin},{'@type':'ListItem','position':2,'name':'Блог','item':`${origin}/blog`},{'@type':'ListItem','position':3,'name':'Автори','item':`${origin}/authors`},{'@type':'ListItem','position':4,'name':'Олег Степенєв','item':profileUrl}]}
 ]}).replace(/</g,'\\u003c');
}

function articleCard(article){
 const title=article.headline;
 const description=article.description||article.lead;
 const image=article.image.startsWith('http')?article.image:`/v1${article.image}`;
 const alt=article.alt||article.imageAlt||title;
 const minutes=article.minutes?`${article.minutes} хв читання`:'Практичний посібник';
 return `<a class="author-article-card" href="${e(article.slug)}"><img src="${e(image)}" width="480" height="300" loading="lazy" alt="${e(alt)}"><span class="author-article-topic">${e(article.tag||'ПОСІБНИК')} · ${e(minutes)}</span><strong>${e(title)}</strong><span class="author-article-description">${e(description)}</span><span class="author-article-action">Читати статтю <span aria-hidden="true">↗</span></span></a>`;
}

export function renderAuthorPage(){
 const canonical=profileUrl;
 const cards=articles.filter(article=>article.authorSlug!=='kostiantyn-tripailo').map(articleCard).join('');
 let html=renderPage({origin,full:false});
 html=html.replace(/<title>[\s\S]*?<\/title>/,`<title>Олег Степенєв - автор матеріалів VDALO про готелі</title>`)
  .replace(/<meta name="description" content="[^"]*">/,`<meta name="description" content="Олег Степенєв має понад 20 років підприємницького досвіду й останні сім років працює з модульними будинками та готельною нерухомістю.">`)
  .replace(/<meta name="robots" content="[^"]*">/,'<meta name="robots" content="index,follow">')
  .replace(/<meta property="og:type" content="[^"]*">/,'<meta property="og:type" content="profile">')
  .replace(/<meta property="og:title" content="[^"]*">/,`<meta property="og:title" content="Олег Степенєв - автор матеріалів VDALO">`)
  .replace(/<meta property="og:description" content="[^"]*">/,`<meta property="og:description" content="Підприємець із 20+ роками досвіду в нерухомості, виробництві й програмному забезпеченні. Практичні матеріали про готельні процеси.">`)
  .replace(/<meta property="og:url" content="[^"]*">/,`<meta property="og:url" content="${canonical}">`)
  .replace(/<link rel="canonical" href="[^"]*">/,`<link rel="canonical" href="${canonical}">`)
  .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/,`<script type="application/ld+json">${profileSchema()}</script>`)
  .replace('</head>',`<meta property="og:image" content="${origin}${imagePath}"><meta property="og:image:alt" content="Олег Степенєв, автор матеріалів VDALO"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="Олег Степенєв - автор матеріалів VDALO"><meta name="twitter:description" content="Практичні матеріали VDALO про керування готелем, бронювання та роботу команди."><meta name="twitter:image" content="${origin}${imagePath}"><link rel="stylesheet" href="/author-page.css"></head>`)
  .replace(/<main id="main">[\s\S]*?<\/main>/,`<main id="main" class="author-page"><div class="author-page-wrap"><nav class="author-breadcrumbs" aria-label="Навігаційний ланцюжок"><a href="/">Головна</a><span aria-hidden="true">/</span><a href="/blog">Блог</a><span aria-hidden="true">/</span><a href="/authors">Автори</a><span aria-hidden="true">/</span><span aria-current="page">Олег Степенєв</span></nav><section class="author-profile"><div class="author-profile-copy"><p class="author-eyebrow">АВТОР МАТЕРІАЛІВ VDALO</p><h1>Олег Степенєв</h1><p class="author-profile-lead">Підприємець із досвідом понад 20 років у нерухомості, меблевому виробництві, розробці програмного забезпечення та криптографії.</p><p>Останні сім років працює з виробництвом модульних будинків і готельною нерухомістю. Під управлінням керуючої компанії в Чехії є кемпінг, глемпінг і резорти. Має магістерську освіту у сфері будівництва та виробництва будівельних матеріалів.</p><p>У матеріалах VDALO розбирає практичні сценарії роботи готелю й позначає умови та межі кожного рішення.</p><div class="author-profile-links"><a href="https://www.linkedin.com/in/olegalisio/" target="_blank" rel="noopener noreferrer">Профіль у LinkedIn ↗</a><a href="/about">Про Олега та історію VDALO ↗</a><a href="/authors">Усі автори VDALO ↗</a></div></div><figure class="author-profile-photo"><img src="${imagePath}" width="800" height="1000" alt="Олег Степенєв, автор матеріалів VDALO" fetchpriority="high"></figure></section><section class="author-articles"><div class="author-articles-heading"><p class="author-eyebrow">БІБЛІОТЕКА МАТЕРІАЛІВ</p><h2>Статті Олега Степенєва</h2><p>Практичні гіди для власників, керівників і команд готелів.</p></div><div class="author-articles-grid">${cards}</div></section></div></main>`)
  .replace(/<footer[\s\S]*?<\/footer>/,footer=>footer.replace(/href="#([^\"]+)"/g,'href="/#$1"'));
 return html;
}

function authorJsonLd(author){
 const url=`${origin}${author.profilePath}`,personId=`${url}#person`;
 return JSON.stringify({'@context':'https://schema.org','@graph':[
  {'@type':'Person','@id':personId,'name':author.name,'url':url,'image':`${origin}${author.image}`,'jobTitle':author.role,'worksFor':{'@type':'Organization','name':'Міністерство з Продажів','url':'https://ministrysale.com'},'description':'Співзасновник і директор з маркетингу Міністерства з Продажів. У маркетингу та бізнес-розвитку з 2012 року. Працює з маркетингом, контентом, SEO, GEO та AI у продажах.','knowsAbout':author.expertise,'sameAs':['https://ministrysale.com/kostiantyn-tripailo','https://t.me/tripailo']},
  {'@type':'ProfilePage','@id':url,'url':url,'name':`${author.name} - автор матеріалів VDALO`,'mainEntity':{'@id':personId},'inLanguage':'uk'},
  {'@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':1,'name':'Головна','item':origin},{'@type':'ListItem','position':2,'name':'Блог','item':`${origin}/blog`},{'@type':'ListItem','position':3,'name':'Автори','item':`${origin}/authors`},{'@type':'ListItem','position':4,'name':author.name,'item':url}]}
 ]}).replace(/</g,'\\u003c');
}

function updateAuthorMetadata(html,{title,description,canonical,image,ogType='profile',robots='index,follow',schema}){
 return html.replace(/<title>[\s\S]*?<\/title>/,`<title>${e(title)}</title>`)
  .replace(/<meta name="description" content="[^"]*">/,`<meta name="description" content="${e(description)}">`)
  .replace(/<meta name="robots" content="[^"]*">/,`<meta name="robots" content="${robots}">`)
  .replace(/<meta property="og:type" content="[^"]*">/,`<meta property="og:type" content="${ogType}">`)
  .replace(/<meta property="og:title" content="[^"]*">/,`<meta property="og:title" content="${e(title)}">`)
  .replace(/<meta property="og:description" content="[^"]*">/,`<meta property="og:description" content="${e(description)}">`)
  .replace(/<meta property="og:url" content="[^"]*">/,`<meta property="og:url" content="${canonical}">`)
  .replace(/<link rel="canonical" href="[^"]*">/,`<link rel="canonical" href="${canonical}">`)
  .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/,`<script type="application/ld+json">${schema}</script>`)
  .replace('</head>',`<meta property="og:image" content="${image}"><meta property="og:image:alt" content="${e(title)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${e(title)}"><meta name="twitter:description" content="${e(description)}"><meta name="twitter:image" content="${image}"><link rel="stylesheet" href="/author-page.css"></head>`);
}

export function renderKostiantynAuthorPage(){
 const author=authors.find(item=>item.slug==='kostiantyn-tripailo'),url=`${origin}${author.profilePath}`;
 const cards=articles.filter(article=>article.authorSlug===author.slug).map(articleCard).join('');
 let html=renderPage({origin,full:false});
 html=updateAuthorMetadata(html,{
  title:'Костянтин Тріпайло: автор VDALO про маркетинг і QR для готелів',
  description:'Профіль Костянтина Тріпайла, співзасновника й CMO Міністерства з Продажів. Досвід у маркетингу з 2012 року, SEO, контенті та AI у продажах.',
  canonical:url,image:`${origin}${author.image}`,robots:'noindex,follow',schema:authorJsonLd(author),
 });
 return html.replace(/<main id="main">[\s\S]*?<\/main>/,`<main id="main" class="author-page"><div class="author-page-wrap"><nav class="author-breadcrumbs" aria-label="Навігаційний ланцюжок"><a href="/">Головна</a><span aria-hidden="true">/</span><a href="/blog">Блог</a><span aria-hidden="true">/</span><a href="/authors">Автори</a><span aria-hidden="true">/</span><span aria-current="page">${e(author.name)}</span></nav><section class="author-profile"><div class="author-profile-copy"><p class="author-eyebrow">ПРОФІЛЬ АВТОРА VDALO</p><h1>${e(author.name)}</h1><p class="author-profile-lead">Співзасновник і директор з маркетингу «Міністерства з Продажів». У маркетингу та бізнес-розвитку з 2012 року.</p><p>Працює з B2B-маркетингом, лідогенерацією, контентом, SEO та GEO. Також спеціалізується на використанні AI у продажах: від кваліфікації звернень до контролю якості комунікації.</p><p>Для готельного бізнесу потенційні теми його матеріалів: маркетинг і продажі, прямі бронювання та QR-сценарії для гостей.</p><div class="author-profile-links"><a href="https://ministrysale.com/kostiantyn-tripailo" target="_blank" rel="noopener noreferrer">Профіль у Міністерстві з Продажів ↗</a><a href="https://t.me/tripailo" target="_blank" rel="noopener noreferrer">Telegram-канал ↗</a><a href="/authors">Усі автори VDALO ↗</a></div></div><figure class="author-profile-photo"><img src="${author.image}" width="1000" height="1500" alt="Костянтин Тріпайло, співзасновник і директор з маркетингу Міністерства з Продажів" fetchpriority="high"></figure></section><section class="author-articles"><div class="author-articles-heading"><p class="author-eyebrow">БІБЛІОТЕКА МАТЕРІАЛІВ</p><h2>Матеріали Костянтина Тріпайла</h2><p>Статті цього автора з’являться тут після узгодження тем і редакційної підготовки.</p></div>${cards?`<div class="author-articles-grid">${cards}</div>`:`<p class="author-empty-state">Поки що опублікованих матеріалів немає. Перейдіть до <a href="/blog">усіх статей і кейсів VDALO</a>, щоб обрати іншу тему.</p>`}</section></div></main>`)
  .replace(/<footer[\s\S]*?<\/footer>/,footer=>footer.replace(/href="#([^\"]+)"/g,'href="/#$1"'));
}

export function renderAuthorsDirectory(){
 const canonical=`${origin}/authors`,cards=authors.map(author=>{const hasPublishedArticles=articles.some(article=>(article.authorSlug||'oleh-stepeniev')===author.slug);const action=hasPublishedArticles?'Статті й профіль':'Переглянути профіль';return `<a class="authors-directory-card" href="${author.profilePath}"><img src="${author.image}" width="120" height="120" loading="lazy" alt="${e(author.name)}"><span><strong>${e(author.name)}</strong><small>${e(author.role)}</small><span class="authors-directory-topics">${author.expertise.map(e).join(' · ')}</span><b>${action} <span aria-hidden="true">↗</span></b></span></a>`}).join('');
 let html=renderPage({origin,full:false});
 html=updateAuthorMetadata(html,{
  title:'Автори VDALO: досвід і статті для готельного бізнесу',
  description:'Знайомтеся з авторами VDALO, переглядайте їхній досвід, напрями експертизи та статті для власників і команд готелів.',
  canonical,image:`${origin}/v1/assets/vdalo-canonical-496.png`,ogType:'website',
  schema:JSON.stringify({'@context':'https://schema.org','@type':'CollectionPage','name':'Автори VDALO','url':canonical,'inLanguage':'uk','mainEntity':{'@type':'ItemList','itemListElement':authors.map((author,index)=>({'@type':'ListItem','position':index+1,'item':{'@type':'Person','name':author.name,'url':`${origin}${author.profilePath}`}}))}}).replace(/</g,'\\u003c'),
 });
 return html.replace(/<main id="main">[\s\S]*?<\/main>/,`<main id="main" class="author-page"><div class="author-page-wrap"><nav class="author-breadcrumbs" aria-label="Навігаційний ланцюжок"><a href="/">Головна</a><span aria-hidden="true">/</span><a href="/blog">Блог</a><span aria-hidden="true">/</span><span aria-current="page">Автори</span></nav><section class="authors-directory-intro"><p class="author-eyebrow">АВТОРИ VDALO</p><h1>Автори VDALO</h1><p>Оберіть автора, щоб переглянути його досвід, професійні напрями та опубліковані матеріали про готельний бізнес.</p></section><section class="authors-directory-list" aria-label="Автори VDALO">${cards}</section><section class="authors-editorial-note" aria-labelledby="authors-editorial-title"><p class="author-eyebrow">РЕДАКЦІЙНИЙ ПІДХІД</p><h2 id="authors-editorial-title">Хто і про що пише у VDALO</h2><p class="authors-editorial-lead">Матеріали для готельного бізнесу поєднують досвід авторів із практичними сценаріями роботи об’єктів розміщення.</p><div class="authors-editorial-grid"><article><h3>Олег Степенєв</h3><p>Публікує практичні матеріали про роботу готелю, бронювання, PMS, комунікацію з гостями, автоматизацію процесів і туристичний збір.</p><a href="/authors/oleh-stepeniev">Переглянути статті та профіль <span aria-hidden="true">↗</span></a></article><article><h3>Костянтин Тріпайло</h3><p>Його професійні напрями: B2B-маркетинг, продажі, контент і AI у продажах. Профіль уже доступний, опублікованих матеріалів VDALO поки немає.</p><a href="/authors/kostiantyn-tripailo">Переглянути профіль автора <span aria-hidden="true">↗</span></a></article></div><p class="authors-editorial-principles">У статтях вказуємо автора й дати публікації та оновлення. У кейсах окремо описуємо контекст, джерело результатів і межі висновків. <a href="/blog">Переглянути статті та кейси VDALO</a>.</p></section></div></main>`).replace(/<footer[\s\S]*?<\/footer>/,footer=>footer.replace(/href="#([^\"]+)"/g,'href="/#$1"'));
}
