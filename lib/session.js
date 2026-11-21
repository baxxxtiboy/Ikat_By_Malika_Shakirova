// Imzolangan sessiya cookie (Web Crypto — middleware va serverda ishlaydi)
export const SESSION_COOKIE = 'ikat_session';
export const SESSION_DAYS = 30;

const enc = new TextEncoder();

function b64url(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromB64url(str) {
  const s = atob(str.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
}

async function key() {
  const secret = process.env.SESSION_SECRET || `${process.env.TELEGRAM_BOT_TOKEN || ''}:ikat-session-v1`;
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function signSession(user) {
  const payload = {
    id: user.id,
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    username: user.username || '',
    photo_url: user.photo_url || '',
    exp: Date.now() + SESSION_DAYS * 864e5,
  };
  const body = b64url(enc.encode(JSON.stringify(payload)));
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', await key(), enc.encode(body)));
  return `${body}.${b64url(sig)}`;
}

export async function readSession(value) {
  if (!value || typeof value !== 'string') return null;
  const [body, sig] = value.split('.');
  if (!body || !sig) return null;
  try {
    const ok = await crypto.subtle.verify('HMAC', await key(), fromB64url(sig), enc.encode(body));
    if (!ok) return null;
    const p = JSON.parse(new TextDecoder().decode(fromB64url(body)));
    if (!p?.id || p.exp < Date.now()) return null;
    return p;
  } catch {
    return null;
  }
}

export function sessionFromRequest(req) {
  const raw = req.headers.get('cookie') || '';
  const m = raw.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
  return readSession(m ? decodeURIComponent(m[1]) : null);
}

// Telegram Web (iframe) ichida ham ishlashi uchun SameSite=None; Secure
export function sessionCookie(value, maxAge = SESSION_DAYS * 86400) {
  return `${SESSION_COOKIE}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=None`;
}
