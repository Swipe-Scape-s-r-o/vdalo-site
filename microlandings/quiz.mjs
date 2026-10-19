const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

const options={
 property:[['guesthouse','Садиба, гостьовий будинок або котеджі'],['hotel','Готель або мініготель'],['glamping','Глемпінг або база відпочинку'],['apartments','Апартаменти подобово'],['hostel','Хостел'],['multiple','Кілька об’єктів'],['other','Інший формат']],
 size:[['1-5','1–5 номерів або помешкань'],['6-12','6–12 номерів або помешкань'],['13-40','13–40 номерів або помешкань'],['41+','Понад 40 номерів або помешкань']],
 pms:[['none','Окремої системи поки немає'],['spreadsheets','Ведемо бронювання у зошиті, таблицях або чатах'],['manual_gaps','Користуємося системою, але частину роботи робимо вручну'],['exely','Користуємося Exely або TravelLine'],['satisfied','Нинішня система загалом підходить'],['switching','Розглядаємо перехід на іншу систему']],
 pain:[['channels','Бронювання з різних каналів важко звіряти, є ризик овербукінгу'],['checkin','Документи й заселення доводиться готувати вручну'],['night_calls','Гості повторно телефонують із типовими запитаннями'],['power','Під час відключень складно керувати бронюваннями й роботою'],['direct','Мало прямих бронювань, а комісії каналів відчутні']],
 frequency:[['daily','Щодня'],['weekly','Кілька разів на тиждень'],['monthly','Кілька разів на місяць'],['rare','Рідко, але кожен випадок забирає багато часу']]
};
const questions=[
 {id:'pain',title:'Що у щоденній роботі створює найбільше клопоту?',help:'Оберіть ситуацію, з якої вам найважливіше почати.'},
 {id:'frequency',title:'Як часто це трапляється?',help:'Це допоможе оцінити, наскільки регулярно процес потребує уваги.'},
 {id:'pms',title:'Як зараз ведете бронювання?',help:'Оберіть найближчий варіант, навіть якщо поєднуєте кілька підходів.'},
 {id:'property',title:'Який у вас об’єкт?',help:'Підлаштуємо рекомендацію під формат вашої роботи.'},
 {id:'size',title:'Скільки у вас номерів, будиночків або квартир?',help:'Приблизної кількості достатньо.'}
];

export function renderQuizPage(params=new URLSearchParams()){
 const smsCode=(params.get('c')||'').match(/^\d{1,2}$/)?.[0]||'';
 const config=JSON.stringify({smsCode,questions,options}).replaceAll('<','\\u003c');
 return `<!doctype html>
<html lang="uk">
<head>
 <meta charset="utf-8">
 <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
 <title>Де готель втрачає гроші й нерви? Квіз VDALO</title>
 <meta name="description" content="Відповідайте на 5 коротких запитань про бронювання, заселення та щоденну роботу. Отримайте рекомендацію, з чого почати у вашому готелі чи садибі.">
 <meta name="robots" content="noindex,nofollow">
 <link rel="canonical" href="https://www.vdalo.tech/q">
 <meta name="theme-color" content="#fbf7f4">
 <link rel="icon" href="/v3/assets/favicon.svg">
 <link rel="preconnect" href="https://fonts.googleapis.com">
 <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
 <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Inter+Tight:wght@700;800;900&display=swap" rel="stylesheet">
 <link rel="stylesheet" href="/v3/editorial.css">
 <link rel="stylesheet" href="/funnel-assets/funnel.css?v=6">
 <link rel="stylesheet" href="/quiz-assets/quiz.css?v=11">
 <script src="/quiz-assets/quiz.js?v=8" defer></script>
</head>
<body class="microlanding quiz-page">
 <a class="skip-link" href="#quiz-main">Перейти до квізу</a>
 <main id="quiz-main" class="quiz-wrap">
  <section class="quiz-intro" id="quiz-intro">
   <header class="quiz-card-header">
    <a class="quiz-brand" href="/" aria-label="VDALO, головний сайт"><img src="/v1/assets/vdalo-canonical.png" width="168" height="56" alt="VDALO®"></a>
   </header>
   <div class="quiz-intro-copy">
    <p class="eyebrow">Для власників садиб, мініготелів, баз відпочинку й готелів</p>
    <h1>Де ваш готель втрачає <em>гроші й нерви?</em></h1>
    <p class="quiz-lead">Овербукінг, ручні документи, повторні дзвінки гостей або відключення світла?</p>
    <p class="quiz-support">Відповідайте на 5 коротких запитань. Підкажемо, з чого почати саме у вас.</p>
    <button class="button quiz-start" type="button" data-start>Почати квіз <span aria-hidden="true">→</span></button>
    <p class="quiz-privacy-note">Близько хвилини <span aria-hidden="true">·</span> Без реєстрації <span aria-hidden="true">·</span> Контакти не потрібні</p>
   </div>
   <figure class="quiz-visual">
    <img src="/quiz-assets/quiz-manual-checkin.jpg?v=1" width="1536" height="1024" alt="Адміністраторка готелю допомагає гостю під час заселення" fetchpriority="high" decoding="async">
   </figure>
  </section>
  <section class="quiz-flow" id="quiz-flow" hidden aria-live="polite">
   <div class="quiz-flow-top"><a href="/" class="quiz-back-home">VDALO</a><span class="quiz-step-count" data-count>Питання 1 із 5</span></div>
   <div class="quiz-progress" role="progressbar" aria-label="Прогрес квізу" aria-valuemin="0" aria-valuemax="5" aria-valuenow="0"><span data-progress></span></div>
   <div class="quiz-question" data-question></div>
   <div class="quiz-controls"><button class="quiz-back" type="button" data-back hidden>← Назад</button><span class="quiz-selection-hint">Оберіть один варіант</span></div>
  </section>
  <section class="quiz-result" id="quiz-result" hidden aria-live="polite"></section>
 </main>
 <footer class="ml-footer quiz-footer"><div class="wrap"><a href="/" aria-label="VDALO, головна"><img src="/v1/assets/vdalo-canonical.png" width="168" height="56" alt="VDALO®"></a><p>Керуйте готелем вдало.</p><a href="/funnel/privacy">Використання даних</a></div></footer>
 <script type="application/json" id="quiz-config">${config}</script>
</body>
</html>`;
}
