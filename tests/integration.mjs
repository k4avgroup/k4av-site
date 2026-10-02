import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const origin = process.env.TEST_ORIGIN || 'http://127.0.0.1:3000';
const base = {
  kind: 'contact',
  topic: 'General question',
  name: 'Local QA',
  email: 'qa@example.com',
  message: 'Automated local integration verification.',
  startedAt: Date.now() - 10000,
};
async function post(data, extra = {}) {
  const result = await fetch(`${origin}/api/inquiries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin, ...extra },
    body: JSON.stringify(data),
  });
  return { status: result.status, body: await result.json() };
}
const routes = [
  '/',
  '/services',
  '/services/commissioning',
  '/services/programming',
  '/services/installation-support',
  '/services/troubleshooting',
  '/services/live-audio',
  '/services/event-support',
  '/projects/meeting-space',
  '/projects/live-event',
  '/projects/system-commissioning',
  '/integration',
  '/events',
  '/events/rentals',
  '/integration/about',
  '/integration/contact',
  '/integration/quote',
  '/events/about',
  '/events/contact',
  '/events/quote',
  '/quote?division=events',
  '/shop',
  '/about',
  '/contact',
  '/quote',
  '/login',
  '/privacy',
  '/terms',
  '/sitemap.xml',
  '/robots.txt',
  '/favicon.ico',
  '/icon.png',
  '/apple-icon.png',
  '/opengraph-image.png',
  '/images/hero/hero-1-ballroom.webp',
];
for (const path of routes) {
  const result = await fetch(origin + path);
  assert.equal(result.status, 200, path);
}
for (const path of ['/admin', '/not-a-real-route', '/projects/not-real', '/services/consulting']) {
  assert.equal((await fetch(origin + path)).status, 404, path);
}
assert.equal((await post({ ...base, email: 'bad' })).status, 400);
assert.equal((await post({ ...base, website: 'bot.example' })).status, 400);
assert.equal((await post(base, { Origin: 'https://not-allowed.example' })).status, 403);
assert.equal(
  (
    await post({
      ...base,
      kind: 'rental',
      phone: '2065550100',
      startDate: '2099-01-01',
      endDate: '2099-01-02',
      fulfillment: 'Pickup',
      items: [{ equipmentId: 'not-real', quantity: 1 }],
    })
  ).status,
  400,
);
assert.equal((await post({ ...base, kind: 'shop', shopItemId: 'video-accessories' })).status, 400);
for (const data of [
  base,
  { ...base, kind: 'quote', service: 'Commercial AV', location: 'Seattle', timeline: 'Next month' },
  { ...base, kind: 'shop', shopItemId: 'used-projector' },
]) {
  const result = await post(data);
  assert.equal(result.status, 201, JSON.stringify(result.body));
  assert.equal(result.body.mode, 'local');
  const stored = JSON.parse(await readFile(`.local/inquiries/${result.body.id}.json`, 'utf8'));
  assert.equal(stored.kind, data.kind);
  assert.equal(stored.payload.email, data.email);
  assert.equal('turnstileToken' in stored.payload, false);
}
console.log(
  `PASS: ${routes.length} public routes/assets, 4 expected 404s, rejection cases, and contact/quote/shop durable local saves.`,
);
