import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {renderPage,escape} from './render.mjs';
import resources from './resource-catalog.json' with {type:'json'};

const e=escape;
const groups=[['money','Порахувати економіку'],['guest','Підготувати матеріали гостю'],['team','Організувати роботу команди'],['system','Обрати й запустити PMS'],['website','Перевірити сайт']];
const shell=()=>renderPage({origin:'https://www.vdalo.tech',full:false});
export const publicResources=resources.map(resource=>({...resource,path:`/downloads/hotel/${resource.file}`}));

export function renderResourceLibrary(){
 let html=shell();
 html=html.replace(/<title>[\s\S]*?<\/title>/,'<title>Безкоштовні шаблони для готелів: чеклісти й картки | VDALO</title>');
 html=html.replace(/<meta name="description" content="[^"]*">/,'<meta name="description" content="Завантажте практичні шаблони VDALO для роботи команди, матеріалів гостям, переходу на PMS і перевірки сайту готелю.">');
 html=html.replace(/<link rel="canonical" href="[^"]*">/,'<link rel="canonical" href="https://www.vdalo.tech/resources">');
 html=html.replace('</head>','<link rel="stylesheet" href="/tools.css"></head>');
 html=html.replace(/<main id="main">[\s\S]*?<\/main>/,`<main id="main" class="tool-page resource-library"><div class="tool-wrap"><nav class="tool-crumb" aria-label="Навігаційний ланцюжок"><a href="/">Головна</a><span>/</span><span aria-current="page">Шаблони для готелів</span></nav><header class="tool-hero"><p class="tool-kicker">БЕЗКОШТОВНІ МАТЕРІАЛИ ДЛЯ КОМАНДИ</p><h1>Шаблони для щоденної роботи готелю</h1><p>Завантажте картки й чеклісти, адаптуйте їх до своїх процесів та інструкцій. Це редаговані заготовки, а не нормативні вимоги чи автоматизовані операції VDALO.</p></header>${groups.map(([id,label])=>{const items=publicResources.filter(resource=>resource.category===id);if(!items.length)return'';return `<section class="resource-group" aria-labelledby="resource-${id}"><h2 id="resource-${id}">${e(label)}</h2><div class="resource-grid">${items.map(resource=>`<article class="resource-card"><p class="tool-card-tag">${e(resource.format.toUpperCase())}${resource.language==='uk_en'?' · УКРАЇНСЬКА ТА АНГЛІЙСЬКА':''}</p><h3>${e(resource.title)}</h3><p>${e(resource.description)}</p><details><summary>Що всередині</summary><ul>${resource.preview.map(item=>`<li>${e(item)}</li>`).join('')}</ul></details><a class="tool-primary" href="${e(resource.path)}" download>Завантажити файл <span aria-hidden="true">↓</span></a></article>`).join('')}</div></section>`}).join('')}<section class="tool-method"><h2>Як використовувати шаблони</h2><p>Перевірте, чи відповідають поля вашим процедурам, ролям команди та місцевим вимогам. У шаблонах немає інтеграції з PMS: їх потрібно заповнювати й передавати вручну у погодженому командою порядку.</p><p>Не додавайте в публічні файли паролі, коди замків, дані платіжних карток або зайві персональні дані гостей. Для роботи з документами гостей спершу перевірте, які дані справді потрібні.</p></section><section class="tool-sources"><p>Інші інструменти: <a href="/tools/">калькулятори, чекліст PMS та QR Studio</a>. Матеріали для сайта готелю можна перевірити за <a href="/tools/qr-studio/">QR Studio</a>.</p></section></div></main>`);
 return html;
}

export async function getPublicResource(filename){
 const item=publicResources.find(resource=>resource.file===filename);
 if(!item)return null;
 const data=await readFile(new URL(`./public/downloads/hotel/${item.file}`,import.meta.url));
 const sha256=createHash('sha256').update(data).digest('hex');
 if(sha256!==item.sha256)throw new Error(`Public resource checksum mismatch: ${item.file}`);
 return {data,type:item.format==='xlsx'?'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':'text/plain; charset=utf-8',filename:item.file};
}
