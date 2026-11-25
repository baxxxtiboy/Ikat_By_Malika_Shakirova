/* =====================================================================
   5-OYNA.JS  —  MAHSULOT OCHILGANDA NIMA BO‘LADI
   ---------------------------------------------------------------------
   Sodda rejim: kartochka ramkaga silliq siljiydi, matn asta chiqadi.

   Kuchli rejim ketma-ketligi:
     1. Kartochka kometadek uchib, 3D aylanadi (orqasida oltin naqsh)
     2. Qo‘nganda zarba: chaqnoq, to‘lqin, uchqunlar, silkinish
     3. Mahsulotning o‘z effekti (2-animatsiyalar.js) rasmni ochadi
     4. Nomi harfma-harf uchib keladi, ma’lumotlar birin-ketin chiqadi
     5. Yopilganda rasm parchalanib ketadi
   ===================================================================== */

/* --- Tezliklar (millisekundda). Sekinroq xohlasangiz kattalashtiring --- */
const VAQT = SODDA
  ? { uchish: 650, ochilish: 600, rangAlmashish: 600, yopilish: 300 }       // sodda
  : { uchish: 1250, ochilish: 2500, rangAlmashish: 1700, yopilish: 950 };   // kuchli

const NAQSH = "rasmlar/naqsh.jpg";

const oyna = topish("#oyna");
const sahna = topish("#sahna");            // rasm turgan ramka
const sahnaRasm = topish("#sahna-rasm");
const sahnaCanvas = topish("#sahna-canvas");
const zarra = zarralarYarat(topish("#oyna-zarra"));

let ochiq = null;          // hozir ochiq turgan mahsulot
let yaqinRaqam = -1;       // qaysi detal yaqinlashtirilgan (-1 = to‘liq)
let navbatRaqam = 0;       // tez-tez bosilganda eski animatsiyani bekor qiladi

const topMahsulot = (id) => MAHSULOTLAR.find((m) => m.id === id);
const kut = (ms) => new Promise((r) => setTimeout(r, HARAKAT_KAM ? 0 : ms));

/* ---------- Ma’lumotlarni yozish ---------- */
function malumotniYoz(m) {
  const toplam = TOPLAMLAR[m.toplam];
  const qardoshlar = MAHSULOTLAR.filter((x) => x.toplam === m.toplam);

  topish("#o-toplam").textContent = tarjima(toplam.nomi);
  topish("#o-tavsif").textContent = tarjima(m.tavsif);
  topish("#o-narx").textContent = narxYoz(m.narx);
  topish("#o-rang-nomi").textContent = tarjima(m.rang.nomi);
  topish("#o-hisob").textContent = `${MAHSULOTLAR.indexOf(m) + 1} / ${MAHSULOTLAR.length}`;

  // Nomi: har bir harf alohida <span>, shunda birma-bir chiqadi
  let n = 0;
  // --hx, --hy, --hr: harf qayerdan va qanday burilib uchib keladi
  const harf = (h) => {
    const joy = `--hx:${(tasodif(n) - 0.5) * 500}px; --hy:${(tasodif(n + 50) - 0.5) * 420}px; --hr:${(tasodif(n + 90) - 0.5) * 260}deg`;
    return `<span class="harf" style="--n:${n++}; ${joy}">${matn(h)}</span>`;
  };
  const soz = (s) => `<span class="soz" aria-hidden="true">${[...s].map(harf).join("")}</span>`;
  topish("#o-nomi").setAttribute("aria-label", tarjima(m.nomi));
  topish("#o-nomi").innerHTML = tarjima(m.nomi).split(" ").map(soz).join(" ");

  topish("#o-ranglar").innerHTML = qardoshlar.map((x) => rangTugma(x, x === m)).join("");

  topish("#o-olchamlar").hidden = !m.olchamlar.length;
  topish("#o-olchamlar div").innerHTML = m.olchamlar.map((o) => `<span class="olcham">${matn(o)}</span>`).join("");

  const detalTugma = (nomi, i) =>
    `<button type="button" class="detal" data-detal="${i}" aria-pressed="${i === -1}">${matn(nomi)}</button>`;
  topish("#o-detallar").innerHTML = detalTugma(yozuv("toliq"), -1) + toplam.detallar.map((d, i) => detalTugma(tarjima(d.nomi), i)).join("");

  // Oyna orqasidagi yorug‘lik ko‘ylak rangiga moslashadi
  oyna.style.setProperty("--tus", m.rang.tus1);
  zarra.ranglar = [...ZARRA_RANGLARI, m.rang.tus1, m.rang.tus2, m.rang.tus2];   // uchqunlar ham
  document.title = tarjima(m.nomi) + " | " + DOKON.nomi;
}

