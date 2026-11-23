# Database

PostgreSQL on Supabase. Migrations in `supabase/migrations` (apply with `supabase db reset` locally or `supabase db push` remotely). Generated types: `src/types/database.ts` (`npm run db:types`).

## Migrations
| File | Contents |
|---|---|
| `0100_foundation` | extensions, enums, `organizations`, `profiles` (+ auth trigger), `roles`, `permissions`, `role_permissions`, `team_members`, `settings`, auth helper functions |
| `0200_crm` | `services`, `clients`, `client_contacts`, `leads`, `lead_activities`, `lead_notes`, `meeting_records`, client helpers |
| `0300_projects` | `project_templates` (+ milestones, tasks), `projects`, `project_finances`, `project_members`, `milestones`, `tasks`, `task_comments`, `time_entries`, `files`, `deliverables`, `deliverable_versions`, `deliverable_reviews`, `revisions`, project access helpers |
| `0400_finance` | calculation functions, numbering, `proposals`, `proposal_items`, `contracts`, `contract_versions`, `invoices`, `invoice_items`, `payments`, `expenses`, financial integrity triggers |
| `0500_comms_content` | `conversations`, `messages`, `message_attachments`, `conversation_reads`, `notifications`, `notification_preferences`, `email_outbox`, `activity_logs`, `private.rate_limits`, website content (`portfolio_items`, `testimonials`, `faqs`) |
| `0600_rls` | RLS enabled on every table + all policies, team guard trigger |
| `0700_automation` | notification/outbox primitives, workflow triggers, `run_scheduled_automations()`, outbox claim/complete, pg_cron schedules, Realtime publication |
| `0800_business_functions` | `apply_project_template`, `create_project_from_proposal`, `create_invoice_from_proposal`, `bootstrap_organization` |
| `0900_portal` | `portal_*` views and `portal_*` action functions |
| `1000_storage` | buckets, size/MIME limits, storage policies |
| `1100_reporting` | security-invoker reporting functions |
| `1200_document_items` | atomic `replace_document_items`, `convert_lead` |

## Conventions
- UUID primary keys, `created_at`/`updated_at` (trigger-maintained), `deleted_at` for soft deletion on business records.
- Every business table has `organization_id` (tenant boundary) and appropriate indexes (`(organization_id, status)` partial indexes on live rows, FK indexes).
- Enums for every status; check constraints for ranges; unique constraints for numbers (`(organization_id, number)`), slugs and idempotency keys.
- SECURITY DEFINER functions always `set search_path = ''` and fully qualify names. Execute privileges are revoked from `public`/`anon` and granted explicitly.

## Money
- All amounts are `bigint` minor units (`*_cents`); quantities are `numeric(12,2)`; percentages are basis points (`tax_rate_bps`, percent discounts).
- `calc_line_amount`, `calc_discount_cents`, `calc_tax_cents` are the single definition of the maths. Tax applies to the discounted subtotal. Rounding is half away from zero.
- Item triggers compute `amount_cents` and roll up `subtotal_cents`; header triggers compute discount, tax and total. Clients cannot submit totals.
- `invoices.balance_cents` is a generated column. `amount_paid_cents` is the sum of **completed** payments, maintained by the payment trigger.
- Invoice status derivation: `draft` and `cancelled` are explicit; otherwise `paid` (paid ≥ total), `partially_paid`/`overdue` (some paid), `sent`/`overdue` (none paid). The hourly job marks past-due invoices overdue.
- Guards: no payments on draft/cancelled invoices; no overpayment (row-locked check); no cancellation with recorded payments; no item edits on paid/partially-paid/cancelled invoices or decided proposals; payment ownership (`client_id`, `organization_id`) is re-derived from the invoice.
- Document numbers (`INV-0001`, `PRO-0001`, `PRJ-0001`) come from atomic counters in `settings`.

## Key RPCs
| Function | Caller | Purpose |
|---|---|---|
| `convert_lead(lead, client, project, mark_won)` | team (leads+clients manage) | lead → client + primary contact (+ project from template), one transaction |
| `apply_project_template(project, template, start)` | team (project managers) | milestones + tasks with relative dates; auto-assign by role; idempotent |
| `create_project_from_proposal(proposal, template, options)` | team | accepted proposal → project + finances + draft contract with recorded acceptance; idempotent |
| `create_invoice_from_proposal(proposal, percent)` | finance | full or deposit invoice as draft |
| `replace_document_items(kind, id, items)` | team (RLS applies) | atomic line-item replacement |
| `portal_review_deliverable`, `portal_respond_proposal`, `portal_mark_proposal_viewed`, `portal_accept_contract`, `portal_update_my_contact`, `portal_touch` | clients | the only client write paths |
| `report_*` | team (security invoker + permission guards) | dashboard and report aggregates |
| `run_scheduled_automations`, `claim_email_batch`, `complete_email`, `check_rate_limit`, `bootstrap_organization` | service role only | jobs, outbox, rate limiting, first-run setup |

## Seed data
`supabase/seed.sql` (local only): demo organisation “Bismillah”, 7 users (all roles + two clients), 9 services, 3 templates, 7 leads across the pipeline, 3 clients, 2 proposals, 3 projects (one generated from a template, partly complete), a deliverable awaiting approval, 4 invoices with partial/full payments, expenses, a conversation, and clearly-labelled demo portfolio/testimonials.
