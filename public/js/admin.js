'use strict';
/* ===== Admin panel ===== */
const AT = [['today', _t('Bugun'), 'inbox'], ['products', _t('Mahsulot'), 'package'], ['history', _t('Tarix'), 'history'], ['users', _t('Mijozlar'), 'users'], ['settings', _t('Sozlama'), 'settings']];
const skeleton = (n = 3) => `<div class="page">${'<div class="skel"></div>'.repeat(n)}</div>`;
const errView = (e, retry) => { $('#view').innerHTML = `<div class="page">${emptyHtml('circle-alert', _t('Yuklanmadi'), esc(e.message), `<button class="btn" id="rt">${_t('Qayta urinish')}</button>`)}</div>`; $('#rt').onclick = () => retry(); };
const tile = (icon, label, val) => `<div class="tile">${ic(icon)}<small>${label}</small><b>${val}</b></div>`;

function ocHtml(o, hot) {
  const u = o.user || {};
  return `<button class="oc ${hot ? 'hot' : ''}" data-o="${esc(o.id)}"><span class="a"><span class="no">№${o.no}</span><span class="dim">${fmtDT(o.createdAt)}</span><span class="sp"></span>${stChip(o)}</span>
    <span class="who">${esc(u.name)} <span class="muted">${esc(phoneShow(u.phone))}</span></span>
    <span class="its">${o.items.slice(0, 5).map((i) => `<i>${esc(i.name)}${i.size ? ` · ${esc(i.size)}` : ''} × ${fmtNum(i.qty)}</i>`).join('')}${o.items.length > 5 ? `<i>+${o.items.length - 5}</i>` : ''}</span>
    <span class="b">${kindChip(o)}${o.owed > 0 ? `<span class="warn">${_t('qoldiq')} ${money(o.owed)}</span>` : ''}<span class="sm">${money(o.total)}</span></span></button>`;
}
function bindOrderList(box, orders, reload) {
  box.onclick = (e) => { const c = e.target.closest('[data-o]'); if (c) openAdminOrder(orders.find((o) => o.id === c.dataset.o), reload); };
}
const askReject = (o) => confirmBox(o.kind === 'pickup' ? _t('Buyurtmani rad etish') : _t('Chekni rad etish'), o.status === 'pending' ? _t('Buyurtma bekor qilinadi va mahsulotlar omborga qaytadi.') : _t("Bu to'lov rad etiladi."), _t('Rad etish'), true);
const setSt = (id, status) => api(`/admin/orders/${id}/status`, { method: 'POST', body: { status } });
// pid bo'sh bo'lsa — «borib olish» buyurtmasi (chek yo'q)
const decide = (oid, pid, action) => (pid ? api(`/admin/orders/${oid}/payments/${pid}`, { method: 'POST', body: { action } }) : setSt(oid, action === 'confirm' ? 'accepted' : 'rejected'));

