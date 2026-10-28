const configElement = document.getElementById('tourist-tax-config');
let config = {};
try { config = JSON.parse(configElement?.textContent || '{}'); } catch {}

const ukrainianCount = (value, one, few, many) => {
  const count = Math.abs(Number(value));
  const lastTwo = count % 100;
  const last = count % 10;
  const form = lastTwo >= 11 && lastTwo <= 14 ? many
    : last === 1 ? one
      : last >= 2 && last <= 4 ? few
        : many;
  return `${value} ${form}`;
};

const infographic = document.querySelector('.tt-infographic');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (infographic && !reduceMotion && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('tt-motion-ready');
  const infographicObserver = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) {
      infographic.classList.add('is-visible');
      infographicObserver.disconnect();
    }
  }, { threshold: 0.18 });
  infographicObserver.observe(infographic);
} else if (infographic) infographic.classList.add('is-visible');

const places = [
  ...(Array.isArray(config.publicPlaces) ? config.publicPlaces : []),
  ...(Array.isArray(config.preliminaryPlaces) ? config.preliminaryPlaces : []),
];
const directorySearchInput = document.getElementById('tt-place-search');
if (directorySearchInput) {
  const results = document.getElementById('tt-place-search-results');
  const status = document.getElementById('tt-place-search-status');
  let activeIndex = -1;
  const closeDirectoryResults = () => {
    results?.replaceChildren();
    if (results) { results.hidden = true; results.style.display = 'none'; }
    directorySearchInput.setAttribute('aria-expanded', 'false');
    directorySearchInput.removeAttribute('aria-activedescendant');
    activeIndex = -1;
  };
  const setActiveOption = index => {
    const options = [...(results?.querySelectorAll('[role="option"]') || [])];
    if (!options.length) return;
    activeIndex = (index + options.length) % options.length;
    options.forEach((option, optionIndex) => option.setAttribute('aria-selected', String(optionIndex === activeIndex)));
    directorySearchInput.setAttribute('aria-activedescendant', options[activeIndex].id);
  };
  directorySearchInput.addEventListener('input', () => {
    const query = directorySearchInput.value.trim().toLocaleLowerCase('uk-UA').replace(/\s+/g, ' ');
    closeDirectoryResults();
    if (query.length < 2) {
      if (status) status.textContent = query ? 'Введіть ще одну літеру для пошуку.' : '';
      return;
    }
    const allMatches = places
      .filter(place => `${place.name} ${place.community} ${place.region} ${place.district}`.toLocaleLowerCase('uk-UA').replace(/\s+/g, ' ').includes(query))
      .sort((a, b) => Number(!a.name.toLocaleLowerCase('uk-UA').startsWith(query)) - Number(!b.name.toLocaleLowerCase('uk-UA').startsWith(query)) || a.name.localeCompare(b.name, 'uk-UA'));
    if (!allMatches.length) {
      if (status) status.textContent = `У довіднику з ${places.length} локацій збігів немає. Перегляньте повний реєстр нижче.`;
      return;
    }
    if (status) status.textContent = '';
    const matches = allMatches.slice(0, 6);
    for (const [index, place] of matches.entries()) {
      const option = document.createElement('button');
      option.type = 'button';
      option.id = `tt-place-search-option-${index}`;
      option.className = 'tt-place-choice';
      option.setAttribute('role', 'option');
      option.setAttribute('aria-selected', 'false');
      const title = document.createElement('strong');
      title.textContent = place.name;
      const detail = document.createElement('small');
      detail.textContent = `${place.community || place.region} · ${place.region}`;
      option.append(title, detail);
      option.addEventListener('mousedown', event => event.preventDefault());
      option.addEventListener('click', () => { window.location.assign(place.route); });
      results.append(option);
    }
    results.hidden = false;
    results.style.display = 'block';
    directorySearchInput.setAttribute('aria-expanded', 'true');
    if (status) status.textContent = `Знайдено ${allMatches.length}${allMatches.length > matches.length ? `, показано перші ${matches.length}` : ''}. Використайте стрілки та Enter, щоб відкрити сторінку.`;
  });
  directorySearchInput.addEventListener('keydown', event => {
    const options = [...(results?.querySelectorAll('[role="option"]') || [])];
    if (event.key === 'Escape') { closeDirectoryResults(); return; }
    if (!options.length) return;
    if (event.key === 'ArrowDown') { event.preventDefault(); setActiveOption(activeIndex + 1); }
    if (event.key === 'ArrowUp') { event.preventDefault(); setActiveOption(activeIndex < 0 ? options.length - 1 : activeIndex - 1); }
    if (event.key === 'Enter') {
      event.preventDefault();
      options[activeIndex < 0 ? 0 : activeIndex]?.click();
    }
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.tt-directory-quick-search')) closeDirectoryResults();
  });
}
const funnelLinks = [...document.querySelectorAll('[data-tax-funnel-cta]')];
const calculatorForm = document.getElementById('tourist-tax-calculator');
const syncFunnelCtaContext = () => {
  const selectedPlace = calculatorForm?.dataset.placeSlug
    ? places.find(place => place.slug === calculatorForm.dataset.placeSlug)
    : null;
  for (const link of funnelLinks) {
    const destination = new URL(link.href, window.location.origin);
    destination.searchParams.set('entry_page', window.location.pathname);
    if (selectedPlace && link.dataset.taxEntrySource === 'tourist_tax_hub') {
      destination.searchParams.set('location', selectedPlace.name);
      destination.searchParams.set('utm_content', selectedPlace.slug);
    }
    link.href = `${destination.pathname}${destination.search}${destination.hash}`;
  }
};
syncFunnelCtaContext();
for (const link of funnelLinks) {
  link.addEventListener('click', () => {
    syncFunnelCtaContext();
    const destination = new URL(link.href, window.location.origin);
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'tourist_tax_entry_cta_click',
      funnel: 'tourist_tax',
      entry_source: link.dataset.taxEntrySource || '',
      cta_placement: link.dataset.taxFunnelCta || '',
      entry_page: window.location.pathname,
      location: destination.searchParams.get('location') || ''
    });
  });
}
const searchInputs = document.querySelectorAll('[role="combobox"][aria-controls]:not(#tt-place-search)');

