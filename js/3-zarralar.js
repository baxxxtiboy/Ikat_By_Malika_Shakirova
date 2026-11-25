/* =====================================================================
   3-ZARRALAR.JS  —  OLTIN CHANG, UCHQUN, ZARBA VA PARCHALAR
   ---------------------------------------------------------------------
   const z = zarralarYarat(canvas)
   z.boshla(60)              — 60 dona oltin chang suza boshlaydi
   z.portlash(x, y, soni)    — uchqunlar sochiladi
   z.zarba(x, y)             — zumrad shaklidagi to‘lqin tarqaladi
   z.yutilish(x, y)          — zarralar shu nuqtaga so‘riladi
   z.iz(x, y)                — kometa izi (bir necha uchqun)
   z.parchala(rasm, joy)     — rasm parchalarga bo‘linib uchadi
   z.ranglar = [...]         — uchqun ranglari
   z.toxta()                 — hammasi to‘xtaydi
   ===================================================================== */

const ZARRA_RANGLARI = ["#f3d27a", "#c99a3b", "#fff1c4", "#1fb27c", "#f3d27a"];

// Telefonda zarralar kamroq bo‘ladi, sekinlashmasligi uchun
const ZARRA_KUCHI = innerWidth < 820 ? 0.5 : 1;

// Yumshoq nurli nuqta rasmi. Har bir rang uchun bir marta chiziladi
const nurlar = {};
function nurNuqta(rang) {
  if (!nurlar[rang]) {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const q = c.getContext("2d");
    const g = q.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "#fff");
    g.addColorStop(0.18, rang);
    g.addColorStop(1, rang + "00");        // shu rangning shaffofi
    q.fillStyle = g;
    q.fillRect(0, 0, 64, 64);
    nurlar[rang] = c;
  }
  return nurlar[rang];
}

