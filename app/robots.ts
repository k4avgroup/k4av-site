import type { MetadataRoute } from 'next';
import { allowIndexing, siteOrigin } from '@/lib/site-url';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: allowIndexing
      ? { userAgent: '*', allow: '/', disallow: ['/admin', '/login', '/api/'] }
      : { userAgent: '*', disallow: '/' },
    sitemap: `${siteOrigin}/sitemap.xml`,
  };
}
