# Roles, permissions & data isolation

## Roles
`owner`, `admin`, `project_manager`, `finance_manager`, `analyst`, `developer`, `designer` (team) and `client` (portal users, represented by `client_contacts.profile_id` + `portal_access`).

## Permission matrix (defaults)
| Permission | Owner | Admin | PM | Finance | Analyst | Dev / Designer |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| dashboard.view | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| leads.view / leads.manage | ✓ | ✓ | ✓ / ✓ | – | ✓ / – | – |
| clients.view / clients.manage | ✓ | ✓ | ✓ / ✓ | ✓ / – | ✓ / – | – |
| projects.view_all / projects.manage | ✓ | ✓ | ✓ / ✓ | ✓ / – | ✓ / – | assigned only |
| templates.manage, services.manage | ✓ | ✓ | ✓ | – | – | – |
| content.manage (website) | ✓ | ✓ | – | – | – | – |
| proposals.view / manage | ✓ | ✓ | ✓ / – | ✓ / ✓ | – | – |
| contracts.view / manage | ✓ | ✓ | ✓ / – | ✓ / ✓ | – | – |
| finance.view / finance.manage | ✓ | ✓ | – | ✓ / ✓ | – | – |
| reports.view / reports.finance | ✓ | ✓ | ✓ / – | ✓ / ✓ | ✓ / – | – |
| team.view / team.manage | ✓ | ✓ | ✓ / – | ✓ / – | ✓ / – | ✓ / – |
| settings.manage | ✓ | ✓ | – | – | – | – |

The owner has every permission implicitly. The matrix (except the owner column) is editable by owners in **Settings → Roles & permissions**; changes are audited and enforced immediately by the database.

## How it is enforced
1. **Postgres RLS** on every table, using `has_permission(org, perm)`, `is_org_member(org)`, `can_view_project(id)`, `can_manage_project(id)`, `is_client_user(client)`.
2. **Client isolation by construction**: clients have no policies on business tables. They read `portal_*` views (filtered by `my_client_ids()`, exposing only client-safe columns and only non-draft, client-visible records) and act via `portal_*` functions that re-check ownership and state.
3. **Server-side checks** in every server action (`teamAction(permission)`), page (`requireTeam(permission)`), and route handler.
4. **UI** hides what the role can't use (navigation, actions, money fields) — a convenience, never the protection.

## Notable rules
- Only owners can grant/modify/remove the owner role; the last active owner can't be removed; you can't deactivate yourself.
- Developers/designers see only projects they manage or belong to, tasks/files within them, and no budgets (`project_finances`), invoices, payments, expenses, proposals, contracts or leads.
- Payments can't be deleted. Invoices can't be marked paid manually. Totals can't be submitted.
- Internal conversations, internal tasks, internal notes, draft documents and internal files never appear in the portal.
- Private storage is never public; every download is authorised against the `files` row first.
- `email_outbox`, `private.*`, scheduled-job and setup functions are service-role only.

These rules are covered by `tests/integration/rls.test.ts`.
