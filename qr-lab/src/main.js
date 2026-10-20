import { buildWifiPayload } from './wifi-payload.js';

const scenarios = {
  short: 'https://www.vdalo.tech/',
  utm: 'https://www.vdalo.tech/hotel-check-in?utm_source=qr&utm_medium=guest-card&utm_campaign=autumn-2026&utm_content=reception-card&property=sample-hotel',
  ukrainian: 'VDALO: інструкції для гостей. Wi-Fi, правила проживання, контакти рецепції та час сніданку.',
  idn: new URL('https://готель.укр/бронювання?місто=Львів').href,
  wifi: 'WIFI:T:WPA;S:VDALO Guest;P:демо\\;пароль,2026;H:false;;',
  empty: '',
  long: `VDALO QR payload capacity test ${'готель бронювання інструкції '.repeat(180)}`,
};
const heroSampleQr = document.querySelector('#hero-sample-qr');
if (heroSampleQr) {
  import('qr-code-styling').then(({ default: QRCodeStyling }) => {
    const sample = new QRCodeStyling({
      width: 240, height: 240, type: 'svg', data: new URL('/tools/qr-studio/', location.origin).href,
      margin: 8, qrOptions: { errorCorrectionLevel: 'H' },
      dotsOptions: { color: '#39233e', type: 'rounded' },
      cornersSquareOptions: { color: '#39233e', type: 'extra-rounded' },
      cornersDotOptions: { color: '#d72f79', type: 'dot' },
      backgroundOptions: { color: '#ffffff' },
    });
    sample.append(heroSampleQr);
  }).catch(() => {
    heroSampleQr.setAttribute('aria-label', 'Приклад QR-коду VDALO');
  });
}
if (import.meta.env.DEV && new URLSearchParams(location.search).get('lab') === '1') {
  const technicalStand = document.querySelector('.lab-details');
  if (technicalStand) technicalStand.hidden = false;
}
const engines = ['styling', 'qrcode', 'nayuki'];
const outputs = new Map();
const payloadInput = document.querySelector('#payload');
const scenarioSelect = document.querySelector('#scenario');
const labStatus = document.querySelector('#lab-status');
let lastScenario = '';

function trackQrStudioEvent(event, details = {}) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, tool_name: 'qr_studio', ...details });
}

scenarioSelect.addEventListener('change', () => {
  payloadInput.value = scenarios[scenarioSelect.value];
});
payloadInput.value = scenarios[scenarioSelect.value];
document.querySelector('#generate').addEventListener('click', () => runCurrent());
document.querySelector('#run-matrix').addEventListener('click', () => runMatrix());
document.querySelectorAll('[data-export]').forEach(button => button.addEventListener('click', () => exportFile(button.dataset.export, button.dataset.format)));

const generatorForm = document.querySelector('#generator-form');
const generatorError = document.querySelector('#generator-error');
const generatorPreview = document.querySelector('#generator-preview');
const generatorPlaceholder = document.querySelector('#qr-placeholder').cloneNode(true);
const generatorStatus = document.querySelector('#result-status');
const generatorCaption = document.querySelector('#result-caption');
let generatorMode = 'url';
let generatedQr = null;
let logoDataUrl = '';
let photoDataUrl = '';
let previewObjectUrl = '';
let generatorRenderVersion = 0;
let generatorUseCase = 'booking';

const useCases = {
  booking: {
    mode: 'url', label: 'Посилання для бронювання', hint: 'Використайте повне посилання на форму або сторінку бронювання.',
    placeholder: 'https://hotel.ua/booking', title: 'Забронювати номер', subtitle: 'Вільні дати й ціни',
    note: 'Вставте посилання на власну сторінку бронювання. QR зберігає цю адресу: якщо її змінити, код доведеться створити й надрукувати знову.',
  },
  wifi: {
    mode: 'wifi', title: 'Wi-Fi для гостей', subtitle: 'Відскануйте, щоб під’єднатися',
    note: 'Для захищеної мережі QR містить пароль, який можна прочитати зі сканування. Для відкритої мережі без пароля QR містить лише назву мережі. Використовуйте окремий гостьовий Wi-Fi.',
  },
  menu: {
    mode: 'url', label: 'Посилання на меню ресторану', hint: 'Додайте посилання на ваше онлайн-меню. Цей інструмент створює QR, але не формує саме меню.',
    placeholder: 'https://hotel.ua/menu', title: 'Меню ресторану', subtitle: 'Перегляньте меню на телефоні',
    note: 'Вставте посилання на онлайн-меню. Краще оновлювати меню за тією самою адресою: QR зберігає саме URL, а при зміні адреси код треба створити й надрукувати знову.',
  },
  guest: {
    mode: 'url', label: 'Посилання на сторінку гостя', hint: 'Наприклад, правила проживання, інструкція заселення, Wi-Fi та контакти.',
    placeholder: 'https://hotel.ua/guest', title: 'Інформація для гостя', subtitle: 'Усе важливе під рукою',
    note: 'Одна сторінка може зібрати правила проживання, інструкції, час сніданку й контакти. Створіть її окремо та вставте посилання. QR зберігає цю адресу.',
  },
  review: {
    mode: 'url', label: 'Посилання для відгуку', hint: 'Вставте пряме посилання на сторінку відгуків вашого готелю.',
    placeholder: 'https://hotel.ua/review', title: 'Залишити відгук', subtitle: 'Поділіться враженнями',
    note: 'Ведіть гостя прямо на ваш профіль або форму відгуку. Перевірте посилання перед друком: QR зберігає його адресу.',
  },
  reception: {
    mode: 'url', label: 'Як зв’язатися з рецепцією', hint: 'Додайте HTTPS-посилання на контакти чи чат або номер у форматі tel:+380....',
    placeholder: 'https://hotel.ua/contact або tel:+380...', title: 'Потрібна допомога?', subtitle: 'Зв’яжіться з рецепцією',
    note: 'Вкажіть сторінку контактів або форму звернення, де гість знайде актуальний спосіб зв’язку. QR зберігає цю адресу.',
  },
};

