'use strict';
/* ===== Ishga tushirish, navigatsiya ===== */
const CTABS = [['shop', _t('Katalog'), 'store'], ['cart', _t('Savat'), 'shopping-bag'], ['orders', _t('Buyurtmalar'), 'package'], ['profile', _t('Profil'), 'user']];
let bgTimer = null;

G.logout = (silent) => {
  G.token = null; G.me = null; G.cart = {}; G.products = []; G.pmap = {}; G.addr = undefined; G.comment = ''; G.oway = ''; G.q = ''; G.cat = 'all';
  LS.del('ikat_token');
  clearInterval(bgTimer);
  sheets.length = 0; $$('.sheet-back').forEach((s) => s.remove()); document.body.classList.remove('noscroll');
  if (!silent) toast(_t('Chiqdingiz'), 'info');
  renderAuth();
};

/** Kirgandan keyin kerakli ekranni chizadi */
G.enter = async () => {
  if (G.me.role === 'admin') { G.atab = G.adminViews[G.keep.tab] ? G.keep.tab : 'today'; G.keep = {}; return renderAdmin(); }
  G.loadCart();               // avval saqlangan savat, keyin mahsulotlar: aks holda loadProducts bo'sh savatni yozib qo'yadi
  await G.loadProducts();
  G.tab = CTABS.some((x) => x[0] === G.keep.tab) ? G.keep.tab : 'shop';
  if (G.keep.addr !== undefined) G.addr = G.keep.addr;
  if (G.keep.comment) G.comment = G.keep.comment;
  if (G.keep.way) G.way = G.keep.way;
  G.keep = {};
  renderClient();
};

const tabbarHtml = (tabs) => `<nav class="tabbar" aria-label="${_t('Asosiy menyu')}"><div class="tabbar-in">${tabs.map(([id, label, icon]) => `<button class="tab" data-t="${id}">${ic(icon)}<span>${label}</span>${id === 'cart' ? '<i class="bdg" id="cart-bdg" hidden></i>' : ''}${id === 'today' ? '<i class="bdg" id="tab-today-bdg" hidden></i>' : ''}</button>`).join('')}</div></nav>`;

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
  renderShell(CTABS, 'client', '', (t) => G.go(t));
  updateBadge();
  G.go(G.tab);
}
G.go = (t) => {
  if (G.me && G.me.role === 'admin') return adminGo(t);
  G.tab = t;
  markTab(t);
  ({ shop: viewShop, cart: viewCart, orders: viewOrders, profile: viewProfile })[t]();
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

/* ---------- Boshlash ---------- */
async function boot() {
  const t0 = Date.now() - (G.keep.lang ? 1900 : 0);      // til almashganda kirish animatsiyasi kutilmaydi
  if (G.tg) { try { G.tg.ready(); G.tg.expand(); G.tg.setHeaderColor('#060605'); G.tg.setBackgroundColor('#060605'); if (G.tg.disableVerticalSwipes) G.tg.disableVerticalSwipes(); } catch { /* */ } }
  try {
    G.cfg = await api('/config');
    G.token = LS.get('ikat_token');
    if (G.token) {
      try { G.me = (await api('/me')).user; await G.enter(); }
      catch (e) {
        if (e.status !== 401 && e.status !== 403) throw e;
        G.token = null; G.me = null; LS.del('ikat_token'); renderAuth();
      }
    } else renderAuth(G.keep.mode);
  } catch (e) {
    $('#app').innerHTML = `<div class="page">${emptyHtml('circle-alert', _t("Server bilan aloqa yo'q"), esc(e.message), `<button class="btn" onclick="location.reload()">${_t('Qayta urinish')}</button>`)}</div>`;
  }
  await wait(Math.max(0, 1900 - (Date.now() - t0)));
  const sp = $('#splash');
  sp.classList.add('out');
  setTimeout(() => sp.remove(), 800);
}
boot();