function zarralarYarat(canvas) {
  const q = canvas.getContext("2d");
  const z = { ranglar: ZARRA_RANGLARI };
  let royxat = [];                // hamma zarralar shu ro‘yxatda
  let ishlayapti = false;
  let oldingiVaqt = 0;

  const rangTanla = () => z.ranglar[Math.floor(Math.random() * z.ranglar.length)];

  z.olchamla = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  };

  function qosh(zarra) {
    royxat.push(zarra);
    if (!ishlayapti) { ishlayapti = true; oldingiVaqt = 0; requestAnimationFrame(kadr); }
  }

  z.boshla = (soni = 60) => {
    z.olchamla();
    royxat = [];
    if (HARAKAT_KAM) return;
    for (let i = 0; i < soni * ZARRA_KUCHI; i++) qosh({
      tur: "chang", umr: 1, kamayish: 0,
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.25, vy: -0.1 - Math.random() * 0.4,
      r: 2 + Math.random() * 5, rang: ZARRA_RANGLARI[Math.floor(Math.random() * 3)], faza: Math.random() * 6,
    });
  };

  z.portlash = (x, y, soni = 200, kuch = 1) => {
    if (HARAKAT_KAM) return;
    for (let i = 0; i < soni * ZARRA_KUCHI; i++) {
      const burchak = Math.random() * Math.PI * 2;
      const tezlik = (3 + Math.random() * 19) * kuch;
      qosh({
        tur: i % 3 ? "uchqun" : "romb", umr: 1, kamayish: 0.008 + Math.random() * 0.012,
        x, y, vx: Math.cos(burchak) * tezlik, vy: Math.sin(burchak) * tezlik,
        r: 1.5 + Math.random() * 4.5, rang: rangTanla(), aylanish: Math.random() * 6,
      });
    }
  };

  z.zarba = (x, y) => {
    if (HARAKAT_KAM) return;
    [0, 9, 18].forEach((kutish, i) => qosh({   // uchta halqa ketma-ket
      tur: "halqa", umr: 1, kamayish: 0.018, kutish, x, y, r: 60, vx: 0, vy: 0, rang: i === 1 ? "#1fb27c" : "#f3d27a",
    }));
  };

  z.yutilish = (x, y, soni = 90) => {
    if (HARAKAT_KAM) return;
    for (let i = 0; i < soni * ZARRA_KUCHI; i++) {
      const burchak = Math.random() * Math.PI * 2;
      const uzoq = 260 + Math.random() * 520;
      const bx = x + Math.cos(burchak) * uzoq;
      const by = y + Math.sin(burchak) * uzoq;
      qosh({
        tur: "yutiluvchi", umr: 1, kamayish: 0.026, bx, by, mx: x, my: y,
        x: bx, y: by, vx: 0, vy: 0, r: 2 + Math.random() * 4, rang: rangTanla(),
      });
    }
  };

  z.iz = (x, y, soni = 4) => {
    if (HARAKAT_KAM) return;
    for (let i = 0; i < soni; i++) qosh({
      tur: "uchqun", umr: 1, kamayish: 0.022 + Math.random() * 0.02,
      x: x + (Math.random() - 0.5) * 14, y: y + (Math.random() - 0.5) * 14,
      vx: (Math.random() - 0.5) * 2.4, vy: (Math.random() - 0.5) * 2.4,
      r: 1.5 + Math.random() * 3.5, rang: rangTanla(),
    });
  };

  // rasm — canvas, joy — uning ekrandagi o‘rni (getBoundingClientRect)
  z.parchala = (rasm, joy) => {
    if (HARAKAT_KAM) return;
    const ustunlar = ZARRA_KUCHI === 1 ? 9 : 6;
    const a = joy.width / ustunlar;
    const qatorlar = Math.round(joy.height / a);
    const b = joy.height / qatorlar;
    for (let i = 0; i < ustunlar; i++) for (let j = 0; j < qatorlar; j++) {
      const x = joy.left + (i + 0.5) * a;
      const y = joy.top + (j + 0.5) * b;
      const dx = x - (joy.left + joy.width / 2);
      const dy = y - (joy.top + joy.height / 2);
      qosh({
        tur: "parcha", umr: 1, kamayish: 0.014 + Math.random() * 0.01, rasm, x, y, a, b,
        sx: (i / ustunlar) * rasm.width, sy: (j / qatorlar) * rasm.height,
        sw: rasm.width / ustunlar, sh: rasm.height / qatorlar,
        vx: dx * 0.035 + (Math.random() - 0.5) * 7, vy: dy * 0.03 - 3 + (Math.random() - 0.5) * 7,
        aylanish: 0, burilish: (Math.random() - 0.5) * 0.3,
      });
    }
  };

  z.toxta = () => { royxat = []; };

  // Bitta zarrani chizish: har tur o‘zicha
  const CHIZISH = {
    chang(p, vaqt) {
      if (p.y < -8) { p.y = canvas.height + 8; p.x = Math.random() * canvas.width; }
      q.globalAlpha = 0.2 + 0.6 * Math.abs(Math.sin(vaqt / 900 + p.faza));
      q.drawImage(nurNuqta(p.rang), p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    },
    uchqun(p) {                                    // dumi bor uchqun
      q.globalAlpha = p.umr;
      q.strokeStyle = p.rang;
      q.lineWidth = p.r * 0.5 * p.umr;
      q.beginPath();
      q.moveTo(p.x, p.y);
      q.lineTo(p.x - p.vx * 2.6, p.y - p.vy * 2.6);
      q.stroke();
      const r = p.r * 2.6 * p.umr;
      q.drawImage(nurNuqta(p.rang), p.x - r, p.y - r, r * 2, r * 2);
    },
    romb(p) {
      q.globalAlpha = p.umr;
      q.fillStyle = p.rang;
      q.beginPath();
      rombChiz(q, p.x, p.y, p.r * Math.abs(Math.cos(p.aylanish)) + 0.4, p.r * 2);
      q.fill();
    },
    halqa(p) {                                     // zumrad shaklidagi zarba
      const r = p.r + (1 - p.umr) * Math.max(canvas.width, canvas.height) * 0.75;
      q.strokeStyle = p.rang;
      q.beginPath();
      zumradChiz(q, p.x, p.y, r * 0.72, r);
      [[46, 0.12], [22, 0.22], [8, 0.5], [2, 1]].forEach(([qalin, xira]) => {   // keng xiradan ingichka yorqingacha
        q.globalAlpha = p.umr * p.umr * xira;
        q.lineWidth = 1 + qalin * p.umr;
        q.stroke();
      });
    },
    yutiluvchi(p) {
      const k = 1 - p.umr;
      const eski = { x: p.x, y: p.y };
      p.x = p.bx + (p.mx - p.bx) * k * k * k;
      p.y = p.by + (p.my - p.by) * k * k * k;
      q.globalAlpha = Math.min(1, k * 2);
      q.strokeStyle = p.rang;
      q.lineWidth = p.r * 0.5;
      q.beginPath();
      q.moveTo(eski.x, eski.y);
      q.lineTo(p.x, p.y);
      q.stroke();
      q.drawImage(nurNuqta(p.rang), p.x - p.r * 2, p.y - p.r * 2, p.r * 4, p.r * 4);
    },
    parcha(p) {                                    // rasm parchasi
      q.save();
      q.globalCompositeOperation = "source-over";
      q.globalAlpha = Math.min(1, p.umr * 1.6);
      q.translate(p.x, p.y);
      q.rotate(p.aylanish);
      q.scale(Math.cos(p.aylanish * 1.7), 1);      // 3D aylanayotgandek
      q.drawImage(p.rasm, p.sx, p.sy, p.sw, p.sh, -p.a / 2, -p.b / 2, p.a, p.b);
      q.restore();
    },
  };

  // Har kadrda hamma zarrani bir qadam suradi va chizadi
  function kadr(vaqt) {
    // d — kadr uzunligi. 60 Hz va 144 Hz ekranda tezlik bir xil bo‘ladi
    const d = oldingiVaqt ? Math.min(3, (vaqt - oldingiVaqt) / 16.7) : 1;
    oldingiVaqt = vaqt;
    q.globalAlpha = 1;
    q.clearRect(0, 0, canvas.width, canvas.height);
    if (!royxat.length) { ishlayapti = false; return; }
    q.globalCompositeOperation = "lighter";        // nurlar bir-birini yoritadi
    royxat.forEach((p) => {
      if (p.kutish > 0) { p.kutish -= d; return; }
      const sekinlash = p.tur === "chang" ? 1 : Math.pow(p.tur === "parcha" ? 0.985 : 0.95, d);
      p.x += p.vx * d;
      p.y += p.vy * d;
      p.vx *= sekinlash;
      p.vy *= sekinlash;
      if (p.tur === "uchqun" || p.tur === "romb") p.vy += 0.07 * d;   // og‘irlik kuchi
      if (p.tur === "parcha") { p.vy += 0.28 * d; p.aylanish += p.burilish * d; }
      if (p.tur === "romb") p.aylanish += 0.16 * d;
      p.umr -= p.kamayish * d;
      if (p.umr > 0) CHIZISH[p.tur](p, vaqt);
    });
    q.globalCompositeOperation = "source-over";
    royxat = royxat.filter((p) => p.umr > 0);
    requestAnimationFrame(kadr);
  }

  return z;
}
