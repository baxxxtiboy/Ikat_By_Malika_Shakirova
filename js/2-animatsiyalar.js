/* =====================================================================
   2-ANIMATSIYALAR.JS  —  OCHILISH EFFEKTLARI
   ---------------------------------------------------------------------
   Har bir effekt bitta funksiya. U har kadrda (sekundiga 60 marta)
   chaqiriladi va rasmni chizadi. Unga shular beriladi:

     q     — "qalam" (canvas). Hamma narsa shu bilan chiziladi
     yangi — ochilayotgan rasm
     W, H  — eni va bo‘yi
     t     — vaqt: 0 = boshlanish, 0.5 = o‘rtasi, 1 = tugash
     eski  — oldingi rasm (yoki oltin naqsh). U orqa fonga oldindan chizilgan

   Yangi effekt qo‘shish: ANIMATSIYALAR ichiga yangi funksiya yozing va
   1-mahsulotlar.js da uning nomini "animatsiya" ga yozing.
   ===================================================================== */

const OLTIN = "#f3d27a";

/* ---------- Kichik yordamchilar ---------- */

// Sonni 0 va 1 orasida ushlab turadi
const chekla = (n) => Math.max(0, Math.min(1, n));

// Harakatni yumshatadi: tez boshlanib, sekin to‘xtaydi
const yumshoq = (t) => 1 - Math.pow(1 - t, 4);

// Har bir bo‘lak o‘z navbatida qimirlashi uchun.
// kechikish — qancha kutsin,  davom — qancha davom etsin (ikkalasi 0..1)
const navbat = (t, kechikish, davom) => yumshoq(chekla((t - kechikish) / davom));

// Doim bir xil chiqadigan "tasodifiy" son (0..1). i — bo‘lak raqami
const tasodif = (i) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// Romb (olmos) yo‘lini chizadi
function rombChiz(q, x, y, eni, boyi) {
  q.moveTo(x, y - boyi);
  q.lineTo(x + eni, y);
  q.lineTo(x, y + boyi);
  q.lineTo(x - eni, y);
  q.closePath();
}

// Sakkizburchak: zumradning "emerald cut" kesimi
function zumradChiz(q, x, y, eni, boyi) {
  const k = Math.min(eni, boyi) * 0.42; // burchak kesimi
  q.moveTo(x - eni + k, y - boyi);
  q.lineTo(x + eni - k, y - boyi);
  q.lineTo(x + eni, y - boyi + k);
  q.lineTo(x + eni, y + boyi - k);
  q.lineTo(x + eni - k, y + boyi);
  q.lineTo(x - eni + k, y + boyi);
  q.lineTo(x - eni, y + boyi - k);
  q.lineTo(x - eni, y - boyi + k);
  q.closePath();
}