/* ---------- Buyurtma tafsiloti (admin) ---------- */
function openAdminOrder(o, reload) {
  if (!o) return;
  const u = o.user || {}, pickup = o.kind === 'pickup';
  const s = openSheet(`${sheetTitle(`${_t('Buyurtma')} №${o.no}`)}
    <div class="row wrap gapb">${stChip(o)}${kindChip(o)}<span class="dim">${fmtDT(o.createdAt)}</span></div>
    <div class="kvs"><div><span>${_t('Mijoz')}</span><b>${esc(u.name)} (@${esc(u.username)})</b></div><div><span>${_t('Telefon')}</span><b><a class="gold" href="${telHref(u.phone)}">${esc(phoneShow(u.phone))}</a></b></div><div><span>${_t('Manzil')}</span><b>${esc([_t(u.region), o.address].filter(Boolean).join(', '))}</b></div>${o.comment ? `<div><span>${_t('Izoh')}</span><b>${esc(o.comment)}</b></div>` : ''}</div>
    ${billHtml(o.items, o.total)}
    ${o.kind === 'debt' ? `<div class="kvs"><div><span>${_t("To'langan")}</span><b class="ok">${money(o.paid)}</b></div><div><span>${_t('Qoldiq')}</span><b class="gold">${money(o.owed)}</b></div>${o.debt.dueAt ? `<div><span>${_t('Muddat')}</span><b>${fmtD(o.debt.dueAt)}</b></div>` : ''}<div><span>${_t('Shartga rozilik')}</span><b class="ok">${fmtDT(o.debt.consentAt)}</b></div></div>` : ''}
    ${o.payments.length ? `<div class="sect">${_t("To'lovlar")}</div>` : pickup ? `<div class="due">${ic('banknote')} ${_t("To'lov do'konda")}</div>` : ''}
    ${o.payments.map((p) => payRow(p, p.status === 'pending' ? `<div class="two full"><button class="btn danger sm" data-act="reject" data-p="${esc(p.id)}">${ic('x')} ${_t('Rad etish')}</button><button class="btn emerald sm" data-act="confirm" data-p="${esc(p.id)}">${ic('check')} ${_t('Tasdiqlash')}</button></div>` : '')).join('')}
    <div class="acts">${pickup && o.status === 'pending' ? `<button class="btn danger" data-st="rejected">${ic('x')} ${_t('Rad etish')}</button><button class="btn emerald" data-st="accepted">${ic('check')} ${_t('Tasdiqlash')}</button>` : ''}${!pickup && o.status === 'accepted' ? `<button class="btn emerald" data-st="shipped">${ic('send')} ${_t("Yo'lga chiqdi")}</button>` : ''}${['accepted', 'shipped'].includes(o.status) ? `<button class="btn" data-st="delivered">${ic('package')} ${pickup ? _t("Topshirildi, pul olindi") : _t('Topshirildi')}</button>` : ''}${o.owed > 0 ? `<button class="btn ghost" id="cash">${ic('banknote')} ${_t("Naqd to'lov")}</button>` : ''}${['accepted', 'shipped'].includes(o.status) ? `<button class="btn ghost red" data-st="cancelled">${ic('ban')} ${_t('Bekor qilish')}</button>` : ''}</div>`);
  const done = (msg) => { s.close(); toast(msg, 'ok'); if (reload) reload(); };
  s.el.addEventListener('click', async (e) => {
    const lb = e.target.closest('[data-lb]'); if (lb) return lightbox(lb.dataset.lb);
    const b = e.target.closest('[data-act]'), t = e.target.closest('[data-st]');
    if (b) {
      if (b.dataset.act === 'reject' && !(await askReject(o))) return;
      busy(b, async () => { await decide(o.id, b.dataset.p, b.dataset.act); done(b.dataset.act === 'confirm' ? _t('Tasdiqlandi') : _t('Rad etildi')); });
    } else if (t) {
      const to = t.dataset.st;
      if (to === 'cancelled' && !(await confirmBox(_t('Buyurtmani bekor qilish'), pickup ? _t('Buyurtma bekor qilinadi va mahsulotlar omborga qaytadi.') : _t("Mahsulotlar omborga qaytadi. To'langan pulni mijozga o'zingiz qaytarasiz."), _t('Bekor qilish'), true))) return;
      if (to === 'rejected' && !(await askReject(o))) return;
      busy(t, async () => { await setSt(o.id, to); done(STATUS[to][1]); });
    }
  });
  const ch = $('#cash', s.el);
  if (ch) ch.onclick = () => {
    const s2 = openSheet(`${sheetTitle(_t("Naqd to'lov"))}<label class="field"><span>${_t("Summa (so'm)")}</span><div class="inp np"><input id="ca" inputmode="numeric" value="${group(o.owed)}"></div><div class="hint">${_t('Qoldiq')}: ${money(o.owed)}</div></label><button class="btn block" id="cs">${ic('save')} ${_t('Saqlash')}</button>`, { cls: 'small' });
    moneyInput($('#ca', s2.el));
    $('#cs', s2.el).onclick = (e) => busy(e.currentTarget, async () => { await api(`/admin/orders/${o.id}/cash`, { method: 'POST', body: { amount: parseNum($('#ca', s2.el).value) } }); s2.close(); done(_t("Naqd to'lov qo'shildi")); });
  };
}

