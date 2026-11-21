import { db } from '@/lib/supabase';
import { isAdmin, unauthorized } from '@/lib/auth';
import { cleanProduct } from '@/lib/products';

export async function PUT(req, { params }) {
  if (!isAdmin(req)) return unauthorized();
  const { id } = await params;
  const { product, sizes } = cleanProduct(await req.json().catch(() => ({})));
  if (!product.name) return Response.json({ error: 'Nomini kiriting' }, { status: 400 });

  const { error } = await db().from('products').update(product).eq('id', id);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Olib tashlangan o'lchamlarni o'chiramiz, qolganlarini yangilaymiz
  const { data: existing } = await db().from('product_sizes').select('id,size').eq('product_id', id);
  const keep = new Set(sizes.map((s) => s.size));
  const toDelete = (existing || []).filter((s) => !keep.has(s.size)).map((s) => s.id);
  if (toDelete.length) {
    const { error: e1 } = await db().from('product_sizes').delete().in('id', toDelete);
    if (e1) return Response.json({ error: e1.message }, { status: 500 });
  }
  if (sizes.length) {
    const { error: e2 } = await db()
      .from('product_sizes')
      .upsert(sizes.map((s, i) => ({ ...s, sort: i, product_id: id })), { onConflict: 'product_id,size' });
    if (e2) return Response.json({ error: e2.message }, { status: 500 });
  }
  return Response.json({ ok: true });
}

export async function DELETE(req, { params }) {
  if (!isAdmin(req)) return unauthorized();
  const { id } = await params;
  const { error } = await db().from('products').delete().eq('id', id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
