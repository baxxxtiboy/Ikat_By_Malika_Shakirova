'use strict';
/**
 * Ikat by Malika Shakirova — server (Express) + Telegram bot.
 * Bitta jarayon: veb-do'kon (public/), API (/api/*), bot webhook (/tg/*).
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// .env faylini (agar bor bo'lsa) o'qiydi
try {
  const f = path.join(__dirname, '..', '.env');
  if (fs.existsSync(f)) {
    for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
      if (/^\s*#/.test(line)) continue;
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^(["'])(.*)\1$/, '$2');
    }
  }
} catch { /* .env bo'lmasa ham ishlayveradi */ }

const express = require('express');
const { Store } = require('./store');
const U = require('./util');
const createBot = require('./bot');

const PORT = Number(process.env.PORT) || 3000;
const NAME = 'Ikat by Malika Shakirova';
const DAY = 86400e3;
const METHODS = { payme: 'Payme', click: 'Click', paynet: 'Paynet' };
const LIVE = ['accepted', 'shipped', 'delivered'];          // qabul qilingan buyurtma holatlari
const DEFAULT_CATS = [
  { id: 'koylak', label: "Ko'ylaklar" }, { id: 'chopon', label: 'Chopon va kardiganlar' }, { id: 'bluzka', label: 'Bluzkalar' },
  { id: 'kostyum', label: 'Kostyumlar' }, { id: 'mato', label: 'Matolar' }, { id: 'aksessuar', label: 'Aksessuarlar' }
];
const DEFAULT_CONSENT = "Roziman: qolgan summani belgilangan muddat ichida to'liq to'layman.";

const store = new Store();
let ready = false;      // baza ulandi va ma'lumotlar yuklandi
let bootError = '';     // ulanmagan bo'lsa — sababi (sahifada ko'rsatiladi)
let S;                  // sozlamalar hujjati (settings/main)
let SECRET;             // token va fayl imzolari uchun
const now = () => Date.now();
const bad = (msg, status = 400) => Object.assign(new Error(msg), { status });
const str = (v, max = 200) => String(v ?? '').trim().slice(0, max);
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const unitLabel = (u) => (u === 'metr' ? 'm' : 'dona');
const callUs = () => (S.contact.phone ? ` Aloqa: ${S.contact.phone}` : '');
const hex = (n) => crypto.randomBytes(n).toString('hex');

/* ---------------------------------------------------------------- fayllar */
const sign = (s) => crypto.createHmac('sha256', SECRET).update('file:' + s).digest('base64url').slice(0, 22);
const fileUrl = (id) => (id ? `/api/file/${id}?s=${sign(id)}` : null);

function parseImage(dataUrl, maxBytes = 3e6) {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl || ''));
  if (!m) throw bad("Rasm noto'g'ri formatda (JPG/PNG)");
  const buf = Buffer.from(m[2], 'base64');
  if (!buf.length || buf.length > maxBytes) throw bad('Rasm juda katta (3 MB dan oshmasin)');
  return { buf, mime: m[1] };
}
async function saveImage(dataUrl, maxBytes) {
  const { buf, mime } = parseImage(dataUrl, maxBytes);
  const id = U.uid();
  await store.saveFile(id, buf, mime);
  return id;
}

// Katalog rasmlari tez ochilishi uchun kichik xotira keshi (48 MB)
const cache = new Map();
let cacheSize = 0;
async function readFile(id) {
  const hit = cache.get(id);
  if (hit) { cache.delete(id); cache.set(id, hit); return hit; }
  const f = await store.getFile(id);
  if (f && f.buf.length < 4e6) {
    cache.set(id, f); cacheSize += f.buf.length;
    for (const [k, v] of cache) { if (cacheSize <= 48e6) break; cache.delete(k); cacheSize -= v.buf.length; }
  }
  return f;
}
function dropFile(id) {
  if (!id) return;
  const hit = cache.get(id);
  if (hit) { cache.delete(id); cacheSize -= hit.buf.length; }
  store.delFile(id);
}

/* ---------------------------------------------------------------- so'rov chegarasi */
const rl = new Map();
function limit(req, key, max, windowMs = 10 * 60e3) {
  const k = key + ':' + req.ip, t = now();
  const arr = (rl.get(k) || []).filter((x) => t - x < windowMs);
  if (arr.length >= max) throw bad("Juda ko'p urinish. Birozdan so'ng qayta urinib ko'ring.", 429);
  arr.push(t);
  rl.set(k, arr);
}
setInterval(() => { const t = now(); for (const [k, v] of rl) if (!v.some((x) => t - x < 600e3)) rl.delete(k); }, 600e3).unref();

/* ---------------------------------------------------------------- ko'rinishlar */
const findUser = (username) => store.list('users').find((u) => u.username.toLowerCase() === String(username).toLowerCase());
const userOut = (u) => ({
  id: u.id, username: u.username, name: u.name, phone: u.phone, region: u.region, address: u.address || '',
  role: u.role, avatar: fileUrl(u.avatar), createdAt: u.createdAt
});
const stockOf = (p) => U.r2(p.variants.reduce((s, v) => s + v.stock, 0));
const imgOut = (p) => (p.images || []).map((i) => ({ id: i.f, full: fileUrl(i.f), thumb: fileUrl(i.t || i.f) }));
const productOut = (p) => ({
  id: p.id, name: p.name, desc: p.desc || '', fabric: p.fabric || '', price: p.price, unit: p.unit, cat: p.cat, isNew: !!p.isNew,
  variants: p.variants.map((v) => ({ size: v.size, stock: v.stock })), stock: stockOf(p), images: imgOut(p)
});
const byNewest = (a, b) => b.createdAt - a.createdAt;

