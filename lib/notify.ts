import 'server-only';
import type { InquiryInput } from '@/lib/validation';

// Emails the business when a new inquiry has been saved. The inquiry is already stored by then, so a failure here is only logged.
const HIDDEN = new Set(['website', 'startedAt', 'turnstileToken', 'items', 'kind', 'division']);
const labels: Record<string, string> = {
  name: 'Name',
  company: 'Company',
  email: 'Email',
  phone: 'Phone',
  topic: 'Topic',
  service: 'Service',
  projectType: 'Project type',
  eventType: 'Event type',
  attendance: 'Attendance',
  needs: 'Needs',
  startDate: 'Start date',
  endDate: 'End date',
  preferredContact: 'Preferred contact',
  message: 'Message',
};

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  );
const clean = (value: string) => value.replace(/[\r\n]+/g, ' ').trim();
const show = (value: unknown) => (Array.isArray(value) ? value.join(', ') : String(value ?? ''));

export async function notifyInquiry(id: string, input: InquiryInput, snapshot: unknown) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const to = process.env.NOTIFY_TO || 'info@k4av.com';
  const from = process.env.NOTIFY_FROM || 'K4 AV Group Website <noreply@k4av.com>';

  const rows = Object.entries(input)
    .filter(([name, value]) => !HIDDEN.has(name) && value !== undefined && show(value) !== '')
    .map(([name, value]) => [labels[name] ?? name, show(value)] as const);
  const items = Array.isArray(snapshot)
    ? snapshot.map((item: { model?: string; manufacturer?: string; quantity?: number }) =>
        `${item.manufacturer ?? ''} ${item.model ?? ''} x ${item.quantity ?? 1}`.trim(),
      )
    : [];
  if (items.length) rows.push(['Equipment', items.join('; ')]);

  const reference = id.slice(0, 8).toUpperCase();
  const who = clean(input.name || 'a visitor');
  const subject = `[K4 AV] New ${input.division ?? 'website'} ${input.kind} inquiry from ${who}`;
  const text = [
    `New ${input.kind} inquiry (${input.division ?? 'website'}), reference ${reference}`,
    '',
    ...rows.map(([k, v]) => `${k}: ${v}`),
  ].join('\n');
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#111"><h2 style="margin:0 0 4px">New ${escapeHtml(input.kind)} inquiry</h2><p style="margin:0 0 16px;color:#555">${escapeHtml(String(input.division ?? 'website'))} · reference ${reference}</p><table cellpadding="6" style="border-collapse:collapse">${rows
    .map(
      ([k, v]) =>
        `<tr><td style="color:#555;vertical-align:top;white-space:nowrap"><b>${escapeHtml(k)}</b></td><td style="white-space:pre-wrap">${escapeHtml(v)}</td></tr>`,
    )
    .join('')}</table></div>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], reply_to: input.email, subject, text, html }),
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) console.error('Inquiry notification failed with status', res.status);
  } catch {
    console.error('Inquiry notification could not be sent');
  }
}
