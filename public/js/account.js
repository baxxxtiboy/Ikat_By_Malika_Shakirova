'use strict';
/* ===== Buyurtmalar, Profil, buyurtma tafsilotlari (mijoz uchun) ===== */

function dueHtml(o) {
  if (o.status === 'pending') return `<div class="due warn">${ic('hourglass')} ${_t("Boshlang'ich to'lov tekshirilmoqda")}</div>`;
  if (!o.debt || !o.debt.dueAt || o.owed <= 0) return '';
  const d = Math.ceil((o.debt.dueAt - Date.now()) / 86400e3);
  return d >= 0
    ? `<div class="due ${d <= 3 ? 'warn' : 'muted'}">${ic('calendar')} ${_t('Muddat: {0} · {1} kun qoldi', fmtD(o.debt.dueAt), d)}</div>`
    : `<div class="due err">${ic('triangle-alert')} ${_t("Muddati {0} kun oldin o'tgan ({1})", -d, fmtD(o.debt.dueAt))}</div>`;
}
const pendingSum = (o) => o.payments.filter((p) => p.status === 'pending' && p.purpose === 'repay').reduce((s, p) => s + p.amount, 0);

/* ---------- Buyurtmalar: borib olish / online ---------- */
async function viewOrders() {
  const v = $('#view');
  v.innerHTML = '<div class="page"><div class="skel"></div><div class="skel"></div></div>';
  let list;
  try { list = (await api('/orders')).orders; }
  catch (e) {
    if (G.tab !== 'orders') return;
    v.innerHTML = `<div class="page">${emptyHtml('circle-alert', _t('Yuklanmadi'), esc(e.message), `<button class="btn" id="rt">${_t('Qayta urinish')}</button>`)}</div>`; $('#rt').onclick = viewOrders; return;
  }
  if (G.tab !== 'orders') return;
  const wayOf = (o) => (o.kind === 'pickup' ? 'pickup' : 'full');
  if (!G.oway) G.oway = list.length ? wayOf(list[0]) : 'pickup';
  const draw = () => {
    const pickup = G.oway === 'pickup', arr = list.filter((o) => wayOf(o) === G.oway);
    v.innerHTML = `<div class="page narrow"><div class="page-title"><h1>${_t('Buyurtmalar')}</h1></div>
      <div class="seg wide">${[['pickup', _t('Borib olish')], ['full', _t('Online olish')]].map(([id, l]) => `<button data-w="${id}" class="${G.oway === id ? 'on' : ''}">${l}</button>`).join('')}</div>
      ${pickup ? placeHtml() : ''}
      ${arr.map((o) => `<button class="hist" data-o="${esc(o.id)}"><span class="h1"><span class="no">№${o.no}</span><span class="dim">${fmtDT(o.createdAt)}</span><span class="sp"></span>${stChip(o)}</span>
        <span class="its">${o.items.slice(0, 3).map((i) => esc(i.name) + (i.size ? ` (${esc(i.size)})` : '')).join(', ')}${o.items.length > 3 ? ` +${o.items.length - 3}` : ''}</span>
        <span class="h2">${kindChip(o)}${o.owed > 0 ? `<span class="warn">${_t('qoldiq')} ${money(o.owed)}</span>` : ''}<span class="sm">${money(o.total)}</span></span></button>`).join('')
        || `<div class="cbox">${emptyHtml(pickup ? 'store' : 'send', _t("Buyurtma yo'q"), pickup ? _t("Savatda «Borib olish» ni tanlang: to'lovni do'konda qilasiz.") : _t("Savatda «Online olish» ni tanlang: yetkazib beramiz."), `<button class="btn" id="tocat">${ic('store')} ${_t("Katalogga o'tish")}</button>`)}</div>`}</div>`;
    if ($('#tocat')) $('#tocat').onclick = () => G.go('shop');
  };
  draw();
  v.onclick = (e) => {
    const w = e.target.closest('[data-w]'), b = e.target.closest('[data-o]');
    if (w && w.dataset.w !== G.oway) { G.oway = w.dataset.w; draw(); } else if (b) openOrder(list.find((o) => o.id === b.dataset.o));
  };
}

function payDebt(o) {
  const max = o.owed - pendingSum(o);
  openPay({
    title: `№${o.no} — ${_t("nasiya to'lovi")}`, amount: max, editable: true, max,
    onSubmit: async (d) => {
      await api(`/orders/${o.id}/pay`, { method: 'POST', body: { amount: d.amount, method: d.method, receipt: d.receipt } });
      doneSheet(_t("To'lov yuborildi"), _t('Chekingiz tekshirilmoqda. Tasdiqlangach qoldiq kamayadi.'), () => { if (G.tab === 'orders') viewOrders(); });
    }
  });
}

