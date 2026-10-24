import {calendar,homepageSections} from './experience.mjs';
import {renderPricing} from './pricing.mjs';
import {icon} from './ui.mjs';
import {assetUrl} from './assets.mjs';
import {renderHomepageGuide} from './homepage-guide.mjs';
import {elements,hasClass,replaceInner,editElements} from './content-revisions/html-fragments.mjs';

const request=(location)=>`<button type="button" class="home-button" data-open="audit" data-location="home-${location}" data-interest="Демонстрація VDALO для мого об’єкта">Замовити демо ${icon('arrow')}</button>`;
const picture=(file,alt,extra='')=>`<img src="${assetUrl(file)}" alt="${alt}" loading="lazy" decoding="async" ${extra}>`;
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

function demonstration(){
 return `<section class="home-section home-demo" id="demo" aria-labelledby="home-demo-title"><div class="home-wrap"><div class="home-demo-copy"><h2 id="home-demo-title">Ваш робочий день у VDALO</h2><p>Візьміть одну типову ситуацію свого готелю. Покажемо її в системі та розберемо потрібні налаштування.</p>${request('demo')}<p class="home-note">Залиште контакт у формі. Менеджер погодить із вами демонстрацію.</p></div><div class="home-demo-agenda"><h3>Що перевіримо разом</h3><ul><li>${icon('calendar')}<span><strong>Бронювання</strong>Додамо запис, змінимо дати й перевіримо доступність.</span></li><li>${icon('room-ready')}<span><strong>Готовність номера</strong>Пройдемо дії рецепції та команди перед заїздом.</span></li><li>${icon('channels')}<span><strong>Ваші підключення</strong>Уточнимо канали продажу й потрібний спосіб обміну.</span></li><li>${icon('receipt')}<span><strong>Вартість запуску</strong>Підберемо тариф і погодимо склад налаштувань.</span></li></ul></div><div class="home-trial"><strong>14 днів тестування без картки</strong><p>Після підтвердження запиту надішлемо посилання на реєстрацію. Тест починається зі створення акаунта. Для продовження після тесту потрібна оплата тарифу.</p></div></div></section>`;
}

function restoreSection(html,heading){
 // The legacy founder fragment has an extra closing div. Keep it from closing
 // the homepage scope before the remaining sections and guide.
 if(html.includes('id="author"'))html=html.replace('</div></div></div></section>','</div></div></section>')
  .replace(/(<a class="author-link"[\s\S]*?<\/a>)(<a class="button outline"[\s\S]*?<\/a>)/,'<div class="home-author-actions">$1$2</div>');
 html=editElements(html,n=>hasClass(n,'eyebrow'),()=> '');
 html=editElements(html,n=>hasClass(n,'integration-hub-label')||(n.tag==='span'&&hasClass(n.parent??{attrs:{}},'direct-booking-engine')),()=> '');
 if(heading){const h=elements(html).find(n=>n.tag==='h2');if(h)html=replaceInner(html,h,heading);}
 html=html.replace(/Понад 60 сервісів уже підключені й працюють із VDALO. Набір даних може відрізнятися між інтеграціями./g,'Сумісність каналів і набір даних перевіряємо для вашого об’єкта до підключення.')
 .replace(/Понад 60 інтегрованих сервісів VDALO/g,'Приклади каналів для перевірки сумісності')
 .replace(/Понад 60 сервісів/g,'Потрібні підключення').replace(/понад 60 сервісів/gi,'потрібні сервіси')
 .replace(/ПІДКЛЮЧЕНІ СЕРВІСИ/g,'ПРИКЛАДИ КАНАЛІВ').replace(/Бронювання та оплата/g,'Запит на бронювання')
 .replace('Бронювання на сайті та оплата','Бронювання на сайті')
 .replace('Повідомлення та чат-помічник','Повідомлення гостям')
 .replace('Усе під контролем, поки ви займаєтесь іншим.','Важливі й нестандартні ситуації контролює команда.');
 return html.replace('class="section ', 'class="home-restored section ').replaceAll('data-reveal','data-ui');
}

function problems(html){
 const titles=['Броні в різних кабінетах','Документи й збір вручну','Кожен заїзд із нуля','Ті самі запитання','Готовність номера в чатах'];
 const links=['#integrations','/hotel-tourist-tax','#journey','/guest-communication','#roles'];
 const actions=['Об’єднати канали','Автоматизувати облік','Підготувати заїзд','Зібрати інформацію гостя','Узгодити роботу команди'];
 const icons=['channels','receipt','key','message','housekeeping'];
 const restored=restoreSection(html,'П’ять щоденних проблем');
 const cards=elements(restored).filter(n=>hasClass(n,'problem-card-copy'));
 return editElements(restored,n=>hasClass(n,'problem-card-copy'),(body,node)=>{
  const i=cards.findIndex(card=>card.start===node.start);
  const p=elements(body).filter(n=>n.tag==='p').at(-1);
  return '<div class="problem-card-copy"><div class="home-problem-title">'+icon(icons[i])+'<h3>'+titles[i]+'</h3></div>'+ (p?body.slice(p.start,p.end):'')+'<a class="home-text-link" href="'+links[i]+'">'+actions[i]+'</a></div>';
 });
}