const paidOf = (o) => U.r0(o.payments.filter((p) => p.status === 'confirmed').reduce((s, p) => s + p.amount, 0));
const owedOf = (o) => (o.kind === 'debt' && LIVE.includes(o.status) ? Math.max(0, U.r0(o.total - paidOf(o))) : 0);
const isActiveDebt = (o) => o.kind === 'debt' && (o.status === 'pending' || owedOf(o) > 0);
const activeDebts = (uid) => store.list('orders').filter((o) => o.userId === uid && isActiveDebt(o));

function orderOut(o, admin = false) {
  const out = {
    id: o.id, no: o.no, createdAt: o.createdAt, acceptedAt: o.acceptedAt || null, status: o.status, kind: o.kind,
    total: o.total, paid: paidOf(o), owed: owedOf(o), comment: o.comment || '', address: o.address || '', debt: o.debt || null,
    items: o.items.map(({ cost, ...i }) => i),
    payments: o.payments.map((p) => ({
      id: p.id, amount: p.amount, method: p.method, purpose: p.purpose, status: p.status, at: p.at,
      decidedAt: p.decidedAt || null, chek: fileUrl(p.file), note: p.note || ''
    }))
  };
  if (admin) { out.userId = o.userId; out.user = o.userSnap; }
  return out;
}

/* ---------------------------------------------------------------- kirish */
// Parol o'zgarsa eski tokenlar bekor bo'ladi (v — parol xeshining bir bo'lagi)
const passMark = (u) => crypto.createHash('sha256').update(u.pass).digest('hex').slice(0, 10);
const makeToken = (u) => U.signToken({ uid: u.id, v: passMark(u), exp: now() + 30 * DAY }, SECRET);

function auth(role) {
  return (req, res, next) => {
    const p = U.verifyToken((req.headers.authorization || '').replace(/^Bearer\s+/i, ''), SECRET);
    const u = p && store.get('users', p.uid);
    if (!u || p.v !== passMark(u)) return res.status(401).json({ error: 'Qaytadan kiring', code: 'auth' });
    if (u.blocked) return res.status(403).json({ error: 'Akkaunt bloklangan.' + callUs(), code: 'blocked' });
    if (role === 'admin' && u.role !== 'admin') return res.status(403).json({ error: "Ruxsat yo'q" });
    req.user = u;
    next();
  };
}

/** Mini App ichidan kirilgan bo'lsa — Telegram ID'ni akkauntga bog'laydi (xabarnomalar uchun) */
async function linkTelegram(u, initData) {
  const tgu = bot.verifyInitData(initData);
  if (!tgu || !tgu.id) return;
  if (u.tgId !== tgu.id) { u.tgId = tgu.id; await store.put('users', u); }
  if (u.role === 'admin' && String(S.adminChat) !== String(tgu.id)) { S.adminChat = tgu.id; await store.put('settings', S); }
}

/* ---------------------------------------------------------------- oylik hisobot */
async function refreshMonth(ym) {
  const prev = store.get('months', ym) || { id: ym, clearedAt: 0 };
  const from = prev.clearedAt || 0;
  let orders = 0, sales = 0, cost = 0, cash = 0, noCost = 0;
  for (const o of store.list('orders')) {
    if (!LIVE.includes(o.status)) continue;
    if (o.acceptedAt > from && U.monthKey(o.acceptedAt) === ym) {
      orders++; sales += o.total;
      for (const it of o.items) { cost += (it.cost || 0) * it.qty; if (!it.cost) noCost++; }
    }
    for (const p of o.payments) if (p.status === 'confirmed' && p.decidedAt > from && U.monthKey(p.decidedAt) === ym) cash += p.amount;
  }
  await store.put('months', {
    ...prev, id: ym, orders, sales: U.r0(sales), cost: U.r0(cost), profit: U.r0(sales - cost), cash: U.r0(cash),
    noCost, hidden: !(orders || cash), updatedAt: now()
  });
}

/* ---------------------------------------------------------------- ombor */
async function restoreStock(o) {
  for (const it of o.items) {
    const p = store.get('products', it.pid);
    const v = p && p.variants.find((x) => x.size === it.size);
    if (v) { v.stock = U.r2(v.stock + it.qty); await store.put('products', p); }
  }
}

function tellUser(o, msg) {
  const u = store.get('users', o.userId);
  if (u && u.tgId) bot.notifyUser(u.tgId, msg);
}

/* ---------------------------------------------------------------- to'lovni tasdiqlash / rad etish */
async function decidePayment(orderId, payId, action) {
  const o = store.get('orders', String(orderId));
  if (!o) throw bad('Buyurtma topilmadi', 404);
  const p = o.payments.find((x) => x.id === payId);
  if (!p) throw bad("To'lov topilmadi", 404);
  if (p.status !== 'pending') throw bad("Bu to'lov allaqachon ko'rib chiqilgan");
  if (!['confirm', 'reject'].includes(action)) throw bad("Noto'g'ri amal");
  const first = p.purpose !== 'repay';
  p.decidedAt = now();
  let msg;
  if (action === 'confirm') {
    p.status = 'confirmed';
    if (first) {
      o.status = 'accepted'; o.acceptedAt = now();
      if (o.kind === 'debt') o.debt.dueAt = now() + o.debt.days * DAY;
    }
    const owed = owedOf(o);
    if (first) {
      msg = o.kind === 'debt'
        ? `✅ <b>Buyurtma №${o.no} qabul qilindi!</b>\nBoshlang'ich to'lov tasdiqlandi. Qolgan summa: <b>${U.money(owed)}</b> (muddat: ${o.debt.days} kun).`
        : `✅ <b>Buyurtma №${o.no} qabul qilindi!</b>\nTo'lovingiz tasdiqlandi. Rahmat! ✨`;
    } else {
      msg = owed > 0
        ? `✅ To'lov tasdiqlandi: ${U.money(p.amount)}.\n№${o.no} bo'yicha qolgan summa: <b>${U.money(owed)}</b>`
        : `🎉 №${o.no} bo'yicha nasiya <b>to'liq yopildi</b>. Rahmat!`;
    }
  } else {
    p.status = 'rejected';
    if (first && o.status === 'pending') { o.status = 'rejected'; await restoreStock(o); }
    msg = first
      ? `❌ <b>Buyurtma №${o.no} bekor qilindi.</b>\nTo'lov cheki tasdiqlanmadi.${callUs()}`
      : `❌ №${o.no} bo'yicha to'lov cheki tasdiqlanmadi. Qayta yuboring.${callUs()}`;
  }
  await store.put('orders', o);
  if (action === 'confirm') await refreshMonth(U.monthKey(now()));
  tellUser(o, msg);
  return o;
}

