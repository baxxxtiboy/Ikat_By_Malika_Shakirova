# Ikat by Malika Shakirova — Telegram do'kon

Next.js + Supabase + Telegram Mini App. Oltin-qora dizayn.

- **Mijoz:** katalog → mahsulot → o'lcham tanlash → savat → buyurtma
- **Admin (`/admin`):** mahsulot qo'shish, narx, rasm, o'lcham va sonini o'zgartirish, buyurtmalar
- **Bot:** /start (do'kon tugmasi), /id, /admin. Yangi buyurtma adminga keladi, mijozga holat haqida xabar boradi.

## 1. Supabase (5 daqiqa)
1. https://supabase.com → **New project**
2. **SQL Editor** → `supabase/schema.sql` faylini to'liq qo'yib → **Run**
3. **Project Settings → API**: `Project URL` va `service_role` kalitini nusxalang

## 2. Telegram bot
1. Telegram'da **@BotFather** → `/newbot` → nom bering → **token**ni nusxalang

## 3. Sozlamalar
`.env.example` faylidan nusxa olib `.env.local` deb saqlang va qiymatlarni yozing.

## 4. Internetga joylash (Vercel, bepul)
1. Papkani GitHub'ga yuklang → https://vercel.com → **Import**
2. **Environment Variables** ga `.env.local` dagi barcha qiymatlarni qo'shing → **Deploy**
3. `NEXT_PUBLIC_SITE_URL` ni Vercel bergan manzilga o'zgartiring va Redeploy qiling
4. Brauzerda bir marta oching: `https://SIZNING-SAYT.vercel.app/api/bot/setup?key=ADMIN_PAROL`
5. Botga `/id` yozing → raqamni `ADMIN_CHAT_ID` ga yozing → Redeploy
6. Botga `/admin` yozing → admin panel ochiladi 🎉

## Kompyuterda sinash
```
npm install
npm run dev
```
http://localhost:3000 — do'kon, http://localhost:3000/admin — admin panel.
(Telegram bot faqat HTTPS saytda ishlaydi, ya'ni Vercel'dan keyin.)