/* ---------- Detalga yaqinlashish ---------- */
function yaqinlashtir(raqam) {
  yaqinRaqam = raqam;
  const d = TOPLAMLAR[ochiq.toplam].detallar[raqam];
  topish("#o-detallar").querySelectorAll(".detal").forEach((b) =>
    b.setAttribute("aria-pressed", Number(b.dataset.detal) === raqam));
  const s = sahna.getBoundingClientRect();
  zarra.portlash(s.left + s.width / 2, s.top + s.height / 2, 50, 0.6);
  if (!d) { sahnaRasm.style.transform = "none"; return; }
  // Nuqta markazga keladi, lekin rasm chetidan bo‘sh joy ko‘rinmaydi
  const chegara = (d.zoom - 1) * 50;
  const sur = (foiz) => Math.max(-chegara, Math.min(chegara, (50 - foiz) * d.zoom));
  sahnaRasm.style.transform = `translate(${sur(d.x)}%, ${sur(d.y)}%) scale(${d.zoom})`;
}

/* ---------- Ramkani yangi mahsulotga tayyorlash ---------- */
function sahnaniTayyorla(m) {
  oyna.querySelectorAll(".uchuvchi").forEach((u) => u.remove());
  oyna.classList.remove("ochildi", "yopilmoqda", "portladi");
  sahna.style.visibility = "";
  yaqinRaqam = -1;
  sahnaRasm.style.transform = "none";
  sahnaRasm.src = m.rasm;
  sahnaRasm.alt = tarjima(m.nomi);
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

  if (SODDA) {                                  // silliq siljish, aylanmasdan
    await uchuvchi.animate([{ transform: holat(dx, dy, kx, ky, 0) }, { transform: holat(0, 0, 1, 1, 0) }],
      { duration: VAQT.uchish, easing: "cubic-bezier(.3,.7,.2,1)", fill: "forwards" }).finished;
    return uchuvchi;
  }

  // 540 gradus = bir yarim aylanish, oxirida orqasi (oltin naqsh) ko‘rinadi
  const parvoz = uchuvchi.animate([
    { transform: holat(dx, dy, kx, ky, 0) },
    { transform: holat(dx * 0.45, dy * 0.45 - 70, kx * 0.75, ky * 0.75, 260), offset: 0.5 },
    { transform: holat(0, 0, 1.12, 1.12, 540), offset: 0.88 },
    { transform: holat(0, 0, 1, 1, 540) },
  ], { duration: VAQT.uchish, easing: "cubic-bezier(.45,.05,.25,1)", fill: "forwards" });

  // Uchayotganda ortidan kometa izi qoladi
  (function izQoldir() {
    if (parvoz.playState !== "running" || !uchuvchi.isConnected) return;
    const r = uchuvchi.getBoundingClientRect();
    zarra.iz(r.left + r.width * Math.random(), r.top + r.height * Math.random(), 5);
    requestAnimationFrame(izQoldir);
  })();
  // Qo‘nishdan oldin zarralar markazga so‘riladi
  setTimeout(() => uchuvchi.isConnected && zarra.yutilish(b.left + b.width / 2, b.top + b.height / 2), VAQT.uchish * 0.45);

  await parvoz.finished;
  return uchuvchi;
}

/* ---------- 2, 3, 4-qadamlar: portlash, effekt, matn ---------- */
// Sinfni olib, qayta qo‘shadi: CSS animatsiya boshidan boshlanadi
function qaytaBoshla(element, sinf, boshqalar = []) {
  element.classList.remove(sinf, ...boshqalar);
  void element.offsetWidth;
  element.classList.add(sinf);
}