document.querySelectorAll('[data-preset]').forEach(button => button.addEventListener('click', () => {
  const preset = useCases[button.dataset.preset];
  if (!preset) return;
  invalidateGeneratorOutput();
  document.querySelectorAll('[data-preset]').forEach(item => {
    const active = item === button;
    item.classList.toggle('is-active', active);
    item.setAttribute('aria-pressed', String(active));
  });
  if (generatorMode !== preset.mode) document.querySelector(`[data-mode="${preset.mode}"]`).click();
  generatorUseCase = button.dataset.preset;
  trackQrStudioEvent('qr_studio_use_case_select', { qr_use_case: generatorUseCase });
  if (preset.mode === 'url') {
    document.querySelector('#url-label').textContent = preset.label;
    document.querySelector('#url-hint').textContent = preset.hint;
    document.querySelector('#url-value').placeholder = preset.placeholder;
  } else {
    document.querySelector('#wifi-name').focus({ preventScroll: true });
  }
  document.querySelector('#qr-title').value = preset.title;
  document.querySelector('#qr-subtitle').value = preset.subtitle;
  document.querySelector('#usecase-note').textContent = preset.note;
  if (preset.mode === 'wifi') updateWifiSecurityCopy();
  generatorError.hidden = true;
}));

document.querySelectorAll('[data-preset-link]').forEach(link => link.addEventListener('click', () => {
  const presetButton = document.querySelector(`[data-preset="${link.dataset.presetLink}"]`);
  if (presetButton) presetButton.click();
}));

document.querySelectorAll('[data-mode]').forEach(tab => tab.addEventListener('click', () => {
  const modeChanged = generatorMode !== tab.dataset.mode;
  if (generatorMode !== tab.dataset.mode) invalidateGeneratorOutput();
  generatorMode = tab.dataset.mode;
  if (modeChanged) trackQrStudioEvent('qr_studio_content_type_select', { qr_content_type: generatorMode });
  document.querySelectorAll('[data-mode]').forEach(item => {
    const active = item === tab;
    item.classList.toggle('is-active', active);
    item.setAttribute('aria-selected', String(active));
    item.tabIndex = active ? 0 : -1;
  });
  document.querySelectorAll('[data-fields]').forEach(group => {
    const active = group.dataset.fields === generatorMode;
    group.hidden = !active;
    group.classList.toggle('is-hidden', !active);
  });
  const selectedUseCase = document.querySelector('[data-preset].is-active');
  if (selectedUseCase && useCases[selectedUseCase.dataset.preset].mode !== generatorMode) {
    selectedUseCase.classList.remove('is-active');
    selectedUseCase.setAttribute('aria-pressed', 'false');
    generatorUseCase = null;
    document.querySelector('#usecase-note').textContent = generatorMode === 'text'
      ? 'Введіть коротку нотатку для гостя. Для меню, бронювання чи сторінки гостя краще використати посилання.'
      : generatorMode === 'wifi'
        ? 'Введіть дані Wi-Fi мережі. Переконайтеся, що гості мають право користуватися цією мережею.'
        : 'Вставте повне посилання на сторінку або сервіс, який має відкрити гість.';
  }
  document.querySelector('#mode-panel').setAttribute('aria-labelledby', tab.id);
  if (generatorMode === 'wifi') updateWifiSecurityCopy();
  generatorError.hidden = true;
}));

document.querySelectorAll('[data-mode]').forEach(tab => {
  tab.tabIndex = tab.dataset.mode === 'url' ? 0 : -1;
  tab.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const tabs = [...document.querySelectorAll('[data-mode]')];
    const currentIndex = tabs.indexOf(tab);
    const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (currentIndex + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
    tabs[nextIndex].click();
  });
});

document.querySelector('#toggle-password').addEventListener('click', event => {
  const input = document.querySelector('#wifi-password');
  const show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  event.currentTarget.setAttribute('aria-pressed', String(show));
  event.currentTarget.setAttribute('aria-label', show ? 'Приховати пароль' : 'Показати пароль');
});
document.querySelector('#wifi-security').addEventListener('change', event => {
  const passwordField = document.querySelector('#wifi-password').closest('div');
  const passwordIsNeeded = event.currentTarget.value !== 'nopass';
  passwordField.hidden = !passwordIsNeeded;
  passwordField.classList.toggle('is-hidden', !passwordIsNeeded);
  document.querySelector('#wifi-password').required = passwordIsNeeded;
  updateWifiSecurityCopy();
});

