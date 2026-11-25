# Ikat by Malika Shakirova: katalog sayti

Ochish: `index.html` ustiga ikki marta bosing. Hech narsa o‘rnatish kerak emas.

## Qaysi fayl nima qiladi

| Fayl | Vazifasi |
|---|---|
| `js/1-mahsulotlar.js` | Ko‘ylaklar, narxlar, telefon, Instagram. **Eng ko‘p shu o‘zgaradi** |
| `js/2-animatsiyalar.js` | 6 ta ochilish effekti |
| `js/3-zarralar.js` | Oltin chang va uchqunlar |
| `js/4-katalog.js` | Bosh sahifa va kartochkalar |
| `js/5-oyna.js` | Mahsulot ochilishi (tezliklar: `VAQT`) |
| `css/1-asosiy.css` | Ranglar (`:root`), bosh sahifa |
| `css/2-oyna.css` | Ochilgan mahsulot ko‘rinishi |

## Tez-tez kerak bo‘ladigan ishlar

- **Narx yozish:** `1-mahsulotlar.js` da `narx: 0` o‘rniga `narx: 1500000`
- **O‘lcham yozish:** `olchamlar: ["S", "M", "L"]`
- **Effektni almashtirish:** `animatsiya: "parda"`
  (variantlar: `iplar`, `olmos`, `parda`, `zina`, `yulduz`, `gavhar`)
- **Yangi ko‘ylak:** rasmni `rasmlar` ga tashlang, bitta `{ ... }` blokni nusxalab o‘zgartiring
- **Yangi to‘plam:** `TOPLAMLAR` ga yangi bo‘lim qo‘shing
- **Rang o‘zgartirish:** `1-asosiy.css` boshidagi `:root`
- **Tezlik:** `5-oyna.js` boshidagi `VAQT`

## Internetga chiqarish

Papkada: `git add -A`, `git commit -m "nima o'zgardi"`, `git push`. Render saytni o‘zi yangilaydi.
`server.js` va `package.json` faqat Render uchun. Eski do‘kon kodi `eski-dokon` branchida saqlangan.