/* ---------- Buyurtma tafsiloti ---------- */
const payRow = (p, extra = '') => `<div class="pay-row">${p.chek ? `<button class="chek" data-lb="${esc(p.chek)}" aria-label="${_t("Chekni ko'rish")}"><img src="${esc(p.chek)}" alt="chek"></button>` : `<span class="chek">${ic('banknote')}</span>`}
  <div class="g"><b>${PAY_LAB[p.purpose] || ''}</b><div class="dim">${fmtDT(p.at)} · ${METH[p.method] || esc(p.method)}${p.note ? ' · ' + esc(_t(p.note)) : ''}</div></div>
  <div class="tr"><b class="gold">${money(p.amount)}</b><div>${chip(...PAY_ST[p.status])}</div></div>${extra}</div>`;

function openOrder(o) {
  if (!o) return;
  const pickup = o.kind === 'pickup', can = o.owed - pendingSum(o) > 0;
  const note = !pickup ? '' : o.status === 'pending' ? `<div class="due warn">${ic('hourglass')} ${_t("Do'kon tasdiqlashini kuting")}</div>` : o.status === 'accepted' ? `<div class="due ok">${ic('circle-check')} ${_t("Borib olishingiz mumkin. To'lov do'konda.")}</div>` : '';
  const s = openSheet(`${sheetTitle(`${_t('Buyurtma')} №${o.no}`)}
    <div class="row wrap gapb">${stChip(o)}${kindChip(o)}<span class="dim">${fmtDT(o.createdAt)}</span></div>${note}
    ${billHtml(o.items, o.total)}${pickup && ['pending', 'accepted'].includes(o.status) ? placeHtml() : ''}
    <div class="kvs">${o.address ? `<div><span>${_t('Manzil')}</span><b>${esc(o.address)}</b></div>` : ''}${o.comment ? `<div><span>${_t('Izoh')}</span><b>${esc(o.comment)}</b></div>` : ''}${o.kind === 'debt' ? `<div><span>${_t("To'langan")}</span><b class="ok">${money(o.paid)}</b></div><div><span>${_t('Qoldiq')}</span><b class="gold">${money(o.owed)}</b></div>` : ''}</div>${o.kind === 'debt' ? dueHtml(o) : ''}
    ${o.payments.length ? `<div class="sect">${_t("To'lovlar")}</div>${o.payments.map((p) => payRow(p)).join('')}` : ''}
    ${can ? `<button class="btn block" id="pd">${ic('credit-card')} ${_t("To'lash")}</button>` : ''}`);
  if (can) $('#pd', s.el).onclick = () => { s.close(); payDebt(o); };
  s.el.addEventListener('click', (e) => { const i = e.target.closest('[data-lb]'); if (i) lightbox(i.dataset.lb); });
}

/* ---------- Profil ---------- */
function viewProfile() {
  const v = $('#view'), u = G.me, c = G.cfg.contact;
  v.onclick = null;
  v.innerHTML = `<div class="page narrow"><div class="me"><div class="ava"><div class="in">${u.avatar ? `<img src="${esc(u.avatar)}" alt="">` : initial(u.name)}</div><span class="cam">${ic('camera')}</span><input type="file" accept="image/*" id="av" aria-label="${_t('Profil rasmini tanlash')}"></div>
      <h2>${esc(u.name)}</h2><div class="un">@${esc(u.username)}</div></div>
    <div class="info"><div class="it">${ic('phone')}<div><small>${_t('Telefon')}</small>${esc(phoneShow(u.phone))}</div></div>
      <div class="it">${ic('map-pin')}<div><small>${_t('Manzil')}</small>${esc([_t(u.region), u.address].filter(Boolean).join(', '))}</div></div></div>
    <div class="two"><button class="btn ghost sm" id="ed">${ic('pencil')} ${_t('Tahrirlash')}</button><button class="btn ghost sm" id="pw">${ic('lock')} ${_t('Parol')}</button></div>
    ${c.address ? `<div class="sect">${_t("Do'kon manzili")}</div>${placeHtml()}` : ''}
    ${c.phone || c.whatsapp || c.telegram || c.instagram ? `<div class="sect">${_t('Aloqa')}</div><div class="contact">
      ${c.phone ? `<a href="${telHref(c.phone)}">${ic('phone')} ${_t("Qo'ng'iroq")}</a>` : ''}
      ${c.telegram ? `<a target="_blank" rel="noopener" href="https://t.me/${esc(c.telegram)}">${ic('send')} Telegram</a>` : ''}
      ${c.instagram ? `<a target="_blank" rel="noopener" href="https://instagram.com/${esc(c.instagram)}">${ic('camera')} Instagram</a>` : ''}
      ${c.whatsapp ? `<a target="_blank" rel="noopener" href="https://wa.me/${esc(c.whatsapp)}">${ic('message-square')} WhatsApp</a>` : ''}</div>` : ''}
    <button class="btn ghost block out" id="lo">${ic('log-out')} ${_t('Chiqish')}</button></div>`;
  $('#av').onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try { const r = await api('/me/avatar', { method: 'POST', body: { image: await readImage(f, 360, 0.86) } }); G.me = r.user; toast(_t('Rasm yangilandi'), 'ok'); if (G.tab === 'profile') viewProfile(); } catch (err) { toast(err.message, 'err'); }
  };
  $('#ed').onclick = editProfile; $('#pw').onclick = changePassword;
  $('#lo').onclick = async () => { if (await confirmBox(_t('Chiqish'), _t('Akkauntdan chiqmoqchimisiz?'), _t('Chiqish'))) G.logout(); };
}

function editProfile() {
  const u = G.me;
  const s = openSheet(`${sheetTitle(_t("Ma'lumotlarim"))}<form id="pf" novalidate>
    <label class="field"><span>${_t('Akkaunt nomi')}</span><div class="inp">${ic('user')}<input name="username" value="${esc(u.username)}" autocapitalize="none" maxlength="20"></div></label>
    <label class="field"><span>${_t('Ism')}</span><div class="inp">${ic('user-round')}<input name="name" value="${esc(u.name)}" maxlength="60"></div></label>
    <label class="field"><span>${_t('Telefon')}</span><div class="inp ph"><span class="pre">+998</span><input name="phone" type="tel" inputmode="numeric" value="${esc(u.phone.replace('+998', '').replace(/^(\d{2})(\d{3})(\d{2})(\d{2})$/, '$1 $2 $3 $4'))}"></div></label>
    <label class="field"><span>${_t('Viloyat')}</span><div class="inp">${ic('map-pin')}<select name="region">${G.cfg.regions.map((r) => `<option value="${esc(r)}" ${r === u.region ? 'selected' : ''}>${esc(_t(r))}</option>`).join('')}</select></div></label>
    <label class="field"><span>${_t('Manzil')}</span><div class="inp">${ic('store')}<input name="address" value="${esc(u.address)}" maxlength="200"></div></label>
    <button class="btn block" type="submit">${ic('save')} ${_t('Saqlash')}</button></form>`);
  const f = $('#pf', s.el); phoneInput(f.phone);
  f.onsubmit = (e) => {
    e.preventDefault();
    busy($('button[type=submit]', f), async () => {
      const r = await api('/me', { method: 'PUT', body: { username: f.username.value.trim(), name: f.elements.name.value.trim(), phone: f.phone.value, region: f.region.value, address: f.address.value.trim() } });
      G.me = r.user; G.addr = undefined; s.close(); toast(_t('Saqlandi'), 'ok'); viewProfile();
    });
  };
}

function changePassword() {
  const s = openSheet(`${sheetTitle(_t("Parolni o'zgartirish"))}<form id="pwf" novalidate>
    <label class="field"><span>${_t('Eski parol')}</span><div class="inp">${ic('lock')}<input name="old" type="password" autocomplete="current-password"></div></label>
    <label class="field"><span>${_t('Yangi parol')}</span><div class="inp">${ic('lock')}<input name="n1" type="password" autocomplete="new-password" placeholder="${_t('kamida 6 ta belgi')}"></div></label>
    <label class="field"><span>${_t('Yangi parolni takrorlang')}</span><div class="inp">${ic('lock')}<input name="n2" type="password" autocomplete="new-password"></div></label>
    <button class="btn block" type="submit">${ic('save')} ${_t('Saqlash')}</button></form>`);
  const f = $('#pwf', s.el);
  f.onsubmit = (e) => {
    e.preventDefault();
    if (f.n1.value.length < 6) return toast(_t("Yangi parol kamida 6 ta belgi bo'lsin"), 'err');
    if (f.n1.value !== f.n2.value) return toast(_t('Yangi parollar bir xil emas'), 'err');
    busy($('button[type=submit]', f), async () => {
      const r = await api('/me/password', { method: 'POST', body: { old: f.old.value, password: f.n1.value } });
      G.token = r.token; LS.set('ikat_token', r.token); s.close(); toast(_t("Parol o'zgartirildi"), 'ok');
    });
  };
}
