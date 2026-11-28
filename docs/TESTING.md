# Testing

| Suite | Command | Needs | Covers |
|---|---|---|---|
| Unit | `npm test` | nothing | money parsing (no floats), totals/discount/tax rounding (parity with SQL), percentages, lead qualification, validation schemas, safe redirects, email templates & escaping |
| Integration | `npm run test:integration` | local Supabase with the test fixture (see below) | **RLS**: anonymous access, client isolation, internal-column hiding, view write-protection, conversation isolation, developer/finance restrictions, owner protection, service-only functions. **Workflow**: the full inquiry → payment → completion lifecycle with real users, including idempotency, overpayment, locked invoices, forged ownership, draft visibility, review scheduling and outbox claiming. |
| E2E (browser) | `npm run test:e2e` | Supabase + app running (`npm run dev`) | inquiry form → CRM, validation, auth redirects, role-restricted pages, client isolation in the portal, deliverable change request, invoice creation with live totals → issue → payment, project creation from a template, phone-width layout |

Other checks: `npm run typecheck`, `npm run lint`, `npm run build`, `npm run db:lint`.

Integration and E2E tests need a **local** stack loaded with the test fixture. No credentials are stored in the repository:

```bash
npx supabase db reset
export TEST_USER_PASSWORD='pick-any-local-password'
npm run db:test-data
eval "$(npx supabase status -o env | sed 's/^/export /')"
npm run test:integration
```

Without these variables the integration suites are skipped. Tests create their own records with unique names and can be re-run. **Never run them against production.**
