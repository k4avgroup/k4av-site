import 'server-only';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import type { InquiryInput } from '@/lib/validation';
export type StoredInquiry = {
  id: string;
  created_at: string;
  kind: InquiryInput['kind'];
  status: 'new';
  payload: Omit<InquiryInput, 'website' | 'startedAt' | 'turnstileToken'>;
  catalog_snapshot: unknown;
};
export async function saveInquiry(input: InquiryInput, catalogSnapshot: unknown) {
  const { website, startedAt, turnstileToken, ...payload } = input;
  void website;
  void startedAt;
  void turnstileToken;
  const record: StoredInquiry = {
    id: randomUUID(),
    created_at: new Date().toISOString(),
    kind: input.kind,
    status: 'new',
    payload,
    catalog_snapshot: catalogSnapshot,
  };
  const mode = process.env.INQUIRY_STORAGE || (process.env.NODE_ENV === 'production' ? 'supabase' : 'local');
  if (mode === 'supabase') {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('STORAGE_UNAVAILABLE');
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error } = await db.from('inquiries').insert(record);
    if (error) throw new Error('STORAGE_WRITE_FAILED');
    return { id: record.id, mode: 'live' as const };
  }
  if (mode !== 'local' || process.env.NODE_ENV === 'production') throw new Error('STORAGE_UNAVAILABLE');
  const dir = path.join(process.cwd(), '.local', 'inquiries');
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, `${record.id}.json`), JSON.stringify(record, null, 2), { flag: 'wx', mode: 0o600 });
  return { id: record.id, mode: 'local' as const };
}
