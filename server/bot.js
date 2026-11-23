'use strict';
/**
 * Telegram bot (qo'shimcha kutubxonasiz, faqat fetch).
 *  - Internetda (Render / PUBLIC_URL)  -> webhook
 *  - Lokalda                           -> bot o'chiq. BOT_MODE=polling bo'lsagina yoqiladi,
 *    chunki polling internetdagi saytning webhook'ini o'chirib qo'yadi.
 */
const crypto = require('crypto');
const { env, safeEq } = require('./util');

const esc = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

function createBot(h) {
  const token = env('BOT_TOKEN', 'TELEGRAM_BOT_TOKEN');
  const enabled = !!token;
  const api = (process.env.TG_API_BASE || 'https://api.telegram.org') + '/bot' + token + '/';
  const publicUrl = env('PUBLIC_URL', 'RENDER_EXTERNAL_URL').replace(/\/+$/, '');
  const isHttps = publicUrl.startsWith('https://');
  const hash = (s, n) => crypto.createHash('sha256').update(s + token + (process.env.SECRET || 'ikat')).digest('hex').slice(0, n);
  const hookKey = hash('hook', 24);
  const hookSecret = hash('sec', 32);

  async function call(method, body) {
    const r = await fetch(api + method, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body || {}), signal: AbortSignal.timeout(40e3)
    });
    const j = await r.json().catch(() => ({}));
    if (!j.ok) throw new Error(`${method}: ${j.description || r.status}`);
    return j.result;
  }
  const send = (chat_id, text, extra = {}) => call('sendMessage', { chat_id, text, parse_mode: 'HTML', disable_web_page_preview: true, ...extra });

  async function sendPhoto(chat_id, buf, mime, caption, extra = {}) {
    const fd = new FormData();
    fd.append('chat_id', String(chat_id));
    fd.append('caption', caption);
    fd.append('parse_mode', 'HTML');
    if (extra.reply_markup) fd.append('reply_markup', JSON.stringify(extra.reply_markup));
    fd.append('photo', new Blob([buf], { type: mime || 'image/jpeg' }), 'chek.jpg');
    const r = await fetch(api + 'sendPhoto', { method: 'POST', body: fd, signal: AbortSignal.timeout(40e3) });
    const j = await r.json().catch(() => ({}));
    if (!j.ok) throw new Error('sendPhoto: ' + (j.description || r.status));
  }

  const shopKb = (text = "🛍 Do'konni ochish") => (isHttps ? { reply_markup: { inline_keyboard: [[{ text, web_app: { url: publicUrl } }]] } } : {});

  /** Mini App ichidan kelgan initData'ni tekshiradi, foydalanuvchini qaytaradi */
  function verifyInitData(initData) {
    if (!enabled || !initData) return null;
    try {
      const p = new URLSearchParams(initData);
      const given = p.get('hash');
      if (!given) return null;
      p.delete('hash');
      const dcs = [...p.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, v]) => `${k}=${v}`).join('\n');
      const secret = crypto.createHmac('sha256', 'WebAppData').update(token).digest();
      if (!safeEq(crypto.createHmac('sha256', secret).update(dcs).digest('hex'), given)) return null;
      if (Date.now() / 1000 - Number(p.get('auth_date') || 0) > 86400 * 7) return null;
      return JSON.parse(p.get('user') || 'null');
    } catch { return null; }
  }

  async function handleUpdate(u) {
    if (u.callback_query) return handleCallback(u.callback_query);
    const m = u.message;
    if (!m || !m.text) return;
    const chat = m.chat.id, text = m.text.trim();
    if (/^\/start\b/.test(text)) {
      const name = m.from && m.from.first_name ? ', <b>' + esc(m.from.first_name) + '</b>' : '';
      return send(chat,
        `Assalomu alaykum${name}! ✨\n\n<b>${esc(h.botName())}</b> do'koniga xush kelibsiz.\nQo'lda to'qilgan ikat kiyimlarini ko'ring, o'lchamingizni tanlang va buyurtma bering.` +
        (isHttps ? '' : "\n\n(Do'kon manzili hali sozlanmagan: PUBLIC_URL)"), shopKb());
    }
    if (/^\/id\b/.test(text)) return send(chat, `Chat ID: <code>${chat}</code>`);
    if (/^\/admin\b/.test(text)) {
      const code = text.split(/\s+/)[1] || '';
      if (!code && h.isAdminChat(chat)) return send(chat, "👑 Admin panel: do'konni ochib, admin akkauntingiz bilan kiring.", shopKb('⚙️ Admin panel'));
      if (m.chat.type === 'private' && h.verifyLinkCode(code)) {
        await h.setAdminChat(chat);
        return send(chat, "✅ Admin xabarnomalari shu chatga ulandi. Yangi buyurtma va cheklar shu yerga keladi.");
      }
      return send(chat, "❌ Kod noto'g'ri yoki muddati o'tgan. Admin panel → Sozlama → «Telegramga ulash» dan yangi kod oling.");
    }
    if (/^\/help\b/.test(text)) return send(chat, "/start — do'konni ochish\n/id — chat ID\n/admin KOD — admin xabarnomalarini ulash");
    return send(chat, "Xarid qilish uchun do'konni oching 👇", shopKb());
  }

  async function handleCallback(q) {
    const chat = q.message && q.message.chat.id;
    const answer = (text, alert) => call('answerCallbackQuery', { callback_query_id: q.id, text, show_alert: !!alert });
    if (!h.isAdminChat(chat)) return answer("Ruxsat yo'q");
    const [kind, orderId, payId] = String(q.data || '').split(':');
    const action = kind === 'pc' ? 'confirm' : kind === 'pr' ? 'reject' : null;
    if (!action) return answer('');
    const clear = () => call('editMessageReplyMarkup', { chat_id: chat, message_id: q.message.message_id, reply_markup: { inline_keyboard: [] } }).catch(() => {});
    try {
      await h.decidePayment(orderId, payId, action);
      await answer(action === 'confirm' ? 'Tasdiqlandi ✅' : 'Rad etildi ❌');
      await clear();
      await send(chat, `${action === 'confirm' ? "✅ To'lov tasdiqlandi" : "❌ To'lov rad etildi"} — №${esc(orderId)}`);
    } catch (e) {
      await answer(e.message.slice(0, 180), true).catch(() => {});
      if (e.status) await clear();
    }
  }

  /** Adminga xabar (ixtiyoriy chek rasmi va tasdiqlash tugmalari bilan) */
  async function notifyAdmin(text, opts = {}) {
    const chat = h.adminChat();
    if (!enabled || !chat) return;
    const extra = opts.pay ? { reply_markup: { inline_keyboard: [[
      { text: '✅ Tasdiqlash', callback_data: `pc:${opts.pay.orderId}:${opts.pay.payId}` },
      { text: '❌ Rad etish', callback_data: `pr:${opts.pay.orderId}:${opts.pay.payId}` }
    ]] } } : {};
    try {
      // Telegram izohi 1024 belgidan oshmaydi: uzun matn alohida xabar bo'lib ketadi
      if (opts.chek && text.length <= 1000) return await sendPhoto(chat, opts.chek.buf, opts.chek.mime, text, extra);
      if (opts.chek) await sendPhoto(chat, opts.chek.buf, opts.chek.mime, '🧾 Chek').catch((e) => console.error('Bot (chek):', e.message));
      await send(chat, text, extra);
    } catch (e) {
      console.error('Bot (admin xabari):', e.message);
      if (opts.chek) await send(chat, text, extra).catch(() => {});
    }
  }
  async function notifyUser(tgId, text) {
    if (!enabled || !tgId) return;
    try { await send(tgId, text, shopKb()); } catch (e) { console.error('Bot (mijoz xabari):', e.message); }
  }

  const checkHook = (key, secretHeader) => enabled && safeEq(key, hookKey) && safeEq(secretHeader || '', hookSecret);

  async function start() {
    if (!enabled) return console.log("Bot: BOT_TOKEN yo'q — bot o'chiq, sayt ishlayveradi.");
    const polling = process.env.BOT_MODE === 'polling';
    if (!isHttps && !polling) return console.log("Bot: lokalda o'chiq (internetdagi bot buzilmasligi uchun). Lokalda sinash: BOT_MODE=polling");
    try {
      await call('setMyCommands', { commands: [{ command: 'start', description: "Do'konni ochish" }, { command: 'help', description: 'Yordam' }] });
      if (isHttps) await call('setChatMenuButton', { menu_button: { type: 'web_app', text: "Do'kon", web_app: { url: publicUrl } } });
      if (!polling) {
        await call('setWebhook', { url: `${publicUrl}/tg/${hookKey}`, secret_token: hookSecret, allowed_updates: ['message', 'callback_query'] });
        console.log('Bot: webhook ulandi →', publicUrl);
      } else {
        await call('deleteWebhook', {}).catch(() => {});
        console.log('Bot: long polling rejimi');
        poll();
      }
    } catch (e) {
      console.error('Bot ishga tushmadi:', e.message, '— 60 soniyadan keyin qayta uriniladi');
      setTimeout(start, 60e3).unref();
    }
  }
  async function poll() {
    let offset = 0;
    for (;;) {
      try {
        for (const u of await call('getUpdates', { offset, timeout: 25, allowed_updates: ['message', 'callback_query'] })) {
          offset = u.update_id + 1;
          handleUpdate(u).catch((e) => console.error('Bot:', e.message));
        }
      } catch (e) {
        console.error('Bot polling:', e.message);
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  }

  return { enabled, start, handleUpdate, checkHook, verifyInitData, notifyAdmin, notifyUser, esc };
}

module.exports = createBot;
