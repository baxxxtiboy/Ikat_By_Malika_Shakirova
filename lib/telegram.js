import crypto from 'crypto';

export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export async function tg(method, body) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { ok: false, description: 'TELEGRAM_BOT_TOKEN yo‘q' };
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return await r.json();
  } catch (e) {
    return { ok: false, description: e.message };
  }
}

export function sendMessage(chat_id, text, extra = {}) {
  if (!chat_id) return Promise.resolve(null);
  return tg('sendMessage', { chat_id, text, parse_mode: 'HTML', disable_web_page_preview: true, ...extra });
}

export function siteUrl(req) {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return req ? new URL(req.url).origin : '';
}

// Brauzerdagi "Telegram orqali kirish" (Login Widget) ma'lumotini tekshiradi
export function verifyLoginWidget(data) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!data || typeof data !== 'object' || !data.hash || !token) return null;
  const { hash, ...rest } = data;
  const dcs = Object.keys(rest)
    .filter((k) => rest[k] !== undefined && rest[k] !== null)
    .sort()
    .map((k) => `${k}=${rest[k]}`)
    .join('\n');
  const secret = crypto.createHash('sha256').update(token).digest();
  const check = crypto.createHmac('sha256', secret).update(dcs).digest('hex');
  if (check !== String(hash)) return null;
  if (Date.now() / 1000 - Number(rest.auth_date) > 86400) return null; // 1 kundan eski
  return { id: rest.id, first_name: rest.first_name, last_name: rest.last_name, username: rest.username, photo_url: rest.photo_url };
}

let botUsername;
export async function getBotUsername() {
  if (process.env.TELEGRAM_BOT_USERNAME) return process.env.TELEGRAM_BOT_USERNAME.replace(/^@/, '');
  if (!botUsername) {
    const r = await tg('getMe', {});
    if (r?.ok) botUsername = r.result.username;
  }
  return botUsername || '';
}

// Telegram Mini App initData ni tekshiradi, haqiqiy bo'lsa foydalanuvchini qaytaradi
export function verifyInitData(initData) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!initData || !token) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');
  const dcs = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
  const secret = crypto.createHmac('sha256', 'WebAppData').update(token).digest();
  const check = crypto.createHmac('sha256', secret).update(dcs).digest('hex');
  if (check !== hash) return null;
  try { return JSON.parse(params.get('user')); } catch { return null; }
}
