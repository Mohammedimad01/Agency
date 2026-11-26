# Erlyst — Agency Operating System

A complete operating system for a digital agency, in one Next.js + Supabase codebase:

- **Public website** — editorial marketing site, services, case studies, pricing, contact and booking forms. Every inquiry lands in the CRM, scored and assigned.
- **Admin command centre** (`/admin`) — dashboard, lead pipeline, clients, projects (list / board / calendar / workspace), templates, proposals, contracts, invoices, payments, expenses, reports, team, messaging, website CMS and settings.
- **Client portal** (`/portal`) — a calm, private workspace where each client tracks progress, approves deliverables, accepts proposals, downloads invoices and messages the team.
- **Automation engine** — database triggers, Supabase Cron and an idempotent email outbox implement the agency's workflows (no n8n, no paid automation tools).

> The agency name is a placeholder. Change it (and the logo, colours, contact details) in [`src/config/site.ts`](src/config/site.ts) or via `NEXT_PUBLIC_*` environment variables — nothing else is hard-coded.

## Where to sign in

| Who | URL | Lands on |
|---|---|---|
| Owner, team and clients | **`/login`** (e.g. `http://localhost:3000/login`, or `https://your-domain.com/login`) — also linked as **"Client login"** in the site header | Team → `/admin`, clients → `/portal` |
| First-time setup (empty database only) | `/setup` — creates the agency and the owner account, then disappears | `/admin` after email verification |
| Forgot password | `/forgot-password` | `/reset-password` via emailed link |

## Stack

Next.js 16 (App Router, TypeScript strict) · React 19 · Tailwind CSS 4 · shadcn-style components on Radix · React Hook Form + Zod · Supabase (Postgres, Auth, Storage, Realtime, Cron) · Recharts · TanStack Table · date-fns · Resend · @react-pdf/renderer · Vitest · Playwright.

## Quick start (local)

Requirements: Node 20.9+, Docker.

```bash
npm install
```

```bash
npx supabase start
```

```bash
cp .env.example .env.local
```

Fill `.env.local` with the URL / anon key / service-role key printed by `supabase start`, plus any random string for `CRON_SECRET` and `RATE_LIMIT_SALT`. Then:

```bash
npm run db:reset
```

```bash
npm run dev
```

Open http://localhost:3000. Demo accounts (password `Password123!`):

| Account | Role |
|---|---|
| erlyst.tech@gmail.com | Owner (everything) — local demo password only; in production create the owner at `/setup` with your own password |
| pm@erlyst.dev | Project Manager |
| dev@erlyst.dev | Developer (assigned projects only, no finance) |
| design@erlyst.dev | Designer |
| finance@erlyst.dev | Finance Manager |
| client@acme.test | Client portal (Acme Logistics) |
| client@globex.test | Client portal (Globex Retail) |

Emails are printed to the dev-server console (`EMAIL_PROVIDER=console`); local Supabase also runs Mailpit at http://127.0.0.1:54324.

To start with an **empty** workspace instead of demo data, run `npx supabase db reset --no-seed` and open `/setup`.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run typecheck` / `lint` | TypeScript and ESLint |
| `npm test` | Unit tests (no services needed) |
| `npm run test:integration` | RLS and end-to-end workflow tests against local Supabase |
| `npm run test:e2e` | Browser tests (needs Supabase + the app running) |
| `npm run db:reset` / `db:types` / `db:lint` | Database migrations, generated types, schema lint |

## Documentation

| Document | Contents |
|---|---|
| [docs/PRD.md](docs/PRD.md) | Product requirements and scope |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Architecture, routes, rendering, security model, key decisions |
| [docs/DATABASE.md](docs/DATABASE.md) | Schema, money handling, triggers, RPCs, reporting |
| [docs/PERMISSIONS.md](docs/PERMISSIONS.md) | Roles, permission matrix, RLS strategy, client isolation |
| [docs/AUTOMATION.md](docs/AUTOMATION.md) | The 12 workflows, scheduling, email outbox |
| [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | Tokens, typography, components, UX rules |
| [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) | Every environment variable |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Supabase + Vercel production setup |
| [docs/TESTING.md](docs/TESTING.md) | Test strategy and how to run each suite |
| [DEVELOPMENT_STATUS.md](DEVELOPMENT_STATUS.md) | Progress log, open issues and next steps |

## Project layout

```
src/
  app/(public)/      marketing site            app/admin/     internal dashboard
  app/(auth)/        login, setup, invites     app/portal/    client portal
  app/api/           files, PDFs, CSV, cron    app/auth/      email-link confirmation
  components/        ui/ (primitives) · shared/ · public/ · admin/ · auth/
  features/<module>/ actions.ts (server actions) · schemas.ts · queries · components/
  lib/               supabase clients · auth DAL · permissions · finance · email · pdf · services
  config/            site.ts (brand) · navigation
supabase/
  migrations/        schema, RLS, automation, portal views, storage, reporting
  seed.sql           demo data (local only)
tests/               unit · integration · e2e
```
