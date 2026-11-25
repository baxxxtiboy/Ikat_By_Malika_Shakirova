/* =====================================================================
   5-OYNA.JS  —  MAHSULOT OCHILGANDA NIMA BO‘LADI
   ---------------------------------------------------------------------
   Ketma-ketlik:
     1. Kartochka joyidan uchib, 3D aylanadi (orqasida oltin naqsh)
     2. Qo‘nganda oltin uchqunlar portlaydi
     3. Mahsulotning o‘z effekti (2-animatsiyalar.js) rasmni ochadi
     4. Nomi harfma-harf chiqadi, ma’lumotlar birin-ketin keladi
   ===================================================================== */

/* --- Tezliklar (millisekundda). Sekinroq xohlasangiz kattalashtiring --- */
const VAQT = {
  uchish: 950,
  ochilish: 1900,
  rangAlmashish: 1300,
  yopilish: 420,
};

const NAQSH = "rasmlar/naqsh.jpg";

const oyna = topish("#oyna");
const sahna = topish("#sahna");            // rasm turgan ramka
const sahnaRasm = topish("#sahna-rasm");
const sahnaCanvas = topish("#sahna-canvas");
const zarra = zarralarYarat(topish("#oyna-zarra"));

let ochiq = null;          // hozir ochiq turgan mahsulot
let navbatRaqam = 0;       // tez-tez bosilganda eski animatsiyani bekor qiladi

const topMahsulot = (id) => MAHSULOTLAR.find((m) => m.id === id);
const kut = (ms) => new Promise((r) => setTimeout(r, HARAKAT_KAM ? 0 : ms));

/* ---------- Ma’lumotlarni yozish ---------- */
function malumotniYoz(m) {
  const toplam = TOPLAMLAR[m.toplam];
  const qardoshlar = MAHSULOTLAR.filter((x) => x.toplam === m.toplam);

  topish("#o-toplam").textContent = toplam.nomi;
  topish("#o-tavsif").textContent = m.tavsif;
  topish("#o-narx").textContent = narxYoz(m.narx);
  topish("#o-rang-nomi").textContent = m.rang.nomi;
  topish("#o-hisob").textContent = `${MAHSULOTLAR.indexOf(m) + 1} / ${MAHSULOTLAR.length}`;

  // Nomi: har bir harf alohida <span>, shunda birma-bir chiqadi
  let n = 0;
  const harf = (h) => `<span class="harf" style="--n:${n++}">${matn(h)}</span>`;
  const soz = (s) => `<span class="soz" aria-hidden="true">${[...s].map(harf).join("")}</span>`;
  topish("#o-nomi").setAttribute("aria-label", m.nomi);
  topish("#o-nomi").innerHTML = m.nomi.split(" ").map(soz).join(" ");

  topish("#o-ranglar").innerHTML = qardoshlar.map((x) => rangTugma(x, x === m)).join("");

  topish("#o-olchamlar").hidden = !m.olchamlar.length;
  topish("#o-olchamlar div").innerHTML = m.olchamlar.map((o) => `<span class="olcham">${matn(o)}</span>`).join("");

  const detalTugma = (nomi, i) =>
    `<button type="button" class="detal" data-detal="${i}" aria-pressed="${i === -1}">${matn(nomi)}</button>`;
  topish("#o-detallar").innerHTML = detalTugma("To‘liq", -1) + toplam.detallar.map((d, i) => detalTugma(d.nomi, i)).join("");

  // Oyna orqasidagi yorug‘lik ko‘ylak rangiga moslashadi
  oyna.style.setProperty("--tus", m.rang.tus1);
  document.title = m.nomi + " | " + DOKON.nomi;
}

/* ---------- Detalga yaqinlashish ---------- */
function yaqinlashtir(raqam) {
  const d = TOPLAMLAR[ochiq.toplam].detallar[raqam];
  topish("#o-detallar").querySelectorAll(".detal").forEach((b) =>
    b.setAttribute("aria-pressed", Number(b.dataset.detal) === raqam));
  if (!d) { sahnaRasm.style.transform = "none"; return; }
  // Nuqta markazga keladi, lekin rasm chetidan bo‘sh joy ko‘rinmaydi
  const chegara = (d.zoom - 1) * 50;
  const sur = (foiz) => Math.max(-chegara, Math.min(chegara, (50 - foiz) * d.zoom));
  sahnaRasm.style.transform = `translate(${sur(d.x)}%, ${sur(d.y)}%) scale(${d.zoom})`;
}

