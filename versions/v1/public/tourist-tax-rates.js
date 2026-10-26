(() => {
  const form = document.getElementById('tt-rates-filters');
  const body = document.querySelector('.tt-rates-table tbody');
  const result = document.getElementById('tt-rates-results');
  const empty = document.getElementById('tt-rates-empty');
  if (!form || !body || !result || !empty) return;

  const rows = [...body.querySelectorAll('tr')];
  const query = document.getElementById('tt-rates-query');
  const region = document.getElementById('tt-rates-region');
  const year = document.getElementById('tt-rates-year');
  const tourism = document.getElementById('tt-rates-tourism');
  const status = document.getElementById('tt-rates-status');
  const update = () => {
    const term = query.value.trim().toLocaleLowerCase('uk-UA');
    let visible = 0;
    for (const row of rows) {
      const matches = (!term || row.dataset.search.includes(term))
        && (!region.value || row.dataset.region === region.value)
        && (!year.value || row.dataset.year === year.value)
        && (!tourism.value || row.dataset[tourism.value] === 'true')
        && (!status.value || row.dataset.status === status.value);
      row.hidden = !matches;
      if (matches) visible++;
    }
    result.textContent = `Показано ${visible} з ${rows.length} локацій.`;
    empty.hidden = visible !== 0;
  };

  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('input', update);
  form.addEventListener('change', update);
  form.addEventListener('reset', () => requestAnimationFrame(update));
})();