/* ---------- EFFEKTLAR ---------- */
const ANIMATSIYALAR = {

  /* IPLAR — rasm tanda iplari kabi tepadan va pastdan kelib to‘qiladi.
     Haqiqiy ikat ham shunday: bo‘yalgan iplar yonma-yon taraladi.     */
  iplar(q, yangi, W, H, t) {
    const soni = 56;                 // nechta ip (ko‘paytirsangiz mayinroq)
    const eni = W / soni;
    for (let i = 0; i < soni; i++) {
      const k = navbat(t, tasodif(i) * 0.45, 0.55);
      if (k <= 0) continue;
      const tomon = i % 2 ? 1 : -1;  // bir ip tepadan, keyingisi pastdan
      const y = tomon * (1 - k) * H * 1.05;
      q.drawImage(yangi, i * eni, 0, eni, H, i * eni, y, eni + 0.7, H);
      if (k < 0.995) {               // harakatdagi ipning oltin chizig‘i
        q.globalAlpha = 1 - k;
        q.fillStyle = OLTIN;
        q.fillRect(i * eni, y, Math.max(1, eni * 0.12), H);
        q.globalAlpha = 1;
      }
    }
  },

  /* OLMOS — markazdan ikat romblari gullab ochiladi */
  olmos(q, yangi, W, H, t) {
    const a = W / 7;                 // romb kattaligi
    const b = a * 1.35;
    const romblar = [];
    for (let qator = 0; qator * b < H + b; qator++) {
      for (let ustun = -1; ustun * a * 2 < W + a * 2; ustun++) {
        const x = ustun * a * 2 + (qator % 2) * a;
        const y = qator * b;
        const uzoq = Math.hypot(x - W / 2, y - H / 2) / Math.hypot(W / 2, H / 2);
        romblar.push({ x, y, k: navbat(t, uzoq * 0.5, 0.42) });
      }
    }
    q.save();
    q.beginPath();
    romblar.forEach((r) => r.k > 0 && rombChiz(q, r.x, r.y, a * r.k * 1.02, b * r.k * 1.02));
    q.clip();
    q.drawImage(yangi, 0, 0, W, H);
    q.restore();
    romblar.forEach((r) => {         // romblarning oltin hoshiyasi
      if (r.k <= 0 || r.k >= 0.995) return;
      q.globalAlpha = 1 - r.k;
      q.strokeStyle = OLTIN;
      q.lineWidth = W / 220;
      q.beginPath();
      rombChiz(q, r.x, r.y, a * r.k, b * r.k);
      q.stroke();
    });
    q.globalAlpha = 1;
  },

  /* PARDA — eski rasm teatr pardasi bo‘lib ikki yonga yig‘iladi */
  parda(q, yangi, W, H, t, eski) {
    const k = t * t * (3 - 2 * t);               // parda qancha ochildi
    const kat = 1.2 - 0.2 * yumshoq(t);          // yangi rasm sal yaqindan keladi
    q.drawImage(yangi, (W - W * kat) / 2, (H - H * kat) / 2, W * kat, H * kat);
    const burma = 9;                             // har tomonda nechta burma
    const manba = W / 2 / burma;
    const eni = manba * (1 - k);
    if (eni < 0.3) return;
    const soya = Math.min(0.8, k * 4);           // burma soyasi
    for (let i = 0; i < burma; i++) {
      const tolqin = Math.sin(i * 0.9 + t * 9) * H * 0.012 * k;
      [0, 1].forEach((ong) => {                  // 0 = chap parda, 1 = o‘ng parda
        const sx = ong ? W - (i + 1) * manba : i * manba;
        const dx = ong ? W - (i + 1) * eni : i * eni;
        const usti = Math.min(1, k * 8) * H * 0.02;
        q.drawImage(eski, sx, 0, manba, H, dx, tolqin - usti, eni + 0.7, H + usti * 2);
        const g = q.createLinearGradient(dx, 0, dx + eni, 0);
        g.addColorStop(0, `rgba(0,0,0,${soya})`);
        g.addColorStop(0.45, `rgba(255,225,150,${0.25 * soya})`);
        g.addColorStop(1, `rgba(0,0,0,${soya})`);
        q.fillStyle = g;
        q.fillRect(dx, 0, eni + 0.7, H);
      });
    }
  },

  /* ZINA — rasm pastdan tepaga zinama-zina ag‘dariladi */
  zina(q, yangi, W, H, t, eski) {
    const soni = 16;
    const boyi = H / soni;
    for (let i = 0; i < soni; i++) {
      const k = chekla((t - ((soni - 1 - i) / soni) * 0.58) / 0.42);
      const burchak = yumshoq(k) * Math.PI;          // 0 dan 180 gradusgacha
      const siqilish = Math.abs(Math.cos(burchak));  // qirrasi bilan turganda 0
      const surat = burchak < Math.PI / 2 ? eski : yangi;
      const y = i * boyi;
      if (siqilish < 0.99) {                         // ag‘darilayotgan zinaning orqasi
        q.fillStyle = "#04110b";
        q.fillRect(0, y, W, boyi + 0.7);
      }
      q.drawImage(surat, 0, y, W, boyi, 0, y + (boyi * (1 - siqilish)) / 2, W, boyi * siqilish + 0.7);
      if (k > 0 && k < 1) {                          // qirradagi oltin yaltirash
        q.globalAlpha = 1 - siqilish;
        q.fillStyle = OLTIN;
        q.fillRect(0, y + boyi / 2 - 1, W, Math.max(2, boyi * 0.06));
        q.globalAlpha = 1;
      }
    }
  },

  /* YULDUZ — yulduzlar chaqnaydi, har biridan rasm yorishib chiqadi */
  yulduz(q, yangi, W, H, t) {
    const soni = 46;
    const yulduzlar = [];
    for (let i = 0; i < soni; i++) {
      yulduzlar.push({
        x: tasodif(i) * W,
        y: tasodif(i + 100) * H,
        k: chekla((t - tasodif(i + 200) * 0.55) / 0.45),
      });
    }
    q.save();
    q.beginPath();
    yulduzlar.forEach((s) => {
      const r = Math.pow(s.k, 2.2) * W * 0.5;
      q.moveTo(s.x + r, s.y);
      q.arc(s.x, s.y, r, 0, Math.PI * 2);
    });
    q.clip();
    q.drawImage(yangi, 0, 0, W, H);
    q.restore();
    q.globalAlpha = chekla((t - 0.75) / 0.25);       // oxirida qolgan joy ham yorishadi
    q.drawImage(yangi, 0, 0, W, H);
    q.fillStyle = "#fff6d8";
    yulduzlar.forEach((s) => {                       // chaqnoq, + shaklida
      if (s.k <= 0 || s.k >= 1) return;
      const u = Math.sin(s.k * Math.PI) * W * 0.11;
      const e = W / 260;
      q.globalAlpha = Math.sin(s.k * Math.PI);
      q.beginPath();
      rombChiz(q, s.x, s.y, u, e);
      rombChiz(q, s.x, s.y, e, u);
      q.fill();
    });
    q.globalAlpha = 1;
  },

  /* GAVHAR — zumrad qirralari aylanib joyiga tushadi */
  gavhar(q, yangi, W, H, t) {
    const halqa = 9;
    for (let i = halqa; i >= 1; i--) {               // tashqaridan ichkariga
      const k = navbat(t, (1 - i / halqa) * 0.4, 0.6);
      if (k <= 0) continue;
      const tomon = i % 2 ? 1 : -1;
      const kat = 0.55 + 0.45 * k;
      q.save();
      q.globalAlpha = chekla(k * 1.6);
      q.translate(W / 2, H / 2);
      q.rotate(tomon * (1 - k) * 1.5);
      q.scale(kat, kat);
      q.beginPath();
      if (i === halqa) q.rect(-W / 2, -H / 2, W, H);
      else zumradChiz(q, 0, 0, (W / 2) * (i / halqa), (H / 2) * (i / halqa));
      q.clip();
      q.drawImage(yangi, -W / 2, -H / 2, W, H);
      q.globalAlpha = 1 - k;
      q.strokeStyle = OLTIN;
      q.lineWidth = W / 90;
      q.stroke();
      q.restore();
    }
  },
};

