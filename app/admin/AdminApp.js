'use client';
import { useCallback, useEffect, useState } from 'react';
import { som, STATUSES } from '@/lib/format';

const TOKEN_KEY = 'ikat_admin';
const PRESETS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '42', '44', '46', '48', '50', '52'];

async function api(path, token, opts = {}) {
  const isForm = opts.body instanceof FormData;
  const r = await fetch(path, {
    ...opts,
    headers: { ...(isForm ? {} : { 'Content-Type': 'application/json' }), 'x-admin-token': token || '' },
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'Xatolik');
  return j;
}

// Rasmni yuklashdan oldin kichraytiradi (tezroq yuklanadi)
async function resize(file) {
  try {
    if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;
    const bmp = await createImageBitmap(file);
    const s = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * s);
    c.height = Math.round(bmp.height * s);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise((res) => c.toBlob(res, 'image/jpeg', 0.85));
    return blob ? new File([blob], 'photo.jpg', { type: 'image/jpeg' }) : file;
  } catch {
    return file;
  }
}

export default function AdminApp() {
  const [token, setToken] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try { setToken(localStorage.getItem(TOKEN_KEY)); } catch {}
    setReady(true);
  }, []);

  const login = useCallback((t) => { try { localStorage.setItem(TOKEN_KEY, t); } catch {} setToken(t); }, []);
  const logout = useCallback(() => { try { localStorage.removeItem(TOKEN_KEY); } catch {} setToken(null); }, []);

  if (!ready) return null;
  if (!token) return <Login onLogin={login} />;
  return <Dashboard token={token} onLogout={logout} />;
}

function Login({ onLogin }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setErr('');
    try {
      const j = await api('/api/admin/login', '', { method: 'POST', body: JSON.stringify({ password: pw }) });
      onLogin(j.token);
    } catch (e) {
      setErr(e.message);
      setLoading(false);
    }
  }

  return (
    <form className="login" onSubmit={submit}>
      <div className="logo-main center">IKAT</div>
      <h1 className="page-title center">Admin panel</h1>
      <input type="password" placeholder="Parol" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
      {err && <div className="error">{err}</div>}
      <button className="btn btn-gold wide" disabled={loading}>{loading ? 'Tekshirilmoqda…' : 'Kirish'}</button>
    </form>
  );
}

