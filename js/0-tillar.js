/* =====================================================================
   0-TILLAR.JS  —  O‘ZBEK, RUS, INGLIZ TILLARI
   ---------------------------------------------------------------------
   Bu yerda tugma va sarlavhalar tarjimasi.
   Ko‘ylak nomlari va tavsiflari tarjimasi: 1-mahsulotlar.js da.

   Yangi til qo‘shish: TILLAR ga yangi blok qo‘shing (masalan kk: {...}).
   To‘g‘ridan-to‘g‘ri havola: sayt manzili oxiriga ?til=ru qo‘shing.
   ===================================================================== */

const TILLAR = {
  uz: {
    tilNomi: "O‘zbekcha",
    tilniTanlash: "Tilni tanlash",
    saytHaqida: "Ikat by Malika Shakirova. Ikat ko‘ylaklar katalogi.",
    boshMatn: "Rangni tanlang va ko‘ylakni yaqindan ko‘ring.",
    katalogniKorish: "Katalogni ko‘rish",
    koylakRangi: "Ko‘ylak rangi",
    ochish: "Ko‘ylakni ochish",
    buyurtmaUchun: "Buyurtma va narxlar uchun",
    oldingi: "Oldingi ko‘ylak",
    keyingi: "Keyingi ko‘ylak",
    yopish: "Yopish",
    rang: "Rang",
    yaqindan: "Yaqindan ko‘rish",
    toliq: "To‘liq",
    olchamlar: "O‘lchamlar",
    instagramda: "Instagramda yozish",
    narxSorov: "Narxi so‘rov bo‘yicha",
    valyuta: "so‘m",
  },
  ru: {
    tilNomi: "Русский",
    tilniTanlash: "Выбор языка",
    saytHaqida: "Ikat by Malika Shakirova. Каталог платьев из иката.",
    boshMatn: "Выберите цвет и рассмотрите платье поближе.",
    katalogniKorish: "Смотреть каталог",
    koylakRangi: "Цвет платья",
    ochish: "Открыть платье",
    buyurtmaUchun: "Заказы и цены",
    oldingi: "Предыдущее платье",
    keyingi: "Следующее платье",
    yopish: "Закрыть",
    rang: "Цвет",
    yaqindan: "Рассмотреть ближе",
    toliq: "Целиком",
    olchamlar: "Размеры",
    instagramda: "Написать в Instagram",
    narxSorov: "Цена по запросу",
    valyuta: "сум",
  },
  en: {
    tilNomi: "English",
    tilniTanlash: "Choose language",
    saytHaqida: "Ikat by Malika Shakirova. Ikat dress catalogue.",
    boshMatn: "Choose a colour and see the dress up close.",
    katalogniKorish: "View the catalogue",
    koylakRangi: "Dress colour",
    ochish: "Open dress",
    buyurtmaUchun: "Orders and prices",
    oldingi: "Previous dress",
    keyingi: "Next dress",
    yopish: "Close",
    rang: "Colour",
    yaqindan: "See up close",
    toliq: "Full view",
    olchamlar: "Sizes",
    instagramda: "Message on Instagram",
    narxSorov: "Price on request",
    valyuta: "UZS",
  },
};

/* ---------- Qaysi til bilan boshlanadi ----------
   1) havoladagi ?til=ru   2) oldin tanlagani   3) telefon tili   4) o‘zbekcha */
function boshlangichTil() {
  const havoladan = new URLSearchParams(location.search).get("til");
  let saqlangan = null;
  try { saqlangan = localStorage.getItem("til"); } catch { /* brauzer xotirasi yopiq */ }
  const qurilma = (navigator.languages || []).map((x) => x.slice(0, 2).toLowerCase());
  return [havoladan, saqlangan, ...qurilma, "uz"].find((x) => Object.keys(TILLAR).includes(x));
}

let til = boshlangichTil();

// Tugma va sarlavhalar uchun:  yozuv("yopish")  ->  "Yopish" yoki "Закрыть"
const yozuv = (kalit) => TILLAR[til][kalit] ?? TILLAR.uz[kalit];

// Mahsulot matnlari uchun:  tarjima({ uz: "...", ru: "...", en: "..." })
// Oddiy matn yozilgan bo‘lsa ("Parij"), hamma tilda o‘sha chiqadi
const tarjima = (x) => (typeof x === "string" ? x : x[til] || x.uz);

/* ---------- Sahifadagi yozuvlarni tarjima qilish ----------
   HTML da  data-til="yopish"       — ichidagi yozuv almashadi
            data-til-aria="yopish"  — ko‘zi ojizlar uchun nom almashadi      */
function yozuvlarniTarjimaQil() {
  document.documentElement.lang = til;
  document.querySelector('meta[name="description"]').content = yozuv("saytHaqida");
  document.querySelectorAll("[data-til]").forEach((e) => { e.textContent = yozuv(e.dataset.til); });
  document.querySelectorAll("[data-til-aria]").forEach((e) => e.setAttribute("aria-label", yozuv(e.dataset.tilAria)));
  document.querySelectorAll("[data-til-tugma]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.tilTugma === til));
}

function tilniQoy(yangiTil) {
  if (yangiTil === til) return;
  til = yangiTil;
  try { localStorage.setItem("til", til); } catch { /* saqlanmasa ham almashadi */ }
  // Havolada ?til= bo‘lsa, uni ham yangilaymiz
  const manzil = new URL(location.href);
  if (manzil.searchParams.has("til")) {
    manzil.searchParams.set("til", til);
    history.replaceState(null, "", manzil.search + manzil.hash);
  }
  yozuvlarniTarjimaQil();
  document.dispatchEvent(new Event("til-almashdi"));   // katalog va oyna shuni eshitadi
}

// UZ RU EN tugmalarini chizadi
function tilTugmalari() {
  document.querySelectorAll("[data-tillar]").forEach((joy) => {
    joy.innerHTML = Object.keys(TILLAR).map((k) =>
      `<button type="button" data-til-tugma="${k}" lang="${k}" aria-label="${TILLAR[k].tilNomi}">${k.toUpperCase()}</button>`).join("");
    joy.addEventListener("click", (e) => {
      const b = e.target.closest("[data-til-tugma]");
      if (b) tilniQoy(b.dataset.tilTugma);
    });
  });
  yozuvlarniTarjimaQil();
}
