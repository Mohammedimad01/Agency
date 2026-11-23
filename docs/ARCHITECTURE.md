# Architecture

## Overview
```
Browser ──► Next.js (Vercel)                         Supabase
            ├─ proxy.ts: session refresh + coarse redirects
            ├─ Server Components: read with the user's session ──► PostgREST ──► Postgres (RLS on every table)
            ├─ Server Actions: validate (Zod) → authorize → write ─┘                │
            ├─ Route handlers: /api/files, /api/pdf, /api/export, /api/cron        ├─ triggers: totals, statuses, notifications, outbox
            └─ Client Components: forms, tables, charts, Realtime ◄── Realtime ◄───┤  pg_cron: hourly automations, 5-min email dispatch
                                                                                   └─ Storage: private buckets (signed URLs only)
            Email: outbox table ─► dispatcher (/api/cron/outbox or after()) ─► Resend
```

**One codebase, three experiences**: `src/app/(public)`, `src/app/admin`, `src/app/portal`, sharing the design system, data layer and business logic.

## Key decisions
| Decision | Why |
|---|---|
| **The database is the security boundary.** RLS on all 48 tables; business invariants (totals, invoice status, overpayment, owner protection) are enforced by triggers. | Frontend checks and server actions can have bugs; Postgres guarantees hold regardless of the caller. |
| **Clients never read base tables.** They read `portal_*` views (owner-privileged, filtered by `auth.uid()`, client-safe columns only) and act through `portal_*` SECURITY DEFINER functions. Only `notifications`, `conversations` and `messages` have client RLS policies (needed for Realtime). | RLS is row-level, so a policy can't hide columns such as internal notes, budgets or internal tasks. Views give column-level isolation. |
| **Financial fields that delivery staff can see rows of live in separate tables** (`project_finances`). | Same row-vs-column reason; developers can see their projects but not their budgets. |
| **Money is BIGINT minor units; totals are computed in SQL** (`calc_line_amount`, `calc_discount_cents`, `calc_tax_cents`). A BigInt TypeScript mirror powers live previews and is unit-tested against the same rounding (half away from zero). | No floating point anywhere; client-submitted totals are ignored. |
| **Invoice status is derived from completed payments**, not from user input. Payments are an append-only ledger (no DELETE policy; corrections use `refunded`/`failed`). | "An invoice is not paid because someone clicked a button." |
| **Automation is native**: triggers + `pg_cron` + an email outbox with idempotency keys and SKIP LOCKED claiming. | Free, reliable, transactional, and replaceable — no n8n. |
| **Auth emails are sent by the app, not Supabase SMTP**: `auth.admin.generateLink()` creates the one-time token; our templates and provider deliver it. | Supabase's built-in SMTP is heavily rate-limited on the free tier, and this keeps every email on-brand. Tokens are never stored in the outbox. |
| **Email/scheduling logic runs in Next.js route handlers** (`/api/cron/*`) invoked by pg_cron (via pg_net) or Vercel Cron, rather than Supabase Edge Functions. | Keeps templates, provider code and business logic in one TypeScript codebase with one deployment. The SQL automations run inside Postgres directly. An Edge Function can be added later as another caller of the same endpoint. |
| **Rendering model**: `cacheComponents` is disabled. Public pages are statically generated with 5-minute ISR (anonymous Supabase client, no cookies). Admin and portal pages are dynamic per request. | Nearly every admin/portal page is user-specific; the classic model is simpler and safer here. |
| **Provider interfaces**: `EmailProvider` (Resend / console); payments carry `provider` + `provider_payment_id` with a unique index so a Stripe/PayPal webhook can insert idempotently later. | Swap vendors without touching business logic. |
| **Organisation-scoped schema** (every row carries `organization_id`; helpers take an org). | Ready to grow into multi-tenant SaaS. |

