'use strict';
/* ===== Kirish / ro'yxat, katalog, savat, to'lov ===== */

/* ---------- Kirish va akkaunt yaratish ---------- */
function renderAuth(mode = 'login') {
  // /admin manzilida faqat admin uchun kirish oynasi (ro'yxatdan o'tishsiz)
  const c = G.cfg, app = $('#app'), adm = /^[/]admin[/]?$/.test(location.pathname);
  if (adm) mode = 'login';
  app.className = 'bare';
  app.innerHTML = `<div class="auth"><div class="auth-art">${langHtml()}<div class="pat"></div><h1 class="seal"><img src="/img/logo.webp" width="640" height="784" alt="Ikat by Malika Shakirova"></h1></div>
    <div class="auth-side"><div class="auth-card">
      ${adm ? `<h2 class="auth-adm">${_t('Admin panelga kirish')}</h2>` : `<div class="seg"><button data-m="login" class="${mode === 'login' ? 'on' : ''}">${_t('Kirish')}</button><button data-m="reg" class="${mode === 'reg' ? 'on' : ''}">${_t('Akkaunt yaratish')}</button></div>`}
      ${mode === 'login' ? `<form id="f-login" novalidate>
        <label class="field"><span>${adm ? _t('Admin logini') : _t('Akkaunt nomi')}</span><div class="inp">${ic('user')}<input name="username" autocomplete="username" autocapitalize="none" spellcheck="false"></div></label>
        <label class="field"><span>${_t('Parol')}</span><div class="inp">${ic('lock')}<input name="password" type="password" autocomplete="current-password"><button type="button" class="eye" aria-label="${_t("Parolni ko'rsatish")}">${ic('eye')}</button></div></label>
        <button class="btn block" type="submit">${ic('log-in')} ${_t('Kirish')}</button></form>`
      : `<form id="f-reg" novalidate>
        <label class="field"><span>${_t('Akkaunt nomi')}</span><div class="inp">${ic('user')}<input name="username" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="20"><span class="st" id="un-st"></span></div><div class="hint" id="un-hint">${_t('Lotin harflari, raqam, nuqta yoki _ (3–20 ta belgi)')}</div></label>
        <label class="field"><span>${_t('Parol')}</span><div class="inp">${ic('lock')}<input name="password" type="password" autocomplete="new-password" placeholder="${_t('kamida 6 ta belgi')}"><button type="button" class="eye" aria-label="${_t("Parolni ko'rsatish")}">${ic('eye')}</button></div></label>
        <label class="field"><span>${_t('Ism')}</span><div class="inp">${ic('user-round')}<input name="name" autocomplete="name" maxlength="60"></div></label>
        <label class="field"><span>${_t('Telefon raqam')}</span><div class="inp ph"><span class="pre">+998</span><input name="phone" type="tel" inputmode="numeric" placeholder="90 123 45 67"></div></label>
        <label class="field"><span>${_t('Viloyat')}</span><div class="inp">${ic('map-pin')}<select name="region"><option value="">${_t('Tanlang…')}</option>${c.regions.map((r) => `<option value="${esc(r)}">${esc(_t(r))}</option>`).join('')}</select></div></label>
        <label class="field"><span>${_t('Manzil (ixtiyoriy)')}</span><div class="inp">${ic('store')}<input name="address" placeholder="${_t("Tuman, ko'cha, uy")}" maxlength="200"></div></label>
        <button class="btn block" type="submit">${ic('user-plus')} ${_t('Akkaunt yaratish')}</button></form>`}
      ${adm ? `<div class="auth-foot"><a href="/">${_t("Do'konga qaytish")}</a></div>` : c.contact.phone ? `<div class="auth-foot">${_t("Savol bo'lsa")}: <a href="${telHref(c.contact.phone)}">${esc(c.contact.phone)}</a></div>` : ''}
    </div></div></div>`;
  for (const [k, v] of Object.entries(G.keep.form || {})) { const i = $(`[name="${k}"]`, app); if (i) i.value = v; }
  G.keep = {};

  $$('.seg button', app).forEach((b) => (b.onclick = () => { if (b.dataset.m !== mode) renderAuth(b.dataset.m); }));
  $$('.eye', app).forEach((b) => (b.onclick = () => { const i = b.parentNode.querySelector('input'); const show = i.type === 'password'; i.type = show ? 'text' : 'password'; b.innerHTML = ic(show ? 'eye-off' : 'eye'); }));

  const submit = (form, path, body) => busy($('button[type=submit]', form), async () => {
    const r = await api(path, { method: 'POST', body: { ...body, initData: G.tg ? G.tg.initData : undefined } });
    G.token = r.token; G.me = r.user;
    LS.set('ikat_token', r.token);
    hap('ok');
    await G.enter();
  });
  if (mode === 'login') {
    $('#f-login').onsubmit = (e) => {
      e.preventDefault();
      const f = e.target;
      if (!f.username.value.trim() || !f.password.value) return toast(_t('Akkaunt nomi va parolni kiriting'), 'err');
      submit(f, '/login', { username: f.username.value.trim(), password: f.password.value });
    };
    return;
  }
  const reg = $('#f-reg');
  phoneInput(reg.phone);
  let tm;
  reg.username.oninput = () => {
    const v = reg.username.value.trim(), st = $('#un-st'), h = $('#un-hint');
    st.innerHTML = ''; clearTimeout(tm);
    h.className = 'hint'; h.textContent = _t('Lotin harflari, raqam, nuqta yoki _ (3–20 ta belgi)');
    if (v.length < 3) return;
    if (!/^[a-zA-Z0-9._]+$/.test(v)) { h.className = 'hint bad'; return; }
    tm = setTimeout(async () => {
      try {
        const r = await api('/username-free?u=' + encodeURIComponent(v));
        if (!reg.isConnected || reg.username.value.trim() !== v) return;
        const ok = r.valid && r.free;
        st.innerHTML = ic(ok ? 'circle-check' : 'circle-x', ok ? 'ok' : 'err');
        h.className = 'hint ' + (ok ? 'good' : 'bad'); h.textContent = ok ? _t("Bu nom bo'sh") : _t('Bu nom band, boshqasini tanlang');
      } catch { /* */ }
    }, 350);
  };
  reg.onsubmit = (e) => {
    e.preventDefault();
    const v = (k) => reg[k].value.trim();
    if (!/^[a-zA-Z0-9._]{3,20}$/.test(v('username'))) return toast(_t("Akkaunt nomini to'g'ri kiriting"), 'err');
    if (reg.password.value.length < 6) return toast(_t("Parol kamida 6 ta belgi bo'lsin"), 'err');
    if (v('name').length < 2) return toast(_t('Ismingizni kiriting'), 'err');
    if (reg.phone.value.replace(/\D/g, '').length !== 9) return toast(_t("Telefon raqamni to'liq kiriting"), 'err');
    if (!reg.region.value) return toast(_t('Viloyatni tanlang'), 'err');
    submit(reg, '/register', { username: v('username'), password: reg.password.value, name: v('name'), phone: reg.phone.value, region: reg.region.value, address: v('address') });
  };
}

