import {assetUrl} from './assets.mjs';
import {icon} from './ui.mjs';
import {escapeHtml as e} from './content-revisions/html-fragments.mjs';

const sizes = '(max-width: 700px) calc(100vw - 40px), (max-width: 1320px) 51vw, 635px';
const widths = [480, 768, 1200];
const slides = [
  ['hotels', 'Готелі', 'Цегляний готель зі скляним фасадом і відкритим холом'],
  ['cottages', 'Котеджі', 'Дерев’яний котедж із високим трикутним дахом', '/solutions/glamping#cottage-complex-workflow'],
  ['glamping', 'Глемпінги', 'Два купольні намети глемпінгу на дерев’яних терасах', '/solutions/glamping'],
  ['camping', 'Кемпінги', 'Караван і намет поруч із невеликою спорудою кемпінгу'],
  ['apartments', 'Апартаменти', 'Апартаменти зі скляним фасадом та окремими житловими зонами', '/solutions/apartments'],
  ['holiday-parks', 'Бази відпочинку', 'Будиночки бази відпочинку біля води та дерев’яна альтанка'],
  ['aparthotels', 'Апарт-готелі', 'Багатоповерховий апарт-готель із балконами', '/solutions/apartments#aparthotel-workflow'],
  ['guesthouses', 'Гостьові будинки', 'Гостьовий будинок із верандою й садом'],
  ['resorts', 'Курортні комплекси', 'Курортний комплекс із басейном і терасами'],
  ['hostels', 'Хостели', 'Хостел у розрізі зі спільною спальнею та зоною відпочинку']
].map(([key, label, alt, href]) => {
  const image = width => `/v1${assetUrl(`home-property-${key}-${width}.webp`)}`;
  return {label, alt, href, src: image(768), srcset: widths.map(width => `${image(width)} ${width}w`).join(', ')};
});

export const homeHeroImage = {...slides[0], sizes};

export function renderHomePropertyTypes() {
  const hero = homeHeroImage;
  const settings = JSON.stringify(slides).replaceAll('<', '\\u003c');
  return `<section class="home-hero-media home-properties" aria-label="Типи об’єктів гостинності" data-home-properties>
    <div class="home-properties-frame" data-property-frame><img src="${hero.src}" srcset="${hero.srcset}" sizes="${hero.sizes}" width="1200" height="800" alt="${e(hero.alt)}" fetchpriority="high" decoding="async"></div>
    <div class="home-properties-details">
      <div class="home-properties-caption">
        <a data-property-link hidden><span></span> ${icon('arrow')}</a>
        <span data-property-label>${e(hero.label)}</span>
        <a class="home-properties-all" href="/solutions">Усі типи об’єктів</a>
      </div>
      <div class="home-properties-controls" data-property-controls hidden>
        <span class="home-properties-position" aria-hidden="true" data-property-position>1 / ${slides.length}</span>
        <button type="button" class="home-properties-previous" aria-label="Попередній тип об’єкта" data-property-step="-1">${icon('arrow')}</button>
        <button type="button" aria-label="Наступний тип об’єкта" data-property-step="1">${icon('arrow')}</button>
        <button type="button" class="home-properties-toggle" aria-label="Призупинити автоматичне гортання" data-property-toggle><span aria-hidden="true">Ⅱ</span></button>
      </div>
    </div>
    <span class="home-properties-announcement" role="status" data-property-announcement></span>
    <script type="application/json" data-property-slides>${settings}</script>
  </section>`;
}
