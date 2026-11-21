'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCart } from '../cart-context';
import { som } from '@/lib/format';

export default function CartPage() {
  const { items, update, clear, total, loaded } = useCart();
  const [form, setForm] = useState({ name: '', phone: '+998 ', address: '', comment: '' });
  const [state, setState] = useState({ loading: false, error: '', done: null });

  useEffect(() => {
    const u = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (u) setForm((f) => ({ ...f, name: f.name || [u.first_name, u.last_name].filter(Boolean).join(' ') }));
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setState({ loading: true, error: '', done: null });
    try {
      const r = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          items: items.map((i) => ({ product_id: i.productId, size: i.size, qty: i.qty })),
          initData: window.Telegram?.WebApp?.initData || '',
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Xatolik');
      clear();
      setState({ loading: false, error: '', done: j.order });
      try { window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success'); } catch {}
    } catch (err) {
      setState({ loading: false, error: err.message, done: null });
    }
  }

  if (state.done)
    return (
      <div className="success">
        <div className="success-icon">✓</div>
        <h2>Rahmat!</h2>
        <p>Buyurtmangiz <b>№{state.done.id}</b> qabul qilindi.</p>
        <p className="muted">Jami: {som(state.done.total)}. Tez orada siz bilan bog'lanamiz.</p>
        <Link href="/" className="btn btn-gold">Katalogga qaytish</Link>
      </div>
    );

  if (!loaded) return null;

  if (!items.length)
    return (
      <div className="empty">
        <p>Savatingiz bo'sh</p>
        <Link href="/" className="btn btn-gold">Xarid qilish</Link>
      </div>
    );

  return (
    <div className="cart">
      <h1 className="page-title">Savat</h1>
      <div className="cart-list">
        {items.map((i) => (
          <div key={i.productId + i.size} className="cart-item">
            <div className="cart-thumb">{i.image ? <img src={i.image} alt="" /> : <div className="noimg">IKAT</div>}</div>
            <div className="cart-info">
              <div className="card-name">{i.name}</div>
              <div className="muted">O'lcham: <b className="gold">{i.size}</b></div>
              <div className="price">{som(i.price * i.qty)}</div>
            </div>
            <div className="qty small">
              <button onClick={() => update(i.productId, i.size, i.qty - 1)}>−</button>
              <span>{i.qty}</span>
              <button onClick={() => update(i.productId, i.size, Math.min(i.max ?? 99, i.qty + 1))}>+</button>
            </div>
          </div>
        ))}
      </div>
      <div className="total-row"><span>Jami</span><b>{som(total)}</b></div>

      <form className="form" onSubmit={submit}>
        <h2 className="section-title">Yetkazib berish</h2>
        <label>Ism familiya<input required value={form.name} onChange={set('name')} placeholder="Ismingiz" /></label>
        <label>Telefon<input required type="tel" value={form.phone} onChange={set('phone')} placeholder="+998 90 123 45 67" /></label>
        <label>Manzil<input value={form.address} onChange={set('address')} placeholder="Shahar, ko'cha, uy" /></label>
        <label>Izoh<textarea rows={2} value={form.comment} onChange={set('comment')} placeholder="Qo'shimcha istaklar" /></label>
        {state.error && <div className="error">{state.error}</div>}
        <button className="btn btn-gold wide" disabled={state.loading}>
          {state.loading ? 'Yuborilmoqda…' : `Buyurtma berish · ${som(total)}`}
        </button>
      </form>
    </div>
  );
}