## Request lifecycle (mutation)
1. Client component calls a **server action** (`src/features/*/actions.ts`).
2. `teamAction(permission, fn)` / `clientAction(fn)` / `publicAction(fn)` loads the session-derived context (organisation and role come from the database, never from input) and checks the permission.
3. Input is parsed with Zod (`parseInput`); money strings become integer minor units.
4. The write uses the **user's Supabase client**, so RLS applies. The service-role client (`createAdminClient`) is used only for: public inquiry intake (after rate limiting), auth admin (invites/links), signed storage URLs after an access check, outbox dispatch, setup, and the owner-only permission matrix.
5. Postgres triggers apply invariants and side effects (notifications, activity log, outbox emails).
6. Errors are mapped to safe messages (`dbError`); business-rule exceptions raised by triggers are shown to the user verbatim.

## Authentication & sessions
- Supabase Auth (email + password, email verification required). Sessions in cookies via `@supabase/ssr`.
- `src/proxy.ts` refreshes the session (`getClaims`) and redirects signed-out users away from `/admin` and `/portal`. It is **not** the security boundary.
- `src/lib/auth/session.ts` is the data-access layer: `getUser()` (validated with the Auth server), `getTeamContext()` (role + permissions from `team_members` / `role_permissions`), `getClientContext()` (from `portal_*` views), `requireTeam(permission)`, `requireClient()`.
- Flows: `/setup` (first owner; disappears afterwards), `/login`, `/forgot-password` → email → `/auth/confirm` → `/reset-password`, invitations → `/auth/confirm` → `/accept-invite`.

## Routes
**Public**: `/`, `/about`, `/services`, `/services/[slug]`, `/portfolio`, `/portfolio/[slug]`, `/pricing`, `/contact`, `/book-a-call`, `/sitemap.xml`, `/robots.txt`, `/opengraph-image`.
**Auth**: `/login`, `/setup`, `/forgot-password`, `/reset-password`, `/accept-invite`, `/auth/confirm`, `/auth/signout`.
**Admin**: `/admin` (dashboard), `/admin/leads[/id]`, `/admin/meetings`, `/admin/clients[/id]`, `/admin/proposals[/new|/id|/id/edit]`, `/admin/contracts[/id]`, `/admin/projects[/new|/id]` (`?view=list|board|calendar`, `?tab=…`, `?task=…`), `/admin/templates[/id]`, `/admin/services`, `/admin/finance`, `/admin/finance/invoices[/new|/id|/id/edit]`, `/admin/finance/payments`, `/admin/finance/expenses`, `/admin/reports`, `/admin/team`, `/admin/messages`, `/admin/website`, `/admin/settings`, `/admin/notifications`, `/admin/access-denied`.
**Portal**: `/portal`, `/portal/projects[/id]`, `/portal/invoices[/id]`, `/portal/documents`, `/portal/documents/proposals/[id]`, `/portal/messages`, `/portal/settings`, `/portal/notifications`.
**API**: `/api/files/[id]` (authorised signed download), `/api/pdf/invoice/[id]`, `/api/pdf/proposal/[id]`, `/api/export/[report]` (CSV), `/api/cron/[job]` (`outbox`, `automations`; bearer `CRON_SECRET`).

## Files & storage
Private buckets `project-files` (50 MB) and `finance-files` (20 MB) with MIME allow-lists, plus `public-assets` for website images. Uploads are two-step: the server authorises and signs an upload URL → the browser uploads directly → the server verifies the object and records it in `files` (RLS). Downloads go through `/api/files/[id]`, which requires the row to be visible to the caller (team RLS or `portal_files`) before issuing a 60-second signed URL. Storage policies add defence in depth by organisation folder.

## Code organisation
- `src/features/<module>/` — `actions.ts` (server actions), `schemas.ts` (Zod), queries and `components/`.
- `src/lib/` — Supabase clients, auth DAL, permissions, action helpers, finance maths, email (templates, layout, dispatcher), PDF, storage, validation primitives, formatting.
- `src/components/ui` — design-system primitives; `components/shared` — data table, charts, forms, dialogs, status badges, uploader, notification bell.