/* ---------- Savat: kalit = "mahsulot|o'lcham" ---------- */
const cartKey = () => 'ikat_cart_' + (G.me ? G.me.id : '');
const ckey = (id, size) => id + '|' + size;
const cparse = (k) => { const i = k.indexOf('|'); return [k.slice(0, i), k.slice(i + 1)]; };
const variantOf = (p, size) => p && p.variants.find((v) => v.size === size);
G.loadCart = () => { try { G.cart = JSON.parse(LS.get(cartKey()) || '{}') || {}; } catch { G.cart = {}; } };   // tozalash loadProducts ichida
function cleanCart() {
  for (const k of Object.keys(G.cart)) {
    const [id, size] = cparse(k), v = variantOf(G.pmap[id], size);
    if (!v || v.stock <= 0 || !(G.cart[k] > 0)) delete G.cart[k];
    else if (G.cart[k] > v.stock) G.cart[k] = v.stock;
  }
}
function saveCart() { LS.set(cartKey(), JSON.stringify(G.cart)); updateBadge(); }
function updateBadge() {
  const n = Object.keys(G.cart).length, b = $('#cart-bdg');
  if (b) { b.textContent = n; b.hidden = !n; }
}
const cartItems = () => Object.keys(G.cart).map((k) => { const [id, size] = cparse(k), p = G.pmap[id]; return p && { k, p, size, v: variantOf(p, size), qty: G.cart[k], sum: Math.round(p.price * G.cart[k]) }; }).filter((x) => x && x.v);
const cartTotal = () => cartItems().reduce((s, x) => s + x.sum, 0);