function trialOffer(){
 return `<dialog id="home-trial-offer" class="home-trial-offer" aria-labelledby="home-trial-offer-title" aria-describedby="home-trial-offer-copy"><button type="button" class="home-offer-close" data-home-offer-dismiss aria-label="Закрити пропозицію" autofocus><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.65" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button><h2 id="home-trial-offer-title">Спробуйте VDALO 14 днів</h2><p id="home-trial-offer-copy">Перевірте бронювання, заїзди й роботу команди на задачах свого готелю.</p><button type="button" class="home-button" data-home-offer-start data-open="audit" data-location="home-timed-trial" data-interest="14 днів тестування VDALO для мого готелю">Залишити заявку на тест ${icon('arrow')}</button><p class="home-offer-note">Без банківської картки. Команда зв’яжеться з вами та погодить початок тестування.</p><button type="button" class="home-offer-later" data-home-offer-dismiss>Продовжити перегляд</button></dialog>`;
}

export function renderHomepage({featureVisual,night}){
 const blocks=homepageSections(featureVisual);
 return `<div class="homepage-2026" data-homepage="compact-v1" data-home-revision="visual-polish-v6"><section class="home-hero" aria-labelledby="home-title"><div class="home-wrap home-hero-grid"><div class="home-hero-copy"><h1 id="home-title">Менше рутини.<br>Більше контролю.</h1><p class="home-lead">Система керування готелем VDALO об’єднує бронювання, дані гостей і готовність номерів. Команда бачить актуальну інформацію та знає, що робити далі.</p><div class="home-hero-actions">${request('hero')}<a class="home-text-link" href="#pms">Спробувати календар</a></div><p class="home-note home-hero-trial"><strong>14 днів тестування без картки.</strong><br>Залиште заявку. Покажемо систему й погодимо доступ.</p></div><figure class="home-hero-media home-hero-room"><div class="home-room-cut"><img src="${assetUrl('hero-hotel.webp')}" alt="Готельний номер із вікном на місто в теплому вечірньому світлі" width="1122" height="1402" fetchpriority="high" decoding="async"></div><figcaption>Більше уваги гостям. Більше порядку в роботі.</figcaption></figure></div><nav class="home-quicklinks home-wrap" aria-label="Основні можливості"><a href="#pms">${icon('calendar')}Бронювання</a><a href="#features">${icon('handoff')}Можливості</a><a href="#integrations">${icon('channels')}Канали продажу</a><a href="#pricing">${icon('receipt')}Тарифи</a></nav></section>
 <div class="home-night" data-ui><p class="home-simulation-note">Інтерактивний приклад. Події й суми умовні. Доступність автоматизацій залежить від модулів та налаштувань.</p> ${night}</div> ${problems(blocks.problems)} ${restoreSection(blocks.channels,'Більше каналів.<br>Один центр керування.')} ${restoreSection(blocks.direct,'Прямі бронювання.<br>На ваших умовах.')} ${homeCalendar()} ${restoreSection(blocks.products,'Що вміє VDALO')} ${restoreSection(blocks.roles,'Кожен знає<br>наступний крок')} ${restoreSection(blocks.journey,'Від бронювання<br>до наступного заїзду')} ${restoreSection(blocks.caseStudy,'Заїзд після закриття рецепції')} ${pricing()} ${restoreSection(blocks.founder,'Знаємо роботу готелю зсередини')} ${restoreSection(blocks.approach,'Спочатку процес.<br>Потім інструменти.')} ${start()}<span id="next-step" class="home-anchor" aria-hidden="true"></span>${demonstration()}
 <section class="home-section home-faq" id="faq" aria-labelledby="home-faq-title"><div class="home-wrap"><div><h2 id="home-faq-title">Перед початком</h2><p>Відповіді на головні запитання. Решту розберемо на демонстрації.</p>${picture('hero-hotel.webp','Затишний готельний номер у вечірньому світлі','width="1122" height="1402"')}</div><div class="home-faq-list">${questions.map(([q,a])=>`<details data-faq><summary>${q}${icon('arrow')}</summary><p>${a}</p></details>`).join('')}</div></div></section>
 <section class="home-close" id="audit" aria-labelledby="home-close-title"><div class="home-wrap"><div><h2 id="home-close-title">Почнімо з демо</h2><p>Покажемо, як працювати з вашими бронюваннями, підготувати заїзди й передавати задачі команді.</p></div><div>${request('final')}<p class="home-note">З вами зв’яжеться менеджер VDALO.</p></div></div></section>
 ${renderHomepageGuide(request)}
 ${trialOffer()}
</div>`;
}
