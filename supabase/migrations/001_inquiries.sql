-- Phase 1: server-only inquiry inbox. Execute in the Supabase SQL editor.
create table if not exists public.inquiries (
  id uuid primary key,
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('quote','contact','rental','shop')),
  status text not null default 'new' check (status in ('new','reviewing','closed')),
  payload jsonb not null,
  catalog_snapshot jsonb not null default '[]'::jsonb
);
alter table public.inquiries enable row level security;
revoke all on table public.inquiries from anon, authenticated;
grant select, insert, update, delete on table public.inquiries to service_role;
create index if not exists inquiries_status_created_idx on public.inquiries(status, created_at desc);
-- No public RLS policies. The service key is used exclusively by the server.
-- Add explicitly scoped client/admin policies only when authenticated modules exist.
