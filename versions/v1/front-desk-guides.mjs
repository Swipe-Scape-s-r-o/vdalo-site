import {readFileSync} from 'node:fs';

const definitions=[
 {
  slug:'/blog/group-bookings-rooming-list',
  title:'Групові бронювання та список розселення | VDALO',
  headline:'Групові бронювання в готелі та зразок rooming list',
  description:'Звірте номери, дати, заміни учасників і платників. Завантажте бланк списку розселення із заповненим прикладом.',
  image:'/assets/article-booking-calendar.webp',
  imageAlt:'Ноутбук із ілюстрацією календаря на стійці рецепції готелю',
  file:'group-bookings-rooming-list.md',
  action:['#rooming-list','Завантажити список групи'],
  download:['rooming-list','Бланк для організатора','/downloads/hotel/VDALO_Group_Rooming_List_UA.xlsx','Завантажити список групи (XLSX)','У файлі є порожній бланк і навчальний приклад із частковою зміною дат, заміною учасника та різними платниками.']
 },
 {
  slug:'/blog/hotel-no-show',
  title:'Незаїзд гостя в готелі: порядок дій | VDALO',
  headline:'Незаїзд гостя: порядок дій готелю та облік no-show',
  description:'Як відрізнити незаїзд від запізнення й скасування, зафіксувати рішення рецепції та перевірити доступність номера.',
  image:'/assets/article-prearrival.webp',
  imageAlt:'Готельний номер, картка доступу та екран із підтвердженням проживання',
  file:'hotel-no-show.md',
  action:['/blog/vartist-overbukingu-gotelyu','Переглянути матеріал за темою']
 },
 {
  slug:'/blog/night-front-desk',
  title:'Нічна рецепція готелю: регламент і пізній заїзд | VDALO',
  headline:'Нічна рецепція готелю: регламент і пізній заїзд',
  description:'Організуйте нічне чергування. Порівняйте дії адміністратора й чергового при пізньому заїзді, недоступному номері та проблемі зі входом.',
  image:'/assets/case-night-reception.jpg',
  imageAlt:'Гостя з валізою користується телефоном біля входу в готель уночі',
  imageWidth:1536,
  imageHeight:1024,
  topic:'Операції готелю',
  file:'night-front-desk.md',
  action:['/cases/night-self-checkin-germany','Переглянути кейс пізнього заїзду']
 },
 {
  slug:'/blog/night-audit-hotel',
  title:'Нічний аудит готелю та закриття дня | VDALO',
  headline:'Нічний аудит готелю і закриття операційного дня',
  description:'Звірте проживання, нарахування й оплати за операційний день. Приклад для рецепції, порядок передачі та перевірки розбіжностей.',
  image:'/assets/case-finance-reconciliation.jpg',
  imageAlt:'Документи, калькулятор і ноутбук із таблицею на стійці рецепції',
  imageWidth:1536,
  imageHeight:1024,
  topic:'Операції готелю',
  file:'night-audit-hotel.md',
  action:['/hotel-finance','Переглянути фінансовий облік у VDALO']
 },
 {
  slug:'/blog/hotel-season-preparation',
  title:'Як підготувати готель до високого сезону | VDALO',
  headline:'Як підготувати готель до високого сезону',
  description:'Чекліст на тиждень до сезону: приймання номерів, розклад команди, перші заїзди та продажі. Окремі перевірки для глемпінгу.',
  image:'/assets/article-housekeeping.webp',
  imageAlt:'Працівниця готелю застеляє ліжко під час підготовки номера',
  topic:'Операції готелю',
  file:'hotel-season-preparation.md',
  action:['/blog/channel-manager-perevirky-pered-sezonom','Переглянути технічний чекліст каналів']
 },
 {
  slug:'/blog/hotel-corporate-sales',
  title:'Як готелю продавати проживання компаніям | VDALO',
  headline:'Як готелю продавати проживання компаніям',
  description:'Знайдіть корпоративних клієнтів, підготуйте пропозицію на відрядження й погодьте повторні заїзди. Приклад листа для координатора поїздок.',
  image:'/assets/article-direct-booking.jpg',imageWidth:1536,imageHeight:1024,
  imageAlt:'Ноутбук із календарем бронювань на стійці готелю',
  authorSlug:'kostiantyn-tripailo',topic:'Продажі готелю',
  file:'hotel-corporate-sales.md',
  action:['/hotel-finance','Переглянути фінансовий облік у VDALO']
 },
 {
  slug:'/blog/hotel-channel-mix',
  title:'Як готелю зібрати набір каналів продажу | VDALO',
  headline:'Як готелю зібрати набір каналів продажу',
  description:'Зіставте OTA, сайт, телефон, агентства й корпоративні договори. Два приклади розподілу номероночей для міського готелю та глемпінгу.',
  image:'/assets/article-channel-manager-sync.webp',
  imageAlt:'На екрані ноутбука два календарі бронювань зі знаком синхронізації',
  authorSlug:'kostiantyn-tripailo',topic:'Продажі готелю',
  file:'hotel-channel-mix.md',
  action:['/tools/direct-booking-cost-calculator/','Порахувати витрати за каналом']
 },
 {
  slug:'/blog/hotel-rate-plans',
  title:'Як скласти тарифні плани готелю | VDALO',
  headline:'Як скласти тарифні плани готелю',
  description:'Побудуйте гнучкий тариф, неповоротний варіант і тариф зі сніданком. Перевірте, як зміняться ціни на одній даті.',
  image:'/assets/hotel-software-pricing.webp',imageWidth:1536,imageHeight:1024,
  imageAlt:'Власниця готелю звіряє записи та план приміщень за столом у лаунжі',
  topic:'Ціни й тарифи готелю',
  file:'hotel-rate-plans.md',
  action:['/tools/hotel-rate-calendar/','Відкрити календар тарифів']
 },
 {
  slug:'/blog/hotel-rate-restrictions',
  title:'MinLOS, CTA і CTD на календарі готелю | VDALO',
  headline:'MinLOS, CTA і CTD на календарі готелю',
  description:'Розберіть мінімальну тривалість, закриття заїзду й виїзду на чотирьох запитах. Перевірте доступність до та після зміни правил.',
  image:'/assets/blog-channel-sync-natural.jpg',
  imageAlt:'Адміністраторка звіряє кольоровий календар на ноутбуці й телефоні',
  topic:'Ціни й тарифи готелю',
  file:'hotel-rate-restrictions.md',
  action:['/hotel-revenue-management','Переглянути керування цінами VDALO']
 },
 {
  slug:'/blog/hotel-booking-lead-time',
  title:'Як виміряти вікно бронювання для готелю | VDALO',
  headline:'Як виміряти вікно бронювання для свого готелю',
  description:'Порахуйте дні між створенням бронювання й заїздом. Приклад медіани, розподілу за каналами та бронювань у день прибуття.',
  image:'/assets/journey-booking.webp',imageWidth:1024,imageHeight:1536,
  imageAlt:'Гостя переглядає пропозицію номера на телефоні біля рецепції',
  authorSlug:'kostiantyn-tripailo',topic:'Бронювання й завантаження',
  file:'hotel-booking-lead-time.md',
  action:['/hotel-revenue-management','Переглянути керування продажами VDALO']
 },
 {
  slug:'/blog/hotel-occupancy-forecast',
  title:'Як скласти прогноз завантаження готелю на місяць | VDALO',
  headline:'Як скласти прогноз завантаження готелю на місяць',
  description:'Зведіть доступний фонд, бронювання, очікувані нові ночі й скасування. Модельний місяць із розрахунком і порівнянням прогнозу з фактом.',
  image:'/assets/article-hotel-automation-planning.webp',
  imageAlt:'Працівниця гостьового будинку впорядковує записи на столі',
  topic:'Бронювання й завантаження',
  file:'hotel-occupancy-forecast.md',
  action:['/tools/hotel-pickup-report/','Відкрити шаблон звіту pickup']
 },
 {
  slug:'/blog/hotel-waiting-list',
  title:'Лист очікування в готелі на зайняті дати | VDALO',
  headline:'Як вести лист очікування на зайняті дати',
  description:'Зафіксуйте запит, запропонуйте звільнений номер по черзі й погодьте час відповіді. Приклад двох заявок і повідомлення гостю.',
  image:'/assets/case-evening-reception.jpg',imageWidth:1536,imageHeight:1024,
  imageAlt:'Гостя з валізою стоїть біля входу в готель увечері',
  topic:'Бронювання й завантаження',
  file:'hotel-waiting-list.md',
  action:['/blog/hotel-no-show','Перевірити порядок дій у разі незаїзду']
 },
 {
  slug:'/blog/hotel-one-night-gaps',
  title:'Як продати вільну ніч між бронюваннями | VDALO',
  headline:'Як продати вільну ніч між двома бронюваннями',
  description:'Знайдіть вільну ніч, зіставте внесок від двох цін і перевірте, чи гість бачить потрібні дати на сайті та в каналах продажу.',
  image:'/assets/hotel-booking-calendar.webp',imageWidth:1536,imageHeight:1024,
  imageAlt:'Адміністраторка переглядає ілюстрацію календаря бронювань на ноутбуці в готелі',
  authorSlug:'kostiantyn-tripailo',topic:'Ціни й тарифи готелю',
  file:'hotel-one-night-gaps.md',
  action:['/blog/hotel-rate-restrictions','Перевірити правила заїзду й виїзду']
 },
 {
  slug:'/blog/google-business-profile-hotel',
  title:'Як оформити профіль готелю в Google Картах | VDALO',
  headline:'Як оформити профіль готелю в Google Картах',
  description:'Знайдіть або підтвердьте профіль готелю. Перевірте адресу, телефон, сайт і зручності та звірте зміни в публічній картці.',
  image:'/assets/hero-hotel.webp',imageWidth:1122,imageHeight:1402,
  imageAlt:'Номер готелю з широким вікном і краєвидом на місто',
  authorSlug:'kostiantyn-tripailo',topic:'Продажі готелю',
  file:'google-business-profile-hotel.md',
  action:['/tools/hotel-website-checklist/','Відкрити чекліст сайту готелю']
 },
 {
  slug:'/blog/hotel-guest-reviews',
  title:'Як готелю збирати відгуки після виїзду | VDALO',
  headline:'Як готелю збирати відгуки після виїзду',
  description:'Оберіть момент і канал для запрошення. Три зразки для гостей та приклад, як окремо рахувати переходи й опубліковані відгуки.',
  image:'/assets/hotel-guest-communication.webp',imageWidth:1536,imageHeight:1024,
  imageAlt:'Гостя читає повідомлення на телефоні в лаунжі готелю',
  authorSlug:'kostiantyn-tripailo',topic:'Продажі готелю',
  file:'hotel-guest-reviews.md',
  action:['/tools/hotel-review-response/','Підготувати відповідь на відгук']
 },
 {
  slug:'/blog/hotel-google-booking-links',
  title:'Посилання бронювання готелю в Google | VDALO',
  headline:'Як готелю перевірити посилання бронювання у Google',
  description:'Знайдіть безкоштовне посилання в Google Hotels і звірте сторінку призначення, дати, кількість гостей та кінцеву ціну.',
  image:'/assets/problem-channels.webp',
  imageAlt:'Працівниця готелю звіряє записи й пропозиції номерів на ноутбуці',
  authorSlug:'kostiantyn-tripailo',topic:'Продажі готелю',
  file:'hotel-google-booking-links.md',
  action:['/hotel-direct-booking','Переглянути сценарій прямого бронювання']
 },
 {
  slug:'/blog/hotel-website-conversion',
  title:'Конверсія сайту готелю від пошуку до броні | VDALO',
  headline:'Як виміряти конверсію від пошуку номера до бронювання',
  description:'Побудуйте звіт від пошуку номера до бронювання. Звірте події на двох доменах і відокремте отриману заявку від підтвердженої броні.',
  image:'/assets/vdalo-hotel-team-review.jpg',imageWidth:1536,imageHeight:1024,
  imageAlt:'Двоє працівниць готелю звіряють документи поруч із ноутбуком',
  authorSlug:'kostiantyn-tripailo',topic:'Продажі готелю',
  file:'hotel-website-conversion.md',
  action:['/tools/hotel-website-checklist/','Перевірити сайт за чеклістом']
 },
 {
  slug:'/blog/hotel-spa-upsell',
  title:'Як продавати чан і SPA разом із проживанням | VDALO',
  headline:'Як продавати чан і SPA разом із проживанням',
  description:'Підготуйте пакети для пари й групи. Звірте тривалість, ціну, час підготовки та порядок підтвердження сеансу до заїзду.',
  image:'/assets/case-glamping-services.jpg',imageWidth:1536,imageHeight:1024,
  imageAlt:'Чан і тераса біля глемпінгового будиночка в сутінках',
  authorSlug:'kostiantyn-tripailo',topic:'Продажі готелю',
  file:'hotel-spa-upsell.md',
  action:['/cases/guest-services-glamping','Переглянути кейс із послугами глемпінгу']
 },
 {
  slug:'/blog/hotel-corporate-rates',
  title:'Корпоративні тарифи й бронювання готелю | VDALO',
  headline:'Як вести корпоративні тарифи та бронювання компаній',
  description:'Складіть картку корпоративних умов для рецепції. Приклад ціни, квоти, платника й погодження додаткового номера.',
  image:'/assets/article-pms-migration.jpg',imageWidth:1536,imageHeight:1024,
  imageAlt:'Відкрита таблиця на ноутбуці поруч із записами на столі в готелі',
  authorSlug:'kostiantyn-tripailo',topic:'Продажі готелю',
  file:'hotel-corporate-rates.md',
  action:['/hotel-finance','Переглянути фінансовий облік готелю']
 },
 {
  slug:'/blog/hotel-room-allotment',
  title:'Квоти номерів для партнерів готелю | VDALO',
  headline:'Як готелю вести квоти номерів для партнерів',
  description:'Виділіть фонд за датами, звірте підтвердження й поверніть залишок після дедлайну. Приклад із п’ятьма номерами на три ночі.',
  image:'/assets/hotel-booking-channel-integrations.webp',imageWidth:1536,imageHeight:1024,
  imageAlt:'Працівниця готелю працює за ноутбуком на стійці рецепції',
  topic:'Бронювання й завантаження',
  file:'hotel-room-allotment.md',
  action:['/blog/group-bookings-rooming-list','Підготувати список розселення']
 },
 {
  slug:'/blog/opening-hotel-operations',
  title:'Чекліст запуску готелю до першого заїзду | VDALO',
  headline:'Чекліст операційного запуску готелю до першого заїзду',
  description:'Розподіліть завдання між рецепцією, продажами й господарською службою. Пройдіть тестове бронювання, перенесення номера та закриття зміни.',
  image:'/assets/hotel-management-solutions.webp',imageWidth:1536,imageHeight:1024,
  imageAlt:'Гостя з валізою підходить до стійки рецепції готелю',
  topic:'Операції готелю',
  file:'opening-hotel-operations.md',
  action:['/tools/pms-checklist/','Відкрити чекліст PMS для готелю']
 }
];

export const frontDeskGuides=definitions.map(({file,...article})=>{
 const body=readFileSync(new URL(`./content/front-desk-guides/${file}`,import.meta.url),'utf8');
 const minutes=Math.max(1,Math.ceil(body.trim().split(/\s+/u).length/200));
 return {imageWidth:1200,imageHeight:800,authorSlug:'oleh-stepeniev',...article,body,minutes,lead:article.description};
});
