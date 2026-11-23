# Product Requirements

## Vision
An agency operating system that runs a small digital studio end to end — acquiring clients, delivering projects, collaborating with clients and getting paid — and is structured so it can later become a multi-tenant SaaS.

## Users
| User | Goals |
|---|---|
| **Owner** | See the whole business at a glance; control money, team, permissions and settings. |
| **Administrator / Project Manager** | Qualify leads, run projects, keep clients informed, manage delivery. |
| **Developer / Designer** | See assigned work, update tasks, upload deliverables, log time — without financial or CRM data. |
| **Analyst** | Read CRM, projects and operational reports. |
| **Finance Manager** | Proposals, invoices, payments, expenses, financial reporting. |
| **Client** | Track progress, approve work, accept proposals, pay invoices, talk to the team — seeing only their own organisation. |
| **Visitor** | Understand the studio, see proof, and start a conversation. |

## Scope (delivered)
1. **Public website**: home (12 sections), about, services + detail, portfolio + case studies, pricing, contact (quick message + project brief), book-a-call, login. SEO metadata, Open Graph image, JSON-LD, sitemap, robots. Content editable from `/admin/website` and `/admin/services`.
2. **Inquiry intake**: validation, honeypot + timing check, per-IP/per-email rate limiting, qualification scoring, lead creation, team notification, confirmation email, meeting request records.
3. **CRM**: leads (9-stage pipeline board with drag-and-drop, filterable table, detail page with notes, activity log, follow-ups, meetings, qualification breakdown, conversion), clients (individual/company, contacts, portal invitations, full profile with projects, money, documents, communication, activity).
4. **Projects**: list / board / calendar views; workspace with overview, tasks (+ subtasks, comments), milestones, deliverables (versions, approvals, revisions), files, messages, time tracking, activity; templates that generate milestones and tasks; team assignment.
5. **Client portal**: dashboard with “needs your attention”, projects with timeline and client-visible tasks, deliverable approval / change requests with history, file sharing, invoices with PDF and payment instructions, proposals (accept/decline), agreements (record acceptance), messaging, notifications, profile/password/notification settings.
6. **Sales & finance**: service catalogue, proposals (line items, discounts, tax, validity, PDF, portal acceptance, conversion to project + contract, invoicing incl. deposits), contracts (versions, signing, expiry), invoices (numbering, line items, server-side totals, status derived from payments, PDF), payments (manual recording, partial/multiple, idempotent, refund/failed), expenses (categories, receipts, project allocation), finance overview with receivables aging.
7. **Team**: invitations, roles, editable permission matrix (owner), capacity, cost rates, workload, activation/deactivation.
8. **Notifications & automation**: realtime in-app notification centre, transactional emails (Resend) via an idempotent outbox with retries, hourly scheduled automations.
9. **Reports**: revenue, expenses, project profitability, outstanding invoices, client performance, service performance, lead performance, project delivery, team workload — with date filters and CSV export.

## Out of scope for the MVP (by design)
- Legally binding e-signatures (uploaded signed documents and recorded acceptance are supported).
- Online card payments (a provider interface exists; payments are recorded manually — see ARCHITECTURE.md).
- Multi-organisation SaaS onboarding/billing (the schema is organisation-scoped and ready for it).

## Definition of done
The full lifecycle — inquiry → lead → qualified → client → proposal → accepted → project → team → portal access → milestones → deliverable approval → invoice → payment → completion — works on real data with correct permissions. It is covered by `tests/integration/workflow.test.ts` and the browser tests in `tests/e2e`.
