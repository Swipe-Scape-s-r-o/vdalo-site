/* VDALO · «Живий готель» - МОБІЛЬНА версія (v4.1), vanilla JS без залежностей.
   Стартує лише на екранах до 860 px (або з атрибутом data-always на секції).
   Події для аналітики (Фаза 2): lh:manual-fix, lh:vdalo-on, lh:summary, lh:cta - CustomEvent на секції #living-hotel-m. */
(() => {
  'use strict';
  const host = document.getElementById('living-hotel-m');
  if (!host) return;
  const boot = () => {
  const NS = 'http://www.w3.org/2000/svg';
  const root = document.getElementById('living-hotel-m');
  const svg = document.getElementById('lhm-svg');
  const stage = document.getElementById('lhm-stage');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const narrowMQ = { matches: true, addEventListener() {} };
  const $ = s => root.querySelector(s);
  const el = (tag, attrs = {}, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  const txt = (parent, attrs, s) => { const t = el('text', attrs, parent); t.textContent = s; return t; };
  const emit = (name, detail = {}) => root.dispatchEvent(new CustomEvent(`lh:${name}`, { bubbles: true, detail }));
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

  // ---------- isometric geometry ----------
  // Each wall is drawn in flat (u, v) coordinates and projected with an SVG matrix,
  // so windows, drops and cracks land in perspective automatically. Labels are drawn in screen space.
  const C = 0.8660254, S = 0.5;
  const L = 300, D = 180, FH = 70, FLOORS = 5, LOBBY_H = 96, H = FLOORS * FH + LOBBY_H; // 446
  const CX = 430, GY = 700, TOPY = GY - H;           // front-bottom corner of the building
  const FACE = {
    left:  [C,  S, 0, 1, CX - C * L, TOPY - S * L],  // u: 0 = far-left end … L = front corner
    right: [C, -S, 0, 1, CX, TOPY]                   // u: 0 = front corner … D = far-right end
  };
  const proj = (f, u, v) => { const m = FACE[f]; return [m[0] * u + m[2] * v + m[4], m[1] * u + m[3] * v + m[5]]; };
  // ground: a runs along the left wall away from the corner, b along the right wall; b < 0 is the street side
  const gp = (a, b, z = 0) => [CX - C * a + C * b, GY - S * a - S * b - z];
  const pts = arr => arr.map(p => p.join(',')).join(' ');

  const layer = n => el('g', { 'data-layer': n }, svg);
  const L_SKY = layer('sky'), L_GROUND = layer('ground'), L_BLD = layer('building'), L_FRONT = layer('front'),
        L_ACTORS = layer('actors'), L_FX = layer('fx'), L_PINS = layer('pins');

  // sky
  for (let i = 0; i < 50; i++) el('circle', { cx: rand(0, 800), cy: rand(0, 420), r: rand(.6, 1.7), class: 'star', style: `animation-delay:${rand(-3, 0).toFixed(2)}s` }, L_SKY);
  el('circle', { cx: 700, cy: 110, r: 30, fill: '#F6E7C9', opacity: .92 }, L_SKY);
  el('circle', { cx: 712, cy: 102, r: 26, fill: 'var(--plum)', opacity: .6 }, L_SKY);

  // ground tile (diorama with thickness)
  const A0 = -70, A1 = 380, B0 = -150, B1 = 250, TH = 18;
  el('polygon', { points: pts([gp(A1, B0), gp(A0, B0), gp(A0, B0, -TH), gp(A1, B0, -TH)]), fill: 'var(--tile-front)' }, L_GROUND);
  el('polygon', { points: pts([gp(A0, B0), gp(A0, B1), gp(A0, B1, -TH), gp(A0, B0, -TH)]), fill: 'var(--tile-side)' }, L_GROUND);
  el('polygon', { points: pts([gp(A0, B0), gp(A1, B0), gp(A1, B1), gp(A0, B1)]), fill: 'var(--tile)' }, L_GROUND);
  el('polygon', { points: pts([gp(A0, -128), gp(A1, -128), gp(A1, -66), gp(A0, -66)]), fill: 'var(--road)' }, L_GROUND);
  for (let a = A0 + 10; a < A1 - 20; a += 46) el('polygon', { points: pts([gp(a, -98), gp(a + 22, -98), gp(a + 22, -95), gp(a, -95)]), fill: '#FFE1EC', opacity: .35 }, L_GROUND);
  el('polygon', { points: pts([gp(A0, -66), gp(A1, -66), gp(A1, 0), gp(A0, 0)]), fill: 'var(--sidewalk)' }, L_GROUND);
  el('polygon', { points: pts([gp(0, 0), gp(L, 0), gp(L + 40, -26), gp(40, -26)]), fill: '#000', opacity: .18 }, L_GROUND);

  // ---------- building ----------
  const faceG = (f, parent) => el('g', { class: 'face', transform: `matrix(${FACE[f].join(' ')})` }, parent);
  const FL = faceG('left', L_BLD), FR = faceG('right', L_BLD);
  el('rect', { x: 0, y: 0, width: L, height: H, fill: 'var(--wall-l)' }, FL);
  el('rect', { x: 0, y: 0, width: L, height: H, fill: 'url(#lhmShadeL)' }, FL);
  el('rect', { x: 0, y: 0, width: D, height: H, fill: 'var(--wall-r)' }, FR);
  el('rect', { x: 0, y: 0, width: D, height: H, fill: 'url(#lhmShadeR)' }, FR);
  for (let f = 0; f <= FLOORS; f++) {
    el('rect', { x: 0, y: f * FH - 3, width: L, height: 6, fill: 'var(--trim)' }, FL);
    el('rect', { x: 0, y: f * FH - 3, width: D, height: 6, fill: '#33213A' }, FR);
  }
  // roof with a parapet rim
  const R1 = proj('left', L, 0), R0 = proj('left', 0, 0), R2 = proj('right', D, 0);
  const RB = [R0[0] + C * D, R0[1] - S * D];
  const roof = [R1, R0, RB, R2];
  el('polygon', { points: pts(roof), fill: 'var(--roof)' }, L_BLD);
  const rc = roof.reduce((s, p) => [s[0] + p[0] / 4, s[1] + p[1] / 4], [0, 0]);
  el('polygon', { points: pts(roof.map(p => [rc[0] + (p[0] - rc[0]) * .9, rc[1] + (p[1] - rc[1]) * .86 + 3])), fill: 'var(--roof-in)' }, L_BLD);
  // roof sign
  const sign = el('g', { class: 'flicker' }, L_BLD);
  const [sx, sy] = [rc[0], rc[1] + 8];
  el('rect', { x: sx - 40, y: sy - 34, width: 4, height: 30, fill: '#2A1D30' }, sign);
  el('rect', { x: sx + 36, y: sy - 34, width: 4, height: 30, fill: '#2A1D30' }, sign);
  el('rect', { x: sx - 96, y: sy - 90, width: 192, height: 70, rx: 22, fill: 'var(--pink)', opacity: .1 }, sign);
  el('rect', { x: sx - 82, y: sy - 78, width: 164, height: 46, rx: 12, fill: 'var(--plum-dark)', stroke: 'var(--pink)', 'stroke-width': 2 }, sign);
  const signText = txt(sign, { x: sx, y: sy - 47, 'text-anchor': 'middle', 'font-size': 23, class: 'sign-text' }, 'HOTEL');

  // windows: left wall 3 rooms per floor, right wall 2 decorative windows
  const WW = 56, WH = 38, WX = [33, 122, 211];
  const windows = [];
  const drawWindow = (g, x, y, w, h) => {
    const wg = el('g', { class: 'win' }, g);
    el('rect', { x: x - 7, y: y - 7, width: w + 14, height: h + 14, rx: 6, class: 'glow' }, wg);
    el('rect', { x: x - 3, y: y - 3, width: w + 6, height: h + 7, rx: 2, fill: 'var(--trim)' }, wg);
    el('rect', { x, y, width: w, height: h, rx: 1, class: 'glass' }, wg);
    el('rect', { x: x + w / 2 - 8, y: y + 5, width: 16, height: 5, rx: 2.5, class: 'lamp' }, wg);
    el('rect', { x, y, width: w, height: 5, fill: '#000', opacity: .22 }, wg);
    el('rect', { x: x + w / 2 - 1, y, width: 2, height: h, fill: 'var(--trim)' }, wg);
    return wg;
  };
  const CUT_F = 3, CUT_I = 1;               // room 202 is shown cut-away
  for (let f = 0; f < FLOORS; f++) {
    for (let i = 0; i < 3; i++) {
      if (f === CUT_F && i === CUT_I) continue;
      const x = WX[i], y = f * FH + 16;
      windows.push({ g: drawWindow(FL, x, y, WW, WH), room: (FLOORS - f) * 100 + i + 1, f, i, x, y, busy: false });
    }
    [34, 106].forEach(x => { const g = drawWindow(FR, x, f * FH + 16, 40, WH); if (Math.random() < .55) g.classList.add('lit'); });
  }
  const byRoom = r => windows.find(w => w.room === r);

  // cut-away room 202: front wall removed, a little box with bed, lamp and washbasin
  const cutX = 104, cutY = CUT_F * FH + 7, cutW = 92, cutH = 58, d = 12;
  const CG = el('g', {}, FL);
  el('rect', { x: cutX - 4, y: cutY - 4, width: cutW + 8, height: cutH + 8, fill: 'var(--trim)' }, CG);
  el('rect', { x: cutX, y: cutY, width: cutW, height: cutH, class: 'room-light' }, CG);
  el('rect', { x: cutX + d, y: cutY + d * .6, width: cutW - 2 * d, height: cutH - d * 1.4, class: 'room-light' }, CG);
  el('polygon', { points: `${cutX},${cutY} ${cutX + cutW},${cutY} ${cutX + cutW - d},${cutY + d * .6} ${cutX + d},${cutY + d * .6}`, fill: '#000', opacity: .22 }, CG);
  el('polygon', { points: `${cutX},${cutY} ${cutX + d},${cutY + d * .6} ${cutX + d},${cutY + cutH - d * .8} ${cutX},${cutY + cutH}`, fill: '#000', opacity: .14 }, CG);
  el('polygon', { points: `${cutX + cutW},${cutY} ${cutX + cutW - d},${cutY + d * .6} ${cutX + cutW - d},${cutY + cutH - d * .8} ${cutX + cutW},${cutY + cutH}`, fill: '#000', opacity: .2 }, CG);
  el('polygon', { points: `${cutX},${cutY + cutH} ${cutX + d},${cutY + cutH - d * .8} ${cutX + cutW - d},${cutY + cutH - d * .8} ${cutX + cutW},${cutY + cutH}`, fill: '#8A5A44' }, CG);
  el('rect', { x: cutX + 18, y: cutY + 34, width: 38, height: 12, rx: 2, fill: '#F2E6DA' }, CG);
  el('rect', { x: cutX + 18, y: cutY + 30, width: 10, height: 6, rx: 2, fill: '#fff' }, CG);
  const blanket = el('rect', { x: cutX + 29, y: cutY + 30, width: 27, height: 8, rx: 2, fill: '#C97A9B' }, CG);
  el('rect', { x: cutX + 60, y: cutY + 22, width: 2, height: 14, fill: '#5A4060' }, CG);
  el('circle', { cx: cutX + 61, cy: cutY + 21, r: 5, fill: 'var(--lit-2)' }, CG);
  el('rect', { x: cutX + 66, y: cutY + 12, width: 2, height: cutH - 20, fill: '#5A4060' }, CG);
  el('rect', { x: cutX + 70, y: cutY + 16, width: 9, height: 11, rx: 1, fill: '#BFD6E4' }, CG);
  el('rect', { x: cutX + 69, y: cutY + 32, width: 12, height: 4, rx: 1, fill: '#EDEFF2' }, CG);
  el('rect', { x: cutX + 74, y: cutY + 28, width: 2, height: 5, fill: '#B8C4CF' }, CG);

  // lobby with reception desk, cash register and phone
  const LY = FLOORS * FH;
  el('rect', { x: 10, y: LY + 14, width: L - 20, height: LOBBY_H - 18, rx: 2, class: 'lobby-glass' }, FL);
  el('rect', { x: 10, y: LY + 14, width: L - 20, height: 4, fill: '#000', opacity: .2 }, FL);
  el('rect', { x: 196, y: LY + 30, width: 44, height: LOBBY_H - 30, fill: '#2D1A31', opacity: .6 }, FL);
  el('rect', { x: 217, y: LY + 30, width: 2, height: LOBBY_H - 30, fill: '#1A0F1D' }, FL);
  el('rect', { x: 28, y: LY + 64, width: 96, height: 28, rx: 2, fill: '#8A5A44' }, FL);
  el('rect', { x: 28, y: LY + 60, width: 96, height: 6, rx: 2, fill: '#A87058' }, FL);
  el('rect', { x: 92, y: LY + 48, width: 22, height: 13, rx: 2, fill: '#5C5560' }, FL);
  const regScreen = el('rect', { x: 95, y: LY + 50, width: 16, height: 5, rx: 1, fill: '#9FE3C2' }, FL);
  const phoneG = el('g', {}, FL);
  el('rect', { x: 40, y: LY + 52, width: 16, height: 9, rx: 2, fill: '#2A2230' }, phoneG);
  el('rect', { x: 37, y: LY + 49, width: 22, height: 4, rx: 2, fill: '#2A2230' }, phoneG);
  el('rect', { x: 258, y: LY + 70, width: 16, height: 22, rx: 2, fill: '#6B4B3E' }, FL);
  el('circle', { cx: 266, cy: LY + 62, r: 12, fill: '#3E6B52' }, FL);
  el('rect', { x: 14, y: LY + 14, width: D - 28, height: LOBBY_H - 18, rx: 2, class: 'lobby-glass' }, FR);
  el('rect', { x: 14, y: LY + 14, width: D - 28, height: LOBBY_H - 18, fill: '#000', opacity: .25 }, FR);
  // canopy over the entrance + clock
  const DOOR_A = L - 218;
  el('polygon', { points: pts([gp(L - 190, 0, LOBBY_H - 24), gp(L - 250, 0, LOBBY_H - 24), gp(L - 250, -34, LOBBY_H - 24), gp(L - 190, -34, LOBBY_H - 24)]), fill: 'var(--plum-dark)' }, L_BLD);
  el('polygon', { points: pts([gp(L - 190, -34, LOBBY_H - 24), gp(L - 250, -34, LOBBY_H - 24), gp(L - 250, -34, LOBBY_H - 30), gp(L - 190, -34, LOBBY_H - 30)]), fill: 'var(--pink)', opacity: .7 }, L_BLD);
  const [cxk, cyk] = proj('left', 150, LY + 7);
  const clockText = txt(L_BLD, { x: cxk, y: cyk + 4, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, fill: 'var(--pink)', transform: `rotate(30 ${cxk} ${cyk})` }, '22:00');

  // trees and a street lamp in front of the building
  const tree = (a, b, s) => {
    const [x, y] = gp(a, b);
    el('ellipse', { cx: x, cy: y, rx: 18 * s, ry: 9 * s, fill: '#000', opacity: .25 }, L_FRONT);
    el('rect', { x: x - 3 * s, y: y - 30 * s, width: 6 * s, height: 30 * s, fill: '#3A2530' }, L_FRONT);
    el('circle', { cx: x, cy: y - 44 * s, r: 22 * s, fill: '#2D4A3D' }, L_FRONT);
    el('circle', { cx: x - 9 * s, cy: y - 36 * s, r: 14 * s, fill: '#27402F' }, L_FRONT);
  };
  tree(340, -34, 1);
  {
    const [x, y] = gp(165, -58);
    el('ellipse', { cx: x, cy: y + 4, rx: 46, ry: 18, fill: 'var(--lit)', opacity: .08 }, L_GROUND);
    el('rect', { x: x - 2, y: y - 92, width: 4, height: 92, fill: '#2A1D30' }, L_FRONT);
    el('rect', { x: x - 2, y: y - 92, width: 18, height: 4, fill: '#2A1D30' }, L_FRONT);
    el('circle', { cx: x + 14, cy: y - 86, r: 5, fill: 'var(--lit-2)' }, L_FRONT);
  }

  // ---------- the owner's house: the person this block is about ----------
  const house = el('g', { class: 'house' }, L_FRONT);
  {
    const a0 = -66, a1 = -8, b0 = 182, b1 = 244, bm = (b0 + b1) / 2, zw = 38, zr = 62;
    const P = (a, b, z) => gp(a, b, z);
    el('polygon', { points: pts([P(a1 + 6, b0 - 4, 0), P(a0 - 4, b0 - 4, 0), P(a0 - 4, b1, 0), P(a1 + 6, b1, 0)]), fill: '#000', opacity: .25 }, house);
    el('polygon', { points: pts([P(a1, b0, 0), P(a0, b0, 0), P(a0, b0, zw), P(a1, b0, zw)]), fill: '#6A4C70' }, house);
    el('polygon', { points: pts([P(a0, b0, 0), P(a0, b1, 0), P(a0, b1, zw), P(a0, b0, zw)]), fill: '#523857' }, house);
    el('polygon', { points: pts([P(a0, b0, zw), P(a0, b1, zw), P(a0, bm, zr)]), fill: '#523857' }, house);
    el('polygon', { points: pts([P(a0 - 3, b0 - 4, zw - 2), P(a1 + 3, b0 - 4, zw - 2), P(a1 + 3, bm, zr), P(a0 - 3, bm, zr)]), fill: '#8E5F7E' }, house);
    el('polygon', { points: pts([P(-52, b0, 12), P(-34, b0, 12), P(-34, b0, 28), P(-52, b0, 28)]), class: 'house-win' }, house);
    el('polygon', { points: pts([P(-30, b0, 12), P(-16, b0, 12), P(-16, b0, 28), P(-30, b0, 28)]), class: 'house-win' }, house);
    el('polygon', { points: pts([P(a0, 196, 0), P(a0, 210, 0), P(a0, 210, 24), P(a0, 196, 24)]), fill: '#2D1A31' }, house);
    const [zx, zy] = P(-37, bm, zr + 6);
    const z = el('g', { class: 'zzz' }, house);
    txt(z, { x: zx + 6, y: zy - 6 }, 'z');
    txt(z, { x: zx + 18, y: zy - 20, 'font-size': 22 }, 'Z');
    const bell = el('g', { class: 'house-bell' }, house);
    el('rect', { x: zx - 18, y: zy - 44, width: 66, height: 26, rx: 12, fill: '#fff' }, bell);
    txt(bell, { x: zx + 15, y: zy - 26, 'text-anchor': 'middle', fill: 'var(--plum)', 'font-size': 13, 'font-weight': 800 }, 'Дзинь!');
    const [lx, ly] = P(-43, b1, 0);
    txt(house, { x: lx + 6, y: ly + 18, class: 'house-label', 'text-anchor': 'middle' }, 'ваш дім');
  }
  let wakeTimer = 0;
  function wakeOwner() {
    if (state.mode !== 'chaos') return;
    house.classList.add('awake');
    clearTimeout(wakeTimer);
    wakeTimer = setTimeout(() => house.classList.remove('awake'), 3400);
  }

  // ---------- actors: taxi & guests ----------
  const boxFaces = (g, a0, a1, b0, b1, z0, z1, top, side, end) => {
    el('polygon', { points: pts([gp(a1, b0, z0), gp(a0, b0, z0), gp(a0, b0, z1), gp(a1, b0, z1)]), fill: side }, g);
    el('polygon', { points: pts([gp(a0, b0, z0), gp(a0, b1, z0), gp(a0, b1, z1), gp(a0, b0, z1)]), fill: end }, g);
    el('polygon', { points: pts([gp(a0, b0, z1), gp(a1, b0, z1), gp(a1, b1, z1), gp(a0, b1, z1)]), fill: top }, g);
  };
  const taxi = el('g', { opacity: 0 }, L_ACTORS);
  {
    const o = gp(0, 0);
    const tg = el('g', { transform: `translate(${-o[0]} ${-o[1]})` }, taxi);
    el('polygon', { points: pts([gp(24, -14), gp(90, -30), gp(90, 30), gp(24, 14)]), class: 'headlight' }, tg);
    el('polygon', { points: pts([gp(-24, -12), gp(24, -12), gp(24, 12), gp(-24, 12)]), fill: '#000', opacity: .25 }, tg);
    boxFaces(tg, -24, 24, -12, 12, 3, 15, '#F5C542', '#D9A92A', '#C8961E');
    boxFaces(tg, -12, 12, -10, 10, 15, 25, '#2A2230', '#3B4B5A', '#33424F');
    boxFaces(tg, -4, 4, -4, 4, 25, 28, '#FFE07A', '#E8C24A', '#D7B13C');
    el('polygon', { points: pts([gp(-24, -9, 8), gp(-24, -4, 8), gp(-24, -4, 12), gp(-24, -9, 12)]), fill: '#FF4D5E' }, tg);
    el('polygon', { points: pts([gp(-24, 4, 8), gp(-24, 9, 8), gp(-24, 9, 12), gp(-24, 4, 12)]), fill: '#FF4D5E' }, tg);
  }
  const guestFig = color => {
    const g = el('g', { opacity: 0 }, L_ACTORS);
    el('ellipse', { cx: 0, cy: 0, rx: 9, ry: 4, fill: '#000', opacity: .3 }, g);
    el('rect', { x: -5, y: -14, width: 4, height: 14, fill: '#2A1D30' }, g);
    el('rect', { x: 1, y: -14, width: 4, height: 14, fill: '#2A1D30' }, g);
    el('rect', { x: -7, y: -36, width: 14, height: 24, rx: 6, fill: color }, g);
    el('circle', { cx: 0, cy: -43, r: 7, fill: '#EADFCF' }, g);
    el('rect', { x: 9, y: -20, width: 11, height: 18, rx: 2, fill: '#FF92BD' }, g);
    el('rect', { x: 13, y: -25, width: 3, height: 6, fill: '#FF92BD' }, g);
    return g;
  };
  const guestA = guestFig('#FFE1EC'), guestB = guestFig('#BFD6E4');
  const tweens = [];
  const place = (g, a, b) => { const [x, y] = gp(a, b); g.setAttribute('transform', `translate(${x} ${y})`); };
  const moveTo = (g, from, to, dur, done) => {
    g.setAttribute('opacity', 1);
    if (reduceMotion) { place(g, to[0], to[1]); done && done(); return; }
    place(g, from[0], from[1]);
    tweens.push({ g, from, to, dur, t: 0, done });
  };

  // ---------- state ----------
  const NIGHT_SEC = 46, START_MIN = 22 * 60;
  const BOARD0 = () => ([
    { room: 201, bars: [[0, 2, 's']], st: 'busy', label: 'Заселено' },
    { room: 202, bars: [[1, 3, 'b']], st: 'free', label: 'Вільний' },
    { room: 301, bars: [[0, 4, 'a']], st: 'busy', label: 'Заселено' },
    { room: 302, bars: [[2, 4, 'a']], st: 'free', label: 'Вільний' },
    { room: 303, bars: [], st: 'free', label: 'Вільний' }
  ]);
  const fresh = () => ({ phase: 'night', elapsed: 0, occ: 71, loss: 0, wake: 0, manual: 0, auto: 0, total: 0,
    usedVdalo: false, lossAtSwitch: 0, incidents: [], fired: new Set(), nudged: false,
    missedCalls: 0, dbl: false, board: BOARD0(), flash: 0, shotEnd: 0 });
  const state = Object.assign({ mode: 'chaos', visible: true }, fresh());
  const nowMin = () => START_MIN + Math.round(state.elapsed / NIGHT_SEC * 540);
  const timeStr = (m = nowMin()) => { m = ((m % 1440) + 1440) % 1440; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };
  const isNight = () => { const m = nowMin() % 1440; return m >= 23 * 60 || m < 6 * 60; };

  // ---------- 7 pains ----------
  const TYPES = {
    overbook: { tag: 'Овербукінг · 302', name: 'Гостю продали зайнятий номер 302', rate: 60, cost: 1800,
      manual: () => 'Переселили гостя в інший готель: −1 800 грн компенсації',
      auto: inc => inc.prevented ? 'Бронювання з Booking → номер 302 одразу закрито в Airbnb і на сайті. Овербукінгу не сталося'
                                 : 'VDALO показав вільний 303 - гостя заселено без переселення' },
    night:    { tag: 'Гість під дверима', name: 'Нічний заїзд, рецепція зачинена', rate: 45,
      manual: () => `Ви встали о ${timeStr()}, щоб відчинити двері`,
      auto: () => `Гість о ${timeStr()} використав підготовлений PIN-код (тестовий сценарій доступу)` },
    messy:    { tag: 'Не прибрано', name: 'Ранній заїзд, а 202 не прибраний', rate: 30,
      manual: () => 'Подзвонили покоївці - гість чекав 40 хвилин',
      auto: () => `Покоївка отримала задачу о ${timeStr()}. Рецепція бачить статус номера 202` },
    phone:    { tag: 'Дзвінки', name: 'Телефон рецепції не замовкає', rate: 35,
      manual: () => `Відповіли гостю о ${timeStr()}: де паркінг і пароль від Wi‑Fi`,
      auto: () => 'Гість знайшов паркінг, Wi‑Fi і сніданок на гостьовій сторінці' },
    leak:     { tag: 'Тече кран', name: 'Тече кран у 202', rate: 30,
      manual: () => 'Шукали сантехніка в чатах 30 хвилин',
      auto: () => `Задача сантехніку о ${timeStr()}. Номер 202 позначено «на огляді»` },
    energy:   { tag: 'Світло дарма', name: 'Світло й клімат у порожньому номері', rate: 22,
      manual: inc => `Збігали вимкнути світло в ${inc.room}`,
      auto: inc => `Номер ${inc.room} порожній → сценарій із датчиками: світло й клімат вимкнено (у розробці)` },
    cash:     { tag: 'Каса', name: 'Каса не сходиться після зміни', rate: 40,
      manual: () => 'Перерахували касу вручну: не вистачає 1 250 грн',
      auto: () => 'Записи оплат зібрані в системі для перевірки командою' }
  };
  // one night as data: [second, event]
  const TIMELINE = [
    [0.4, 'phone'], [2.2, 'energy'], [4.0, 'leak'], [5.2, 'overbook'], [11.5, 'cash'],
    [15.0, 'phone'], [18.0, 'night'], [23.0, 'energy'], [28.0, 'leak'], [33.0, 'phone'], [38.5, 'messy']
  ];

  // ---------- pins ----------
  const ANCHOR = {
    overbook: () => proj('left', WX[1] + 10, 2 * FH + 16),
    messy:    () => proj('left', cutX + 20, cutY),
    leak:     () => proj('left', cutX + cutW - 8, cutY),
    phone:    () => proj('left', 48, LY + 44),
    cash:     () => proj('left', 103, LY + 40),
    night:    () => { const p = gp(DOOR_A, -30); return [p[0], p[1] - 52]; },
    energy:   inc => proj('left', inc.win.x + WW / 2, inc.win.y)
  };
  const LABEL_SIDE = { overbook: 'left', messy: 'left', phone: 'left', leak: 'right', cash: 'right', night: 'right', energy: 'right' };
  function drawPin(inc, label) {
    const [x, y0] = inc.anchor; const y = y0 - 26;
    const g = el('g', { class: 'pin' }, inc.g);
    el('line', { x1: x, y1: y + 14, x2: x, y2: y0 - 2, stroke: 'var(--danger)', 'stroke-width': 2 }, g);
    el('circle', { cx: x, cy: y, r: 30, class: 'hit' }, g);
    el('circle', { cx: x, cy: y, r: 15, class: 'ring' }, g);
    el('circle', { cx: x, cy: y, r: 15, class: 'dot' }, g);
    txt(g, { x, y: y + 6, 'text-anchor': 'middle', class: 'ex' }, '!');
    const lg = el('g', { class: 'pin-label' }, g);
    const r = el('rect', { x: 0, y: y - 13, width: 10, height: 26, rx: 13 }, lg);
    const t = txt(lg, { x: 0, y: y + 5 }, label);
    let w = label.length * 7.4 + 20;
    try { const m = t.getComputedTextLength(); if (m > 0) w = m + 20; } catch (e) {}
    const lx = LABEL_SIDE[inc.type] === 'left' ? x - 22 - w : x + 22;
    r.setAttribute('x', lx); r.setAttribute('width', w); t.setAttribute('x', lx + 10);
  }

  // ---------- incident visuals ----------
  const DRAW = {
    overbook(inc) {
      const w = byRoom(302); inc.win = w; w.busy = true; w.g.classList.remove('lit'); w.g.classList.add('alert');
      const [x, y] = proj('left', WX[1] + WW, 2 * FH + 10);
      const bg = el('g', { class: 'badge' }, inc.g);
      el('rect', { x: x + 4, y: y - 18, width: 22, height: 22, rx: 6, fill: '#2F6FDB' }, bg); txt(bg, { x: x + 15, y: y - 2, 'text-anchor': 'middle' }, 'B');
      el('rect', { x: x + 30, y: y - 18, width: 22, height: 22, rx: 6, fill: '#FF5A5F' }, bg); txt(bg, { x: x + 41, y: y - 2, 'text-anchor': 'middle' }, 'A');
      txt(bg, { x: x + 58, y: y - 1, fill: '#FFB3BC', 'font-size': 15, 'font-weight': 800 }, '×2');
      const [gx, gy] = proj('left', 160, LY + 92);
      const b = el('g', { class: 'bubble' }, inc.g);
      el('rect', { x: gx - 150, y: gy - 96, width: 172, height: 28, rx: 12 }, b);
      txt(b, { x: gx - 64, y: gy - 77, 'text-anchor': 'middle' }, 'Я бронював на Booking!');
    },
    night(inc) {
      if (state.mode === 'chaos') root.classList.add('lobby-off');
      const [x, y] = gp(DOOR_A, -30);
      const b = el('g', { class: 'bubble' }, inc.g);
      el('rect', { x: x - 124, y: y - 96, width: 104, height: 28, rx: 12 }, b);
      txt(b, { x: x - 72, y: y - 77, 'text-anchor': 'middle' }, 'Зачинено?');
    },
    messy(inc) {
      root.classList.add('room-dark');
      blanket.setAttribute('transform', `rotate(-14 ${cutX + 42} ${cutY + 34})`);
      const g = el('g', {}, FL); inc.local = g;
      el('polyline', { points: `${cutX + 30},${cutY + 33} ${cutX + 36},${cutY + 29} ${cutX + 42},${cutY + 34} ${cutX + 49},${cutY + 29} ${cutX + 55},${cutY + 33}`, stroke: '#fff', 'stroke-width': 1.5, fill: 'none' }, g);
      el('rect', { x: cutX + 24, y: cutY + 49, width: 12, height: 4, rx: 1, fill: '#fff', transform: `rotate(8 ${cutX + 30} ${cutY + 51})` }, g);
      el('circle', { cx: cutX + 46, cy: cutY + 50, r: 2.5, fill: '#B88A5A' }, g);
      el('rect', { x: cutX + 52, y: cutY + 44, width: 4, height: 8, rx: 1, fill: '#5C8A6B' }, g);
    },
    leak(inc) {
      const g = el('g', {}, FL); inc.local = g;
      for (let k = 0; k < 3; k++) el('ellipse', { cx: cutX + 75, cy: cutY + 36, rx: 1.6, ry: 2.4, class: 'drop', style: `animation-delay:${-k * .27}s` }, g);
      el('ellipse', { cx: cutX + 72, cy: cutY + cutH - 6, rx: 10, ry: 2.2, class: 'puddle' }, g);
    },
    phone(inc) {
      phoneG.classList.add('shake');
      const [x, y] = proj('left', 20, LY + 40);
      ['Паркінг?', 'Wi‑Fi?'].forEach((q, k) => {
        const b = el('g', { class: 'bubble', style: `animation-delay:${-k * 1.2}s` }, inc.g);
        el('rect', { x: x - 64 + k * 14, y: y - 92 - k * 34, width: 84, height: 26, rx: 12 }, b);
        txt(b, { x: x - 22 + k * 14, y: y - 74 - k * 34, 'text-anchor': 'middle' }, q);
      });
    },
    energy(inc) {
      const pool = windows.filter(w => !w.busy && w.f <= 1);
      const w = pick(pool.length ? pool : windows.filter(x => !x.busy));
      inc.win = w; inc.room = w.room; w.busy = true;
      w.g.classList.remove('lit'); w.g.classList.add('cold');
      const [x, y] = proj('left', w.x + WW / 2, w.y);
      for (let k = 0; k < 3; k++) el('circle', { cx: x - 16 + k * 16, cy: y + 4, r: 5, class: 'coin', style: `animation-delay:${-k * .55}s` }, inc.g);
    },
    cash(inc) {
      regScreen.setAttribute('fill', '#FF5C6C');
      const [x, y] = proj('left', 103, LY + 50);
      for (let k = 0; k < 3; k++) el('rect', { x: x - 6 + k * 4, y: y - 4, width: 12, height: 7, rx: 1, class: 'note-bill', style: `animation-delay:${-k * .5}s` }, inc.g);
      txt(inc.g, { x: x + 22, y: y + 20, fill: '#FF8C9E', 'font-size': 14, 'font-weight': 800 }, '−1 250 грн');
    }
  };
  const UNDRAW = {
    overbook(inc) { inc.win.g.classList.remove('alert'); inc.win.g.classList.add('lit'); inc.win.busy = false; },
    night() { root.classList.remove('lobby-off'); },
    messy(inc) { root.classList.remove('room-dark'); blanket.removeAttribute('transform'); inc.local && inc.local.remove(); },
    leak(inc) { inc.local && inc.local.remove(); },
    phone() { phoneG.classList.remove('shake'); },
    energy(inc) { inc.win.g.classList.remove('cold'); inc.win.busy = false; },
    cash() { regScreen.setAttribute('fill', '#9FE3C2'); }
  };

  function spawn(type) {
    if (type !== 'energy' && state.incidents.some(i => i.type === type && !i.fixing)) {
      if (type === 'phone' && state.mode === 'chaos') {
        state.missedCalls++;
        if (isNight()) { state.wake++; wakeOwner(); }
        feed('Знову дзвонять на рецепцію - ніхто не відповідає', 'bad');
        renderWidget();
      }
      return null;
    }
    const T = TYPES[type];
    const g = el('g', { class: `inc inc-${type}`, tabindex: 0, role: 'button' }, L_PINS);
    const inc = { type, g, fixing: false, prevented: false };
    state.incidents.push(inc);
    state.total++;
    DRAW[type](inc);
    inc.anchor = ANCHOR[type](inc);
    drawPin(inc, type === 'energy' ? `${T.tag} · ${inc.room}` : T.tag);
    g.setAttribute('aria-label', `${T.name}${type === 'energy' ? ' ' + inc.room : ''}. Натисніть, щоб вирішити`);
    const act = e => {
      if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault(); resolve(inc, 'manual');
    };
    g.addEventListener('click', act); g.addEventListener('keydown', act);
    g.classList.add('fresh'); setTimeout(() => g.classList.remove('fresh'), 3500);
    if (state.mode === 'chaos') {
      feed(T.name + (type === 'energy' ? ` · ${inc.room}` : ''), 'bad');
      if (type === 'phone' || type === 'night' || type === 'overbook') {
        state.missedCalls++;
        if (isNight()) { state.wake++; wakeOwner(); }
      }
      renderWidget();
    } else {
      inc.autoAt = state.elapsed + (reduceMotion ? .2 : 1.1);
    }
    return inc;
  }

  function burst(x, y) {
    const g = el('g', { class: 'ok-burst' }, L_FX);
    el('circle', { cx: x, cy: y, r: 17 }, g);
    el('path', { d: `M${x - 7},${y} l5,5 l10,-11` }, g);
    setTimeout(() => g.remove(), 1000);
  }

  function resolve(inc, by) {
    if (inc.fixing || state.phase !== 'night') return;
    inc.fixing = true;
    inc.g.classList.add('fixing');
    burst(inc.anchor[0], inc.anchor[1] - 26);
    const T = TYPES[inc.type];
    if (by === 'manual') { state.manual++; if (T.cost) state.loss += T.cost; feed(T.manual(inc), 'manual'); emit('manual-fix', { type: inc.type }); }
    else { state.auto++; feed(T.auto(inc), 'auto'); boardEvent(inc.type); }
    if (inc.type === 'overbook') taxiLeave();
    if (inc.type === 'night') moveTo(guestB, [DOOR_A, -30], [DOOR_A, -2], 1.0, () => guestB.setAttribute('opacity', 0));
    setTimeout(() => {
      UNDRAW[inc.type](inc);
      inc.g.remove();
      state.incidents = state.incidents.filter(i => i !== inc);
    }, 750);
  }

  // overbooking story: taxi arrives → guest walks to the desk → either overbooking or a calm check-in
  function overbookStart() {
    if (state.mode === 'chaos') { state.dbl = true; renderWidget(); }
    shot('arrival', 4.8);
    moveTo(taxi, [A0, -100], [DOOR_A + 20, -100], 2.4, () => {
      moveTo(guestA, [DOOR_A + 20, -82], [DOOR_A, -6], 1.4, () => {
        guestA.setAttribute('opacity', 0);
        if (state.phase !== 'night') return;
        if (state.mode === 'vdalo') {
          state.total++; state.auto++;
          feed(TYPES.overbook.auto({ prevented: true }), 'auto');
          boardEvent('overbookPrevented');
          byRoom(302).g.classList.add('lit');
          burst(...proj('left', WX[1] + WW / 2, 2 * FH));
          taxiLeave();
        } else spawn('overbook');
      });
    });
  }
  function taxiLeave() { setTimeout(() => moveTo(taxi, [DOOR_A + 20, -100], [A1, -100], 2.2, () => taxi.setAttribute('opacity', 0)), 400); }

  // ---------- owner's phone widget ----------
  const widgetEl = $('#phm-widget');
  const dayNames = (() => {
    const out = [], d = new Date();
    for (let k = 0; k < 4; k++) {
      const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + k);
      out.push(`${x.toLocaleDateString('uk-UA', { weekday: 'short' })} ${x.getDate()}`);
    }
    return out;
  })();
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  function renderWidget() {
    if (state.mode === 'chaos') {
      const n = state.missedCalls, n10 = n % 10, n100 = n % 100;
      const word = n10 === 1 && n100 !== 11 ? 'пропущений дзвінок' : n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14) ? 'пропущені дзвінки' : 'пропущених дзвінків';
      let h = `<div class="missed"><b>${n}</b><span>${word}</span></div>`;
      if (state.dbl) {
        h += `<div class="mail clash"><i class="ch b">B</i><span>Booking.com: нове бронювання · номер 302 · сьогодні</span></div>`;
        h += `<div class="mail clash"><i class="ch a">A</i><span>Airbnb: гість прибуває · номер 302 · сьогодні</span></div>`;
      }
      widgetEl.innerHTML = h;
      return;
    }
    let h = `<div class="board" role="table" aria-label="Шахматка VDALO"><div class="board-head" role="row"><span>№</span><div class="days">${dayNames.map(n => `<span>${esc(n)}</span>`).join('')}</div><span style="text-align:right">статус</span></div>`;
    state.board.forEach(r => {
      const bars = r.bars.map(([s0, s1, ch, isNew]) => `<i class="${ch}${isNew ? ' new' : ''}" style="left:${s0 * 25}%;width:calc(${(s1 - s0) * 25}% - 2px)">${ch === 'b' ? 'Booking' : ch === 'a' ? 'Airbnb' : 'Сайт'}</i>`).join('');
      h += `<div class="board-row${r.flash ? ' flash' : ''}" role="row"><span class="room-no">${r.room}</span><div class="days">${bars}</div><span class="st ${r.st}">${esc(r.label)}</span></div>`;
    });
    widgetEl.innerHTML = h + '</div>';
    state.board.forEach(r => { r.flash = false; r.bars.forEach(b => { b[3] = false; }); });
  }
  const row = n => state.board.find(r => r.room === n);
  const setRow = (n, st, label) => { const r = row(n); r.st = st; r.label = label; r.flash = true; };
  function boardEvent(type) {
    if (state.mode !== 'vdalo') return;
    if (type === 'overbookPrevented') {
      row(302).bars.push([0, 2, 'b', true]); setRow(302, 'busy', 'Заселено');
      renderWidget();
      setTimeout(() => { if (state.mode === 'vdalo') { setRow(302, 'closed', 'Airbnb закрито'); renderWidget(); } }, 1400);
      setTimeout(() => { if (state.mode === 'vdalo') { setRow(302, 'busy', 'Заселено'); renderWidget(); } }, 4200);
      return;
    }
    if (type === 'overbook') { row(303).bars.push([0, 2, 'b', true]); setRow(303, 'busy', 'Заселено'); }
    else if (type === 'night') { const r = row(303).st === 'free' ? 303 : 202; row(r).bars.push([0, 1, 's', true]); setRow(r, 'busy', 'Заселено · PIN'); }
    else if (type === 'messy') {
      setRow(202, 'clean', 'Прибирається');
      setTimeout(() => { if (state.mode === 'vdalo') { setRow(202, 'busy', 'Готовий'); renderWidget(); } }, 2600);
    }
    else if (type === 'leak') setRow(202, 'check', 'На огляді');
    else return;
    renderWidget();
  }

  // ---------- camera: a gentle zoom on the key moments ----------
  const BASE = { wide: [0, 0, 800, 840], narrow: [70, 14, 660, 860] };
  const SHOTS = {
    arrival: () => { const a = gp(DOOR_A + 30, -60); return [a[0] - 60, a[1] - 105]; },
    door:    () => { const a = gp(DOOR_A, -30); return [a[0] - 70, a[1] - 95]; }
  };
  const base = () => (narrowMQ.matches ? BASE.narrow : BASE.wide);
  const cam = { cur: base().slice(), target: base().slice() };
  function shot(name, hold) {
    if (reduceMotion || state.phase !== 'night') return;
    const b = base(), ratio = b[2] / b[3], w = 470, h = w / ratio;
    const [cx, cy] = SHOTS[name]();
    cam.target = [cx - w / 2, cy - h / 2, w, h];
    state.shotEnd = state.elapsed + hold;
  }
  function camHome() { cam.target = base().slice(); state.shotEnd = 0; }
  function camStep(dt) {
    let moved = false;
    for (let k = 0; k < 4; k++) {
      const diff = cam.target[k] - cam.cur[k];
      if (Math.abs(diff) > .05) { cam.cur[k] += diff * Math.min(1, dt * 2.4); moved = true; }
      else cam.cur[k] = cam.target[k];
    }
    if (moved || svg.getAttribute('viewBox') !== cam.cur.join(' ')) svg.setAttribute('viewBox', cam.cur.map(v => v.toFixed(2)).join(' '));
  }

  // ---------- UI ----------
  const feedEl = $('#lhm-feed');
  function feed(text, kind) {
    const li = document.createElement('li'); li.className = kind;
    const ic = document.createElement('span'); ic.className = 'ic'; ic.textContent = kind === 'auto' ? 'V' : kind === 'manual' ? 'Я' : '!';
    const body = document.createElement('span');
    const t = document.createElement('time'); t.textContent = timeStr() + (kind === 'auto' ? ' · VDALO' : kind === 'manual' ? ' · ви' : '');
    const s = document.createElement('span'); s.textContent = text;
    body.append(t, s); li.append(ic, body);
    feedEl.prepend(li);
    while (feedEl.children.length > 6) feedEl.lastElementChild.remove();
    showToast(text, kind);
    if (!sheet.classList.contains('open')) { unread++; badge.textContent = unread; }
  }
  // the latest event lives in a one-line ticker under the scene; tap it to open the phone
  const ticker = $('#lhm-ticker'), tickerText = $('#lhm-ticker-text'), tickerIc = ticker.querySelector('.ic');
  function showToast(text, kind) {
    ticker.className = `lhm-ticker ${kind}`;
    tickerIc.textContent = kind === 'auto' ? 'V' : kind === 'manual' ? 'Я' : kind === 'hint' ? '↓' : '!';
    tickerText.textContent = text;
    tickerText.classList.remove('in'); void tickerText.offsetWidth; tickerText.classList.add('in');
  }
  // owner's phone as a bottom sheet
  const sheet = $('#lhm-sheet'), badge = $('#lhm-badge'), phoneBtn = $('#lhm-phone-btn'); let unread = 0;
  function openSheet() {
    sheet.classList.add('open'); sheet.setAttribute('aria-hidden', 'false'); phoneBtn.setAttribute('aria-expanded', 'true');
    unread = 0; badge.textContent = ''; $('#lhm-sheet-close').focus({ preventScroll: true });
  }
  function closeSheet() {
    if (!sheet.classList.contains('open')) return;
    sheet.classList.remove('open'); sheet.setAttribute('aria-hidden', 'true'); phoneBtn.setAttribute('aria-expanded', 'false');
  }
  phoneBtn.addEventListener('click', () => sheet.classList.contains('open') ? closeSheet() : openSheet());
  $('#lhm-sheet-close').addEventListener('click', closeSheet);
  ticker.addEventListener('click', () => sheet.classList.contains('open') ? closeSheet() : openSheet());
  root.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });
  const fmt = n => Math.round(n).toLocaleString('uk-UA');
  function render() {
    const active = state.incidents.filter(i => !i.fixing).length;
    $('[data-stat="occ"]').textContent = Math.round(state.occ);
    $('[data-stat="act"]').textContent = active;
    $('[data-stat="loss"]').textContent = fmt(state.loss);
    $('[data-stat="wake"]').textContent = state.wake;
    $('#stm-act').classList.toggle('is-bad', active > 0);
    $('#stm-loss').classList.toggle('is-bad', state.loss > 0 && state.mode === 'chaos');
    $('#stm-wake').classList.toggle('is-bad', state.wake > 0 && state.mode === 'chaos');
    $('#stm-occ').classList.toggle('is-good', state.mode === 'vdalo');
    const ts = timeStr();
    $('#lhm-clock').textContent = ts; $('#phm-time').textContent = ts; clockText.textContent = ts;
    $('#lhm-night').style.width = `${Math.min(100, state.elapsed / NIGHT_SEC * 100)}%`;
  }

  const COPY = {
    chaos: { eyebrow: 'Одна ніч вашого готелю', title: 'Ніч без системи. <em>Встигнете?</em>',
      lead: 'Натискайте на проблеми, щоб вирішити їх власноруч, або просто дивіться. Близько 23:45 приїде гість, якому продали вже зайнятий номер.',
      sw: 'Увімкнути VDALO', sign: 'HOTEL', phone: 'Ваш телефон' },
    vdalo: { eyebrow: 'Та сама ніч з VDALO', title: 'Та сама ніч. <em>Інший процес.</em>',
      lead: 'Приклад роботи з підключеними каналами, задачами й підготовкою заїзду. Цифровий доступ потребує окремої перевірки; енергосценарій у розробці.',
      sw: 'VDALO', sign: 'VDALO', phone: 'VDALO · шахматка' }
  };
  function applyCopy() {
    const c = COPY[state.mode];
    root.dataset.mode = state.mode;
    root.classList.add('is-swapping');
    setTimeout(() => {
      $('#lhm-eyebrow').textContent = c.eyebrow; $('#lhm-title').innerHTML = c.title; $('#lhm-lead').textContent = c.lead;
      root.classList.remove('is-swapping');
    }, reduceMotion ? 0 : 280);
    $('#lhm-switch-text').textContent = c.sw; signText.textContent = c.sign; $('#phm-title').textContent = c.phone;
    $('#lhm-cta').hidden = state.mode !== 'vdalo';
    $('#lhm-switch').classList.remove('nudge');
    $('#lhm-switch').setAttribute('aria-pressed', String(state.mode === 'vdalo'));
    $('#lhm-switch').setAttribute('aria-label', state.mode === 'vdalo' ? 'VDALO увімкнено. Вимкнути' : 'Увімкнути VDALO');
    if (state.mode === 'vdalo') house.classList.remove('awake');
    renderWidget();
  }
  function setMode(mode) {
    if (state.mode === mode || state.phase !== 'night') return;
    state.mode = mode;
    applyCopy();
    if (mode === 'vdalo') {
      state.usedVdalo = true; state.lossAtSwitch = state.loss;
      emit('vdalo-on', { at: timeStr() });
      const beam = el('rect', { x: R0[0] - 20, y: RB[1] - 40, width: 520, height: 70, fill: 'url(#lhmBeam)', class: 'beam' }, L_FX);
      setTimeout(() => beam.remove(), 1600);
      feed('VDALO підключено: канали, задачі, PIN і каса під контролем', 'auto');
      state.incidents.filter(i => !i.fixing).forEach((inc, k) => { inc.autoAt = state.elapsed + .5 + k * .35; });
      root.classList.remove('lobby-off');
    } else {
      state.incidents.forEach(i => { delete i.autoAt; });
    }
    render();
  }
  $('#lhm-switch').addEventListener('click', () => setMode(state.mode === 'chaos' ? 'vdalo' : 'chaos'));
  // PROTOTYPE ONLY: on the site #lh-cta carries data-open="trial" and the site's app.js opens the form
  // #lhm-cta carries data-open="trial" data-mode="start" data-location="living-hotel-mobile" - the site's app.js opens the form.
  $('#lhm-cta').addEventListener('click', () => emit('cta'));

  // ---------- summary (numbers come from what really happened) ----------
  let summaryEl = null;
  function showSummary() {
    state.phase = 'summary';
    camHome();
    root.classList.add('is-summary');
    $('#lhm-switch').disabled = true;
    const open = state.incidents.filter(i => !i.fixing);
    open.forEach(i => { state.loss += (TYPES[i.type].cost || 0) + 400; });
    render();
    const vd = state.mode === 'vdalo';
    emit('summary', { mode: state.mode, total: state.total, manual: state.manual, auto: state.auto });
    summaryEl = document.createElement('div');
    summaryEl.className = 'summary'; summaryEl.setAttribute('role', 'dialog'); summaryEl.setAttribute('aria-label', 'Підсумок ночі');
    const h = document.createElement('h3');
    h.textContent = vd
      ? (state.lossAtSwitch > 0 ? 'Ранок. З VDALO решта ночі минула спокійно.' : 'Ранок. Ніч минула без вас.')
      : (state.manual === 0 ? 'Ранок. Ви нічого не встигли - і ніч вирішила за вас.' : `Ранок. Ви вирішили ${state.manual} з ${state.total} проблем.`);
    const dl = document.createElement('dl');
    const cell = (k, v) => { const d = document.createElement('div'); const dt = document.createElement('dt'); dt.textContent = k; const dd = document.createElement('dd'); dd.textContent = v; d.append(dt, dd); dl.append(d); };
    if (vd) { cell('Закрив VDALO', state.auto); cell('Втрати до VDALO', `${fmt(state.lossAtSwitch)} грн`); cell('Після', `${fmt(state.loss - state.lossAtSwitch)} грн`); }
    else { cell('Проблем за ніч', state.total); cell('Втрати', `${fmt(state.loss)} грн`); cell('Вас будили', state.wake); }
    const p = document.createElement('p');
    p.textContent = vd ? (state.wake > 0 ? 'Після підключення VDALO дзвінки, задачі й заселення взяла на себе система - вас більше не будили.' : 'Дзвінки, задачі й заселення взяла на себе система. Вас не будили.') : (open.length ? `Ще ${open.length} проблем лишилися на ранок. ` : '') + 'Тепер проживіть цю саму ніч з VDALO.';
    const note = document.createElement('p'); note.className = 'note'; note.textContent = 'Симуляція. Події й суми умовні, склад автоматизацій перевіряємо для вашого об’єкта.';
    const row = document.createElement('div'); row.className = 'row';
    const again = document.createElement('button'); again.type = 'button'; again.className = 'lhm-btn lhm-btn-primary';
    again.textContent = vd ? 'Ще раз без VDALO' : 'Прожити ніч з VDALO';
    again.addEventListener('click', () => restart(vd ? 'chaos' : 'vdalo'));
    const cta = document.createElement('button'); cta.type = 'button'; cta.className = 'lhm-btn lhm-btn-ghost'; cta.textContent = 'Замовити демо';
    cta.addEventListener('click', () => $('#lhm-cta').click());
    row.append(again, cta);
    summaryEl.append(h, dl, p, note, row);
    closeSheet();
    root.append(summaryEl);
    again.focus({ preventScroll: true });
  }

  function restart(mode) {
    summaryEl && summaryEl.remove(); summaryEl = null;
    state.incidents.forEach(i => { try { UNDRAW[i.type](i); } catch (e) {} i.g.remove(); });
    Object.assign(state, fresh(), { mode, usedVdalo: mode === 'vdalo' });
    tweens.length = 0; [taxi, guestA, guestB].forEach(g => g.setAttribute('opacity', 0));
    root.classList.remove('lobby-off', 'lobby-dim', 'room-dark', 'is-summary');
    house.classList.remove('awake', 'morning');
    camHome();
    $('#lhm-switch').disabled = false;
    feedEl.innerHTML = '';
    applyCopy();
    feed(mode === 'vdalo' ? 'Нова ніч. VDALO вже працює' : 'Нова ніч без системи. Рецепція працює до 23:30', mode === 'vdalo' ? 'auto' : 'bad');
    render();
  }

  // ---------- loop ----------
  let last = 0, lifeAcc = 0;
  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, .25) : 0; last = now;
    if (state.visible && !document.hidden && state.phase === 'night') {
      state.elapsed += dt;
      TIMELINE.forEach(([t, type], idx) => {
        if (state.elapsed < t || state.fired.has(idx)) return;
        state.fired.add(idx);
        if (type === 'overbook') overbookStart();
        else if (type === 'night') shot('door', 4.2), moveTo(guestB, [DOOR_A + 120, -40], [DOOR_A, -30], 1.6, () => { if (state.phase === 'night') spawn('night'); });
        else spawn(type);
      });
      state.incidents.forEach(i => { if (!i.fixing && i.autoAt !== undefined && state.elapsed >= i.autoAt) resolve(i, 'auto'); });
      const active = state.incidents.filter(i => !i.fixing);
      if (state.mode === 'chaos') state.loss += active.reduce((s, i) => s + TYPES[i.type].rate, 0) * dt;
      const target = state.mode === 'vdalo' ? 94 : 71;
      state.occ += (target - state.occ) * Math.min(1, dt * 1.2);
      const m = nowMin() % 1440;
      root.classList.toggle('lobby-dim', m >= 23 * 60 + 30 || m < 6 * 60);
      if (!state.nudged && state.mode === 'chaos' && (state.incidents.some(i => i.type === 'overbook') || state.elapsed > 12)) {
        state.nudged = true; $('#lhm-switch').classList.add('nudge');
        showToast('Не встигаєте? Увімкніть VDALO', 'hint');
      }
      // windows: guests fall asleep after midnight and wake at dawn
      lifeAcc += dt;
      if (lifeAcc > 1.1) {
        lifeAcc = 0;
        const hour = (m < 12 * 60 ? m + 1440 : m) / 60; // 22 … 31
        const nightFactor = hour < 25 ? 1 - (hour - 22) * .2 : hour < 29 ? .35 : .35 + (hour - 29) * .2;
        const free = windows.filter(w => !w.busy);
        const lit = free.filter(w => w.g.classList.contains('lit')).length / Math.max(1, free.length);
        const w = pick(free); if (w) w.g.classList.toggle('lit', lit < state.occ / 100 * nightFactor);
      }
      if (state.shotEnd && state.elapsed > state.shotEnd) camHome();
      if (state.elapsed > NIGHT_SEC - 4) { house.classList.remove('awake'); house.classList.add('morning'); }
      if (state.elapsed >= NIGHT_SEC) showSummary();
    }
    for (let k = tweens.length - 1; k >= 0; k--) {
      const tw = tweens[k]; tw.t += dt / tw.dur; const e = ease(Math.min(1, tw.t));
      place(tw.g, lerp(tw.from[0], tw.to[0], e), lerp(tw.from[1], tw.to[1], e));
      if (tw.t >= 1) { tweens.splice(k, 1); tw.done && tw.done(); }
    }
    camStep(dt);
    render();
    requestAnimationFrame(tick);
  }

  if ('IntersectionObserver' in window) new IntersectionObserver(es => { state.visible = es[0].isIntersecting; }, { threshold: .15 }).observe(root);
  const fitViewBox = () => { cam.cur = base().slice(); cam.target = base().slice(); svg.setAttribute('viewBox', cam.cur.join(' ')); };
  narrowMQ.addEventListener ? narrowMQ.addEventListener('change', fitViewBox) : narrowMQ.addListener(fitViewBox);
  fitViewBox();

  windows.forEach(w => { if (Math.random() < .62) w.g.classList.add('lit'); });
  feed('Ніч починається. Рецепція працює до 23:30', 'bad');
  renderWidget();
  render();
  requestAnimationFrame(tick);
  };
  // phones only; the desktop block runs on wider screens. data-always forces it (prototype page)
  if (host.hasAttribute('data-always')) { boot(); return; }
  const mq = matchMedia('(max-width: 860px)'); let started = false;
  const go = () => { if (!started && mq.matches) { started = true; boot(); } };
  go(); mq.addEventListener ? mq.addEventListener('change', go) : mq.addListener(go);
})();
