import {calendar} from './experience.mjs';
import {renderPricing} from './pricing.mjs';
import {icon,channelMark} from './ui.mjs';
import {assetUrl} from './assets.mjs';
import {elements,hasClass,replaceInner,editElements} from './content-revisions/html-fragments.mjs';

const request=(location)=>`<button type="button" class="home-button" data-open="audit" data-location="home-${location}" data-interest="Демонстрація VDALO для мого об’єкта">Замовити демо ${icon('arrow')}</button>`;
const picture=(file,alt,extra='')=>`<img src="${assetUrl(file)}" alt="${alt}" loading="lazy" decoding="async" ${extra}>`;
const scenarios=[
 {id:'reception',label:'Рецепція',icon:'calendar',title:'Кожна бронь на своєму місці',copy:'Дати, номер, гість і статус оплати в одному робочому календарі. Команда бачить зміни без пошуку в різних записах.',link:'/hotel-booking-calendar',linkText:'Більше про PMS',image:'hotel-booking-calendar.webp',alt:'Приклад календаря бронювань готелю'},
 {id:'team',label:'Команда',icon:'housekeeping',title:'Номер готовий до гостя',copy:'Передавайте задачі прибирання та оновлюйте готовність номера. Рецепція бачить, що вже можна заселяти.',link:'/hotel-housekeeping',linkText:'Робота з прибиранням',image:'hotel-housekeeping-operations.webp',alt:'Організація підготовки готельного номера'},
 {id:'guest',label:'Гість',icon:'guest',title:'Підготовка ще до заїзду',copy:'Онлайн-анкета допомагає зібрати дані заздалегідь. Інформація про гостя залишається поруч із його бронюванням.',link:'/hotel-check-in',linkText:'Онлайн-заселення',image:'hotel-online-check-in.webp',alt:'Попередня онлайн-реєстрація гостя'},
 {id:'owner',label:'Власник',icon:'chart',title:'Картина роботи готелю',copy:'Переглядайте завантаження й результати бронювань. Налаштуйте доступи до інформації відповідно до ролей команди.',link:'/hotel-finance',linkText:'Звіти й аналітика',image:'hotel-workflow-automation.webp',alt:'Організація щоденних процесів готелю'},
];
const questions=[
 ['Для яких об’єктів підходить VDALO?','Для готелів, мініготелів, апартаментів, глемпінгів і комплексів відпочинку. На демонстрації покажемо сценарії з урахуванням номерного фонду та роботи вашої команди.'],
 ['Як почати користуватися?','Залиште заявку. Менеджер уточнить вашу задачу, покаже систему й погодить налаштування. Ви отримаєте зрозумілий наступний крок від нашої команди.'],
 ['Чи можна спочатку спробувати?','Так, доступний тест на 14 днів без банківської картки. Після підтвердження запиту команда надішле посилання на реєстрацію PMS. Відлік починається після створення акаунта. Для продовження після тесту потрібно оплатити тариф.'],
 ['Чи перенесете майбутні бронювання?','Допоможемо погодити перенесення з попередньої системи або таблиці. Перед запуском визначимо склад даних, доступний спосіб імпорту й перевіримо майбутні заїзди. Обсяг і умови робіт погоджуються окремо.'],
 ['Чи працюватимуть мої канали продажу?','Перед підключенням перевіримо потрібні канали, спосіб інтеграції та дані, які вони передають. Керування підтримуваними каналами входить у тарифи від Mini; для Start це окремий модуль.'],
 ['Що з туристичним збором і новими модулями?','Розрахунок туристичного збору та пільги доступні в системі. Ставки й правила перевіряють для громади вашого об’єкта. ПРРО, AI-помічник і частина інших модулів ще в розробці: актуальні статуси зазначені на сторінці тарифів.'],
];

function homeCalendar(){
 let html=calendar();
 const intro=elements(html).find(n=>hasClass(n,'pms-intro'));
 html=replaceInner(html,intro,`<div><h2>Календар бронювань</h2></div><div><p>Оберіть бронь, змініть тиждень або відфільтруйте канал. Спробуйте календар просто тут.</p><p class="home-note">Демонстраційні дані. Ваші бронювання не змінюються.</p></div>`);
 html=editElements(html,n=>hasClass(n,'pms-benefits'),()=> '');
 return html.replace('section pms-section','home-section home-calendar').replace('calendar-shell" data-reveal','calendar-shell" data-ui');
}