function updateWifiSecurityCopy() {
  const security = document.querySelector('#wifi-security').value;
  const copy = {
    WPA: {
      hint: 'Введіть пароль саме від гостьової мережі. Він буде закодований у QR і стане доступним кожному, хто його сканує. Використовуйте окрему гостьову мережу.',
      note: 'QR міститиме назву мережі й пароль. Його можна прочитати зі сканування, тому використовуйте окремий гостьовий Wi-Fi та не публікуйте код поза гостьовою зоною.',
    },
    WEP: {
      hint: 'Введіть пароль саме від гостьової мережі. Він буде закодований у QR і стане доступним кожному, хто його сканує. WEP є застарілим типом захисту; за можливості оберіть WPA/WPA2.',
      note: 'QR міститиме назву мережі й пароль. WEP є застарілим типом захисту; за можливості використовуйте окрему мережу з WPA/WPA2.',
    },
    nopass: {
      hint: 'Для відкритої мережі пароль не потрібен і не потрапляє в QR. Код міститиме лише назву мережі. Відкрита мережа не захищає трафік паролем; для гостей краще налаштувати окремий захищений Wi-Fi.',
      note: 'Відкрита мережа не має захисту паролем. QR міститиме лише назву мережі. Для гостей краще налаштувати окремий захищений Wi-Fi.',
    },
  }[security];
  document.querySelector('#wifi-hint').textContent = copy.hint;
  if (generatorMode === 'wifi' || generatorUseCase === 'wifi') {
    document.querySelector('#usecase-note').textContent = copy.note;
  }
}
updateWifiSecurityCopy();
document.querySelectorAll('#url-value, #wifi-name, #wifi-password, #wifi-security, #text-value').forEach(input => {
  input.addEventListener(input.tagName === 'SELECT' ? 'change' : 'input', () => {
    invalidateGeneratorOutput();
    generatorError.hidden = true;
  });
});
document.querySelector('#text-value').addEventListener('input', event => {
  document.querySelector('#text-count').textContent = `${event.currentTarget.value.length} / 800`;
});
document.querySelectorAll('[data-generator-export]').forEach(button => button.addEventListener('click', async () => {
  if (!generatedQr) return;
  button.disabled = true;
  const exportStatus = document.querySelector('#export-status');
  const format = button.dataset.generatorExport;
  const size = document.querySelector('#export-size').value;
  exportStatus.textContent = 'Готуємо файл…';
  exportFile('nayuki', format)
    .then(filename => {
      exportStatus.textContent = filename ? `Файл ${filename} підготовлено.` : '';
      if (filename) trackQrStudioEvent('qr_studio_download', {
        qr_format: format,
        qr_size_px: Number(size),
        qr_content_type: generatorMode,
        qr_use_case: generatorUseCase || 'custom',
      });
    })
    .catch(error => {
      generatorError.textContent = error.message || 'Не вдалося підготувати файл. Спробуйте інший формат або розмір.';
      generatorError.hidden = false;
      exportStatus.textContent = '';
    })
    .finally(() => { button.disabled = false; });
}));

for (const [picker, hexField] of [['#qr-foreground', '#qr-foreground-hex'], ['#qr-background', '#qr-background-hex']]) {
  const color = document.querySelector(picker);
  const hex = document.querySelector(hexField);
  color.addEventListener('input', () => { hex.value = color.value; refreshStyledQr(); });
  hex.addEventListener('change', () => {
    if (!/^#[0-9a-f]{6}$/i.test(hex.value)) { hex.value = color.value; return; }
    color.value = hex.value;
    refreshStyledQr();
  });
}
document.querySelectorAll('.qr-customizer select, .qr-customizer input:not([type="file"]), .qr-customizer input[type="text"]').forEach(input => input.addEventListener('input', refreshStyledQr));
document.querySelector('#qr-logo-size').addEventListener('input', event => { document.querySelector('#qr-logo-size-value').value = `${event.currentTarget.value}%`; });
setupImageUpload('#qr-logo', data => { logoDataUrl = data; document.querySelector('#qr-logo-remove').hidden = !data; refreshStyledQr(); });
setupImageUpload('#qr-photo', data => { photoDataUrl = data; document.querySelector('#qr-photo-remove').hidden = !data; refreshStyledQr(); });
document.querySelector('#qr-logo-remove').addEventListener('click', () => { logoDataUrl = ''; document.querySelector('#qr-logo').value = ''; document.querySelector('#qr-logo-remove').hidden = true; refreshStyledQr(); });
document.querySelector('#qr-photo-remove').addEventListener('click', () => { photoDataUrl = ''; document.querySelector('#qr-photo').value = ''; document.querySelector('#qr-photo-remove').hidden = true; refreshStyledQr(); });

function setupImageUpload(selector, onLoaded) {
  const input = document.querySelector(selector);
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      input.value = '';
      generatorError.textContent = 'Оберіть файл PNG, JPG або WebP розміром до 2 МБ.';
      generatorError.hidden = false;
      return;
    }
    const reader = new FileReader();
    reader.onload = () => { onLoaded(String(reader.result)); generatorError.hidden = true; };
    reader.onerror = () => { generatorError.textContent = 'Не вдалося прочитати зображення. Спробуйте інший файл.'; generatorError.hidden = false; };
    reader.readAsDataURL(file);
  });
}

let refreshTimer;
function refreshStyledQr() {
  if (!generatedQr) return;
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(async () => {
    const version = ++generatorRenderVersion;
    try {
      const value = readGeneratorValue();
      if (!value.trim() || bytes(value) > 1273) return;
      const output = await createStyledOutput(value);
      if (version !== generatorRenderVersion) return;
      showGeneratorOutput(output, value);
    } catch (error) {
      generatorError.textContent = error.message || 'Перевірте дані та спробуйте ще раз.';
      generatorError.hidden = false;
    }
  }, 140);
}

