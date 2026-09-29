# K4 AV Group

A complete Phase 1 public website foundation for AV engineering, commissioning, programming, field support, live events and equipment rental. It uses a dark navy and black visual system, orange action buttons and restrained electric-blue technical accents, with locally hosted Geist fonts, illustrative media and clearly labeled sample content.

## Start locally

Install Node.js 24 LTS and pnpm 11. From this project directory:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open **http://127.0.0.1:3000**. No environment file or Supabase account is required for development. Local form submissions are saved as individual JSON files in `.local/inquiries/`; success messages explicitly say they have not been sent to the business. That folder is excluded from Git.

To use environment settings, copy `.env.example` to `.env.local`, edit it and restart the server. Never commit `.env.local`.

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm start
```

Stop the development server before running `pnpm start` on the same port. A production server requires live inquiry configuration; it intentionally refuses local-file submissions. For optional local API checks, keep the development server running and use `node tests/integration.mjs`. This writes clearly named QA records to `.local/inquiries/`. Wait a minute after repeated form testing if the request throttle activates.

## Stack and structure

Next.js App Router, React, TypeScript, Tailwind CSS 4, Lucide icons, Zod and Supabase JS. Dependencies are locked in `pnpm-lock.yaml`. See `docs/ARCHITECTURE.md` for compatibility pins and future module boundaries.

```text
app/                 Public routes, metadata and inquiry API
components/          Header, footer, cards, sections, forms and rental UI
data/                Editable typed site and catalog content
lib/                 Validation, metadata and rental state helpers
services/            Content and inquiry storage adapters
types/               Business entity contracts
public/images/       Local website imagery
public/video/        Optional hero video
supabase/migrations/ Database setup
tests/               Validation, basket and local API checks
docs/                Architecture, launch checklist and verification
```

## Routes

`/`, `/services`, `/services/[slug]`, `/projects`, `/projects/[slug]`, `/industries`, `/rental`, `/shop`, `/about`, `/contact`, `/quote`, `/login`, `/privacy`, `/terms`.

`/api/inquiries` accepts validated contact, quote, rental and shop requests. `/admin` returns 404 until authenticated administration exists. Sitemap and robots endpoints are generated automatically. Login is a professionally styled coming-soon page, not an authentication form.

## Visual design system

The 2026-09 refinement uses locally hosted Geist Sans for reading and headings, with Geist Mono for technical labels. Shared color, type, radius and spacing tokens live at the top of `app/globals.css` and are exposed to Tailwind. Orange (`#FF7300`) identifies primary actions; electric blue (`#009DFF`) identifies technical details and interaction states. Font files and their OFL license are in `public/fonts/`; `lib/fonts.ts` configures loading without external font requests. See `docs/DESIGN-SYSTEM.md` for the type scale and component rules.

## Edit content

- **Brand, service area, phone, email, social profiles, hero media:** `data/site.ts`.
- **Services, portfolio projects, rental equipment, categories, shop:** `data/catalog.ts`.
- **Headings and longer page copy:** the relevant file in `app/` or `components/sections.tsx`.
- **Colors, typography, spacing and responsive breakpoints:** `app/globals.css`.
- **Repository adapter for a future database editor:** `services/content.ts`.

To add a service, add a `Service` object with a unique slug and `enabled: true`. It receives a detail page automatically. Add a corresponding inquiry service option in `lib/validation.ts` and service-to-form mapping in the detail route if needed. Consulting is currently disabled.

To add a project, add a `Project` record with challenge, solution, technologies and result. Put approved photography in `public/images/projects/` and use `/images/projects/filename.webp`. Remove the sample label only after replacing all illustrative content; the current project pages and notices are deliberately labeled as examples and should be edited when real cases are published.

To add equipment, create a record with a stable ID, category, manufacturer, model, description, specifications, quantity, availability, condition and optional accessories. Supply daily and weekly prices or keep `null` for “Request pricing.” Add new category names to `equipmentCategories`. Photos belong in `public/images/equipment/`. Quantity is a request cap, not a real-time availability calculation. The sample catalog uses a demo cap of four per item.

