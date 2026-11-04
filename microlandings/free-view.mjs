const moduleInfo = {
  calendar: ['Шахматка бронювань', 'Бачте зайняті й вільні номери на потрібні дати та ведіть бронювання в одному календарі.'],
  guests: ['Картки гостей', 'Зберігайте контакти, побажання та історію проживання гостей.'],
  tax: ['Туристичний збір', 'Налаштовуйте ставку громади та враховуйте пільги під час розрахунку збору.'],
  housekeeping: ['Прибирання та підготовка номера', 'Переглядайте стан номерів і черговість їх підготовки.'],
  rates: ['Сезони й базові тарифи', 'Налаштовуйте базові ціни на дати, вихідні та сезони.'],
  booking: ['Віджет бронювання на сайт', 'Дайте гостям можливість обрати доступний варіант і надіслати бронювання з вашого сайту.'],
  reports: ['Базові звіти й аналітика', 'Переглядайте дані про завантаження, дохід і гостей.']
};

const paidModules = [
  ['Керування каналами продажу', 'Синхронізація з підключеними платформами бронювання.', '590 грн/місяць'],
  ['Онлайн-заселення', 'Збір даних гостя перед заїздом.', '490 грн/місяць'],
  ['Фінансовий облік', 'Облік оплат, витрат і боргів гостей.', '390 грн/місяць'],
  ['Розширені звіти', 'Детальніша аналітика за каналами й періодами.', '290 грн/місяць'],
  ['Завдання команди', 'Доручення для адміністраторів і працівників.', '290 грн/місяць'],
  ['Кіоск для гостей', 'Екран самообслуговування на рецепції.', '990 грн/місяць']
];

const icons = {
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18M7 14h3m4 0h3m-10 4h3"/>',
  guests: '<circle cx="9" cy="8" r="3"/><path d="M3.5 20v-2a5.5 5.5 0 0 1 11 0v2M16 5.5a3 3 0 0 1 0 5.8M17 14a5 5 0 0 1 3.5 4.8V20"/>',
  tax: '<path d="M13 3v18M17 6H9a3 3 0 0 0 0 6h6a3 3 0 0 1 0 6H7M5 9h14M5 15h14"/>',
  housekeeping: '<path d="m4 20 8-8m-2-6 4 4m1-6 5 5-3 3-5-5zM3 21l4-1-3-3z"/>',
  rates: '<path d="M4 19V5m0 14h16M7 15l4-4 3 2 5-6m-3 0h3v3"/>',
  booking: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 8h18m-10 4 5 3-2 1 1 3-2 1-1-3-2 1z"/>',
  reports: '<path d="M5 3h10l4 4v14H5zM14 3v5h5M8 12h8M8 16h8"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  check: '<path d="m5 12 4 4L19 6"/>'
};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cta = (label, location) => `<a class="free-cta" href="#free-form" data-free-cta="${location}">${esc(label)} ${icon('arrow')}</a>`;

const previewCopy = {
  a: ['Ваш календар', 'Бронювання та вільні дати'],
  b: ['Базовий план', 'Почніть із потрібного'],
  c: ['Туристичний збір', 'Дані поруч із бронюванням'],
  d: ['Пряме бронювання', 'Від сайту до календаря'],
  e: ['Щоденні процеси', 'Усе важливе поруч']
};

