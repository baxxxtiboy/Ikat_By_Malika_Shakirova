import { db } from '@/lib/supabase';
import { isAdmin, unauthorized } from '@/lib/auth';
import { sendMessage } from '@/lib/telegram';
import { STATUSES } from '@/lib/format';

const EMOJI = { confirmed: '✅', shipped: '🚚', delivered: '🎉', cancelled: '❌' };

export async function PATCH(req, { params }) {
  if (!isAdmin(req)) return unauthorized();
  const { id } = await params;
  const { status } = await req.json().catch(() => ({}));
  if (!STATUSES[status]) return Response.json({ error: "Noto'g'ri holat" }, { status: 400 });

  const { data: cur, error: e0 } = await db().from('orders').select('status,tg_user_id').eq('id', id).single();
  if (e0) return Response.json({ error: e0.message }, { status: 404 });
  if (cur.status === 'cancelled')
    return Response.json({ error: "Bekor qilingan buyurtmani o'zgartirib bo'lmaydi" }, { status: 409 });
  if (cur.status === status) return Response.json({ ok: true });

  // Bekor qilinsa, mahsulotlar omborga qaytadi
  const { error } =
    status === 'cancelled'
      ? await db().rpc('cancel_order', { p_order_id: Number(id) })
      : await db().from('orders').update({ status }).eq('id', id);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  if (cur.tg_user_id && status !== 'new')
    await sendMessage(cur.tg_user_id, `${EMOJI[status] || 'ℹ️'} Buyurtma №${id}: <b>${STATUSES[status]}</b>`);
  return Response.json({ ok: true });
}
