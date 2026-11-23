'use strict';
/* ===== Ishga tushirish, navigatsiya ===== */
const CTABS = [['shop', 'Katalog', 'store'], ['cart', 'Savat', 'shopping-bag'], ['debt', 'Nasiya', 'wallet'], ['profile', 'Profil', 'user']];
let bgTimer = null;

G.logout = (silent) => {
  G.token = null; G.me = null; G.cart = {}; G.products = []; G.pmap = {}; G.addr = undefined; G.comment = ''; G.q = ''; G.cat = 'all';
  LS.del('ikat_token');
  clearInterval(bgTimer);
  sheets.length = 0; $$('.sheet-back').forEach((s) => s.remove()); document.body.classList.remove('noscroll');
  if (!silent) toast('Chiqdingiz', 'info');
  renderAuth();
};

/** Kirgandan keyin kerakli ekranni chizadi */
G.enter = async () => {
  if (G.me.role === 'admin') { G.atab = 'today'; return renderAdmin(); }
  await G.loadProducts();
  G.loadCart();
  G.tab = 'shop';
  renderClient();
};

const tabbarHtml = (tabs) => `<nav class="tabbar" aria-label="Asosiy menyu"><div class="tabbar-in">${tabs.map(([id, label, icon]) => `<button class="tab" data-t="${id}">${ic(icon)}<span>${label}</span>${id === 'cart' ? '<i class="bdg" id="cart-bdg" hidden></i>' : ''}${id === 'today' ? '<i class="bdg" id="tab-today-bdg" hidden></i>' : ''}</button>`).join('')}</div></nav>`;

function renderShell(tabs, cls, tag, go) {
  const app = $('#app');
  app.className = cls;
  app.innerHTML = `${brandHtml(tag)}<main id="view"></main>${tabbarHtml(tabs)}`;
  $('.tabbar', app).onclick = (e) => { const b = e.target.closest('.tab'); if (b) go(b.dataset.t); };
  $('[data-home]', app).onclick = () => go(tabs[0][0]);
}
function markTab(t) {
  $$('.tabbar .tab').forEach((b) => { const on = b.dataset.t === t; b.classList.toggle('on', on); if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  window.scrollTo({ top: 0 });
  const v = $('#view'); v.onclick = null;
}

/* ---------- Mijoz ---------- */
function renderClient() {
  // nasiya o'chirilgan bo'lsa ham eski nasiyasi bor mijoz uni ko'rishi kerak — shuning uchun bo'lim qoladi
  renderShell(CTABS, 'client', '', (t) => G.go(t));
  updateBadge();
  G.go(G.tab);
}
G.go = (t) => {
  if (G.me && G.me.role === 'admin') return adminGo(t);
  G.tab = t;
  markTab(t);
  ({ shop: viewShop, cart: viewCart, debt: viewDebt, profile: viewProfile })[t]();
};

/* ---------- Admin ---------- */
function renderAdmin() {
  renderShell(AT, 'admin', 'Admin', adminGo);
  adminGo(G.atab);
  clearInterval(bgTimer);
  bgTimer = setInterval(() => { if (G.atab === 'today' && !document.hidden && !sheets.length) aToday('bg'); }, 25000);
}
function adminGo(t) {
  G.atab = t;
  markTab(t);
  todaySig = '';
  G.adminViews[t]();
}

let rs;
window.addEventListener('resize', () => {
  clearTimeout(rs);
  rs = setTimeout(() => { Ikat.paint($('#hero-cv'), { cell: 150 }); Ikat.paint($('#auth-cv'), { cell: 170 }); }, 200);
});

/* ---------- Boshlash ---------- */
async function boot() {
  const t0 = Date.now();
  if (G.tg) { try { G.tg.ready(); G.tg.expand(); G.tg.setHeaderColor('#050807'); G.tg.setBackgroundColor('#050807'); if (G.tg.disableVerticalSwipes) G.tg.disableVerticalSwipes(); } catch { /* */ } }
  try {
    G.cfg = await api('/config');
    G.token = LS.get('ikat_token');
    if (G.token) {
      try { G.me = (await api('/me')).user; await G.enter(); }
      catch (e) {
        if (e.status !== 401 && e.status !== 403) throw e;
        G.token = null; G.me = null; LS.del('ikat_token'); renderAuth();
      }
    } else renderAuth();
  } catch (e) {
    $('#app').innerHTML = `<div class="page">${emptyHtml('circle-alert', "Server bilan aloqa yo'q", esc(e.message), '<button class="btn" onclick="location.reload()">Qayta urinish</button>')}</div>`;
  }
  await wait(Math.max(0, 1900 - (Date.now() - t0)));
  const sp = $('#splash');
  sp.classList.add('out');
  setTimeout(() => sp.remove(), 800);
}
boot();
