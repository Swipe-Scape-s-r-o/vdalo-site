# VDALO Design System 2.1

## 0. Для чого цей пакет

Це production-ready набір візуальних правил та окремих asset-файлів для сайту VDALO. Його можна передати Codex як єдину дизайн-основу.

Головне правило: не перемальовувати логотип і не створювати новий стиль. Сайт має розвивати поточний напрям «Вдалий підпис»: editorial serif, темна слива, Spark Pink, м'які світлі поверхні, багато повітря, структурна SaaS-сітка.

## 1. Канон бренду

- Назва: `VDALO`
- Ринок: Україна
- Слоган: `Керуйте готелем вдало.`
- Категорія: `PMS та автоматизація щоденної роботи готелю.`
- Benefit direction: `Менше ручної роботи. Більше контролю над готелем.`
- Primary conversion route: trial / request trial access
- Secondary route: безкоштовний аудит процесів готелю
- Символ U+2014 не використовувати в публічному контенті VDALO: статтях, кейсах, інтерфейсі, підписах, alt, метаданих і тексті на зображеннях. Використовувати коротке тире U+2013 або інші доречні розділові знаки. Повне постійне правило: `docs/EDITORIAL_STANDARDS.md`.

## 2. Джерело логотипу

Не набирати слово VDALO шрифтом. Використовувати готові файли з `01_LOGOS/`.

Пріоритет для web:
1. `01_LOGOS/primary/VDALO_logo_primary_vector.svg` на світлому фоні
2. `01_LOGOS/inverse/VDALO_logo_inverse_vector.svg` на темному фоні
3. `01_LOGOS/icon/VDALO_icon_primary.svg` для avatar/app/favicon

`01_LOGOS/source_artwork/` містить вихідний растровий artwork з попереднього концепту. `*_vector.svg` є чистою пласкою векторною адаптацією для production.

### Logo clear space
`x` дорівнює висоті Spark. Мінімум `1x` навколо знака.

### Minimum sizes
- wordmark web: 140 px ширини
- icon web: 24 px
- wordmark print: 28 mm

Не розтягувати, не нахиляти, не змінювати пропорції, не робити Spark іншим кольором.

## 3. Палітра

| Token | HEX | Роль |
|---|---|---|
| Plum | `#39233E` | головний бренд, текст, primary CTA |
| Spark Pink | `#FF92BD` | акцент, focus, active point |
| Soft Blush | `#FFF5F7` | м'який світлий фон |
| Paper | `#FCF9F8` | базова сторінка |
| Ink | `#211A22` | body copy |
| Deep Plum | `#211622` | темні секції |
| Mist | `#E9DEE3` | нейтральні поверхні |

Pink не робити домінуючим фоном. Він має залишатися сигналом.

## 4. Типографіка

### Display
`Playfair Display`, 500-700.

Use cases: H1, H2, великі цифри, короткі фірмові твердження.

### UI / body
`Inter`, 400-700.

Use cases: navigation, body, labels, forms, tables, buttons, product UI.

Не використовувати serif для довгих абзаців. Не підміняти логотип текстовим набором Playfair.

### Web scale
- H1: `clamp(56px, 7vw, 112px)`, line-height 0.95-1.02
- H2: `clamp(42px, 5vw, 72px)`, line-height 1.0
- H3: 28-36px
- body large: 20-22px
- body: 16-18px
- label: 12-14px, можна з letter-spacing 0.06em

## 5. Grid та spacing

- Desktop: 12 columns, 96 px page margin, 24 px gutter
- Tablet: 8 columns, 48 px margin, 20 px gutter
- Mobile: 4 columns, 20 px margin, 12 px gutter
- Base spacing: 8 px
- Section Y padding: 72-136 px responsive
- Card radius: 24 px
- Input radius: 16 px
- Pill radius: 999 px

Один viewport або секція має один головний візуальний акцент.

## 6. Візуальна граматика

### Spark
Файли: `03_GRAPHIC_ELEMENTS/spark/`.

Використовувати як:
- brand signature
- active point
- акцент біля ключової цифри або слова
- короткий micro-motion при успішній дії

Не використовувати як звичайну функціональну іконку і не розставляти у кожному куті.

### Signature Cut
Файли: `03_GRAPHIC_ELEMENTS/signature_cut/`.

Використовувати як:
- cut на краю hero visual
- маску для фото
- секційний divider
- reveal mask при скролі

Не різати кожну картку. На сторінці достатньо 2-4 помітних застосувань.

### Rhythm Lines
Файли: `03_GRAPHIC_ELEMENTS/rhythm_lines/`.

Тонкі лінії та сітки пояснюють порядок і рух процесу. Opacity приблизно 0.08-0.18.

## 7. Фото

Перевага:
- реальні сучасні готелі
- архітектура та деталі
- природне світло і тінь
- робочі моменти команди
- руки, планшети, ключі, reception, housekeeping
- кадри з негативним простором для тексту або UI

Не використовувати:
- роботів
- glowing brain
- humanoid AI
- неонові hologram dashboards
- generic handshake stock

## 8. UI компоненти

Готові reference-файли в `04_UI_COMPONENTS/`.

### Primary button
- background `#39233E`
- text `#FFF5F7`
- min-height 52 px
- horizontal padding 24 px
- pill radius
- hover: Plum 700 + translateY(-1px)
- focus ring: Spark Pink, видимий з клавіатури

### Secondary button
- transparent background
- Plum border 20-28% opacity
- Plum text

### Card
- white/paper surface
- 1 px Plum border 12-16% opacity
- radius 24 px
- 24-40 px inner padding
- soft shadow only for important floating surfaces

