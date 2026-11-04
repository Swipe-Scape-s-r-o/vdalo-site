(() => {
  const configNode = document.getElementById('free-config');
  const form = document.getElementById('free-lead-form');
  if (!configNode || !form) return;

  const config = JSON.parse(configNode.textContent);
  const query = new URLSearchParams(location.search);
  const variant = config.variant;
  const safeValue = value => String(value || '').slice(0, 150);
  const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'message_variant'];
  const current = Object.fromEntries(keys.map(key => [key, safeValue(query.get(key) || (key === 'message_variant' ? variant : ''))]).filter(([, value]) => value));
  let attribution = {first_touch: current, last_touch: current, entry_offer: config.offerId, first_touch_at: new Date().toISOString()};
  try {
    const saved = JSON.parse(localStorage.getItem('vdalo-free-attribution-v1') || 'null');
    const validSaved = saved && Date.now() - Number(saved.savedAt) < 30 * 86400000;
    if (validSaved) attribution = {...saved.value, last_touch: Object.keys(current).length ? current : saved.value.last_touch};
    localStorage.setItem('vdalo-free-attribution-v1', JSON.stringify({savedAt: validSaved ? saved.savedAt : Date.now(), value: attribution}));
  } catch {}

  const track = (event, extra = {}) => {
    const payload = {event, brand: 'VDALO', offer_id: config.offerId, landing_route: '/free', variant, ...current, ...extra};
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);
    if (typeof window.gtag === 'function') window.gtag('event', event, {send_to: 'G-ST38L6GRRM', brand: 'VDALO', funnel: 'free', variant, ...extra});
  };

  const name = form.elements.name;
  const phone = form.elements.contact;
  const rooms = form.elements.rooms;
  const property = form.elements.property;
  const propertyType = form.elements.property_type;
  const consent = form.elements.consent;
  const error = document.getElementById('free-error');
  const success = document.getElementById('free-success');
  const status = document.getElementById('free-status');
  const button = form.querySelector('button[type="submit"]');
  const buttonLabel = button.querySelector('.free-submit-label');
  const bigNote = document.getElementById('free-big-note');
  const intent = document.getElementById('free-intent');
  let callbackRequested = false;
  let bigEventSent = false;

  const sticky = document.querySelector('.free-sticky-cta');
  const hero = document.querySelector('.free-hero');
  const formSection = document.getElementById('free-form');
  if (sticky && hero && formSection) {
    const updateSticky = () => {
      const pastHero = hero.getBoundingClientRect().bottom <= 0;
      const beforeForm = formSection.getBoundingClientRect().top > window.innerHeight;
      sticky.hidden = !(window.innerWidth <= 680 && pastHero && beforeForm);
    };
    window.addEventListener('scroll', updateSticky, {passive:true});
    window.addEventListener('resize', updateSticky);
    updateSticky();
  }

  track('free_view');
  document.querySelectorAll('[data-free-cta]').forEach(link => link.addEventListener('click', () => {
    callbackRequested = false;
    intent.hidden = true;
    track('free_cta_click', {location: link.dataset.freeCta});
  }));
  document.querySelectorAll('[data-free-callback]').forEach(link => link.addEventListener('click', () => {
    callbackRequested = true;
    intent.hidden = false;
    track('free_cta_click', {location: 'help'});
    track('free_callback');
  }));
  document.querySelectorAll('[data-faq]').forEach(item => item.addEventListener('toggle', () => {
    if (item.open) track('free_faq_open', {question_id: item.dataset.faq});
  }));

  const fieldErrors = [
    [name, 'free-name-error'],
    [property, 'free-property-error'],
    [propertyType, 'free-type-error'],
    [rooms, 'free-rooms-error'],
    [phone, 'free-phone-error'],
    [consent, 'free-consent-error']
  ];
  const clearFieldError = (field, errorId) => {
    field.removeAttribute('aria-invalid');
    document.getElementById(errorId).textContent = '';
  };
  const clearOnEdit = (field, errorId) => {
    clearFieldError(field, errorId);
    if (error.textContent === 'Перевірте виділені поля.' &&
        !fieldErrors.some(([item]) => item.getAttribute('aria-invalid') === 'true')) error.textContent = '';
  };
  fieldErrors.forEach(([field, errorId]) => {
    field.addEventListener('input', () => clearOnEdit(field, errorId));
    field.addEventListener('change', () => clearOnEdit(field, errorId));
  });
  rooms.addEventListener('input', () => {
    const isBig = Number(rooms.value) > 10;
    bigNote.hidden = !isBig;
    if (isBig && !bigEventSent) { track('free_big'); bigEventSent = true; }
    if (!isBig) bigEventSent = false;
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    error.textContent = '';
    fieldErrors.forEach(([field, errorId]) => clearFieldError(field, errorId));
    const issues = [];
    const issue = (field, errorId, message) => issues.push({field, errorId, message});
    if (name.value.trim().length < 2) issue(name, 'free-name-error', 'Вкажіть ваше ім’я, щонайменше 2 символи.');
    if (property.value.trim().length < 2) issue(property, 'free-property-error', 'Вкажіть назву об’єкта, щонайменше 2 символи.');
    if (!propertyType.value) issue(propertyType, 'free-type-error', 'Оберіть тип об’єкта.');
    if (!/^\d{1,5}$/.test(rooms.value) || Number(rooms.value) < 1) issue(rooms, 'free-rooms-error', 'Вкажіть кількість від 1 до 99999.');
    const phoneDigits = phone.value.replace(/\D/g, '').length;
    if (!/^[+()\d\s.-]+$/.test(phone.value) || phoneDigits < 9 || phoneDigits > 15) issue(phone, 'free-phone-error', 'Вкажіть коректний номер телефону.');
    if (!consent.checked) issue(consent, 'free-consent-error', 'Потрібна згода, щоб команда могла відповісти на запит.');
    if (issues.length) {
      issues.forEach(({field, errorId, message}) => {
        field.setAttribute('aria-invalid', 'true');
        document.getElementById(errorId).textContent = message;
      });
      error.textContent = 'Перевірте виділені поля.';
      track('free_form_error', {reason: 'validation'});
      issues[0].field.focus();
      return;
    }

    const callbackLabel = {any:'у зручний час', today:'сьогодні', evening:'сьогодні ввечері', tomorrow:'завтра зранку'}[form.elements.callback_time.value] || 'у зручний час';
    const isBig = Number(rooms.value) > 10;
    if (isBig && !bigEventSent) track('free_big');
    const note = ['Варіант ' + variant.toUpperCase() + '.', isBig ? 'Запит для об’єкта від 11 номерів.' : '', callbackRequested ? 'Потрібна допомога з налаштуванням.' : '', 'Бажаний час розмови: ' + callbackLabel + '.'].filter(Boolean).join(' ');
    const body = {
      offer_id: config.offerId, name: name.value.trim(), property: property.value.trim(),
      contact: phone.value.trim(), property_type: propertyType.value, rooms: String(Number(rooms.value)),
      city: '', note, consent: true, website: form.elements.website.value, attribution
    };

    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    buttonLabel.textContent = 'Надсилаємо…';
    track('free_submit_attempt');
    try {
      const response = await fetch(config.endpoint, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)});
      let result;
      try { result = await response.json(); } catch { throw new Error('Не вдалося надіслати заявку. Спробуйте ще раз.'); }
      if (!response.ok || result.ok !== true) throw new Error(result.message || Object.values(result.errors || {})[0] || 'Не вдалося надіслати заявку. Спробуйте ще раз.');
      track('free_step1');
      track('free_lead_success');
      status.textContent = name.value.trim() + ', команду VDALO повідомлено. Ми зв’яжемося з вами, щоб обговорити підключення.';
      form.hidden = true;
      success.hidden = false;
      success.focus();
    } catch (err) {
      error.textContent = err.message === 'Failed to fetch' ? 'Немає зв’язку із сервером. Перевірте інтернет і спробуйте ще раз.' : err.message;
      track('free_form_error', {reason:'delivery'});
    } finally {
      button.disabled = false;
      button.removeAttribute('aria-busy');
      buttonLabel.textContent = 'Надіслати заявку';
    }
  });
})();
