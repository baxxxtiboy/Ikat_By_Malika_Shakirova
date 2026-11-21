'use client';
import { useEffect, useRef, useState } from 'react';

export default function LoginClient({ bot, next }) {
  const box = useRef(null);
  const [state, setState] = useState({ mode: 'checking', error: '' });

  async function login(body) {
    setState({ mode: 'loading', error: '' });
    try {
      const r = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Kirishda xatolik');
      window.location.replace(next || '/');
    } catch (e) {
      setState({ mode: 'widget', error: e.message });
    }
  }

  useEffect(() => {
    // Telegram bot ichida ochilgan bo'lsa — avtomatik kirish
    const initData = window.Telegram?.WebApp?.initData;
    if (initData) {
      const tries = Number(sessionStorage.getItem('ikat_login_try') || 0);
      if (tries < 2) {
        sessionStorage.setItem('ikat_login_try', String(tries + 1));
        login({ initData });
        return;
      }
      setState({ mode: 'widget', error: "Avtomatik kirish bo'lmadi. Ilovani yopib, qayta oching." });
      return;
    }
    setState({ mode: 'widget', error: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state.mode !== 'widget' || !bot || !box.current || box.current.childElementCount) return;
    window.onTelegramAuth = (user) => login({ widget: user });
    const s = document.createElement('script');
    s.src = 'https://telegram.org/js/telegram-widget.js?22';
    s.async = true;
    s.setAttribute('data-telegram-login', bot);
    s.setAttribute('data-size', 'large');
    s.setAttribute('data-radius', '10');
    s.setAttribute('data-request-access', 'write');
    s.setAttribute('data-onauth', 'onTelegramAuth(user)');
    box.current.appendChild(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.mode, bot]);

  return (
    <section className="hero" style={{ minHeight: '55vh' }}>
      <p className="kicker">Xush kelibsiz</p>
      <h1>Ikat by Malika Shakirova</h1>
      <div className="divider"><span>◆</span></div>

      {state.mode === 'checking' || state.mode === 'loading' ? (
        <p className="hero-sub">Kirilmoqda…</p>
      ) : (
        <>
          <p className="hero-sub">Do'konga kirish uchun Telegram akkauntingiz orqali kiring</p>
          <div ref={box} style={{ display: 'flex', justifyContent: 'center', margin: '24px 0', minHeight: 48 }} />
          {!bot && <p className="msg">Bot nomi topilmadi: TELEGRAM_BOT_USERNAME ni sozlang.</p>}
          {state.error && <p className="msg">{state.error}</p>}
          {bot && (
            <p className="muted small-text">
              yoki Telegram'da <a className="gold" href={`https://t.me/${bot}`}>@{bot}</a> botini oching
            </p>
          )}
        </>
      )}
    </section>
  );
}