function showGeneratorOutput(output, value) {
  outputs.set('nayuki', output);
  generatedQr = output;
  if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
  previewObjectUrl = URL.createObjectURL(output.pngBlob);
  const image = new Image();
  image.alt = 'Оформлений QR-код. Перед використанням перевірте його камерою телефона.';
  image.src = previewObjectUrl;
  generatorPreview.replaceChildren(image);
  document.querySelector('#preview-nayuki').replaceChildren(image.cloneNode());
  document.querySelector('[data-engine="nayuki"] .engine-state').textContent = 'Готово';
  document.querySelector('#metrics-nayuki').innerHTML = `<span>PNG: ${fmtBytes(output.pngBlob.size)}</span><span>SVG: ${fmtBytes(new Blob([output.svg]).size)}</span><span>ECC: H</span><span>Матриця: ${output.modules}</span>`;
  generatorCaption.textContent = generatorMode === 'wifi'
    ? document.querySelector('#wifi-security').value === 'nopass'
      ? 'Відкрита мережа не має пароля. QR містить назву мережі; камера може запропонувати підключення.'
      : 'QR містить назву захищеної мережі та пароль. Камера може запропонувати підключення; пароль можна прочитати зі сканування.'
    : generatorMode === 'text'
      ? 'Відскануйте камерою, щоб прочитати текстову інформацію для гостя.'
      : `Відскануйте камерою, щоб відкрити ${useCases[generatorUseCase]?.label?.replace('Посилання на ', '').replace('Посилання для ', '') || 'ваше посилання'}.`;
  generatorStatus.classList.add('is-ready');
  generatorStatus.innerHTML = '<i></i> Готово';
  document.querySelectorAll('[data-generator-export]').forEach(button => { button.disabled = false; });
  document.querySelector('#lab-status').textContent = `QR сформовано з ${bytes(value)} байтів. Зображення не залишають ваш браузер.`;
  const lowContrast = contrastRatio(document.querySelector('#qr-foreground').value, document.querySelector('#qr-background').value) < 4.5;
  const decorativeRisk = document.querySelector('#qr-module-shape').value === 'dots' || document.querySelector('#qr-eye-shape').value === 'circle' || Number(document.querySelector('#qr-logo-size').value) > 14;
  const note = document.querySelector('#qr-scan-note');
  note.textContent = lowContrast
    ? 'Контраст кольорів низький і може заважати скануванню. Оберіть темніший колір коду або світліший фон.'
    : decorativeRisk
      ? 'Декоративна форма чи великий логотип можуть ускладнити сканування. Перевірте файл кількома телефонами перед друком.'
      : 'Для кращого сканування залишайте високий контраст і невеликий логотип. Завжди перевіряйте готовий файл камерою.';
  note.classList.toggle('warning', lowContrast || decorativeRisk);
}

function invalidateGeneratorOutput() {
  if (!generatedQr) return;
  generatedQr = null;
  outputs.delete('nayuki');
  if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
  previewObjectUrl = '';
  generatorPreview.replaceChildren(generatorPlaceholder.cloneNode(true));
  document.querySelector('#preview-nayuki').replaceChildren();
  document.querySelector('[data-engine="nayuki"] .engine-state').textContent = 'Очікує дані';
  document.querySelector('#metrics-nayuki').replaceChildren();
  document.querySelectorAll('[data-generator-export]').forEach(button => { button.disabled = true; });
  generatorCaption.textContent = 'Дані змінено. Створіть QR-код ще раз і перевірте його камерою телефона.';
  generatorStatus.classList.remove('is-ready');
  generatorStatus.innerHTML = '<i></i> Потрібне оновлення';
}

function contrastRatio(foreground, background) {
  const luminance = hex => {
    const channels = hex.slice(1).match(/.{2}/g).map(value => parseInt(value, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
    return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2];
  };
  const a = luminance(foreground), b = luminance(background);
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
}
generatorForm.addEventListener('submit', async event => {
  event.preventDefault();
  generatorError.hidden = true;
  invalidateGeneratorOutput();
  const button = document.querySelector('#create-qr');
  const caption = document.querySelector('#result-caption');
  let value;
  try {
    value = readGeneratorValue();
    if (!value.trim()) throw new Error('Додайте інформацію, яку має відкрити QR-код.');
    if (bytes(value) > 1273) throw new Error('Забагато символів для надійного QR-коду. Скоротіть текст або використайте посилання.');
    if (generatorMode === 'url') {
      const url = new URL(value);
      const validWebUrl = ['http:', 'https:'].includes(url.protocol) && Boolean(url.hostname);
      const validPhone = url.protocol === 'tel:' && /^tel:\+?[0-9(). -]{6,20}$/i.test(value);
      const validEmail = url.protocol === 'mailto:' && /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(value);
      if (!validWebUrl && !validPhone && !validEmail) throw new Error('Вставте повне HTTPS-посилання або адресу телефону tel:+380... чи пошти mailto:hotel@example.ua.');
    }
    button.disabled = true;
    button.innerHTML = 'Створюємо код <span aria-hidden="true">…</span>';
    generatorStatus.classList.remove('is-ready');
    generatorStatus.innerHTML = '<i></i> Створюємо';
    const output = await createStyledOutput(value);
    showGeneratorOutput(output, value);
    trackQrStudioEvent('qr_studio_generate', {
      qr_content_type: generatorMode,
      qr_use_case: generatorUseCase || 'custom',
    });
  } catch (error) {
    generatorError.textContent = error.message || 'Не вдалося створити QR-код. Перевірте введені дані й спробуйте ще раз.';
    generatorError.hidden = false;
    generatorError.focus?.();
    generatorStatus.classList.remove('is-ready');
    generatorStatus.innerHTML = '<i></i> Перевірте дані';
  } finally {
    button.disabled = false;
    button.innerHTML = 'Створити QR-код <span aria-hidden="true">→</span>';
  }
});

function readGeneratorValue() {
  if (generatorMode === 'url') return document.querySelector('#url-value').value.trim();
  if (generatorMode === 'text') return document.querySelector('#text-value').value.trim();
  const network = document.querySelector('#wifi-name').value;
  const security = document.querySelector('#wifi-security').value;
  const password = security === 'nopass' ? '' : document.querySelector('#wifi-password').value;
  return buildWifiPayload({ ssid: network, password, security });

}

function bytes(value) { return new TextEncoder().encode(value).length; }
function toByteString(value) {
  const encoded = new TextEncoder().encode(value);
  let output = '';
  for (let index = 0; index < encoded.length; index++) output += String.fromCharCode(encoded[index]);
  return output;
}
function fmtMs(value) { return `${value.toFixed(2)} ms`; }
function fmtBytes(value) { return `${(value / 1024).toFixed(1)} KB`; }
function setCard(engine, state, metrics = '') {
  document.querySelector(`[data-engine="${engine}"] .engine-state`).textContent = state;
  document.querySelector(`#metrics-${engine}`).innerHTML = metrics;
}
function clearPreview(engine) {
  document.querySelector(`#preview-${engine}`).replaceChildren();
  outputs.delete(engine);
}
function assertPayload(value) {
  if (!value.trim()) throw new Error('Порожній payload. Додайте значення для QR.');
}

async function svgToPng(svg, dimension = 512) {
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.decoding = 'async';
    image.src = url;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = dimension;
    canvas.height = dimension;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.fillStyle = '#fff';
    context.fillRect(0, 0, dimension, dimension);
    context.drawImage(image, 0, 0, dimension, dimension);
    return canvas;
  } finally { URL.revokeObjectURL(url); }
}

