/* =====================================================================
   4-KATALOG.JS  —  BOSH SAHIFA
   1) tepadagi katta rasm va rang tugmalari
   2) to‘plamlar va mahsulot kartochkalari
   3) pastdagi aloqa
   ===================================================================== */

// Sahifadan elementni topadi. Masalan:  topish("#katalog")
const topish = (selektor, ichida = document) => ichida.querySelector(selektor);

// Oddiy matnni xavfsiz qiladi ( <, & kabi belgilar sahifani buzmasin )
const matn = (s) => String(s).replace(/[&<>"]/g, (b) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[b]));

// 1500000  ->  "1 500 000 so‘m"
const narxYoz = (narx) =>
  narx ? String(narx).replace(/\B(?=(\d{3})+$)/g, " ") + " " + DOKON.valyuta : "Narxi so‘rov bo‘yicha";

// Rang tugmachasi (zumrad shaklida)
const rangTugma = (m, tanlangan) => `
  <button class="rang" type="button" data-rang="${m.id}" aria-pressed="${tanlangan}"
          aria-label="${matn(m.rang.nomi)}" title="${matn(m.rang.nomi)}"
          style="--tus1:${m.rang.tus1}; --tus2:${m.rang.tus2}"><span></span></button>`;

/* ---------- 1) Tepadagi katta rasm ---------- */
function boshRasmniQur() {
  const ramka = topish("#bosh-rasm");
  const canvas = topish("canvas", ramka);
  const ranglar = topish("#bosh-ranglar");
  const nomi = topish("#bosh-nomi");

  // Birinchi to‘plam ko‘ylaklari navbat bilan almashadi
  const royxat = MAHSULOTLAR.filter((m) => m.toplam === MAHSULOTLAR[0].toplam);
  let hozirgi = 0;
  let soat;

  ranglar.innerHTML = royxat.map((m, i) => rangTugma(m, i === 0)).join("");

  function korsat(i, eskiManzil) {
    const eski = eskiManzil || royxat[hozirgi].rasm;
    const m = royxat[i];
    hozirgi = i;
    nomi.textContent = m.nomi;
    ramka.setAttribute("aria-label", m.nomi + ", ochish");
    ranglar.querySelectorAll(".rang").forEach((b) => b.setAttribute("aria-pressed", b.dataset.rang === m.id));
    animatsiyaOyna(canvas, "iplar", eski, m.rasm, 1900);
  }

  // Har 4.8 sekundda keyingi rangga o‘tadi
  function keyingisiniKut() {
    clearInterval(soat);
    if (HARAKAT_KAM) return;
    soat = setInterval(() => {
      // sahifa ko‘rinmasa yoki mahsulot ochiq bo‘lsa, behuda ishlamaymiz
      const korinadi = ramka.getBoundingClientRect().bottom > 0;
      if (document.hidden || topish("#oyna").open || !korinadi) return;
      korsat((hozirgi + 1) % royxat.length);
    }, 4800);
  }

  ranglar.addEventListener("click", (e) => {
    const tugma = e.target.closest("[data-rang]");
    if (!tugma) return;
    const i = royxat.findIndex((m) => m.id === tugma.dataset.rang);
    if (i !== hozirgi) korsat(i);
    keyingisiniKut();
  });

  ramka.addEventListener("click", () => mahsulotniOch(royxat[hozirgi].id, ramka));

  korsat(0, "rasmlar/naqsh.jpg");   // birinchi marta oltin naqshdan to‘qiladi
  keyingisiniKut();
}

/* ---------- 2) Katalog ---------- */
const kartaHtml = (m) => `
  <a class="karta" href="#${m.id}" data-id="${m.id}">
    <span class="zumrad karta-rasm">
      <img src="${m.rasm}" alt="${matn(m.nomi)}, ${matn(m.rang.nomi)} rang" loading="lazy">
    </span>
    <span class="karta-matn">
      <strong>${matn(m.nomi)}</strong>
      <small>${matn(m.rang.nomi)}, ${narxYoz(m.narx).toLowerCase()}</small>
    </span>
  </a>`;

function katalogniChiz() {
  topish("#katalog").innerHTML = Object.entries(TOPLAMLAR).map(([kalit, toplam]) => {
    const ichidagi = MAHSULOTLAR.filter((m) => m.toplam === kalit);
    if (!ichidagi.length) return "";
    return `
      <section class="toplam" aria-labelledby="t-${kalit}">
        <header class="toplam-bosh">
          <h2 id="t-${kalit}">${matn(toplam.nomi)}</h2>
          <p>${matn(toplam.tavsif)}</p>
        </header>
        <div class="qator">${ichidagi.map(kartaHtml).join("")}</div>
      </section>`;
  }).join("");

  // Kartochka bosilganda mahsulot oynasi ochiladi (5-oyna.js)
  topish("#katalog").addEventListener("click", (e) => {
    const karta = e.target.closest(".karta");
    if (!karta || e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    mahsulotniOch(karta.dataset.id, topish(".karta-rasm", karta));
  });

  document.querySelectorAll(".karta-rasm").forEach(qiyshaytir);
}

// Element sichqonchaga qarab 3D egiladi (CSS dagi --ex, --ey ni o‘zgartiradi)
function qiyshaytir(element) {
  if (HARAKAT_KAM) return;
  element.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    const r = element.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;    // 0..1
    const y = (e.clientY - r.top) / r.height;
    element.style.setProperty("--ey", (x - 0.5) * 12 + "deg");
    element.style.setProperty("--ex", (0.5 - y) * 10 + "deg");
    element.style.setProperty("--yx", x * 100 + "%");
    element.style.setProperty("--yy", y * 100 + "%");
  });
  element.addEventListener("pointerleave", () => {
    element.style.setProperty("--ey", "0deg");
    element.style.setProperty("--ex", "0deg");
  });
}

/* ---------- 3) Telefon va Instagram havolalari ---------- */
function aloqaniYoz() {
  document.querySelectorAll("[data-telefon]").forEach((a) => {
    a.href = "tel:" + DOKON.telefon.replace(/[^+\d]/g, "");
    a.textContent = DOKON.telefon;
  });
  document.querySelectorAll("[data-instagram]").forEach((a) => {
    a.href = "https://www.instagram.com/" + DOKON.instagram.toLowerCase() + "/";
    if (a.dataset.instagram === "nom") a.textContent = "@" + DOKON.instagram;
  });
}