/* ---------- Bugun ---------- */
let todaySig = '';
async function aToday(mode) {
  const v = $('#view'), bg = mode === 'bg';
  if (!bg) v.innerHTML = skeleton();
  let ov, td;
  try { [ov, td] = await Promise.all([api('/admin/overview'), api('/admin/orders?today=1')]); } catch (e) { if (!bg && G.atab === 'today') errView(e, aToday); return; }
  if (G.atab !== 'today' || !v.isConnected) return;
  const sig = JSON.stringify([ov, td.orders.map((o) => [o.id, o.status, o.paid])]);
  if (bg && sig === todaySig) return;
  todaySig = sig;
  const tb = $('#tab-today-bdg'); if (tb) { tb.textContent = ov.pending.length; tb.hidden = !ov.pending.length; }
  v.innerHTML = `<div class="page"><div class="page-title"><h1>${_t('Bugun')}</h1><small>${fmtD(Date.now())}</small><span class="sp"></span><button class="link" id="rf">${ic('refresh-cw')} ${_t('Yangilash')}</button></div>
    <div class="tiles">${tile('inbox', _t('Bugungi zakaz'), ov.todayOrders)}${tile('coins', _t('Bugungi summa'), group(ov.todaySum))}${tile('users', _t('Mijozlar'), ov.users)}${tile('store', _t('Borib olish'), ov.pickups)}</div>
    ${!ov.products ? `<div class="start">${ic('package-plus')}<div><b>${_t("Birinchi mahsulotni qo'shing")}</b><p>${_t("Do'kon hozircha bo'sh. Rasm, o'lcham va narxni kiriting — mijozlarga darrov ko'rinadi.")}</p></div><button class="btn" id="first">${_t("Mahsulot qo'shish")}</button></div>` : ''}
    ${ov.pending.length ? `<div class="sect">${_t('Tasdiqlash kutilmoqda')} · ${ov.pending.length}</div><div class="list cols" id="pend">${ov.pending.map(({ order: o, pay: p }) => `<div class="pend" data-o="${esc(o.id)}"><div class="row"><span class="no">№${o.no}</span>${p ? chip('gd', PAY_LAB[p.purpose]) : kindChip(o)}<span class="sp"></span><b class="sm">${money(p ? p.amount : o.total)}</b></div>
      <div class="row who-row">${p && p.chek ? `<button class="chek big" data-lb="${esc(p.chek)}" aria-label="${_t("Chekni ko'rish")}"><img src="${esc(p.chek)}" alt="chek"></button>` : ''}<div><b>${esc(o.user.name)}</b><div class="dim">${esc(phoneShow(o.user.phone))} · ${esc(_t(o.user.region))}<br>${p ? METH[p.method] : _t("To'lov do'konda")} · ${fmtDT(p ? p.at : o.createdAt)}</div></div></div>
      <div class="two"><button class="btn danger sm" data-act="reject" data-p="${p ? esc(p.id) : ''}">${ic('x')} ${_t('Rad')}</button><button class="btn emerald sm" data-act="confirm" data-p="${p ? esc(p.id) : ''}">${ic('check')} ${_t('Tasdiqlash')}</button></div></div>`).join('')}</div>` : ''}
    <div class="sect">${_t('Bugungi zakazlar')} · ${td.total}</div>
    <div class="list cols" id="tl">${td.orders.length ? td.orders.map((o) => ocHtml(o, o.status === 'pending')).join('') : emptyHtml('inbox', '', _t("Bugun hali zakaz yo'q"))}</div></div>`;
  $('#rf').onclick = () => aToday();
  if ($('#first')) $('#first').onclick = () => productForm(null, () => adminGo('products'));
  bindOrderList($('#tl'), td.orders, () => aToday());
  const pend = $('#pend');
  if (pend) pend.onclick = async (e) => {
    const lb = e.target.closest('[data-lb]'); if (lb) return lightbox(lb.dataset.lb);
    const card = e.target.closest('[data-o]'); if (!card) return;
    const o = ov.pending.find((x) => x.order.id === card.dataset.o).order, b = e.target.closest('[data-act]');
    if (!b) return openAdminOrder(o, () => aToday());
    if (b.dataset.act === 'reject' && !(await askReject(o))) return;
    busy(b, async () => { await decide(o.id, b.dataset.p, b.dataset.act); toast(b.dataset.act === 'confirm' ? _t('Tasdiqlandi') : _t('Rad etildi'), 'ok'); aToday(); });
  };
}

/* ---------- Mahsulotlar + oylik foyda ---------- */
const AP = { seg: 'list', q: '', cat: 'all' };
const segHtml = (cur, opts) => `<div class="seg wide">${opts.map(([id, l]) => `<button data-s="${id}" class="${cur === id ? 'on' : ''}">${l}</button>`).join('')}</div>`;
async function aProducts() {
  const v = $('#view');
  v.innerHTML = `<div class="page">${segHtml(AP.seg, [['list', _t('Mahsulotlar')], ['months', _t('Oylik foyda')]])}<div id="pb">${'<div class="skel"></div>'.repeat(2)}</div></div>`;
  $$('.seg button', v).forEach((b) => (b.onclick = () => { AP.seg = b.dataset.s; aProducts(); }));
  if (AP.seg === 'months') return aMonths();
  let list;
  try { list = (await api('/admin/products')).products; } catch (e) { if (G.atab === 'products') errView(e, aProducts); return; }
  if (G.atab !== 'products' || AP.seg !== 'list') return;
  const cats = [{ id: 'all', label: _t('Hammasi') }, ...G.cfg.cats], pb = $('#pb');
  pb.innerHTML = `<button class="btn block" id="newp">${ic('plus')} ${_t('Yangi mahsulot')}</button>
    ${list.length ? `<div class="search gapt">${ic('search')}<input id="pq" placeholder="${_t('Mahsulot qidirish')}" aria-label="${_t('Mahsulot qidirish')}" value="${esc(AP.q)}"></div>
    <div class="chips">${cats.map((c) => `<button class="chip ${AP.cat === c.id ? 'on' : ''}" data-c="${esc(c.id)}">${esc(_t(c.label))}</button>`).join('')}</div><div class="count-line" id="pcnt"></div>` : ''}<div class="list cols" id="pl"></div>`;
  const draw = () => {
    const q = AP.q.trim().toLowerCase();
    const arr = list.filter((p) => (AP.cat === 'all' || p.cat === AP.cat) && (!q || (p.name + ' ' + p.fabric).toLowerCase().includes(q)));
    if ($('#pcnt')) $('#pcnt').textContent = _t('{0} ta · sotuvda {1}', arr.length, arr.filter((p) => p.active).length);
    $('#pl').innerHTML = arr.map((p) => `<button class="prow ${p.active ? '' : 'off'}" data-p="${esc(p.id)}"><span class="th">${coverHtml(p)}</span><span class="g"><b>${esc(p.name)}</b><small>${sizedOf(p).map((x) => `${esc(x.size)}: ${fmtNum(x.stock)}`).join(' · ') || `${_t('qoldiq')}: ${qtyStr(p.stock, p.unit)}`}</small>${p.active ? '' : `<small class="warn">${_t('yashirin')}</small>`}</span><span class="tr"><b class="gold">${group(p.price)}</b><small class="${p.stock <= 0 ? 'err' : ''}">${p.stock <= 0 ? _t('qolmagan') : `${_t('jami')} ` + qtyStr(p.stock, p.unit)}</small></span></button>`).join('')
      || (list.length ? emptyHtml('search', '', _t('Topilmadi')) : emptyHtml('package-plus', _t("Hali mahsulot yo'q"), _t("Yuqoridagi tugma orqali birinchisini qo'shing")));
  };
  draw();
  $('#newp').onclick = () => productForm(null, aProducts);
  $('#pl').onclick = (e) => { const r = e.target.closest('[data-p]'); if (r) productForm(list.find((p) => p.id === r.dataset.p), aProducts); };
  if (!list.length) return;
  $('#pq').oninput = (e) => { AP.q = e.target.value; draw(); };
  $('.chips', pb).onclick = (e) => { const b = e.target.closest('.chip'); if (!b) return; AP.cat = b.dataset.c; $$('.chip', pb).forEach((x) => x.classList.toggle('on', x === b)); draw(); };
}

const SIZE_PRESETS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '42', '44', '46', '48', '50', '52', 'Standart'];
function productForm(p, done) {
  const isNew = !p;
  const d = p || { name: '', desc: '', fabric: '', price: '', cost: '', unit: 'dona', cat: (G.cfg.cats[0] || {}).id || '', isNew: true, active: true, images: [], variants: [] };
  let images = d.images.slice(), dirty = false, loading = 0;
  let sized = isNew || d.variants.some((v) => v.size);
  let vars = d.variants.filter((v) => v.size).map((v) => ({ ...v }));
  let single = d.variants.length && !d.variants[0].size ? d.variants[0].stock : '';
  const s = openSheet(`${sheetTitle(isNew ? _t('Yangi mahsulot') : _t('Tahrirlash'))}<form id="prf" novalidate autocomplete="off">
    <div class="field"><span>${_t('Rasmlar')}</span><div class="imgs" id="imgs"></div><div class="hint">${_t("Birinchi rasm — muqova. Almashtirish uchun rasmni bosing. Ko'pi bilan 8 ta.")}</div></div>
    <label class="field"><span>${_t('Nomi')}</span><div class="inp np"><input name="name" value="${esc(d.name)}" placeholder="${_t("Adras ko'ylak")}" maxlength="80"></div></label>
    <div class="g2"><label class="field"><span>${_t("Bo'lim")}</span><div class="inp np"><select name="cat"><option value="">${_t("Bo'limsiz")}</option>${G.cfg.cats.map((c) => `<option value="${esc(c.id)}" ${d.cat === c.id ? 'selected' : ''}>${esc(_t(c.label))}</option>`).join('')}</select></div></label>
      <label class="field"><span>${_t('Matosi')}</span><div class="inp np"><input name="fabric" value="${esc(d.fabric)}" placeholder="${_t('Adras, atlas, baxmal')}" maxlength="60" list="fabrics"></div></label>
      <label class="field"><span>${_t("Narxi (so'm)")}</span><div class="inp np"><input name="price" inputmode="numeric" value="${d.price || ''}" placeholder="850 000"></div></label>
      <label class="field"><span>${_t("Tan narxi (so'm)")}</span><div class="inp np"><input name="cost" inputmode="numeric" value="${d.cost || ''}" placeholder="${_t('foyda hisobi uchun')}"></div></label></div>
    <datalist id="fabrics"><option>Adras<option>Atlas<option>Baxmal<option>Shoyi<option>Bo'z<option>Paxta</datalist>
    <div class="field"><span>${_t("O'lcham va qoldiq")}</span><div class="seg"><button type="button" data-z="1">${_t("O'lchamli")}</button><button type="button" data-z="0">${_t("O'lchamsiz")}</button></div><div id="vbox"></div></div>
    <label class="field"><span>${_t('Tavsif (ixtiyoriy)')}</span><textarea class="plain" name="desc" rows="3" maxlength="2000" placeholder="${_t('Bichimi, parvarishi, uzunligi…')}">${esc(d.desc)}</textarea></label>
    <label class="chk"><input type="checkbox" name="isNew" ${d.isNew ? 'checked' : ''}><span class="box">${ic('check')}</span><span class="t">${_t("«Yangi» belgisi bilan ko'rsatish")}</span></label>
    <label class="chk"><input type="checkbox" name="active" ${d.active ? 'checked' : ''}><span class="box">${ic('check')}</span><span class="t">${_t("Mijozlarga ko'rinsin")}</span></label>
    <button class="btn block" type="submit">${ic('save')} ${_t('Saqlash')}</button>
    ${isNew ? '' : `<button class="btn ghost red block" type="button" id="del">${ic('trash-2')} ${_t("O'chirish")}</button>`}</form>`, { guard: () => dirty });
  const f = $('#prf', s.el), el = f.elements;
  moneyInput(el.price); moneyInput(el.cost);
  f.addEventListener('input', () => { dirty = true; });

  /* rasmlar */
  const drawImgs = () => {
    $('#imgs', f).innerHTML = images.map((m, i) => `<div class="im ${i ? '' : 'main'}"><button type="button" class="pick" data-main="${i}" aria-label="${_t('Muqova qilish')}"><img src="${esc(m.thumb)}" alt=""></button>${i ? '' : `<em>${_t('Muqova')}</em>`}<button type="button" class="rm" data-rm="${i}" aria-label="${_t('Rasmni olib tashlash')}">${ic('x')}</button></div>`).join('') +
      '<div class="im wait"></div>'.repeat(loading) +
      (images.length + loading < 8 ? `<label class="im add">${ic('image-plus')}<small>${_t('Rasm')}</small><input type="file" accept="image/*" multiple aria-label="${_t("Rasm qo'shish")}"></label>` : '');
  };
  $('#imgs', f).onclick = (e) => {
    const r = e.target.closest('[data-rm]'), m = e.target.closest('[data-main]');
    if (r) images.splice(+r.dataset.rm, 1);
    else if (m && +m.dataset.main) images.unshift(images.splice(+m.dataset.main, 1)[0]);
    else return;
    dirty = true; drawImgs();
  };
  $('#imgs', f).onchange = async (e) => {
    const files = [...e.target.files].slice(0, 8 - images.length - loading);
    dirty = true; loading += files.length; drawImgs();
    for (const file of files) {
      try {
        const img = await loadImg(file);
        const r = await api('/admin/images', { method: 'POST', body: { full: shrink(img, 1500, 0.86), thumb: shrink(img, 620, 0.82) } });
        images.push(r.image);
      } catch (err) { toast(err.message, 'err'); }
      loading--; drawImgs();
    }
  };
  drawImgs();

  /* o'lchamlar */
  const vbox = $('#vbox', f);
  const drawVars = () => {
    $$('[data-z]', f).forEach((b) => b.classList.toggle('on', (b.dataset.z === '1') === sized));
    if (!sized) {
      vbox.innerHTML = `<div class="g2 gapt"><label class="field"><span>${_t('Qoldiq')}</span><div class="inp np"><input id="one" inputmode="decimal" value="${single === '' ? '' : fmtNum(single)}" placeholder="0"></div></label><label class="field"><span>${_t('Birlik')}</span><div class="inp np"><select id="unit"><option value="dona">${_t('dona')}</option><option value="metr" ${d.unit === 'metr' ? 'selected' : ''}>${_t('metr (mato)')}</option></select></div></label></div>`;
      $('#one', vbox).oninput = (e) => { single = e.target.value; };
      $('#unit', vbox).onchange = (e) => { d.unit = e.target.value; };
      return;
    }
    vbox.innerHTML = `<div class="pre-sizes">${SIZE_PRESETS.map((z) => `<button type="button" data-add="${z}" class="${vars.some((x) => x.size === z) ? 'on' : ''}">${z}</button>`).join('')}<button type="button" data-add="">+ ${_t('Boshqa')}</button></div>
      ${vars.map((x, i) => `<div class="vrow"><input class="plain" data-k="size" data-i="${i}" value="${esc(x.size)}" placeholder="${_t("O'lcham")}" aria-label="${_t("O'lcham")}" maxlength="20"><input class="plain" data-k="stock" data-i="${i}" inputmode="numeric" value="${esc(x.stock)}" placeholder="${_t('Soni')}" aria-label="${_t('Soni')}"><button type="button" class="icon-btn" data-del="${i}" aria-label="${_t("O'lchamni olib tashlash")}">${ic('trash-2')}</button></div>`).join('') || `<div class="hint">${_t("Bor o'lchamlarni tanlang, keyin har birining sonini yozing")}</div>`}`;
  };
  vbox.addEventListener('input', (e) => { const t = e.target; if (t.dataset.k) vars[+t.dataset.i][t.dataset.k] = t.value; });
  vbox.addEventListener('click', (e) => {
    const a = e.target.closest('[data-add]'), r = e.target.closest('[data-del]');
    if (a) {
      const z = a.dataset.add, at = z ? vars.findIndex((x) => x.size === z) : -1;
      if (at >= 0) vars.splice(at, 1); else vars.push({ size: z, stock: 1 });
    } else if (r) vars.splice(+r.dataset.del, 1);
    else return;
    dirty = true; drawVars();
    if (a && !a.dataset.add) { const all = $$('[data-k=size]', vbox); all[all.length - 1].focus(); }
  });
  $$('[data-z]', f).forEach((b) => (b.onclick = () => { sized = b.dataset.z === '1'; dirty = true; drawVars(); }));
  drawVars();

  f.onsubmit = (e) => {
    e.preventDefault();
    if (loading) return toast(_t('Rasmlar yuklanmoqda, biroz kuting'), 'info');
    if (!el.name.value.trim()) { toast(_t('Mahsulot nomini kiriting'), 'err'); return el.name.focus(); }
    if (!parseNum(el.price.value)) { toast(_t('Narxini kiriting'), 'err'); return el.price.focus(); }
    if (sized && !vars.length) return toast(_t("Kamida bitta o'lcham tanlang yoki «O'lchamsiz» ni bosing"), 'err');
    const body = {
      name: el.name.value, desc: el.desc.value, fabric: el.fabric.value, cat: el.cat.value, price: parseNum(el.price.value), cost: parseNum(el.cost.value),
      isNew: el.isNew.checked, active: el.active.checked, images: images.map((m) => m.id), unit: sized ? 'dona' : d.unit,
      variants: sized ? vars.map((x) => ({ size: x.size, stock: x.stock })) : [{ size: '', stock: single }]
    };
    busy($('button[type=submit]', f), async () => {
      await api(isNew ? '/admin/products' : '/admin/products/' + encodeURIComponent(p.id), { method: isNew ? 'POST' : 'PUT', body });
      dirty = false; s.close(); toast(_t('Saqlandi'), 'ok'); done();
    });
  };
  const del = $('#del', f);
  if (del) del.onclick = async () => {
    if (!(await confirmBox(_t("Mahsulotni o'chirish"), _t("«{0}» butunlay o'chiriladi. Vaqtincha olib turish uchun «Mijozlarga ko'rinsin» belgisini olib tashlash kifoya.", p.name), _t("O'chirish"), true))) return;
    busy(del, async () => { await api('/admin/products/' + encodeURIComponent(p.id), { method: 'DELETE' }); dirty = false; s.close(); toast(_t("O'chirildi"), 'ok'); done(); });
  };
}

