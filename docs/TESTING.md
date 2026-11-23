# Testing

| Suite | Command | Needs | Covers |
|---|---|---|---|
| Unit | `npm test` | nothing | money parsing (no floats), totals/discount/tax rounding (parity with SQL), percentages, lead qualification, validation schemas, safe redirects, email templates & escaping |
| Integration | `npm run test:integration` | local Supabase with seed (`npm run db:reset`) | **RLS**: anonymous access, client isolation, internal-column hiding, view write-protection, conversation isolation, developer/finance restrictions, owner protection, service-only functions. **Workflow**: the full inquiry → payment → completion lifecycle with real users, including idempotency, overpayment, locked invoices, forged ownership, draft visibility, review scheduling and outbox claiming. |
| E2E (browser) | `npm run test:e2e` | Supabase + app running (`npm run dev`) | inquiry form → CRM, validation, auth redirects, role-restricted pages, client isolation in the portal, deliverable change request, invoice creation with live totals → issue → payment, project creation from a template, phone-width layout |

Other checks: `npm run typecheck`, `npm run lint`, `npm run build`, `npm run db:lint`.

Integration and E2E tests create their own records with unique names and can be re-run; for a pristine state run `npm run db:reset` first. They default to the local Supabase demo keys and can be pointed at another stack through the standard environment variables. **Never run them against production.**
