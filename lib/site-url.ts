// Public origin used for canonical links, the sitemap and link previews.
export const siteOrigin =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NODE_ENV === 'production' ? 'https://k4av.com' : 'http://localhost:3000');

// The site is kept out of search engines until NEXT_PUBLIC_ALLOW_INDEXING=true is set at build time.
export const allowIndexing = process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true';
