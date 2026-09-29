# Application architecture

The Next.js App Router renders content on the server. Interactive islands are limited to navigation, background media, forms and the rental catalog. Global design tokens live in `app/globals.css`; Tailwind 4 is available for utilities. Geist Sans and Geist Mono are loaded with `next/font/local`, using licensed WOFF2 files in `public/fonts/`; builds and visitors do not require external font requests.

## Phase 1 boundaries

- `data/site.ts`: brand, media, service area, navigation, industries and unverified credential records.
- `data/catalog.ts`: typed services, sample portfolio, equipment and shop content.
- `services/content.ts`: repository boundary for replacing typed content with Supabase queries.
- `lib/validation.ts`: shared Zod contract used by both forms and the API.
- `services/inquiries.ts`: persistence adapter with local JSON and server-only Supabase implementations.
- `app/api/inquiries/route.ts`: bounded JSON parsing, origin checks, validation, honeypot, timing check, per-instance throttle, optional local / required production Turnstile verification, authoritative catalog validation and persistence.
- `supabase/migrations/001_inquiries.sql`: the only current database table. Row-level security denies all anonymous and authenticated client access; only the server service role can access it.

The browser sends equipment IDs and quantities. The server loads names and rates from the catalog and stores a snapshot. Rates are not trusted from browser input. A request does not reserve inventory, verify date availability or charge a payment. Local requests are individual files under `.local/inquiries/`, outside public assets and ignored by Git. Production local-file storage is deliberately rejected because serverless disks are ephemeral.

Turnstile and Supabase must both be configured for live production requests. Production missing-configuration and storage failures return 503 rather than a false success. The per-instance in-memory rate limiter is supplemental, not a distributed security boundary. Add a durable edge/WAF limiter for high traffic. On Vercel the supplemental limiter uses its trusted client-address header. Other production hosts must configure a proxy-overwritten `TRUSTED_PROXY_IP_HEADER` or use a host/WAF limiter; the app does not group unrelated production visitors into one shared bucket. No user PII is written to application logs. There is currently no automatic email delivery or retry queue.

## Phase 2 data relationships

Use migrations to add normalized tables when their workflows are implemented:

| Entity | Intended relationships / boundaries |
| --- | --- |
| profiles / users | `auth.users.id`; server-assigned roles, never client-editable |
| clients | Client organization and profile membership |
| jobs | Client, assigned staff, status, project documents |
| services / portfolio_projects | Public approved content; private editing restricted to admins |
| equipment_categories / equipment | Public catalog separate from private serial numbers, cost, maintenance and storage location |
| rental_requests / rental_lines | Client or inquiry, equipment, dates, quantities; later transactional availability checks |
| quote_requests / quotes / quote_lines | Inquiry-to-quote workflow, revisions and approvals |
| invoices / invoice_lines | Client, job or rental, integer minor currency amounts |
| documents | Private storage bucket, scoped signed URLs and membership checks |
| shop_items / orders | Condition, quantity, price and later payment provider references |

`types/domain.ts` provides current contracts and lightweight future client, job and invoice types. Avoid adding empty tables or speculative business logic now. When migrating inquiry JSON into normalized tables, preserve original IDs and audit data.

## Authentication and admin

`/login` is an informational placeholder. `/admin` returns 404 and provides no data. Do not replace it with client-side hiding. Phase 2 requires Supabase SSR Auth, server-enforced roles on every protected route/action, object-level authorization and tested RLS policies before exposing any admin or client data.

## Future integrations

- Email: add a provider adapter and durable notification outbox after successful database writes. Decide delivery monitoring and retries.
- Analytics: choose a provider and consent policy before adding the script in the root layout. No analytics execute today.
- Uploads: private bucket, file size/type validation, malware scanning, signed upload URLs and authorization. The current form does not accept files.
- Payments: server-created checkout sessions and verified webhooks, never client-trusted prices.

## Accessibility and media

Semantic headings, named navigation, skip link, visible keyboard focus, labeled fields, live status feedback and reduced-motion handling are included. Mobile navigation is a disclosure, not a modal; Escape closes it and returns focus. The rental request is an inline panel on phones, a sticky sidebar on larger displays. Hero media is local WebP. Video is opt-in and omitted on mobile, reduced-motion, data-saving and slow connections.

## Toolchain choice

Next.js 16.3.6 / React 19.3.0 are the stable registry versions installed for this build. TypeScript 6.0.3 and ESLint 9.39.5 are compatibility pins: the installed TypeScript ESLint parser rejects TypeScript 7, and Next's React ESLint plugin fails under ESLint 10. Revisit the lint dependency chain before upgrading those major versions. ESLint is development-only; its registry deprecation warning is documented rather than hidden.