for (const input of searchInputs) {
  const results = document.getElementById(input.getAttribute('aria-controls'));
  const statusId = input.id === 'tt-calc-place' ? 'tt-calc-place-status' : 'tt-search-status';
  const status = document.getElementById(statusId);
  const form = input.closest('form') || document.getElementById('tourist-tax-calculator');
  const setExpanded = expanded => input.setAttribute('aria-expanded', String(expanded));
  const close = () => { results?.replaceChildren(); if (results) results.style.display = 'none'; setExpanded(false); };

  input.addEventListener('input', () => {
    const query = input.value.trim().toLocaleLowerCase('uk-UA');
    results?.replaceChildren();
    if (!query) { close(); if (status) status.textContent = ''; return; }
    const matches = places.filter(place => `${place.name} ${place.region} ${place.district} ${place.community}`.toLocaleLowerCase('uk-UA').includes(query));
    if (!matches.length) {
      close();
      if (status) status.textContent = 'Перевірте написання або спробуйте інший населений пункт. Для локацій із попередніми даними калькулятор покаже лише орієнтовну суму.';
      return;
    }
    for (const place of matches.slice(0, 6)) {
      const option = document.createElement('button');
      option.type = 'button'; option.className = 'tt-place-choice'; option.setAttribute('role', 'option');
      option.textContent = `${place.name} · ${place.region}${place.community ? ` · ${place.community}` : ''}${place.verified ? ' · ставку підтверджено' : ' · дані ставки перевіряються'}`;
      option.addEventListener('click', () => {
        input.value = place.name; input.readOnly = true;
        if (form) {
          form.dataset.placeSlug = place.slug;
          form.dataset.rateModel = place.rateModel || 'flat';
          const priceField=form.querySelector('[data-accommodation-price-field]');
          const priceInput=form.elements.accommodationPricePerPersonPerDay;
          if(priceField)priceField.hidden=form.dataset.rateModel!=='banded';
          if(priceInput){priceInput.required=form.dataset.rateModel==='banded';priceInput.value='';}
        }
        syncFunnelCtaContext();
        close();
        if (status) {
          status.replaceChildren(document.createTextNode(place.verified ? 'Місце обрано. ' : place.calculatorAvailable ? 'Обрано попередні дані. Результат буде орієнтовним. ' : 'Розрахунок для цієї локації поки недоступний. '));
          if (!place.verified && place.route) {
            const detail = document.createElement('a'); detail.href = place.route; detail.textContent = 'Переглянути сторінку населеного пункту'; status.append(detail);
            status.append(document.createTextNode(' '));
          }
          const change = document.createElement('button'); change.type = 'button'; change.className = 'tt-change-place'; change.textContent = 'Змінити';
          change.addEventListener('click', () => { input.readOnly = false; input.value = ''; if (form) { delete form.dataset.placeSlug;form.dataset.rateModel='flat';const priceField=form.querySelector('[data-accommodation-price-field]');const priceInput=form.elements.accommodationPricePerPersonPerDay;if(priceField)priceField.hidden=true;if(priceInput){priceInput.required=false;priceInput.value='';} } status.textContent = ''; input.focus(); });
          status.append(change);
        }
      });
      results.append(option);
    }
    results.style.display = 'block'; setExpanded(true);
    if (status) status.textContent = '';
  });

  input.addEventListener('keydown', event => {
    if (event.key === 'Escape') { close(); return; }
    const options = [...(results?.querySelectorAll('[role="option"]') || [])];
    if (event.key === 'ArrowDown' && options.length) { event.preventDefault(); options[0].focus(); }
    if (event.key === 'Enter' && options.length) { event.preventDefault(); options[0].click(); }
  });
  results?.addEventListener('keydown', event => {
    const options = [...results.querySelectorAll('[role="option"]')];
    const index = options.indexOf(document.activeElement);
    if (event.key === 'ArrowDown' && index < options.length - 1) { event.preventDefault(); options[index + 1].focus(); }
    if (event.key === 'ArrowUp') { event.preventDefault(); index > 0 ? options[index - 1].focus() : input.focus(); }
    if (event.key === 'Escape') { close(); input.focus(); }
  });
  document.addEventListener('click', event => { if (!event.target.closest('.tt-search-wrap')) close(); });
}