async function aMonths() {
  let months;
  try { months = (await api('/admin/months')).months; } catch (e) { return errView(e, aProducts); }
  const pb = $('#pb');
  if (!pb || AP.seg !== 'months') return;
  pb.innerHTML = `<p class="muted lead">${_t("Foyda = sotuv − tan narxi. Hisobot o'zi yangilanib boradi.")}</p>
    <div class="list cols">${months.map((m) => `<div class="mcard"><div class="mh"><b>${monthName(m.id)}</b><span class="sp"></span><button class="icon-btn" data-r="${m.id}" aria-label="${_t('Yangilash')}">${ic('refresh-cw')}</button><button class="icon-btn red" data-d="${m.id}" aria-label="${_t("O'chirish")}">${ic('trash-2')}</button></div>
      <div class="g"><div><small>${_t('Zakazlar')}</small><b>${m.orders}</b></div><div><small>${_t('Sotuv')}</small><b>${group(m.sales)}</b></div><div><small>${_t('Foyda')}</small><b class="ok">${group(m.profit)}</b></div><div><small>${_t('Kelgan pul')}</small><b>${group(m.cash)}</b></div></div>
      ${m.noCost ? `<div class="hint warn">${_t('{0} ta sotuvda tan narxi kiritilmagan — foyda aniq emas.', m.noCost)}</div>` : ''}</div>`).join('')}</div>`;
  pb.onclick = async (e) => {
    const r = e.target.closest('[data-r]'), d = e.target.closest('[data-d]');
    if (r) busy(r, async () => { await api(`/admin/months/${r.dataset.r}/refresh`, { method: 'POST' }); toast(_t('Yangilandi'), 'ok'); aProducts(); });
    if (d && await confirmBox(_t("Hisobotni o'chirish"), _t("{0} hisoboti o'chiriladi.", monthName(d.dataset.d)), _t("O'chirish"), true)) busy(d, async () => { await api(`/admin/months/${d.dataset.d}`, { method: 'DELETE' }); aProducts(); });
  };
}

