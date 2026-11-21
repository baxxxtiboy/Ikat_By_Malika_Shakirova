'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCart } from '../cart-context';

export default function Header() {
  const { count } = useCart();
  const path = usePathname() || '/';
  const admin = path.startsWith('/admin');
  const loginPage = path.startsWith('/login');
  const [user, setUser] = useState(null);
  const [inTelegram, setInTelegram] = useState(false);

  useEffect(() => {
    setInTelegram(Boolean(window.Telegram?.WebApp?.initData));
    if (admin || loginPage) return;
    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((j) => setUser(j.user))
      .catch(() => {});
  }, [admin, loginPage]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    window.location.href = '/login';
  }

  return (
    <header className="header">
      <div className="container header-in">
        <Link href={admin ? '/admin' : '/'} className="logo">
          <span className="logo-main">IKAT</span>
          <span className="logo-sub">by Malika Shakirova</span>
        </Link>
        {admin ? (
          <span className="badge-admin">Admin</span>
        ) : loginPage ? null : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {user && (
            <span className="muted small-text" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {user.photo_url && (
                <img src={user.photo_url} alt="" width={24} height={24} style={{ borderRadius: '50%' }} />
              )}
              {user.first_name || user.username}
              {!inTelegram && (
                <button onClick={logout} className="gold" style={{ background: 'none', border: 0, cursor: 'pointer', font: 'inherit' }}>
                  Chiqish
                </button>
              )}
            </span>
          )}
          <Link href="/cart" className="cart-btn" aria-label="Savat">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M6 7h12l-1 13H7L6 7z" />
              <path d="M9 7a3 3 0 0 1 6 0" />
            </svg>
            <span>Savat</span>
            {count > 0 && <b className="cart-count">{count}</b>}
          </Link>
          </div>
        )}
      </div>
    </header>
  );
}
