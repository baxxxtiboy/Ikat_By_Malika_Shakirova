'use strict';
/* ===== Nasiya, Profil, buyurtma tafsilotlari (mijoz uchun) ===== */

function dueHtml(o) {
  if (o.status === 'pending') return `<div class="due warn">${ic('hourglass')} Boshlang'ich to'lov tekshirilmoqda</div>`;
  if (!o.debt || !o.debt.dueAt || o.owed <= 0) return '';
  const d = Math.ceil((o.debt.dueAt - Date.now()) / 86400e3);
  return d >= 0
    ? `<div class="due ${d <= 3 ? 'warn' : 'muted'}">${ic('calendar')} Muddat: ${fmtD(o.debt.dueAt)} · ${d} kun qoldi</div>`
    : `<div class="due err">${ic('triangle-alert')} Muddati ${-d} kun oldin o'tgan (${fmtD(o.debt.dueAt)})</div>`;
}
const pendingSum = (o) => o.payments.filter((p) => p.status === 'pending' && p.purpose === 'repay').reduce((s, p) => s + p.amount, 0);

/* ---------- Nasiya ---------- */
async function viewDebt() {
  const v = $('#view');
  v.innerHTML = '<div class="page"><div class="skel"></div><div class="skel"></div></div>';
  let r;
  try { r = await api('/debts'); }
  catch (e) {
    if (G.tab !== 'debt') return;
    v.innerHTML = `<div class="page">${emptyHtml('circle-alert', 'Yuklanmadi', esc(e.message), '<button class="btn" id="rt">Qayta urinish</button>')}</div>`; $('#rt').onclick = viewDebt; return;
  }
  if (G.tab !== 'debt') return;
  const left = (o) => (o.status === 'pending' ? o.total - o.payments.filter((p) => p.purpose === 'down').reduce((s, p) => s + p.amount, 0) : o.owed);
  const grand = r.debts.reduce((s, o) => s + left(o), 0);
  v.innerHTML = `<div class="page narrow"><div class="page-title"><h1>Nasiya</h1></div>
    <div class="dsum"><div><small>Qolgan summa</small><b>${money(grand)}</b></div><div class="slots">${Array.from({ length: r.max }, (_, i) => `<i class="${i < r.debts.length ? 'f' : ''}"></i>`).join('')}<small>${r.debts.length} / ${r.max}</small></div></div>
    ${r.debts.length ? r.debts.map((o) => {
      const paid = o.status === 'pending' ? 0 : o.paid, ps = pendingSum(o), can = o.status !== 'pending' && o.owed - ps > 0;
      return `<div class="dcard"><div class="top"><span class="no">№${o.no}</span><span class="dim">${fmtDT(o.createdAt)}</span><span class="sp"></span>${stChip(o)}</div>
        <div class="prog"><i style="width:${Math.min(100, Math.round((paid / o.total) * 100))}%"></i></div>
        <div class="kv"><span>Buyurtma</span><b>${money(o.total)}</b></div><div class="kv"><span>To'langan</span><b class="ok">${money(paid)}</b></div>
        ${ps ? `<div class="kv"><span>Tekshiruvda</span><b class="warn">${money(ps)}</b></div>` : ''}
        <div class="kv big"><span>Qoldiq</span><b>${money(left(o))}</b></div>${dueHtml(o)}
        <div class="two"><button class="btn ghost sm" data-det="${esc(o.id)}">${ic('file-text')} Tafsilot</button><button class="btn sm" data-pay="${esc(o.id)}" ${can ? '' : 'disabled'}>${ic('credit-card')} To'lash</button></div></div>`;
    }).join('') : emptyHtml('circle-check', "Nasiya yo'q", G.cfg.debt.enabled ? `Savatda «Nasiyaga olish» tugmasi orqali ${G.cfg.debt.percent}% to'lab buyurtma berishingiz mumkin.` : "Hozircha to'lanmagan nasiyangiz yo'q.")}</div>`;
  v.onclick = (e) => {
    const b = e.target.closest('[data-det],[data-pay]'); if (!b) return;
    const o = r.debts.find((x) => x.id === (b.dataset.det || b.dataset.pay));
    if (!o) return;
    if (b.dataset.det) openOrder(o); else payDebt(o);
  };
}

function payDebt(o) {
  const max = o.owed - pendingSum(o);
  openPay({
    title: `№${o.no} — nasiya to'lovi`, amount: max, editable: true, max,
    onSubmit: async (d) => {
      await api(`/orders/${o.id}/pay`, { method: 'POST', body: { amount: d.amount, method: d.method, receipt: d.receipt } });
      doneSheet("To'lov yuborildi", 'Chekingiz tekshirilmoqda. Tasdiqlangach qoldiq kamayadi.', () => { if (G.tab === 'debt') viewDebt(); });
    }
  });
}

