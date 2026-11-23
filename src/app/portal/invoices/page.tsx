import Link from "next/link";
import { Receipt } from "lucide-react";
import { requireClient } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { INVOICE_STATUSES, PAYMENT_METHODS } from "@/lib/status";
import { formatDate, formatMoney } from "@/lib/format";

export const metadata = { title: "Invoices" };

export default async function PortalInvoices() {
  await requireClient();
  const sb = await createClient();
  const [{ data: invoices }, { data: payments }] = await Promise.all([
    sb.from("portal_invoices").select("*").order("issue_date", { ascending: false }),
    sb.from("portal_payments").select("*").order("payment_date", { ascending: false }),
  ]);
  const currency = invoices?.[0]?.currency ?? "USD";
  const outstanding = (invoices ?? []).filter((i) => ["sent", "partially_paid", "overdue"].includes(i.status!)).reduce((s, i) => s + Number(i.balance_cents), 0);
  const paid = (payments ?? []).filter((p) => p.status === "completed").reduce((s, p) => s + Number(p.amount_cents), 0);
  const overdue = (invoices ?? []).filter((i) => i.status === "overdue").length;
  return (
    <>
      <PageHeader title="Invoices & payments" />
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <StatCard label="Outstanding balance" value={formatMoney(outstanding, currency)} tone={overdue ? "negative" : "default"} hint={overdue ? `${overdue} overdue` : undefined} />
        <StatCard label="Total paid" value={formatMoney(paid, currency)} />
        <StatCard label="Invoices" value={invoices?.length ?? 0} />
      </div>
      {invoices?.length ? (
        <Card>
          <ul className="divide-y">
            {invoices.map((i) => (
              <li key={i.id}>
                <Link href={`/portal/invoices/${i.id}`} className="flex flex-wrap items-center gap-3 px-5 py-3.5 text-[13.5px] hover:bg-accent/40">
                  <span className="w-28 font-medium">{i.number}</span>
                  <span className="flex-1 text-muted-foreground">
                    Issued {formatDate(i.issue_date)} · due {formatDate(i.due_date)}
                  </span>
                  <StatusBadge status={i.status!} map={INVOICE_STATUSES} />
                  <span className="w-28 text-right font-medium tabular">{formatMoney(i.total_cents, i.currency!)}</span>
                  <span className="w-28 text-right text-muted-foreground tabular">{Number(i.balance_cents) > 0 ? `${formatMoney(i.balance_cents, i.currency!)} due` : "Paid"}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <EmptyState icon={Receipt} title="No invoices yet" />
      )}
      {payments?.length ? (
        <>
          <h2 className="mb-2 mt-8 text-sm font-semibold">Transaction history</h2>
          <Card>
            <ul className="divide-y">
              {payments.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-5 py-2.5 text-[13px]">
                  <span className="w-28 text-muted-foreground">{formatDate(p.payment_date)}</span>
                  <span className="flex-1">
                    {PAYMENT_METHODS[p.method!]}
                    {p.reference ? ` · ${p.reference}` : ""}
                  </span>
                  <span className={p.status === "refunded" ? "text-muted-foreground line-through" : "font-medium tabular"}>{formatMoney(p.amount_cents, currency)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </>
      ) : null}
    </>
  );
}