function renderPreview(key) {
  const [title, subtitle] = previewCopy[key];
  let body;
  if (key === 'b') {
    body = `<div class="free-preview-plan"><span>БАЗОВИЙ ПЛАН</span><strong>0 <small>грн</small></strong><p>для об’єктів до 10 номерів</p></div><div class="free-preview-chips"><span>Календар</span><span>Гості</span><span>Звіти</span></div>`;
  } else if (key === 'c') {
    body = `<div class="free-preview-rows"><div><span class="free-preview-symbol">${icon('tax')}</span><span><strong>Правила збору</strong><small>Ставка вашої громади</small></span></div><div><span class="free-preview-symbol">${icon('guests')}</span><span><strong>Дані проживання</strong><small>Гості й ночі в бронюванні</small></span></div><div><span class="free-preview-symbol">${icon('reports')}</span><span><strong>Підсумки</strong><small>Для подальшої звірки</small></span></div></div>`;
  } else if (key === 'd') {
    body = `<div class="free-preview-path"><div><span>01</span><strong>Ваш сайт</strong><small>Гість знаходить об’єкт</small></div><i aria-hidden="true">↓</i><div><span>02</span><strong>Форма бронювання</strong><small>Гість надсилає бронювання</small></div><i aria-hidden="true">↓</i><div><span>03</span><strong>Календар VDALO</strong><small>Дані поруч з іншими бронюваннями</small></div></div>`;
  } else {
    body = `<div class="free-preview-calendar"><div class="free-calendar-days"><span>НОМЕР</span><span>ПН</span><span>ВТ</span><span>СР</span><span>ЧТ</span><span>ПТ</span></div><div class="free-calendar-line"><strong>01</strong><div><span class="calendar-bar bar-pink">Бронювання</span></div></div><div class="free-calendar-line"><strong>02</strong><div><span class="calendar-bar bar-light">Гість · 2 ночі</span></div></div><div class="free-calendar-line"><strong>03</strong><div><span class="calendar-bar bar-plum">Бронювання</span></div></div></div><div class="free-preview-chips"><span>Календар</span><span>Гості</span><span>Статуси</span></div>`;
  }
  return `<figure class="free-visual"><div class="free-preview-shell"><div class="free-preview-top"><span class="free-preview-brand">V</span><span>РОБОЧИЙ ПРОСТІР</span><span class="free-preview-dots" aria-hidden="true">•••</span></div><div class="free-preview-content"><div class="free-preview-heading"><div><small>VDALO</small><strong>${esc(title)}</strong></div><span class="free-preview-indicator" aria-hidden="true"></span></div><p class="free-preview-subtitle">${esc(subtitle)}</p>${body}</div></div><figcaption>Ілюстрація можливостей, не скриншот системи</figcaption></figure>`;
}

