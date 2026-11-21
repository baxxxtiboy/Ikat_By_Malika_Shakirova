import './globals.css';
import Script from 'next/script';
import { CartProvider } from './cart-context';
import Header from './components/Header';
import TelegramInit from './components/TelegramInit';

export const metadata = {
  title: 'Ikat by Malika Shakirova',
  description: "Qo'lda to'qilgan ikat kiyimlar do'koni",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0b0b0b',
};

export default function RootLayout({ children }) {
  return (
    <html lang="uz">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        <CartProvider>
          <TelegramInit />
          <Header />
          <main className="container">{children}</main>
          <footer className="footer">© Ikat by Malika Shakirova</footer>
        </CartProvider>
      </body>
    </html>
  );
}
