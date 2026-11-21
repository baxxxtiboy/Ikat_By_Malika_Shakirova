import { sessionFromRequest } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const user = await sessionFromRequest(req);
  return Response.json({ user: user || null });
}