/* ---------- Ramkani yangi mahsulotga tayyorlash ---------- */
function sahnaniTayyorla(m) {
  oyna.querySelectorAll(".uchuvchi").forEach((u) => u.remove());
  oyna.classList.remove("ochildi", "yopilmoqda");
  sahna.style.visibility = "";
  sahnaRasm.style.transform = "none";
  sahnaRasm.src = m.rasm;
  sahnaRasm.alt = m.nomi;
}

/* ---------- 1-qadam: kartochka uchib keladi ---------- */
async function uchir(qayerdan, m) {
  const a = qayerdan.getBoundingClientRect();   // qayerdan
  const b = sahna.getBoundingClientRect();      // qayerga

  const uchuvchi = document.createElement("div");
  uchuvchi.className = "uchuvchi";
  uchuvchi.innerHTML = `<div class="yuz" style="background-image:url('${m.rasm}')"></div><div class="yuz orqa"></div>`;
  Object.assign(uchuvchi.style, { left: b.left + "px", top: b.top + "px", width: b.width + "px", height: b.height + "px" });
  oyna.append(uchuvchi);

  const dx = a.left + a.width / 2 - (b.left + b.width / 2);
  const dy = a.top + a.height / 2 - (b.top + b.height / 2);
  const kx = a.width / b.width;
  const ky = a.height / b.height;
  const holat = (x, y, sx, sy, burilish) =>
    `perspective(1400px) translate3d(${x}px, ${y}px, 0) scale(${sx}, ${sy}) rotateY(${burilish}deg)`;

  await uchuvchi.animate([
    { transform: holat(dx, dy, kx, ky, 0) },
    { transform: holat(dx * 0.35, dy * 0.35 - 40, (kx + 1) / 2, (ky + 1) / 2, 100), offset: 0.5 },
    { transform: holat(0, 0, 1, 1, 180) },
  ], { duration: VAQT.uchish, easing: "cubic-bezier(.45,.05,.2,1)", fill: "forwards" }).finished;

  return uchuvchi;
}

/* ---------- 2, 3, 4-qadamlar: portlash, effekt, matn ---------- */
async function ochilishniKorsat(m, eskiManzil, vaqt, eskirdi) {
  sahnaCanvas.hidden = false;
  const effekt = animatsiyaOyna(sahnaCanvas, m.animatsiya, eskiManzil, m.rasm, vaqt);

  const s = sahna.getBoundingClientRect();
  zarra.portlash(s.left + s.width / 2, s.top + s.height / 2);
  sahna.classList.remove("zarba");
  void sahna.offsetWidth;                 // shu qator animatsiyani qaytadan boshlatadi
  sahna.classList.add("zarba");

  await kut(vaqt * 0.35);
  if (eskirdi()) return;
  oyna.classList.add("ochildi");          // harflar va matn chiqadi

  const tugadi = await effekt;
  if (!tugadi || eskirdi()) return;
  sahnaRasm.hidden = false;               // canvas o‘rniga haqiqiy rasm
  try { await sahnaRasm.decode(); } catch { /* rasm ochilmasa ham davom etamiz */ }
  if (!eskirdi()) sahnaCanvas.hidden = true;
}

/* ---------- MAHSULOTNI OCHISH ----------
   qayerdan — uchib chiqadigan element (bo‘lmasa, uchmasdan ochiladi)
   tarixga  — brauzerning "orqaga" tugmasi ishlashi uchun                */
async function mahsulotniOch(id, qayerdan = null, tarixga = true) {
  const m = topMahsulot(id);
  if (!m) return;
  const mening = ++navbatRaqam;
  const eskirdi = () => mening !== navbatRaqam;

  ochiq = m;
  malumotniYoz(m);
  sahnaniTayyorla(m);
  sahnaCanvas.raqam = (sahnaCanvas.raqam || 0) + 1;   // eski effektni to‘xtatadi
  sahnaCanvas.hidden = true;
  sahnaRasm.hidden = true;                            // ramkada oltin naqsh ko‘rinadi

  // Zumrad shaklidagi fon bosilgan joydan kengayadi
  const r = qayerdan && qayerdan.getBoundingClientRect();
  oyna.style.setProperty("--bx", r ? r.left + r.width / 2 + "px" : "50vw");
  oyna.style.setProperty("--by", r ? r.top + r.height / 2 + "px" : "50vh");

  if (!oyna.open) oyna.showModal();
  oyna.scrollTop = 0;
  document.documentElement.classList.add("qotirilgan");
  zarra.boshla();
  if (tarixga) history.pushState(null, "", "#" + id);

  let uchuvchi = null;
  if (qayerdan && !HARAKAT_KAM) {
    sahna.style.visibility = "hidden";
    uchuvchi = await uchir(qayerdan, m);
    if (eskirdi()) return;
    sahna.style.visibility = "";
  } else {
    await kut(350);
    if (eskirdi()) return;
  }

  // Uchib kelgan nusxa ramka tayyor bo‘lgach olib tashlanadi
  await Promise.all([rasmYukla(NAQSH), rasmYukla(m.rasm)]);
  if (eskirdi()) return;
  const tugash = ochilishniKorsat(m, NAQSH, VAQT.ochilish, eskirdi);
  setTimeout(() => uchuvchi && uchuvchi.remove(), 40);
  await tugash;
}