/* ---------- Buyurtma tafsiloti ---------- */
const payRow = (p, extra = '') => `<div class="pay-row">${p.chek ? `<button class="chek" data-lb="${esc(p.chek)}" aria-label="Chekni ko'rish"><img src="${esc(p.chek)}" alt="chek"></button>` : `<span class="chek">${ic('banknote')}</span>`}
  <div class="g"><b>${PAY_LAB[p.purpose] || ''}</b><div class="dim">${fmtDT(p.at)} · ${METH[p.method] || esc(p.method)}${p.note ? ' · ' + esc(p.note) : ''}</div></div>
  <div class="tr"><b class="gold">${money(p.amount)}</b><div>${chip(...PAY_ST[p.status])}</div></div>${extra}</div>`;

function openOrder(o) {
  if (!o) return;
  const s = openSheet(`${sheetTitle(`Buyurtma №${o.no}`)}
    <div class="row wrap gapb">${stChip(o)}${kindChip(o)}<span class="dim">${fmtDT(o.createdAt)}</span></div>
    ${billHtml(o.items, o.total)}
    <div class="kvs">${o.address ? `<div><span>Manzil</span><b>${esc(o.address)}</b></div>` : ''}${o.comment ? `<div><span>Izoh</span><b>${esc(o.comment)}</b></div>` : ''}
    ${o.kind === 'debt' ? `<div><span>To'langan</span><b class="ok">${money(o.paid)}</b></div><div><span>Qoldiq</span><b class="gold">${money(o.owed)}</b></div>` : ''}</div>${o.kind === 'debt' ? dueHtml(o) : ''}
    <div class="sect">To'lovlar</div>${o.payments.map((p) => payRow(p)).join('')}`);
  s.el.addEventListener('click', (e) => { const i = e.target.closest('[data-lb]'); if (i) lightbox(i.dataset.lb); });
}

/* ---------- Profil ---------- */
async function viewProfile() {
  const v = $('#view'), u = G.me, c = G.cfg.contact;
  v.onclick = null;
  v.innerHTML = `<div class="page narrow"><div class="me"><div class="ava"><div class="in">${u.avatar ? `<img src="${esc(u.avatar)}" alt="">` : initial(u.name)}</div><span class="cam">${ic('camera')}</span><input type="file" accept="image/*" id="av" aria-label="Profil rasmini tanlash"></div>
      <h2>${esc(u.name)}</h2><div class="un">@${esc(u.username)}</div></div>
    <div class="info"><div class="it">${ic('phone')}<div><small>Telefon</small>${esc(phoneShow(u.phone))}</div></div>
      <div class="it">${ic('map-pin')}<div><small>Manzil</small>${esc([u.region, u.address].filter(Boolean).join(', '))}</div></div></div>
    <div class="two"><button class="btn ghost sm" id="ed">${ic('pencil')} Tahrirlash</button><button class="btn ghost sm" id="pw">${ic('lock')} Parol</button></div>
    <div class="sect">Buyurtmalarim</div><div id="hist"><div class="skel"></div></div>
    ${c.phone || c.whatsapp || c.telegram || c.instagram ? `<div class="sect">Aloqa</div><div class="contact">
      ${c.phone ? `<a href="${telHref(c.phone)}">${ic('phone')} Qo'ng'iroq</a>` : ''}
      ${c.telegram ? `<a target="_blank" rel="noopener" href="https://t.me/${esc(c.telegram)}">${ic('send')} Telegram</a>` : ''}
      ${c.instagram ? `<a target="_blank" rel="noopener" href="https://instagram.com/${esc(c.instagram)}">${ic('camera')} Instagram</a>` : ''}
      ${c.whatsapp ? `<a target="_blank" rel="noopener" href="https://wa.me/${esc(c.whatsapp)}">${ic('message-square')} WhatsApp</a>` : ''}</div>` : ''}
    <button class="btn ghost block out" id="lo">${ic('log-out')} Chiqish</button></div>`;
  $('#av').onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try { const r = await api('/me/avatar', { method: 'POST', body: { image: await readImage(f, 360, 0.86) } }); G.me = r.user; toast('Rasm yangilandi', 'ok'); if (G.tab === 'profile') viewProfile(); } catch (err) { toast(err.message, 'err'); }
  };
  $('#ed').onclick = editProfile; $('#pw').onclick = changePassword;
  $('#lo').onclick = async () => { if (await confirmBox('Chiqish', 'Akkauntdan chiqmoqchimisiz?', 'Chiqish')) G.logout(); };
  try {
    const r = await api('/orders');
    const h = $('#hist');
    if (G.tab !== 'profile' || !h) return;
    h.innerHTML = r.orders.length ? r.orders.map((o) => `<button class="hist" data-o="${esc(o.id)}"><span class="h1"><span class="no">№${o.no}</span><span class="dim">${fmtDT(o.createdAt)}</span><span class="sp"></span>${stChip(o)}</span>
      <span class="its">${o.items.slice(0, 3).map((i) => esc(i.name) + (i.size ? ` (${esc(i.size)})` : '')).join(', ')}${o.items.length > 3 ? ` +${o.items.length - 3}` : ''}</span>
      <span class="h2">${kindChip(o)}${o.owed > 0 ? `<span class="warn">qoldiq ${money(o.owed)}</span>` : ''}<span class="sm">${money(o.total)}</span></span></button>`).join('')
      : emptyHtml('file-text', '', 'Hali buyurtma bermagansiz');
    h.onclick = (e) => { const b = e.target.closest('[data-o]'); if (b) openOrder(r.orders.find((o) => o.id === b.dataset.o)); };
  } catch (e) { const h = $('#hist'); if (h) h.innerHTML = `<p class="err">${esc(e.message)}</p>`; }
}

