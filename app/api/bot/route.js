import { sendMessage, esc, siteUrl } from '@/lib/telegram';

export async function POST(req) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret && req.headers.get('x-telegram-bot-api-secret-token') !== secret)
    return new Response('forbidden', { status: 403 });

  const update = await req.json().catch(() => ({}));
  const m = update.message;
  if (!m?.text) return Response.json({ ok: true });

  const chatId = m.chat.id;
  const text = m.text.trim();
  const site = siteUrl(req);
  const shopBtn = { reply_markup: { inline_keyboard: [[{ text: "🛍 Do'konni ochish", web_app: { url: site } }]] } };

  if (text.startsWith('/start')) {
    await sendMessage(
      chatId,
      `Assalomu alaykum, <b>${esc(m.from?.first_name || '')}</b>! ✨\n\n<b>Ikat by Malika Shakirova</b> do'koniga xush kelibsiz.\n\nQo'lda to'qilgan ikat kiyimlar kolleksiyasini ko'rish, o'lchamingizni tanlash va buyurtma berish uchun quyidagi tugmani bosing 👇`,
      shopBtn
    );
  } else if (text.startsWith('/id')) {
    await sendMessage(chatId, `Sizning chat ID: <code>${chatId}</code>`);
  } else if (text.startsWith('/admin')) {
    if (String(chatId) === String(process.env.ADMIN_CHAT_ID)) {
      await sendMessage(chatId, '👑 Admin panel:', {
        reply_markup: { inline_keyboard: [[{ text: '⚙️ Admin panelni ochish', web_app: { url: `${site}/admin` } }]] },
      });
    } else {
      await sendMessage(chatId, '⛔ Bu buyruq faqat admin uchun.');
    }
  } else {
    await sendMessage(chatId, "Xarid qilish uchun do'konni oching 👇", shopBtn);
  }
  return Response.json({ ok: true });
}
