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

// Joyidan biroz o‘tib ketib, qaytib keladi (prujinadek)
const sakrash = (p) => 1 + 2.4 * Math.pow(p - 1, 3) + 1.4 * Math.pow(p - 1, 2);

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
    const soni = 64;                 // nechta ip (ko‘paytirsangiz mayinroq)
    const eni = W / soni;
    for (let i = 0; i < soni; i++) {
      const p = chekla((t - tasodif(i) * 0.45) / 0.55);
      if (p <= 0) continue;
      const k = sakrash(p);          // joyidan biroz o‘tib, qaytib keladi
      const tomon = i % 2 ? 1 : -1;  // bir ip tepadan, keyingisi pastdan
      const y = tomon * (1 - k) * H * 1.05;
      const x = i * eni + Math.sin(t * 12 + i * 0.6) * (1 - p) * W * 0.06;   // ip tebranadi
      q.drawImage(yangi, i * eni, 0, eni, H, x, y, eni + 0.7, H);
      if (p < 0.98) {                // ip uchida yonib turgan oltin cho‘g‘
        const uchi = tomon > 0 ? y : y + H;
        const oxiri = uchi + tomon * H * 0.3;
        const g = q.createLinearGradient(0, uchi, 0, oxiri);
        g.addColorStop(0, `rgba(255,225,140,${1 - p})`);
        g.addColorStop(1, "rgba(255,190,80,0)");
        q.globalCompositeOperation = "lighter";
        q.fillStyle = g;
        q.fillRect(x, Math.min(uchi, oxiri), eni, H * 0.3);
        q.globalCompositeOperation = "source-over";
      }
    }
  },

  /* OLMOS — markazdan ikat romblari aylanib, gullab ochiladi */
  olmos(q, yangi, W, H, t) {
    const a = W / 6;                 // romb kattaligi
    const b = a * 1.35;
    for (let qator = 0; qator * b < H + b; qator++) {
      for (let ustun = -1; ustun * a * 2 < W + a * 2; ustun++) {
        const x = ustun * a * 2 + (qator % 2) * a;
        const y = qator * b;
        const uzoq = Math.hypot(x - W / 2, y - H / 2) / Math.hypot(W / 2, H / 2);
        const k = navbat(t, uzoq * 0.5, 0.4);
        if (k <= 0) continue;
        q.save();
        q.translate(x, y);
        q.rotate((1 - k) * 2.6 * (qator % 2 ? 1 : -1));       // romb aylanadi
        q.save();
        q.beginPath();
        rombChiz(q, 0, 0, a * k * 1.02, b * k * 1.02);
        q.clip();
        const kat = 1 + (1 - k) * 1.2;                        // ichidagi rasm yaqindan keladi
        q.scale(kat, kat);
        q.drawImage(yangi, -x, -y, W, H);
        q.restore();
        if (k < 0.99) {                                       // yonib turgan hoshiya
          q.globalCompositeOperation = "lighter";
          q.globalAlpha = 1 - k;
          q.strokeStyle = OLTIN;
          q.lineWidth = W / 90;
          q.beginPath();
          rombChiz(q, 0, 0, a * k, b * k);
          q.stroke();
        }
        q.restore();
      }
    }
  },

  /* PARDA — eski rasm teatr pardasi bo‘lib yig‘iladi, orqasidan nur uradi */
  parda(q, yangi, W, H, t, eski) {
    const k = t * t * (3 - 2 * t);               // parda qancha ochildi
    const kat = 1.45 - 0.45 * yumshoq(t);        // yangi rasm yaqindan keladi
    q.drawImage(yangi, (W - W * kat) / 2, (H - H * kat) / 2, W * kat, H * kat);
    const nur = chekla(1 - t * 1.25);            // sahna nuri asta so‘nadi
    if (nur > 0) {
      const g = q.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H * 0.45, H * 0.75);
      g.addColorStop(0, `rgba(255,244,205,${nur})`);
      g.addColorStop(0.5, `rgba(243,200,100,${nur * 0.55})`);
      g.addColorStop(1, "rgba(243,200,100,0)");
      q.globalCompositeOperation = "lighter";
      q.fillStyle = g;
      q.fillRect(0, 0, W, H);
      q.globalCompositeOperation = "source-over";
    }
    const burma = 9;                             // har tomonda nechta burma
    const manba = W / 2 / burma;
    const eni = manba * (1 - k);
    if (eni < 0.3) return;
    const soya = Math.min(0.85, k * 4);          // burma soyasi
    for (let i = 0; i < burma; i++) {
      const tolqin = Math.sin(i * 0.9 + t * 14) * H * 0.02 * k;
      [0, 1].forEach((ong) => {                  // 0 = chap parda, 1 = o‘ng parda
        const sx = ong ? W - (i + 1) * manba : i * manba;
        const dx = ong ? W - (i + 1) * eni : i * eni;
        const usti = Math.min(1, k * 8) * H * 0.03;
        q.drawImage(eski, sx, 0, manba, H, dx, tolqin - usti, eni + 0.7, H + usti * 2);
        const g = q.createLinearGradient(dx, 0, dx + eni, 0);
        g.addColorStop(0, `rgba(0,0,0,${soya})`);
        g.addColorStop(0.45, `rgba(255,225,150,${0.3 * soya})`);
        g.addColorStop(1, `rgba(0,0,0,${soya})`);
        q.fillStyle = g;
        q.fillRect(dx, 0, eni + 0.7, H);
      });
    }
  },

  /* ZINA — rasm pastdan tepaga zinama-zina ag‘dariladi va yondan uchib keladi */
  zina(q, yangi, W, H, t, eski) {
    const soni = 18;
    const boyi = H / soni;
    for (let i = 0; i < soni; i++) {
      const k = chekla((t - ((soni - 1 - i) / soni) * 0.58) / 0.42);
      const burchak = yumshoq(k) * Math.PI;          // 0 dan 180 gradusgacha
      const siqilish = Math.abs(Math.cos(burchak));  // qirrasi bilan turganda 0
      const yangimi = burchak >= Math.PI / 2;
      const y = i * boyi;
      if (siqilish < 0.99) {                         // ag‘darilayotgan zinaning orqasi
        q.fillStyle = "#04110b";
        q.fillRect(0, y, W, boyi + 0.7);
      }
      const tomon = i % 2 ? 1 : -1;
      const x = yangimi ? tomon * (1 - siqilish) * W * 0.35 : 0;
      q.drawImage(yangimi ? yangi : eski, 0, y, W, boyi, x, y + (boyi * (1 - siqilish)) / 2, W, boyi * siqilish + 0.7);
      if (k > 0 && k < 0.45) {                       // qirradagi oltin yaltirash
        const kuch = Math.sin((k / 0.45) * Math.PI);
        const orta = y + boyi / 2;
        const g = q.createLinearGradient(0, orta - boyi * 0.6, 0, orta + boyi * 0.6);
        g.addColorStop(0, "rgba(255,200,90,0)");
        g.addColorStop(0.5, `rgba(255,220,140,${kuch * 0.6})`);
        g.addColorStop(1, "rgba(255,200,90,0)");
        q.globalCompositeOperation = "lighter";
        q.fillStyle = g;
        q.fillRect(0, orta - boyi * 0.6, W, boyi * 1.2);
        q.globalCompositeOperation = "source-over";
      }
    }
  },

  /* YULDUZ — yulduzlar orasidan uchib o‘tamiz, keyin rasm yorishib chiqadi */
  yulduz(q, yangi, W, H, t) {
    const qorongi = chekla(t * 6) * chekla((0.85 - t) * 4);
    q.fillStyle = `rgba(2,10,8,${qorongi * 0.92})`;  // avval fon qorayadi
    q.fillRect(0, 0, W, H);

    const yulduzlar = [];
    for (let i = 0; i < 46; i++) {
      yulduzlar.push({
        x: tasodif(i) * W,
        y: tasodif(i + 100) * H,
        k: chekla((t - 0.3 - tasodif(i + 200) * 0.35) / 0.35),
      });
    }
    q.save();                                        // rasm yulduzlardan yorishadi
    q.beginPath();
    yulduzlar.forEach((s) => {
      const r = Math.pow(s.k, 2.2) * W * 0.55;
      q.moveTo(s.x + r, s.y);
      q.arc(s.x, s.y, r, 0, Math.PI * 2);
    });
    q.clip();
    const kat = 1.3 - 0.3 * yumshoq(t);
    q.drawImage(yangi, (W - W * kat) / 2, (H - H * kat) / 2, W * kat, H * kat);
    q.restore();
    q.globalAlpha = chekla((t - 0.8) / 0.2);         // oxirida qolgan joy ham yorishadi
    q.drawImage(yangi, 0, 0, W, H);

    q.globalCompositeOperation = "lighter";
    const tezlik = chekla((0.62 - t) * 4);          // yorug‘lik tezligidagi chiziqlar
    q.lineCap = "round";
    for (let i = 0; i < 170 && tezlik > 0; i++) {
      const burchak = tasodif(i + 300) * Math.PI * 2;
      const yol = (t * 2.4 + tasodif(i + 400)) % 1;
      const r1 = yol * yol * H * 0.8;
      const r2 = r1 + yol * H * 0.26;
      q.globalAlpha = (0.3 + 0.7 * yol) * tezlik;
      q.strokeStyle = i % 4 ? "#fff3cf" : "#4fe0ad";
      q.lineWidth = (W / 150) * (0.4 + yol);
      q.beginPath();
      q.moveTo(W / 2 + Math.cos(burchak) * r1, H / 2 + Math.sin(burchak) * r1);
      q.lineTo(W / 2 + Math.cos(burchak) * r2, H / 2 + Math.sin(burchak) * r2);
      q.stroke();
    }
    q.fillStyle = "#fff6d8";
    yulduzlar.forEach((s) => {                       // chaqnoq, + shaklida
      if (s.k <= 0 || s.k >= 1) return;
      const u = Math.sin(s.k * Math.PI) * W * 0.17;
      const e = W / 190;
      q.globalAlpha = Math.sin(s.k * Math.PI);
      q.beginPath();
      rombChiz(q, s.x, s.y, u, e);
      rombChiz(q, s.x, s.y, e, u);
      q.fill();
    });
    q.globalAlpha = 1;
    q.globalCompositeOperation = "source-over";
  },

  /* GAVHAR — zumrad qirralari girdobdek aylanib joyiga tushadi */
  gavhar(q, yangi, W, H, t) {
    const halqa = 11;
    for (let i = halqa; i >= 1; i--) {               // tashqaridan ichkariga
      const k = navbat(t, (1 - i / halqa) * 0.42, 0.58);
      if (k <= 0) continue;
      const tomon = i % 2 ? 1 : -1;
      const kat = i % 2 ? 0.35 + 0.65 * k : 1.5 - 0.5 * k;   // biri kichikdan, biri kattadan
      q.save();
      q.globalAlpha = chekla(k * 1.6);
      q.translate(W / 2, H / 2);
      q.rotate(tomon * (1 - k) * 3.4);
      q.scale(kat, kat);
      q.beginPath();
      if (i === halqa) q.rect(-W / 2, -H / 2, W, H);
      else zumradChiz(q, 0, 0, (W / 2) * (i / halqa), (H / 2) * (i / halqa));
      q.clip();
      q.drawImage(yangi, -W / 2, -H / 2, W, H);
      q.globalCompositeOperation = "lighter";
      q.globalAlpha = 1 - k;
      q.strokeStyle = i % 3 ? OLTIN : "#37d69b";
      q.lineWidth = W / 45;
      q.stroke();
      q.restore();
    }
  },
};

