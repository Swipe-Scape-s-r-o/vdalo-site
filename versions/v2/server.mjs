import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { renderPage, escape } from './render.mjs';
import { site } from './content/vdalo-ua.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
if (existsSync(path.join(root, '.env')) && process.loadEnvFile) process.loadEnvFile(path.join(root, '.env'));
const port = Number(process.env.PORT || 4184);
const host = process.env.HOST || '127.0.0.1';
export function configuredOrigin() {
 if (!process.env.VDALO_SITE_URL) return '';
 const url = new URL(process.env.VDALO_SITE_URL);
 if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Invalid VDALO_SITE_URL');
 return url.origin;
}
const origin = configuredOrigin();
const mime = { '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.webp':'image/webp', '.woff2':'font/woff2' };
function send(res, status, data, type='application/json; charset=utf-8') {
 res.writeHead(status, { 'Content-Type':type, 'X-Content-Type-Options':'nosniff', 'Referrer-Policy':'strict-origin-when-cross-origin', 'X-Frame-Options':'DENY', 'Cache-Control':'no-store' });
 res.end(type.startsWith('application/json') ? JSON.stringify(data) : data);
}
const text = (v, max=150) => typeof v==='string' ? v.trim().slice(0,max) : '';
export function validateLead(kind, raw) {
 if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { errors:{ form:'Перевірте дані форми.' } };
 const data = { name:text(raw.name,100), property:text(raw.property), contact:text(raw.contact,180), units:text(raw.units,6), pms:text(raw.pms), pain:text(raw.pain,1000), consent:raw.consent===true };
 const errors = {};
 if (data.name.length<2) errors.name='Вкажіть ваше ім’я.';
 if (data.property.length<2) errors.property='Вкажіть назву об’єкта.';
 if (!(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contact) || (/^[+()\d\s.-]+$/.test(data.contact) && data.contact.replace(/\D/g,'').length>=9 && data.contact.replace(/\D/g,'').length<=15))) errors.contact='Вкажіть коректний телефон або email.';
 if (data.units && !/^[1-9]\d{0,4}$/.test(data.units)) errors.units='Вкажіть кількість номерів або юнітів від 1 до 99999.';
 if (!data.consent) errors.consent='Потрібна ваша згода на використання контактів для відповіді.';
 if (raw.website) errors.form='Не вдалося перевірити форму. Оновіть сторінку.';
 const utm = {};
 for (const key of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term']) if (raw.utm?.[key]) utm[key]=text(raw.utm[key],150);
 return { data:{ ...data, kind, utm, source:'vdalo-website' }, errors };
}
const limits = new Map();
function limited(req) {
 const key=req.socket.remoteAddress;
 const now=Date.now();
 if(limits.size>10000) for (const [ip,v] of limits) if (v.until<now) limits.delete(ip);
 let bucket=limits.get(key);
 if(!bucket || bucket.until<now) {
  if(!bucket && limits.size>=10000) return true;
  bucket={ count:0, until:now+15*60*1000 }; limits.set(key,bucket);
 }
 return ++bucket.count>12;
}
async function lead(req,res,kind) {
 if (limited(req)) return send(res,429,{ok:false,message:'Забагато спроб. Будь ласка, спробуйте трохи пізніше.'});
 if (!req.headers['content-type']?.startsWith('application/json')) return send(res,415,{ok:false,message:'Непідтримуваний формат запиту.'});
 if (req.headers.origin) {
  const allowed = new Set([origin, `http://${req.headers.host}`, `https://${req.headers.host}`]);
  if (!allowed.has(req.headers.origin)) return send(res,403,{ok:false,message:'Надсилання з іншого сайту недоступне.'});
 }
 let body='';
 try {
  for await(const chunk of req) { body+=chunk; if(Buffer.byteLength(body)>16384) return send(res,413,{ok:false,message:'Запит завеликий.'}); }
  const raw=JSON.parse(body);
  const {data,errors}=validateLead(kind,raw);
  if(Object.keys(errors).length) return send(res,422,{ok:false,errors,message:'Перевірте поля форми.'});
  const target=process.env[kind==='trial'?'VDALO_TRIAL_WEBHOOK_URL':'VDALO_AUDIT_WEBHOOK_URL'] || process.env.VDALO_LEAD_WEBHOOK_URL;
  if (!target) return send(res,503,{ok:false,message:'Приймання заявок ще налаштовується. Ваш запит не надіслано. Спробуйте пізніше.'});
  const url = new URL(target);
  if(url.protocol!=='https:' && !(process.env.NODE_ENV!=='production' && url.protocol==='http:' && ['localhost','127.0.0.1'].includes(url.hostname))) throw new Error('Invalid webhook protocol');
  const id=randomUUID();
  const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',...(process.env.VDALO_WEBHOOK_BEARER_TOKEN?{Authorization:`Bearer ${process.env.VDALO_WEBHOOK_BEARER_TOKEN}`}:{})},body:JSON.stringify({...data,id,submittedAt:new Date().toISOString()}),signal:AbortSignal.timeout(10000),redirect:'error'});
  await response.body?.cancel();
  if(!response.ok) return send(res,502,{ok:false,message:'Не вдалося надіслати запит. Спробуйте ще раз трохи пізніше.'});
  return send(res,200,{ok:true,leadId:id});
 } catch(error) {
  return send(res,error instanceof SyntaxError?400:502,{ok:false,message:'Не вдалося надіслати запит. Перевірте дані або спробуйте пізніше.'});
 }
}
function privacyPage() {
 const operator = site.commercial.legalEntity;
 const content = `<main id="main" class="wrap legal"><p class="eyebrow">Контактні форми</p><h1>Використання ваших даних</h1><p>Форми пробного доступу та аудиту призначені для зв’язку щодо вашого об’єкта. Вони збирають ім’я, назву об’єкта, телефон або email, кількість номерів та додаткові відомості, які ви обираєте надати.</p><h2>Навіщо потрібні дані</h2><p>Щоб відповісти на ваш запит, погодити пробний доступ або аудит процесів готелю. Форма також може передати UTM-мітки джерела переходу. Аналітичні події не містять тексту форми та ваших контактів.</p><h2>Як передається заявка</h2><p>Після підключення приймання заявок дані передаються сервером у погоджену систему обробки запитів. Сервер сайту не записує заявки у файли. Поки приймання не налаштоване, форма повідомляє про помилку й не підтверджує отримання запиту.</p><h2>Оператор і контакти</h2><p>${operator?escape(operator):'Це попередня версія інформації для локального перегляду. Юридичну назву оператора, контакт для звернень, одержувачів і строки зберігання потрібно погодити перед публічним запуском.'}</p>${site.commercial.privacyEmail?`<p>Контакт: ${escape(site.commercial.privacyEmail)}</p>`:''}${site.commercial.retentionPeriod?`<p>Строк зберігання: ${escape(site.commercial.retentionPeriod)}</p>`:''}<p>Не надсилайте дані гостей, паспорти, банківські картки, коди доступу або секрети інтеграцій через ці форми.</p></main>`;
 return renderPage({full:false}).replace(/<main id="main">[\s\S]*?<\/main>/,content).replace(/<title>[\s\S]*?<\/title>/,'<title>Конфіденційність | VDALO</title>');
}
const server=http.createServer(async(req,res)=>{
 try {
  const url=new URL(req.url,'http://localhost');
  const pathname=decodeURIComponent(url.pathname);
  if(req.method==='POST' && /^\/api\/leads\/(trial|audit)$/.test(pathname)) return await lead(req,res,pathname.split('/').pop());
  if (!['GET','HEAD'].includes(req.method)) return send(res,405,{ok:false,message:'Метод недоступний.'});
  if(pathname==='/') return send(res,200,renderPage({origin,full:true}),'text/html; charset=utf-8');
  if(pathname==='/privacy') return send(res,200,privacyPage(),'text/html; charset=utf-8');
  if(pathname==='/robots.txt') return send(res,200,origin?`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`:'User-agent: *\nDisallow: /\n','text/plain; charset=utf-8');
  if(pathname==='/sitemap.xml' && origin) return send(res,200,`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escape(origin)}/</loc></url></urlset>`,'application/xml; charset=utf-8');
  if(!/^\/(assets\/[a-zA-Z0-9_.-]+|refinement\.css|refinement\.css|polish\.css|styles\.css|design-system-2\.css|dark-edition\.css|app\.js)$/.test(pathname)) return send(res,404,'Сторінку не знайдено.','text/plain; charset=utf-8');
  const filename=path.join(root,'public',pathname.slice(1));
  const data=await readFile(filename);
  res.writeHead(200,{'Content-Type':mime[path.extname(filename)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':process.env.NODE_ENV==='production'?'public, max-age=300':'no-store'});
  res.end(req.method==='HEAD'?undefined:data);
 } catch { send(res,404,'Сторінку не знайдено.','text/plain; charset=utf-8'); }
});
if ((process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url))) server.listen(port,host,()=>console.log(`VDALO server started`));
export { server, privacyPage };
