import {getAuthor} from './authors.mjs';
import {escape} from './render.mjs';
const e=escape;
export const readingStyles='<link rel="stylesheet" href="/v1/reading-layout.css?v=20261023-1">';

export function readerByline({authorSlug='oleh-stepeniev',dates='',minutes=''}={}){
 const author=getAuthor(authorSlug);
 return `<div class="reader-byline"><a class="reader-author" href="${author.profilePath}"><img src="${author.image}" width="40" height="40" alt=""><span><strong>${e(author.name)}</strong><small>Автор матеріалу</small></span></a><div class="reader-meta">${dates}${minutes?`<span class="reader-duration">${e(minutes)}</span>`:''}</div></div>`;
}
export function readerContents(links,{kind='article'}={}){
 const count=(links.match(/<a\b/g)||[]).length;
 return `<details class="reader-mobile-contents"><summary><span>Зміст ${kind==='case'?'кейсу':'статті'}</span><span class="reader-contents-count">${count} розділів <span aria-hidden="true">⌄</span></span></summary><nav aria-label="Зміст матеріалу">${links}</nav></details><aside class="article-toc reader-contents"><p class="reader-contents-label">У цьому матеріалі</p><nav aria-label="Зміст матеріалу">${links}</nav><a class="reader-back" href="/${kind==='case'?'cases':'blog'}">← ${kind==='case'?'Усі кейси':'Усі статті'}</a></aside>`;
}
export function readerAuthorCard(authorSlug='oleh-stepeniev'){
 const author=getAuthor(authorSlug);
 const description=authorSlug==='kostiantyn-tripailo'?'Маркетинг, контент, SEO та AI у продажах. Досвід автора й опубліковані матеріали зібрані у профілі.':'Засновник VDALO. Пише про готельні процеси на основі підприємницького досвіду та роботи з об’єктами розміщення.';
 return `<section class="reader-author-card" aria-label="Про автора"><img src="${author.image}" width="64" height="64" alt="" loading="lazy"><div><p class="reader-contents-label">Про автора</p><h2><a href="${author.profilePath}">${e(author.name)}</a></h2><p>${description}</p><a class="reader-author-link" href="${author.profilePath}">Досвід і матеріали автора <span aria-hidden="true">↗</span></a></div></section>`;
}
// Adapt the owned article templates without changing their copy, IDs or SEO metadata.
export function applyArticleReadingLayout(html){
 if(!html.includes('class="pms-article-page"'))return html;
 const authorSlug=html.includes('class="article-byline"><span>Автор: <a href="/authors/kostiantyn-tripailo"')?'kostiantyn-tripailo':'oleh-stepeniev';
 html=html.replace('class="pms-article-page"','class="pms-article-page editorial-reading article-reader"');
 html=html.replace(/<div class="article-byline">([\s\S]*?)<\/div>/,(_,byline)=>{
  const dates=(byline.match(/<time\b[^>]*>[\s\S]*?<\/time>/g)||[]).join('');
  const minutes=byline.match(/(?:Час читання:\s*)?(\d+\s*хв)(?:\s*читання)?/)?.[1]||'';
  return readerByline({authorSlug,dates,minutes:minutes?`${minutes} читання`:''});
 });
 html=html.replace(/(<header class="article-header">[\s\S]*?<\/header>)\s*(<figure class="article-cover">[\s\S]*?<\/figure>)/,'<div class="reader-hero">$1$2</div>');
 html=html.replace(/<aside class="article-toc"><p>У статті<\/p>([\s\S]*?)<\/aside>/,(_,links)=>readerContents(links));
 html=html.replace(/<div class="article-table-wrap">/g,'<div class="article-table-wrap" role="region" aria-label="Таблиця у статті" tabindex="0">');
 html=html.replace('</main>',`<div class="reader-author-end">${readerAuthorCard(authorSlug)}</div></main>`);
 return html.replace('</head>',readingStyles+'</head>');
}