To add a shop item, provide its stable ID, manufacturer/model, description, condition, price (or `null`), quantity and Available/Pending/Sold status. Sold items have no inquiry action; pending items allow questions. Inventory and payment workflows belong to Phase 2.

## Replace the logo

Edit `components/logo.tsx`. Replace the temporary text monogram with a supplied SVG or a Next.js `Image`, keeping the accessible home link. Put the asset in `public/` and preserve explicit image dimensions. Update `public/favicon.svg` separately.

## Replace hero imagery or add video

The bundled `public/images/hero/av-control.webp` is an AI-generated illustrative equipment scene. `av-detail.webp` is a crop of the same image. They are development placeholders, not photographs of company work, and need no external stock server.

Replace `site.hero.images` in `data/site.ts` with approved local image paths. Use high-quality landscape WebP images around 1600–2000 pixels wide. Keep the left side suitable for readable text. The first image is the video poster and static fallback. Keep at least one valid image. The slide counter follows the configured image list.

Put an optimized, muted H.264 MP4 in `public/video/` and set `site.hero.video` to `/video/hero.mp4`. Keep it short and small, ideally below 5 MB. The browser only mounts video on sufficiently wide, motion-enabled, non-data-saving, non-slow connections. On video failure, the images remain available. Visitors can pause motion. No external image hosts or fonts are required.

## Configure Supabase for live inquiries

1. Create a Supabase project.
2. Run `supabase/migrations/001_inquiries.sql` in its SQL editor.
3. Set server-only `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
4. Set `INQUIRY_STORAGE=supabase`.
5. Create a Cloudflare Turnstile widget for the deployment hostname. Set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and server-only `TURNSTILE_SECRET_KEY`.
6. Set `NEXT_PUBLIC_SITE_URL` to the exact public origin, for example `https://your-domain.example` with no trailing slash.
7. Rebuild/redeploy, submit a test inquiry and check the `inquiries` table in Supabase. Verify the anonymous role cannot read it.

The service role key must never use a `NEXT_PUBLIC_` prefix. Row-level security denies direct public reads and writes. Requests go through the server API. The table stores kind, status, validated payload and a server-generated equipment/item snapshot. Until an admin dashboard exists, the owner reviews submissions in Supabase. **Email notifications are not implemented.**

| Variable | Requirement |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Required for real deployment SEO and origin validation; defaults to local development |
| `INQUIRY_STORAGE` | Local by default in development; use `supabase` in production |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Required for live database submissions |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Required for public production submissions; optional locally |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Reserved for Phase 2 client Auth; unused in Phase 1 |
| `EMAIL_API_KEY`, `ANALYTICS_DOMAIN` | Reserved placeholders; no email or analytics integration is active |

Production intentionally returns a clear error if backend configuration is incomplete. It never silently accepts a request into temporary serverless storage.

## GitHub and Vercel deployment

1. Run the checks above and review `docs/LAUNCH-CHECKLIST.md`.
2. Create an empty GitHub repository. This directory is an independent Git project; commit source and lockfile, excluding `.local`, `.env.local`, `node_modules` and `.next`.
3. Add the repository remote and push your branch to GitHub. No GitHub repository or remote is created by this local build.
4. In Vercel, import that GitHub repository. Choose Next.js and this directory as the root if the repository contains other projects.
5. Use Node.js 24, install command `pnpm install --frozen-lockfile`, build command `pnpm build` and the default Next.js output configuration.
6. Set the production variables listed above in Vercel. Public variables are embedded at build time, so rebuild after changing them.
7. Deploy, connect the custom domain and verify canonical URLs, sitemap, Turnstile hostname and all request types.

No deployment was performed and no hosting account is required to run locally. The application is portable to a Node.js host with persistent Supabase access. It is not a static export because inquiry processing needs a server.

## What remains for Phase 2

Supabase Auth, client memberships, a protected admin dashboard, editable content and inventory, real rental availability/reservations, quote approvals, jobs, invoices, private documents, payments, automated emails and analytics. Lightweight contracts and the repository boundaries support this evolution without replacing the public website.

Before public launch, replace sample equipment, projects and media; approve business contact details, biography, credentials, policies and prices; then configure and test live storage and anti-spam. See the launch checklist for the complete owner-input list.
