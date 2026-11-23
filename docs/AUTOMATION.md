# Automation & notifications

Implemented natively with Postgres triggers, `pg_cron`, and an email outbox — no third-party automation platform.

## Workflows
| # | Trigger | Effect | Where |
|---|---|---|---|
| 1 | Website inquiry | Rate-limited, scored lead created; confirmation email; meeting request for bookings | `features/inquiries/actions.ts` |
| 2 | Lead inserted | Activity entry; in-app notification to everyone with `leads.view`; email to owners/admins; assignee notified | `on_lead_insert` |
| 3 | Follow-up due | Hourly reminder to the assignee (or lead managers), once per follow-up time | `run_scheduled_automations` |
| 4 | Lead conversion | Client + primary contact (+ project from template) in one transaction | `convert_lead` |
| 5 | Proposal accepted | Lead → won, team notified; one click creates project + contract (idempotent) | `on_proposal_status`, `create_project_from_proposal` |
| 6 | Project created from template | Milestones + tasks with relative dates, auto-assigned by role | `apply_project_template` |
| 7 | Tasks / milestones change | All tasks done → milestone completed; milestone weights → project progress; client notified + emailed | `after_task_change`, `after_milestone_change` |
| 8 | Client reviews deliverable | Status → approved / changes requested; revision created; team notified | `on_deliverable_review` |
| 9 | Invoice due | Reminder emails 3 days before, 1 and 7 days after; overdue marking + finance alert | `run_scheduled_automations` |
| 10 | Payment recorded | Paid amount, balance and status recalculated under a row lock; finance notified | `before_payment`, `after_payment` |
| 11 | Project completed | Progress 100%, completion date, client notification + email, team notification | `on_project_update` |
| 12 | Project completed | Review-request email scheduled 3 days later (once per project) | `on_project_update` |

Also: project/task assignment notifications, deliverable-ready emails, new-project emails when a project leaves draft, proposal-sent emails, new-message notifications (bucketed hourly per conversation to avoid noise), team-invitation-accepted notification, contract expiry warnings, proposal/contract expiry, housekeeping.

## Reliability & idempotency
- Notifications have a unique `(recipient_id, dedupe_key)`; re-running a job never duplicates them.
- Emails go through `email_outbox` with a unique `idempotency_key`; the key is also sent to Resend.
- The dispatcher claims rows with `FOR UPDATE SKIP LOCKED`, so concurrent runs never double-send; failures retry with exponential backoff (2, 4, 8… minutes, max 5 attempts) and stuck rows are released after 15 minutes.
- Recipients' notification preferences are honoured at send time (auth/transactional emails always send).
- Payments accept an idempotency key (the record-payment dialog generates one), so double-submits can't double-record.

## Scheduling
| Job | Schedule | Mechanism |
|---|---|---|
| `run_scheduled_automations()` | hourly at :07 | `pg_cron` inside Postgres |
| Email dispatch | every 5 minutes, only when work is pending | `pg_cron` → `pg_net` → `POST {app_url}/api/cron/outbox` |
| Safety net | daily | Vercel Cron → `/api/cron/automations` (`vercel.json`) |

Emails are also dispatched immediately after the actions that create them (`after()`), so most arrive within seconds. Settings → Automation & email shows outbox health and a "Run automations now" button. See DEPLOYMENT.md for enabling pg_cron/pg_net in production.

## Email templates
`welcome`, `client_invitation`, `team_invitation`, `password_reset`, `verify_email`, `inquiry_received`, `new_lead`, `new_project`, `milestone_update`, `proposal_sent`, `invoice_generated`, `payment_reminder`, `deliverable_ready`, `project_completed`, `review_request` — in `src/lib/email/templates.ts`, rendered with an escaped, table-based layout plus a plain-text alternative.
