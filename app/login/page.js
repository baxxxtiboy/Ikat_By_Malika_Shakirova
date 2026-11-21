import { getBotUsername } from '@/lib/telegram';
import LoginClient from './LoginClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Kirish — Ikat by Malika Shakirova' };

export default async function LoginPage({ searchParams }) {
  const sp = await searchParams;
  const raw = typeof sp?.next === 'string' ? sp.next : '/';
  const next = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/';
  const bot = await getBotUsername();
  return <LoginClient bot={bot} next={next} />;
}