/* ---------------------------------------------------------------- bot */
const adminChat = () => S.adminChat || U.env('ADMIN_CHAT_ID') || null;
const bot = createBot({
  botName: () => S.botName,
  verifyLinkCode: (code) => !!(S.linkCode && S.linkCode.exp > now() && code && U.safeEq(S.linkCode.code, String(code).trim().toUpperCase())),
  setAdminChat: async (chat) => { S.adminChat = chat; S.linkCode = null; await store.put('settings', S); },
  isAdminChat: (chat) => !!adminChat() && String(chat) === String(adminChat()),
  adminChat, decidePayment
});

async function notifyPayment(o, p, title) {
  const x = o.userSnap, e = bot.esc;
  const lines = o.items.slice(0, 12).map((i) => `• ${e(i.name)}${i.size ? ` — <b>${e(i.size)}</b>` : ''} × ${i.qty} ${unitLabel(i.unit)} = ${U.money(i.sum)}`);
  if (o.items.length > 12) lines.push(`…va yana ${o.items.length - 12} ta`);
  const kind = p.purpose === 'full' ? "To'liq to'lov" : p.purpose === 'down' ? `Nasiya — boshlang'ich ${o.debt.percent}%` : "Nasiya to'lovi";
  const text =
    `${title}\n👤 ${e(x.name)} (@${e(x.username)})\n📞 ${e(x.phone)}\n📍 ${e(x.region)}${o.address ? ', ' + e(o.address) : ''}\n\n${lines.join('\n')}` +
    `\n\n🧾 Jami: <b>${U.money(o.total)}</b>\n💳 ${kind}: <b>${U.money(p.amount)}</b> (${METHODS[p.method] || p.method})` +
    (o.comment ? `\n💬 ${e(o.comment)}` : '') + (p.note ? `\n💬 ${e(p.note)}` : '');
  const f = p.file ? await store.getFile(p.file) : null;
  await bot.notifyAdmin(text, { pay: { orderId: o.id, payId: p.id }, chek: f });
}

