import type { MetadataRoute } from 'next';
import { contentRepository } from '@/services/content';
import { features } from '@/data/site';
import { siteOrigin } from '@/lib/site-url';

export default function sitemap(): MetadataRoute.Sitemap {
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
  return paths.map((path) => ({ url: `${siteOrigin}${path}`, changeFrequency: 'monthly', priority: path ? 0.7 : 1 }));
}
