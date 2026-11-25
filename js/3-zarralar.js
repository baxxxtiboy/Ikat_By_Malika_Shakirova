/* =====================================================================
   3-ZARRALAR.JS  —  OLTIN CHANG VA PORTLASH
   ---------------------------------------------------------------------
   const z = zarralarYarat(canvas)
   z.boshla()          — mayin oltin chang suza boshlaydi
   z.portlash(x, y)    — shu nuqtadan oltin va zumrad uchqunlar sochiladi
   z.toxta()           — hammasi to‘xtaydi
   ===================================================================== */

const ZARRA_RANGLARI = ["#f3d27a", "#c99a3b", "#fff1c4", "#1fb27c", "#0b7a55"];

function zarralarYarat(canvas) {
  const q = canvas.getContext("2d");
  let zarralar = [];
  let ishlayapti = false;

  function olchamla() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }

  // Bitta chang donasi: sekin tepaga suzadi
  function chang() {
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.2,
      vy: -0.1 - Math.random() * 0.35,
      r: 0.5 + Math.random() * 1.5,
      rang: ZARRA_RANGLARI[Math.floor(Math.random() * 3)],
      faza: Math.random() * 6,
      umr: Infinity,
    };
  }

  // Portlash: "soni" ta uchqun har tomonga uchadi
  function portlash(x, y, soni = 130) {
    if (HARAKAT_KAM) return;
    for (let i = 0; i < soni; i++) {
      const burchak = Math.random() * Math.PI * 2;
      const tezlik = 2 + Math.random() * 13;
      zarralar.push({
        x, y,
        vx: Math.cos(burchak) * tezlik,
        vy: Math.sin(burchak) * tezlik,
        r: 1 + Math.random() * 3.2,
        rang: ZARRA_RANGLARI[Math.floor(Math.random() * ZARRA_RANGLARI.length)],
        aylanish: Math.random() * 6,
        umr: 1,
      });
    }
  }

  // Har kadrda hamma zarrani bir qadam suradi va chizadi
  function kadr(vaqt) {
    if (!ishlayapti) return;
    q.clearRect(0, 0, canvas.width, canvas.height);
    zarralar.forEach((z) => {
      z.x += z.vx;
      z.y += z.vy;
      q.fillStyle = z.rang;
      q.beginPath();
      if (z.umr === Infinity) {                    // chang
        if (z.y < -5) { z.y = canvas.height + 5; z.x = Math.random() * canvas.width; }
        q.globalAlpha = 0.25 + 0.45 * Math.abs(Math.sin(vaqt / 900 + z.faza));
        q.arc(z.x, z.y, z.r, 0, 7);
      } else {                                     // uchqun (aylanuvchi romb)
        z.vx *= 0.955;
        z.vy = z.vy * 0.955 + 0.06;
        z.umr -= 0.012;
        z.aylanish += 0.14;
        q.globalAlpha = Math.max(0, z.umr);
        rombChiz(q, z.x, z.y, z.r * Math.abs(Math.cos(z.aylanish)) + 0.4, z.r * 1.8);
      }
      q.fill();
    });
    zarralar = zarralar.filter((z) => z.umr > 0);
    requestAnimationFrame(kadr);
  }

  return {
    portlash,
    olchamla,
    boshla() {
      olchamla();
      zarralar = HARAKAT_KAM ? [] : Array.from({ length: 60 }, chang);
      if (!ishlayapti) { ishlayapti = true; requestAnimationFrame(kadr); }
    },
    toxta() { ishlayapti = false; zarralar = []; },
  };
}