function workflows(){
 return `<section class="home-section home-workflows" id="features" aria-labelledby="home-work-title"><div class="home-wrap"><div class="home-section-head"><h2 id="home-work-title">Злагоджена робота</h2><p>Оберіть свою роль. Подивіться, що зміниться у щоденних задачах.</p></div><div class="home-tabs" role="tablist" aria-label="Сценарії роботи в готелі">${scenarios.map((s,i)=>`<button type="button" role="tab" id="home-tab-${s.id}" aria-controls="home-panel-${s.id}" aria-selected="${i===0}" tabindex="${i===0?0:-1}" data-home-tab="${s.id}">${icon(s.icon)}${s.label}</button>`).join('')}</div>${scenarios.map((s,i)=>`<div class="home-work-panel" id="home-panel-${s.id}" role="tabpanel" aria-labelledby="home-tab-${s.id}" tabindex="0" ${i?'hidden':''}><div class="home-work-copy"><h3>${s.title}</h3><p>${s.copy}</p><a class="home-text-link" href="${s.link}">${s.linkText}</a></div><figure class="home-work-picture">${picture(s.image,s.alt,'width="1200" height="800"')}<figcaption>Ілюстрація сценарію. Склад функцій залежить від тарифу.</figcaption></figure></div>`).join('')}<noscript><style>.home-work-panel[hidden]{display:grid!important}.home-tabs{display:none}</style></noscript></div></section>`;
}

function connections(){
 return `<section class="home-connections" id="integrations" aria-labelledby="home-channels-title"><div class="home-wrap"><div><h2 id="home-channels-title">Канали в одному процесі</h2><p>Booking.com, Airbnb, власний сайт і прямі бронювання. Перевіримо сумісність ваших сервісів до запуску.</p><a class="home-text-link" href="/hotel-channel-manager">Як працює синхронізація</a></div><div class="home-channel-marks" aria-label="Приклади каналів бронювання"><span>${channelMark('Booking.com')}</span><span>${channelMark('Airbnb')}</span><span>${icon('website')}Ваш сайт</span><span>${icon('calendar')}Прямі броні</span></div></div></section>`;
}

function start(){
 return `<section class="home-section home-start" id="onboarding" aria-labelledby="home-start-title"><div class="home-wrap"><div class="home-start-picture">${picture('problem-housekeeping-status-768.jpg','Підготовка номера та робота готельної команди','width="768" height="1024"')}</div><div class="home-start-copy"><h2 id="home-start-title">Запускаємо разом</h2><p>Починаємо з вашого готелю та його процесів. Команда VDALO допоможе пройти шлях до роботи в системі.</p><ol class="home-start-steps"><li><strong>Покажемо на ваших задачах</strong><p>Коротка розмова й демонстрація потрібних сценаріїв.</p></li><li><strong>Підготуємо об’єкт</strong><p>Номери, тарифи, майбутні бронювання та погоджені підключення.</p></li><li><strong>Допоможемо команді</strong><p>Розберемо щоденні дії та перевіримо перші робочі сценарії.</p></li></ol><a class="home-text-link" href="/partners">Партнери та інтегратори</a></div></div></section>`;
}

function pricing(){
 // The existing calculator and checkout keep their IDs and handlers. Only the
 // outer section ID changes because the compact summary owns the public anchor.
 let detail=renderPricing().replace('id="pricing"','id="home-pricing-detail"');
 detail=editElements(detail,n=>hasClass(n,'eyebrow'),()=> '');
 detail=detail.replaceAll('Підключення без оплати','Умови підключення погодимо окремо');
 return `<section class="home-section home-pricing" id="pricing" aria-labelledby="home-price-title"><div class="home-wrap"><div class="home-price-summary"><div><h2 id="home-price-title">Тариф під ваш готель</h2><p>Кількість номерів і потрібні модулі визначають вартість. Почніть із базових процесів і додавайте решту за потреби.</p><a class="home-text-link" href="/pricing">Усі тарифи та умови</a></div><div class="home-price-figure"><p>Start, до 8 номерів</p><p class="home-price-number">${globalThis.VDALO_PRICING.plans.start.monthly.toLocaleString('uk-UA')} <span>грн/міс</span></p><p>Календар, гості, тарифи, прибирання та віджет бронювання. Канали продажу для Start підключаються окремо.</p></div></div><details class="home-price-details"><summary>Розрахувати вартість для мого об’єкта ${icon('arrow')}</summary><div class="home-price-content" data-ui>${detail}</div></details></div></section>`;
}

