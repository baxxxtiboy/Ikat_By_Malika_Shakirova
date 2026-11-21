'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '../cart-context';

export default function Header() {
  const { count } = useCart();
  const path = usePathname() || '/';
  const admin = path.startsWith('/admin');

  return (
    <header className="header">
      <div className="container header-in">
        <Link href={admin ? '/admin' : '/'} className="logo">
          <span className="logo-main">IKAT</span>
          <span className="logo-sub">by Malika Shakirova</span>
        </Link>
        {admin ? (
          <span className="badge-admin">Admin</span>
        ) : (
          <Link href="/cart" className="cart-btn" aria-label="Savat">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M6 7h12l-1 13H7L6 7z" />
              <path d="M9 7a3 3 0 0 1 6 0" />
            </svg>
            <span>Savat</span>
            {count > 0 && <b className="cart-count">{count}</b>}
          </Link>
        )}
      </div>
    </header>
  );
}
