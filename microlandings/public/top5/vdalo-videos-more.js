/* VDALO · ще 20 коротких відео (~15 с): 10 больових (p-*) і 10 маркетингових (m-*).
   Підключати ПІСЛЯ vdalo-videos.js. Кожне відео: дані: сегменти й елементи з часом появи.
   Фінал у всіх однаковий: запит на погоджений тестовий період. */
(() => {
  'use strict';
  const V = window.VDALOVideo;
  if (!V || !V.register) return;
  const { cl, pr, eo, eio, put, h, ICON, stars } = V.kit;
  const back = x => { const c1 = 1.7, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
  const grn = n => `${Math.round(n).toLocaleString('uk-UA').replace(/ /g, ' ')}`;

  // custom element types (effects) can be added by other files: V.kit.types.myType = (e, a, b, stage) => ({ el, sub })
  const TYPES = {};
  // ---------- one element ----------
  function make(stage, e, seg) {
    const a = e.at ?? seg.a, b = e.out ?? seg.b;
    let el, sub = () => {};
    const pos = e.pos || '';
    switch (e.type) {
      case 'big': el = h(`<p class="vdv-big ${e.cls || ''}" style="top:${e.top}px;${e.size ? `font-size:${e.size}px;` : ''}${pos}">${e.html}</p>`); break;
      case 'cap': el = h(`<p class="vdv-cap ${e.cls || ''}" style="top:${e.top ?? 52}px;${e.size ? `font-size:${e.size}px;` : ''}${pos}">${e.html}</p>`); break;
      case 'chip': el = h(`<span class="vdv-chip ${e.cls || ''}" style="top:${e.top}px;${pos}">${e.html}</span>`); break;
      case 'stamp': el = h(`<div class="vdv-stamp ${e.cls || ''}" style="top:${e.top}px;${pos}">${e.html}</div>`); break;
      case 'flash': el = h('<div class="vdv-flash"></div>'); break;
      case 'bub': el = h(`<div class="vdv-bub ${e.side || 'l'}" style="top:${e.top}px;${pos}">${e.html}</div>`); break;
      case 'html': el = h(e.html); if (pos) el.style.cssText += pos; break;
      case 'num': {
        el = h(`<div class="vdv-num ${e.cls || ''}" style="top:${e.top}px;${pos}"><b></b>${e.label ? `<span>${e.label}</span>` : ''}</div>`);
        const n = el.querySelector('b'), f = e.fmt || (x => grn(x));
        sub = t => { n.textContent = f(e.from + (e.to - e.from) * eio(pr(t, e.n1 ?? a, e.n2 ?? a))); };
        break;
      }
      case 'bar': {
        el = h(`<div class="vdv-pbar ${e.cls || ''}" style="top:${e.top}px;${pos}"><i></i></div>`);
        const i = el.querySelector('i');
        sub = t => { i.style.width = `${(e.from + (e.to - e.from) * eio(pr(t, e.n1 ?? a, e.n2 ?? a + 1))).toFixed(1)}%`; };
        break;
      }
      case 'card': {
        const ic = e.ic ?? '';
        el = h(`<div class="vdv-row abs ${e.cls || ''}" style="top:${e.top}px;${pos}"><span class="vdv-ic ${e.icc || 'n'}">${ic}</span>
          <span class="tx"><span class="t">${e.t}</span>${e.s ? `<span class="s">${e.s}</span>` : ''}${e.mini ? '<span class="mini"><i></i></span>' : ''}</span>
          ${e.tag ? `<span class="tag ${e.tagc || ''}">${e.tag}</span>` : ''}${e.check != null ? `<span class="ck">${ICON.check}</span>` : ''}</div>`);
        const svg = el.querySelector('.vdv-ic svg'); if (svg) svg.style.cssText = 'width:15px;height:15px';
        const tt = el.querySelector('.t'), s = el.querySelector('.s'), ck = el.querySelector('.ck'), mi = el.querySelector('.mini i'), tg = el.querySelector('.tag');
        sub = t => {
          if (e.strike != null) { const k = eo(pr(t, e.strike, e.strike + .4)); tt.style.setProperty('--strike', k.toFixed(3)); tt.style.opacity = (1 - .4 * k).toFixed(3); }
          if (s && e.sOn != null) s.style.opacity = eo(pr(t, e.sOn, e.sOn + .35)).toFixed(3);
          if (ck) put(ck, eo(pr(t, e.check, e.check + .3)), 0, 0, .4 + .6 * back(pr(t, e.check, e.check + .4)));
          if (mi) mi.style.width = `${(100 * eio(pr(t, e.mini[0], e.mini[1]))).toFixed(1)}%`;
          if (tg && e.tagOn != null) tg.style.opacity = eo(pr(t, e.tagOn, e.tagOn + .3)).toFixed(3);
        };
        break;
      }
      default: {
        if (TYPES[e.type]) { const r = TYPES[e.type](e, a, b, stage); el = r.el; if (r.sub) sub = r.sub; }
        else el = h('<div></div>');
      }
    }
    stage.append(el);
    const an = e.anim || (e.type === 'stamp' ? 'slam' : e.type === 'flash' ? 'flash' : 'up');
    return t => {
      sub(t);
      if (an === 'flash') { const k = pr(t, a, a + .5); el.style.opacity = (t < a ? 0 : .55 * (1 - k)).toFixed(3); return; }
      const d = e.d ?? (an === 'slam' ? .22 : .38);
      const k = pr(t, a, a + d), out = pr(t, b, b + .3);
      let o = (an === 'none' ? (t >= a ? 1 : 0) : eo(k)) * (1 - out);
      let x = 0, y = -8 * out, s = 1, r = e.rot || 0;
      if (an === 'up') y += 18 * (1 - eo(k));
      if (an === 'left') x = -60 * (1 - eo(k));
      if (an === 'right') x = 60 * (1 - eo(k));
      if (an === 'pop') s = .5 + .5 * back(k);
      if (an === 'slam') { s = 1 + .9 * (1 - eo(k)); o = Math.min(1, k * 3) * (1 - out); }
      if (e.shake && t > e.shake[0] && t < e.shake[1]) r += Math.sin(t * 46) * (e.shakeA || 2.2);
      if (e.spin) r += e.spin[2] * eio(pr(t, e.spin[0], e.spin[1]));
      if (e.move) { const m = eio(pr(t, e.move[0], e.move[1])); x += e.move[2] * m; y += e.move[3] * m; s *= 1 + ((e.move[4] ?? 1) - 1) * m; if (e.move[5]) o *= 1 - m; }
      put(el, cl(o), y, x, s, r);
    };
  }

  // ---------- final: free test ----------
  function ctaFrame(stage, at) {
    const f = h(`<div class="vdv-final solid" data-a>
      <div class="vdv-mark"><i></i>VDALO</div>
      <p>Запросіть <em>14-денний тест</em></p>
      <small>Після заявки узгодимо налаштування й дату старту.<br>Без оплати за тестовий період.</small>
      <span class="vdv-cta-pill">Запросити тест →</span></div>`);
    stage.append(f);
    const [mark, p, sm, pill] = f.children;
    return t => {
      put(f, eo(pr(t, at, at + .35)));
      put(mark, eo(pr(t, at + .1, at + .6)), 0, 0, .86 + .14 * eo(pr(t, at + .1, at + .7)));
      put(p, eo(pr(t, at + .35, at + .85)), 12 * (1 - eo(pr(t, at + .35, at + .85))));
      put(sm, eo(pr(t, at + .6, at + 1.1)));
      const pulse = t > at + 1.4 ? 1 + .035 * Math.sin((t - at) * 5) : 1;
      put(pill, eo(pr(t, at + .9, at + 1.3)), 10 * (1 - eo(pr(t, at + .9, at + 1.3))), 0, (.7 + .3 * back(pr(t, at + .9, at + 1.35))) * pulse);
    };
  }

  function compose(def) {
    const dur = def.dur || 15, cta = def.cta ?? dur - 3;
    return {
      dur, title: def.title, group: def.group, pain: def.pain,
      build(stage) {
        if (def.theme) stage.classList.add(`th-${def.theme}`);
        const tw = stars(stage, def.stars ?? 16, 170);
        const kick = h(`<div class="vdv-kicker" data-a>${def.kicker || 'VDALO · система для готелів'}</div>`); stage.append(kick);
        const items = [];
        def.segs.forEach(seg => seg.els.forEach(e => items.push(make(stage, e, seg))));
        const fin = (def.final || ctaFrame)(stage, cta);
        const quake = def.quake || [];
        return t => {
          tw(t); put(kick, eo(pr(t, 0, .3)) * (1 - pr(t, cta, cta + .3))); items.forEach(u => u(t)); fin(t);
          let qx = 0, qy = 0;
          quake.forEach(([qa, qb, amp]) => { if (t > qa && t < qb) { const f = amp * (1 - pr(t, qa, qb)); qx += Math.sin(t * 71) * f; qy += Math.cos(t * 53) * f; } });
          stage.style.translate = qx || qy ? `${qx.toFixed(2)}px ${qy.toFixed(2)}px` : '';
        };
      }
    };
  }
  const reg = (id, def) => V.register(id, compose(def));
  Object.assign(V.kit, { compose, types: TYPES, reg, ctaFrame, back, grn });
  const I = ICON;
  const lock = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  const card = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h4"/></svg>';
  const grid = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 4v16"/></svg>';
  const tg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 4L3 11l6 2 2 6 3-4 5 4z"/><path d="M9 13l12-9"/></svg>';
  const tag = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/></svg>';
  const phoneI = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2.5" width="12" height="19" rx="3"/><path d="M10.5 18.5h3"/></svg>';
  const week = (prices, hi, extra = '') => `<div class="vdv-box" style="left:24px;right:24px;top:236px;height:190px;padding:12px;display:grid;grid-template-columns:repeat(7,1fr);gap:6px;align-items:end${extra}">
      ${['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'нд'].map((d, i) => `<div style="display:grid;gap:6px;justify-items:center;font:600 10px var(--vd-body);color:var(--muted)">
        <span style="font:700 10.5px var(--vd-body);color:var(--text)">${prices[i]}</span>
        <i style="display:block;width:100%;height:${hi[i]}px;border-radius:6px;background:${hi[i] > 80 ? 'linear-gradient(180deg,var(--pink),#9C6BC0)' : 'rgba(255,255,255,.14)'}"></i>${d}</div>`).join('')}</div>`;

  // =====================================================================
  // БОЛІ
  // =====================================================================
  reg('p-overbook', {
    title: 'Біль: овербукінг', group: 'pain', pain: 'Гість приїхав, а номер продано двічі', theme: 'ink',
    segs: [
      { a: 0, b: 6.8, els: [
        { type: 'chip', html: '23:40 · п\'ятниця', top: 54, pos: 'left:24px', anim: 'fade' },
        { type: 'big', html: 'Гість приїхав.', top: 98, at: .1, anim: 'slam' },
        { type: 'big', html: 'А номера', top: 142, at: .7, anim: 'slam' },
        { type: 'big', html: '<em class="r">немає.</em>', top: 186, at: 1.3, size: 56, anim: 'slam' },
        { type: 'card', icc: 'b', ic: 'B', t: 'Booking · номер 302', s: 'пт–нд · оплачено', top: 300, at: 2.5, anim: 'left' },
        { type: 'card', icc: 'a', ic: 'A', t: 'Airbnb · номер 302', s: 'пт–нд · ті самі дати', top: 356, at: 2.9, anim: 'right' },
        { type: 'flash', at: 3.4 },
        { type: 'stamp', html: 'Продано двічі', top: 330, at: 3.45, pos: 'left:70px', rot: -8 },
        { type: 'chip', html: 'переселення', top: 446, at: 4.4, cls: 'bad', pos: 'left:24px' },
        { type: 'chip', html: 'компенсація', top: 446, at: 4.8, cls: 'bad', pos: 'left:142px' },
        { type: 'chip', html: 'відгук 1★', top: 494, at: 5.2, cls: 'bad', pos: 'left:24px' },
        { type: 'chip', html: 'нічна зміна', top: 494, at: 5.6, cls: 'bad', pos: 'left:126px' }
      ] },
      { a: 7.0, b: 11.7, els: [
        { type: 'cap', html: 'Після налаштування каналів <em>звірку можна спростити</em>', size: 29 },
        { type: 'card', icc: 'b', ic: 'B', t: 'Booking · номер 302', s: 'нове бронювання', top: 170, at: 7.4, check: 7.9 },
        { type: 'card', icc: 'p', ic: lock, t: 'Доступність в Airbnb', s: 'оновлюється після підключення', top: 228, at: 8.3, check: 8.8 },
        { type: 'card', icc: 'p', ic: lock, t: 'Доступність на сайті', s: 'залежить від інтеграції', top: 286, at: 9.0, check: 9.5 },
        { type: 'big', html: 'Бронювання видно <em>в одному календарі.</em>', top: 380, size: 30, at: 9.9 }
      ] }
    ]
  });

  reg('p-calls', {
    title: 'Біль: нічні дзвінки', group: 'pain', pain: 'Гості дзвонять уночі з тими самими питаннями', theme: 'ink',
    segs: [
      { a: 0, b: 6.8, els: [
        { type: 'html', at: 0, anim: 'fade', html: '<div style="position:absolute;left:0;right:0;top:50px;text-align:center"><b style="display:block;font:800 72px/1 var(--vd-display);letter-spacing:-.03em">03:12</b><span style="font-size:13px;color:var(--muted)">субота, ніч</span></div>' },
        { type: 'html', at: .4, out: 3.0, anim: 'pop', shake: [.6, 2.9], shakeA: 1.6, html: `<div class="vdv-box" style="left:40px;right:40px;top:150px;height:150px;padding:16px;display:grid;justify-items:center;gap:6px;text-align:center">
            <span style="width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,.14);display:grid;place-items:center;font:800 18px var(--vd-display)">104</span>
            <b style="font:700 16px var(--vd-body)">Гість · номер 104</b><span style="font-size:12px;color:var(--muted)">вхідний дзвінок…</span>
            <span style="display:flex;gap:44px;margin-top:4px"><i style="width:34px;height:34px;border-radius:50%;background:var(--bad)"></i><i style="width:34px;height:34px;border-radius:50%;background:var(--ok)"></i></span></div>` },
        { type: 'bub', html: 'Який пароль Wi‑Fi?', top: 160, at: 3.1 },
        { type: 'bub', html: 'Де можна поставити авто?', top: 206, at: 3.7 },
        { type: 'bub', html: 'О котрій сніданок?', top: 252, at: 4.3 },
        { type: 'big', html: 'Знову 3 ночі.', top: 330, size: 38, at: 1.0 },
        { type: 'big', html: '<em class="r">Знову гості.</em>', top: 372, size: 38, at: 1.6 },
        { type: 'num', from: 1, to: 7, n1: 1.8, n2: 6.2, top: 450, cls: 'r', label: 'приклад повторних дзвінків за ніч', fmt: n => Math.round(n) },
        { type: 'html', at: 1, anim: 'fade', html: '<div class="vdv-foot" style="bottom:22px">Кількість дзвінків у сцені наведена для ілюстрації.</div>' }
      ] },
      { a: 7.0, b: 11.7, els: [
        { type: 'cap', html: 'Інформація для гостя <em>на одній сторінці</em>', size: 29 },
        { type: 'bub', html: 'Де можна поставити авто?', top: 170, at: 7.4 },
        { type: 'bub', side: 'r', html: '<small>Сторінка гостя</small>Додайте адресу парковки та правила заїзду.', top: 216, at: 8.0 },
        { type: 'bub', html: 'О котрій сніданок?', top: 300, at: 8.8 },
        { type: 'bub', side: 'r', html: '<small>Сторінка гостя</small>Зазначте час сніданку й потрібні гостю деталі.', top: 346, at: 9.3 },
        { type: 'chip', html: 'Інструкції можна надіслати завчасно', top: 440, at: 10.2, cls: 'ok', pos: 'left:24px' }
      ] }
    ]
  });

  reg('p-cash', {
    title: 'Біль: не видно внесені суми', group: 'pain', pain: 'Команда не бачить, скільки гість уже сплатив', theme: 'cream',
    segs: [
      { a: 0, b: 6.8, els: [
        { type: 'big', html: 'Передплата.', top: 70, at: .1, anim: 'slam' },
        { type: 'big', html: '<em class="r">Який залишок?</em>', top: 114, at: .6, anim: 'slam' },
        { type: 'html', at: 1.0, html: `<div style="position:absolute;left:56px;right:56px;top:196px;height:300px;background:#fff;border-radius:6px;box-shadow:0 14px 34px rgba(57,35,62,.16);
            -webkit-mask:linear-gradient(#000 0 0) top/100% calc(100% - 10px) no-repeat,radial-gradient(circle 6px at 8px 100%,transparent 6px,#000 6.5px) bottom/16px 10px repeat-x"></div>` },
        ...[['Бронювання · 203', '', 214, 1.2, 'font-weight:800;justify-content:center'], ['Вартість', '18 400', 252, 1.5], ['Внесено', '9 200', 284, 1.8], ['Залишок', '9 200', 316, 2.1], ['Спосіб оплати', 'узгоджено', 356, 2.5, 'font-weight:800'], ['Статус', 'перевірте', 400, 3.2, 'color:#D63A55;font-weight:800']]
          .map(([l, v, top, at, st]) => ({ type: 'html', at, anim: 'fade', html: `<div style="position:absolute;left:72px;right:72px;top:${top}px;display:flex;justify-content:space-between;font:500 14px/1 'Courier New',monospace;color:#39233E;${st || ''}"><span>${l}</span><span>${v}</span></div>` })),
        { type: 'stamp', html: 'звірте суму', top: 432, at: 4.0, pos: 'left:110px', rot: -9 },
        { type: 'html', at: 4.6, anim: 'fade', html: '<div class="vdv-foot" style="bottom:22px">Приклад для пояснення статусів передплати.</div>' }
      ] },
      { a: 7.0, b: 11.7, els: [
        { type: 'cap', html: 'Внесені суми <em>видно в бронюванні</em>', size: 30 },
        { type: 'card', icc: 'p', ic: card, t: 'Передплата за реквізитами', s: 'статус фіксує команда', top: 170, at: 7.4, check: 7.9 },
        { type: 'card', icc: 'p', ic: I.receipt, t: 'Сума до сплати', s: 'звірте внесену суму й залишок', top: 228, at: 8.1, check: 8.6 },
        { type: 'card', icc: 'p', ic: I.receipt, t: 'Туристичний збір', s: 'за ставкою та правилами громади', top: 286, at: 8.8, check: 9.3 },
        { type: 'stamp', html: 'Дані для звірки', cls: 'ok', top: 380, at: 9.9, pos: 'left:104px', rot: -5 }
      ] }
    ]
  });

  reg('p-shift', {
    title: 'Біль: адмін не вийшов на зміну', group: 'pain', pain: 'Нічна зміна зірвалась: нікому заселити гостя', theme: 'dark',
    segs: [
      { a: 0, b: 6.8, els: [
        { type: 'big', html: 'Адмін не вийшов', top: 62, size: 36, at: .1, anim: 'slam' },
        { type: 'big', html: '<em class="r">на нічну зміну.</em>', top: 102, size: 36, at: .6, anim: 'slam' },
        { type: 'html', at: 1.0, html: `<div class="vdv-box" style="left:24px;right:24px;top:170px;height:132px;padding:12px;display:grid;grid-template-columns:42px repeat(7,1fr);gap:4px;font:600 10px var(--vd-body);align-items:center">
            <span></span>${['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'нд'].map(d => `<span style="text-align:center;color:var(--muted)">${d}</span>`).join('')}
            <span style="color:var(--muted)">День</span>${['О', 'О', 'І', 'І', 'О', 'І', 'О'].map(n => `<span style="height:34px;border-radius:7px;background:rgba(156,107,192,.35);display:grid;place-items:center">${n}</span>`).join('')}
            <span style="color:var(--muted)">Ніч</span>${['М', 'М', 'А', 'А', 'М', '', 'А'].map(n => `<span style="height:34px;border-radius:7px;background:rgba(156,107,192,.22);display:grid;place-items:center">${n}</span>`).join('')}</div>` },
        { type: 'html', at: 1.8, anim: 'pop', html: '<div style="position:absolute;left:252px;top:252px;width:30px;height:34px;border-radius:7px;background:var(--bad);display:grid;place-items:center;font:800 16px var(--vd-display)">?</div>' },
        { type: 'big', html: 'Хто заселить гостя', top: 330, size: 30, at: 2.6 },
        { type: 'big', html: '<em class="r">о 01:00?</em>', top: 364, size: 30, at: 3.0 },
        { type: 'chip', html: 'шукати підміну', top: 436, at: 4.0, cls: 'bad', pos: 'left:24px' },
        { type: 'chip', html: 'їхати самому', top: 436, at: 4.4, cls: 'bad', pos: 'left:168px' },
        { type: 'chip', html: 'гість під дверима', top: 484, at: 4.8, cls: 'bad', pos: 'left:24px' }
      ] },
      { a: 7.0, b: 11.7, els: [
        { type: 'cap', html: 'Інструкції до заїзду <em>доступні гостю заздалегідь</em>', size: 27 },
        { type: 'bub', side: 'r', html: '<small>Інструкція гостю</small>Ваш номер 203. Заїзд з 14:00. Як дістатися та де знайти ключ, читайте тут.', top: 176, at: 7.4 },
        { type: 'card', icc: 'p', ic: I.key, t: 'Інструкції для гостя', s: 'посилання на сторінку об’єкта', top: 280, at: 8.4, check: 8.9 },
        { type: 'card', icc: 'g', ic: I.check, t: 'Гість знає наступний крок', s: 'без повторного пошуку інформації', top: 338, at: 9.2, check: 9.7 },
        { type: 'html', at: 7.4, anim: 'fade', html: '<div class="vdv-foot" style="bottom:22px">Самостійний вхід можливий із налаштованим сумісним замком.</div>' }
      ] }
    ]
  });

  reg('p-commission', {
    title: 'Біль: комісія Booking', group: 'pain', pain: 'Booking забирає частину кожного бронювання', theme: 'ink',
    segs: [
      { a: 0, b: 6.8, els: [
        { type: 'big', html: 'Скільки ви віддаєте', top: 60, size: 34, at: .1, anim: 'slam' },
        { type: 'big', html: '<em class="r">з кожної броні?</em>', top: 98, size: 34, at: .6, anim: 'slam' },
        { type: 'num', from: 0, to: 24000, n1: 1.0, n2: 1.8, top: 168, at: 1.0, label: 'бронювання на 4 ночі', fmt: n => `${grn(n)} грн` },
        { type: 'bar', from: 100, to: 85, n1: 2.6, n2: 3.2, top: 262, at: 1.2 },
        { type: 'html', at: 2.6, move: [2.8, 3.8, 20, 70, .8, 1], html: '<div style="position:absolute;left:286px;top:258px;width:50px;height:22px;border-radius:6px;background:var(--bad);font:800 11px/22px var(--vd-display);text-align:center">−15%</div>' },
        { type: 'num', from: 3600, to: 3600, top: 304, at: 3.0, cls: 'r', label: 'комісія Booking з однієї броні', fmt: n => `−${grn(n)} грн` },
        { type: 'big', html: 'Підсумуйте комісію <em class="r">за фактичними бронюваннями.</em>', top: 412, size: 25, at: 4.2 },
        { type: 'html', at: 4.6, anim: 'fade', html: '<div class="vdv-foot" style="bottom:22px">Приклад: комісія 15%, 10 таких бронювань на місяць.</div>' }
      ] },
      { a: 7.0, b: 11.7, els: [
        { type: 'cap', html: 'Прямі бронювання: <em>без комісії Booking</em>', size: 29 },
        { type: 'html', at: 7.4, anim: 'pop', html: `<div style="position:absolute;left:36px;right:36px;top:168px;padding:14px;border-radius:18px;background:#fff;color:#39233E;display:grid;gap:8px;box-shadow:0 18px 40px rgba(0,0,0,.35)">
            <b style="font:800 15px var(--vd-display)">Ваш готель · бронювання</b>
            <span style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font:500 11px var(--vd-body)"><i style="font-style:normal;border:1px solid #eadbe2;border-radius:9px;padding:8px">Заїзд: пт</i><i style="font-style:normal;border:1px solid #eadbe2;border-radius:9px;padding:8px">Виїзд: нд</i></span>
            <span style="background:#FF92BD;border-radius:999px;padding:10px;text-align:center;font:700 13px var(--vd-body)">Надіслати запит</span></div>` },
        { type: 'card', icc: 'p', ic: 'V', t: 'Запит із вашого сайту', s: 'команда перевіряє деталі бронювання', top: 340, at: 8.8, check: 9.3 },
        { type: 'big', html: 'Прямий запит <em>стає ще одним каналом.</em>', top: 420, size: 28, at: 9.8 },
        { type: 'html', at: 7.4, anim: 'fade', html: '<div class="vdv-foot" style="bottom:22px">Booking і Airbnb лишаються: додається прямий продаж.</div>' }
      ] }
    ]
  });

  reg('p-notebook', {
    title: 'Біль: бронювання в зошиті', group: 'pain', pain: 'Бронювання в зошиті, Excel і месенджерах', theme: 'paper',
    segs: [
      { a: 0, b: 6.8, els: [
        { type: 'big', html: 'Бронювання досі', top: 60, size: 38, at: .1, anim: 'slam' },
        { type: 'big', html: '<em class="r">у зошиті?</em>', top: 102, size: 44, at: .6, anim: 'slam' },
        ...[['302: Іван, пт–нд, оплатив', 1.0], ['302: Олена?? пт–сб', 1.5], ['105: перенести на вт!!', 2.0], ['201: передоплата? уточнити', 2.5], ['Виїзд 104: ключ не віддали', 3.0]]
          .map(([l, at], i) => ({ type: 'html', at, anim: 'fade', html: `<div style="position:absolute;left:62px;right:20px;top:${190 + i * 32}px;height:32px;display:flex;align-items:flex-end;padding-bottom:5px;font:italic 500 16px/1 Georgia,serif;color:#24418A">${l}</div>` })),
        { type: 'html', at: 3.4, anim: 'fade', html: '<svg style="position:absolute;left:58px;top:228px;width:230px;height:30px" viewBox="0 0 230 30"><path d="M4 18 C40 4 70 28 110 12 S180 26 226 8" stroke="#D63A55" stroke-width="3" fill="none" stroke-linecap="round"/></svg>' },
        { type: 'html', at: 3.8, anim: 'pop', html: '<div style="position:absolute;left:236px;top:300px;width:84px;height:84px;border-radius:50%;border:7px solid rgba(140,90,50,.32)"></div>' },
        { type: 'chip', html: 'Excel', top: 400, at: 4.4, cls: 'bad', pos: 'left:24px' },
        { type: 'chip', html: 'Viber', top: 400, at: 4.7, cls: 'bad', pos: 'left:92px' },
        { type: 'chip', html: 'зошит', top: 400, at: 5.0, cls: 'bad', pos: 'left:162px' },
        { type: 'chip', html: 'пам\'ять', top: 400, at: 5.3, cls: 'bad', pos: 'left:240px' },
        { type: 'big', html: 'Одна помилка: <em class="r">два гості в номері.</em>', top: 456, size: 26, at: 5.6 }
      ] },
      { a: 7.0, b: 11.7, els: [
        { type: 'html', at: 7.0, anim: 'up', html: '<div style="position:absolute;inset:0;background:radial-gradient(120% 60% at 85% 0%,#5A3A62 0%,transparent 60%),#39233E"></div>' },
        { type: 'cap', html: 'Одна шахматка. <em style="color:#FF92BD">Усе видно.</em>', size: 34, at: 7.2, pos: 'color:#FFF5F7' },
        { type: 'html', at: 7.6, html: `<div class="vdv-box" style="left:24px;right:24px;top:170px;padding:12px;display:grid;gap:7px;background:#1B0F20;border-color:rgba(255,245,247,.14);color:#FFF5F7">
            ${[['101', 'S', 0, 2, '#C76A96', 'Сайт'], ['105', 'B', 1, 3, '#2F6FDB', 'Booking'], ['201', 'A', 0, 1, '#FF5A5F', 'Airbnb'], ['302', 'B', 0, 2, '#2F6FDB', 'Booking'], ['303', 'A', 2, 2, '#FF5A5F', 'Airbnb']].map(([n, , f, l, c, lab]) => `<div style="display:grid;grid-template-columns:34px 1fr;gap:8px;align-items:center;font:700 12px var(--vd-body)"><span>${n}</span><span style="position:relative;height:24px;border-radius:6px;background:repeating-linear-gradient(90deg,rgba(255,255,255,.07) 0 calc(25% - 2px),transparent calc(25% - 2px) 25%)"><i style="position:absolute;top:3px;bottom:3px;left:${f * 25}%;width:calc(${l * 25}% - 3px);border-radius:6px;background:${c};font:700 10px/18px var(--vd-display);color:#fff;padding-left:6px;font-style:normal">${lab}</i></span></div>`).join('')}</div>` },
        { type: 'chip', html: 'після підключення сумісних каналів', top: 380, at: 9.0, cls: 'pk', pos: 'left:24px' },
        { type: 'chip', html: 'видно з телефона', top: 428, at: 9.5, cls: 'pk', pos: 'left:24px' }
      ] }
    ]
  });

  reg('p-review', {
    title: 'Біль: неприбраний номер і поганий відгук', group: 'pain', pain: 'Гостя заселили в неприбраний номер: рейтинг падає', theme: 'dark',
    segs: [
      { a: 0, b: 6.8, els: [
        { type: 'num', from: 4.8, to: 4.5, n1: 3.0, n2: 3.8, top: 56, cls: 'c xl', fmt: n => n.toFixed(1).replace('.', ','), label: 'рейтинг готелю', at: .1, anim: 'pop' },
        { type: 'html', at: 1.3, anim: 'up', html: `<div class="vdv-box" style="left:24px;right:24px;top:176px;padding:14px;display:grid;gap:6px">
            <span style="font-size:17px;letter-spacing:2px"><b style="color:#FFD27A">★</b><span style="color:rgba(255,255,255,.25)">★★★★</span></span>
            <span style="font:600 15px/1.35 var(--vd-body)">«Заселили в неприбраний номер. Рушники на підлозі.»</span>
            <span style="font-size:11px;color:var(--muted)">новий відгук · умовний приклад</span></div>` },
        { type: 'flash', at: 3.0 },
        { type: 'big', html: 'Один неприбраний номер :', top: 330, size: 28, at: 2.4 },
        { type: 'big', html: '<em class="r">і рейтинг падає.</em>', top: 396, size: 34, at: 3.0, anim: 'slam' },
        { type: 'big', html: 'А з ним: бронювання.', top: 450, size: 24, at: 4.4 }
      ] },
      { a: 7.0, b: 11.7, els: [
        { type: 'cap', html: 'VDALO бачить <em>статус кожного номера</em>', size: 30 },
        { type: 'card', icc: 'x', ic: '!', t: '202 · брудний', s: 'заїзд о 14:00', tag: 'брудний', tagc: 'bad', top: 170, at: 7.4 },
        { type: 'card', icc: 'n', ic: I.broom, t: 'Покоївка отримала задачу', s: 'прибрати 202 до 13:00', top: 228, at: 8.1, check: 8.6 },
        { type: 'card', icc: 'g', ic: I.check, t: '202 · готовий до заїзду', s: 'рецепція бачить статус', tag: 'готовий', tagc: 'ok', top: 286, at: 9.0 },
        { type: 'big', html: 'Гість заходить <em>у чистий номер.</em>', top: 380, size: 30, at: 9.8 }
      ] }
    ]
  });

  reg('p-vacation', {
    title: 'Біль: немає відпустки', group: 'pain', pain: 'Власник не може відпочити: готель тримає на телефоні', theme: 'sun', stars: 0,
    segs: [
      { a: 0, b: 6.8, els: [
        { type: 'html', at: 0, anim: 'fade', html: '<div style="position:absolute;right:18px;top:204px;width:84px;height:84px;border-radius:50%;background:#FFF1C9;box-shadow:0 0 60px rgba(255,241,201,.8)"></div>' },
        { type: 'big', html: 'Коли ви востаннє', top: 58, size: 36, at: .1 },
        { type: 'big', html: 'відпочивали', top: 98, size: 36, at: .5 },
        { type: 'big', html: '<em>без телефону?</em>', top: 138, size: 36, at: .9, anim: 'slam' },
        { type: 'html', at: 1.4, anim: 'up', shake: [2.0, 6.4], shakeA: 1.4, html: `<div class="vdv-mphone" style="left:92px;top:226px;width:176px;height:300px"><div class="isl"></div><div class="in">
            <div class="nt"><i style="background:#7360F2">V</i>Адмін: що робити з 105?</div>
            <div class="nt"><i style="background:#2F6FDB">B</i>Booking: нове бронювання</div>
            <div class="nt"><i style="background:#E8566D">!</i>Гість: де забрати ключ?</div>
            <div class="nt"><i style="background:#E8566D">3</i>Пропущені дзвінки</div>
            <div class="nt"><i style="background:#7360F2">V</i>Покоївка: в 202 немає білизни</div></div></div>` },
        { type: 'html', at: .2, anim: 'fade', html: '<div style="position:absolute;left:0;right:0;bottom:0;height:90px;background:repeating-linear-gradient(180deg,rgba(255,255,255,.18) 0 3px,transparent 3px 14px),linear-gradient(180deg,#6A6FC0,#4D3C8E)"></div>' }
      ] },
      { a: 7.0, b: 11.7, els: [
        { type: 'cap', html: 'Готель під контролем: <em>навіть з пляжу</em>', size: 29 },
        { type: 'html', at: 7.4, anim: 'up', html: `<div class="vdv-mphone" style="left:92px;top:172px;width:176px;height:300px"><div class="isl"></div><div class="in">
            <b style="font:800 15px var(--vd-display)">Сьогодні</b>
            <div class="nt"><i style="background:#FF92BD;color:#39233E">6</i>заїздів · інструкції підготовлено</div>
            <div class="nt"><i style="background:#FF92BD;color:#39233E">4</i>виїзди · оплачено</div>
            <div class="nt"><i style="background:#FF92BD;color:#39233E">2</i>прибирання · у роботі</div>
            <div class="nt" style="background:rgba(92,200,152,.2)"><i style="background:#5CC898;color:#39233E">✓</i>Усе за планом</div></div></div>` },
        { type: 'chip', html: 'задачі команді: без ваших дзвінків', top: 494, at: 9.4, cls: 'pk', pos: 'left:24px' }
      ] }
    ]
  });

  reg('p-reports', {
    title: 'Біль: туристичний збір і звітність', group: 'pain', pain: 'Кінець кварталу: туристичний збір і звірка даних', theme: 'red',
    segs: [
      { a: 0, b: 6.8, els: [
        { type: 'big', html: 'Кінець кварталу.', top: 66, size: 38, at: .1, anim: 'slam' },
        { type: 'big', html: 'Звітність.', top: 114, size: 38, at: .7, anim: 'slam' },
        { type: 'big', html: 'Туристичний збір.', top: 162, size: 31, at: 1.3, anim: 'slam' },
        { type: 'big', html: 'Ставки й пільги.', top: 206, size: 34, at: 1.9, anim: 'slam' },
        { type: 'big', html: 'Звірка даних.', top: 254, size: 34, at: 2.5, anim: 'slam' },
        { type: 'big', html: '<em class="r">Звірка затягується?</em>', top: 316, size: 30, at: 3.2, anim: 'slam' },
        { type: 'flash', at: 3.2 },
        { type: 'big', html: 'Знайомо?', top: 450, size: 54, at: 4.4, cls: 'c' }
      ] },
      { a: 7.0, b: 11.7, els: [
        { type: 'cap', html: 'Туристичний збір: <em>розрахунок і звірка</em>', size: 31 },
        { type: 'card', icc: 'p', ic: I.receipt, t: 'Місцева ставка', s: 'перевірте рішення громади', mini: [7.4, 8.4], top: 160, at: 7.3, check: 8.4 },
        { type: 'card', icc: 'p', ic: I.receipt, t: 'Пільги', s: 'враховуйте підставу й документи', mini: [8.1, 9.1], top: 222, at: 8.0, check: 9.1 },
        { type: 'card', icc: 'p', ic: grid, t: 'Квартальна звітність', s: 'звірте період і дані', mini: [8.8, 9.8], top: 284, at: 8.7, check: 9.8 },
        { type: 'big', html: 'Звірте дані <em>до подання звіту.</em>', top: 390, size: 32, at: 10.2 }
      ] }
    ]
  });

  reg('p-pricing', {
    title: 'Біль: ціни стоять на місці', group: 'pain', pain: 'У вихідні та свята ціна та сама, що в будні', theme: 'dark',
    segs: [
      { a: 0, b: 6.8, els: [
        { type: 'big', html: 'Вихідні.', top: 58, size: 38, at: .1, anim: 'slam' },
        { type: 'big', html: 'А ціна та сама,', top: 100, size: 32, at: .7 },
        { type: 'big', html: '<em class="r">що й у вівторок.</em>', top: 138, size: 32, at: 1.2 },
        { type: 'html', at: 1.6, anim: 'up', html: week(['1200', '1200', '1200', '1200', '1200', '1200', '1200'], [40, 34, 38, 52, 120, 130, 60]) },
        { type: 'chip', html: 'попит ↑', top: 214, at: 2.6, cls: 'pk', pos: 'left:205px' },
        { type: 'big', html: 'Ви недозаробляєте <em class="r">щотижня.</em>', top: 452, size: 28, at: 3.6 }
      ] },
      { a: 7.0, b: 11.7, els: [
        { type: 'cap', html: 'Правила цін <em>у VDALO</em>', size: 36 },
        { type: 'html', at: 7.3, anim: 'fade', html: week(['1200', '1200', '1200', '1200', '', '', '1200'], [40, 34, 38, 52, 120, 130, 60]) },
        { type: 'num', from: 1200, to: 1500, n1: 8.0, n2: 8.8, top: 256, at: 7.3, anim: 'fade', fmt: n => Math.round(n / 10) * 10, pos: 'left:204px;right:auto;width:36px;text-align:center', cls: 'sm' },
        { type: 'num', from: 1200, to: 1500, n1: 8.0, n2: 8.8, top: 246, at: 7.3, anim: 'fade', fmt: n => Math.round(n / 10) * 10, pos: 'left:246px;right:auto;width:36px;text-align:center', cls: 'sm' },
        { type: 'chip', html: 'вихідні', top: 452, at: 9.0, cls: 'ok', pos: 'left:24px' },
        { type: 'chip', html: 'свята', top: 452, at: 9.3, cls: 'ok', pos: 'left:110px' },
        { type: 'chip', html: 'останні номери', top: 452, at: 9.6, cls: 'ok', pos: 'left:180px' },
        { type: 'html', at: 7.4, anim: 'fade', html: '<div class="vdv-foot" style="bottom:22px">Ціни умовні. Правила налаштовуєте ви.</div>' }
      ] }
    ]
  });

  // =====================================================================
  // МАРКЕТИНГ
  // =====================================================================
  reg('m-price', {
    title: 'Ціна: менше, ніж кава', group: 'marketing', theme: 'cream',
    segs: [
      { a: 0, b: 6.8, els: [
        { type: 'big', html: 'Менше,', top: 64, size: 44, at: .1, anim: 'slam' },
        { type: 'big', html: 'ніж <em>кава на день.</em>', top: 112, size: 44, at: .6, anim: 'slam' },
        { type: 'num', from: 0, to: 13, n1: 1.4, n2: 2.2, top: 236, at: 1.3, cls: 'c p xl', label: 'на день', fmt: n => `${Math.round(n)} грн` },
        { type: 'big', html: '= від 390 грн на місяць', top: 380, size: 26, at: 2.8, cls: 'c' },
        { type: 'html', at: 3.2, anim: 'fade', html: '<div class="vdv-foot" style="bottom:22px">Тариф Start: від 390 грн/міс.</div>' }
      ] },
      { a: 7.0, b: 11.7, els: [
        { type: 'cap', html: 'А готель <em>працює вдало</em>', size: 34 },
        { type: 'card', icc: 'p', ic: grid, t: 'Усі бронювання: в одній шахматці', cls: 'wrap', top: 170, at: 7.4, check: 7.9 },
        { type: 'card', icc: 'p', ic: phoneI, t: 'Гості, оплати й команда: з телефона', cls: 'wrap', top: 234, at: 8.1, check: 8.6 },
        { type: 'card', icc: 'p', ic: tg, t: 'Підтримка в Telegram', top: 298, at: 8.8, check: 9.3 },
        { type: 'big', html: 'Без картки на старті.', top: 380, size: 26, at: 9.8 }
      ] }
    ]
  });

  reg('m-setup', {
    title: 'Підключення самостійно', group: 'marketing', theme: 'dark',
    segs: [
      { a: 0, b: 6.8, els: [
        { type: 'big', html: 'Налаштуйте', top: 60, size: 42, at: .1, anim: 'slam' },
        { type: 'big', html: '<em>самі.</em>', top: 106, size: 56, at: .6, anim: 'slam' },
        { type: 'big', html: 'За відео-інструкціями.', top: 172, size: 24, at: 1.2 },
        { type: 'card', icc: 'p', ic: '1', t: 'Номери й тарифи', s: 'крок за кроком', mini: [2.2, 3.0], top: 236, at: 2.0, check: 3.0 },
        { type: 'card', icc: 'p', ic: '2', t: 'Booking і Airbnb', s: 'підключення каналів', mini: [3.2, 4.0], top: 296, at: 3.0, check: 4.0 },
        { type: 'card', icc: 'p', ic: '3', t: 'Віджет на ваш сайт', s: 'прямі бронювання', mini: [4.2, 5.0], top: 356, at: 4.0, check: 5.0 },
        { type: 'chip', html: 'для готелів до 12 номерів і апартаментів', top: 436, at: 5.4, cls: 'pk', pos: 'left:24px' }
      ] },
      { a: 7.0, b: 11.7, els: [
        { type: 'cap', html: 'Є питання? <em>Пишіть у Telegram</em>', size: 32 },
        { type: 'bub', html: 'Як підключити Airbnb?', top: 180, at: 7.4 },
        { type: 'bub', side: 'r', html: '<small>Підтримка VDALO</small>Ось коротке відео: крок за кроком. Якщо щось не вийде, допоможемо.', top: 226, at: 8.2 },
        { type: 'big', html: 'Більший готель? <em>Підключимо під ключ.</em>', top: 360, size: 26, at: 9.6 }
      ] }
    ]
  });

  const APPS = [['Excel', 30, 190], ['Зошит', 200, 176], ['Viber', 110, 250], ['Booking', 220, 262], ['Airbnb', 36, 318], ['Калькулятор', 160, 338], ['Каса', 260, 404], ['Календар', 60, 414]];
  reg('m-allinone', {
    title: 'Усе в одній системі', group: 'marketing', theme: 'ink',
    segs: [
      { a: 0, b: 7.4, els: [
        { type: 'big', html: '8 програм', top: 64, size: 46, at: .1, anim: 'slam', out: 6.6 },
        { type: 'big', html: '<em class="r">на один готель?</em>', top: 114, size: 34, at: .6, out: 6.6 },
        ...APPS.map(([n, x, y], i) => ({ type: 'chip', html: n, top: y, at: .9 + i * .22, anim: 'pop', cls: 'bad', pos: `left:${x}px`, shake: [3.2, 5.0], shakeA: 2.5, move: [5.2, 6.4, 160 - x - 30, 330 - y, .3, 1] })),
        { type: 'html', at: 6.2, out: 7.4, anim: 'pop', html: '<div class="vdv-mark" style="position:absolute;left:0;right:0;top:300px;justify-content:center"><i></i>VDALO</div>' }
      ] },
      { a: 7.4, b: 11.7, els: [
        { type: 'cap', html: 'Одна система: <em>замість усіх</em>', size: 32 },
        { type: 'card', icc: 'p', ic: grid, t: 'Шахматка і канали продажу', top: 176, at: 7.8, check: 8.2 },
        { type: 'card', icc: 'p', ic: I.receipt, t: 'Статуси оплат і туристичний збір', top: 232, at: 8.3, check: 8.7 },
        { type: 'card', icc: 'p', ic: I.broom, t: 'Задачі команді', top: 288, at: 8.8, check: 9.2 },
        { type: 'card', icc: 'p', ic: I.chat, t: 'Сторінка з інформацією для гостей', top: 344, at: 9.3, check: 9.7 }
      ] }
    ]
  });

  reg('m-day', {
    title: 'Один день готелю у VDALO', group: 'marketing', theme: 'dark',
    segs: [
      { a: 0, b: 11.7, els: [
        { type: 'cap', html: 'Один день готелю <em>у VDALO</em>', size: 34 },
        { type: 'html', at: .6, anim: 'fade', html: '<div style="position:absolute;left:46px;top:160px;bottom:96px;width:2px;background:linear-gradient(180deg,var(--pink),rgba(255,146,189,.1))"></div>' },
        ...[['08:00', 'Виїзд 104: статус оновлено', 1.0], ['10:30', 'Покоївка: 104 прибрано', 2.2], ['14:00', 'Заїзд 203: інструкції доступні', 3.4], ['16:20', 'Booking: нова бронь у календарі', 4.6], ['19:10', 'Передплату внесено: статус оновлено', 5.8], ['22:40', 'Гість відкрив сторінку з інструкціями', 7.0]]
          .map(([time, txt, at], i) => ({ type: 'html', at, anim: 'left', html: `<div style="position:absolute;left:38px;right:24px;top:${156 + i * 60}px;display:grid;grid-template-columns:18px 1fr;gap:12px;align-items:start">
              <i style="width:18px;height:18px;border-radius:50%;background:var(--pink);box-shadow:0 0 0 5px rgba(255,146,189,.2);margin-top:6px"></i>
              <span style="display:grid;gap:3px"><b style="font:800 15px var(--vd-display);color:var(--pink-l)">${time}</b><span style="font:600 13.5px/1.3 var(--vd-body)">${txt}</span></span></div>` })),
        { type: 'big', html: 'А ви: <em>на головному.</em>', top: 528, size: 28, at: 8.6 }
      ] }
    ]
  });

  const FEAT = [['Шахматка', grid], ['Booking + Airbnb', lock], ['Сторінка гостя', I.key], ['Статуси передплат', I.receipt], ['Задачі команді', I.broom], ['Інструкції для гостей', I.chat], ['Віджет на сайт', tag]];
  reg('m-features', {
    title: 'Можливості за 10 секунд', group: 'marketing', theme: 'ink',
    segs: [
      { a: 0, b: 11.7, els: [
        ...FEAT.flatMap(([n, ic], i) => {
          const at = .2 + i * 1.25, out = i < FEAT.length - 1 ? at + 1.15 : 9.6;
          return [
            { type: 'html', at, out, anim: 'pop', html: `<div style="position:absolute;left:140px;top:170px;width:80px;height:80px;border-radius:24px;background:var(--pink);color:var(--plum);display:grid;place-items:center">${ic.replace('<svg', '<svg style="width:40px;height:40px"')}</div>` },
            { type: 'big', html: `${n}.`, top: 280, size: 44, at: at + .08, out, anim: 'slam', cls: 'c' },
            { type: 'html', at: at + .1, out: 11.7, anim: 'fade', html: `<i style="position:absolute;top:400px;left:${76 + i * 32}px;width:18px;height:6px;border-radius:3px;background:var(--pink)"></i>` }
          ];
        }),
        { type: 'big', html: 'Усе це: <em>VDALO.</em>', top: 230, size: 44, at: 9.8, cls: 'c' }
      ] }
    ]
  });

  reg('m-trial', {
    title: 'Тест без ризику', group: 'marketing', theme: 'dark',
    segs: [
      { a: 0, b: 11.7, els: [
        { type: 'big', html: 'Спробуйте', top: 60, size: 44, at: .1, anim: 'slam' },
        { type: 'big', html: '<em>без ризику.</em>', top: 108, size: 44, at: .6, anim: 'slam' },
        { type: 'card', icc: 'p', ic: '1', t: 'Надсилаєте запит', s: 'команда узгоджує підключення', top: 190, at: 1.4, check: 2.2 },
        { type: 'card', icc: 'p', ic: '2', t: 'Узгоджуєте налаштування', s: 'і дату початку тесту', top: 250, at: 2.6, check: 3.4 },
        { type: 'card', icc: 'p', ic: '3', t: 'Перевіряєте потрібні процеси', s: 'план тестування залежить від об’єкта', top: 310, at: 3.8, check: 4.6 },
        { type: 'card', icc: 'g', ic: '4', t: 'Умови тесту й тарифу', s: 'підтверджує команда до старту', top: 370, at: 5.0, check: 5.8 },
        { type: 'chip', html: 'без оплати за тестовий період', top: 452, at: 6.6, cls: 'ok', pos: 'left:24px' },
        { type: 'chip', html: 'дату старту узгоджуємо', top: 452, at: 7.0, cls: 'ok', pos: 'left:202px' },
        { type: 'chip', html: 'підтримка за узгодженим сценарієм', top: 500, at: 7.4, cls: 'ok', pos: 'left:24px' }
      ] }
    ]
  });

  reg('m-ukraine', {
    title: 'Зроблено для українських готелів', group: 'marketing', theme: 'dark',
    segs: [
      { a: 0, b: 11.7, els: [
        { type: 'big', html: 'Зроблено', top: 60, size: 42, at: .1, anim: 'slam' },
        { type: 'big', html: '<em>для українських готелів.</em>', top: 106, size: 34, at: .6, anim: 'slam' },
        { type: 'card', icc: 'p', ic: I.receipt, t: 'Облік оплат і передплат', top: 218, at: 1.6, check: 2.2 },
        { type: 'card', icc: 'p', ic: I.receipt, t: 'Туристичний збір', top: 274, at: 2.6, check: 3.2 },
        { type: 'card', icc: 'p', ic: '₴', t: 'Ціни й оплати в гривнях', top: 330, at: 3.6, check: 4.2 },
        { type: 'card', icc: 'p', ic: 'УА', t: 'Інтерфейс українською', top: 386, at: 4.6, check: 5.2 },
        { type: 'card', icc: 'p', ic: tg, t: 'Підтримка в Telegram', top: 442, at: 5.6, check: 6.2 },
        { type: 'big', html: 'Без перекладів <em>і обхідних шляхів.</em>', top: 520, size: 24, at: 7.2 }
      ] }
    ]
  });

  const SCREEN = (title, rows) => `<div class="vdv-mphone" style="left:70px;top:168px;width:220px;height:380px"><div class="isl"></div><div class="in">
      <b style="font:800 16px var(--vd-display);margin:4px 2px">${title}</b>${rows}</div></div>`;
  const nt = (c, i, t) => `<div class="nt"><i style="background:${c}">${i}</i>${t}</div>`;
  reg('m-mobile', {
    title: 'Готель у кишені', group: 'marketing', theme: 'dark',
    segs: [
      { a: 0, b: 11.7, els: [
        { type: 'cap', html: 'Готель <em>у кишені</em>', size: 40 },
        { type: 'html', at: .5, out: 3.2, anim: 'up', html: SCREEN('Сьогодні', nt('#FF92BD', '6', 'заїздів') + nt('#FF92BD', '4', 'виїзди') + nt('#FF92BD', '%', 'заповненість 78%') + nt('#5CC898', '✓', 'усі номери прибрані')) },
        { type: 'html', at: 3.4, out: 6.0, anim: 'right', html: SCREEN('Шахматка', nt('#2F6FDB', 'B', '201 · Booking · пт–нд') + nt('#FF5A5F', 'A', '302 · Airbnb · сб–пн') + nt('#C76A96', 'S', '105 · сайт · сьогодні') + nt('#2F6FDB', 'B', '303 · Booking · нд')) },
        { type: 'html', at: 6.2, out: 8.8, anim: 'right', html: SCREEN('Задачі', nt('#7360F2', '✓', 'Прибрати 202: готово') + nt('#7360F2', '…', 'Кран у 105: технік') + nt('#7360F2', '…', 'Білизна в 301')) },
        { type: 'html', at: 9.0, out: 11.7, anim: 'right', html: SCREEN('Оплати', nt('#5CC898', '₴', '201 · внесена сума') + nt('#5CC898', '₴', '302 · залишок до сплати') + nt('#5CC898', '₴', 'Туристичний збір · розрахунок')) },
        { type: 'html', at: .5, anim: 'fade', html: '<div class="vdv-foot" style="bottom:22px">Приклад екранів. Суми умовні.</div>' }
      ] }
    ]
  });

  reg('m-guest', {
    title: 'Шлях гостя без дзвінків', group: 'marketing', theme: 'dark',
    segs: [
      { a: 0, b: 11.7, els: [
        { type: 'cap', html: 'Шлях гостя: <em>без зайвих дзвінків</em>', size: 30 },
        ...[['Переглядає сторінку бронювання', tag], ['Узгоджує спосіб передплати', card], ['Отримує інструкції', I.key], ['Заїжджає за правилами об’єкта', lock], ['Відкриває сторінку гостя', I.chat], ['Виїзд: номер у задачах на прибирання', I.broom]]
          .map(([t, ic], i) => ({ type: 'card', icc: 'p', ic, t, cls: 'wrap', top: 150 + i * 62, at: .8 + i * 1.2, check: 1.4 + i * 1.2 })),
        { type: 'html', at: 8.6, anim: 'fade', html: '<div class="vdv-foot" style="bottom:22px">PIN-заселення: з розумним замком.</div>' }
      ] }
    ]
  });

  reg('m-compare', {
    title: 'Було / Стало', group: 'marketing', theme: 'dark',
    segs: [
      { a: 0, b: 11.7, els: [
        { type: 'cap', html: 'Було. <em>Стало.</em>', size: 44 },
        ...[['Excel і зошит', 'Шахматка'], ['Повторні питання', 'Сторінка гостя'], ['Інструкції на словах', 'Посилання гостю'], ['Оплати в нотатках', 'Статус у бронюванні'], ['Ризик помилок у датах', 'Підключення каналів'], ['Чати з покоївкою', 'Задачі в системі']]
          .flatMap(([was, now], i) => {
            const at = .7 + i * 1.3, top = 150 + i * 62;
            return [
              { type: 'card', icc: 'x', ic: '×', t: was, top, at, strike: at + .5, anim: 'left', pos: 'right:186px', cls: 'wrap' },
              { type: 'card', icc: 'p', ic: I.check, t: now, top, at: at + .6, anim: 'right', pos: 'left:184px', cls: 'wrap' }
            ];
          })
      ] }
    ]
  });
})();
