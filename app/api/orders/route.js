import { db, isConfigured } from '@/lib/supabase';
import { sendMessage, esc, verifyInitData } from '@/lib/telegram';
import { som } from '@/lib/format';
import { sessionFromRequest } from '@/lib/session';

export async function POST(req) {
  if (!isConfigured()) return Response.json({ error: "Do'kon hali sozlanmagan" }, { status: 503 });
  const b = await req.json().catch(() => null);
  if (!b) return Response.json({ error: "Noto'g'ri so'rov" }, { status: 400 });

  const name = String(b.name || '').trim().slice(0, 100);
  const phone = String(b.phone || '').trim().slice(0, 30);
  const address = String(b.address || '').trim().slice(0, 500);
  const comment = String(b.comment || '').trim().slice(0, 1000);
  if (name.length < 2) return Response.json({ error: 'Ismingizni kiriting' }, { status: 400 });
  if (phone.replace(/\D/g, '').length < 9) return Response.json({ error: "Telefon raqamni to'g'ri kiriting" }, { status: 400 });
  if (!Array.isArray(b.items) || !b.items.length || b.items.length > 50)
    return Response.json({ error: "Savat bo'sh" }, { status: 400 });

  const items = b.items.map((i) => ({ product_id: String(i.product_id), size: String(i.size), qty: parseInt(i.qty, 10) }));
  const user = verifyInitData(b.initData) || (await sessionFromRequest(req));
  if (!user?.id) return Response.json({ error: 'Buyurtma berish uchun Telegram orqali kiring' }, { status: 401 });

  const { data: order, error } = await db().rpc('place_order', {
    p_items: items, p_name: name, p_phone: phone, p_address: address, p_comment: comment,
    p_tg_id: user?.id ?? null, p_tg_username: user?.username ?? null,
  });

  if (error) {
    const m = error.message || '';
    if (m.includes('OUT_OF_STOCK')) {
      const what = m.split('|')[1] || '';
      return Response.json({ error: `Kechirasiz, omborda yetarli emas: ${what}. Savatni yangilang.` }, { status: 409 });
    }
    if (m.includes('NOT_FOUND')) return Response.json({ error: "Savatdagi mahsulot endi sotuvda yo'q" }, { status: 409 });
    console.error(error);
    return Response.json({ error: 'Buyurtmani saqlashda xatolik' }, { status: 500 });
  }

  const lines = order.items
    .map((i) => `• ${esc(i.name)} — <b>${esc(i.size)}</b> × ${i.qty} = ${som(i.price * i.qty)}`)
    .join('\n');
  const tgLine = order.tg_username
    ? `\n✈️ @${esc(order.tg_username)}`
    : order.tg_user_id ? `\n✈️ <a href="tg://user?id=${order.tg_user_id}">Telegram</a>` : '';

  await Promise.all([
    sendMessage(
      process.env.ADMIN_CHAT_ID,
      `🛍 <b>Yangi buyurtma №${order.id}</b>\n\n${lines}\n\n💰 Jami: <b>${som(order.total)}</b>\n\n👤 ${esc(order.customer_name)}\n📞 ${esc(order.phone)}${tgLine}` +
        (order.address ? `\n📍 ${esc(order.address)}` : '') +
        (order.comment ? `\n💬 ${esc(order.comment)}` : '')
    ),
    user?.id
      ? sendMessage(user.id, `✅ <b>Buyurtmangiz №${order.id} qabul qilindi!</b>\n\n${lines}\n\n💰 Jami: <b>${som(order.total)}</b>\n\nTez orada siz bilan bog'lanamiz. Rahmat! ✨`)
      : null,
  ]);

  return Response.json({ order: { id: order.id, total: order.total } });
}
