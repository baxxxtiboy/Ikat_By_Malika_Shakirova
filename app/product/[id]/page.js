import { notFound } from 'next/navigation';
import { db, isConfigured } from '@/lib/supabase';
import ProductView from '../../components/ProductView';

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }) {
  const { id } = await params;
  if (!isConfigured() || !/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data } = await db()
    .from('products')
    .select('*, product_sizes(size,stock,sort)')
    .eq('id', id)
    .eq('is_active', true)
    .maybeSingle();
  if (!data) notFound();
  data.product_sizes = [...(data.product_sizes || [])].sort((a, b) => a.sort - b.sort);
  return <ProductView p={data} />;
}
