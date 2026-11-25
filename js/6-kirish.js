/* =====================================================================
   6-KIRISH.JS  —  SAYTGA KIRISH SAHNASI VA SAHIFA SEHRLARI
   1) oltin eshik ochilishi (faqat kuchli rejimda)
   2) sichqoncha ortidan oltin iz (faqat kuchli rejimda)
   3) kartochkalar ekranga chiqqanda: soddada asta paydo bo‘ladi,
      kuchlida parda kabi ochiladi
   Eng pastida sayt ishga tushiriladi.
   ===================================================================== */

const sahifaZarra = zarralarYarat(topish("#sahifa-zarra"));

/* ---------- 1) Oltin eshik ---------- */
async function eshikniOch() {
  const eshik = topish("#kirish");
  // Oldin ko‘rgan bo‘lsa yoki to‘g‘ri mahsulotga kirgan bo‘lsa, ko‘rsatmaymiz
  let korgan = false;
  try {
    korgan = sessionStorage.getItem("kirish") === "1";
    sessionStorage.setItem("kirish", "1");
  } catch { /* brauzer xotirasi yopiq bo‘lsa ham ishlayveradi */ }
  if (SODDA || korgan || HARAKAT_KAM || topMahsulot(location.hash.slice(1))) return eshik.remove();

  eshik.hidden = false;
  const bosildi = new Promise((r) => eshik.addEventListener("click", r, { once: true }));
  await Promise.race([rasmYukla(NAQSH), kut(2500)]);
  eshik.classList.add("belgi-chiqsin");
  await Promise.race([kut(1600), bosildi]);          // bossa, kutmasdan ochiladi

  sahifaZarra.zarba(innerWidth / 2, innerHeight / 2);
  sahifaZarra.portlash(innerWidth / 2, innerHeight / 2, 240, 1.2);
  eshik.classList.add("ochilsin");
  setTimeout(() => eshik.remove(), 1700);
  await kut(450);
}

/* ---------- 2) Sichqoncha izi ---------- */
let oxirgiIz = { x: 0, y: 0 };
addEventListener("pointermove", (e) => {
  if (e.pointerType !== "mouse" || oyna.open) return;
  if (Math.hypot(e.clientX - oxirgiIz.x, e.clientY - oxirgiIz.y) < 14) return;
  oxirgiIz = { x: e.clientX, y: e.clientY };
  sahifaZarra.iz(e.clientX, e.clientY, 2);
});

/* ---------- 3) Kartochkalar pardasi ---------- */
function kartalarniPardala() {
  const rasmlar = document.querySelectorAll(".karta-rasm");
  if (HARAKAT_KAM || !("IntersectionObserver" in window)) {
    rasmlar.forEach((r) => r.classList.add("ochilgan"));
    return;
  }

  function pardaniOch(rasm) {
    rasm.classList.add("ochilgan");
    const r = rasm.getBoundingClientRect();
    sahifaZarra.portlash(r.left + r.width / 2, r.top + r.height / 2, 40, 0.6);
    setTimeout(() => rasm.querySelectorAll(".parda").forEach((p) => p.remove()), 1500);
  }

  const kuzatuvchi = new IntersectionObserver((korinish) => {
    korinish.filter((k) => k.isIntersecting).forEach((k) => {
      kuzatuvchi.unobserve(k.target);
      const karta = k.target.closest(".karta");
      const tartib = [...karta.parentElement.children].indexOf(karta);
      setTimeout(() => pardaniOch(k.target), (tartib % 3) * (SODDA ? 90 : 170));   // birin-ketin
    });
  }, { threshold: 0.15 });

  rasmlar.forEach((rasm) => {
    if (!SODDA) rasm.insertAdjacentHTML("beforeend", `<i class="parda chap"></i><i class="parda ong"></i>`);
    kuzatuvchi.observe(rasm);
  });
}

addEventListener("resize", sahifaZarra.olchamla);

/* ---------- SAYTNI ISHGA TUSHIRISH ---------- */
tilTugmalari();
katalogniChiz();
aloqaniYoz();
sahifaZarra.boshla(34);
kartalarniPardala();
if (topMahsulot(location.hash.slice(1))) mahsulotniOch(location.hash.slice(1), null, false);
eshikniOch().then(boshRasmniQur);