G.loadProducts = async () => {
  const r = await api('/products');
  G.products = r.products;
  G.pmap = Object.fromEntries(r.products.map((p) => [p.id, p]));
  cleanCart(); saveCart();
};

function setQty(k, q) {
  const [id, size] = cparse(k), p = G.pmap[id], v = variantOf(p, size);
  if (!v) return;
  q = p.unit === 'metr' ? Math.round(q * 2) / 2 : Math.floor(q);
  if (!(q >= stepOf(p))) delete G.cart[k];
  else if (q > v.stock) { G.cart[k] = v.stock; toast(_t('Faqat {0} qolgan', qtyStr(v.stock, p.unit)), 'err'); }
  else G.cart[k] = q;
  saveCart();
}

/* ---------- Katalog ---------- */
const catLabel = (id) => _t((G.cfg.cats.find((c) => c.id === id) || {}).label || '');
const sizedOf = (p) => p.variants.filter((v) => v.size);
const coverHtml = (p) => (p.images[0] ? `<img loading="lazy" decoding="async" alt="${esc(p.name)}" src="${esc(p.images[0].thumb)}">` : '<span class="noimg" aria-hidden="true"></span>');

function cardHtml(p, i) {
  const out = p.stock <= 0, sizes = sizedOf(p);
  return `<article class="card ${out ? 'out' : ''}" data-id="${esc(p.id)}" tabindex="0" role="button" aria-label="${esc(p.name)}" style="animation-delay:${Math.min(i, 12) * 30}ms">
    <div class="timg">${coverHtml(p)}${out ? `<span class="flag off">${_t('Qolmadi')}</span>` : p.isNew ? `<span class="flag">${_t('Yangi')}</span>` : ''}</div>
    <div class="cbody"><div class="ccat">${esc(p.fabric || catLabel(p.cat))}</div><h3>${esc(p.name)}</h3>
      ${sizes.length ? `<div class="csizes">${sizes.slice(0, 7).map((v) => `<i class="${v.stock <= 0 ? 'no' : ''}">${esc(v.size)}</i>`).join('')}${sizes.length > 7 ? '<i>…</i>' : ''}</div>` : ''}
      ${priceHtml(p.price, p.unit)}</div></article>`;
}

function filterProducts() {
  const q = G.q.trim().toLowerCase();
  return G.products.filter((p) => {
    if (G.cat === 'new' ? !p.isNew : G.cat !== 'all' && p.cat !== G.cat) return false;
    if (!q) return true;
    const hay = `${p.name} ${p.fabric} ${catLabel(p.cat)} ${p.variants.map((v) => v.size).join(' ')}`.toLowerCase();
    return q.split(/\s+/).every((t) => hay.includes(t));
  });
}

function viewShop() {
  const v = $('#view');
  const cats = [{ id: 'all', label: _t('Hammasi') }, { id: 'new', label: _t('Yangi') }, ...G.cfg.cats];
  if (!cats.some((c) => c.id === G.cat)) G.cat = 'all';
  v.innerHTML = `<section class="hero"><div class="pat"></div><div class="hero-in"><h1>${_t("Qo'lda to'qilgan")}<br>${_t('ikat kiyimlar')}</h1><p>by Malika Shakirova</p></div></section>
    <div class="tools"><div class="search">${ic('search')}<input id="q" type="search" placeholder="${_t("Nomi, matosi yoki o'lchami")}" aria-label="${_t('Qidiruv')}" value="${esc(G.q)}" autocomplete="off" enterkeyhint="search"><button class="clr" id="qclr" ${G.q ? '' : 'hidden'} aria-label="${_t('Tozalash')}">${ic('x')}</button></div>
    <div class="chips" id="chips">${cats.map((c) => `<button class="chip ${G.cat === c.id ? 'on' : ''}" data-c="${esc(c.id)}">${esc(_t(c.label))}</button>`).join('')}</div></div>
    <div class="count-line" id="cnt"></div><div class="grid" id="grid"></div>`;
  const grid = $('#grid');
  const draw = () => {
    const list = filterProducts();
    $('#cnt').textContent = list.length ? _t('{0} ta mahsulot', list.length) : '';
    grid.innerHTML = list.length ? list.map(cardHtml).join('')
      : !G.products.length ? emptyHtml('shopping-bag', _t('Kolleksiya tayyorlanmoqda'), _t("Mahsulotlar tez orada shu yerda paydo bo'ladi."))
      : emptyHtml('search', G.cat === 'new' && !G.q ? _t("Hozircha yangilik yo'q") : _t('Hech narsa topilmadi'), G.q ? _t("Boshqa so'z bilan qidirib ko'ring") : _t("Boshqa bo'limni tanlang"));
  };
  draw();
  const q = $('#q');
  let tm;
  q.oninput = () => { G.q = q.value; $('#qclr').hidden = !q.value; clearTimeout(tm); tm = setTimeout(draw, 120); };
  $('#qclr').onclick = () => { q.value = ''; G.q = ''; $('#qclr').hidden = true; draw(); q.focus(); };
  $('#chips').onclick = (e) => {
    const b = e.target.closest('.chip'); if (!b) return;
    G.cat = b.dataset.c; $$('.chip', v).forEach((x) => x.classList.toggle('on', x === b)); draw(); hap('light');
  };
  grid.onclick = (e) => { const c = e.target.closest('.card'); if (c) openProduct(c.dataset.id); };
  grid.onkeydown = (e) => { if (e.key === 'Enter' && e.target.classList.contains('card')) openProduct(e.target.dataset.id); };
}

