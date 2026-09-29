# Phase 1 verification

## Visual refinement verification — September 25, 2026

- TypeScript, ESLint, all 8 existing tests and the production build pass after the visual changes.
- All 10 main public views and two detail-page examples were checked in the browser at 1440px; the 10 main views were also checked at 390px.
- Home, Rental, Quote and Shop were additionally checked at 320, 768, 1024 and 1280px. No horizontal page overflow or clipped headings/buttons were detected in those checks.
- Browser-computed styles confirm Geist Sans, 18px desktop body, 17px mobile body, 24px desktop service-card headings, orange primary CTAs (`rgb(255,115,0)`) and blue technical icons (`rgb(0,157,255)`).
- Mobile navigation and Escape/focus behavior remain functional. Rental filters, adding multiple items, quantity changes, item removal and a successful local submission were exercised through the styled interface.
- The existing API integration check passed: 26 public routes/assets, four expected 404s, rejection cases and local contact/quote/shop writes.
- Hash comparison confirms the existing route files, content records, schema validation, rental-state helpers, domain types and backend code are unchanged. Production dependency and lockfiles are unchanged.
- Font files are self-hosted and licensed; no new runtime dependency or remote font request was introduced. Original photography is unchanged.

Live Supabase, Turnstile and deployed-domain verification remain outside this visual refinement because production credentials have not been configured.

## Original foundation checks

Verified locally on September 23–24, 2026 using Node.js 24.19.0.

| Check | Result |
| --- | --- |
| TypeScript (`pnpm typecheck`) | Passed |
| ESLint (`pnpm lint`) | Passed with no errors or warnings |
| Unit tests (`pnpm test`) | 8 passed |
| Production build (`pnpm build`) | Passed; 27 generated pages |
| Route and asset HTTP checks | 26 returned 200 |
| Protected / unknown routes | `/admin`, unknown page/project and disabled service returned 404 |
| Local inquiry API | Contact, quote and shop records persisted and read back from disk |
| Browser rental flow | Add multiple items, edit quantity, remove item, reload persistence, reject reversed dates, save and clear basket |
| Browser quote flow | Reject phone preference without phone, accept corrected form, show local-save reference |
| Browser navigation | Mobile menu opens, navigates, closes and responds to Escape |
| Responsive checks | 320, 390, 768 and desktop 1280+ widths; no horizontal overflow in checked views |
| Images | Hero and project assets load; no broken homepage images |
| Production startup | Public pages respond; unconfigured inquiry endpoint returns 503 rather than claiming success |
| Source hygiene | No live credentials; local inquiry data, environment files, dependencies and build output excluded from source archive/Git |

Tests cover valid requests, missing quote fields, invalid email, required phone preference, same-day rentals, reversed and impossible dates, duplicate/fractional rental quantities, restored basket normalization, and the Seattle date at UTC midnight. API checks also cover honeypot and origin rejection, unknown equipment, and sold shop items.

Not verified: live Supabase storage/RLS against an owner account, real Turnstile verification, email delivery (not implemented), real video playback (no owner video supplied), full accessibility audit, or a deployed domain. Configure and check these before public launch. Current projects, equipment, imagery, credentials and contact details are deliberately provisional as documented in the launch checklist.
