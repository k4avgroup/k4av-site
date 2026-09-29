import type { MetadataRoute } from 'next';
import { contentRepository } from '@/services/content';
export default function sitemap(): MetadataRoute.Sitemap { const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'; return ['', '/services', '/projects', '/industries', '/rental', '/shop', '/about', '/contact', '/quote', ...contentRepository.services().map(s => `/services/${s.slug}`), ...contentRepository.projects().map(p => `/projects/${p.slug}`)].map(path => ({ url: `${origin}${path}`, changeFrequency: 'monthly', priority: path ? 0.7 : 1 })); }
