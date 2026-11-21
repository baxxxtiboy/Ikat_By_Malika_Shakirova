import { db } from '@/lib/supabase';
import { isAdmin, unauthorized } from '@/lib/auth';

export async function POST(req) {
  if (!isAdmin(req)) return unauthorized();
  const form = await req.formData();
  const file = form.get('file');
  if (!file || typeof file === 'string') return Response.json({ error: "Fayl yo'q" }, { status: 400 });
  if (!file.type.startsWith('image/')) return Response.json({ error: 'Faqat rasm yuklash mumkin' }, { status: 400 });
  if (file.size > 8 * 1024 * 1024) return Response.json({ error: 'Rasm 8MB dan katta' }, { status: 400 });

  const ext = (file.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
  const path = `${new Date().toISOString().slice(0, 10)}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const { error } = await db().storage.from('products').upload(path, buf, { contentType: file.type, upsert: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  const { data } = db().storage.from('products').getPublicUrl(path);
  return Response.json({ url: data.publicUrl });
}
