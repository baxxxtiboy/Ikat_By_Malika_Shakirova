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

// 1500000  ->  "1 500 000 so‘m".  0 bo‘lsa "Narxi so‘rov bo‘yicha"
const narxYoz = (narx) =>
  narx ? String(narx).replace(/\B(?=(\d{3})+$)/g, " ") + " " + yozuv("valyuta") : yozuv("narxSorov");

// Rang tugmachasi (zumrad shaklida)
const rangTugma = (m, tanlangan) => `
  <button class="rang" type="button" data-rang="${m.id}" aria-pressed="${tanlangan}"
          aria-label="${matn(tarjima(m.rang.nomi))}" title="${matn(tarjima(m.rang.nomi))}"
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

  // Ko‘ylak nomi va rang tugmalari (til almashganda ham chaqiriladi)
  function yozuvlar() {
    const m = royxat[hozirgi];
    nomi.textContent = tarjima(m.nomi);
    ramka.setAttribute("aria-label", yozuv("ochish") + ": " + tarjima(m.nomi));
    ranglar.innerHTML = royxat.map((x) => rangTugma(x, x === m)).join("");
  }
  document.addEventListener("til-almashdi", yozuvlar);

  function korsat(i, eskiManzil) {
    const eski = eskiManzil || royxat[hozirgi].rasm;
    const m = royxat[i];
    hozirgi = i;
    nomi.textContent = tarjima(m.nomi);
    ramka.setAttribute("aria-label", yozuv("ochish") + ": " + tarjima(m.nomi));
    ranglar.querySelectorAll(".rang").forEach((b) => b.setAttribute("aria-pressed", b.dataset.rang === m.id));
    const effektlar = ["iplar", "gavhar", "olmos"];      // har rang o‘z effekti bilan
    animatsiyaOyna(canvas, effektlar[i % effektlar.length], eski, m.rasm, SODDA ? 1100 : 2000);
  }

  // Har 6 sekundda keyingi rangga o‘tadi
  function keyingisiniKut() {
    clearInterval(soat);
    if (HARAKAT_KAM) return;
    soat = setInterval(() => {
      // sahifa ko‘rinmasa yoki mahsulot ochiq bo‘lsa, behuda ishlamaymiz
      const korinadi = ramka.getBoundingClientRect().bottom > 0;
      if (document.hidden || topish("#oyna").open || !korinadi) return;
      korsat((hozirgi + 1) % royxat.length);
    }, 6000);
  }

  ranglar.addEventListener("click", (e) => {
    const tugma = e.target.closest("[data-rang]");
    if (!tugma) return;
    const i = royxat.findIndex((m) => m.id === tugma.dataset.rang);
    if (i !== hozirgi) korsat(i);
    keyingisiniKut();
  });

  ramka.addEventListener("click", () => mahsulotniOch(royxat[hozirgi].id, ramka));

  yozuvlar();
  korsat(0, "rasmlar/naqsh.jpg");   // birinchi marta oltin naqshdan chiqadi
  keyingisiniKut();
}

/* ---------- 2) Katalog ---------- */
const kartaHtml = (m) => `
  <a class="karta" href="#${m.id}" data-id="${m.id}">
    <span class="zumrad karta-rasm">
      <img src="${m.rasm}" alt="${matn(tarjima(m.nomi))}, ${matn(tarjima(m.rang.nomi))}" loading="lazy">
    </span>
    <span class="karta-matn">
      <strong>${matn(tarjima(m.nomi))}</strong>
      <small>${matn(tarjima(m.rang.nomi))}, ${m.narx ? narxYoz(m.narx) : narxYoz(0).toLowerCase()}</small>
    </span>
  </a>`;

function katalogniChiz() {
  topish("#katalog").innerHTML = Object.entries(TOPLAMLAR).map(([kalit, toplam]) => {
    const ichidagi = MAHSULOTLAR.filter((m) => m.toplam === kalit);
    if (!ichidagi.length) return "";
    return `
      <section class="toplam" aria-labelledby="t-${kalit}">
        <header class="toplam-bosh">
          <h2 id="t-${kalit}">${matn(tarjima(toplam.nomi))}</h2>
          <p>${matn(tarjima(toplam.tavsif))}</p>
        </header>
        <div class="qator">${ichidagi.map(kartaHtml).join("")}</div>
      </section>`;
  }).join("");

  document.querySelectorAll(".karta-rasm").forEach(qiyshaytir);
}

// Kartochka bosilganda mahsulot oynasi ochiladi (5-oyna.js)
topish("#katalog").addEventListener("click", (e) => {
  const karta = e.target.closest(".karta");
  if (!karta || e.ctrlKey || e.metaKey) return;
  e.preventDefault();
  mahsulotniOch(karta.dataset.id, topish(".karta-rasm", karta));
});

// Til almashganda katalog yangi tilda qayta chiziladi (surilgan joyi saqlanadi)
document.addEventListener("til-almashdi", () => {
  const surilgan = [...document.querySelectorAll(".qator")].map((q) => q.scrollLeft);
  katalogniChiz();
  document.querySelectorAll(".karta-rasm").forEach((r) => r.classList.add("ochilgan"));
  document.querySelectorAll(".qator").forEach((q, i) => { q.scrollLeft = surilgan[i]; });
});

// Element sichqonchaga qarab 3D egiladi (CSS dagi --ex, --ey ni o‘zgartiradi)
function qiyshaytir(element) {
  if (HARAKAT_KAM || SODDA) return;
  element.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    const r = element.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;    // 0..1
    const y = (e.clientY - r.top) / r.height;
    element.style.setProperty("--ey", (x - 0.5) * 20 + "deg");
    element.style.setProperty("--ex", (0.5 - y) * 16 + "deg");
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
