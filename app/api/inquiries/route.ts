import { inquirySchema } from '@/lib/validation';
import { contentRepository } from '@/services/content';
import { saveInquiry } from '@/services/inquiries';
export const runtime = 'nodejs';
const buckets = new Map<
  string,
  {
    count: number;
    reset: number;
  }
>();
function response(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}
export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  const expected = process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL).origin
    : new URL(request.url).origin;
  const localOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
  if (origin && origin !== expected && !(process.env.NODE_ENV !== 'production' && localOrigins.includes(origin)))
    return response({ error: 'Request origin is not allowed.' }, 403);
  if (!request.headers.get('content-type')?.includes('application/json'))
    return response({ error: 'Send a JSON request.' }, 415);
  // Per-instance throttle is supplemental; Turnstile provides production bot protection.
  const ipHeader = process.env.VERCEL ? 'x-vercel-forwarded-for' : process.env.TRUSTED_PROXY_IP_HEADER;
  const ip =
    process.env.NODE_ENV !== 'production'
      ? 'local'
      : ipHeader
        ? request.headers.get(ipHeader)?.split(',')[0]?.trim()
        : null;
  const now = Date.now();
  for (const [key, b] of buckets) if (b.reset < now) buckets.delete(key);
  if (ip) {
    const bucket = buckets.get(ip) || { count: 0, reset: now + 60000 };
    if (bucket.count >= 8) return response({ error: 'Too many requests. Please wait a minute and try again.' }, 429);
    bucket.count++;
    if (buckets.size < 10000 || buckets.has(ip)) buckets.set(ip, bucket);
  }
  let raw: unknown;
  try {
    const reader = request.body?.getReader();
    if (!reader) return response({ error: 'A request body is required.' }, 400);
    let bytes = 0;
    const chunks: Uint8Array[] = [];
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 32768) {
        await reader.cancel();
        return response({ error: 'The request is too large.' }, 413);
      }
      chunks.push(value);
    }
    raw = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return response({ error: 'Invalid request body.' }, 400);
  }
  const parsed = inquirySchema.safeParse(raw);
  if (!parsed.success)
    return response(
      { error: 'Please review the highlighted fields.', fields: parsed.error.flatten().fieldErrors },
      400,
    );
  const data = parsed.data;
  if (data.website || now - data.startedAt < 1500 || data.startedAt > now || now - data.startedAt > 86400000)
    return response({ error: 'Please refresh the form and try again.' }, 400);
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (process.env.NODE_ENV === 'production' && !secret)
    return response({ error: 'Online inquiries are not configured yet. Please try again later.' }, 503);
  if (secret) {
    try {
      const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: new URLSearchParams({ secret, response: data.turnstileToken || '' }),
        signal: AbortSignal.timeout(8000),
      });
      const check = await res.json();
      if (!check.success || check.hostname !== new URL(expected).hostname)
        return response({ error: 'Please complete the spam-protection check again.' }, 400);
    } catch {
      return response({ error: 'Spam protection is temporarily unavailable. Please retry.' }, 503);
    }
  }
  let snapshot: unknown = [];
  if (data.kind === 'rental') {
    const catalog = contentRepository.equipment();
    const selections = data.items.map((line) => ({ line, item: catalog.find((e) => e.id === line.equipmentId) }));
    if (
      selections.some(({ line, item }) => !item || item.availability === 'Unavailable' || line.quantity > item.quantity)
    )
      return response(
        { error: 'One or more items are unavailable or exceed the request quantity. Please update your request.' },
        400,
      );
    snapshot = selections.map(({ line, item }) => ({
      id: item!.id,
      model: item!.model,
      manufacturer: item!.manufacturer,
      quantity: line.quantity,
      sample: item!.sample,
      dailyPrice: item!.dailyPrice,
      weeklyPrice: item!.weeklyPrice,
    }));
  }
  if (data.kind === 'shop') {
    const item = contentRepository.shop().find((x) => x.id === data.shopItemId);
    if (!item || item.status === 'Sold')
      return response({ error: 'This item is no longer available for inquiry.' }, 400);
    snapshot = { id: item.id, model: item.model, price: item.price, sample: item.sample };
  }
  try {
    const saved = await saveInquiry(data, snapshot);
    return response(saved, 201);
  } catch {
    return response(
      { error: 'Your request could not be saved. Please try again later; no confirmation has been issued.' },
      503,
    );
  }
}