function people(){
 return `<section class="home-people home-section" id="author" aria-labelledby="home-people-title"><div class="home-wrap"><div class="home-founder">${picture('oleg-stepeniev-profile.jpg','Олег Степенєв, засновник VDALO','width="320" height="400"')}<div><h2 id="home-people-title">Команда поруч</h2><p>Олег Степенєв, засновник VDALO, працює з модульними будинками та готельною нерухомістю. Цей досвід допомагає команді починати з реальних процесів об’єкта.</p><a class="home-text-link" href="/authors/oleh-stepeniev">Познайомитися з Олегом</a></div></div><div class="home-reading"><h3>Подивіться на практиці</h3><a href="/cases">Кейси впровадження ${icon('arrow')}</a><a href="/blog">Поради для готельєрів ${icon('arrow')}</a><a href="/tools/">Інструменти для готелю ${icon('arrow')}</a><a href="/tourist-tax/">Туристичний збір в Україні ${icon('arrow')}</a></div></div></section>`;
}

export function renderHomepage(){
 return `<div class="homepage-2026" data-homepage="compact-v1"><section class="home-hero" aria-labelledby="home-title"><div class="home-wrap home-hero-grid"><div class="home-hero-copy"><h1 id="home-title">Керуйте<br>готелем вдало</h1><p class="home-lead">Система керування готелем: бронювання, гості й робота команди в одному місці.</p><div class="home-hero-actions">${request('hero')}<a class="home-text-link" href="#pms">Спробувати календар</a></div><p class="home-note">Залиште заявку. Покажемо VDALO та допоможемо розпочати роботу.</p></div><figure class="home-hero-media"><picture><source media="(max-width: 600px)" srcset="/v1${assetUrl('home-hospitality-768.jpg')}"><img src="${assetUrl('home-hospitality-1536.jpg')}" alt="Гостинна зустріч гостей у невеликому готелі" width="1536" height="1024" fetchpriority="high" decoding="async"></picture><figcaption>Більше уваги гостям. Більше порядку в роботі.</figcaption><div class="home-arrival" data-ui aria-label="Демонстрація підготовки заїзду"><span>${icon('room-ready')}Приклад заїзду</span><strong>Гість приїжджає о 14:00</strong><span>${icon('check')}Бронювання підтверджено</span><span>${icon('check')}Номер готовий</span></div></figure></div><nav class="home-quicklinks home-wrap" aria-label="Основні можливості"><a href="#pms">${icon('calendar')}Бронювання</a><a href="#features">${icon('handoff')}Команда</a><a href="#integrations">${icon('channels')}Канали продажу</a><a href="#pricing">${icon('receipt')}Тарифи</a></nav></section>
 ${homeCalendar()}${workflows()}${connections()}${start()}${pricing()}${people()}
 <section class="home-section home-faq" id="faq" aria-labelledby="home-faq-title"><div class="home-wrap"><div><h2 id="home-faq-title">Перед початком</h2><p>Відповіді на головні запитання. Решту розберемо на демонстрації.</p>${picture('hero-hotel.webp','Затишний готельний номер у вечірньому світлі','width="1122" height="1402"')}</div><div class="home-faq-list">${questions.map(([q,a])=>`<details data-faq><summary>${q}${icon('arrow')}</summary><p>${a}</p></details>`).join('')}</div></div></section>
 <section class="home-close" id="audit" aria-labelledby="home-close-title"><div class="home-wrap"><div><h2 id="home-close-title">Покажемо VDALO в дії</h2><p>Розкажіть про свій готель. Покажемо потрібні сценарії та погодимо, як розпочати.</p></div><div>${request('final')}<p class="home-note">З вами зв’яжеться менеджер VDALO.</p></div></div></section>
 <div class="home-mobile-action" hidden>${request('mobile')}</div>
 <span id="solutions" class="home-anchor" aria-hidden="true"></span><span id="roles" class="home-anchor" aria-hidden="true"></span><span id="journey" class="home-anchor" aria-hidden="true"></span><span id="unique" class="home-anchor" aria-hidden="true"></span><span id="next-step" class="home-anchor" aria-hidden="true"></span><span id="living-hotel" class="home-anchor" aria-hidden="true"></span></div>`;
}
