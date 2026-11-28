# Deployment (Supabase + Vercel)

## 0. Frontend-only launch (no backend yet)
The public website can go live before Supabase is set up:
1. Import the repository into Vercel (framework: Next.js, Node 20+).
2. Set `NEXT_PUBLIC_APP_URL` to the live URL (e.g. `https://erlyst.com`). Optionally set `NEXT_PUBLIC_WHATSAPP_NUMBER` (digits with country code, e.g. `9715XXXXXXXX`) to show WhatsApp buttons.
3. Leave the Supabase variables unset. Deploy.

In this mode the quote, contact and booking forms open the visitor's email app with a pre-filled message to `siteConfig.contact.email`; services and FAQs come from `src/config/content.ts`; `/login` explains that sign-in is not available yet. Add the Supabase variables later (steps 1–4 below) and redeploy — the site switches to the database, CRM and portal automatically.

## 1. Supabase
1. Create a project (free tier works).
2. Link and push the schema:
   ```bash
   npx supabase link --project-ref <your-ref>
   ```
   ```bash
   npx supabase db push
   ```
   Do **not** run `seed.sql` in production.
3. **Extensions**: Dashboard → Database → Extensions → enable `pg_cron` and `pg_net`. If they weren't enabled when migrations ran, re-run the scheduling block from `supabase/migrations/20261123000700_automation.sql` (the `cron.schedule` calls) in the SQL editor.
4. **Tell pg_cron where the app is** (SQL editor, service role):
   ```sql
   insert into private.app_config (key, value) values
     ('app_url', 'https://your-domain.com'),
     ('cron_secret', '<same value as CRON_SECRET>')
   on conflict (key) do update set value = excluded.value;
   ```
5. **Auth settings** (Authentication → URL configuration): Site URL = your domain; add `https://your-domain.com/**` to redirect URLs. Keep "Confirm email" enabled. Optionally disable public sign-ups (the app only creates users through setup and invitations).
6. Realtime: `notifications` and `messages` are added to the `supabase_realtime` publication by the migration (verify under Database → Publications).

## 2. Email (Resend)
Verify your domain in Resend, create an API key, and set `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_PROVIDER=resend`. Auth emails (invitations, verification, password reset) are sent by the app via Resend, so Supabase's SMTP limits don't apply.

## 3. Vercel
1. Import the repository. Framework: Next.js. Node 20+.
2. Set the environment variables from ENVIRONMENT.md for Production (and Preview if used). `SUPABASE_SERVICE_ROLE_KEY` must **not** be exposed as `NEXT_PUBLIC_`.
3. Deploy. `vercel.json` registers a daily cron (`/api/cron/automations`) as a safety net; Vercel sends `Authorization: Bearer $CRON_SECRET` automatically.

## 4. First run
Open `https://your-domain.com/setup`, create the agency and owner account, confirm the email, then:
- Settings → Organization: legal name, address, tax ID, currency, tax rate, payment instructions, numbering.
- Services, website content (case studies, testimonials, FAQs).
- Team → invite teammates. Clients → add clients and invite contacts to the portal.

## 5. Post-deploy checks
- Submit the contact form → lead appears in `/admin/leads` and the notification bell.
- Settings → Automation & email → "Run automations now" succeeds and outbox emails are `sent`.
- `curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain.com/api/cron/outbox` returns `{ ok: true }`; without the header it returns 401.
- Run the integration suite against a staging project if you have one (see TESTING.md).

## Backups & operations
Supabase free tier has daily backups with limited retention — export regularly (`supabase db dump`) or upgrade when the business depends on it. Monitor function errors in Vercel logs and failed emails in Settings → Automation & email.
