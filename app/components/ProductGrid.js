'use client';
import Link from 'next/link';
import { useState } from 'react';
import { som } from '@/lib/format';

export default function ProductGrid({ products }) {
  const cats = [...new Set(products.map((p) => p.category).filter(Boolean))];
  const [cat, setCat] = useState('');
  const list = cat ? products.filter((p) => p.category === cat) : products;

  if (!products.length) return <div className="empty">Tez orada yangi kolleksiya ✨</div>;

  return (
    <>
      {cats.length > 0 && (
        <div className="chips">
          <button className={!cat ? 'chip active' : 'chip'} onClick={() => setCat('')}>Barchasi</button>
          {cats.map((c) => (
            <button key={c} className={cat === c ? 'chip active' : 'chip'} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>
      )}
      <div className="grid">
        {list.map((p) => {
          const stock = (p.product_sizes || []).reduce((s, x) => s + x.stock, 0);
          return (
            <Link key={p.id} href={`/product/${p.id}`} className="card">
              <div className="card-img">
                {p.images?.[0] ? <img src={p.images[0]} alt={p.name} loading="lazy" /> : <div className="noimg">IKAT</div>}
                {stock === 0 && <span className="soldout">Tugagan</span>}
              </div>
              <div className="card-body">
                <div className="card-name">{p.name}</div>
                <div className="price">{som(p.price)}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