/* ---------------------------------------------------------------- Express */
const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use((req, res, next) => { res.set({ 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin' }); next(); });
app.use(express.json({ limit: '6mb' }));

app.get('/healthz', (req, res) => res.json({ ok: ready, db: ready ? 'ok' : bootError ? 'xato' : 'ulanmoqda' }));

// Baza ulanmaguncha hamma narsa shu yerda to'xtaydi: sabab sahifaning o'zida ko'rinadi
app.use((req, res, next) => {
  if (ready) return next();
  const msg = bootError || 'Server ishga tushmoqda…';
  if (req.path.startsWith('/api/') || req.path.startsWith('/tg/')) return res.status(503).json({ error: msg });
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  res.status(503).set('Retry-After', '10').type('html').send(
    `<!doctype html><html lang="uz"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="10">` +
    `<title>${NAME}</title><body style="margin:0;background:#050807;color:#e9dfc4;font:15px/1.6 system-ui,sans-serif;padding:24px">` +
    `<h2 style="color:#d4af37;margin:0 0 12px;font-weight:600">${NAME}</h2>` +
    `<pre style="white-space:pre-wrap;background:#0b1511;border:1px solid #1d4a39;border-radius:12px;padding:16px;margin:0">${esc(msg)}</pre>` +
    `<p style="opacity:.6">Sahifa har 10 soniyada yangilanadi.</p></body></html>`
  );
});

app.post('/tg/:key', (req, res) => {
  if (!bot.checkHook(req.params.key, req.get('x-telegram-bot-api-secret-token'))) return res.sendStatus(403);
  res.sendStatus(200);
  bot.handleUpdate(req.body || {}).catch((e) => console.error('Bot:', e.message));
});

app.get('/api/file/:id', wrap(async (req, res) => {
  if (!U.safeEq(req.query.s || '', sign(req.params.id))) return res.sendStatus(403);
  const f = await readFile(req.params.id);
  if (!f) return res.sendStatus(404);
  res.set({ 'Content-Type': f.mime, 'Cache-Control': 'private, max-age=31536000, immutable' }).send(f.buf);
}));

/* ---- ochiq */
app.get('/api/config', (req, res) => {
  res.json({
    botName: S.botName, regions: U.REGIONS, cats: S.cats, debt: S.debt, contact: S.contact,
    methods: Object.entries(METHODS).map(([id, label]) => ({ id, label }))
  });
});

const NAME_RE = /^[a-zA-Z0-9._]{3,20}$/;
app.get('/api/username-free', wrap(async (req, res) => {
  limit(req, 'uname', 120);
  const u = str(req.query.u, 20);
  res.json({ valid: NAME_RE.test(u), free: !findUser(u) });
}));

function checkProfile(b) {
  const name = str(b.name, 60), phone = U.normPhone(b.phone), region = str(b.region, 40), address = str(b.address, 200);
  if (name.length < 2) throw bad('Ismingizni kiriting');
  if (!phone) throw bad("Telefon raqam noto'g'ri (9 ta raqam kiriting)");
  if (!U.REGIONS.includes(region)) throw bad('Viloyatni tanlang');
  return { name, phone, region, address };
}
function checkNewPass(pw) {
  pw = String(pw ?? '');
  if (pw.length < 6) throw bad("Parol kamida 6 ta belgidan iborat bo'lsin");
  if (pw.length > 64) throw bad('Parol juda uzun');
  return pw;
}

app.post('/api/register', wrap(async (req, res) => {
  limit(req, 'reg', 12);
  const b = req.body || {}, username = str(b.username, 20);
  if (!NAME_RE.test(username)) throw bad('Akkaunt nomi 3–20 ta belgi: lotin harflari, raqam, nuqta yoki _');
  const prof = checkProfile(b);
  const pass = await U.hashPassword(checkNewPass(b.password));
  if (findUser(username)) throw bad('Bu akkaunt nomi band, boshqasini tanlang');
  const u = { id: U.uid(), username, ...prof, role: 'user', pass, avatar: null, createdAt: now(), tgId: null, blocked: false, consent: null };
  await store.put('users', u);
  await linkTelegram(u, b.initData);
  res.json({ token: makeToken(u), user: userOut(u) });
}));

app.post('/api/login', wrap(async (req, res) => {
  limit(req, 'login', 25);
  const b = req.body || {}, u = findUser(str(b.username, 20));
  if (!u || !(await U.checkPassword(b.password, u.pass))) throw bad("Akkaunt nomi yoki parol noto'g'ri", 401);
  if (u.blocked) throw bad('Akkaunt bloklangan.' + callUs(), 403);
  await linkTelegram(u, b.initData);
  res.json({ token: makeToken(u), user: userOut(u) });
}));

/* ---- mijoz */
app.get('/api/me', auth(), (req, res) => res.json({ user: userOut(req.user) }));

app.put('/api/me', auth(), wrap(async (req, res) => {
  const u = req.user, b = req.body || {}, prof = checkProfile(b);
  const nu = str(b.username, 20);
  if (nu && nu !== u.username) {
    if (u.role === 'admin') throw bad("Admin nomini o'zgartirib bo'lmaydi");
    if (!NAME_RE.test(nu)) throw bad('Akkaunt nomi 3–20 ta belgi: lotin harflari, raqam, nuqta yoki _');
    const ex = findUser(nu);
    if (ex && ex.id !== u.id) throw bad('Bu akkaunt nomi band');
    u.username = nu;
  }
  Object.assign(u, prof);
  await store.put('users', u);
  res.json({ user: userOut(u) });
}));

app.post('/api/me/password', auth(), wrap(async (req, res) => {
  limit(req, 'pw', 10);
  const b = req.body || {};
  if (!(await U.checkPassword(b.old, req.user.pass))) throw bad("Eski parol noto'g'ri");
  req.user.pass = await U.hashPassword(checkNewPass(b.password));
  await store.put('users', req.user);
  res.json({ ok: true, token: makeToken(req.user) });
}));

app.post('/api/me/avatar', auth(), wrap(async (req, res) => {
  limit(req, 'ava', 20);
  const old = req.user.avatar;
  req.user.avatar = await saveImage(req.body && req.body.image, 1.5e6);
  await store.put('users', req.user);
  dropFile(old);
  res.json({ user: userOut(req.user) });
}));

app.get('/api/products', auth(), (req, res) => {
  res.json({ products: store.list('products').filter((p) => p.active).sort(byNewest).map(productOut) });
});

app.get('/api/pay-info', auth(), (req, res) => res.json({ pay: S.pay }));

app.get('/api/orders', auth(), (req, res) => {
  res.json({ orders: store.list('orders').filter((o) => o.userId === req.user.id).sort(byNewest).map((o) => orderOut(o)) });
});

app.get('/api/debts', auth(), (req, res) => {
  const list = activeDebts(req.user.id).sort((a, b) => a.createdAt - b.createdAt);
  res.json({ debts: list.map((o) => orderOut(o)), max: S.debt.max });
});

app.post('/api/orders', auth(), wrap(async (req, res) => {
  const u = req.user, b = req.body || {};
  if (u.role === 'admin') throw bad('Admin buyurtma bera olmaydi');
  limit(req, 'order', 20);
  const kind = b.kind === 'debt' ? 'debt' : 'full';
  if (!METHODS[b.method]) throw bad("To'lov usulini tanlang");
  if (!Array.isArray(b.items) || !b.items.length) throw bad("Savat bo'sh");
  if (b.items.length > 100) throw bad("Juda ko'p mahsulot");
  const address = str(b.address, 200);
  if (address.length < 5) throw bad('Yetkazish manzilini kiriting');
  if (kind === 'debt') {
    if (!S.debt.enabled) throw bad("Nasiya hozircha yo'q");
    if (b.consent !== true) throw bad("Shartlarga rozilik belgisini qo'ying");
  }
  const chekId = await saveImage(b.receipt);

  // ---- sinxron bo'lim: tekshirish + ombordan ayirish (orada await yo'q — ikki kishi bitta kiyimni ola olmaydi)
  const items = [], picked = [], seen = new Set();
  let total = 0;
  try {
    if (kind === 'debt' && activeDebts(u.id).length >= S.debt.max) throw bad(`Sizda allaqachon ${S.debt.max} ta nasiya bor. Avval uni to'lang.`);
    for (const r of b.items) {
      const p = store.get('products', String(r && r.id));
      if (!p || !p.active) throw bad("Savatdagi mahsulot endi sotuvda yo'q");
      const size = str(r.size, 20), v = p.variants.find((x) => x.size === size);
      const label = p.name + (size ? ` (${size})` : '');
      if (!v) throw bad(`${label}: bu o'lcham endi yo'q`);
      const key = p.id + '|' + size;
      if (seen.has(key)) throw bad('Mahsulot takrorlangan');
      seen.add(key);
      let qty = Number(r.qty);
      qty = p.unit === 'metr' ? Math.round(qty * 2) / 2 : Math.floor(qty);
      if (!(qty > 0)) throw bad("Miqdor noto'g'ri");
      if (qty > v.stock) throw bad(v.stock > 0 ? `${label}: faqat ${v.stock} ${unitLabel(p.unit)} qolgan` : `${label}: afsuski qolmadi`);
      const sum = U.r0(p.price * qty);
      total += sum;
      items.push({ pid: p.id, name: p.name, size, unit: p.unit, price: p.price, cost: p.cost || 0, qty, sum });
      picked.push([p, v, qty]);
    }
  } catch (e) { dropFile(chekId); throw e; }
  for (const [, v, qty] of picked) v.stock = U.r2(v.stock - qty);
  S.seq += 1;
  const pay = {
    id: hex(4), amount: kind === 'debt' ? Math.max(1, U.r0((total * S.debt.percent) / 100)) : total, method: b.method,
    purpose: kind === 'debt' ? 'down' : 'full', status: 'pending', at: now(), file: chekId
  };
  const order = {
    id: String(S.seq), no: S.seq, userId: u.id, userSnap: { name: u.name, username: u.username, phone: u.phone, region: u.region },
    items, total, address, comment: str(b.comment, 500), kind, status: 'pending', createdAt: now(), acceptedAt: null, payments: [pay],
    debt: kind === 'debt' ? { percent: S.debt.percent, days: S.debt.days, dueAt: null, consentAt: now(), consentText: S.debt.text } : null
  };
  if (kind === 'debt') u.consent = { at: now(), text: order.debt.consentText };
  if (!u.address) u.address = address;
  // ----
  for (const p of new Set(picked.map((x) => x[0]))) await store.put('products', p);
  await store.put('settings', S);
  await store.put('users', u);
  await store.put('orders', order);
  res.json({ order: orderOut(order) });
  notifyPayment(order, pay, `🆕 <b>Yangi buyurtma №${order.no}</b>`).catch((e) => console.error('notify:', e.message));
}));

app.post('/api/orders/:id/pay', auth(), wrap(async (req, res) => {
  limit(req, 'pay', 30);
  const o = store.get('orders', req.params.id), b = req.body || {};
  if (!o || o.userId !== req.user.id) throw bad('Buyurtma topilmadi', 404);
  if (owedOf(o) <= 0) throw bad("Bu buyurtma bo'yicha nasiya yo'q");
  if (!METHODS[b.method]) throw bad("To'lov usulini tanlang");
  const file = await saveImage(b.receipt);
  const amount = U.r0(b.amount);
  const free = owedOf(o) - o.payments.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
  if (!(amount >= 1) || amount > free) {
    dropFile(file);
    throw bad(amount >= 1 ? `Summa qoldiqdan oshib ketdi (to'lash mumkin: ${U.money(Math.max(0, free))})` : "To'lov summasini kiriting");
  }
  const p = { id: hex(4), amount, method: b.method, purpose: 'repay', status: 'pending', at: now(), file, note: str(b.comment, 300) };
  o.payments.push(p);
  await store.put('orders', o);
  res.json({ order: orderOut(o) });
  notifyPayment(o, p, `💸 <b>Nasiya to'lovi — №${o.no}</b>`).catch((e) => console.error('notify:', e.message));
}));

/* ---- admin */
const admin = express.Router();
admin.use(auth('admin'));
app.use('/api/admin', admin);

const dayRange = (day) => { const t = Date.parse(day + 'T00:00:00Z') - 5 * 3600e3; return [t, t + DAY]; };

admin.get('/overview', (req, res) => {
  const orders = store.list('orders'), today = U.dayKey(now());
  const t = orders.filter((o) => U.dayKey(o.createdAt) === today && !['rejected', 'cancelled'].includes(o.status));
  const pending = [];
  for (const o of orders) {
    if (!o.payments.some((p) => p.status === 'pending')) continue;
    const out = orderOut(o, true);
    for (const p of out.payments) if (p.status === 'pending') pending.push({ order: out, pay: p });
  }
  pending.sort((a, b) => a.pay.at - b.pay.at);
  res.json({
    users: store.list('users').filter((u) => u.role !== 'admin').length, products: store.list('products').length,
    todayOrders: t.length, todaySum: U.r0(t.reduce((s, o) => s + o.total, 0)),
    debtTotal: U.r0(orders.reduce((s, o) => s + owedOf(o), 0)), pending
  });
});

admin.get('/orders', (req, res) => {
  const { from, to, status, q, today } = req.query;
  let list = store.list('orders');
  if (today) list = list.filter((o) => U.dayKey(o.createdAt) === U.dayKey(now()));
  if (/^\d{4}-\d\d-\d\d$/.test(from || '')) list = list.filter((o) => o.createdAt >= dayRange(from)[0]);
  if (/^\d{4}-\d\d-\d\d$/.test(to || '')) list = list.filter((o) => o.createdAt < dayRange(to)[1]);
  if (status && status !== 'all') list = list.filter((o) => (status === 'debt' || status === 'full' ? o.kind === status : o.status === status));
  if (q) {
    const s = String(q).toLowerCase();
    list = list.filter((o) => `${o.no} ${o.userSnap.name} ${o.userSnap.username} ${o.userSnap.phone} ${o.userSnap.region}`.toLowerCase().includes(s));
  }
  list.sort(byNewest);
  const sum = list.filter((o) => !['rejected', 'cancelled'].includes(o.status)).reduce((s, o) => s + o.total, 0);
  res.json({ total: list.length, sum: U.r0(sum), orders: list.slice(0, 400).map((o) => orderOut(o, true)) });
});

admin.post('/orders/:id/payments/:pid', wrap(async (req, res) => {
  res.json({ order: orderOut(await decidePayment(req.params.id, req.params.pid, req.body && req.body.action), true) });
}));

admin.post('/orders/:id/status', wrap(async (req, res) => {
  const o = store.get('orders', req.params.id), to = req.body && req.body.status;
  if (!o) throw bad('Buyurtma topilmadi', 404);
  const allowed = { accepted: ['shipped', 'delivered', 'cancelled'], shipped: ['delivered', 'cancelled'] }[o.status] || [];
  if (!allowed.includes(to)) throw bad("Holatni bunday o'zgartirib bo'lmaydi");
  o.status = to; o[to + 'At'] = now();
  if (to === 'cancelled') {
    for (const p of o.payments) if (p.status === 'pending') { p.status = 'rejected'; p.decidedAt = now(); }
    await restoreStock(o);
  }
  await store.put('orders', o);
  if (to === 'cancelled') await refreshMonth(U.monthKey(o.acceptedAt));
  tellUser(o, {
    shipped: `🚚 <b>Buyurtma №${o.no} yo'lga chiqdi.</b>`,
    delivered: `📦 <b>Buyurtma №${o.no} topshirildi.</b> Rahmat! ✨`,
    cancelled: `❌ <b>Buyurtma №${o.no} bekor qilindi.</b>${callUs()}`
  }[to]);
  res.json({ order: orderOut(o, true) });
}));

admin.post('/orders/:id/cash', wrap(async (req, res) => {
  const o = store.get('orders', req.params.id);
  if (!o || owedOf(o) <= 0) throw bad("Bu buyurtmada nasiya yo'q");
  const amount = U.r0(U.num(req.body && req.body.amount));
  const free = owedOf(o) - o.payments.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
  if (!(amount >= 1) || amount > free) throw bad(`Summa noto'g'ri (kiritish mumkin: ${U.money(Math.max(0, free))})`);
  o.payments.push({ id: hex(4), amount, method: 'naqd', purpose: 'repay', status: 'confirmed', at: now(), decidedAt: now(), file: null, note: 'Admin kiritdi' });
  await store.put('orders', o);
  await refreshMonth(U.monthKey(now()));
  const owed = owedOf(o);
  tellUser(o, owed > 0 ? `✅ Naqd to'lov qabul qilindi: ${U.money(amount)}. №${o.no} bo'yicha qolgan summa: <b>${U.money(owed)}</b>` : `🎉 №${o.no} bo'yicha nasiya to'liq yopildi. Rahmat!`);
  res.json({ order: orderOut(o, true) });
}));

admin.get('/debts', (req, res) => {
  res.json({ debts: store.list('orders').filter((o) => owedOf(o) > 0).sort((a, b) => (a.debt.dueAt || 0) - (b.debt.dueAt || 0)).map((o) => orderOut(o, true)) });
});

function adminUserOut(u) {
  const orders = store.list('orders').filter((o) => o.userId === u.id);
  return {
    ...userOut(u), blocked: !!u.blocked, consent: u.consent || null, tg: !!u.tgId,
    stats: {
      orders: orders.length, spent: U.r0(orders.filter((o) => LIVE.includes(o.status)).reduce((s, o) => s + o.total, 0)),
      owed: U.r0(orders.reduce((s, o) => s + owedOf(o), 0))
    }
  };
}
const getClient = (id) => { const u = store.get('users', id); if (!u || u.role === 'admin') throw bad('Mijoz topilmadi', 404); return u; };

admin.get('/users', (req, res) => {
  res.json({ users: store.list('users').filter((u) => u.role !== 'admin').sort(byNewest).map(adminUserOut) });
});
admin.get('/users/:id', (req, res) => {
  const u = getClient(req.params.id);
  res.json({ user: adminUserOut(u), orders: store.list('orders').filter((o) => o.userId === u.id).sort(byNewest).map((o) => orderOut(o, true)) });
});
admin.post('/users/:id/block', wrap(async (req, res) => {
  const u = getClient(req.params.id);
  u.blocked = !!(req.body && req.body.blocked);
  await store.put('users', u);
  res.json({ user: adminUserOut(u) });
}));
admin.post('/users/:id/password', wrap(async (req, res) => {
  const u = getClient(req.params.id);
  u.pass = await U.hashPassword(checkNewPass(req.body && req.body.password));
  await store.put('users', u);
  res.json({ ok: true });
}));

/* ---- mahsulotlar */
const adminProduct = (p) => ({ ...productOut(p), cost: p.cost || 0, active: !!p.active });
admin.get('/products', (req, res) => res.json({ products: store.list('products').sort(byNewest).map(adminProduct) }));

/** Rasm alohida yuklanadi: to'liq va kichik nusxa. Keyin mahsulotga id'lari yoziladi */
const thumbs = new Map();     // yangi yuklangan, hali mahsulotga biriktirilmagan rasmlar: full -> thumb
admin.post('/images', wrap(async (req, res) => {
  const b = req.body || {};
  parseImage(b.full); parseImage(b.thumb, 1e6);
  const f = await saveImage(b.full), t = await saveImage(b.thumb);
  thumbs.set(f, t);
  res.json({ image: { id: f, full: fileUrl(f), thumb: fileUrl(t) } });
}));

function readVariants(list, unit) {
  if (!Array.isArray(list) || !list.length) throw bad("Kamida bitta o'lcham yoki qoldiq kiriting");
  const seen = new Set();
  return list.slice(0, 40).map((v) => {
    const size = str(v && v.size, 20);
    if (list.length > 1 && !size) throw bad("O'lcham nomini kiriting");
    if (seen.has(size.toLowerCase())) throw bad(`«${size}» o'lchami takrorlangan`);
    seen.add(size.toLowerCase());
    const stock = U.r2(U.num(v.stock === '' || v.stock === undefined ? 0 : v.stock));
    if (!(stock >= 0 && stock <= 1e6)) throw bad("Qoldiq noto'g'ri");
    return { size, stock: unit === 'metr' ? Math.round(stock * 2) / 2 : Math.floor(stock) };
  });
}
/** Avval hammasini tekshiradi, keyin yozadi — xato bo'lsa mahsulot chala o'zgarmaydi */
function readProduct(b, old) {
  const n = {};
  n.name = str(b.name, 80);
  if (!n.name) throw bad('Mahsulot nomini kiriting');
  n.desc = str(b.desc, 2000);
  n.fabric = str(b.fabric, 60);
  n.unit = b.unit === 'metr' ? 'metr' : 'dona';
  n.price = U.r0(U.num(b.price));
  if (!(n.price > 0 && n.price < 1e11)) throw bad("Narx noto'g'ri");
  n.cost = U.r0(U.num(b.cost || 0));
  if (!(n.cost >= 0 && n.cost < 1e11)) throw bad("Tan narxi noto'g'ri");
  n.cat = S.cats.some((c) => c.id === b.cat) ? b.cat : '';
  n.isNew = !!b.isNew;
  n.active = b.active !== false;
  n.variants = readVariants(b.variants, n.unit);
  const have = new Map(((old && old.images) || []).map((i) => [i.f, i]));
  n.images = [...new Set((Array.isArray(b.images) ? b.images : []).map(String))].slice(0, 8).map((id) => {
    const i = have.get(id) || (thumbs.has(id) && { f: id, t: thumbs.get(id) });
    if (!i) throw bad('Rasm topilmadi, qaytadan yuklang');
    return i;
  });
  return n;
}
const claim = (p) => p.images.forEach((i) => thumbs.delete(i.f));

admin.post('/products', wrap(async (req, res) => {
  const n = readProduct(req.body || {}, null);
  let id = U.slug(n.name), k = 2;
  while (store.get('products', id)) id = U.slug(n.name) + '-' + k++;
  const p = { id, ...n, createdAt: now() };
  claim(p);
  await store.put('products', p);
  res.json({ product: adminProduct(p) });
}));
admin.put('/products/:id', wrap(async (req, res) => {
  const p = store.get('products', req.params.id);
  if (!p) throw bad('Topilmadi', 404);
  const n = readProduct(req.body || {}, p);
  const gone = p.images.filter((i) => !n.images.some((x) => x.f === i.f));
  Object.assign(p, n);
  claim(p);
  await store.put('products', p);
  for (const i of gone) { dropFile(i.f); dropFile(i.t); }
  res.json({ product: adminProduct(p) });
}));
admin.delete('/products/:id', wrap(async (req, res) => {
  const p = store.get('products', req.params.id);
  if (!p) throw bad('Topilmadi', 404);
  await store.del('products', p.id);          // buyurtmalar tarixida nomi va narxi saqlanib qoladi
  for (const i of p.images) { dropFile(i.f); dropFile(i.t); }
  res.json({ ok: true });
}));

/* ---- oylik foyda */
admin.get('/months', (req, res) => {
  const cur = U.monthKey(now());
  const list = store.list('months').filter((m) => !m.hidden);
  if (!list.some((m) => m.id === cur)) list.push({ id: cur, orders: 0, sales: 0, cost: 0, profit: 0, cash: 0, noCost: 0 });
  res.json({ months: list.sort((a, b) => (a.id < b.id ? 1 : -1)) });
});
const MONTH_RE = /^\d{4}-\d\d$/;
admin.post('/months/:id/refresh', wrap(async (req, res) => {
  if (!MONTH_RE.test(req.params.id)) throw bad("Noto'g'ri oy");
  await refreshMonth(req.params.id);
  res.json({ ok: true });
}));
admin.delete('/months/:id', wrap(async (req, res) => {
  const m = store.get('months', req.params.id);
  if (m) await store.put('months', { id: m.id, clearedAt: now(), orders: 0, sales: 0, cost: 0, profit: 0, cash: 0, noCost: 0, hidden: true });
  res.json({ ok: true });
}));

/* ---- sozlamalar */
const settingsOut = () => ({
  botName: S.botName, pay: S.pay, contact: S.contact, debt: S.debt, cats: S.cats, telegramLinked: !!adminChat(), hasBot: bot.enabled
});
admin.get('/settings', (req, res) => res.json(settingsOut()));
admin.put('/settings', wrap(async (req, res) => {
  const b = req.body || {}, n = {};
  if (b.pay) {
    n.pay = { ...S.pay };
    for (const k of Object.keys(METHODS)) if (b.pay[k]) {
      const link = str(b.pay[k].link, 300);
      if (link && !/^https?:\/\//i.test(link)) throw bad(`${METHODS[k]} havolasi https:// bilan boshlansin`);
      n.pay[k] = { card: str(b.pay[k].card, 40), holder: str(b.pay[k].holder, 60), link };
    }
  }
  if (b.contact) n.contact = {
    phone: str(b.contact.phone, 30).replace(/[^\d+ ()-]/g, ''), whatsapp: str(b.contact.whatsapp, 20).replace(/\D/g, ''),
    telegram: str(b.contact.telegram, 60).replace(/^@/, '').replace(/[^\w]/g, ''), instagram: str(b.contact.instagram, 60).replace(/^@/, '').replace(/[^\w.]/g, '')
  };
  if (b.debt) {
    const pc = U.num(b.debt.percent), dy = U.num(b.debt.days), mx = U.num(b.debt.max);
    if (!(pc > 0 && pc < 100) || !(dy >= 1 && dy <= 365) || !(mx >= 1 && mx <= 10)) throw bad("Nasiya sozlamalari noto'g'ri");
    n.debt = { enabled: b.debt.enabled !== false, percent: pc, days: Math.round(dy), max: Math.round(mx), text: str(b.debt.text, 600) || DEFAULT_CONSENT };
  }
  if (Array.isArray(b.cats)) {
    const used = new Set(['new', 'all']);
    n.cats = [];
    for (const c of b.cats.slice(0, 20)) {
      const label = str(c && c.label, 40);
      if (!label) continue;
      const old = S.cats.find((x) => x.id === c.id);
      let id = old ? old.id : U.slug(label);
      while (used.has(id)) id += '-2';
      used.add(id);
      n.cats.push({ id, label });
    }
  }
  Object.assign(S, n);
  await store.put('settings', S);
  res.json(settingsOut());
}));
admin.post('/link-code', wrap(async (req, res) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const code = Array.from(crypto.randomBytes(8), (b) => chars[b % chars.length]).join('');
  S.linkCode = { code, exp: now() + 10 * 60e3 };
  await store.put('settings', S);
  res.json({ code, minutes: 10 });
}));

app.use('/api', (req, res) => res.status(404).json({ error: 'Topilmadi' }));

/* ---- statik fayllar */
const PUB = path.join(__dirname, '..', 'public');
app.use(express.static(PUB, {
  setHeaders: (res, p) => res.set('Cache-Control', /\.(webp|woff2|png|jpg|svg)$/i.test(p) ? 'public, max-age=604800' : 'no-cache')
}));
app.get(/^\/(?!tg\/).*/, (req, res) => res.set('Cache-Control', 'no-cache').sendFile(path.join(PUB, 'index.html')));

app.use((err, req, res, next) => {  // eslint-disable-line no-unused-vars
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status === 413 ? 'Rasm juda katta' : status >= 500 ? "Server xatosi, qayta urinib ko'ring" : err.message });
});

/* ---------------------------------------------------------------- boshlash */
async function remindDebts() {
  const t = now(), day = U.dayKey(t), late = [];
  for (const o of store.list('orders')) {
    const owed = owedOf(o);
    if (owed <= 0 || !o.debt.dueAt || o.debt.dueAt > t || o.debt.lastRemind === day) continue;
    o.debt.lastRemind = day;
    await store.put('orders', o);
    late.push(`• №${o.no} — ${bot.esc(o.userSnap.name)} ${bot.esc(o.userSnap.phone)} — ${U.money(owed)}`);
    tellUser(o, `⏰ <b>Eslatma</b>\n№${o.no} buyurtma bo'yicha <b>${U.money(owed)}</b> to'lov muddati o'tdi. Iltimos, to'lovni amalga oshiring.`);
  }
  if (late.length) bot.notifyAdmin(`⚠️ <b>Muddati o'tgan nasiyalar (${late.length})</b>\n` + late.slice(0, 40).join('\n'));
}

async function seed() {
  const defaults = {
    id: 'main', botName: NAME, seq: 1000, adminChat: null, linkCode: null, cats: DEFAULT_CATS,
    pay: { payme: { card: '', holder: '', link: '' }, click: { card: '', holder: '', link: '' }, paynet: { card: '', holder: '', link: '' } },
    contact: { phone: '', whatsapp: '', telegram: '', instagram: '' },
    debt: { enabled: true, percent: 30, days: 14, max: 2, text: DEFAULT_CONSENT },
    secret: hex(32)
  };
  const saved = store.get('settings', 'main');
  S = { ...defaults, ...saved };
  if (!saved || Object.keys(defaults).some((k) => saved[k] === undefined)) await store.put('settings', S);
  else S = saved;
  SECRET = U.env('SECRET') || S.secret;

  if (!store.list('users').some((u) => u.role === 'admin')) {
    const given = U.env('ADMIN_PASSWORD'), pw = given || hex(5);
    await store.put('users', {
      id: U.uid(), username: 'admin', name: 'Admin', phone: '', region: '', address: '', role: 'admin',
      pass: await U.hashPassword(pw), avatar: null, createdAt: now(), tgId: null, blocked: false
    });
    console.log(given ? 'Admin akkaunti yaratildi: login «admin», parol — ADMIN_PASSWORD' : `Admin akkaunti yaratildi: admin / ${pw}  (Sozlama bo'limida almashtiring)`);
  }
}

(async () => {
  // Avval port ochiladi, keyin baza ulanadi. Ulanmasa — sabab sahifada ko'rinadi va har 20 soniyada qayta uriniladi.
  await new Promise((resolve) => app.listen(PORT, () => { console.log(`${NAME} → http://localhost:${PORT}`); resolve(); }));
  for (;;) {
    try {
      await store.init();
      await seed();
      bootError = '';
      ready = true;
      break;
    } catch (e) {
      bootError = e.friendly ? e.message : `❌ Ichki xato: ${e.message}`;
      console.error('\n' + (e.friendly ? e.message : e.stack) + '\n');
      await new Promise((r) => setTimeout(r, 20e3));
    }
  }
  bot.start();
  const remind = () => remindDebts().catch((e) => console.error('remind:', e.message));
  setTimeout(remind, 15e3).unref();
  setInterval(remind, 3600e3).unref();
})().catch((e) => { console.error(e); process.exit(1); });