const form = document.getElementById('tourist-tax-calculator');
if (form) {
  const output = document.getElementById('tt-result');
  const trackCalculation = () => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'tourist_tax_calculation_success' });
  };
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const start = form.elements.start.value;
    const days = Number(form.elements.days.value);
    const domesticGuests = Number(form.elements.domesticGuests.value);
    const inboundGuests = Number(form.elements.inboundGuests.value);
    const accommodationPricePerPersonPerDay=form.elements.accommodationPricePerPersonPerDay?.value;
    const accommodationType=form.elements.accommodationType?.value;
    const exemption = form.elements.exemption.value;
    const placeSlug = form.dataset.placeSlug || config.placeSlug;
    const compareOdesa = placeSlug === 'odesa' && Boolean(form.elements.odesaCompare?.checked);
    const guestGroups = [{ category: 'domestic', guests: domesticGuests }, { category: 'inbound', guests: inboundGuests }];
    if (!start || !Number.isInteger(days) || days < 1 || days > 366 || guestGroups.some(group => !Number.isInteger(group.guests) || group.guests < 0 || group.guests > 1000) || guestGroups.every(group => group.guests === 0)) {
      output.textContent = 'Перевірте дату, розрахункові доби та кількість гостей. Вкажіть щонайменше одного гостя.';
      return;
    }
    if(form.dataset.rateModel==='banded'&&(!accommodationPricePerPersonPerDay||!Number.isFinite(Number(accommodationPricePerPersonPerDay))||Number(accommodationPricePerPersonPerDay)<=0)){
      output.textContent='Для цього населеного пункту введіть вартість проживання на одну особу за добу.';
      return;
    }
    if(form.dataset.rateModel==='accommodation'&&!accommodationType){
      output.textContent='Оберіть тип місця проживання за категоріями місцевого рішення.';
      return;
    }
    if (!placeSlug) { output.textContent = 'Спершу оберіть населений пункт зі списку.'; return; }
    output.textContent = 'Перевіряємо чинність ставки для цього періоду…';
    try {
      const requestCalculation = async scenario => {
        const response = await fetch('/api/tourist-tax/calculate', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ placeSlug, start, days, guestGroups, accommodationPricePerPersonPerDay, accommodationType, exemption, ...(scenario ? { scenario } : {}) }) });
        const result = await response.json();
        if (!response.ok) throw new Error('Request failed');
        return result;
      };
      const [result, comparisonResult] = compareOdesa
        ? await Promise.all([requestCalculation(), requestCalculation('odesa-inbound-1-percent')])
        : [await requestCalculation(), null];
      const messages = {
        AMBIGUOUS_PLACE: 'Оберіть населений пункт зі списку, щоб використати його місцеві дані.',
        EXCLUDED_LOCATION: 'Для цього місця калькулятор не публікує розрахунок.',
        RATE_UNVERIFIED: 'Точну суму не показуємо, бо місцеву ставку ще не підтверджено.',
        RATE_OUT_OF_PERIOD: 'Для вказаного періоду немає повністю підтвердженого правила або річної бази.',
        EXEMPTION_NEEDS_EVIDENCE: 'Можливе звільнення. Перевірте підставу й документи з податковим агентом. Не надсилайте документи в калькулятор.',
        SOURCE_CONFLICT: 'У джерелах є розбіжність. Точну суму тимчасово не показуємо.',
        INVALID_INPUT: 'Перевірте дату, розрахункові доби та кількість гостей.'
      };
      if (result.state === 'PLACE_UNAVAILABLE') {
        output.textContent = 'Для цього населеного пункту розрахунок поки недоступний. Спробуйте обрати інше місто з підтвердженою ставкою.';
        return;
      }
      if (result.state === 'VERIFIED_RESULT' || result.state === 'PRELIMINARY_RESULT') {
        if(compareOdesa&&comparisonResult?.state!=='VERIFIED_RESULT'){
          output.textContent=comparisonResult?.reason||messages[comparisonResult?.state]||'Не вдалося побудувати порівняльний сценарій. Перевірте дату проживання.';
          return;
        }
        output.replaceChildren();
        const renderResultCard=(value,title,isScenario=false)=>{
          const card=document.createElement('section');card.className=`tt-result-card${isScenario?' tt-result-card-scenario':''}`;
          const heading=document.createElement('h3');heading.textContent=title;
          const amount=document.createElement('strong');amount.className='tt-result-amount';amount.textContent=new Intl.NumberFormat('uk-UA',{style:'currency',currency:'UAH'}).format(Number(value.totalCents)/100);
          const groupsText=value.guestGroups.map(group=>{
            const rateText=Array.isArray(group.ratePeriods)
              ?group.ratePeriods.map(period=>`${period.ratePercent}% × ${ukrainianCount(period.days,'добу','доби','діб')}`).join(' + ')
              :`${group.ratePercent}%`;
            return `${group.guests} ${group.category==='domestic'?'внутрішнього':'в’їзного'} туризму · ${rateText}${group.accommodationTypeLabel?` · ${group.accommodationTypeLabel}`:''}`;
          }).join('; ');
          const detail=document.createElement('p');detail.textContent=`${groupsText} · ${ukrainianCount(value.days,'розрахункова доба','розрахункові доби','розрахункових діб')}. Інформаційний розрахунок${value.exemptionReviewRequired?' до перевірки можливої пільги':''}.`;
          card.append(heading,amount,detail);
          if(value.sourceUrl){const source=document.createElement('a');source.href=value.sourceUrl;source.rel='noopener';source.textContent=value.verificationStatus==='PRELIMINARY'?'Джерело попередніх значень':value.scenarioOnly?'Повідомлення ДПС про ставку 1%':'Першоджерело місцевої ставки';card.append(source);}
          const checked=document.createElement('small');checked.textContent=value.verificationStatus==='PRELIMINARY'?'Ставка та її застосування ще перевіряються.':`Перевірено ${value.checkedAt}`;card.append(checked);
          if(value.warning){const warning=document.createElement('p');warning.className='tt-scenario-warning';warning.textContent=value.warning;card.append(warning);}
          if(isScenario){const note=document.createElement('p');note.className='tt-scenario-warning';note.textContent='Умовний сценарій за повідомленою ставкою 1% для іноземців. Дату її застосування ще потрібно звірити з повним рішенням; не використовуйте цю суму як підтверджене нарахування за 2026 рік.';card.append(note);}
          return card;
        };
        if(compareOdesa){
          const comparison=document.createElement('div');comparison.className='tt-result-comparison';
          comparison.append(renderResultCard(result,'Підтверджені ставки 2026 року'),renderResultCard(comparisonResult,'Порівняльний сценарій: 1% для іноземців',true));
          output.append(comparison);
          const difference=document.createElement('p');difference.className='tt-result-difference';difference.textContent=`Різниця між сценаріями: ${new Intl.NumberFormat('uk-UA',{style:'currency',currency:'UAH'}).format((Number(comparisonResult.totalCents)-Number(result.totalCents))/100)}.`;output.append(difference);
        }else output.append(renderResultCard(result,result.state==='PRELIMINARY_RESULT'?'Орієнтовний розрахунок за попередніми даними':'Розрахунок за підтвердженими ставками'));
        trackCalculation();
      } else if(result.state==='RATE_THRESHOLD_AMBIGUOUS') output.textContent=`Місцеве рішення не дає однозначно визначити ставку для ціни рівно ${new Intl.NumberFormat('uk-UA').format(result.thresholdUah)} грн. Уточніть тариф у міській раді або податкового агента.`;
      else output.textContent = result.reason || messages[result.state] || 'Не вдалося виконати перевірку. Спробуйте пізніше.';
    } catch { output.textContent = 'Не вдалося зв’язатися з калькулятором. Спробуйте ще раз пізніше.'; }
  });
}
