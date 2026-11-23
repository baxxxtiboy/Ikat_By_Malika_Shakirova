'use strict';
const crypto = require('crypto');
const { promisify } = require('util');
const scrypt = promisify(crypto.scrypt);

const REGIONS = [
  'Toshkent shahri', 'Toshkent viloyati', 'Andijon', 'Buxoro', "Farg'ona", 'Jizzax', 'Xorazm',
  'Namangan', 'Navoiy', 'Qashqadaryo', "Qoraqalpog'iston", 'Samarqand', 'Sirdaryo', 'Surxondaryo'
];

const r0 = (x) => Math.round(Number(x) || 0);                 // so'm — butun son
const r2 = (x) => Math.round((Number(x) + Number.EPSILON) * 100) / 100;
const uid = () => crypto.randomUUID();
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9а-яё]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'item';
/** "1 250 000", "1250000", "0,5" -> son */
const num = (v) => Number(String(v ?? '').replace(/\s/g, '').replace(',', '.'));

async function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  return `${salt}:${(await scrypt(String(pw), salt, 64)).toString('hex')}`;
}
async function checkPassword(pw, stored) {
  const [salt, h] = String(stored || '').split(':');
  if (!salt || !h) return false;
  const t = await scrypt(String(pw ?? ''), salt, 64);
  const b = Buffer.from(h, 'hex');
  return b.length === t.length && crypto.timingSafeEqual(b, t);
}

function safeEq(a, b) {
  a = Buffer.from(String(a)); b = Buffer.from(String(b));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function signToken(payload, secret) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return body + '.' + crypto.createHmac('sha256', secret).update(body).digest('base64url');
}
function verifyToken(tok, secret) {
  if (!tok || !tok.includes('.')) return null;
  const [body, sig] = tok.split('.');
  if (!safeEq(sig || '', crypto.createHmac('sha256', secret).update(body).digest('base64url'))) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString());
    return p.exp && p.exp < Date.now() ? null : p;
  } catch { return null; }
}

// Toshkent vaqti (UTC+5)
const TZ = 5 * 3600e3;
const dayKey = (ts) => new Date(ts + TZ).toISOString().slice(0, 10);
const monthKey = (ts) => new Date(ts + TZ).toISOString().slice(0, 7);

const money = (n) => String(r0(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + " so'm";

function normPhone(v) {
  let d = String(v || '').replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('998')) d = d.slice(3);
  return d.length === 9 ? '+998' + d : null;
}

/** Muhit o'zgaruvchisi: bo'sh joy, qo'shtirnoq va tasodifan yozilgan "NOM=" ni tozalaydi */
function env(...names) {
  for (const n of names) {
    let v = process.env[n];
    if (v === undefined || v === null) continue;
    v = String(v).trim().replace(/^(["'])(.*)\1$/, '$2').trim();
    if (v.toUpperCase().startsWith(n.toUpperCase() + '=')) v = v.slice(n.length + 1).trim().replace(/^(["'])(.*)\1$/, '$2');
    if (v) return v;
  }
  return '';
}

module.exports = { REGIONS, r0, r2, uid, slug, num, hashPassword, checkPassword, safeEq, signToken, verifyToken, dayKey, monthKey, money, normPhone, env };