function openProduct(id) {
  const p = G.pmap[id]; if (!p) return;
  const sizes = sizedOf(p), st = stepOf(p);
  let size = sizes.length ? (p.variants.filter((v) => v.stock > 0).length === 1 ? p.variants.find((v) => v.stock > 0).size : null) : '';
  let qty = st, cur = 0;
  const s = openSheet(`${sheetTitle('')}<div class="pz"><div class="pz-media"><div class="pz-img" id="pzi">${p.images[0] ? `<img alt="${esc(p.name)}" src="${esc(p.images[0].full)}">` : '<span class="noimg"></span>'}</div>
      ${p.images.length > 1 ? `<div class="thumbs">${p.images.map((m, i) => `<button data-i="${i}" class="${i ? '' : 'on'}" aria-label="${_t('{0}-rasm', i + 1)}"><img src="${esc(m.thumb)}" alt=""></button>`).join('')}</div>` : ''}</div>
      <div class="pz-info"><div class="ccat">${esc([catLabel(p.cat), p.fabric].filter(Boolean).join(' · '))}</div><h2>${esc(p.name)}</h2>${priceHtml(p.price, p.unit)}
      <div id="buy"></div>${p.desc ? `<div class="pz-desc">${esc(p.desc)}</div>` : ''}</div></div>`, { cls: 'wide' });
  if (p.images.length) {
    $('#pzi', s.el).onclick = () => lightbox(p.images[cur].full);
    const th = $('.thumbs', s.el);
    if (th) th.onclick = (e) => {
      const b = e.target.closest('button'); if (!b) return;
      cur = +b.dataset.i; $('#pzi img', s.el).src = p.images[cur].full;
      $$('button', th).forEach((x) => x.classList.toggle('on', x === b));
    };
  }
  const buy = $('#buy', s.el);
  const draw = () => {
    const v = size === null ? null : variantOf(p, size), inCart = v ? G.cart[ckey(id, size)] || 0 : 0;
    const left = v ? clampR(v.stock - inCart) : 0;
    const note = p.stock <= 0 ? ['none', _t('Hozircha qolmagan')] : !v ? ['', _t("O'lchamni tanlang")]
      : v.stock <= 0 ? ['none', _t("Bu o'lcham qolmagan")] : v.stock <= 3 ? ['low', _t('Oxirgi {0}', qtyStr(v.stock, p.unit))] : ['okc', _t('Mavjud')];
    buy.innerHTML = `${sizes.length ? `<div class="lbl">${_t("O'lcham")}</div><div class="sizes">${sizes.map((x) => `<button data-s="${esc(x.size)}" class="${size === x.size ? 'on' : ''}" ${x.stock <= 0 ? 'disabled' : ''}>${esc(x.size)}</button>`).join('')}</div>` : ''}
      <div class="stock ${note[0]}">${note[1]}</div>
      ${v && left > 0 ? `<div class="row buy-row"><div class="stepper"><button data-a="m" aria-label="${_t('Kamaytirish')}">${ic('minus')}</button><input inputmode="decimal" aria-label="${_t('Miqdor')}" value="${fmtNum(qty)}"><button data-a="p" aria-label="${_t("Ko'paytirish")}">${ic('plus')}</button></div><span class="sp"></span><div class="tr"><small class="muted">${_t('Summa')}</small><div class="sumv">${money(p.price * qty)}</div></div></div>` : ''}
      <button class="btn block" id="addb" ${v && left > 0 ? '' : 'disabled'}>${ic('shopping-bag')} ${_t("Savatga qo'shish")}</button>
      ${inCart ? `<button class="btn emerald block" id="gocart">${_t("Savatda {0} · o'tish", qtyStr(inCart, p.unit))}</button>` : ''}`;
    const set = (q) => { q = p.unit === 'metr' ? Math.round(q * 2) / 2 : Math.floor(q); qty = Math.max(st, Math.min(left, q || st)); draw(); };
    const sz = $('.sizes', buy);
    if (sz) sz.onclick = (e) => { const b = e.target.closest('button'); if (!b) return; size = b.dataset.s; qty = st; hap('light'); draw(); };
    const step = $('.stepper', buy);
    if (step) {
      step.onclick = (e) => { const b = e.target.closest('button'); if (b) set(b.dataset.a === 'p' ? qty + st : qty - st); };
      $('input', step).onchange = (e) => set(parseNum(e.target.value));
    }
    $('#addb', buy).onclick = () => { setQty(ckey(id, size), inCart + qty); qty = st; hap('ok'); toast(_t("Savatga qo'shildi"), 'ok'); draw(); };
    const gc = $('#gocart', buy); if (gc) gc.onclick = () => { s.close(); G.go('cart'); };
  };
  draw();
}

/* ---------- Savat sahifasi ---------- */
G.comment = ''; G.way = 'pickup';
function viewCart() {
  const v = $('#view'), items = cartItems();
  if (!items.length) {
    v.innerHTML = `<div class="page">${emptyHtml('shopping-bag', _t("Savat bo'sh"), _t('Katalogdan yoqqan kiyimni tanlang'), `<button class="btn" id="tocat">${ic('store')} ${_t("Katalogga o'tish")}</button>`)}</div>`;
    $('#tocat').onclick = () => G.go('shop');
    return;
  }
  if (G.addr === undefined) G.addr = G.me.address || '';
  v.innerHTML = `<div class="page cart"><div class="cart-main"><div class="page-title"><h1>${_t('Savat')}</h1><span class="sp"></span><button class="link" id="clr">${_t('Tozalash')}</button></div><div id="rows"></div></div>
    <aside class="cart-side"><div class="cbox">
      <div class="lbl ways-l">${_t('Qanday olasiz?')}</div>
      <div class="ways"><button data-w="pickup">${ic('store')}<b>${_t('Borib olish')}</b><small>${_t("To'lov do'konda")}</small></button><button data-w="online">${ic('send')}<b>${_t('Online olish')}</b><small>${_t("Yetkazib berish, onlayn to'lov")}</small></button></div>
      <div id="way-in"></div>
      <label class="field"><span>${_t('Izoh (ixtiyoriy)')}</span><textarea class="plain" id="note" rows="2" maxlength="500">${esc(G.comment)}</textarea></label>
      <div class="tot"><span>${_t('Jami')}</span><b id="tot"></b></div>
      <div class="acts-col"><button class="btn block" id="bgo"></button></div></div></aside></div>`;
  const rows = $('#rows');
  const draw = () => {
    rows.innerHTML = cartItems().map(({ k, p, size, v: vr, qty, sum }) => `<div class="crow" data-k="${esc(k)}"><div class="th">${coverHtml(p)}</div>
      <div class="inf"><div class="n">${esc(p.name)}</div><div class="s">${size ? `<i class="sz">${esc(size)}</i>` : ''}${money(p.price)}${p.unit === 'metr' ? ' / m' : ''}</div>${vr.stock <= 3 ? `<div class="m">${_t('Oxirgi {0}', qtyStr(vr.stock, p.unit))}</div>` : ''}
        <div class="row2"><div class="stepper sm"><button data-a="m" aria-label="${_t('Kamaytirish')}">${ic(qty <= stepOf(p) ? 'trash-2' : 'minus')}</button><input inputmode="decimal" aria-label="${_t('Miqdor')}" value="${fmtNum(qty)}"><button data-a="p" aria-label="${_t("Ko'paytirish")}">${ic('plus')}</button></div><span class="sp"></span><b class="sum">${money(sum)}</b></div></div></div>`).join('');
    $('#tot').textContent = money(cartTotal());
  };
  draw();
  const after = () => (cartItems().length ? draw() : viewCart());
  rows.onclick = (e) => {
    const row = e.target.closest('.crow'), b = e.target.closest('button'); if (!row || !b) return;
    const k = row.dataset.k, p = G.pmap[cparse(k)[0]];
    setQty(k, G.cart[k] + (b.dataset.a === 'p' ? 1 : -1) * stepOf(p)); after();
  };
  rows.onchange = (e) => { const row = e.target.closest('.crow'); if (row) { setQty(row.dataset.k, parseNum(e.target.value)); after(); } };
  $('#clr').onclick = async () => { if (await confirmBox(_t('Savatni tozalash'), _t('Barcha mahsulotlar savatdan olib tashlanadi.'), _t('Tozalash'), true)) { G.cart = {}; saveCart(); viewCart(); } };
  $('#note').oninput = (e) => { G.comment = e.target.value; };
  const drawWay = () => {
    const pickup = G.way === 'pickup';
    $$('.ways button', v).forEach((b) => { const on = b.dataset.w === G.way; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    $('#way-in').innerHTML = pickup ? placeHtml()
      : `<label class="field"><span>${_t('Yetkazish manzili')}</span><div class="inp">${ic('map-pin')}<input id="addr" maxlength="200" placeholder="${_t("Tuman, ko'cha, uy")}" value="${esc(G.addr)}"></div><div class="hint">${esc(_t(G.me.region))}</div></label>`;
    if (!pickup) $('#addr').oninput = (e) => { G.addr = e.target.value; };
    $('#bgo').innerHTML = pickup ? `${ic('check')} ${_t('Buyurtma berish')}` : `${ic('credit-card')} ${_t("To'lash")}`;
  };
  $('.ways', v).onclick = (e) => { const b = e.target.closest('button'); if (b && b.dataset.w !== G.way) { G.way = b.dataset.w; hap('light'); drawWay(); } };
  $('#bgo').onclick = (e) => startCheckout(e.currentTarget);
  drawWay();
}

/** Do'kon manzili (borib olish uchun) */
const placeHtml = () => {
  const c = G.cfg.contact;
  return `<div class="req place">${ic('map-pin')}<div><b>${c.address ? esc(c.address) : _t("Do'kon manzilini buyurtma tasdiqlangach aytamiz")}</b>${c.phone ? `<a class="gold" href="${telHref(c.phone)}">${esc(c.phone)}</a>` : ''}</div></div>`;
};

async function startCheckout(btn) {
  const pickup = G.way === 'pickup';
  if (!pickup && (G.addr || '').trim().length < 5) { toast(_t('Yetkazish manzilini kiriting'), 'err'); $('#addr').focus(); return; }
  const before = JSON.stringify(G.cart);
  const ok = await busy(btn, async () => { await G.loadProducts(); return true; });
  if (!ok) return;
  if (JSON.stringify(G.cart) !== before) { toast(_t("Qoldiq o'zgargani uchun savat yangilandi"), 'info'); return viewCart(); }
  const total = cartTotal();
  if (!pickup) return openPay({ title: _t("To'lov"), amount: total, onSubmit: (d) => submitOrder('full', d) });
  if (await confirmBox(_t('Borib olish'), _t("Jami {0}. To'lovni mahsulotni olayotganda do'konda qilasiz.", money(total)), _t('Buyurtma berish'))) busy(btn, () => submitOrder('pickup', {}));
}

async function submitOrder(kind, d) {
  const pickup = kind === 'pickup', items = cartItems().map((x) => ({ id: x.p.id, size: x.size, qty: x.qty }));
  const r = await api('/orders', { method: 'POST', body: { items, kind, address: pickup ? '' : G.addr.trim(), comment: G.comment, method: d.method, receipt: d.receipt } });
  if (!pickup && !G.me.address) G.me.address = G.addr.trim();
  G.cart = {}; G.comment = ''; saveCart();
  G.loadProducts().catch(() => {});
  G.oway = kind;
  doneSheet(_t('Buyurtma №{0} yuborildi', r.order.no), pickup
    ? _t("Do'kon buyurtmani tasdiqlagach borib olishingiz mumkin. Holati «Buyurtmalar» bo'limida ko'rinadi.")
    : _t("Chek tekshirilmoqda. Tasdiqlangach buyurtma qabul qilinadi — holati «Buyurtmalar» bo'limida ko'rinadi."), () => G.go('orders'));
}

function doneSheet(title, text, then) {
  hap('ok');
  const s = openSheet(`<div class="done"><div class="ring"><img src="/img/mark.webp" alt=""></div><h3>${esc(title)}</h3><p>${esc(text)}</p><button class="btn block" id="dn">${_t('Yaxshi')}</button></div>`, { cls: 'small', onClose: then });
  $('#dn', s.el).onclick = () => s.close();
}

/* ---------- To'lov oynasi (Payme / Click / Paynet + chek) ---------- */
async function openPay({ title, amount, editable = false, max, onSubmit }) {
  let info;
  try { info = await api('/pay-info'); } catch (e) { return toast(e.message, 'err'); }
  let method = null, receipt = null, amt = amount, sending = false;
  const c = G.cfg.contact;
  const s = openSheet(`${sheetTitle(esc(title))}
    <div class="amount-big" id="pa">${money(amt)}</div>
    ${editable ? `<label class="field"><span>${_t("To'lov summasi (so'm)")}</span><div class="inp np"><input id="amt" inputmode="numeric" value="${group(amt)}"></div><div class="hint">${_t("Ko'pi bilan")} ${money(max)}</div></label>` : ''}
    <div class="sect">${_t("To'lov usuli")}</div>
    <div class="meth">${G.cfg.methods.map((m) => `<button data-m="${m.id}"><i style="background:${METH_COLOR[m.id]}"></i>${esc(m.label)}</button>`).join('')}</div>
    <div id="req"></div>
    <div class="sect">${_t("To'lov cheki")}</div>
    <label class="upl" id="upl"><span id="upl-in">${ic('image-plus')}<b>${_t('Chek rasmini yuklang')}</b><small>${_t('Skrinshot yoki foto')}</small></span><input type="file" accept="image/*" id="file" aria-label="${_t('Chek rasmi')}"></label>
    <button class="btn block" id="send" style="margin-top:16px" disabled>${ic('send')} ${_t("To'lovni yuborish")}</button>`, { guard: () => !!receipt && !sending });
  const $s = (x) => $(x, s.el);
  const upd = () => { $s('#send').disabled = !(method && receipt && amt >= 1); };
  $s('.meth').onclick = (e) => {
    const b = e.target.closest('button'); if (!b) return;
    method = b.dataset.m; $$('.meth button', s.el).forEach((x) => x.classList.toggle('on', x === b)); hap('light');
    const r = info.pay[method] || {};
    $s('#req').innerHTML = r.card || r.link
      ? `<div class="req">${r.card ? `<div class="r1"><div class="card-no">${esc(r.card)}</div><button class="cp" id="cp" aria-label="${_t('Nusxalash')}">${ic('copy')}</button></div>` : ''}${r.holder ? `<div class="muted">${_t('Qabul qiluvchi')}: <b>${esc(r.holder)}</b></div>` : ''}${r.link ? `<a class="btn sm ghost" target="_blank" rel="noopener" href="${esc(r.link)}">${ic('link-2')} ${_t('{0} da ochish', esc(METH[method]))}</a>` : ''}</div>`
      : `<div class="req muted">${_t('{0} rekvizitlari hali kiritilmagan.', esc(METH[method]))}${c.phone ? ` ${_t('Aloqa')}: <a class="gold" href="${telHref(c.phone)}">${esc(c.phone)}</a>` : ''}</div>`;
    const cp = $s('#cp');
    if (cp) cp.onclick = () => (navigator.clipboard ? navigator.clipboard.writeText(r.card.replace(/\s/g, '')) : Promise.reject()).then(() => toast(_t('Karta raqami nusxalandi'), 'ok')).catch(() => toast(r.card));
    upd();
  };
  if (editable) {
    moneyInput($s('#amt'));
    $s('#amt').addEventListener('input', (e) => { amt = Math.min(max, parseNum(e.target.value)); $s('#pa').textContent = money(amt); upd(); });
  }
  $s('#file').onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try {
      receipt = await readImage(f, 1280, 0.8);
      $s('#upl').classList.add('has');
      $s('#upl-in').innerHTML = `<img src="${receipt}" alt="chek"><small class="ok">${_t('Chek yuklandi · almashtirish uchun bosing')}</small>`;
    } catch (err) { toast(err.message, 'err'); }
    upd();
  };
  $s('#send').onclick = () => busy($s('#send'), async () => { await onSubmit({ method, receipt, amount: amt }); sending = true; s.close(); });
}