function nayukiSvg(QrCode, payload) {
  const qr = QrCode.encodeText(payload, QrCode.Ecc.HIGH);
  const size = qr.size;
  const quiet = 4;
  let path = '';
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) if (qr.getModule(x, y)) path += `M${x + quiet},${y + quiet}h1v1h-1z`;
  }
  const dimension = size + quiet * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dimension} ${dimension}" width="512" height="512" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="${path}" fill="#21151f"/></svg>`;
}

async function createStyledOutput(payload) {
  const { qrcodegen } = await import('./vendor/nayuki/qrcodegen.ts');
  const qr = qrcodegen.QrCode.encodeText(payload, qrcodegen.QrCode.Ecc.HIGH);
  const size = qr.size;
  const foreground = document.querySelector('#qr-foreground').value;
  const background = document.querySelector('#qr-background').value;
  const moduleShape = document.querySelector('#qr-module-shape').value;
  const eyeShape = document.querySelector('#qr-eye-shape').value;
  const logoShape = document.querySelector('#qr-logo-shape').value;
  const logoPercent = Number(document.querySelector('#qr-logo-size').value);
  const title = document.querySelector('#qr-title').value.trim();
  const subtitle = document.querySelector('#qr-subtitle').value.trim();
  const labelColor = contrastRatio('#39233e', background) >= 4.5 ? '#39233e' : '#ffffff';
  const qrBox = { x: 91, y: 89, size: 330 };
  const unit = qrBox.size / (size + 8);
  const originX = qrBox.x + 4 * unit;
  const originY = qrBox.y + 4 * unit;
  const shape = (x, y, side, kind, fill) => {
    if (kind === 'dots' || kind === 'circle') return `<circle cx="${(x + side / 2).toFixed(2)}" cy="${(y + side / 2).toFixed(2)}" r="${(side / 2).toFixed(2)}" fill="${fill}"/>`;
    const radius = kind === 'rounded' ? side * .32 : 0;
    return `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${side.toFixed(2)}" height="${side.toFixed(2)}" rx="${radius.toFixed(2)}" fill="${fill}"/>`;
  };
  let modules = '';
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const isFinder = (x < 8 && y < 8) || (x >= size - 8 && y < 8) || (x < 8 && y >= size - 8);
      if (isFinder || !qr.getModule(x, y)) continue;
      modules += shape(originX + x * unit, originY + y * unit, unit * .94, moduleShape, foreground);
    }
  }
  let eyes = '';
  const corners = [[0, 0], [size - 7, 0], [0, size - 7]];
  for (const [x, y] of corners) {
    const left = originX + x * unit, top = originY + y * unit;
    eyes += shape(left, top, 7 * unit, eyeShape, foreground);
    eyes += shape(left + unit, top + unit, 5 * unit, eyeShape, background);
    eyes += shape(left + 2 * unit, top + 2 * unit, 3 * unit, eyeShape, foreground);
  }
  const logoSide = (size * unit) * logoPercent / 100;
  const logoX = originX + size * unit / 2 - logoSide / 2;
  const logoY = originY + size * unit / 2 - logoSide / 2;
  let logo = '';
  if (logoDataUrl) {
    const plateSide = logoSide * 1.34;
    logo += shape(originX + size * unit / 2 - plateSide / 2, originY + size * unit / 2 - plateSide / 2, plateSide, logoShape, background);
    logo += `<image href="${logoDataUrl}" x="${logoX.toFixed(2)}" y="${logoY.toFixed(2)}" width="${logoSide.toFixed(2)}" height="${logoSide.toFixed(2)}" preserveAspectRatio="xMidYMid meet"/>`;
  }
  const xmlText = value => escapeHtml(value).replace(/&#39;/g, '&apos;');
  const photo = photoDataUrl
    ? `<image href="${photoDataUrl}" x="0" y="0" width="512" height="512" preserveAspectRatio="xMidYMid slice"/><rect width="512" height="512" fill="#fff" opacity=".64"/>`
    : '<rect width="512" height="512" fill="#f7f1f5"/>';
  const titleSvg = title ? `<text x="256" y="70" text-anchor="middle" fill="${labelColor}" font-family="Arial,sans-serif" font-size="17" font-weight="700">${xmlText(title)}</text>` : '';
  const subtitleSvg = subtitle ? `<text x="256" y="450" text-anchor="middle" fill="${labelColor}" opacity=".76" font-family="Arial,sans-serif" font-size="12">${xmlText(subtitle)}</text>` : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" width="1024" height="1024" shape-rendering="geometricPrecision">${photo}<rect x="54" y="32" width="404" height="448" rx="24" fill="${background}"/><rect x="54" y="32" width="404" height="448" rx="24" fill="none" stroke="#e7dce5" stroke-width="1"/>${titleSvg}<rect x="${qrBox.x}" y="${qrBox.y}" width="${qrBox.size}" height="${qrBox.size}" fill="${background}"/>${modules}${eyes}${logo}${subtitleSvg}</svg>`;
  const canvas = await svgToPng(svg, 1024);
  const pngBlob = await new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG export failed')), 'image/png'));
  return { engine: 'nayuki', payload, svg, canvas, svgCanvas: canvas, pngBlob, elapsed: 0, modules: `${size} × ${size}`, generatedAt: performance.now() };
}

