(() => {
  const storageKey = 'vdalo-clarity-consent';
  const projectId = 'z199c8oakv';
  let clarityLoaded = false;

  const readChoice = () => {
    try {
      return window.localStorage.getItem(storageKey);
    } catch {
      return null;
    }
  };

  const saveChoice = (choice) => {
    try {
      window.localStorage.setItem(storageKey, choice);
    } catch {
      // Keep the choice for this page even when browser storage is unavailable.
    }
  };

  const sendConsent = (granted) => {
    if (typeof window.clarity === 'function') {
      window.clarity('consentv2', {
        ad_Storage: 'denied',
        analytics_Storage: granted ? 'granted' : 'denied',
      });
      if (!granted) window.clarity('consent', false);
    }
  };

  const loadClarity = () => {
    if (clarityLoaded) return;
    clarityLoaded = true;
    window.clarity = window.clarity || function (...args) {
      (window.clarity.q = window.clarity.q || []).push(args);
    };
    sendConsent(true);
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.clarity.ms/tag/${projectId}`;
    document.head.appendChild(script);
  };

  const banner = document.createElement('section');
  banner.className = 'cookie-consent';
  banner.setAttribute('aria-label', 'Налаштування аналітичних cookie');
  banner.setAttribute('aria-live', 'polite');
  banner.hidden = true;
  banner.innerHTML = `
    <div class="cookie-consent-copy">
      <strong>Аналітика сайту</strong>
      <p>Microsoft Clarity допомагає зрозуміти, як відвідувачі користуються сайтом. Запис взаємодій увімкнеться лише після вашої згоди. Введений текст і зображення маскуються налаштуваннями сервісу. Деталі є в <a href="/privacy">політиці конфіденційності</a>.</p>
    </div>
    <div class="cookie-consent-actions">
      <button type="button" data-clarity-accept>Дозволити аналітику</button>
      <button type="button" data-clarity-reject>Лише необхідні</button>
    </div>`;
  document.body.appendChild(banner);

  const showBanner = (focusButton = false) => {
    banner.hidden = false;
    if (focusButton) banner.querySelector('[data-clarity-accept]').focus({ preventScroll: true });
  };

  banner.querySelector('[data-clarity-accept]').addEventListener('click', () => {
    saveChoice('granted');
    loadClarity();
    banner.hidden = true;
  });

  banner.querySelector('[data-clarity-reject]').addEventListener('click', () => {
    saveChoice('denied');
    sendConsent(false);
    banner.hidden = true;
  });

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-open-cookie-settings]')) {
      event.preventDefault();
      showBanner(true);
    }
  });

  if (readChoice() === 'granted') loadClarity();
  else if (!readChoice()) showBanner();
})();