### Input
- 52-56 px height
- label above field
- 16 px radius
- Pink focus state
- error/success states use semantic colors plus icon/text, not color alone

## 9. Рекомендована структура landing page

Візуальна структура, не нова продуктова обіцянка:

1. Header
2. Hero
3. Product preview / real UI or clearly labeled concept
4. Problem recognition
5. Capabilities grouped by business job
6. Guest and operations workflow
7. Ukraine-local operations
8. Fit / audience
9. Trial block
10. Audit block
11. Onboarding / implementation
12. Human control / trust
13. FAQ
14. Final dual CTA
15. Footer

Primary CTA має бути trial/request trial. Audit залишається secondary route. Якщо self-service trial реально не підключений, кнопка має вести на request access, а не симулювати активацію.

## 10. Hero composition

Recommended desktop:
- left 5-6 columns: eyebrow, H1, subcopy, two actions
- right 6-7 columns: product visual, hospitality photo, or controlled combination
- logo у header, не дублювати великим декоративним знаком у hero без причини
- one Spark accent
- one Signature Cut
- soft blush/paper background

H1 direction: `Менше ручної роботи. Більше контролю над готелем.`

Brand line може використовуватися окремо: `Керуйте готелем вдало.`

## 11. Product visuals

Якщо використовуються реальні screenshots, не переробляти їх так, щоб вони створювали іншу продуктову функціональність.

Якщо UI концептуальний, додати видимий label `Концептуальна ілюстрація` або еквівалент.

Для декоративного browser frame є `08_WEB_IMPLEMENTATION/browser_frame_concept.svg`.

## 12. Dark sections

Темні секції можна використовувати точково:
- background `#39233E` або `#211622`
- title `#FFF5F7`
- body rgba(255,245,247,.76)
- Spark залишається `#FF92BD`
- не робити весь сайт dark mode за замовчуванням

## 13. Motion

- UI interactions: 180-240 ms
- section reveal: 400-600 ms
- easing: `cubic-bezier(.2,.8,.2,1)`
- Spark: короткий pulse або scale 0.96 -> 1.04 -> 1
- Signature Cut: mask/reveal
- rhythm lines: draw-on тільки якщо це пояснює workflow
- підтримувати `prefers-reduced-motion`

Не анімувати все одночасно. Motion має пояснювати стан або перехід.

## 14. Responsive rules

### Desktop >= 1200
Повна 12-col композиція, великі editorial заголовки, product visual може бути 6-7 columns.

### Tablet 768-1199
8 columns. Не стискати desktop hero. Перекомпонувати в 2 рівні.

### Mobile < 768
4 columns. H1 не менше 44 px якщо вміщується, інакше 40 px. CTA stack vertical. Product preview нижче copy. Decorative line systems спрощуються.

## 15. Accessibility

- body text 16 px minimum
- keyboard focus visible
- semantic headings
- contrast check for every state
- statuses duplicated by icon/text
- alt text for meaningful images
- no text baked only into raster assets
- reduced motion

## 16. Copy and product truth

Дизайн не дає права вигадувати функції. Не додавати:
- фейкові клієнтські логотипи
- непогоджені ціни
- SLA або 24/7 support без підтвердження
- universal integration claims
- ROI або automation percentages без доказів
- фейковий success state форми

## 17. Файлова карта

```text
01_LOGOS/
  primary/
  inverse/
  mono_plum/
  mono_blush/
  mono_white/
  mono_black/
  icon/
  favicon/
  lockups/
  on_surfaces/
02_COLORS/
03_GRAPHIC_ELEMENTS/
  spark/
  signature_cut/
  rhythm_lines/
  backgrounds_patterns/
  functional_icons/
04_UI_COMPONENTS/
05_LAYOUT_GRIDS/
06_SOCIAL_TEMPLATES/
07_PRESENTATION_TEMPLATES/
08_WEB_IMPLEMENTATION/
09_TYPOGRAPHY/
10_PREVIEW/
99_SOURCE_REFERENCE/
```

## 18. Що Codex має зробити перед coding

1. Переглянути цей MD.
2. Імпортувати `08_WEB_IMPLEMENTATION/design_tokens.json`.
3. Використати logo assets з `01_LOGOS/`.
4. Не замінювати logo текстом.
5. Визначити reusable tokens та components.
6. Зібрати responsive hero та section system на 12/8/4 grid.
7. Підключити `04_UI_COMPONENTS/vdalo-components.css` як reference або перенести токени у поточний stack.
8. Маркувати concept UI.
9. Не вигадувати product/business facts.
10. Перед завершенням перевірити mobile, focus, reduced motion, performance та відсутність U+2014.

## 19. Definition of done для дизайну сайту

Сайт виглядає як один бренд, якщо:
- wordmark використаний без деформації
- палітра послідовна
- Spark рідкісний і значущий
- H1/H2 мають editorial характер
- body та UI залишаються чистими SaaS
- структура відчувається керованою, а не декоративною
- фото залишають hospitality людяним
- немає sci-fi AI стилю
- мобільна версія не є просто стисненим desktop
- primary action зрозумілий
- дизайн не створює непідтверджених обіцянок

## Канонічний логотип / 08.10.2026

Канонічний wordmark VDALO® з рожевим заповненням і прозорим фоном зафіксований у `01_LOGOS/canonical/VDALO_logo_canonical_2026-10-08.png`. Використовувати цей оригінал у шапці та футері всіх активних сторінок і варіантів. Не набирати слово шрифтом, не перемальовувати знак і не замінювати його попередніми SVG або іншими PNG wordmark. Файл зберігає прозорість і вихідне співвідношення сторін 3:1. Іконку застосунку та favicon можна залишити окремими знаками.