/* ---------- EFFEKTNI ISHGA TUSHIRUVCHI ---------- */

// Rasmni yuklaydi va tayyor bo‘lganda qaytaradi (ikkinchi marta yuklamaydi)
const yuklanganlar = {};
function rasmYukla(manzil) {
  if (!yuklanganlar[manzil]) {
    yuklanganlar[manzil] = new Promise((tayyor) => {
      const r = new Image();
      r.onload = () => tayyor(r);
      r.onerror = () => { console.warn("Rasm topilmadi:", manzil); tayyor(null); };
      r.src = manzil;
    });
  }
  return yuklanganlar[manzil];
}

// Rasmni W×H o‘lchamga to‘ldirib kesadi (CSS dagi object-fit: cover kabi)
function kesibOl(rasm, W, H) {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const m = Math.max(W / rasm.width, H / rasm.height);
  const w = rasm.width * m;
  const h = rasm.height * m;
  c.getContext("2d").drawImage(rasm, (W - w) / 2, (H - h) / 2, w, h);
  return c;
}

// Animatsiyalar o‘chirilganmi? (sozlamasi: 1-mahsulotlar.js, animatsiyaDoim)
const HARAKAT_KAM = !DOKON.animatsiyaDoim && matchMedia("(prefers-reduced-motion: reduce)").matches;
document.documentElement.classList.toggle("harakat-kam", HARAKAT_KAM);

/* animatsiyaOyna(canvas, "iplar", eskiRasm, yangiRasm, 1500)
   canvas ustida effektni ko‘rsatadi va tugaganda true qaytaradi.
   Shu canvasda boshqa effekt boshlansa, eskisi to‘xtab false qaytaradi. */
async function animatsiyaOyna(canvas, effektNomi, eskiManzil, yangiManzil, vaqt) {
  const raqam = (canvas.raqam = (canvas.raqam || 0) + 1);
  const eskirdi = () => canvas.raqam !== raqam;

  const [eskiRasm, yangiRasm] = await Promise.all([rasmYukla(eskiManzil), rasmYukla(yangiManzil)]);
  if (eskirdi()) return false;
  if (!yangiRasm) return true;

  const aniqlik = Math.min(devicePixelRatio || 1, 1.5);
  const W = (canvas.width = Math.round(canvas.clientWidth * aniqlik));
  const H = (canvas.height = Math.round(canvas.clientHeight * aniqlik));
  if (!W || !H) return true;

  const q = canvas.getContext("2d");
  const yangi = kesibOl(yangiRasm, W, H);
  const eski = eskiRasm ? kesibOl(eskiRasm, W, H) : yangi;
  const effekt = ANIMATSIYALAR[effektNomi] || ANIMATSIYALAR.iplar;

  if (HARAKAT_KAM) { q.drawImage(yangi, 0, 0); return true; }

  q.drawImage(eski, 0, 0);
  return new Promise((tugadi) => {
    const boshi = performance.now();
    function kadr(hozir) {
      if (eskirdi()) return tugadi(false);
      const t = chekla((hozir - boshi) / vaqt);
      q.drawImage(eski, 0, 0);
      effekt(q, yangi, W, H, t, eski);
      if (t < 1) return requestAnimationFrame(kadr);
      q.drawImage(yangi, 0, 0);
      tugadi(true);
    }
    requestAnimationFrame(kadr);
  });
}
