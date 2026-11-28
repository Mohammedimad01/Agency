# Environment variables

| Variable | Required | Scope | Description |
|---|---|---|---|
| `NEXT_PUBLIC_APP_URL` | yes | public | Canonical URL, used in emails, auth links, sitemap, metadata (e.g. `https://gridlab.com`). |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | public | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | public | Supabase anon/publishable key (safe in the browser; RLS protects data). |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | **server only** | Service-role key. Never prefix with `NEXT_PUBLIC_`, never expose to the browser. |
| `CRON_SECRET` | yes | server | Bearer token for `/api/cron/*`. Also stored in the database for pg_cron (see DEPLOYMENT.md). Use 32+ random characters. |
| `RATE_LIMIT_SALT` | recommended | server | Salt for hashing visitor IPs in rate limiting. |
| `EMAIL_PROVIDER` | no | server | `resend` or `console` (default: `resend` if `RESEND_API_KEY` is set, otherwise `console`). |
| `RESEND_API_KEY` | for email | server | Resend API key. |
| `EMAIL_FROM` | for email | server | Verified sender, e.g. `GridLab <hello@yourdomain.com>`. |
| `NEXT_PUBLIC_AGENCY_NAME` / `_SHORT_NAME` / `_TAGLINE` / `_DESCRIPTION` | no | public | Brand overrides (defaults in `src/config/site.ts`). |
| `NEXT_PUBLIC_AGENCY_LOGO` / `NEXT_PUBLIC_AGENCY_MARK` | no | public | Logo path under `/public`, or the letter used in the generated mark. |
| `NEXT_PUBLIC_BRAND_COLOR` / `NEXT_PUBLIC_BRAND_FOREGROUND` | no | public | Brand colours (any CSS colour). |
| `NEXT_PUBLIC_CONTACT_EMAIL` / `_PHONE` / `_ADDRESS` / `_HOURS` | no | public | Contact details shown on the site and in emails. |
| `NEXT_PUBLIC_SOCIAL_LINKEDIN` / `_INSTAGRAM` / `_X` / `_GITHUB` | no | public | Social links (empty hides the icon). |
| `NEXT_PUBLIC_BOOKING_URL` | no | public | External scheduler (Cal.com, Calendly). Without it, the built-in request form is used. |
| `NEXT_PUBLIC_DEFAULT_CURRENCY` / `NEXT_PUBLIC_DEFAULT_TIMEZONE` / `NEXT_PUBLIC_LOCALE` | no | public | Display defaults; per-organisation currency/timezone live in Settings. |
| `NEXT_PUBLIC_ORGANIZATION_SLUG` | no | public | Which organisation the public site shows (defaults to the first). |
| `E2E_BASE_URL` | no | tests | Target for Playwright tests. |

Secrets are never committed (`.env*` is git-ignored; `.env.example` lists names only).
