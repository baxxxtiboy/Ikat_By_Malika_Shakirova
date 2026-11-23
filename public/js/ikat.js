'use strict';
/* ===== Ikat to'qimasi =====
 * Haqiqiy ikatda ip to'qishdan OLDIN bo'yaladi, to'qilganda har bir ip biroz siljiydi — naqsh chetlari shundan "eriydi".
 * Bu yerda ham xuddi shunday: romb naqsh hisoblanadi, keyin har bir tik ip o'zicha yuqoriga-pastga siljitiladi.
 */
const Ikat = (() => {
  const C = { black: [6, 9, 8], deep: [5, 46, 35], em: [13, 112, 82], lite: [38, 158, 118], gold: [201, 160, 58], pale: [240, 217, 144] };

  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  /** Naqsh: u,v — katak ichida 0..1. Katta romb + orasidagi kichik romb */
  function color(u, v) {
    const x = Math.abs(u - 0.5) * 2, y = Math.abs(v - 0.5) * 2, d = x + y;
    if (d < 0.14) return C.pale;
    if (d < 0.3) return C.em;
    if (d < 0.38) return C.gold;
    if (d < 0.6) return C.black;
    if (d < 0.68) return C.pale;
    if (d < 0.92) return C.em;
    if (d < 1.0) return C.gold;
    const e = 2 - d;                           // burchakdagi romb
    if (e < 0.16) return C.gold;
    if (e < 0.4) return C.deep;
    if (e < 0.48) return C.lite;
    return (x > 0.5 ? C.deep : C.black);
  }

  /** Bir bo'lak matoni chizadi (w×h piksel), tayyor canvas qaytaradi */
  function cloth(w, h, { cell = 150, ratio = 1.75, seed = 7, shift = 0.5 } = {}) {
    const W = Math.max(1, Math.round(w)), H = Math.max(1, Math.round(h));
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const ctx = c.getContext('2d'), img = ctx.createImageData(W, H), px = img.data, r = rng(seed);
    const ch = cell * ratio;
    let drift = 0, bundle = 0, left = 0, tone = 1, off = 0, wide = 0;
    for (let x = 0; x < W; x++) {
      if (wide-- <= 0) {                       // yangi ip
        wide = r() < 0.35 ? 2 : 1;
        if (left-- <= 0) { left = 3 + (r() * 7 | 0); bundle = (r() - 0.5) * ch * 0.085; }   // iplar dastasi birga siljiydi
        drift += (bundle - drift) * 0.55;
        off = drift + (r() - 0.5) * ch * 0.05;
        tone = 0.82 + r() * 0.3;
      }
      const col = Math.floor(x / cell), u = x / cell - col;
      const base = (col % 2) * ch * shift + off;
      for (let y = 0; y < H; y++) {
        let v = (y + base) / ch; v -= Math.floor(v);
        const k = color(u, v), i = (y * W + x) * 4, g = tone * (y % 3 === 0 ? 0.93 : 1);     // arqoq izi
        px[i] = k[0] * g; px[i + 1] = k[1] * g; px[i + 2] = k[2] * g; px[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return c;
  }

  const calm = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** <canvas> ni o'z o'lchamida to'ldiradi; weave=true bo'lsa iplar tepadan "to'qiladi" */
  function paint(cv, { weave = false, ms = 1700, ...opt } = {}) {
    if (!cv) return;
    const box = cv.getBoundingClientRect();
    const k = Math.min(window.devicePixelRatio || 1, 1.5);
    const W = Math.max(1, Math.round(box.width * k)), H = Math.max(1, Math.round(box.height * k));
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    const src = cloth(W, H, { ...opt, cell: (opt.cell || 150) * k });
    if (!weave || calm()) { ctx.drawImage(src, 0, 0); return; }
    const r = rng(31), n = Math.ceil(W / (4 * k)), sw = W / n;
    const delay = Array.from({ length: n }, (_, i) => 0.28 * Math.abs(i / n - 0.5) * 2 + r() * 0.34);
    const t0 = performance.now();
    (function frame(t) {
      if (!cv.isConnected) return;
      const p = Math.min(1, (t - t0) / ms);
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < n; i++) {
        const q = Math.max(0, Math.min(1, (p - delay[i]) / 0.38));
        if (!q) continue;
        const hh = H * (1 - Math.pow(1 - q, 3)), x = Math.floor(i * sw), w2 = Math.ceil(sw);
        ctx.drawImage(src, x, 0, w2, hh, x, 0, w2, hh);
      }
      if (p < 1) requestAnimationFrame(frame);
    })(t0);
  }

  /** Rasmsiz joylar va hoshiyalar uchun CSS o'zgaruvchilari */
  function initVars() {
    const s = document.documentElement.style;
    s.setProperty('--ikat', `url(${cloth(300, 350, { cell: 100, seed: 11 }).toDataURL('image/jpeg', 0.8)})`);
    s.setProperty('--ikat-band', `url(${cloth(320, 14, { cell: 32, ratio: 0.9, seed: 3, shift: 0 }).toDataURL('image/png')})`);
  }
  return { paint, initVars };
})();