function Dashboard({ token, onLogout }) {
  const [tab, setTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [editing, setEditing] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  const call = useCallback(
    async (path, opts) => {
      try {
        return await api(path, token, opts);
      } catch (e) {
        if (e.message === 'unauthorized') onLogout();
        throw e;
      }
    },
    [token, onLogout]
  );

  const load = useCallback(async () => {
    try {
      const [p, o] = await Promise.all([call('/api/admin/products'), call('/api/admin/orders')]);
      setProducts(p.products);
      setOrders(o.orders);
      setErr('');
    } catch (e) {
      setErr(e.message);
    }
    setLoading(false);
  }, [call]);

  useEffect(() => { load(); }, [load]);

  async function remove(p) {
    if (!confirm(`"${p.name}" o'chirilsinmi?`)) return;
    try { await call(`/api/admin/products/${p.id}`, { method: 'DELETE' }); load(); } catch (e) { alert(e.message); }
  }

  async function setStatus(o, status) {
    if (status === 'cancelled' && !confirm(`№${o.id} bekor qilinsinmi? Mahsulotlar omborga qaytadi.`)) return;
    try { await call(`/api/admin/orders/${o.id}`, { method: 'PATCH', body: JSON.stringify({ status }) }); load(); } catch (e) { alert(e.message); }
  }

  if (editing)
    return (
      <ProductForm
        initial={editing === 'new' ? null : editing}
        call={call}
        onDone={() => { setEditing(null); load(); }}
        onCancel={() => setEditing(null)}
      />
    );

  const newCount = orders.filter((o) => o.status === 'new').length;
  const revenue = orders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + Number(o.total), 0);
  const stockTotal = products.reduce((s, p) => s + (p.product_sizes || []).reduce((a, x) => a + x.stock, 0), 0);

  return (
    <div className="admin">
      <div className="stats">
        <div className="stat"><b>{products.length}</b><span>Mahsulot</span></div>
        <div className="stat"><b>{stockTotal}</b><span>Omborda</span></div>
        <div className="stat"><b>{newCount}</b><span>Yangi buyurtma</span></div>
        <div className="stat"><b>{som(revenue)}</b><span>Savdo</span></div>
      </div>

      <div className="tabs">
        <button className={tab === 'products' ? 'tab active' : 'tab'} onClick={() => setTab('products')}>Mahsulotlar</button>
        <button className={tab === 'orders' ? 'tab active' : 'tab'} onClick={() => setTab('orders')}>
          Buyurtmalar {newCount > 0 && <b className="cart-count">{newCount}</b>}
        </button>
        <button className="tab ghost" onClick={onLogout}>Chiqish</button>
      </div>

      {err && <div className="error">{err}</div>}
      {loading && <div className="muted center">Yuklanmoqda…</div>}

      {tab === 'products' && (
        <>
          <button className="btn btn-gold wide" onClick={() => setEditing('new')}>+ Yangi mahsulot</button>
          <div className="admin-list">
            {products.map((p) => {
              const st = (p.product_sizes || []).reduce((a, x) => a + x.stock, 0);
              return (
                <div key={p.id} className="admin-item">
                  <div className="cart-thumb">{p.images?.[0] ? <img src={p.images[0]} alt="" /> : <div className="noimg">IKAT</div>}</div>
                  <div className="cart-info">
                    <div className="card-name">{p.name} {!p.is_active && <span className="tag">yashirin</span>}</div>
                    <div className="price">{som(p.price)}</div>
                    <div className="muted small-text">
                      {[...(p.product_sizes || [])].sort((a, b) => a.sort - b.sort).map((s) => `${s.size}:${s.stock}`).join(' · ') || "O'lcham yo'q"}
                      {' '}— jami {st}
                    </div>
                  </div>
                  <div className="item-actions">
                    <button className="icon-btn" onClick={() => setEditing(p)}>✎</button>
                    <button className="icon-btn danger" onClick={() => remove(p)}>🗑</button>
                  </div>
                </div>
              );
            })}
            {!loading && !products.length && <div className="empty">Hali mahsulot yo'q. Birinchisini qo'shing!</div>}
          </div>
        </>
      )}

      {tab === 'orders' && (
        <div className="admin-list">
          {orders.map((o) => (
            <div key={o.id} className={`order status-${o.status}`}>
              <div className="order-head">
                <b>№{o.id}</b>
                <span className="muted">{new Date(o.created_at).toLocaleString('ru-RU')}</span>
              </div>
              {o.items.map((i, k) => (
                <div key={k} className="order-line">
                  {i.name} — <b className="gold">{i.size}</b> × {i.qty} <span className="muted">({som(i.price * i.qty)})</span>
                </div>
              ))}
              <div className="order-total">Jami: <b>{som(o.total)}</b></div>
              <div className="order-customer">
                👤 {o.customer_name}<br />
                📞 <a href={`tel:${o.phone.replace(/[^\d+]/g, '')}`}>{o.phone}</a>
                {o.tg_username && <> · <a href={`https://t.me/${o.tg_username}`} target="_blank">@{o.tg_username}</a></>}
                {o.address && <><br />📍 {o.address}</>}
                {o.comment && <><br />💬 {o.comment}</>}
              </div>
              <select value={o.status} disabled={o.status === 'cancelled'} onChange={(e) => setStatus(o, e.target.value)}>
                {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          ))}
          {!loading && !orders.length && <div className="empty">Hali buyurtma yo'q</div>}
        </div>
      )}
    </div>
  );
}

function ProductForm({ initial, call, onDone, onCancel }) {
  const [f, setF] = useState(() => ({
    name: initial?.name || '',
    category: initial?.category || '',
    price: initial?.price ?? '',
    description: initial?.description || '',
    is_active: initial?.is_active ?? true,
    images: initial?.images || [],
    sizes: [...(initial?.product_sizes || [])].sort((a, b) => a.sort - b.sort).map((s) => ({ size: s.size, stock: s.stock })),
  }));
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  async function onFiles(e) {
    const files = [...e.target.files];
    e.target.value = '';
    setUploading(true);
    setErr('');
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', await resize(file));
        const r = await call('/api/admin/upload', { method: 'POST', body: fd });
        setF((p) => ({ ...p, images: [...p.images, r.url] }));
      }
    } catch (e) {
      setErr(e.message);
    }
    setUploading(false);
  }

  const addSize = (s) => { if (!f.sizes.some((x) => x.size === s)) set('sizes', [...f.sizes, { size: s, stock: 1 }]); };
  const setSize = (i, k, v) => set('sizes', f.sizes.map((s, j) => (j === i ? { ...s, [k]: v } : s)));
  const delSize = (i) => set('sizes', f.sizes.filter((_, j) => j !== i));
  const makeMain = (i) => set('images', [f.images[i], ...f.images.filter((_, j) => j !== i)]);
  const delImg = (i) => set('images', f.images.filter((_, j) => j !== i));

  async function save(e) {
    e.preventDefault();
    if (!f.name.trim()) return setErr('Nomini kiriting');
    if (!(Number(f.price) >= 0) || f.price === '') return setErr('Narxini kiriting');
    setSaving(true);
    setErr('');
    try {
      const body = JSON.stringify({ ...f, price: Number(f.price) });
      if (initial) await call(`/api/admin/products/${initial.id}`, { method: 'PUT', body });
      else await call('/api/admin/products', { method: 'POST', body });
      onDone();
    } catch (e) {
      setErr(e.message);
      setSaving(false);
    }
  }

  return (
    <form className="form admin-form" onSubmit={save}>
      <button type="button" className="back" onClick={onCancel}>← Orqaga</button>
      <h1 className="page-title">{initial ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'}</h1>

      <div className="label">Rasmlar (birinchisi — asosiy)</div>
      <div className="img-grid">
        {f.images.map((u, i) => (
          <div key={u} className={i === 0 ? 'img-box main' : 'img-box'}>
            <img src={u} alt="" />
            <div className="img-tools">
              {i > 0 && <button type="button" onClick={() => makeMain(i)} title="Asosiy qilish">★</button>}
              <button type="button" onClick={() => delImg(i)} title="O'chirish">✕</button>
            </div>
          </div>
        ))}
        <label className="img-add">
          {uploading ? '…' : '+'}
          <input type="file" accept="image/*" multiple hidden onChange={onFiles} disabled={uploading} />
        </label>
      </div>

      <label>Nomi<input value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Masalan: Ikat ko'ylak «Samarqand»" /></label>
      <div className="row2">
        <label>Narxi (so'm)<input type="number" inputMode="numeric" min="0" value={f.price} onChange={(e) => set('price', e.target.value)} placeholder="450000" /></label>
        <label>Kategoriya<input value={f.category} onChange={(e) => set('category', e.target.value)} placeholder="Ko'ylak" /></label>
      </div>
      <label>Tavsif<textarea rows={3} value={f.description} onChange={(e) => set('description', e.target.value)} placeholder="Mato, uzunligi, parvarish…" /></label>

      <div className="label">O'lchamlar va soni</div>
      <div className="chips">
        {PRESETS.map((s) => (
          <button type="button" key={s} className={f.sizes.some((x) => x.size === s) ? 'chip active' : 'chip'} onClick={() => addSize(s)}>{s}</button>
        ))}
      </div>
      <div className="size-rows">
        {f.sizes.map((s, i) => (
          <div key={i} className="size-row">
            <input value={s.size} onChange={(e) => setSize(i, 'size', e.target.value)} placeholder="O'lcham" />
            <div className="qty small">
              <button type="button" onClick={() => setSize(i, 'stock', Math.max(0, (parseInt(s.stock) || 0) - 1))}>−</button>
              <input type="number" min="0" value={s.stock} onChange={(e) => setSize(i, 'stock', e.target.value)} />
              <button type="button" onClick={() => setSize(i, 'stock', (parseInt(s.stock) || 0) + 1)}>+</button>
            </div>
            <button type="button" className="icon-btn danger" onClick={() => delSize(i)}>✕</button>
          </div>
        ))}
        <button type="button" className="btn btn-outline small-btn" onClick={() => set('sizes', [...f.sizes, { size: '', stock: 1 }])}>+ Boshqa o'lcham</button>
      </div>

      <label className="toggle">
        <input type="checkbox" checked={f.is_active} onChange={(e) => set('is_active', e.target.checked)} />
        <span>Do'konda ko'rinsin</span>
      </label>

      {err && <div className="error">{err}</div>}
      <button className="btn btn-gold wide" disabled={saving || uploading}>{saving ? 'Saqlanmoqda…' : 'Saqlash'}</button>
    </form>
  );
}