export function renderFreePage(v, key, indexable, offerId, ready) {
  const modules = v.modules.map(id => `<article class="free-module"><span class="free-module-icon">${icon(id)}</span><div><h3>${esc(moduleInfo[id][0])}</h3><p>${esc(moduleInfo[id][1])}</p></div></article>`).join('');
  const faqs = [
    ['Що коштує 0 грн?', 'Базовий план VDALO Free коштує 0 грн для об’єктів до 10 номерів включно. Додаткові модулі оплачуються окремо, якщо ви їх оберете.'],
    ['Як підключити канали бронювання?', 'Для синхронізації каналів продажу є окремий платний модуль. Без нього бронювання з різних джерел можна вносити в календар вручну.'],
    ['Чи підійде VDALO для великого готелю або кемпінгу?', 'Так. VDALO підходить для готелів, апартаментів, садиб, кемпінгів і глемпінгів. Для об’єктів від 11 номерів діють платні тарифи; додаткові модулі обираються окремо.'],
    ['Як отримати доступ?', 'Залиште заявку. Команда VDALO уточнить дані об’єкта та розповість про наступні кроки підключення.'],
    ...v.faq
  ];
  const faqHtml = faqs.map(([question, answer], i) => `<details class="free-faq-item" data-faq="${i + 1}"><summary>${esc(question)}<span aria-hidden="true">+</span></summary><p>${esc(answer)}</p></details>`).join('');
  const config = JSON.stringify({variant:key, offerId, endpoint:'/api/funnel/leads'}).replaceAll('<', '\\u003c');

  return `<!doctype html>
<html lang="uk"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(v.title)}</title><meta name="description" content="${esc(v.description)}">
<meta name="robots" content="${indexable ? 'noindex,follow' : 'noindex,nofollow'}">
<link rel="canonical" href="https://www.vdalo.tech/free"><meta name="theme-color" content="#321d35">
<link rel="stylesheet" href="/free-assets/free.css?v=5"><script src="/free-assets/free.js?v=4" defer></script>
</head>
<body class="free-page" data-variant="${key}">
<a class="free-skip" href="#free-main">Перейти до змісту</a>
<header class="free-header"><a href="/" aria-label="VDALO, головна"><img src="/v1/assets/vdalo-canonical-496.png?v=2" width="150" height="50" alt="VDALO"></a><span>Система для об’єктів<br>гостинності</span></header>
<main id="free-main">
<section class="free-hero"><div class="free-wrap free-hero-grid">
<div class="free-hero-copy">
<p class="free-eyebrow">${esc(v.eyebrow)}</p>
<p class="free-badge"><span aria-hidden="true">✦</span> 0 грн · до 10 номерів включно</p>
<h1>${esc(v.h1)}</h1><p class="free-lead">${esc(v.lead)}</p>
<ul class="free-points">${v.points.map(item => `<li><span>${icon('check')}</span>${esc(item)}</li>`).join('')}</ul>
<div class="free-actions">${cta('Залишити заявку на Free','hero')}<a class="free-secondary" href="#free-form" data-free-callback>Потрібна допомога з налаштуванням</a></div>
<p class="free-note">Додаткові модулі підключаються окремо.</p>
</div>
${renderPreview(key)}
</div></section>
<section class="free-section free-pain"><div class="free-wrap">
<div class="free-section-head"><p class="free-eyebrow">${key === 'b' ? 'ПРОСТО ПОЧАТИ' : 'ЗНАЙОМА СИТУАЦІЯ?'}</p><h2>${esc(v.painTitle)}</h2></div>
<div class="free-pain-grid">${v.pains.map((pain,i) => `<article><span>0${i+1}</span><p>${esc(pain)}</p></article>`).join('')}</div>
</div></section>
<section class="free-section free-process" id="free-process"><div class="free-wrap">
<div class="free-section-head"><p class="free-eyebrow">КІЛЬКА ЗРОЗУМІЛИХ КРОКІВ</p><h2>${esc(v.processTitle)}</h2></div>
<ol class="free-steps">${v.steps.map(([title,copy],i) => `<li><span>0${i+1}</span><div><h3>${esc(title)}</h3><p>${esc(copy)}</p></div></li>`).join('')}</ol>
<div class="free-process-action">${cta('Обговорити підключення','process')}</div>
</div></section>
<section class="free-section free-modules"><div class="free-wrap">
<div class="free-section-head"><p class="free-eyebrow">VDALO FREE · ДО 10 НОМЕРІВ ВКЛЮЧНО</p><h2>Сім інструментів для щоденної роботи</h2><p>Базові можливості плану Free коштують 0 грн для об’єктів до 10 номерів включно.</p></div>
<div class="free-modules-grid">${modules}</div>
</div></section>
<section class="free-section free-pricing"><div class="free-wrap">
<div class="free-section-head"><p class="free-eyebrow">БІЛЬШЕ МОЖЛИВОСТЕЙ</p><h2>Додавайте модулі, коли вони потрібні</h2><p>Free дає базові інструменти. Додаткові модулі оплачуються окремо та допомагають розширити роботу з VDALO.</p></div>
<div class="free-price-list">${paidModules.map(([name,copy,price]) => `<article><div><h3>${esc(name)}</h3><p>${esc(copy)}</p></div><strong>${esc(price)}</strong></article>`).join('')}</div>
<p class="free-pricing-note">Для об’єктів від 11 номерів діють платні тарифи. Платні тарифи й додаткові модулі також можна обрати окремо. <a href="/pricing">Переглянути тарифи VDALO</a>.</p>
</div></section>
<section class="free-section free-story"><div class="free-wrap free-story-card">
<div class="free-story-mark" aria-hidden="true">V</div><div><p class="free-eyebrow">ВДАЛО ДЛЯ ВАШОГО МАСШТАБУ</p><h2>Система для різних об’єктів гостинності</h2><p>VDALO підходить для готелів, садиб, апартаментів, кемпінгів і глемпінгів. Об’єкти до 10 номерів включно можуть почати з безкоштовного базового плану. Для більших об’єктів є платні тарифи й додаткові модулі.</p><p class="free-story-caption">Почніть із потрібного сьогодні та розширюйте можливості за потреби.</p></div>
</div></section>
<section class="free-section free-faq"><div class="free-wrap free-faq-layout">
<div class="free-section-head"><p class="free-eyebrow">ПОШИРЕНІ ПИТАННЯ</p><h2>Перед тим як залишити заявку</h2></div><div>${faqHtml}</div>
</div></section>
<section class="free-section free-form-section" id="free-form"><div class="free-wrap free-form-grid">
<div class="free-form-intro"><p class="free-eyebrow">НАСТУПНИЙ КРОК</p><h2>${esc(v.final)}</h2><p>Залиште заявку, щоб отримати доступ до VDALO. Команда уточнить деталі об’єкта та розповість про підключення.</p><p class="free-form-reassurance">Для об’єктів до 10 номерів включно базовий план Free коштує 0 грн. Платні можливості обговорюються окремо.</p><p class="free-intent-note" id="free-intent" role="status" hidden>Ви обрали допомогу з налаштуванням. Розповімо про неї під час зв’язку.</p></div>
<div class="free-form-card">
${ready ? '' : '<div class="free-availability" role="status"><strong>Приймання заявок зараз не налаштоване.</strong><p>Щоб зв’язатися з командою, скористайтеся <a href="/contact">сторінкою контактів</a>.</p></div>'}
<form id="free-lead-form" method="post" action="/api/funnel/leads" data-offer="free" novalidate>
<div class="free-form-heading"><strong>Заявка на підключення</strong><span>Усі поля, крім часу дзвінка, обов’язкові.</span></div>
<fieldset class="free-form-fields"${ready ? '' : ' disabled'}>
<div class="free-fields">
<div class="free-field"><label for="free-name">Ваше ім’я</label><input id="free-name" name="name" autocomplete="name" minlength="2" maxlength="100" aria-describedby="free-name-error" required><p class="free-field-error" id="free-name-error"></p></div>
<div class="free-field"><label for="free-property">Назва об’єкта</label><input id="free-property" name="property" autocomplete="organization" minlength="2" maxlength="150" aria-describedby="free-property-error" required><p class="free-field-error" id="free-property-error"></p></div>
<div class="free-field"><label for="free-type">Тип об’єкта</label><select id="free-type" name="property_type" aria-describedby="free-type-error" required><option value="">Оберіть тип</option><option value="guesthouse">Садиба або гостьовий будинок</option><option value="hotel">Готель або мініготель</option><option value="apartments">Апартаменти</option><option value="resort">Котеджі, глемпінг або кемпінг</option><option value="hostel">Хостел</option><option value="other">Інше</option></select><p class="free-field-error" id="free-type-error"></p></div>
<div class="free-field"><label for="free-rooms">Кількість номерів або юнітів</label><input id="free-rooms" name="rooms" type="number" min="1" max="99999" inputmode="numeric" aria-describedby="free-rooms-error free-big-note" required><p class="free-field-error" id="free-rooms-error"></p><p class="free-big-note" id="free-big-note" role="status" hidden>Для об’єктів від 11 номерів діють платні тарифи. Команда допоможе з вибором. <a href="/pricing">Тарифи VDALO</a>.</p></div>
<div class="free-field"><label for="free-phone">Телефон</label><input id="free-phone" name="contact" type="tel" inputmode="tel" autocomplete="tel" maxlength="40" placeholder="+380 __ ___ __ __" aria-describedby="free-phone-error" required><p class="free-field-error" id="free-phone-error"></p></div>
<div class="free-field"><label for="free-callback-time">Коли зручно поговорити? <span>необов’язково</span></label><select id="free-callback-time" name="callback_time"><option value="any">У зручний час</option><option value="today">Сьогодні</option><option value="evening">Сьогодні ввечері</option><option value="tomorrow">Завтра зранку</option></select></div>
</div>
<label class="free-consent"><input id="free-consent" name="consent" type="checkbox" aria-describedby="free-consent-error" required><span>Погоджуюся на використання контактів, щоб VDALO могла відповісти на мій запит. <a href="/privacy">Політика конфіденційності</a>.</span></label>
<p class="free-field-error" id="free-consent-error"></p>
<input name="website" type="text" tabindex="-1" autocomplete="off" aria-hidden="true" class="free-honey">
<p class="free-form-error" id="free-error" role="alert" aria-live="polite"></p>
<button type="submit" class="free-cta"${ready ? '' : ' disabled'}><span class="free-submit-label">Надіслати заявку</span> ${icon('arrow')}</button>
${ready ? '<p class="free-form-foot">Відповідь на заявку залежить від графіка команди.</p>' : ''}
</fieldset>
</form>
<div class="free-success" id="free-success" role="status" tabindex="-1" hidden><span class="free-success-icon">${icon('check')}</span><h3>Дякуємо за заявку!</h3><p id="free-status"></p></div>
</div>
</div></section>
<section class="free-related"><div class="free-wrap"><p>Дізнайтеся більше про роботу VDALO:</p><a href="/hotel-automation">Автоматизація готелю</a><a href="/tourist-tax/">Туристичний збір</a><a href="/pricing">Тарифи</a></div></section>
</main>
<footer class="free-footer"><div class="free-wrap"><a href="/" aria-label="VDALO, головна"><img src="/v1/assets/vdalo-canonical-496.png?v=2" width="120" height="40" alt="VDALO"></a><a href="/privacy">Політика конфіденційності</a></div></footer>
<a class="free-sticky-cta" href="#free-form" data-free-cta="sticky" hidden>Залишити заявку ${icon('arrow')}</a>
<script type="application/json" id="free-config">${config}</script>
</body></html>`;
}
