import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { site } from '@/data/site';
import { geistSans, geistMono } from '@/lib/fonts';
import './globals.css';
const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
export const metadata: Metadata = { metadataBase: new URL(origin), title: { default: 'K4 AV Group | AV Engineering, Commissioning & Event Support', template: '%s | K4 AV Group' }, description: site.description, openGraph: { title: 'K4 AV Group', description: site.description, type: 'website', locale: 'en_US' }, icons: { icon: '/favicon.svg' } };
export default function RootLayout({ children }: {
    children: React.ReactNode;
}) { return <html lang="en" data-scroll-behavior="smooth" className={`${geistSans.variable} ${geistMono.variable}`}><body><a className="skip-link" href="#main">Skip to content</a><Header /><main id="main">{children}</main><Footer /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'Organization', name: site.name, url: origin, description: site.description, areaServed: ['Seattle', 'Bellevue', 'Greater Puget Sound'] }).replace(/</g, '\\u003c') }}/></body></html>; }
