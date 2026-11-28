# Development status

_Last updated: 2026-11-28_

## Changelog
- **2026-11-28** — Public website redesign: new visual identity (deep ink + lime signal colour, Bricolage Grotesque display type with Instrument Serif italic accents), dark hero with code-built product examples (no stock photos), capability marquee, goal-to-service guide, process, tech stack, FAQ, new header mega-menu and dark footer. New pages for pricing, work, contact and booking. **Frontend-only mode**: the public site now runs without Supabase — services/FAQs fall back to `src/config/content.ts`, forms open a pre-filled email to the agency address, `/login` shows a "not available yet" notice, `/portal` and `/admin` redirect to `/login`, `/setup` returns 404. Tests, lint and production build re-verified (with and without backend env).
- **2026-11-26** — Rebranded to **Erlyst** (tagline "Websites, software & SEO — built to grow.", header subline "Web · Apps · SEO", contact/owner email erlyst.tech@gmail.com). New service catalogue (21 services in four groups) with a header mega-menu, grouped services on the homepage and `/services`, related services on each service page, grouped footer, rewritten homepage copy and SEO keywords. Demo team accounts moved to `@erlyst.dev`. All tests, lint and build re-verified.

## Summary
All eight phases of the brief are implemented and verified end to end on a local Supabase stack. The platform is usable today: the public site captures leads, the admin runs sales/delivery/finance, clients work in their portal, and the automation engine connects them.

| Phase | Status |
|---|---|
| 0 — Discovery & architecture | ✅ docs/PRD.md, ARCHITECTURE.md, DATABASE.md, PERMISSIONS.md, DESIGN_SYSTEM.md |
| 1 — Foundation | ✅ Next.js 16, TS strict, Tailwind 4, design system, Supabase clients, auth DAL, proxy |
| 2 — Public website | ✅ all routes, inquiry/brief/booking intake → CRM, SEO, sitemap, robots, OG image, JSON-LD |
| 3 — Admin foundation | ✅ shell (collapsible sidebar, ⌘K search, realtime notifications, dark mode), dashboard, leads, clients |
| 4 — Project management | ✅ projects (list/board/calendar/workspace), milestones, tasks/subtasks/comments, templates, team, time, deliverables, files |
| 5 — Client portal | ✅ dashboard, projects, approvals/revisions, files, invoices, documents, proposals, messaging, settings |
| 6 — Business operations | ✅ services, proposals, contracts, invoices, payments, expenses, finance overview, reports + CSV, PDFs |
| 7 — Automation | ✅ 12 workflows via triggers, pg_cron, email outbox with retries/idempotency, Resend provider |
| 8 — Testing & deployment | ✅ 42 unit/integration tests, 9 browser E2E tests, build + lint clean (0 errors), deployment guide |

## Verification performed
- `npm run typecheck` ✅ · `npm run lint` ✅ (0 errors; 21 React-Compiler warnings about React Hook Form's `watch()`, expected) · `npm run build` ✅ · `supabase db lint` ✅
- Unit tests (22): money/totals parity with SQL, qualification, validation, email escaping.
- Integration tests (20) against real Postgres + Auth: RLS for anon, two clients, developer, finance, owner protections; the full Definition-of-Done workflow (11 steps).
- Browser E2E (9): inquiry → CRM, validation, redirects, role restrictions, portal isolation, deliverable change request, invoice → payment, project from template, mobile width.
- Manually driven in a browser: first-run `/setup` on an empty database with email verification; portal invitation (incl. resend → magic link) → accept → portal; password reset; one-time link reuse rejected; file upload/download authorisation (other client → 404, `.exe` rejected); PDF rendering; CSV export; cron auth (401 without secret).

## Security fixes found by the tests
- Developers could read project budgets through `projects` rows → moved to `project_finances` with finance/PM-only RLS; finance report functions now check `finance.view` explicitly.
- Rate limiting counted successful logins → now only failed attempts count.
- Dev server logged server-action arguments (passwords) → disabled.

## Known limitations / outstanding
- **Online payments**: manual recording only. `payments.provider` / `provider_payment_id` (unique) are ready for a Stripe/PayPal webhook; no provider is integrated yet.
- **Booking**: built-in request form + optional external scheduler link (`NEXT_PUBLIC_BOOKING_URL`); no two-way calendar sync.
- **Resend** is implemented but was exercised only with the console provider here (no API key in this environment). Verify with a real key before launch.
- **Supabase Edge Functions** are intentionally not used (see ARCHITECTURE.md → Key decisions); scheduling uses pg_cron + Next.js route handlers.
- No avatar upload UI yet (`profiles.avatar_url` exists); no "trash / restore" UI for soft-deleted records.
- Per-project task Kanban isn't built (tasks are grouped by milestone with inline status); the project-level board exists.
- The UI assumes one organisation per team member (the schema supports many).
- Realtime notifications/messages were verified to load; live push across two browsers wasn't covered by automated tests.

## Next steps (suggested)
1. Deploy to Supabase + Vercel following docs/DEPLOYMENT.md; configure Resend and `private.app_config`.
2. Replace demo content: brand assets in `src/config/site.ts`, services, case studies, testimonials.
3. Add a payment provider (Stripe Checkout + webhook writing to `payments` with `provider_payment_id`).
4. Calendar integration for bookings (Cal.com webhook → `meeting_records`).
5. Avatar uploads, soft-delete restore UI, per-project task board, saved table views.
6. CI: GitHub Actions running typecheck, lint, unit tests, and integration/E2E against `supabase start`.

## How to resume
`npx supabase start` → `npm run db:reset` → `npm run dev`. Run `npm test`, `npm run test:integration`, `npm run test:e2e`. Architecture and conventions are documented in `docs/`.