async function createOutput(engine, payload) {
  const start = performance.now();
  let svg;
  let canvas;
  let modules = 'n/a';

  if (engine === 'styling') {
    const { default: QRCodeStyling } = await import('qr-code-styling');
    const QRCode = (await import('qrcode')).default;
    const moduleCount = QRCode.create(payload, { errorCorrectionLevel: 'H' }).modules.size;
    const styled = document.querySelector('#style-toggle').checked;
    const qr = new QRCodeStyling({
      width: 512, height: 512, type: 'svg', data: toByteString(payload),
      margin: 4 * 512 / (moduleCount + 8), qrOptions: { errorCorrectionLevel: 'H' },
      dotsOptions: styled ? { color: '#5a2050', type: 'rounded' } : { color: '#21151f', type: 'square' },
      cornersSquareOptions: { color: styled ? '#d72f79' : '#21151f', type: styled ? 'extra-rounded' : 'square' },
      cornersDotOptions: { color: '#21151f', type: 'square' },
      backgroundOptions: { color: '#ffffff' },
    });
    const mount = document.createElement('div');
    mount.className = 'offscreen-render';
    document.body.append(mount);
    qr.append(mount);
    const svgBlob = await qr.getRawData('svg');
    svg = await svgBlob.text();
    canvas = await svgToPng(svg);
    mount.remove();
  } else if (engine === 'qrcode') {
    const QRCode = (await import('qrcode')).default;
    const svgDoc = await QRCode.toString(payload, { type: 'svg', errorCorrectionLevel: 'H', margin: 4, color: { dark: '#21151f', light: '#ffffff' } });
    svg = svgDoc;
    canvas = document.createElement('canvas');
    await QRCode.toCanvas(canvas, payload, { errorCorrectionLevel: 'H', margin: 4, width: 512, color: { dark: '#21151f', light: '#ffffff' } });
  } else {
    const { qrcodegen } = await import('./vendor/nayuki/qrcodegen.ts');
    svg = nayukiSvg(qrcodegen.QrCode, payload);
    canvas = await svgToPng(svg);
    const qr = qrcodegen.QrCode.encodeText(payload, qrcodegen.QrCode.Ecc.HIGH);
    modules = `${qr.size} × ${qr.size}`;
  }

  const svgCanvas = engine === 'styling' || engine === 'nayuki' ? canvas : await svgToPng(svg);

  const elapsed = performance.now() - start;
  const pngBlob = await new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG export failed')), 'image/png'));
  return { engine, payload, svg, canvas, svgCanvas, pngBlob, elapsed, modules, generatedAt: performance.now() };
}

