/* =====================================================================
   1-MAHSULOTLAR.JS  —  SIZ ENG KO‘P O‘ZGARTIRADIGAN FAYL
   ---------------------------------------------------------------------
   Yangi ko‘ylak qo‘shish:
     1) Rasmni "rasmlar" papkasiga tashlang.
     2) Pastdagi MAHSULOTLAR ro‘yxatidan bitta { ... } blokni nusxalang.
     3) Ichidagi yozuvlarni almashtiring. Tamom, sayt o‘zi chiqaradi.

   Tarjima:  nomi: { uz: "Yashil bog‘", ru: "Зелёный сад", en: "Green Garden" }
   Bitta til yetarli bo‘lsa, oddiy yozsa ham bo‘ladi:  nomi: "Yashil bog‘"
   ===================================================================== */

/* --- Do‘kon haqida (logodan olingan) --- */
const DOKON = {
  nomi:      "Ikat by Malika Shakirova",
  telefon:   "+998 97 750 50 00",
  instagram: "ikat_by_Malika_Shakirova",

  // ANIMATSIYA KUCHI:
  // "sodda"  — sokin, nafis (hozirgi)
  // "kuchli" — oltin eshik, portlash, parchalanish va boshqalar
  animatsiya: "sodda",

  // true  — animatsiyalar hammada ishlaydi
  // false — qurilmasida "animatsiya kam bo‘lsin" deb sozlaganlarda o‘chadi
  animatsiyaDoim: true,
};

/* --- To‘plamlar (katalogdagi bo‘limlar) ---
   detallar — mahsulot ochilganda "yaqindan ko‘rish" tugmalari
   x, y     — rasmning qaysi joyi (foizda: 0 = chap/tepa, 100 = o‘ng/past)
   zoom     — necha barobar kattalashsin                                  */
const TOPLAMLAR = {
  parij: {
    nomi: { uz: "Parij", ru: "Париж", en: "Paris" },
    tavsif: {
      uz: "Uzun shleyfli, keng yengli kechki ko‘ylaklar.",
      ru: "Вечерние платья с длинным шлейфом и широкими рукавами.",
      en: "Evening gowns with long trains and wide sleeves.",
    },
    detallar: [
      { nomi: { uz: "Yeng",   ru: "Рукав", en: "Sleeve" }, x: 73, y: 55, zoom: 2.6 },
      { nomi: { uz: "Bel",    ru: "Талия", en: "Waist" },  x: 63, y: 47, zoom: 3.0 },
      { nomi: { uz: "Shleyf", ru: "Шлейф", en: "Train" },  x: 42, y: 85, zoom: 2.0 },
    ],
  },
  yulduz: {
    nomi: { uz: "Yulduzli kecha", ru: "Звёздная ночь", en: "Starry Night" },
    tavsif: {
      uz: "Belbog‘li, kalta yengli midi ko‘ylaklar.",
      ru: "Платья миди с поясом и короткими рукавами.",
      en: "Belted midi dresses with short sleeves.",
    },
    detallar: [
      { nomi: { uz: "Yoqa",    ru: "Вырез", en: "Neckline" }, x: 53, y: 22, zoom: 2.8 },
      { nomi: { uz: "Belbog‘", ru: "Пояс",  en: "Belt" },     x: 52, y: 35, zoom: 2.8 },
      { nomi: { uz: "Etak",    ru: "Юбка",  en: "Skirt" },    x: 52, y: 66, zoom: 2.0 },
    ],
  },
};

/* --- Mahsulotlar ---
   id         — takrorlanmas nom (faqat lotin harf va chiziqcha)
   toplam     — yuqoridagi TOPLAMLAR dan biri
   rasm       — rasm manzili
   narx       — raqam yozing (masalan 1500000). 0 bo‘lsa "Narxi so‘rov bo‘yicha"
   olchamlar  — masalan ["S", "M", "L"]. Bo‘sh bo‘lsa ko‘rinmaydi
   rang       — rang nomi va uning ikki tusi (tugmacha uchun)
   animatsiya — faqat "kuchli" rejimda ishlaydigan ochilish effekti:
                "iplar"  "olmos"  "parda"  "zina"  "yulduz"  "gavhar"       */
