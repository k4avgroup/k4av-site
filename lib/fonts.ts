import localFont from 'next/font/local';

export const geistSans = localFont({
  src: '../public/fonts/geist-sans-latin.woff2',
  variable: '--font-geist-sans',
  display: 'swap',
  weight: '100 900',
  style: 'normal',
  fallback: ['Arial', 'sans-serif'],
});

export const geistMono = localFont({
  src: '../public/fonts/geist-mono-latin.woff2',
  variable: '--font-geist-mono',
  display: 'swap',
  weight: '100 900',
  style: 'normal',
  preload: false,
  fallback: ['Courier New', 'monospace'],
});
