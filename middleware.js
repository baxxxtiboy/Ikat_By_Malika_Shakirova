import { NextResponse } from 'next/server';
import { readSession, SESSION_COOKIE } from '@/lib/session';

// Do'kon sahifalari faqat Telegram orqali kirganlarga ochiq
export async function middleware(req) {
  const user = await readSession(req.cookies.get(SESSION_COOKIE)?.value);
  if (user) return NextResponse.next();

  const url = req.nextUrl.clone();
  const next = req.nextUrl.pathname + req.nextUrl.search;
  url.pathname = '/login';
  url.search = next && next !== '/' ? `?next=${encodeURIComponent(next)}` : '';
  return NextResponse.redirect(url);
}

export const config = {
  // API, admin panel, login sahifasi va statik fayllar tekshirilmaydi
  matcher: ['/((?!api|admin|login|_next|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico|txt)$).*)'],
};
