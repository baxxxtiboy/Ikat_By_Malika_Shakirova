import { tg, siteUrl } from '@/lib/telegram';
import { checkPassword } from '@/lib/auth';

// Bir marta ochiladi: https://SAYT/api/bot/setup?key=ADMIN_PAROL
export async function GET(req) {
  const key = new URL(req.url).searchParams.get('key');
  if (!checkPassword(key)) return Response.json({ error: "key noto'g'ri" }, { status: 401 });
  const site = siteUrl(req);
  if (!site.startsWith('https://'))
    return Response.json({ error: 'Telegram uchun HTTPS manzil kerak', site }, { status: 400 });

  const webhook = await tg('setWebhook', {
    url: `${site}/api/bot`,
    allowed_updates: ['message'],
    drop_pending_updates: true,
    ...(process.env.TELEGRAM_WEBHOOK_SECRET ? { secret_token: process.env.TELEGRAM_WEBHOOK_SECRET } : {}),
  });
  const menu = await tg('setChatMenuButton', {
    menu_button: { type: 'web_app', text: "Do'kon", web_app: { url: site } },
  });
  const commands = await tg('setMyCommands', {
    commands: [
      { command: 'start', description: "Do'konni ochish" },
      { command: 'id', description: 'Chat ID ni bilish' },
      { command: 'admin', description: 'Admin panel' },
    ],
  });
  return Response.json({ site, webhook, menu, commands });
}
