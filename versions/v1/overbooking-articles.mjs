import {readFileSync} from 'node:fs';
import {renderPage,escape as e} from './render.mjs';
import {renderArticleMarkdown} from './article-markdown.mjs';
import {readerByline,readerContents,readerAuthorCard,readingStyles} from './editorial-layout.mjs';
import {getAuthor} from './authors.mjs';

const origin='https://www.vdalo.tech';
const image='/assets/blog-booking-calendar-natural.jpg';
const imageAlt='Працівник готелю звіряє записи та календар бронювань на рецепції';
const definitions=[
 ['00_pillar_overbooking_article.md','overbuking-u-goteli','Овербукінг у готелі: що це і як уникнути | VDALO','Що таке овербукінг у готелі, чому виникають подвійні бронювання та як зменшити ризик. Причини, алгоритм дій для рецепції, чекліст і поради щодо PMS.'],
 ['01_booking_pms_connection_article.md','yak-pidkliuchyty-booking-com-do-pms','Як підключити Booking.com до PMS: інструкція | VDALO','Як підключити Booking.com до PMS: підготовка, зіставлення категорій і тарифів, перевірка бронювань, скасувань та помилок.'],
 ['02_preseason_channel_manager_article.md','channel-manager-perevirky-pered-sezonom','Channel Manager перед сезоном: 20 перевірок | VDALO','20 перевірок Channel Manager перед сезоном: доступність, тарифи, бронювання, скасування, помилки обміну та дії команди при збої.'],
 ['03_pms_booking_availability_article.md','pms-booking-rizna-dostupnist','PMS і Booking.com: різна доступність | VDALO','Чому PMS і Booking.com показують різну доступність: перевірка бронювань, обмежень, mapping, журналу обміну та каналу.'],
 ['04_booking_overbooking_article.md','overbuking-booking-com','Овербукінг Booking.com: що робити готелю | VDALO',"Овербукінг Booking.com: як перевірити бронювання, зв'язатися з підтримкою, погодити переселення гостя та з'ясувати причину."],
 ['05_overbooking_response_article.md','shcho-robyty-pry-overbukingu','Що робити при овербукінгу: 7 кроків готелю | VDALO','Що робити адміністратору при овербукінгу: перевірка бронювань, альтернативне розміщення, повідомлення гостю та чекліст.'],
 ['06_room_rate_mapping_article.md','mapping-nomeriv-i-taryfiv','Mapping номерів і тарифів: перевірка | VDALO','Як перевірити mapping номерів і тарифів між PMS, Channel Manager і Booking.com: приклади помилок, карта зіставлення та тести.'],
 ['07_booking_auto_replenishment_article.md','booking-auto-replenishment-skasuvannya','Booking.com відкрив номер після скасування | VDALO','Чому Booking.com може знову відкрити номер після скасування: auto-replenishment, налаштування, діагностика й перевірка каналів.'],
 ['08_stop_sell_remont_article.md','stop-sell-remont-nomera','Stop-sell і ремонт номера: як закрити продаж | VDALO','Як закрити номер на ремонт: блокування, stop-sell, доступність за датами, перевірка каналів і повернення номера в продаж.'],
 ['09_phone_messenger_article.md','bronyuvannya-telefonom-mesendzherakh','Бронювання в готелі: телефон і месенджери | VDALO','Як готелю приймати бронювання телефоном і в месенджерах: статуси, утримання номера, оплата, підтвердження та передача зміни.'],
 ['11_overbooking_cost_article.md','vartist-overbukingu-gotelyu','Вартість овербукінгу готелю: формула та витрати | VDALO','Як розрахувати вартість овербукінгу готелю: формула, три приклади, шаблон калькулятора та пояснення повернень і компенсацій.'],
 ['12_manual_overbooking_article.md','yak-unyknuty-overbukingu-bez-channel-manager','Як уникнути овербукінгу без Channel Manager | VDALO','Як невеликому готелю вести бронювання без Channel Manager: єдиний календар, контроль доступності, ручна звірка каналів і чекліст для зміни.'],
];