async function runEngine(engine, payload) {
  clearPreview(engine);
  setCard(engine, 'Генеруємо…');
  try {
    const output = await createOutput(engine, payload);
    outputs.set(engine, output);
    const preview = document.querySelector(`#preview-${engine}`);
    const image = new Image();
    image.alt = `QR-код, згенерований ${engine}`;
    image.src = URL.createObjectURL(output.pngBlob);
    image.onload = () => URL.revokeObjectURL(image.src);
    preview.append(image);
    setCard(engine, 'Готово', `<span>Рендер: ${fmtMs(output.elapsed)}</span><span>PNG: ${fmtBytes(output.pngBlob.size)}</span><span>SVG: ${fmtBytes(new Blob([output.svg]).size)}</span><span>ECC: H</span>${output.modules !== 'n/a' ? `<span>Матриця: ${output.modules}</span>` : ''}`);
    return { ok: true, elapsed: output.elapsed, pngBytes: output.pngBlob.size, svgBytes: new Blob([output.svg]).size };
  } catch (error) {
    setCard(engine, 'Помилка', `<span class="error-text">${escapeHtml(error.message)}</span>`);
    document.querySelector(`#preview-${engine}`).innerHTML = '<span class="invalid-mark">Не створено</span>';
    return { ok: false, error: error.message };
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

async function decodeBoth(canvas) {
  const nimiq = await Promise.resolve().then(async () => {
    const { default: QrScanner } = await import('qr-scanner');
    const { default: workerUrl } = await import('qr-scanner/qr-scanner-worker.min.js?url');
    QrScanner.WORKER_PATH = workerUrl;
    const result = await QrScanner.scanImage(cloneCanvas(canvas), { returnDetailedScanResult: true });
    return result.data;
  }).then(value => ({ status: 'fulfilled', value }), reason => ({ status: 'rejected', reason }));
  const zxing = await Promise.resolve().then(async () => {
    const { BrowserQRCodeReader } = await import('@zxing/browser');
    const reader = new BrowserQRCodeReader();
    const result = await reader.decodeFromCanvas(cloneCanvas(canvas));
    return result.getText();
  }).then(value => ({ status: 'fulfilled', value }), reason => ({ status: 'rejected', reason }));
  return {
    nimiq: nimiq.status === 'fulfilled' ? { ok: true, data: nimiq.value } : { ok: false, error: String(nimiq.reason?.message || nimiq.reason) },
    zxing: zxing.status === 'fulfilled' ? { ok: true, data: zxing.value } : { ok: false, error: String(zxing.reason?.message || zxing.reason) },
  };
}
function cloneCanvas(source) {
  const copy = document.createElement('canvas');
  copy.width = source.width; copy.height = source.height;
  copy.getContext('2d', { willReadFrequently: true }).drawImage(source, 0, 0);
  return copy;
}

async function runCurrent({ record = true } = {}) {
  const scenario = scenarioSelect.value;
  const payload = payloadInput.value;
  lastScenario = scenario;
  if (!payload.trim()) {
    labStatus.textContent = 'Очікувано: порожній payload відхилений до запуску генераторів.';
    engines.forEach(engine => { clearPreview(engine); setCard(engine, 'Відхилено', '<span class="error-text">Порожній payload</span>'); document.querySelector(`#scan-${engine}`).textContent = 'Не застосовується'; });
    const rejected = { scenario, bytes: 0, valid: false, generated: engines.map(() => ({ ok: false, error: 'порожній payload' })), scans: engines.map(() => ({ exact: { nimiq: false, zxing: false } })) };
    if (record) addMatrixRow(rejected);
    return rejected;
  }
  if (bytes(payload) > 1273) {
    labStatus.textContent = `Очікувано: ${bytes(payload)} байтів перевищує консервативну межу UTF-8 для QR з ECC H. Перевіряємо, чи кожен рушій коректно повідомить про помилку.`;
  } else labStatus.textContent = `Генерація ${bytes(payload)} байтів. Вміст не відправляється мережею.`;

  const generated = await Promise.all(engines.map(engine => runEngine(engine, payload)));
  const scans = await Promise.all(engines.map(async engine => {
    const output = outputs.get(engine);
    const el = document.querySelector(`#scan-${engine}`);
    if (!output) { el.textContent = 'QR відхилений рушієм'; return { nimiq: { ok: false }, zxing: { ok: false } }; }
    el.textContent = 'Декодуємо двома бібліотеками…';
    const decoded = await decodeBoth(output.canvas);
    const expected = payload;
    const okNimiq = decoded.nimiq.ok && decoded.nimiq.data === expected;
    const okZxing = decoded.zxing.ok && decoded.zxing.data === expected;
    el.textContent = `qr-scanner: ${decoded.nimiq.ok ? (okNimiq ? 'точний збіг' : 'НЕ ЗБІГАЄТЬСЯ') : 'не розпізнав'} · ZXing: ${decoded.zxing.ok ? (okZxing ? 'точний збіг' : 'НЕ ЗБІГАЄТЬСЯ') : 'не розпізнав'}`;
    el.dataset.ok = String(okNimiq && okZxing);
    return { ...decoded, exact: { nimiq: okNimiq, zxing: okZxing } };
  }));
  const result = { scenario, bytes: bytes(payload), generated, scans, valid: bytes(payload) <= 1273 };
  if (record) addMatrixRow(result);
  labStatus.textContent = `Завершено: ${generated.filter(item => item.ok).length}/3 рушіїв створили QR. Два декодери перевірили кожен створений PNG.`;
  return result;
}

function addMatrixRow(result) {
  const body = document.querySelector('#matrix-results');
  if (body.querySelector('td[colspan]')) body.replaceChildren();
  const row = document.createElement('tr');
  const cells = [
    `${scenarioSelect.selectedOptions[0].text} (${result.bytes} Б)`,
    engineStatus(result, 0), engineStatus(result, 1), engineStatus(result, 2),
    result.scans.map(scan => `${scan.exact?.nimiq ? 'N✓' : 'N×'} ${scan.exact?.zxing ? 'Z✓' : 'Z×'}`).join(' · '),
  ];
  cells.forEach(value => { const td = document.createElement('td'); td.textContent = value; row.append(td); });
  body.prepend(row);
}
function engineStatus(result, index) {
  const current = result.generated[index];
  if (!current.ok) return `відхилено: ${current.error}`;
  const scan = result.scans[index]?.exact;
  return `QR ✓ · ${fmtMs(current.elapsed)} · ${scan?.nimiq && scan?.zxing ? 'скан ✓' : 'скан !'}`;
}

async function runMatrix() {
  const button = document.querySelector('#run-matrix');
  button.disabled = true;
  const outcomes = [];
  try {
    for (const key of ['short', 'utm', 'ukrainian', 'idn', 'wifi', 'empty', 'long']) {
      scenarioSelect.value = key;
      payloadInput.value = scenarios[key];
      outcomes.push(await runCurrent());
    }
    window.qrLab.lastMatrix = outcomes;
    labStatus.textContent = `Матриця завершена: ${outcomes.length} сценаріїв. Негативні сценарії мають бути відхилені, решта перевірені обома декодерами.`;
  } finally { button.disabled = false; }
}

async function exportFile(engine, format, fontDataBase64 = '') {
  const output = outputs.get(engine);
  if (!output) { labStatus.textContent = 'Спершу згенеруйте QR для поточного payload.'; return; }
  const size = Number(document.querySelector('#export-size').value);
  if (![512, 1024, 2048].includes(size)) throw new Error('Оберіть один із доступних розмірів файлу.');
  if (format === 'svg') {
    const svg = output.svg.replace(/width="\d+" height="\d+"/, `width="${size}" height="${size}"`);
    return download(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), `vdalo-qr-${size}x${size}.svg`);
  }
  const rasterCanvas = await svgToPng(output.svg, size);
  if (['png', 'jpg', 'webp'].includes(format)) {
    const mimeType = format === 'jpg' ? 'image/jpeg' : `image/${format}`;
    const blob = await new Promise((resolve, reject) => rasterCanvas.toBlob(value => value ? resolve(value) : reject(new Error('Не вдалося створити файл зображення.')), mimeType, .94));
    if (blob.type !== mimeType) throw new Error(`Браузер не підтримує формат ${format.toUpperCase()}. Оберіть PNG або SVG.`);
    const extension = format === 'jpg' ? 'jpg' : format;
    return download(blob, `vdalo-qr-${size}x${size}.${extension}`);
  }
  const { PDFDocument, rgb } = await import('pdf-lib');
  const documentPdf = await PDFDocument.create();
  const isGeneratorOutput = engine === 'nayuki';
  const page = documentPdf.addPage(isGeneratorOutput ? [595, 842] : [420, 560]);
  const image = await documentPdf.embedPng(await new Promise((resolve, reject) => rasterCanvas.toBlob(blob => blob ? resolve(blob.arrayBuffer()) : reject(new Error('Не вдалося підготувати зображення для PDF.')), 'image/png')));
  if (isGeneratorOutput) {
    page.drawImage(image, { x: 42, y: 166, width: 511, height: 511 });
    page.drawText('VDALO QR', { x: 42, y: 713, size: 16, color: rgb(0.22, 0.14, 0.24) });
    page.drawText(`PNG source ${size} x ${size} px`, { x: 42, y: 143, size: 10, color: rgb(0.48, 0.42, 0.49) });
  } else if (fontDataBase64) {
    const fontkit = (await import('@pdf-lib/fontkit')).default;
    documentPdf.registerFontkit(fontkit);
    const fontBytes = Uint8Array.from(atob(fontDataBase64), char => char.charCodeAt(0));
    const font = await documentPdf.embedFont(fontBytes, { subset: true });
    page.drawText('VDALO · Гостьова сторінка', { x: 58, y: 500, size: 18, font, color: rgb(0.14, 0.08, 0.15) });
    page.drawText('Відкрийте камерою телефона', { x: 76, y: 470, size: 14, font, color: rgb(0.14, 0.08, 0.15) });
    page.drawText('Підготовлено для друку', { x: 126, y: 120, size: 12, font, color: rgb(0.40, 0.35, 0.41) });
  } else {
    page.drawImage(image, { x: 70, y: 150, width: 280, height: 280 });
    page.drawText('QR-картка VDALO', { x: 154, y: 500, size: 18, color: rgb(0.14, 0.08, 0.15) });
  }
  const pdfBytes = await documentPdf.save();
  const filename = `vdalo-qr-${size}x${size}.pdf`;
  download(new Blob([pdfBytes], { type: 'application/pdf' }), filename);
  labStatus.textContent = fontDataBase64 ? 'PDF сформовано з вбудованим шрифтом і текстом українською.' : 'PDF підготовлено для друку.';
  return filename;
}
function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement('a'), { href: url, download: filename });
  link.click();
  setTimeout(() => { link.remove(); URL.revokeObjectURL(url); }, 1500);
  return filename;
}

