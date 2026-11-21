import { verifyInitData, verifyLoginWidget } from '@/lib/telegram';
import { signSession, sessionCookie } from '@/lib/session';

// Kirish: Mini App ichidan { initData } yoki brauzerdan { widget: {...} }
export async function POST(req) {
  const b = await req.json().catch(() => ({}));
  const user = b.initData ? verifyInitData(b.initData) : verifyLoginWidget(b.widget);
  if (!user?.id) return Response.json({ error: "Telegram ma'lumoti tasdiqlanmadi" }, { status: 401 });

  const value = await signSession(user);
  return Response.json(
    { user: { id: user.id, first_name: user.first_name, username: user.username } },
    { headers: { 'Set-Cookie': sessionCookie(value) } }
  );
}
