import { db } from '@/lib/supabase';
import { isAdmin, unauthorized } from '@/lib/auth';
import { cleanProduct, PRODUCT_SELECT } from '@/lib/products';

export async function GET(req) {
  if (!isAdmin(req)) return unauthorized();
  const { data, error } = await db().from('products').select(PRODUCT_SELECT).order('created_at', { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ products: data });
}

export async function POST(req) {
  if (!isAdmin(req)) return unauthorized();
  const { product, sizes } = cleanProduct(await req.json().catch(() => ({})));
  if (!product.name) return Response.json({ error: 'Nomini kiriting' }, { status: 400 });
  const { data, error } = await db().from('products').insert(product).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (sizes.length) {
    const { error: e2 } = await db()
      .from('product_sizes')
      .insert(sizes.map((s, i) => ({ ...s, sort: i, product_id: data.id })));
    if (e2) return Response.json({ error: e2.message }, { status: 500 });
  }
  return Response.json({ product: data });
}
