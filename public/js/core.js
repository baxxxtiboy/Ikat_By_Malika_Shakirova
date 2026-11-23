'use strict';
/* ===== Umumiy yordamchilar: holat, API, oynalar, formatlar ===== */
const G = {
  cfg: null, me: null, token: null, products: [], pmap: {}, cart: {},
  tab: 'shop', cat: 'all', q: '', atab: 'today', keep: KEEP,
  tg: window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData ? window.Telegram.WebApp : null
};
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ic = (n, c = '') => `<svg class="ic ${c}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const LS = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* */ } }
};

/* ---------- formatlar ---------- */
const group = (n) => String(Math.round(+n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const money = (n) => group(n) + ` ${_t("so'm")}`;
const priceHtml = (n, unit) => `<span class="price">${group(n)}<small>${_t("so'm")}${unit === 'metr' ? ' / m' : ''}</small></span>`;
const fmtNum = (n) => String(Math.round((+n + Number.EPSILON) * 100) / 100).replace('.', ',');
const unitOf = (u) => _t(u === 'metr' ? 'm' : 'dona');
const qtyStr = (q, u) => fmtNum(q) + ' ' + unitOf(u);
const stepOf = (p) => (p.unit === 'metr' ? 0.5 : 1);
const clampR = (n) => Math.round(n * 100) / 100;
const parseNum = (v) => parseFloat(String(v).replace(/\s/g, '').replace(',', '.')) || 0;

const dtf = new Intl.DateTimeFormat('ru-RU', { timeZone: 'Asia/Tashkent', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
const df = new Intl.DateTimeFormat('ru-RU', { timeZone: 'Asia/Tashkent', day: '2-digit', month: '2-digit', year: 'numeric' });
const fmtDT = (t) => (t ? dtf.format(t).replace(',', '') : '—');
const fmtD = (t) => (t ? df.format(t) : '—');
const dayKeyT = (t) => new Date(t + 5 * 3600e3).toISOString().slice(0, 10);
const MONTHS = [_t('Yanvar'), _t('Fevral'), _t('Mart'), _t('Aprel'), _t('May'), _t('Iyun'), _t('Iyul'), _t('Avgust'), _t('Sentabr'), _t('Oktabr'), _t('Noyabr'), _t('Dekabr')];
const monthName = (ym) => MONTHS[+ym.slice(5, 7) - 1] + ' ' + ym.slice(0, 4);

function hap(kind = 'light') {
  try { if (G.tg && G.tg.HapticFeedback) { if (kind === 'ok') G.tg.HapticFeedback.notificationOccurred('success'); else if (kind === 'err') G.tg.HapticFeedback.notificationOccurred('error'); else G.tg.HapticFeedback.impactOccurred(kind); } } catch { /* */ }
}

/* ---------- API ---------- */
async function api(path, opt = {}) {
  let r;
  try {
    r = await fetch('/api' + path, {
      method: opt.method || 'GET',
      headers: { 'Content-Type': 'application/json', ...(G.token ? { Authorization: 'Bearer ' + G.token } : {}) },
      body: opt.body ? JSON.stringify(opt.body) : undefined
    });
  } catch { throw new Error(_t("Internet aloqasi yo'q yoki server javob bermayapti")); }
  let j = {};
  try { j = await r.json(); } catch { /* bo'sh javob */ }
  if (!r.ok) {
    if (r.status === 401 && j.code === 'auth' && G.token && G.me) G.logout(true);
    throw Object.assign(new Error(_tErr(j.error || _t('Xatolik yuz berdi'))), { status: r.status });
  }
  return j;
}
/** Tugmani "ishlayapti" holatiga o'tkazib amalni bajaradi; xato bo'lsa xabar chiqaradi */
async function busy(btn, fn) {
  btn.classList.add('spin'); btn.disabled = true;
  try { return await fn(); }
  catch (e) { toast(e.message, 'err'); }
  finally { btn.classList.remove('spin'); btn.disabled = false; }
}

/* ---------- Toast ---------- */
function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = ic(type === 'err' ? 'circle-alert' : type === 'ok' ? 'circle-check' : 'info') + `<span>${esc(msg)}</span>`;
  $('#toasts').appendChild(el);
  hap(type === 'err' ? 'err' : 'light');
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 260); }, type === 'err' ? 3800 : 2200);
}

/* ---------- Oyna (pastdan chiquvchi) ---------- */
const sheets = [];
function openSheet(html, { cls = '', onClose, guard } = {}) {
  const back = document.createElement('div');
  back.className = 'sheet-back';
  back.innerHTML = `<div class="sheet ${cls}" role="dialog" aria-modal="true" tabindex="-1"><div class="sheet-grab"></div><div class="sheet-body">${html}</div></div>`;
  document.body.appendChild(back);
  document.body.classList.add('noscroll');
  const prev = document.activeElement;
  requestAnimationFrame(() => requestAnimationFrame(() => { back.classList.add('show'); back.firstChild.focus({ preventScroll: true }); }));
  let closed = false;
  const s = {
    root: back, el: back.querySelector('.sheet-body'),
    close() {
      if (closed) return;
      closed = true;
      sheets.splice(sheets.indexOf(s), 1);
      back.classList.remove('show');
      if (!sheets.length) document.body.classList.remove('noscroll');
      setTimeout(() => back.remove(), 300);
      if (prev && prev.isConnected) prev.focus({ preventScroll: true });
      if (onClose) onClose();
    },
    async ask() { if (!guard || !guard() || await confirmBox(_t('Yopish'), _t("Kiritilgan ma'lumotlar saqlanmaydi."), _t('Yopish'), true)) s.close(); }
  };
  sheets.push(s);
  back.addEventListener('click', (e) => { if (e.target === back) s.ask(); });
  s.el.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) s.ask(); });
  return s;
}
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const lb = $('.lightbox');
  if (lb) lb.remove(); else if (sheets.length) sheets[sheets.length - 1].ask();
});
const sheetTitle = (t) => `<div class="sh-title"><span>${t}</span><button class="x" data-close aria-label="${_t('Yopish')}">${ic('x')}</button></div>`;

function confirmBox(title, text, ok = _t('Ha'), danger = false) {
  return new Promise((resolve) => {
    let val = false;
    const s = openSheet(`${sheetTitle(esc(title))}<p class="muted lead">${esc(text)}</p>
      <div class="two"><button class="btn ghost" data-close>${_t('Bekor')}</button><button class="btn ${danger ? 'danger' : ''}" id="cf-ok">${esc(ok)}</button></div>`,
    { cls: 'small', onClose: () => resolve(val) });
    $('#cf-ok', s.el).onclick = () => { val = true; s.close(); };
  });
}

function lightbox(src) {
  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.innerHTML = `<img src="${esc(src)}" alt=""><button class="x" aria-label="${_t('Yopish')}">${ic('x')}</button>`;
  lb.onclick = () => lb.remove();
  document.body.appendChild(lb);
}

/* ---------- Rasmni kichraytirish ---------- */
function loadImg(file) {
  return new Promise((resolve, reject) => {
    if (!file || !/^image\//.test(file.type)) return reject(new Error(_t('Faqat rasm fayli tanlang')));
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error(_t('Bu rasm formati ochilmadi. JPG yoki PNG tanlang'))); };
    img.src = url;
  });
}
function shrink(img, max, q) {
  const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(img.naturalWidth * k)); c.height = Math.max(1, Math.round(img.naturalHeight * k));
  const x = c.getContext('2d');
  x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
  x.imageSmoothingQuality = 'high';
  x.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', q);
}
const readImage = async (file, max = 1280, q = 0.82) => shrink(await loadImg(file), max, q);

/* ---------- Kichik UI bo'laklari ---------- */
const brandHtml = (tag) => `<header class="head"><div class="head-in"><button class="brand" data-home aria-label="${_t('Bosh sahifa')}"><img src="/img/mark.webp" width="360" height="360" alt=""><span><b>IKAT</b><small>by Malika Shakirova</small></span></button><span class="head-r">${tag ? `<span class="tag">${tag}</span>` : ''}${langHtml()}</span></div></header>`;
const orn = '<div class="orn" aria-hidden="true"></div>';
const emptyHtml = (icon, title, text = '', extra = '') => `<div class="empty">${ic(icon)}${title ? `<h3>${title}</h3>` : ''}${text ? `<p>${text}</p>` : ''}${extra}</div>`;

function phoneInput(el) {
  el.addEventListener('input', () => {
    let d = el.value.replace(/\D/g, '');
    if (d.startsWith('998') && d.length > 9) d = d.slice(3);
    d = d.slice(0, 9);
    el.value = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(' ');
  });
}
/** Narx maydoni: yozayotganda 1 250 000 ko'rinishida bo'ladi */
function moneyInput(el) {
  const f = () => { const d = el.value.replace(/\D/g, '').slice(0, 11); el.value = d ? group(d) : ''; };
  el.addEventListener('input', f); f();
}
const phoneShow = (p) => (p ? p.replace(/^\+998(\d{2})(\d{3})(\d{2})(\d{2})$/, '+998 $1 $2 $3 $4') : '—');
const telHref = (p) => 'tel:' + esc(String(p || '').replace(/[^\d+]/g, ''));
const initial = (n) => esc((n || '?').trim().charAt(0).toUpperCase());

const STATUS = {
  pending: ['wt', _t('Tekshirilmoqda')], accepted: ['ok', _t('Qabul qilindi')], shipped: ['gd', _t("Yo'lda")], delivered: ['ok', _t('Topshirildi')],
  rejected: ['er', _t('Rad etildi')], cancelled: ['er', _t('Bekor qilindi')]
};
const chip = (cls, text) => `<span class="st-chip ${cls}">${text}</span>`;
const stChip = (o) => chip(...(STATUS[o.status] || ['gr', esc(o.status)]));
const kindChip = (o) => (o.kind === 'pickup' ? chip('gd', `${ic('store')} ${_t('Borib olish')}`) : o.kind === 'debt' ? chip('gd', `${ic('wallet')} ${_t('Nasiya')}`) : chip('gr', `${ic('send')} ${_t('Online olish')}`));
const METH = { payme: 'Payme', click: 'Click', paynet: 'Paynet', naqd: _t('Naqd') };
const METH_COLOR = { payme: '#33cccc', click: '#2a90ff', paynet: '#ffcb05' };
const PAY_ST = { pending: ['wt', _t('Tekshiruvda')], confirmed: ['ok', _t('Tasdiqlandi')], rejected: ['er', _t('Rad etildi')] };
const PAY_LAB = { full: _t("To'liq to'lov"), down: _t("Boshlang'ich to'lov"), repay: _t("Nasiya to'lovi") };

/** Buyurtma hisobi */
function billHtml(rows, total) {
  return `<div class="bill"><div class="bill-band"></div><table><thead><tr><th>${_t('Mahsulot')}</th><th class="r">${_t('Narx')}</th><th class="r">${_t('Soni')}</th><th class="r">${_t('Summa')}</th></tr></thead>
    <tbody>${rows.map((r) => `<tr><td><b>${esc(r.name)}</b>${r.size ? `<i class="sz">${esc(r.size)}</i>` : ''}</td><td class="r">${group(r.price)}</td><td class="r">${fmtNum(r.qty)}${r.unit === 'metr' ? ' m' : ''}</td><td class="r"><b>${group(r.sum)}</b></td></tr>`).join('')}</tbody>
    <tfoot><tr><td>${_t('Jami')}</td><td class="r" colspan="3">${money(total)}</td></tr></tfoot></table></div>`;
}
