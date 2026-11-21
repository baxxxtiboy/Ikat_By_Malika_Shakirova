import { db, isConfigured } from '@/lib/supabase';
import ProductGrid from './components/ProductGrid';

export const dynamic = 'force-dynamic';

export default async function Home() {
  if (!isConfigured())
    return <div className="empty">Do'kon sozlanmoqda. <code>.env.local</code> faylini to'ldiring (README.md).</div>;

  const { data, error } = await db()
    .from('products')
    .select('id,name,price,category,images,product_sizes(size,stock)')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  return (
    <>
      <section className="hero">
        <p className="kicker">Qo'lda to'qilgan an'ana</p>
        <h1>Ikat by Malika Shakirova</h1>
        <div className="divider"><span>◆</span></div>
        <p className="hero-sub">Milliy naqshlar zamonaviy libosda</p>
      </section>
      {error ? <div className="empty">Xatolik: {error.message}</div> : <ProductGrid products={data || []} />}
    </>
  );
}