window.qrLab = {
  scenarios,
  runMatrix,
  async generateForScenario(key) {
    scenarioSelect.value = key;
    payloadInput.value = scenarios[key];
    return runCurrent({ record: true });
  },
  async generatePayload(key, payload) {
    scenarioSelect.value = key;
    payloadInput.value = payload;
    return runCurrent({ record: true });
  },
  async exportAllPdf() {
    const current = lastScenario || 'short';
    for (const engine of engines) await exportFile(engine, 'pdf');
    return { exported: engines.length, scenario: current };
  },
  async scanPreviewFormats(engine) {
    const output = outputs.get(engine);
    if (!output) return null;
    const png = await decodeBoth(output.canvas);
    const svg = await decodeBoth(output.svgCanvas);
    return {
      expected: output.payload,
      png: { qrScannerExact: png.nimiq.ok && png.nimiq.data === output.payload, zxingExact: svgSafeExact(png.zxing, output.payload) },
      svg: { qrScannerExact: svg.nimiq.ok && svg.nimiq.data === output.payload, zxingExact: svgSafeExact(svg.zxing, output.payload) },
    };
  },
  async exportPdfWithFont(engine, fontDataBase64) { return exportFile(engine, 'pdf', fontDataBase64); },
  async generateStyledShortAndScan() {
    document.querySelector('#style-toggle').checked = true;
    const result = await runEngine('styling', scenarios.short);
    return { generation: result, scans: await this.scanPreviewFormats('styling') };
  },
  async benchmark() {
    const keys = ['short', 'utm', 'ukrainian'];
    const measurements = {};
    for (const engine of engines) {
      measurements[engine] = {};
      for (const key of keys) {
        const payload = scenarios[key];
        const samples = [];
        for (let i = 0; i < 15; i++) {
          const result = await createOutput(engine, payload);
          if (i >= 3) samples.push(result.elapsed);
        }
        const sorted = samples.sort((a, b) => a - b);
        measurements[engine][key] = { n: sorted.length, medianMs: sorted[Math.floor(sorted.length * 0.5)], p95Ms: sorted[Math.ceil(sorted.length * 0.95) - 1] };
      }
    }
    return measurements;
  },
  async scanPreview(engine) { const item = outputs.get(engine); return item ? decodeBoth(item.canvas) : null; },
  async inspectStylingInternals() {
    const { default: QRCodeStyling } = await import('qr-code-styling');
    const instance = new QRCodeStyling({ width: 256, height: 256, data: scenarios.ukrainian, qrOptions: { errorCorrectionLevel: 'H', mode: 'Byte' } });
    const qr = instance._qr;
    return { instanceKeys: Object.keys(instance), qrKeys: qr ? Object.keys(qr) : [], constructorKeys: qr?.constructor ? Object.keys(qr.constructor) : [], prototypeKeys: qr ? Object.getOwnPropertyNames(Object.getPrototypeOf(qr)) : [] };
  },
  readUi() { return { title: document.title, header: document.querySelector('h1')?.textContent, status: labStatus.textContent }; },
};

function svgSafeExact(result, expected) { return result.ok && result.data === expected; }
