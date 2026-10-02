import type { MetadataRoute } from 'next';
import { contentRepository } from '@/services/content';
import { features } from '@/data/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const paths = [
    '',
    '/integration',
    '/events',
    '/events/rentals',
    '/integration/about',
    '/integration/contact',
    ...(features.shop ? ['/shop'] : []),
    ...(features.serviceDetailPages ? contentRepository.services().map((s) => `/services/${s.slug}`) : []),
    ...(features.sampleProjects ? contentRepository.projects().map((p) => `/projects/${p.slug}`) : []),
  ];
  return paths.map((path) => ({ url: `${origin}${path}`, changeFrequency: 'monthly', priority: path ? 0.7 : 1 }));
}
