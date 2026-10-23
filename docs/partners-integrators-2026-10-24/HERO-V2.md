# Перший екран партнерів, редакція 2

Дата: 24 жовтня 2026.

## Дизайн

- Велике зображення спільної роботи у просторі готелю, фірмовий сливовий підпис і компактні кроки впровадження.
- Заголовок, дві CTA й механіка форм збережені. На вузьких екранах кроки розташовані вертикально для читабельності.
- На сторінці прибрано всі U+2014, зокрема з title. Речення перебудовані без механічної підміни пунктуації.
- Постійне правило записано в AGENTS.md репозиторію, загальному AGENTS.md робочої теки, docs/EDITORIAL_STANDARDS.md і брендгайді.

## Зображення

- Інструмент: вбудований image_gen, нове зображення без референсів.
- Фінальний файл: versions/v1/public/assets/partners-onboarding-hero-v2.jpg.
- Розмір: 1254 × 1254 px, 208 884 байти. JPEG збережений із якістю 88 без зміни композиції; кадрування адаптивне в CSS.
- Це тематична ілюстрація співпраці, без імен клієнтів, відгуків або тверджень про реальних учасників.
- Оригінал залишається у стандартній теці generated_images; сайт використовує локальний файл репозиторію.

## Промпт

```text
Use case: photorealistic-natural. Asset type: editorial hero photograph for VDALO, a hospitality software brand, right side of its Partners and Integrators website page. Create a refined, believable hospitality implementation scene in a contemporary boutique hotel lobby: a female hotel owner and a male implementation consultant, both in their early 30s to 40s, seated next to one another at a warm light oak reception counter, focused on a shared open laptop, one calmly pointing at the screen while the other listens. Natural candid body language, not looking at the camera, no handshake, no call center headset. Beautiful warm daylight from large windows, softly blurred reception area and a subtle indoor olive tree, cream plaster and walnut details, small plum upholstered elements. Restrained brand palette with deep plum #39233e, warm ivory #fcf9fb, muted rose accents, no neon. Premium editorial interior photography, natural skin texture, authentic details, 50mm lens, carefully composed square 1:1 crop. The people and laptop are framed in the central two thirds, show complete heads and hands, keep small breathing room above heads and toward the edges. Laptop display is angled away or softly out of focus with only a vague calendar pattern, no legible interface labels. Entire photograph, no poster layout, no border, no floating UI panels, no overlaid text, no logos, no badges, no numbers, no watermarks. Make the scene warm, credible, collaborative and polished, not exaggerated business stock photography.
```

## Локальний огляд

- Chrome, 321/390/768/1440 CSS px. Зображення завантажується, горизонтального переповнення немає.
- На ширині 321 px виправлене переповнення довгого підпису: усі три кроки читаються в окремих рядках.
- У відображеному тексті сторінки U+2014 не знайдено; синтаксис JS/MJS без помилок.
- Автоматичний набір тестів і реальні заявки не запускалися. Доставка форм та аналітика не є предметом цієї редакції.
- Знімки: hero-v2-desktop.png, hero-v2-mobile.png, hero-v2-mobile-visual.png, hero-v2-small-mobile.png.

## Публікація

Ця редакція готується для перегляду. Попередня спроба публікації описана в REVIEW.md. Факт появи нової редакції на staging підтверджується окремо; злиття у GitHub не є доказом оновлення сервера.