/* ---------- Oyna ichida boshqa ko‘ylakka o‘tish ---------- */
async function boshqasigaOt(m) {
  if (!m || m === ochiq) return;
  const mening = ++navbatRaqam;
  const eskirdi = () => mening !== navbatRaqam;
  const eskiManzil = ochiq.rasm;

  ochiq = m;
  await Promise.all([rasmYukla(m.rasm), rasmYukla(eskiManzil)]);
  if (eskirdi()) return;

  const tugash = (() => {
    malumotniYoz(m);
    sahnaniTayyorla(m);
    return ochilishniKorsat(m, eskiManzil, VAQT.rangAlmashish, eskirdi);
  })();
  history.replaceState(null, "", "#" + m.id);
  await tugash;
}

// necha = 1 keyingisi,  -1 oldingisi
function qadam(necha) {
  if (!ochiq) return;
  const i = MAHSULOTLAR.indexOf(ochiq);
  boshqasigaOt(MAHSULOTLAR[(i + necha + MAHSULOTLAR.length) % MAHSULOTLAR.length]);
}

/* ---------- YOPISH ---------- */
async function oynaniYop() {
  if (!oyna.open || oyna.classList.contains("yopilmoqda")) return;
  const mening = ++navbatRaqam;
  oyna.classList.add("yopilmoqda");
  await kut(VAQT.yopilish);
  if (mening !== navbatRaqam) return;     // yopilayotganda boshqasi ochilgan bo‘lsa
  oyna.close();
  oyna.classList.remove("yopilmoqda", "ochildi");
  oyna.querySelectorAll(".uchuvchi").forEach((u) => u.remove());
  sahna.style.visibility = "";
  sahnaCanvas.raqam = (sahnaCanvas.raqam || 0) + 1;
  document.documentElement.classList.remove("qotirilgan");
  zarra.toxta();
  ochiq = null;
  document.title = DOKON.nomi;
  history.replaceState(null, "", "#");
}

/* ---------- Tugmalar, klaviatura, barmoq ---------- */
topish("#o-yop").addEventListener("click", oynaniYop);
topish("#o-oldingi").addEventListener("click", () => qadam(-1));
topish("#o-keyingi").addEventListener("click", () => qadam(1));

oyna.addEventListener("cancel", (e) => { e.preventDefault(); oynaniYop(); });   // Esc tugmasi
oyna.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") qadam(1);
  if (e.key === "ArrowLeft") qadam(-1);
});

topish("#o-ranglar").addEventListener("click", (e) => {
  const t = e.target.closest("[data-rang]");
  if (t) boshqasigaOt(topMahsulot(t.dataset.rang));
});

topish("#o-detallar").addEventListener("click", (e) => {
  const t = e.target.closest("[data-detal]");
  if (t) yaqinlashtir(Number(t.dataset.detal));
});

// Telefonda rasmni chapga yoki o‘ngga surish
let barmoq = null;
sahna.addEventListener("touchstart", (e) => {
  barmoq = { x: e.touches[0].clientX, y: e.touches[0].clientY };
}, { passive: true });
sahna.addEventListener("touchend", (e) => {
  if (!barmoq) return;
  const dx = e.changedTouches[0].clientX - barmoq.x;
  const dy = e.changedTouches[0].clientY - barmoq.y;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) qadam(dx < 0 ? 1 : -1);
  barmoq = null;
});

qiyshaytir(sahna);
addEventListener("resize", () => oyna.open && zarra.olchamla());

// Brauzerning "orqaga" tugmasi
addEventListener("popstate", () => {
  const m = topMahsulot(location.hash.slice(1));
  if (!m) oynaniYop();
  else if (m !== ochiq) mahsulotniOch(m.id, null, false);
});

/* ---------- SAYTNI ISHGA TUSHIRISH ---------- */
katalogniChiz();
aloqaniYoz();
boshRasmniQur();
if (topMahsulot(location.hash.slice(1))) mahsulotniOch(location.hash.slice(1), null, false);