/* ---------- Tarix ---------- */
const AH = { from: '', to: '', status: 'all', q: '' };
async function aHistory() {
  const v = $('#view');
  v.innerHTML = `<div class="page"><div class="page-title"><h1>${_t('Buyurtmalar tarixi')}</h1></div>
    <div class="filters"><label class="field"><span>${_t('Dan')}</span><input class="plain" type="date" id="hf" value="${AH.from}"></label><label class="field"><span>${_t('Gacha')}</span><input class="plain" type="date" id="ht" value="${AH.to}"></label>
      <label class="field"><span>${_t('Holat')}</span><div class="inp np"><select id="hs"><option value="all">${_t('Hammasi')}</option>${Object.entries(STATUS).map(([k, x]) => `<option value="${k}">${x[1]}</option>`).join('')}<option value="pickup">${_t('Borib olish')}</option><option value="full">${_t('Online olish')}</option></select></div></label>
      <label class="field"><span>${_t('Qidiruv')}</span><div class="inp np"><input id="hq" placeholder="№, ${_t('ism, telefon')}" value="${esc(AH.q)}"></div></label></div>
    <div class="row gapb"><span class="muted" id="hsum"></span><span class="sp"></span><button class="btn ghost sm" id="csv">${ic('download')} CSV</button></div><div id="hl" class="list cols"></div></div>`;
  $('#hs').value = AH.status;
  let last = [], tm, seq = 0;
  const load = async () => {
    if (G.atab !== 'history') return;
    AH.from = $('#hf').value; AH.to = $('#ht').value; AH.status = $('#hs').value; AH.q = $('#hq').value.trim();
    const my = ++seq;
    try {
      const r = await api('/admin/orders?' + new URLSearchParams(AH));
      if (my !== seq || !$('#hl')) return;
      last = r.orders;
      $('#hsum').innerHTML = `${_t('{0} ta', r.total)} · <b class="gold">${money(r.sum)}</b>`;
      $('#hl').innerHTML = last.map((o) => ocHtml(o)).join('') || emptyHtml('file-text', '', _t('Buyurtma topilmadi'));
      bindOrderList($('#hl'), last, load);
    } catch (e) { toast(e.message, 'err'); }
  };
  ['hf', 'ht', 'hs'].forEach((id) => ($('#' + id).onchange = load));
  $('#hq').oninput = () => { clearTimeout(tm); tm = setTimeout(load, 300); };
  $('#csv').onclick = () => {
    if (!last.length) return toast(_t("Yuklash uchun buyurtma yo'q"), 'info');
    const lines = [['№', _t('Sana'), _t('Mijoz'), _t('Telefon'), _t('Viloyat'), _t('Manzil'), _t('Mahsulotlar'), _t("Summa (so'm)"), _t("To'langan"), _t('Turi'), _t('Holat')]];
    for (const o of last) lines.push([o.no, fmtDT(o.createdAt), o.user.name, o.user.phone, o.user.region, o.address, o.items.map((i) => `${i.name}${i.size ? ' ' + i.size : ''} x${i.qty}`).join(', '), o.total, o.paid, o.kind === 'pickup' ? _t('Borib olish') : o.kind === 'debt' ? _t('Nasiya') : _t('Online olish'), (STATUS[o.status] || [0, o.status])[1]]);
    // = + - @ bilan boshlangan matnni Excel formula deb o'qimasligi uchun
    const cell = (c) => { const t = String(c); return `"${(/^[=+\-@\t]/.test(t) ? "'" + t : t).replace(/"/g, '""')}"`; };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + lines.map((r) => r.map(cell).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    a.download = `buyurtmalar-${dayKeyT(Date.now())}.csv`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };
  load();
}

/* ---------- Mijozlar ---------- */
const AU = { q: '' };
async function aUsers() {
  const v = $('#view');
  v.innerHTML = `<div class="page"><div id="ub">${'<div class="skel"></div>'.repeat(2)}</div></div>`;
  try {
    const r = await api('/admin/users');
    const ub = $('#ub');
    if (!ub || G.atab !== 'users') return;
    ub.innerHTML = `<div class="search">${ic('search')}<input id="uq" placeholder="${_t('Ism, akkaunt yoki telefon')}" aria-label="${_t('Mijoz qidirish')}" value="${esc(AU.q)}"></div><div class="count-line">${_t('{0} ta mijoz', r.users.length)}</div><div class="list cols" id="ul"></div>`;
    const draw = () => {
      const q = AU.q.toLowerCase().trim();
      $('#ul').innerHTML = r.users.filter((u) => !q || `${u.name} ${u.username} ${u.phone} ${u.region}`.toLowerCase().includes(q)).map((u) => `<button class="uc" data-u="${esc(u.id)}"><span class="av">${u.avatar ? `<img src="${esc(u.avatar)}" alt="">` : initial(u.name)}</span><span class="g"><b>${esc(u.name)}${u.blocked ? ` <span class="err">${_t('bloklangan')}</span>` : ''}</b><small>@${esc(u.username)} · ${esc(phoneShow(u.phone))}</small><small>${esc(_t(u.region))}</small></span><span class="tr">${u.stats.owed > 0 ? `<b class="warn">${group(u.stats.owed)}</b><small>${_t('nasiya')}</small>` : `<b>${u.stats.orders}</b><small>${_t('buyurtma')}</small>`}</span></button>`).join('') || emptyHtml('users', '', _t("Mijoz yo'q"));
    };
    draw();
    $('#uq').oninput = (e) => { AU.q = e.target.value; draw(); };
    $('#ul').onclick = (e) => { const c = e.target.closest('[data-u]'); if (c) userSheet(c.dataset.u); };
  } catch (e) { if (G.atab === 'users') errView(e, aUsers); }
}

async function userSheet(id) {
  let r;
  try { r = await api('/admin/users/' + id); } catch (e) { return toast(e.message, 'err'); }
  const u = r.user;
  const s = openSheet(`${sheetTitle(esc(u.name))}
    <div class="kvs"><div><span>${_t('Akkaunt')}</span><b>@${esc(u.username)}</b></div><div><span>${_t('Telefon')}</span><b><a class="gold" href="${telHref(u.phone)}">${esc(phoneShow(u.phone))}</a></b></div><div><span>${_t('Manzil')}</span><b>${esc([_t(u.region), u.address].filter(Boolean).join(', '))}</b></div><div><span>${_t("Ro'yxatdan o'tgan")}</span><b>${fmtDT(u.createdAt)}</b></div>
      <div><span>Telegram</span><b>${u.tg ? _t('ulangan') : _t('ulanmagan')}</b></div><div><span>${_t('Xaridlar')}</span><b>${_t('{0} ta', u.stats.orders)} · ${money(u.stats.spent)}</b></div>${u.stats.owed ? `<div><span>${_t("Nasiya qoldig'i")}</span><b class="warn">${money(u.stats.owed)}</b></div>` : ''}</div>
    <div class="two"><button class="btn ghost sm" id="blk">${ic('ban')} ${u.blocked ? _t('Blokdan chiqarish') : _t('Bloklash')}</button><button class="btn ghost sm" id="rpw">${ic('lock')} ${_t('Yangi parol')}</button></div>
    <div class="sect">${_t('Buyurtmalari')} · ${r.orders.length}</div><div class="list" id="uo">${r.orders.map((o) => ocHtml(o)).join('') || `<p class="muted">${_t("Hali buyurtma yo'q")}</p>`}</div>`);
  bindOrderList($('#uo', s.el), r.orders, () => { s.close(); userSheet(id); });
  $('#blk', s.el).onclick = async (e) => {
    const b = e.currentTarget;
    if (!u.blocked && !(await confirmBox(_t('Mijozni bloklash'), _t("{0} do'konga kira olmaydi.", u.name), _t('Bloklash'), true))) return;
    busy(b, async () => { await api(`/admin/users/${id}/block`, { method: 'POST', body: { blocked: !u.blocked } }); s.close(); toast(u.blocked ? _t('Blokdan chiqarildi') : _t('Bloklandi'), 'ok'); aUsers(); });
  };
  $('#rpw', s.el).onclick = () => {
    const s2 = openSheet(`${sheetTitle(_t('Yangi parol'))}<label class="field"><span>${_t('Mijoz uchun yangi parol')}</span><div class="inp">${ic('lock')}<input id="np" placeholder="${_t('kamida 6 ta belgi')}"></div></label><button class="btn block" id="sv">${ic('save')} ${_t('Saqlash')}</button>`, { cls: 'small' });
    $('#sv', s2.el).onclick = (e) => busy(e.currentTarget, async () => { await api(`/admin/users/${id}/password`, { method: 'POST', body: { password: $('#np', s2.el).value } }); s2.close(); toast(_t("Parol o'zgartirildi"), 'ok'); });
  };
}

/* ---------- Sozlamalar ---------- */
async function aSettings() {
  const v = $('#view');
  v.innerHTML = skeleton(4);
  let c;
  try { c = await api('/admin/settings'); } catch (e) { if (G.atab === 'settings') errView(e, aSettings); return; }
  if (G.atab !== 'settings') return;
  let cats = c.cats.map((x) => ({ ...x }));
  const inp = (name, label, val, ph = '', mode = '') => `<label class="field"><span>${label}</span><div class="inp np"><input name="${name}" value="${esc(val)}" placeholder="${esc(ph)}" ${mode ? `inputmode="${mode}"` : ''}></div></label>`;
  const pay = (id, label) => `<div class="mcard"><div class="mh"><i class="dot" style="background:${METH_COLOR[id]}"></i><b>${label}</b></div>${inp(id + '_card', _t('Karta yoki telefon raqam'), c.pay[id].card, '8600 0000 0000 0000')}${inp(id + '_holder', _t('Qabul qiluvchi'), c.pay[id].holder)}${inp(id + '_link', _t('Havola (ixtiyoriy)'), c.pay[id].link, 'https://')}</div>`;
  v.innerHTML = `<div class="page"><div class="page-title"><h1>${_t('Sozlama')}</h1></div>
    <div class="info"><div class="it">${ic('user')}<div><small>Admin</small>${esc(G.me.username)}</div></div><div class="it">${ic('send')}<div><small>${_t('Telegram xabarnomalari')}</small>${c.telegramLinked ? `<span class="ok">${_t('ulangan')}</span>` : c.hasBot ? `<span class="warn">${_t('ulanmagan')}</span>` : `<span class="dim">${_t('bot tokeni kiritilmagan')}</span>`}</div></div></div>
    <div class="two"><button class="btn ghost sm" id="apw">${ic('lock')} ${_t('Parol')}</button><button class="btn ghost sm" id="alink" ${c.hasBot ? '' : 'disabled'}>${ic('send')} ${_t('Telegramga ulash')}</button></div>
    <form id="sf" novalidate autocomplete="off">
    <div class="sect">${_t("Bo'limlar")}</div><div id="cats"></div>
    <div class="sect">${_t("To'lov rekvizitlari")}</div><div class="list cols3">${pay('payme', 'Payme')}${pay('click', 'Click')}${pay('paynet', 'Paynet')}</div>
    <div class="sect">${_t('Aloqa')}</div>${inp('saddr', _t("Do'kon manzili (borib olish uchun)"), c.contact.address, _t("Shahar, tuman, ko'cha, mo'ljal"))}<div class="g2">${inp('phone', _t('Telefon'), c.contact.phone, '+998 90 123 45 67', 'tel')}${inp('wa', _t('WhatsApp raqam'), c.contact.whatsapp, '998901234567', 'tel')}${inp('tgu', 'Telegram', c.contact.telegram, 'username')}${inp('ig', 'Instagram', c.contact.instagram, 'username')}</div>
    <button class="btn block" type="submit">${ic('save')} ${_t('Saqlash')}</button></form>
    <button class="btn ghost block out" id="lo">${ic('log-out')} ${_t('Chiqish')}</button></div>`;
  const cb = $('#cats');
  const drawCats = () => { cb.innerHTML = cats.map((x, i) => `<div class="vrow one"><input class="plain" data-i="${i}" value="${esc(x.label)}" maxlength="40" placeholder="${_t("Bo'lim nomi")}" aria-label="${_t("Bo'lim nomi")}"><button type="button" class="icon-btn" data-del="${i}" aria-label="${_t("Bo'limni olib tashlash")}">${ic('trash-2')}</button></div>`).join('') + `<button type="button" class="btn ghost sm" id="addc">${ic('plus')} ${_t("Bo'lim qo'shish")}</button>`; };
  drawCats();
  cb.oninput = (e) => { if (e.target.dataset.i) cats[+e.target.dataset.i].label = e.target.value; };
  cb.onclick = (e) => {
    const d = e.target.closest('[data-del]');
    if (d) { cats.splice(+d.dataset.del, 1); drawCats(); }
    else if (e.target.closest('#addc')) { cats.push({ id: '', label: '' }); drawCats(); const all = $$('input', cb); all[all.length - 1].focus(); }
  };
  $('#apw').onclick = changePassword;
  $('#lo').onclick = async () => { if (await confirmBox(_t('Chiqish'), _t('Admin paneldan chiqasizmi?'), _t('Chiqish'))) G.logout(); };
  $('#alink').onclick = (e) => busy(e.currentTarget, async () => {
    const r = await api('/admin/link-code', { method: 'POST' });
    openSheet(`${sheetTitle(_t('Telegramga ulash'))}<p class="muted lead">${_t("Botga quyidagi xabarni yuboring ({0} daqiqa amal qiladi). Shundan keyin yangi buyurtma va cheklar o'sha chatga keladi.", r.minutes)}</p><div class="req"><div class="card-no gold">/admin ${esc(r.code)}</div></div>`, { cls: 'small' });
  });
  const f = $('#sf');
  f.onsubmit = (e) => {
    e.preventDefault();
    const g = (n) => f.elements[n].value;
    busy($('button[type=submit]', f), async () => {
      const r = await api('/admin/settings', { method: 'PUT', body: {
        cats, pay: Object.fromEntries(['payme', 'click', 'paynet'].map((k) => [k, { card: g(k + '_card'), holder: g(k + '_holder'), link: g(k + '_link') }])),
        contact: { address: g('saddr'), phone: g('phone'), whatsapp: g('wa'), telegram: g('tgu'), instagram: g('ig') }
      } });
      cats = r.cats.map((x) => ({ ...x })); drawCats();
      G.cfg = await api('/config'); toast(_t('Sozlamalar saqlandi'), 'ok');
    });
  };
}

G.adminViews = { today: () => aToday(), history: aHistory, products: aProducts, users: aUsers, settings: aSettings };
