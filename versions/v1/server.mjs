import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import {resolveLeadDestination,sendAcknowledgedLead,intakeEventId} from '../../microlandings/legacy-delivery.mjs';
import { renderPage, escape } from './render.mjs';
import { site } from './content/vdalo-ua.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
if (existsSync(path.join(root, '.env')) && process.loadEnvFile) process.loadEnvFile(path.join(root, '.env'));
const port = Number(process.env.PORT || 4183);
const host = process.env.HOST || '127.0.0.1';
export function configuredOrigin() {
 if (!process.env.VDALO_SITE_URL) return '';
 const url = new URL(process.env.VDALO_SITE_URL);
 if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Invalid VDALO_SITE_URL');
 if (url.hostname === 'vdalo.tech' || url.hostname === 'www.vdalo.tech') return 'https://www.vdalo.tech';
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
 const data = { name:text(raw.name,100), property:text(raw.property,150), contact:text(raw.contact||raw.phone,180), email:text(raw.email,180).toLowerCase(), phone:text(raw.phone,40), city:text(raw.city,120), property_type:text(raw.property_type,40), units:text(raw.units,6), pms:text(raw.pms,150), pain:text(raw.pain,1000), mode:kind==='trial'&&raw.mode==='implementation'?'implementation':kind==='trial'?'start':'', estimate:kind==='trial'?text(raw.estimate,1200):'', consent:raw.consent===true };
 const errors = {};
 const isCallback=kind==='audit'&&raw.form_kind==='contact';
 if (data.name.length<2) errors.name='Вкажіть ваше ім’я.';
 if(kind==='trial') {
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email='Вкажіть коректний email для надсилання доступу.';
  const digits=data.phone.replace(/\D/g,'').length;
  if(!/^[+()\d\s.-]+$/.test(data.phone)||digits<9||digits>15) errors.phone='Вкажіть коректний телефон.';
  if(data.property.length<2) errors.property='Вкажіть назву готелю або об’єкта.';
  if(data.city.length<2) errors.city='Вкажіть місто або громаду.';
  if(!['hotel','guesthouse','apartments','glamping','hostel','other'].includes(data.property_type)) errors.property_type='Оберіть тип об’єкта.';
  if(!/^[1-9]\d{0,4}$/.test(data.units)) errors.units='Вкажіть кількість номерів або юнітів від 1 до 99999.';
 } else if (isCallback) {
  const digits=data.contact.replace(/\D/g,'').length;
  if(!/^[+()\d\s.-]+$/.test(data.contact)||digits<9||digits>15) errors.contact='Вкажіть коректний номер телефону.';
 } else if (!(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contact) || (/^[+()\d\s.-]+$/.test(data.contact) && data.contact.replace(/\D/g,'').length>=9 && data.contact.replace(/\D/g,'').length<=15))) errors.contact='Вкажіть коректний телефон або email.';
 if (!data.consent) errors.consent='Потрібна згода на обробку даних, щоб ми відповіли на запит.';
 if (raw.website) errors.form='Не вдалося перевірити форму. Оновіть сторінку.';
 const utm = {};
 for (const key of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term']) if (raw.utm?.[key]) utm[key]=text(raw.utm[key],150);
 const rawAttribution=raw.attribution&&typeof raw.attribution==='object'&&!Array.isArray(raw.attribution)?raw.attribution:{};
 const cleanTouch=touch=>Object.fromEntries(['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].flatMap(key=>rawAttribution[touch]?.[key]?[[key,text(rawAttribution[touch][key],150)]]:[]));
 const attribution={first_touch:cleanTouch('first_touch'),last_touch:cleanTouch('last_touch'),first_touch_at:text(rawAttribution.first_touch_at,40),latest_touch_at:text(rawAttribution.latest_touch_at,40)};
 const quizRaw=raw.quiz_answers&&typeof raw.quiz_answers==='object'&&!Array.isArray(raw.quiz_answers)?raw.quiz_answers:null;
 const quiz_answers=quizRaw?Object.fromEntries(Object.entries(quizRaw).filter(([key,value])=>['property_format','property_type','room_range','pms_status','main_pain','frequency','intent','recommendation_route','sms_code'].includes(key)&&typeof value==='string').map(([key,value])=>[key,text(value,80)])):null;
 return { data:{ ...data, ...(quiz_answers?{quiz_answers}:{}), kind, ...(isCallback?{form_kind:'contact'}:{}), utm, attribution, source:'vdalo-website', ...(kind==='trial'?{trial_days:14,requires_card:false}:{}) }, errors };
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
export async function lead(req,res,kind,{env=process.env,sendRequest=fetch}={}) {
 if (limited(req)) return send(res,429,{ok:false,message:'Забагато спроб. Будь ласка, спробуйте трохи пізніше.'});
 if (!req.headers['content-type']?.startsWith('application/json')) return send(res,415,{ok:false,message:'Непідтримуваний формат запиту.'});
 if (req.headers.origin) {
  const allowed = new Set([origin, `http://${req.headers.host}`, ...(process.env.VERCEL ? [`https://${req.headers.host}`] : [])]);
  if (!allowed.has(req.headers.origin)) return send(res,403,{ok:false,message:'Надсилання з іншого сайту недоступне.'});
 }
 let body='';
 try {
  for await(const chunk of req) { body+=chunk; if(Buffer.byteLength(body)>16384) return send(res,413,{ok:false,message:'Запит завеликий.'}); }
  const raw=JSON.parse(body);
  const {data,errors}=validateLead(kind,raw);
  if(Object.keys(errors).length) return send(res,422,{ok:false,errors,message:'Перевірте поля форми.'});
  const target=resolveLeadDestination(kind,env);
  if (!target) return send(res,503,{ok:false,message:'Приймання заявок ще налаштовується. Ваш запит не надіслано. Спробуйте пізніше.'});
  const parentId=typeof raw.submission_id==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(raw.submission_id)?raw.submission_id:randomUUID();
  const context=[data.estimate,data.email&&`Email: ${data.email}`,data.phone&&`Телефон: ${data.phone}`,data.city&&`Місто: ${data.city}`,data.property_type&&`Тип об’єкта: ${data.property_type}`,data.quiz_answers&&`Відповіді квізу: ${JSON.stringify(data.quiz_answers)}`].filter(Boolean).join('\n');
  if(context.length>1200)return send(res,422,{ok:false,message:'Контекст заявки завеликий. Скоротіть додаткові відповіді.'});
  const id=intakeEventId(parentId,`website:${kind}`,data);
  const accepted=await sendAcknowledgedLead(target,{...data,estimate:context,id,submittedAt:new Date().toISOString()},{sendRequest});
  if(!accepted) return send(res,502,{ok:false,message:'Не вдалося надіслати запит. Спробуйте ще раз трохи пізніше.'});
  return send(res,200,{ok:true,leadId:id});
 } catch(error) {
  return send(res,error instanceof SyntaxError?400:502,{ok:false,message:'Не вдалося надіслати запит. Перевірте дані або спробуйте пізніше.'});
 }
}
function privacyPage() {
 const canonicalOrigin = 'https://www.vdalo.tech';
 const content = `<main id="main" class="wrap legal privacy-page">
  <p class="eyebrow">VDALO / ПРАВОВА ІНФОРМАЦІЯ</p>
  <h1>Політика конфіденційності</h1>
  <p class="privacy-lead">Пояснюємо, які персональні дані обробляються під час відвідування vdalo.tech, надсилання запиту чи користування інструментами сайту, для чого вони потрібні та як ви можете реалізувати свої права.</p>
  <p class="privacy-date">Редакція від 23 жовтня 2026 року.</p>
  <nav class="privacy-toc" aria-label="Зміст політики"><strong>У цій політиці</strong><ol><li><a href="#controller">Володілець даних і контакти</a></li><li><a href="#scope">На що поширюється політика</a></li><li><a href="#data">Які дані обробляємо</a></li><li><a href="#purposes">Мета та підстави обробки</a></li><li><a href="#tools">Дані в інструментах сайту</a></li><li><a href="#recipients">Кому можуть передаватися дані</a></li><li><a href="#transfers">Обробка за межами України</a></li><li><a href="#retention">Строки зберігання</a></li><li><a href="#rights">Ваші права</a></li><li><a href="#product">Дані гостей у VDALO</a></li><li><a href="#security">Захист даних</a></li><li><a href="#changes">Зміни до політики</a></li></ol></nav>
  <section id="controller"><h2>1. Володілець даних і контакти</h2><p>Володільцем персональних даних, які ви надаєте через сайт vdalo.tech, є фізична особа-підприємець Проценко Марта Олександрівна, РНОКПП 3695802023.</p><address><strong>Контакти з питань приватності</strong><br>Адреса: Україна, Полтавська область, Кременчуцький район, село Рокитне, вулиця Незалежності, будинок 21.<br>Телефон: <a href="tel:+380939082254">+380 93 908 22 54</a><br>Telegram: <a href="https://t.me/tripailo_ads" rel="noopener noreferrer">@tripailo_ads</a></address><p>Для запитів щодо доступу, виправлення, видалення або обмеження обробки даних зверніться телефоном або в Telegram. Щоб захистити дані від розкриття сторонній особі, ми можемо попросити підтвердити вашу особу в обсязі, необхідному для розгляду звернення.</p></section>
  <section id="scope"><h2>2. На що поширюється політика</h2><p>Політика стосується публічного сайту vdalo.tech, його сторінок, форм звернення та інтерактивних інструментів. Перехід на сторонню платформу, реєстрація в кабінеті чи користування окремими функціями сервісу можуть регулюватися додатковими умовами та повідомленнями про приватність.</p><p>Обробка даних гостей готелю під час використання VDALO визначається окремо умовами сервісу та договором між готелем і постачальником.</p></section>
  <section id="data"><h2>3. Які дані обробляємо</h2><ul><li><strong>Дані, які ви вводите у форму:</strong> ім’я, телефон або email, назва чи тип об’єкта, кількість номерів або юнітів, назва поточної PMS, опис запиту чи процесу та інші відомості, які ви вирішили надати.</li><li><strong>Дані про звернення:</strong> обрана дія або тема запиту, дата й час його надсилання, факт надання згоди та UTM-параметри рекламного чи інформаційного переходу, якщо вони є в адресі сторінки.</li><li><strong>Технічні дані:</strong> IP-адреса та мережеві відомості, потрібні для обмеження частоти запитів і захисту від зловживань, технічні журнали хостинг-платформи, адреса сторінки та базові відомості браузера, які передаються під час звичайного HTTP-запиту.</li><li><strong>Дані про замовлення й оплату:</strong> під час оформлення клієнт передає ім’я, email і за бажанням телефон, а WayForPay отримує ідентифікатор замовлення, склад, суму, період підписки та контактні дані, потрібні для платежу. Номер картки та CVV вводяться на захищеній сторінці WayForPay; VDALO їх не отримує. WayForPay окремо обробляє карткові дані й регулярні платежі. Сайт отримує підписане повідомлення про результат платежу для підтвердження його справжності.</li></ul><p>Не надсилайте через форми паспорти, банківські реквізити, паролі, коди доступу, медичні відомості, документи гостей або інші чутливі дані, які не потрібні для відповіді на звернення.</p></section>
  <section id="purposes"><h2>4. Мета та підстави обробки</h2><ul><li>Відповісти на ваше звернення, організувати демонстрацію, обговорити аудит або надати інформацію про VDALO. Підстава: ваша згода на обробку контактів для відповіді.</li><li>Підготуватися до укладення та виконати договір, надати доступ, підтримувати сервіс і вести необхідний облік. Підстава: дії на ваш запит до договору, договір та вимоги законодавства.</li><li>Захищати сайт, форми й облікові системи від спаму, зловживань і технічних атак. Підстава: законний інтерес у безпеці та стабільній роботі сайту.</li><li>Вимірювати відвідування й взаємодію зі сторінками сайту та покращувати навігацію. Для статистики використовуємо Google Analytics 4 через Google Tag Manager (контейнер GTM-PKDT7MMT), для запису взаємодій використовуємо Microsoft Clarity. Статистику та запис можна дозволити окремо. Google Tag Manager і Google Analytics 4 завантажуються після згоди на статистику, Clarity після згоди на запис взаємодій. Clarity допомагає аналізувати натискання, прокручування й навігацію; вміст форм маскується. Рекламне сховище й персоналізація реклами не дозволяються цим вибором.</li></ul><p>Маркетингові повідомлення надсилаємо лише за окремою згодою, якщо така розсилка буде запроваджена. Ви можете відкликати згоду на маркетингові повідомлення в будь-який час.</p></section>
  <section id="tools"><h2>5. Дані в інструментах сайту</h2><p>Чекліст вибору PMS зберігає назви систем, введені параметри об’єкта, оцінки та нотатки у локальному сховищі вашого браузера. Ці відомості залишаються на вашому пристрої та не надсилаються VDALO самим фактом заповнення чекліста. Їх можна очистити кнопкою скидання в інструменті або через налаштування браузера.</p><p>Деякі сторінки воронки використовують сховище сеансу, щоб тимчасово зберегти контекст між кроками. Джерело першого переходу (first-touch) і останнього переходу (last-touch) сайт може зберігати до 30 днів у локальному сховищі браузера або first-party cookie: лише UTM-параметри джерела, каналу, кампанії, матеріалу та ключового слова. Ці параметри передаються разом із заявкою, якщо ви її надсилаєте. Власне вікно VDALO зберігає вибір у локальному сховищі браузера під ключем vdalo-cookie-preferences до 180 днів. Необхідні функції, запитані вами, працюють незалежно від згоди на статистику або запис. Google Analytics 4 використовує cookie _ga та _ga_*, Clarity використовує _clck та _clsk. Строки їх зберігання залежать від налаштувань постачальників. Закріплення варіанта відео для аналітичного порівняння зберігається лише після згоди на статистику. Після відмови відповідні інструменти не завантажуються. Після відкликання вже наданої згоди видаляємо доступні сайту аналітичні cookie й оновлюємо сторінку, щоб зупинити завантажені інструменти. Cookie сторонніх доменів можна видалити через налаштування браузера.</p><p id="cookie-preferences"><strong>Керування cookie та згодою:</strong> <button type="button" data-open-cookie-settings>Відкрити налаштування cookie</button>. Ви можете дозволити статистику та запис взаємодій окремо або залишити лише необхідні функції. Вибір можна змінити в будь-який час.</p></section>
  <section id="recipients"><h2>6. Кому можуть передаватися дані</h2><p>Доступ до даних отримують лише особи та постачальники, яким вони потрібні для відповідної мети. Це може включати:</p><ul><li>постачальника серверного хостингу Hetzner, який обслуговує сайт і може обробляти технічні запити та журнали безпеки;</li><li>Google як постачальника Google Tag Manager і Google Analytics 4, якщо відвідувач надав згоду на статистику;</li><li>Microsoft як постачальника Clarity, якщо відвідувач надав згоду на запис взаємодій;</li><li>сервіс приймання заявок, CRM, поштовий або інший технічний сервіс, якщо його підключено для доставки звернень;</li><li>провайдера вебшрифтів Google Fonts, ресурси якого запитуються браузером для відображення шрифтів;</li><li>платіжний провайдер, якщо оплата відбувається через його окрему захищену сторінку;</li><li>державні органи, суди або професійних радників, коли передача вимагається законом або необхідна для захисту законних прав.</li></ul><p>Сайт передає заявку на сервер лише після її надсилання. Якщо сервіс приймання заявок не налаштований або тимчасово недоступний, сайт повідомляє про помилку і не показує, що заявку отримано. Сайт не зберігає подані заявки у власній файловій базі. Фактичний одержувач заявки залежить від налаштувань сервісу приймання.</p><p>Постачальники обробляють дані для надання відповідної послуги. Коли список конкретних одержувачів або сервісів змінюється, ми оновлюємо цю політику.</p></section>
  <section id="transfers"><h2>7. Обробка за межами України</h2><p>Деякі технічні постачальники, зокрема Google, Microsoft і Hetzner, можуть обробляти технічні дані на інфраструктурі в інших країнах. Місце обробки залежить від постачальника та конфігурації сервісу. У разі міжнародної передачі застосовуються умови відповідного постачальника та вимоги законодавства про захист персональних даних. Якщо для доставки заявок буде підключено конкретну CRM чи інший сервіс, його потрібно вказати тут окремо.</p></section>
  <section id="retention"><h2>8. Строки зберігання</h2><p>Зберігаємо дані не довше, ніж потрібно для відповіді на звернення, виконання договору, ведення обов’язкового обліку, захисту прав або безпеки сервісу. Строк залежить від категорії даних і правової підстави. Дані в локальному сховищі чекліста залишаються у браузері до їх видалення користувачем або очищення сховища браузера. Вибір cookie діє до 180 днів, після чого ми запитуємо його знову. Старий вибір, який стосувався лише Clarity, не надає згоди на нові категорії, тому після оновлення вікна запитуємо його повторно.</p><p>Після завершення мети обробки дані видаляються або знеособлюються, крім випадків, коли закон вимагає зберігати їх довше. Якщо заявку передано зовнішньому сервісу, строк зберігання в ньому також залежить від його налаштувань і договору з оператором. Строк зберігання записів та аналітики в Microsoft Clarity визначається налаштуваннями проєкту й умовами постачальника.</p></section>
  <section id="rights"><h2>9. Ваші права</h2><p>Відповідно до Закону України «Про захист персональних даних» ви можете:</p><ul><li>дізнатися, чи обробляються ваші дані, отримати інформацію про мету, підстави, джерела та одержувачів;</li><li>отримати доступ до своїх даних і попросити виправити неточні або застарілі відомості;</li><li>заперечити проти обробки або попросити її обмежити у випадках, передбачених законом;</li><li>попросити видалити дані, якщо вони обробляються незаконно або більше не потрібні для заявленої мети;</li><li>відкликати згоду. Це не скасовує обробку, яка до відкликання ґрунтувалася на згоді, та не впливає на обробку з іншою законною підставою;</li><li>подати скаргу Уповноваженому Верховної Ради України з прав людини або звернутися до суду.</li></ul><p>Щоб скористатися цими правами, зверніться телефоном за номером <a href="tel:+380939082254">+380 93 908 22 54</a> або в <a href="https://t.me/tripailo_ads" rel="noopener noreferrer">Telegram</a>. Ми розглянемо звернення у строки та порядку, встановлені законодавством.</p></section>
  <section id="product"><h2>10. Дані гостей у VDALO</h2><p>Коли готель використовує VDALO для роботи з даними гостей, готель визначає цілі та підстави такої обробки, повідомляє гостей і забезпечує законність використання їхніх даних. Роль VDALO та обсяг обробки залежать від конкретної функції, налаштувань і договору з готелем. Якщо VDALO обробляє такі дані за дорученням готелю, порядок, категорії даних, заходи безпеки, строки зберігання та залучені підрядники мають бути визначені окремою угодою про обробку даних.</p><p>Якщо в сервісі активовано функції на основі штучного інтелекту, вони можуть формувати чернетки відповідей або класифікувати звернення. Результат може бути неповним чи неточним і має перевірятися командою готелю. Не передавайте в такі функції чутливі дані, якщо це не погоджено для конкретної функції та не має належної правової підстави.</p></section>
  <section id="security"><h2>11. Захист даних</h2><p>Застосовуємо технічні та організаційні заходи для захисту від несанкціонованого доступу, втрати, зміни чи розкриття даних. Доступ надається за потребою для роботи. Жоден спосіб передавання або зберігання даних не може гарантувати абсолютну безпеку, тому не надсилайте через сайт паролі, коди підтвердження чи секрети інтеграцій.</p></section>
  <section id="changes"><h2>12. Зміни до політики</h2><p>Ми можемо оновлювати політику, якщо змінюється сайт, сервіс, постачальники або законодавство. Актуальна редакція публікується на цій сторінці із зазначенням дати.</p><p>Правова основа: <a href="https://zakon.rada.gov.ua/laws/show/2297-17#Text" rel="noopener noreferrer">Закон України «Про захист персональних даних»</a>.</p><p>Умови замовлення, оплати, отримання доступу й повернення коштів описані в <a href="/offer">публічній оферті</a> та <a href="/refunds">правилах повернення коштів</a>.</p></section>
 </main>`;
 let html=renderPage({full:false,origin:canonicalOrigin}).replace(/<main id="main">[\s\S]*?<\/main>/,content);
 html=html.replace(/<title>[\s\S]*?<\/title>/,'<title>Політика конфіденційності | VDALO</title>')
  .replace(/<meta name="description" content="[^"]*">/,'<meta name="description" content="Дізнайтеся, як VDALO обробляє персональні дані на сайті, у формах звернення та інструментах, кому може їх передавати і як реалізувати свої права.">')
  .replace(/<meta name="robots" content="[^"]*">/,'<meta name="robots" content="index,follow">')
  .replace(/<link rel="canonical" href="[^"]*">/,`<link rel="canonical" href="${canonicalOrigin}/privacy">`)
  .replace(/<meta property="og:title" content="[^"]*">/,'<meta property="og:title" content="Політика конфіденційності | VDALO">')
  .replace(/<meta property="og:description" content="[^"]*">/,'<meta property="og:description" content="Як VDALO обробляє персональні дані на сайті та як ви можете реалізувати свої права.">')
  .replace(/<meta property="og:url" content="[^"]*">/,`<meta property="og:url" content="${canonicalOrigin}/privacy">`)
  .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/,`<script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'WebPage','name':'Політика конфіденційності VDALO','inLanguage':'uk','url':`${canonicalOrigin}/privacy`})}</script>`);
 return html;
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
  if(!/^\/(assets\/[a-zA-Z0-9_.-]+|integration-channels\.css|refinement\.css|polish\.css|styles\.css|design-system-2\.css|site-config\.js|pricing-core\.js|pricing\.js|app\.js|living-hotel\.(css|js))$/.test(pathname)) return send(res,404,'Сторінку не знайдено.','text/plain; charset=utf-8');
  const filename=path.join(root,'public',pathname.slice(1));
  const data=await readFile(filename);
  res.writeHead(200,{'Content-Type':mime[path.extname(filename)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':process.env.NODE_ENV==='production'?'public, max-age=300':'no-store'});
  res.end(req.method==='HEAD'?undefined:data);
 } catch(error) { if(error?.code==='ENOENT')return send(res,404,'Сторінку не знайдено.','text/plain; charset=utf-8'); console.error('VDALO v1 request failed:',error); send(res,500,{ok:false,message:'Внутрішня помилка сервера.'}); }
});
if ((process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url))) server.listen(port,host,()=>console.log(`VDALO server started`));
export { server, privacyPage };
