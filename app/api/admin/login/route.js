import { checkPassword, adminToken } from '@/lib/auth';

export async function POST(req) {
  const { password } = await req.json().catch(() => ({}));
  if (!process.env.ADMIN_PASSWORD) return Response.json({ error: 'ADMIN_PASSWORD sozlanmagan' }, { status: 503 });
  if (!checkPassword(password)) {
    await new Promise((r) => setTimeout(r, 800));
    return Response.json({ error: "Parol noto'g'ri" }, { status: 401 });
  }
  return Response.json({ token: adminToken() });
}