/* ---------- IPAK TO‘LQINI ----------
   Har bir effektdan keyin rasm ipakdek hilpiraydi va ustidan nur o‘tadi.
   p — vaqt (0..1), oxirida rasm tinchiydi                                */
function ipakTolqin(q, yangi, W, H, p) {
  q.drawImage(yangi, 0, 0, W, H);
  const kuch = Math.sin(p * Math.PI) * (1 - p) * H * 0.02;
  const soni = 70;
  const eni = W / soni;
  for (let i = 0; i < soni; i++) {
    const dy = Math.sin(i * 0.22 - p * 14) * kuch;
    q.drawImage(yangi, i * eni, 0, eni, H, i * eni, dy, eni + 0.7, H);
  }
  const x = -W * 0.6 + p * W * 2.2;                  // qiya o‘tuvchi yorug‘lik
  const g = q.createLinearGradient(x - W * 0.28, 0, x + W * 0.28, H * 0.25);
  g.addColorStop(0, "rgba(255,235,170,0)");
  g.addColorStop(0.5, "rgba(255,240,195,.5)");
  g.addColorStop(1, "rgba(255,235,170,0)");
  q.globalCompositeOperation = "lighter";
  q.fillStyle = g;
  q.fillRect(0, 0, W, H);
  q.globalCompositeOperation = "source-over";
}

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
      if (t < 1) {                                   // 1-qism: effektning o‘zi
        q.drawImage(eski, 0, 0);
        effekt(q, yangi, W, H, t, eski);
        return requestAnimationFrame(kadr);
      }
      const p = chekla((hozir - boshi - vaqt) / 1300);
      if (p < 1) {                                   // 2-qism: ipak to‘lqini
        ipakTolqin(q, yangi, W, H, p);
        return requestAnimationFrame(kadr);
      }
      q.drawImage(yangi, 0, 0);
      tugadi(true);
    }
    requestAnimationFrame(kadr);
  });
}
