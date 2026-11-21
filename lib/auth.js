import crypto from 'crypto';

export function adminToken() {
  return crypto.createHmac('sha256', process.env.ADMIN_PASSWORD || '').update('ikat-admin-v1').digest('hex');
}

export function checkPassword(pw) {
  const real = process.env.ADMIN_PASSWORD || '';
  if (!real || typeof pw !== 'string') return false;
  const a = Buffer.from(pw), b = Buffer.from(real);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function isAdmin(req) {
  if (!process.env.ADMIN_PASSWORD) return false;
  return req.headers.get('x-admin-token') === adminToken();
}

export function unauthorized() {
  return Response.json({ error: 'unauthorized' }, { status: 401 });
}
