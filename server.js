/* =====================================================================
   SERVER.JS  —  saytni Render’da ko‘rsatuvchi kichik server
   Faqat pastdagi RUXSAT dagi papkalarni tashqariga beradi.
   Kompyuterda kerak emas: u yerda index.html ni ochish kifoya.
   ===================================================================== */
const http = require("http");
const fs = require("fs");
const path = require("path");

const RUXSAT = ["css", "js", "rasmlar", "shriftlar"];

// Fayl turlari. Boshqa tur (masalan .mp4) qo‘shsangiz, shu yerga yozing
const TURLAR = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".woff2": "font/woff2",
};

const server = http.createServer((sorov, javob) => {
  const xato = (kod, yozuv) => {
    javob.writeHead(kod, { "Content-Type": "text/plain; charset=utf-8" });
    javob.end(yozuv);
  };
  if (sorov.method !== "GET" && sorov.method !== "HEAD") return xato(405, "Ruxsat yo‘q");

  let manzil;
  try { manzil = decodeURIComponent(sorov.url.split("?")[0]); }
  catch { return xato(400, "Manzil noto‘g‘ri"); }

  if (manzil.includes("  // Eski do‘konning /admin")) return xato(400, "Manzil noto‘g‘ri");

  // Eski do‘konning /admin kabi sahifalari bosh sahifaga o‘tadi
  if (manzil !== "/" && !path.extname(manzil)) {
    javob.writeHead(302, { Location: "/" });
    return javob.end();
  }

  const fayl = path.join(__dirname, manzil === "/" ? "index.html" : manzil);
  const nisbiy = path.relative(__dirname, fayl);
  const tur = TURLAR[path.extname(fayl).toLowerCase()];
  const mumkin = nisbiy === "index.html" || RUXSAT.includes(nisbiy.split(path.sep)[0]);
  if (!mumkin || !tur) return xato(404, "Topilmadi");

  fs.stat(fayl, (e, malumot) => {
    if (e || !malumot.isFile()) return xato(404, "Topilmadi");
    const belgi = `"${malumot.size}-${Math.round(malumot.mtimeMs)}"`;
    const sarlavha = {
      "Content-Type": tur,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-cache",   // o‘zgartirsangiz, mijoz darhol yangisini ko‘radi
      ETag: belgi,
    };
    if (sorov.headers["if-none-match"] === belgi) {
      javob.writeHead(304, sarlavha);
      return javob.end();
    }
    javob.writeHead(200, { ...sarlavha, "Content-Length": malumot.size });
    if (sorov.method === "HEAD") return javob.end();
    const oqim = fs.createReadStream(fayl);
    oqim.on("error", () => javob.destroy());
    oqim.pipe(javob);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => console.log("Sayt ishladi: http://localhost:" + PORT));
