/* =====================================================================
   1-MAHSULOTLAR.JS  —  SIZ ENG KO‘P O‘ZGARTIRADIGAN FAYL
   ---------------------------------------------------------------------
   Yangi ko‘ylak qo‘shish:
     1) Rasmni "rasmlar" papkasiga tashlang.
     2) Pastdagi MAHSULOTLAR ro‘yxatidan bitta { ... } blokni nusxalang.
     3) Ichidagi yozuvlarni almashtiring. Tamom, sayt o‘zi chiqaradi.
   ===================================================================== */

/* --- Do‘kon haqida (logodan olingan) --- */
const DOKON = {
  nomi:      "Ikat by Malika Shakirova",
  telefon:   "+998 97 750 50 00",
  instagram: "ikat_by_Malika_Shakirova",
  valyuta:   "so‘m",

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
    nomi: "Parij",
    tavsif: "Uzun shleyfli, keng yengli kechki ko‘ylaklar.",
    detallar: [
      { nomi: "Yeng",   x: 73, y: 55, zoom: 2.6 },
      { nomi: "Bel",    x: 63, y: 47, zoom: 3.0 },
      { nomi: "Shleyf", x: 42, y: 85, zoom: 2.0 },
    ],
  },
  yulduz: {
    nomi: "Yulduzli kecha",
    tavsif: "Belbog‘li, kalta yengli midi ko‘ylaklar.",
    detallar: [
      { nomi: "Yoqa",    x: 53, y: 22, zoom: 2.8 },
      { nomi: "Belbog‘", x: 52, y: 35, zoom: 2.8 },
      { nomi: "Etak",    x: 52, y: 66, zoom: 2.0 },
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
   animatsiya — OCHILISH EFFEKTI, shulardan birini yozing:
                "iplar"  "olmos"  "parda"  "zina"  "yulduz"  "gavhar"       */
const MAHSULOTLAR = [
  {
    id: "parij-osmoni",
    toplam: "parij",
    nomi: "Parij osmoni",
    rasm: "rasmlar/parij-kok.jpg",
    tavsif: "To‘q ko‘k fonda oltinrang ikat naqshi. Keng yenglar va yerga yoyilgan uzun shleyf.",
    narx: 0,
    olchamlar: [],
    rang: { nomi: "Ko‘k", tus1: "#2f55a4", tus2: "#e3cf9f" },
    animatsiya: "iplar",
  },
  {
    id: "feruza-shamol",
    toplam: "parij",
    nomi: "Feruza shamol",
    rasm: "rasmlar/parij-feruza.jpg",
    tavsif: "Feruza rangda yorug‘ ikat naqshi. Tor bel, keng yeng va to‘lqinsimon shleyf.",
    narx: 0,
    olchamlar: [],
    rang: { nomi: "Feruza", tus1: "#0b98b4", tus2: "#a9ecd8" },
    animatsiya: "gavhar",
  },
  {
    id: "anor-guli",
    toplam: "parij",
    nomi: "Anor guli",
    rasm: "rasmlar/parij-anor.jpg",
    tavsif: "Anor rangida shaftoli tusli ikat naqshi. Keng yengli, uzun shleyfli kechki ko‘ylak.",
    narx: 0,
    olchamlar: [],
    rang: { nomi: "Anor", tus1: "#962a4d", tus2: "#f0bd93" },
    animatsiya: "parda",
  },
  {
    id: "tungi-osmon",
    toplam: "yulduz",
    nomi: "Tungi osmon",
    rasm: "rasmlar/yulduz-kok.jpg",
    tavsif: "Ko‘k fonda qum rangli ikat naqshi. V shaklidagi yoqa va belda bog‘lanadigan belbog‘.",
    narx: 0,
    olchamlar: [],
    rang: { nomi: "Tungi ko‘k", tus1: "#31518c", tus2: "#dcc6a4" },
    animatsiya: "yulduz",
  },
  {
    id: "yashil-bog",
    toplam: "yulduz",
    nomi: "Yashil bog‘",
    rasm: "rasmlar/yulduz-yashil.jpg",
    tavsif: "Yashil fonda och oltin ikat naqshi. Qaytarma yeng va keng etak.",
    narx: 0,
    olchamlar: [],
    rang: { nomi: "Yashil", tus1: "#4f7d5c", tus2: "#d8c690" },
    animatsiya: "olmos",
  },
  {
    id: "moviy-tolqin",
    toplam: "yulduz",
    nomi: "Moviy to‘lqin",
    rasm: "rasmlar/yulduz-moviy.jpg",
    tavsif: "Moviy fonda yalpiz rangli ikat naqshi. V shaklidagi yoqa va bantli belbog‘.",
    narx: 0,
    olchamlar: [],
    rang: { nomi: "Moviy", tus1: "#0f7fa8", tus2: "#8fdcc4" },
    animatsiya: "zina",
  },
];
