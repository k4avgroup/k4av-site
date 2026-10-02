import type { NextConfig } from 'next';

const config: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    // Old addresses from earlier site versions.
    return [
      { source: '/commercial-av', destination: '/integration', permanent: true },
      { source: '/live-events', destination: '/events', permanent: true },
      { source: '/rental', destination: '/events/rentals', permanent: true },
      { source: '/services', destination: '/', permanent: false },
      { source: '/projects', destination: '/', permanent: false },
      { source: '/industries', destination: '/integration', permanent: true },
      // About, Contact and the quote form live inside each division so the tabs and navigation stay visible.
      { source: '/about', destination: '/integration/about', permanent: true },
      { source: '/contact', destination: '/integration/contact', permanent: true },
      {
        source: '/quote',
        has: [{ type: 'query', key: 'division', value: 'events' }],
        destination: '/events/quote',
        permanent: true,
      },
      { source: '/quote', destination: '/integration/quote', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default config;
