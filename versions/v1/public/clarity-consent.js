(() => {
  'use strict';
  const storageKey = 'vdalo-cookie-preferences', version = 2, lifetime = 180 * 86400000;
  const googleId = 'G-ST38L6GRRM';
  const emptyChoice = () => ({analytics: false, replay: false});
  const readChoice = () => {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey));
      if (value?.version !== version || typeof value.analytics !== 'boolean' || typeof value.replay !== 'boolean' ||
          !Number.isFinite(value.updatedAt) || value.updatedAt > Date.now() || Date.now() - value.updatedAt >= lifetime) return null;
      return value;
    } catch { return null; }
  };
  let choice = readChoice(), clarityLoaded = false, ui, focusBeforeSettings;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  const googleConsent = preferences => ({analytics_storage: preferences.analytics ? 'granted' : 'denied',
    ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'});
  // Synchronous before the consent-gated GTM bootstrap, including on return visits.
  window[`ga-disable-${googleId}`] = !choice?.analytics;
  window.gtag('consent', 'default', googleConsent(choice || emptyChoice()));
  window.gtag('set', 'ads_data_redaction', true);
  const clarityConsent = granted => {
    if (typeof window.clarity !== 'function') return;
    window.clarity('consentv2', {ad_Storage: 'denied', analytics_Storage: granted ? 'granted' : 'denied'});
    if (!granted) window.clarity('consent', false);
  };
  const loadClarity = () => {
    if (clarityLoaded) return;
    clarityLoaded = true;
    window.clarity = window.clarity || function (...args) { (window.clarity.q = window.clarity.q || []).push(args); };
    clarityConsent(true);
    const script = document.createElement('script');
    script.async = true; script.src = 'https://www.clarity.ms/tag/z199c8oakv'; document.head.appendChild(script);
  };
  const clearMeasurementCookies = preferences => {
    // Preserve functional storage, forms and site tools. Third-party cookies are not accessible here.
    if (!preferences.analytics) try {
      for (let index = localStorage.length - 1; index >= 0; index--) { const key = localStorage.key(index); if (/^vdalo-robot-video:/.test(key)) localStorage.removeItem(key); }
    } catch {}
    const names = document.cookie.split(';').map(item => item.trim().split('=')[0]).filter(name =>
      (!preferences.analytics && /^(?:_ga(?:_|$)|_gid$|_gat(?:_|$)|_gcl_)/.test(name)) ||
      (!preferences.replay && /^_cl(?:ck|sk)$/.test(name)));
    const host = location.hostname, domains = ['', host, ...(host.endsWith('.vdalo.tech') || host === 'vdalo.tech' ? ['vdalo.tech'] : [])];
    const paths = new Set(['/']), segments = location.pathname.split('/').filter(Boolean);
    while (segments.length) { const path = '/' + segments.join('/'); paths.add(path); paths.add(path + '/'); segments.pop(); }
    for (const name of names) for (const domain of domains) for (const path of paths)
      document.cookie = `${name}=; Max-Age=0; Path=${path}; SameSite=Lax${domain ? `; Domain=${domain}` : ''}${location.protocol === 'https:' ? '; Secure' : ''}`;
  };
  const needsReload = next => (!!window.__vdaloGoogleTagsLoaded && !!choice?.analytics && !next.analytics) || (clarityLoaded && !!choice?.replay && !next.replay);
  const discardPendingMeasurements = () => {
    // Do not replay visitor interactions performed before analytics consent.
    const pending = window.dataLayer;
    for (let index = pending.length - 1; index >= 0; index--) {
      const item = pending[index];
      if (item?.[0] === 'event' || (typeof item?.event === 'string' && !item.event.startsWith('gtm.'))) pending.splice(index, 1);
    }
  };
  const updateServices = next => {
    window[`ga-disable-${googleId}`] = !next.analytics;
    window.gtag('consent', 'update', googleConsent(next));
    if (next.analytics && !window.__vdaloGoogleTagsLoaded) { discardPendingMeasurements(); window.__vdaloLoadGoogleTags?.(); }
    if (next.replay) loadClarity(); else clarityConsent(false);
    clearMeasurementCookies(next);
  };
  const setBannerVisible = visible => {
    if (!ui) return;
    ui.banner.hidden = !visible;
    document.body.classList.toggle('has-cookie-banner', visible);
    if (visible) document.documentElement.style.setProperty('--cookie-banner-space', `${ui.banner.getBoundingClientRect().height + 24}px`);
  };
  const closeSettings = () => {
    if (ui.dialog.open) ui.dialog.close();
    if (focusBeforeSettings?.isConnected && focusBeforeSettings.getClientRects().length) focusBeforeSettings.focus({preventScroll: true});
  };
  const saveChoice = preferences => {
    const next = {version, analytics: !!preferences.analytics, replay: !!preferences.replay, updatedAt: Date.now()}, reload = needsReload(next);
    let saved = true;
    try { localStorage.setItem(storageKey, JSON.stringify(next)); localStorage.removeItem('vdalo-clarity-consent'); } catch { saved = false; }
    choice = next; updateServices(next); setBannerVisible(false); closeSettings();
    ui.status.textContent = saved ? 'Налаштування cookie збережено.' : 'Вибір застосовано до цієї сторінки. Браузер не дозволив зберегти його для наступного відвідування.';
    window.dispatchEvent(new CustomEvent('vdalo:consent-change', {detail: {analytics: next.analytics, replay: next.replay}}));
    // Remove already running trackers only after an explicit withdrawal.
    if (reload) location.reload();
  };
  const updateSaveLabel = () => { ui.save.textContent = needsReload({analytics: ui.analytics.checked, replay: ui.replay.checked}) ? 'Зберегти та оновити' : 'Зберегти вибір'; };
  const openSettings = () => {
    if (!ui) return;
    focusBeforeSettings = document.activeElement;
    ui.analytics.checked = !!choice?.analytics; ui.replay.checked = !!choice?.replay;
    ui.dialog.showModal(); updateSaveLabel();
  };
  window.vdaloConsent = Object.freeze({getPreferences: () => ({...(choice || emptyChoice())}), openSettings});
  if (choice?.replay) loadClarity();
  if (!choice?.analytics || !choice?.replay) clearMeasurementCookies(choice || emptyChoice());
  const mount = () => {
    const banner = document.createElement('section'); banner.className = 'cookie-consent'; banner.setAttribute('aria-label', 'Вибір cookie'); banner.hidden = true;
    banner.innerHTML = `<div class="cookie-consent-copy"><strong><span aria-hidden="true">◉</span> Ваші cookie, ваш вибір</strong><p>Статистика та запис взаємодій тільки за вашою згодою. <a href="/privacy#cookie-preferences">Деталі</a></p></div><div class="cookie-consent-actions"><button type="button" class="cookie-accept" data-cookie-accept>Погодитися</button><button type="button" data-cookie-settings aria-haspopup="dialog">Налаштування</button><button type="button" class="cookie-reject" data-cookie-reject>Лише необхідні</button></div>`;
    const dialog = document.createElement('dialog'); dialog.className = 'cookie-dialog'; dialog.id = 'cookie-settings'; dialog.setAttribute('aria-labelledby', 'cookie-settings-title'); dialog.setAttribute('aria-describedby', 'cookie-settings-intro');
    dialog.innerHTML = `<header class="cookie-dialog-header"><div><p class="cookie-eyebrow">ВАША ПРИВАТНІСТЬ</p><h2 id="cookie-settings-title">Налаштування cookie</h2></div><button type="button" class="cookie-close" aria-label="Закрити налаштування cookie">×</button></header>
      <div class="cookie-dialog-body"><p id="cookie-settings-intro">Виберіть, що дозволити. Сайт і форми працюють, навіть якщо залишити лише необхідні.</p>
      <section class="cookie-category"><div class="cookie-category-heading"><h3>Необхідні</h3><span class="cookie-always">Завжди активні</span></div><p>Зберігають ваш вибір cookie та потрібні для запитаних вами функцій сайту. Їх не використовуємо для аналітики.</p></section>
      <label class="cookie-category cookie-option"><span class="cookie-category-heading"><strong id="cookie-analytics-label">Статистика відвідувань</strong><input type="checkbox" id="cookie-analytics" role="switch" aria-labelledby="cookie-analytics-label" aria-describedby="cookie-analytics-info"><span class="cookie-switch" aria-hidden="true"></span></span><span id="cookie-analytics-info">Google Analytics 4: перегляди сторінок, переходи та натискання. Використовує cookie _ga та _ga_*.</span></label>
      <label class="cookie-category cookie-option"><span class="cookie-category-heading"><strong id="cookie-replay-label">Запис взаємодій</strong><input type="checkbox" id="cookie-replay" role="switch" aria-labelledby="cookie-replay-label" aria-describedby="cookie-replay-info"><span class="cookie-switch" aria-hidden="true"></span></span><span id="cookie-replay-info">Microsoft Clarity: прокручування та взаємодія з блоками сайту. Вміст форм маскується. Використовує cookie _clck та _clsk.</span></label>
      <p class="cookie-details">Вибір зберігаємо на цьому пристрої до 180 днів. Змінити його можна через «Налаштування cookie» внизу сторінки. Після відкликання вже наданої згоди сторінка оновиться, щоб зупинити завантажені інструменти.</p><a class="cookie-policy" href="/privacy#cookie-preferences">Політика конфіденційності ↗</a></div>
      <footer class="cookie-dialog-footer"><div><button type="button" class="cookie-accept" data-cookie-accept>Дозволити всі</button><button type="button" data-cookie-save>Зберегти вибір</button></div><button type="button" class="cookie-reject" data-cookie-reject>Лише необхідні</button></footer>`;
    const status = document.createElement('div'); status.className = 'cookie-status'; status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
    document.body.append(banner, dialog, status);
    ui = {banner, dialog, status, analytics: dialog.querySelector('#cookie-analytics'), replay: dialog.querySelector('#cookie-replay'), save: dialog.querySelector('[data-cookie-save]')};
    // Older quiz and offer layouts do not share the main site's footer.
    if (!document.querySelector('[data-open-cookie-settings]')) {
      const footer = document.querySelector('footer'), reopen = document.createElement('button');
      reopen.type = 'button'; reopen.textContent = 'Налаштування cookie'; reopen.setAttribute('data-open-cookie-settings', '');
      reopen.className = footer ? 'cookie-preferences-link' : 'cookie-preferences-link cookie-preferences-floating';
      (footer || document.body).appendChild(reopen);
    }
    for (const root of [banner, dialog]) {
      root.querySelector('[data-cookie-accept]').addEventListener('click', () => saveChoice({analytics: true, replay: true}));
      root.querySelector('[data-cookie-reject]').addEventListener('click', () => saveChoice(emptyChoice()));
    }
    banner.querySelector('[data-cookie-settings]').addEventListener('click', openSettings);
    dialog.querySelector('.cookie-close').addEventListener('click', closeSettings);
    dialog.addEventListener('cancel', event => { event.preventDefault(); closeSettings(); });
    dialog.addEventListener('click', event => { if (event.target === dialog) closeSettings(); });
    ui.analytics.addEventListener('change', updateSaveLabel); ui.replay.addEventListener('change', updateSaveLabel);
    ui.save.addEventListener('click', () => saveChoice({analytics: ui.analytics.checked, replay: ui.replay.checked}));
    document.addEventListener('click', event => { if (event.target.closest('[data-open-cookie-settings]')) { event.preventDefault(); openSettings(); } });
    if (typeof ResizeObserver === 'function') new ResizeObserver(() => { if (!banner.hidden) document.documentElement.style.setProperty('--cookie-banner-space', `${banner.getBoundingClientRect().height + 24}px`); }).observe(banner);
    setBannerVisible(!choice);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, {once: true}); else mount();
  window.addEventListener('storage', event => {
    if (event.key !== storageKey) return;
    const next = readChoice(), reload = needsReload(next || emptyChoice()); choice = next; updateServices(next || emptyChoice()); setBannerVisible(!next);
    if (reload) location.reload();
  });
})();
