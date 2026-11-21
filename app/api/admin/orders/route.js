import { db } from '@/lib/supabase';
import { isAdmin, unauthorized } from '@/lib/auth';

export async function GET(req) {
  if (!isAdmin(req)) return unauthorized();
  const { data, error } = await db().from('orders').select('*').order('created_at', { ascending: false }).limit(300);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ orders: data });
}