export const overbookingArticles=definitions.map(([filename,slug,title,description])=>{
 const markdown=readFileSync(new URL(`./content/overbooking/${filename}`,import.meta.url),'utf8').replace(/^\uFEFF/,'').replace(/\r/g,'');
 const h1=/^#\s+(.+)$/m.exec(markdown);
 if(!h1)throw new Error(`Missing H1: ${filename}`);
 const body=markdown.slice(h1.index+h1[0].length).trim();
 const minutes=Math.max(1,Math.ceil(body.replace(/[#*_\[\]()|]/g,' ').split(/\s+/u).length/200));
 const authorSlug=slug==='bronyuvannya-telefonom-mesendzherakh'?'kostiantyn-tripailo':'oleh-stepeniev';
 return Object.freeze({slug:`/blog/${slug}`,title,description,headline:h1[1].trim(),lead:description,image,imageAlt,minutes,body,authorSlug,pendingPublicationDate:true});
});

export function renderOverbookingArticle(slug){
 const article=overbookingArticles.find(item=>item.slug===slug);
 if(!article)return '';
 const author=getAuthor(article.authorSlug);
 const rendered=renderArticleMarkdown(article.body);
 const contents=rendered.toc.map(([heading,id])=>`<a href="#${e(id)}">${e(heading)}</a>`).join('');
 const imageUrl=`${origin}/v1${image}`;
 const schema=JSON.stringify({'@context':'https://schema.org','@type':'BlogPosting',headline:article.headline,description:article.description,url:`${origin}${article.slug}`,image:[imageUrl],author:{'@type':'Person',name:author.name,url:`${origin}${author.profilePath}`},publisher:{'@type':'Organization',name:'VDALO'},inLanguage:'uk'}).replace(/</g,'\\u003c');
 let html=renderPage({origin,full:true})
  .replace(/<title>[\s\S]*?<\/title>/,`<title>${e(article.title)}</title>`)
  .replace(/<meta name="description" content="[^"]*">/,`<meta name="description" content="${e(article.description)}">`)
  .replace(/<meta property="og:type" content="[^"]*">/,'<meta property="og:type" content="article">')
  .replace(/<meta property="og:title" content="[^"]*">/,`<meta property="og:title" content="${e(article.title)}">`)
  .replace(/<meta property="og:description" content="[^"]*">/,`<meta property="og:description" content="${e(article.description)}">`)
  .replace(/<meta property="og:url" content="[^"]*">/,`<meta property="og:url" content="${origin}${article.slug}">`)
  .replace(/<link rel="canonical" href="[^"]*">/,`<link rel="canonical" href="${origin}${article.slug}">`)
  .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/,`<script type="application/ld+json">${schema}</script>`)
  .replace('</head>',`<meta property="og:image" content="${imageUrl}"><meta property="og:image:alt" content="${e(imageAlt)}"><link rel="stylesheet" href="/v1/editorial-seo.css">${readingStyles}</head>`);
 const content=`<main id="main" class="pms-article-page editorial-reading article-reader"><div class="article-wrap"><nav class="article-breadcrumbs" aria-label="Навігаційний ланцюжок"><a href="/">Головна</a><span aria-hidden="true">/</span><a href="/blog">Блог</a><span aria-hidden="true">/</span><span aria-current="page">Бронювання та канали</span></nav><div class="reader-hero"><header class="article-header"><p class="article-eyebrow">ПРАКТИЧНИЙ ПОСІБНИК · БРОНЮВАННЯ</p><h1>${e(article.headline)}</h1><p class="article-lead">${e(article.description)}</p>${readerByline({authorSlug:article.authorSlug,minutes:`${article.minutes} хв читання`})}</header><figure class="article-cover"><img src="${image}" width="1200" height="800" alt="${e(imageAlt)}" fetchpriority="high"><figcaption>Ілюстрація до матеріалу про роботу з бронюваннями.</figcaption></figure></div><div class="article-layout">${readerContents(contents)}<article class="article-body">${rendered.html}<section class="article-conclusion"><h2>Обговоріть процес із командою VDALO</h2><p>Розкажіть про свій об’єкт і канали бронювання. Разом визначимо, які сценарії варто перевірити.</p><a class="button" href="/contact">Зв’язатися з командою</a></section></article></div></div><div class="reader-author-end">${readerAuthorCard(article.authorSlug)}</div></main>`;
 html=html.replace(/<main id="main">[\s\S]*?<\/main>/,content);
 return html.replace(/<nav id="navigation"[\s\S]*?<\/nav>/,nav=>nav.replace(/href="#([^"]+)"/g,'href="/#$1"'))
  .replace(/<footer[\s\S]*?<\/footer>/,footer=>footer.replace(/href="#([^"]+)"/g,'href="/#$1"'));
}
