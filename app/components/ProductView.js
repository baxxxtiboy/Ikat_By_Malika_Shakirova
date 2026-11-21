'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCart } from '../cart-context';
import { som } from '@/lib/format';

export default function ProductView({ p }) {
  const { add } = useCart();
  const router = useRouter();
  const [img, setImg] = useState(0);
  const [size, setSize] = useState(null);
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState('');

  const sizes = p.product_sizes || [];
  const sel = sizes.find((s) => s.size === size);
  const max = sel?.stock || 0;
  const soldOut = sizes.every((s) => s.stock <= 0);

  function addToCart(go) {
    if (!sel) return setMsg("Iltimos, o'lchamni tanlang");
    add({ productId: p.id, name: p.name, price: Number(p.price), image: p.images?.[0] || '', size, qty, max });
    try { window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success'); } catch {}
    if (go) router.push('/cart');
    else setMsg("Savatga qo'shildi ✓");
  }

  return (
    <div className="pv">
      <div className="gallery">
        <div className="gallery-main">
          {p.images?.length ? <img src={p.images[img]} alt={p.name} /> : <div className="noimg">IKAT</div>}
        </div>
        {p.images?.length > 1 && (
          <div className="thumbs">
            {p.images.map((u, i) => (
              <button key={u} className={i === img ? 'thumb active' : 'thumb'} onClick={() => setImg(i)}>
                <img src={u} alt="" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="pv-info">
        <Link href="/" className="back">← Katalog</Link>
        {p.category && <div className="kicker">{p.category}</div>}
        <h1 className="pv-title">{p.name}</h1>
        <div className="price big">{som(p.price)}</div>

        <div className="label">O'lchamni tanlang</div>
        {sizes.length === 0 || soldOut ? (
          <div className="stock-note">Hozircha mavjud emas</div>
        ) : (
          <div className="sizes">
            {sizes.map((s) => (
              <button
                key={s.size}
                disabled={s.stock <= 0}
                className={size === s.size ? 'size active' : 'size'}
                onClick={() => { setSize(s.size); setQty(1); setMsg(''); }}
              >
                {s.size}
              </button>
            ))}
          </div>
        )}
        {sel && <div className="stock-note">Omborda: {sel.stock} dona</div>}

        <div className="label">Soni</div>
        <div className="qty">
          <button onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
          <span>{qty}</span>
          <button onClick={() => setQty((q) => Math.min(max || 1, q + 1))}>+</button>
        </div>

        <div className="actions">
          <button className="btn btn-outline" disabled={soldOut} onClick={() => addToCart(false)}>Savatga</button>
          <button className="btn btn-gold" disabled={soldOut} onClick={() => addToCart(true)}>Hoziroq olish</button>
        </div>
        {msg && <div className="msg">{msg}</div>}
        {p.description && <div className="desc">{p.description}</div>}
      </div>
    </div>
  );
}
