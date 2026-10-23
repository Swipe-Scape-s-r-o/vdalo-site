import { readFileSync } from 'node:fs';
import { renderArticleMarkdown } from './article-markdown.mjs';

const content = file => readFileSync(new URL(`./qr-articles/${file}`, import.meta.url), 'utf8');
const prepare = (file, meta) => {
  const rendered = renderArticleMarkdown(content(file));
  return { ...meta, bodyHtml: rendered.html, toc: rendered.toc.filter(([heading]) => heading.toLocaleLowerCase('uk') !== 'зміст') };
};

export const qrArticles = [
  prepare('qr-kody-dlya-goteliv.md', {
    slug: '/blog/qr-kody-dlya-goteliv',
    title: 'QR-коди для готелів: 35 сценаріїв і приклади | VDALO',
    headline: 'QR-коди для готелів: 35 способів використання та практичні приклади',
    description: 'Де використовувати QR-коди в готелі: Wi-Fi, рецепція, номер, меню, бронювання й відгуки. 35 ідей, таблиця вибору, шаблони та поради з друку.',
    image: '/assets/blog-qr-pillar-natural.jpg',
    alt: 'Гостя сканує QR-картку на стійці рецепції у бутик-готелі',
    tag: 'QR-КОДИ ДЛЯ ГОТЕЛІВ',
    minutes: 13,
    lead: '35 сценаріїв для готелю, апартаментів, хостелу чи бази відпочинку. Оберіть QR для конкретної задачі гостя, перевірте сторінку за ним і підготуйте код до друку.',
    publishedDate: '2026-10-15',
    modifiedDate: '2026-10-23',
    disableActionSection: true,
    links: [
      ['/blog/qr-wifi-dlya-gotelyu', 'Інструкція зі створення Wi-Fi QR'],
      ['/blog/qr-kartka-v-nomer-gotelyu', 'Шаблони QR-картки в номер'],
      ['/tools/qr-studio/', 'Відкрити QR Studio'],
    ],
  }),
  prepare('qr-wifi-dlya-gotelyu.md', {
    slug: '/blog/qr-wifi-dlya-gotelyu',
    title: 'QR-код Wi-Fi для готелю: як створити й перевірити | VDALO',
    headline: 'Як зробити QR-код Wi-Fi для гостей готелю: покрокова інструкція',
    description: 'Як зробити QR для гостьового Wi-Fi: назва мережі, пароль, тип захисту, друк та перевірка на iPhone й Android. Зразки тексту для картки.',
    image: '/assets/blog-qr-wifi-natural.jpg',
    alt: 'Картка з QR-кодом Wi-Fi та телефоном у готельному номері',
    tag: 'WI-FI ДЛЯ ГОСТЕЙ',
    minutes: 9,
    lead: 'SSID, тип захисту, пароль і перевірка на телефонах. Покроково покажемо, як підготувати QR для гостьової мережі, надрукувати картку й уникнути типових помилок.',
    publishedDate: '2026-10-15',
    modifiedDate: '2026-10-23',
    disableActionSection: true,
    links: [
      ['/blog/qr-kody-dlya-goteliv', '35 сценаріїв QR-кодів у готелі'],
      ['/blog/qr-kartka-v-nomer-gotelyu', 'Як оформити картку з QR у номер'],
      ['/tools/qr-studio/', 'Створити Wi-Fi QR у VDALO'],
    ],
  }),
  prepare('qr-kartka-v-nomer-gotelyu.md', {
    slug: '/blog/qr-kartka-v-nomer-gotelyu',
    title: 'QR-картка в номер готелю: шаблони й друк | VDALO',
    headline: 'QR-картка в номер готелю: що додати, як оформити та надрукувати',
    description: 'Що розмістити на QR-картці в номері готелю: Wi-Fi, правила, меню, рецепція. Три готові тексти, формати A6/A5 і чекліст перед друком.',
    image: '/assets/blog-qr-room-card-natural.jpg',
    alt: 'Друковані картки з QR-кодом та інформаційними символами на тумбі готельного номера',
    tag: 'QR-КАРТКА В НОМЕР',
    minutes: 10,
    lead: 'Оберіть один або два QR-коди, підготуйте підписи й контакт рецепції. У статті є три готові тексти для карток, поради щодо формату та чекліст перед тиражем.',
    publishedDate: '2026-10-15',
    modifiedDate: '2026-10-23',
    disableActionSection: true,
    links: [
      ['/blog/qr-kody-dlya-goteliv', '35 сценаріїв QR-кодів для готелю'],
      ['/blog/qr-wifi-dlya-gotelyu', 'Покрокова інструкція Wi-Fi QR'],
      ['/tools/qr-studio/', 'Створити QR-код у VDALO'],
    ],
  }),
];
