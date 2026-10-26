import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import registry from './registry.json' with {type:'json'};
import {renderArticleMarkdown} from '../article-markdown.mjs';
import {getTouristTaxPlace} from '../tourist-tax-data.mjs';
import {signupHref} from '../signup-links.mjs';
import {elements,hasClass,inner,outer,textOf,escapeHtml as e,replaceInner,replaceOuter,editElements} from './html-fragments.mjs';

export const revisionDate='2026-10-23';
const origin='https://www.vdalo.tech';
const cssVersion=createHash('sha256').update(readFileSync(new URL('../public/prepared-content.css',import.meta.url))).digest('hex').slice(0,12);
const byRoute=new Map();
export const preparedPages=registry.map(meta=>{
 const markdown=readFileSync(new URL(`./pages/${meta.file}`,import.meta.url),'utf8');
 const withoutTitle=markdown.replace(/^# [^\n]+\n+/, '');
 const firstHeading=withoutTitle.search(/^## /m);
 const intro=firstHeading<0?withoutTitle:withoutTitle.slice(0,firstHeading).trim();
 const body=firstHeading<0?'':withoutTitle.slice(firstHeading);
 const lead=intro.split(/\n\s*\n/)[0]??'';
 const sections=[...body.matchAll(/^## (.+)\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm)].map(match=>({title:match[1],markdown:`## ${match[1]}\n${match[2].trim()}\n`}));
 const introTail=intro.slice(lead.length).trim();
 const page={...meta,markdown,intro,lead,introTail,body,sections,minutes:Math.max(1,Math.ceil(markdown.split(/\s+/).length/190))};
 byRoute.set(meta.route,page);
 return page;
});
export const getPreparedPage=route=>byRoute.get(route);
export const revisionRoutes=preparedPages.map(page=>page.route);
const localLinks=html=>html.replace(/href="https:\/\/(?:www\.)?vdalo\.tech([^"#]*)(#[^"]*)?"/g,(_match,path,hash)=>`href="${path||'/'}${hash||''}"`);
const md=value=>localLinks(renderArticleMarkdown(value).html);
const classNode=(html,name)=>elements(html).find(node=>hasClass(node,name));
const replaceClass=(html,name,value,contents=false)=>{
 const node=classNode(html,name);
 if(!node)throw new Error(`Prepared content: missing .${name}`);
 return contents?replaceInner(html,node,value):replaceOuter(html,node,value);
};
const appendInside=(html,node,value)=>html.slice(0,node.closeStart)+value+html.slice(node.closeStart);
function copyBlock(markdown,{className='',label='Практичні пояснення'}={}){
 return `<div class="prepared-copy ${className}" aria-label="${e(label)}">${md(markdown)}</div>`;
}
function selectedBody(page,predicate=()=>true){return page.sections.filter(predicate).map(section=>section.markdown).join('\n');}
function updateHero(html,page){
 const h1=elements(html).find(node=>node.tag==='h1');
 if(h1)html=replaceInner(html,h1,e(page.h1));
 const nodes=elements(html);
 const currentH1=nodes.find(node=>node.tag==='h1');
 const lead=nodes.find(node=>['article-lead','seo-lead','tt-lead','privacy-lead','intro-lead','author-profile-lead','ttf-lead'].some(name=>hasClass(node,name)))??(page.route==='/'?null:nodes.find(node=>node.tag==='p'&&node.start>currentH1.end&&node.parent===currentH1.parent));
 if(lead)html=replaceInner(html,lead,md(page.lead).replace(/^<p>|<\/p>$/g,''));
 return html;
}
function withMetadata(html,page){
 html=html.replace(/<title>[\s\S]*?<\/title>/,`<title>${e(page.title)}</title>`);
 const updates=[['name','description',page.description],['name','robots',page.robots],['property','og:title',page.ogTitle],['property','og:description',page.ogDescription],['property','og:url',page.canonical],['name','twitter:title',page.ogTitle],['name','twitter:description',page.ogDescription]];
 for(const [attr,key,value] of updates){
  const matcher=new RegExp(`<meta\\b(?=[^>]*\\b${attr}=["']${key}["'])[^>]*>`, 'gi');
  html=html.replace(matcher,'').replace('</head>',`<meta ${attr}="${key}" content="${e(value)}"></head>`);
 }
 html=html.replace(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/gi,'').replace('</head>',`<link rel="canonical" href="${e(page.canonical)}"></head>`);
 return html;
}
function preserveAnchors(before,after){
 const currentIds=new Set(elements(after).map(node=>node.attrs.id).filter(Boolean));
 const aliases=elements(before).filter(node=>node.attrs.id&&!currentIds.has(node.attrs.id)&&['section','h2','h3','nav'].includes(node.tag));
 // Retain published section URLs. Existing aliases live at the new reading start;
 // the visible contents list always points to the actual revised headings.
 return aliases.map(node=>`<span class="prepared-anchor" id="${e(node.attrs.id)}" aria-hidden="true"></span>`).join('')+after;
}
function reviseArticle(html,page){
 const body=classNode(html,'article-body');
 if(!body)throw new Error(`Missing article body ${page.route}`);
 const rendered=renderArticleMarkdown(`${page.introTail}\n\n${page.body}`);
 html=replaceInner(html,body,preserveAnchors(inner(html,body),`<div class="prepared-copy prepared-article">${localLinks(rendered.html)}</div>`));
 const links=rendered.toc.map(([heading,id])=>`<a href="#${e(id)}">${e(heading)}</a>`).join('');
 html=editElements(html,node=>node.tag==='nav'&&node.attrs['aria-label']==='Зміст матеріалу',(_fragment,node)=>`<nav aria-label="Зміст матеріалу">${links}</nav>`);
 html=editElements(html,node=>hasClass(node,'reader-contents-count'),()=>`<span class="reader-contents-count">${rendered.toc.length} розділів <span aria-hidden="true">⌄</span></span>`);
 html=editElements(html,node=>hasClass(node,'reader-duration'),()=>`<span class="reader-duration">${page.minutes} хв читання</span>`);
 // Keep the original publication date. Only this new substantive revision changes
 // dateModified; the server schema builder reconciles the article graph afterwards.
 html=html.replace(/(<meta property="article:modified_time" content=")[^"]*(">)/g,`$1${revisionDate}$2`);
 html=editElements(html,node=>node.tag==='time'&&textOf(inner(html,node)).startsWith('Оновлено'),()=>`<time datetime="${revisionDate}">Оновлено 23 жовтня 2026</time>`);
 return html;
}
function reviseCase(html,page){
 const column=classNode(html,'case-reading-column');
 const author=elements(html).find(node=>hasClass(node,'reader-author-card'));
 const cta=classNode(html,'case-cta');
 const rendered=renderArticleMarkdown(page.body);
 const copy=`<div class="prepared-copy prepared-article">${localLinks(rendered.html)}</div>${author?outer(html,author):''}${cta?outer(html,cta):''}`;
 html=replaceInner(html,column,preserveAnchors(inner(html,column),copy));
 html=editElements(html,node=>hasClass(node,'case-metrics-section'),()=> '');
 const links=rendered.toc.map(([heading,id])=>`<a href="#${e(id)}">${e(heading)}</a>`).join('');
 html=editElements(html,node=>node.tag==='nav'&&node.attrs['aria-label']==='Зміст матеріалу',()=>`<nav aria-label="Зміст матеріалу">${links}</nav>`);
 html=editElements(html,node=>hasClass(node,'reader-contents-count'),()=>`<span class="reader-contents-count">${rendered.toc.length} розділів <span aria-hidden="true">⌄</span></span>`);
 return html;
}
const requestCta=(kind='audit')=>`<section class="prepared-request"><div><p class="prepared-kicker">НАСТУПНИЙ КРОК</p><h2>${kind==='trial'?'Перевірте VDALO на процесі свого об’єкта':'Обговоріть процес із командою VDALO'}</h2><p>${kind==='trial'?'Створіть обліковий запис онлайн. Тест триває 14 днів і не потребує банківської картки.':'Залиште контакт і назву об’єкта. Команда уточнить запит та погодить наступні дії.'}</p></div>${kind==='trial'?`<a class="button" href="${signupHref('prepared_content')}">Створити обліковий запис <span aria-hidden="true">↗</span></a>`:`<button class="button" type="button" data-open="${kind}" data-location="prepared-content">Обговорити процес <span aria-hidden="true">↗</span></button>`}</section>`;
function reviseService(html,page){
 const nodes=elements(html),main=nodes.find(node=>node.tag==='main');
 const content=nodes.find(node=>node.parent===main&&hasClass(node,'seo-wrap'));
 if(!content)throw new Error(`Missing service content ${page.route}`);
 const pricing=classNode(html,'seo-pricing');
 const widget=pricing?outer(html,pricing):'';
 const body=copyBlock(page.body,{className:'prepared-service'});
 const value=page.route==='/pricing'?`${widget}${body}${requestCta('trial')}`:`${body}${requestCta(page.route==='/sign-up'?'trial':'audit')}`;
 return replaceInner(html,content,preserveAnchors(inner(html,content),value));
}
function reviseLegal(html,page){
 const main=elements(html).find(node=>node.tag==='main');
 const introNodes=elements(inner(html,main)).filter(node=>node.parent===null&&['h1','p','div'].includes(node.tag));
 const intro=introNodes.filter(node=>node.tag==='h1'||['eyebrow','privacy-lead','privacy-date','legal-notice'].some(name=>hasClass(node,name))).map(node=>outer(inner(html,main),node)).join('');
 const body=copyBlock(page.body,{className:'prepared-legal'}).replace('Відкрити налаштування cookie.','<button id="cookie-preferences" type="button" data-open-cookie-settings>Відкрити налаштування cookie</button>.');
 return replaceInner(html,main,intro+preserveAnchors(inner(html,main),body));
}
function reviseAuthor(html,page){
 if(page.route==='/authors'){
  html=editElements(html,node=>hasClass(node,'authors-editorial-note'),()=> '');
  const wrap=classNode(html,'author-page-wrap');
  return appendInside(html,wrap,copyBlock(selectedBody(page,section=>!['Олег Степенєв','Костянтин Тріпайло'].includes(section.title)),{className:'prepared-author'}));
 }
 const copy=classNode(html,'author-profile-copy');
 const external=classNode(html,'author-profile-links');
 const eyebrow=elements(inner(html,copy)).find(node=>hasClass(node,'author-eyebrow'));
 const lead=md(page.intro).replace('<p>','<p class="author-profile-lead">');
 html=replaceInner(html,copy,`${eyebrow?outer(inner(html,copy),eyebrow):''}<h1>${e(page.h1)}</h1>${lead}${external?outer(html,external):''}`);
 const articles=classNode(html,'author-articles');
 const body=selectedBody(page,section=>!['Статті автора','Матеріали у VDALO'].includes(section.title));
 return html.slice(0,articles.start)+copyBlock(body,{className:'prepared-author'})+html.slice(articles.start);
}
function reviseCollection(html,page){
 const main=elements(html).find(node=>node.tag==='main');
 if(page.route==='/cases'){
  const cards=elements(html).filter(node=>hasClass(node,'case-card')).map(node=>outer(html,node)).join('');
  const extra=selectedBody(page,section=>!preparedPages.some(p=>p.route.startsWith('/cases/')&&p.h1===section.title));
  const hero=classNode(html,'case-index-hero');
  return replaceInner(html,main,`${outer(html,hero)}<section class="section case-index-list"><div class="wrap case-index-cards">${cards}</div></section>${copyBlock(extra,{className:'prepared-collection'})}`);
 }
 if(page.route==='/blog'){
  // Keep the established illustrated cards and topic navigation; the package's
  // repeated catalogue entries are implemented by their matching revised cards.
  html=editElements(html,node=>hasClass(node,'blog-editorial'),()=> '');
  const guide=selectedBody(page,section=>['З якого посібника почати','Від читання до перевірки','Практичні кейси й інструменти','Як ми працюємо з фактами','Далі за темою'].includes(section.title));
  const currentMain=elements(html).find(node=>node.tag==='main');
  return appendInside(html,currentMain,copyBlock(guide,{className:'prepared-collection'}));
 }
 if(page.route==='/tools/'){
  const wrap=classNode(html,'tool-wrap'),crumb=classNode(html,'tool-crumb'),hero=classNode(html,'tool-hero');
  const catalogue=classNode(html,'tool-catalog');
  const guide=selectedBody(page,section=>section.title!=='Який інструмент вам потрібен');
  return replaceInner(html,wrap,outer(html,crumb)+outer(html,hero)+outer(html,catalogue)+copyBlock(guide,{className:'prepared-tools'}));
 }
 return html;
}
function reviseTool(html,page){
 const wrap=classNode(html,'tool-wrap'),crumb=classNode(html,'tool-crumb'),hero=classNode(html,'tool-hero');
 const application=classNode(html,page.route.includes('pms-checklist')?'checklist-app':'profitability-calculator');
 const before=page.sections.filter(section=>section.title==='Як працює оцінювання').map(section=>section.markdown).join('\n');
 const after=selectedBody(page,section=>!['Як працює оцінювання','Підготуйте порівняння'].includes(section.title));
 const note=page.route.includes('pms-checklist')?'<p class="prepared-availability">Звіт можна переглянути й надрукувати у браузері. Надсилання email-звіту наразі недоступне.</p>':'';
 return replaceInner(html,wrap,`${outer(html,crumb)}${outer(html,hero)}${before?copyBlock(before):''}${outer(html,application)}${note}${copyBlock(after,{className:'prepared-tools'})}`);
}
function reviseTax(html,page){
 if(page.route==='/tourist-tax/start'){
  const band=classNode(html,'ttf-band');
  return replaceOuter(html,band,`<section class="ttf-shell prepared-tax-start">${copyBlock(page.body)}</section>`);
 }
 const nodes=elements(html),main=nodes.find(node=>node.tag==='main');
 const preserved=nodes.filter(node=>node.parent===main&&(
  node.tag==='nav'||['tt-hero','tt-city-hero','tt-calc-card','tt-dps-dashboard','tt-data-guide','tt-infographic','tt-directory','tt-funnel-promo'].some(name=>hasClass(node,name))||node.attrs.id==='tt-calculator'||page.route==='/tourist-tax/odesa/'&&/^Чому зараз немає розрахунку/.test(textOf(inner(html,node)))
 )).map(node=>outer(html,node));
 const sourcePanels=nodes.filter(node=>node.parent===main&&(hasClass(node,'tt-sources')||node.tag==='section'&&/^Джерела ставок/.test(textOf(inner(html,node))))).map(node=>outer(html,node));
 const place=page.route.match(/^\/tourist-tax\/([^/]+)\/$/)?.[1];
 const settlement=place?getTouristTaxPlace(place):null;
 const identity=settlement?`<p class="prepared-place-identity">Територію розрахунку звіряйте за адресою об’єкта. Код населеного пункту за КАТОТТГ: <strong>${e(settlement.katottgSettlementCode)}</strong>.</p>`:'';
  const ratesLink=place?'<p class="tt-article-link"><a href="/tourist-tax/rates/">Переглянути реєстр підтверджених ставок</a></p>':'';
 // Replace the previous prose and duplicated source panels as one complete
 // revision. Keep all live calculator/dashboard/directory DOM and data untouched.
 const paymentNote=page.route==='/tourist-tax/'?'<p class="prepared-payment-note">Реквізити для оплати залежать від громади. Перед сплатою звірте одержувача, рахунок і призначення платежу з податковим агентом або місцевою радою.</p>':'';
  return replaceInner(html,main,preserved.join('')+`<section class="tt-seo-content">${identity}${copyBlock(page.body,{className:'prepared-tax'})}${paymentNote}</section>${ratesLink}`+sourcePanels.join(''));
}
function reviseQr(html,page){
 const old=classNode(html,'seo-content');
 return replaceOuter(html,old,`<section class="seo-content prepared-qr">${copyBlock(page.body)}</section>`);
}
function reviseHome(html,page){
 // The simulations, module catalogue, price calculator and payment dialog keep
 // their original markup. Copy is mapped to the existing visual sections.
 const sections={solutions:['Де команда втрачає час'],pms:['Бронювання й номерний фонд в одному робочому контексті'],roles:['Зробіть готовність номера зрозумілою команді'],journey:['Підготуйте заїзд до прибуття гостя'],pricing:['Вартість для вашого об’єкта'],unique:['Оберіть інструменти під свій формат','Програма для готелю під ваш спосіб роботи'],onboarding:['Як почати з VDALO','Опубліковані умови пробного доступу'],faq:['Запитання перед стартом']};
 const hero=classNode(html,'hero-v3');
 if(hero){
  let value=outer(html,hero);
  const h1=elements(value).find(node=>node.tag==='h1');
  if(h1)value=replaceInner(value,h1,'Система керування готелем.<br><em>Для щоденної роботи.</em>');
  const paragraphs=elements(value).filter(node=>node.tag==='p');
  const description=paragraphs.find(node=>/VDALO об’єднує|hero-description|hero-lead/.test(outer(value,node)));
  if(description)value=replaceInner(value,description,'VDALO допомагає організувати бронювання, номерний фонд, підготовку заїздів і роботу команди. Почніть із процесу, який важливий вашому об’єкту.');
  html=replaceOuter(html,hero,value);
 }
 for(const [id,titles] of Object.entries(sections)){
  const node=elements(html).find(node=>node.attrs.id===id);
  if(!node)continue;
  const newCopy=selectedBody(page,section=>titles.includes(section.title));
  if(['unique','faq','onboarding'].includes(id)){
   html=replaceInner(html,node,`<div class="wrap">${copyBlock(newCopy,{className:'prepared-home-panel'})}${id==='onboarding'?requestCta('trial'):''}</div>`);
  }else{
   const local=inner(html,node),localNodes=elements(local);
   const heading=localNodes.find(child=>child.tag==='h2');
   const target=id==='pms'?localNodes.find(child=>hasClass(child,'pms-intro')):heading?.parent;
   if(!target)throw new Error(`Missing home narrative ${id}`);
   html=replaceInner(html,node,replaceInner(local,target,copyBlock(newCopy,{className:'prepared-home-panel'})));
  }
 }
 // Additional context that has no matching interactive section remains a short
 // set of cards rather than a second copy of the whole home page.
 const additional=selectedBody(page,section=>['Перевірте локальні операції для України','Що показують практичні матеріали','Перевірмо процес вашого готелю','Далі за темою'].includes(section.title));
 const main=elements(html).find(node=>node.tag==='main');
 html=appendInside(html,main,copyBlock(additional,{className:'prepared-home'}));
  // Keep the approved Channel Manager scope precise: channel count, paid module, no claim that every integration has identical fields.
  html=html.replace(/Понад 60 сервісів уже підключені до VDALO, зокрема Booking\.com та Airbnb\./g,'Довідковий перелік охоплює 77 OTA-каналів, зокрема Booking.com та Airbnb; фактичну сумісність інтеграцій VDALO перевіряємо окремо.').replace(/понад 60 (?:сервісів|інтеграцій)/gi,'довідковий перелік охоплює 77 OTA-каналів').replace(/60\+ інтеграцій/g,'77 OTA-каналів у довідковому переліку');
 return html;
}
function updateCards(html){
 html=editElements(html,node=>node.tag==='a'&&['blog-featured','author-article-card','blog-case-card'].some(name=>hasClass(node,name)),(fragment,node)=>{
  const route=(node.attrs.href??'').replace(origin,'').replace(/\/$/,'');
  const page=byRoute.get(route);
  if(!page)return fragment;
  const title=elements(fragment).find(child=>child.tag==='strong');
  if(title)fragment=replaceInner(fragment,title,e(page.h1));
  fragment=editElements(fragment,child=>hasClass(child,'blog-case-result'),()=> '');
  const description=elements(fragment).find(child=>hasClass(child,'author-article-description')||hasClass(child,'blog-case-lead'))??elements(fragment).find(child=>child.tag==='span'&&child.parent&&hasClass(child.parent,'blog-featured-copy')&&!child.attrs.class);
  if(description)fragment=replaceInner(fragment,description,e(page.description));
  return fragment;
 });
 html=editElements(html,node=>['case-card','blog-card','author-article-card','blog-article-card'].some(name=>hasClass(node,name)),fragment=>{
  const link=elements(fragment).find(node=>node.tag==='a'&&/^\/(?:cases|blog)\/[a-z0-9-]+$/.test(node.attrs.href??''));
  const page=link?byRoute.get(link.attrs.href):null;
  if(!page)return fragment;
  fragment=editElements(fragment,node=>hasClass(node,'case-card-metric'),()=> '');
  const description=elements(fragment).find(node=>node.tag==='p'&&!hasClass(node,'eyebrow')&&!hasClass(node,'blog-tag')&&!hasClass(node,'author-article-tag')&&!hasClass(node,'blog-card-tag'));
  if(description)fragment=replaceInner(fragment,description,e(page.description));
  return fragment;
 });
 return editElements(html,node=>node.tag==='a'&&/^(?:https:\/\/www\.vdalo\.tech)?\/(?:blog|cases)\/[a-z0-9-]+\/?$/.test(node.attrs.href??''),(fragment,node)=>{
  const route=node.attrs.href.replace(origin,'').replace(/\/$/,'');
  const page=byRoute.get(route);
  if(!page)return fragment;
  const label=textOf(inner(fragment,{openEnd:fragment.indexOf('>')+1,closeStart:fragment.lastIndexOf('</a>')}));
  // Headline links are inside h2/h3. Keep navigation links, CTAs and image links.
  if(node.parent&&['h2','h3'].includes(node.parent.tag)&&label&&!fragment.includes('<img'))return fragment.replace(/(>)[\s\S]*(<\/a>)$/,`$1${e(page.h1)}$2`);
  return fragment;
 });
}
function reviseStructuredData(html,page){
 return html.replace(/(<script\b[^>]*type="application\/ld\+json"[^>]*>)([\s\S]*?)(<\/script>)/g,(_match,open,json,close)=>{
  try{
   const value=JSON.parse(json),nodes=value['@graph']??[value];
   for(const node of nodes){
    if(['Article','BlogPosting'].includes(node['@type'])){
     node.headline=page.h1;node.description=page.description;node.dateModified=revisionDate;
    }
   }
   return open+JSON.stringify(value).replaceAll('<','\\u003c')+close;
  }catch{return _match;}
 });
}
export function applyPreparedContent(html,route){
 if(!/<h1\b/i.test(html))return html;
 const aliases={'/v1/privacy':'/privacy','/blog/qr-wifi-dlya-gotelyu/':'/blog/qr-wifi-dlya-gotelyu','/blog/qr-kody-dlya-goteliv/':'/blog/qr-kody-dlya-goteliv','/blog/qr-kartka-v-nomer-gotelyu/':'/blog/qr-kartka-v-nomer-gotelyu'};
 const canonicalRoute=aliases[route]??route;
 const page=byRoute.get(canonicalRoute);
 if(!page)return html;
 // The compact home owns its narrative. Keep metadata without reinserting retired sections.
 const compactHome=page.route==='/' && html.includes('data-homepage="compact-v1"');
 if(!compactHome)html=updateHero(html,page);
 if(page.route.startsWith('/blog/'))html=reviseArticle(html,page);
 else if(page.route.startsWith('/cases/'))html=reviseCase(html,page);
 else if(['/about','/contact','/sign-up','/hotel-automation','/pricing'].includes(page.route))html=reviseService(html,page);
 else if(['/privacy','/offer','/refunds'].includes(page.route))html=reviseLegal(html,page);
 else if(page.route.startsWith('/authors'))html=reviseAuthor(html,page);
 else if(['/blog','/cases','/tools/'].includes(page.route))html=reviseCollection(html,page);
 else if(page.route.startsWith('/tourist-tax'))html=reviseTax(html,page);
 else if(page.route==='/tools/qr-studio/')html=reviseQr(html,page);
 else if(page.route.startsWith('/tools/'))html=reviseTool(html,page);
 else if(page.route==='/'&&!compactHome)html=reviseHome(html,page);
 html=updateCards(html);
 html=withMetadata(html,page);
 html=reviseStructuredData(html,page);
 return html.replace('</head>',`<link rel="stylesheet" href="/v1/prepared-content.css?v=${cssVersion}"></head>`);
}
