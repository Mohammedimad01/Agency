import Link from "next/link";
import { Banknote } from "lucide-react";
import { requireTeam } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { getCurrency } from "@/features/settings/queries";
import { PAYMENT_METHODS, PAYMENT_STATUSES } from "@/lib/status";
import { formatDate, formatMoney } from "@/lib/format";

export const metadata = { title: "Payments" };

export default async function PaymentsPage() {
  const ctx = await requireTeam("finance.view");
  const sb = await createClient();
  const [{ data }, currency] = await Promise.all([
    sb.from("payments").select("*, invoice:invoices(id, number), client:clients(id, name)").eq("organization_id", ctx.organizationId).order("payment_date", { ascending: false }).limit(500),
    getCurrency(ctx.organizationId),
  ]);
  const rows = data ?? [];
  const month = new Date().toISOString().slice(0, 7);
  const completed = rows.filter((p) => p.status === "completed");
  return (
    <>
      <PageHeader title="Payments" description="Every payment is recorded against an invoice. Corrections use refund/failed status — the ledger is never deleted." />
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <StatCard label="Collected (all time)" value={formatMoney(completed.reduce((s, p) => s + p.amount_cents, 0), currency)} />
        <StatCard label="This month" value={formatMoney(completed.filter((p) => p.payment_date.startsWith(month)).reduce((s, p) => s + p.amount_cents, 0), currency)} />
        <StatCard label="Transactions" value={rows.length} />
      </div>
      {rows.length ? (
        <Card>
          <ul className="divide-y">
            {rows.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-[13.5px]">
                <span className="w-24 text-muted-foreground">{formatDate(p.payment_date)}</span>
                <span className="min-w-0 flex-1">
                  <Link href={`/admin/clients/${p.client?.id}`} className="font-medium hover:underline">{p.client?.name}</Link>
                  <span className="block text-[12px] text-muted-foreground">
                    {PAYMENT_METHODS[p.method]}
                    {p.reference ? ` · ${p.reference}` : ""} · {p.provider}
                  </span>
                </span>
                <Link href={`/admin/finance/invoices/${p.invoice?.id}`} className="text-muted-foreground hover:underline">{p.invoice?.number}</Link>
                <StatusBadge status={p.status} map={PAYMENT_STATUSES} />
                <span className="w-28 text-right font-medium tabular">{formatMoney(p.amount_cents, currency)}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <EmptyState icon={Banknote} title="No payments yet" description="Record payments from an invoice." />
      )}
    </>
  );
}