function zarbaBer(sahnaSinfi) {
  const s = sahna.parentElement.getBoundingClientRect();
  const x = s.left + s.width / 2;
  const y = s.top + s.height / 2;
  oyna.style.setProperty("--cx", x + "px");
  oyna.style.setProperty("--cy", y + "px");
  qaytaBoshla(oyna, "portladi");                          // chaqnoq va silkinish
  qaytaBoshla(sahna, sahnaSinfi, ["zarba", "burildi"]);   // ramka harakati
  zarra.zarba(x, y);
  zarra.portlash(x, y, 260);
  setTimeout(() => oyna.open && zarra.portlash(x, y, 90, 0.6), 260);   // ikkinchi portlash
}

async function ochilishniKorsat(m, eskiManzil, vaqt, eskirdi, sahnaSinfi = "zarba") {
  sahnaCanvas.hidden = false;
  const effekt = animatsiyaOyna(sahnaCanvas, m.animatsiya, eskiManzil, m.rasm, vaqt);

  if (!SODDA) zarbaBer(sahnaSinfi);

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
    await kut(SODDA ? 0 : 350);
    if (eskirdi()) return;
  }

  if (SODDA) {                              // rasm darhol, matn asta chiqadi
    sahnaRasm.hidden = false;
    try { await sahnaRasm.decode(); } catch { /* rasm ochilmasa ham davom etamiz */ }
    if (eskirdi()) return;
    if (uchuvchi) uchuvchi.remove();
    oyna.classList.add("ochildi");
    return;
  }

  // Uchib kelgan nusxa ramka tayyor bo‘lgach olib tashlanadi
  await Promise.all([rasmYukla(NAQSH), rasmYukla(m.rasm)]);
  if (eskirdi()) return;
  const tugash = ochilishniKorsat(m, NAQSH, VAQT.ochilish, eskirdi);
  setTimeout(() => uchuvchi && uchuvchi.remove(), 40);
  await tugash;
}

/* ---------- Oyna ichida boshqa ko‘ylakka o‘tish ---------- */
// tomon: 1 — ramka o‘ngdan buriladi, -1 — chapdan
async function boshqasigaOt(m, tomon = 1) {
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
    sahna.style.setProperty("--tomon", tomon);
    return ochilishniKorsat(m, eskiManzil, VAQT.rangAlmashish, eskirdi, "burildi");
  })();
  history.replaceState(null, "", "#" + m.id);
  await tugash;
}

// necha = 1 keyingisi,  -1 oldingisi
function qadam(necha) {
  if (!ochiq) return;
  const i = MAHSULOTLAR.indexOf(ochiq);
  boshqasigaOt(MAHSULOTLAR[(i + necha + MAHSULOTLAR.length) % MAHSULOTLAR.length], necha);
}

/* ---------- YOPISH ---------- */
async function oynaniYop() {
  if (!oyna.open || oyna.classList.contains("yopilmoqda")) return;
  const mening = ++navbatRaqam;
  if (!SODDA) {                           // rasm parchalarga bo‘linib uchadi
    const rasm = await rasmYukla(ochiq.rasm);
    if (mening !== navbatRaqam) return;
    const joy = sahna.getBoundingClientRect();
    if (rasm) zarra.parchala(kesibOl(rasm, Math.round(joy.width), Math.round(joy.height)), joy);
    zarra.portlash(joy.left + joy.width / 2, joy.top + joy.height / 2, 140, 0.8);
  }
  oyna.classList.add("yopilmoqda");
  await kut(VAQT.yopilish);
  if (mening !== navbatRaqam) return;     // yopilayotganda boshqasi ochilgan bo‘lsa
  oyna.close();
  oyna.classList.remove("yopilmoqda", "ochildi", "portladi");
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

// Til almashganda ochiq mahsulot matni ham almashadi
document.addEventListener("til-almashdi", () => {
  if (!ochiq) return;
  const raqam = yaqinRaqam;
  malumotniYoz(ochiq);
  sahnaRasm.alt = tarjima(ochiq.nomi);
  yaqinlashtir(raqam);
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
