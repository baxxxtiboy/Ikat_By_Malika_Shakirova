'use client';
import { createContext, useContext, useEffect, useState } from 'react';

const Ctx = createContext(null);
const KEY = 'ikat_cart';

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem(KEY);
      if (s) setItems(JSON.parse(s));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
  }, [items, loaded]);

  const add = (item) =>
    setItems((prev) => {
      const i = prev.findIndex((x) => x.productId === item.productId && x.size === item.size);
      if (i < 0) return [...prev, item];
      const next = [...prev];
      next[i] = { ...next[i], qty: Math.min(next[i].qty + item.qty, item.max ?? 99), max: item.max, price: item.price };
      return next;
    });

  const update = (productId, size, qty) =>
    setItems((prev) =>
      prev.map((x) => (x.productId === productId && x.size === size ? { ...x, qty } : x)).filter((x) => x.qty > 0)
    );

  const clear = () => setItems([]);
  const count = items.reduce((s, x) => s + x.qty, 0);
  const total = items.reduce((s, x) => s + x.qty * x.price, 0);

  return <Ctx.Provider value={{ items, add, update, clear, count, total, loaded }}>{children}</Ctx.Provider>;
}

export const useCart = () => useContext(Ctx);
