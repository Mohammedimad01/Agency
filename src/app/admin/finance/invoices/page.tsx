import Link from "next/link";
import { Plus, Receipt } from "lucide-react";
import { requireTeam } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { InvoiceTable } from "@/features/finance/components/invoice-table";
import { getCurrency } from "@/features/settings/queries";

export const metadata = { title: "Invoices" };

export default async function InvoicesPage() {
  const ctx = await requireTeam("finance.view");
  const sb = await createClient();
  const [{ data }, currency] = await Promise.all([
    sb.from("invoices").select("id, number, status, issue_date, due_date, total_cents, amount_paid_cents, balance_cents, client:clients(name), project:projects(name)").eq("organization_id", ctx.organizationId).is("deleted_at", null).order("issue_date", { ascending: false }),
    getCurrency(ctx.organizationId),
  ]);
  const rows = (data ?? []).map((i) => ({ id: i.id, number: i.number, status: i.status, issue_date: i.issue_date, due_date: i.due_date, total: i.total_cents, paid: i.amount_paid_cents, balance: Number(i.balance_cents ?? 0), client: i.client?.name ?? "—", project: i.project?.name ?? null }));
  return (
    <>
      <PageHeader
        title="Invoices"
        description="Statuses update automatically from recorded payments and due dates."
        actions={
          ctx.can("finance.manage") ? (
            <Button size="sm" asChild>
              <Link href="/admin/finance/invoices/new">
                <Plus /> New invoice
              </Link>
            </Button>
          ) : null
        }
      />
      {rows.length ? <InvoiceTable rows={rows} currency={currency} /> : <EmptyState icon={Receipt} title="No invoices yet" />}
    </>
  );
}