function editProfile() {
  const u = G.me;
  const s = openSheet(`${sheetTitle("Ma'lumotlarim")}<form id="pf" novalidate>
    <label class="field"><span>Akkaunt nomi</span><div class="inp">${ic('user')}<input name="username" value="${esc(u.username)}" autocapitalize="none" maxlength="20"></div></label>
    <label class="field"><span>Ism</span><div class="inp">${ic('user-round')}<input name="name" value="${esc(u.name)}" maxlength="60"></div></label>
    <label class="field"><span>Telefon</span><div class="inp ph"><span class="pre">+998</span><input name="phone" type="tel" inputmode="numeric" value="${esc(u.phone.replace('+998', '').replace(/^(\d{2})(\d{3})(\d{2})(\d{2})$/, '$1 $2 $3 $4'))}"></div></label>
    <label class="field"><span>Viloyat</span><div class="inp">${ic('map-pin')}<select name="region">${G.cfg.regions.map((r) => `<option ${r === u.region ? 'selected' : ''}>${esc(r)}</option>`).join('')}</select></div></label>
    <label class="field"><span>Manzil</span><div class="inp">${ic('store')}<input name="address" value="${esc(u.address)}" maxlength="200"></div></label>
    <button class="btn block" type="submit">${ic('save')} Saqlash</button></form>`);
  const f = $('#pf', s.el); phoneInput(f.phone);
  f.onsubmit = (e) => {
    e.preventDefault();
    busy($('button[type=submit]', f), async () => {
      const r = await api('/me', { method: 'PUT', body: { username: f.username.value.trim(), name: f.elements.name.value.trim(), phone: f.phone.value, region: f.region.value, address: f.address.value.trim() } });
      G.me = r.user; G.addr = undefined; s.close(); toast('Saqlandi', 'ok'); viewProfile();
    });
  };
}

function changePassword() {
  const s = openSheet(`${sheetTitle("Parolni o'zgartirish")}<form id="pwf" novalidate>
    <label class="field"><span>Eski parol</span><div class="inp">${ic('lock')}<input name="old" type="password" autocomplete="current-password"></div></label>
    <label class="field"><span>Yangi parol</span><div class="inp">${ic('lock')}<input name="n1" type="password" autocomplete="new-password" placeholder="kamida 6 ta belgi"></div></label>
    <label class="field"><span>Yangi parolni takrorlang</span><div class="inp">${ic('lock')}<input name="n2" type="password" autocomplete="new-password"></div></label>
    <button class="btn block" type="submit">${ic('save')} Saqlash</button></form>`);
  const f = $('#pwf', s.el);
  f.onsubmit = (e) => {
    e.preventDefault();
    if (f.n1.value.length < 6) return toast("Yangi parol kamida 6 ta belgi bo'lsin", 'err');
    if (f.n1.value !== f.n2.value) return toast('Yangi parollar bir xil emas', 'err');
    busy($('button[type=submit]', f), async () => {
      const r = await api('/me/password', { method: 'POST', body: { old: f.old.value, password: f.n1.value } });
      G.token = r.token; LS.set('ikat_token', r.token); s.close(); toast("Parol o'zgartirildi", 'ok');
    });
  };
}