const MAHSULOTLAR = [
  {
    id: "parij-osmoni",
    toplam: "parij",
    nomi: { uz: "Parij osmoni", ru: "Небо Парижа", en: "Paris Sky" },
    rasm: "rasmlar/parij-kok.jpg",
    tavsif: {
      uz: "To‘q ko‘k fonda oltinrang ikat naqshi. Keng yenglar va yerga yoyilgan uzun shleyf.",
      ru: "Золотистый узор икат на тёмно-синем фоне. Широкие рукава и длинный шлейф до пола.",
      en: "Golden ikat pattern on deep blue. Wide sleeves and a long floor-sweeping train.",
    },
    narx: 0,
    olchamlar: [],
    rang: { nomi: { uz: "Ko‘k", ru: "Синий", en: "Blue" }, tus1: "#2f55a4", tus2: "#e3cf9f" },
    animatsiya: "iplar",
  },
  {
    id: "feruza-shamol",
    toplam: "parij",
    nomi: { uz: "Feruza shamol", ru: "Бирюзовый ветер", en: "Turquoise Breeze" },
    rasm: "rasmlar/parij-feruza.jpg",
    tavsif: {
      uz: "Feruza rangda yorug‘ ikat naqshi. Tor bel, keng yeng va to‘lqinsimon shleyf.",
      ru: "Светлый узор икат на бирюзовом. Узкая талия, широкие рукава и волнистый шлейф.",
      en: "Light ikat pattern on turquoise. Narrow waist, wide sleeves and a flowing train.",
    },
    narx: 0,
    olchamlar: [],
    rang: { nomi: { uz: "Feruza", ru: "Бирюзовый", en: "Turquoise" }, tus1: "#0b98b4", tus2: "#a9ecd8" },
    animatsiya: "gavhar",
  },
  {
    id: "anor-guli",
    toplam: "parij",
    nomi: { uz: "Anor guli", ru: "Цветок граната", en: "Pomegranate Blossom" },
    rasm: "rasmlar/parij-anor.jpg",
    tavsif: {
      uz: "Anor rangida shaftoli tusli ikat naqshi. Keng yengli, uzun shleyfli kechki ko‘ylak.",
      ru: "Персиковый узор икат на гранатовом фоне. Вечернее платье с широкими рукавами и длинным шлейфом.",
      en: "Peach ikat pattern on pomegranate red. Evening gown with wide sleeves and a long train.",
    },
    narx: 0,
    olchamlar: [],
    rang: { nomi: { uz: "Anor", ru: "Гранатовый", en: "Pomegranate" }, tus1: "#962a4d", tus2: "#f0bd93" },
    animatsiya: "parda",
  },
  {
    id: "tungi-osmon",
    toplam: "yulduz",
    nomi: { uz: "Tungi osmon", ru: "Ночное небо", en: "Night Sky" },
    rasm: "rasmlar/yulduz-kok.jpg",
    tavsif: {
      uz: "Ko‘k fonda qum rangli ikat naqshi. V shaklidagi yoqa va belda bog‘lanadigan belbog‘.",
      ru: "Песочный узор икат на синем фоне. V-образный вырез и завязывающийся пояс.",
      en: "Sand-coloured ikat pattern on blue. V-neckline and a tie belt at the waist.",
    },
    narx: 0,
    olchamlar: [],
    rang: { nomi: { uz: "Tungi ko‘k", ru: "Тёмно-синий", en: "Midnight blue" }, tus1: "#31518c", tus2: "#dcc6a4" },
    animatsiya: "yulduz",
  },
  {
    id: "yashil-bog",
    toplam: "yulduz",
    nomi: { uz: "Yashil bog‘", ru: "Зелёный сад", en: "Green Garden" },
    rasm: "rasmlar/yulduz-yashil.jpg",
    tavsif: {
      uz: "Yashil fonda och oltin ikat naqshi. Qaytarma yeng va keng etak.",
      ru: "Светло-золотой узор икат на зелёном фоне. Рукава с отворотом и широкая юбка.",
      en: "Pale gold ikat pattern on green. Cuffed sleeves and a full skirt.",
    },
    narx: 0,
    olchamlar: [],
    rang: { nomi: { uz: "Yashil", ru: "Зелёный", en: "Green" }, tus1: "#4f7d5c", tus2: "#d8c690" },
    animatsiya: "olmos",
  },
  {
    id: "moviy-tolqin",
    toplam: "yulduz",
    nomi: { uz: "Moviy to‘lqin", ru: "Лазурная волна", en: "Azure Wave" },
    rasm: "rasmlar/yulduz-moviy.jpg",
    tavsif: {
      uz: "Moviy fonda yalpiz rangli ikat naqshi. V shaklidagi yoqa va bantli belbog‘.",
      ru: "Мятный узор икат на лазурном фоне. V-образный вырез и пояс с бантом.",
      en: "Mint ikat pattern on azure. V-neckline and a belt tied in a bow.",
    },
    narx: 0,
    olchamlar: [],
    rang: { nomi: { uz: "Moviy", ru: "Лазурный", en: "Azure" }, tus1: "#0f7fa8", tus2: "#8fdcc4" },
    animatsiya: "zina",
  },
];
