import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { site } from '@/data/site';
import { allowIndexing, siteOrigin } from '@/lib/site-url';
import { geistSans, geistMono } from '@/lib/fonts';
import './globals.css';
export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: {
    default: 'K4 AV Group | AV Company Seattle: Commercial AV, Live Events & Rentals',
    template: '%s | K4 AV Group',
  },
  description: site.description,
  robots: allowIndexing ? undefined : { index: false, follow: false },
  openGraph: { title: 'K4 AV Group', description: site.description, type: 'website', locale: 'en_US' },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: site.name,
              url: siteOrigin,
              description: site.description,
              areaServed: ['Seattle', 'Bellevue', 'Greater Seattle Area'],
            }).replace(/</g, '\\u003c'),
          }}
        />
      </body>
    </html>
  );
}
