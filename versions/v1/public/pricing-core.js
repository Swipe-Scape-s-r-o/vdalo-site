(() => {
  const plans = {
    start: { id: 'start', name: 'Start', minimum: 1, maximum: 8, monthly: 390, base: 390, included: 8, extraPrice: 0, setup: 0 },
    mini: { id: 'mini', name: 'Mini', minimum: 9, maximum: 12, monthly: 990, base: 990, included: 12, extraPrice: 0, setup: 0 },
    hotel: { id: 'hotel', name: 'Hotel', minimum: 13, maximum: 40, monthly: 1490, base: 1490, included: 20, extraPrice: 50, setup: 1500 },
    'hotel-plus': { id: 'hotel-plus', name: 'Hotel+', minimum: 41, maximum: 80, monthly: 2990, base: 2990, included: 40, extraPrice: 45, setup: 6000 },
    complex: { id: 'complex', name: 'Complex', minimum: 81, maximum: 150, monthly: 5900, base: 5900, included: 80, extraPrice: 30, setup: 15000 },
    enterprise: { id: 'enterprise', name: 'Enterprise', minimum: 151, maximum: Infinity, monthly: null, base: null, included: null, extraPrice: null, setup: null }
  };
  const modules = {
    channels: { label: 'Channel Manager VDALO · окремий модуль', price: 590 },
    prro: { label: 'ПРРО та фіскалізація', price: 290, includedFrom: ['hotel', 'hotel-plus', 'complex', 'enterprise'], status: 'development' },
    rms: { label: 'Розширені правила ціни', price: 590, variable: true, status: 'beta' },
    assistant: { label: 'AI-помічник для гостей', price: 590, from: true, status: 'development' },
    access: { label: 'Ручні PIN-коди', price: 490, perRoom: 20, status: 'beta' },
    kiosk: { label: 'Кіоск для гостей', price: 990 },
    energy: { label: 'Керування енергоспоживанням', price: 590, from: true, status: 'development' },
    checkin: { label: 'Онлайн-заселення', price: 490 },
    reports: { label: 'Розширені звіти', price: 290 },
    finance: { label: 'Фінансовий облік', price: 390 },
    tasks: { label: 'Задачі команди', price: 290 },
    messages: { label: 'Розширені повідомлення', price: 290, status: 'development' },
    laundry: { label: 'Мінібар (beta) / пральня та запаси (у розробці)', price: 290, status: 'beta' }
  };
  function hotelPlan(rooms) {
    const count = Math.max(1, Math.floor(Number(rooms) || 1));
    const plan = Object.values(plans).find(item => count >= item.minimum && count <= item.maximum);
    return { ...plan, monthly: plan.monthly === null ? null : plan.monthly + Math.max(0, count - plan.included) * plan.extraPrice };
  }
  function apartPrice(units) { return 399 + Math.max(0, Math.floor(Number(units) || 1) - 3) * 79; }
  function applyPeriod(monthly, period = 'month') {
    const factor = period === 'six' ? 0.9 : period === 'year' ? 0.75 : 1;
    const months = period === 'six' ? 6 : period === 'year' ? 12 : 1;
    return { monthlyEquivalent: monthly === null ? null : Math.round(monthly * factor), total: monthly === null ? null : Math.round(monthly * factor * months) };
  }
  function modulesPrice(planId, rooms, selected = []) {
    let sum = 0, isFrom = false; const notes = [];
    for (const id of selected) {
      const item = modules[id]; if (!item) continue;
      if (item.status === 'development' || item.status === 'beta') { notes.push(`${item.label}: ${item.status === 'beta' ? 'бета, потрібне підтвердження' : 'у розробці, поки не включено в розрахунок'}`); continue; }
      if (item.includedFrom?.includes(planId)) { notes.push(`${item.label}: входить у тариф`); continue; }
      if (id === 'rms') {
        if (rooms > 80) { isFrom = true; notes.push('Розширені правила ціни: індивідуальний розрахунок понад 80 номерів'); continue; }
        const price = rooms > 40 ? 990 : 590; sum += price; notes.push(`${item.label}: ${price} грн`); continue;
      }
      const price = item.price + (item.perRoom ? item.perRoom * rooms : 0);
      sum += price; if (item.from) isFrom = true;
      notes.push(`${item.label}: ${item.from ? 'від ' : ''}${price.toLocaleString('uk-UA')} грн${item.perRoom ? ' із розрахунком за номер' : ''}`);
    }
    return { sum, isFrom, notes };
  }
  const api = { plans, modules, hotelPlan, apartPrice, applyPeriod, modulesPrice };
  if (typeof window !== 'undefined') window.VDALO_PRICING = api;
  if (typeof globalThis !== 'undefined') globalThis.VDALO_PRICING = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
