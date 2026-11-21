'use client';
import { useEffect } from 'react';

export default function TelegramInit() {
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;
    tg.ready();
    tg.expand();
    try {
      tg.setHeaderColor('#0b0b0b');
      tg.setBackgroundColor('#0b0b0b');
    } catch {}
  }, []);
  return null;
}
