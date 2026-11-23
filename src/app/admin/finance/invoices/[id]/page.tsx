import Link from "next/link";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { requireTeam } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { LineItemsTable } from "@/components/shared/document-view";
import { ActivityFeed } from "@/components/shared/activity-feed";
import { InvoiceActions, PaymentStatusSelect } from "@/features/finance/components/finance-actions";
import { INVOICE_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES } from "@/lib/status";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { minorToInput } from "@/lib/finance/money";

export default async function InvoiceDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireTeam("finance.view");
  const sb = await createClient();
  const { data: inv } = await sb.from("invoices").select("*, invoice_items(*), client:clients(id, name, email), project:projects(id, name, code)").eq("id", id).is("deleted_at", null).maybeSingle();
  if (!inv) notFound();
  const [{ data: payments }, { data: activity }] = await Promise.all([
    sb.from("payments").select("*, recorder:profiles!payments_recorded_by_fkey(full_name)").eq("invoice_id", id).order("payment_date"),
    sb.from("activity_logs").select("id, description, created_at, actor:profiles!activity_logs_actor_id_fkey(full_name)").in("entity_type", ["invoice"]).eq("entity_id", id).order("created_at", { ascending: false }),
  ]);
  const items = [...inv.invoice_items].sort((a, b) => a.sort_order - b.sort_order);
  const balance = Number(inv.balance_cents ?? 0);
  const canManage = ctx.can("finance.manage");
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Invoices", href: "/admin/finance/invoices" }, { label: inv.number }]}
        title={`Invoice ${inv.number}`}
        meta={<StatusBadge status={inv.status} map={INVOICE_STATUSES} />}
        description={
          <>
            <Link href={`/admin/clients/${inv.client?.id}`} className="hover:underline">{inv.client?.name}</Link>
            {inv.project ? <> · <Link href={`/admin/projects/${inv.project.id}`} className="hover:underline">{inv.project.code}</Link></> : null}
            {` · issued ${formatDate(inv.issue_date)} · due ${formatDate(inv.due_date)}`}
          </>
        }
        actions={
          <>
            <Button variant="ghost" size="sm" asChild>
              <a href={`/api/pdf/invoice/${inv.id}`}>
                <Download /> PDF
              </a>
            </Button>
            {canManage ? <InvoiceActions id={inv.id} status={inv.status} balance={minorToInput(balance, inv.currency)} currency={inv.currency} amountPaid={inv.amount_paid_cents} /> : null}
          </>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="grid content-start gap-4">
          <Card>
            <CardContent className="pt-5">
              <LineItemsTable items={items.map((i) => ({ ...i, quantity: Number(i.quantity) }))} currency={inv.currency} totals={{ ...inv, balance_cents: balance }} />
              {inv.payment_terms || inv.notes ? (
                <div className="mt-6 grid gap-2 border-t pt-4 text-[13px] text-muted-foreground">
                  {inv.payment_terms ? <p>{inv.payment_terms}</p> : null}
                  {inv.notes ? <p className="whitespace-pre-line">{inv.notes}</p> : null}
                </div>
              ) : null}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Payments</CardTitle>
              <span className="text-[12.5px] text-muted-foreground tabular">
                {formatMoney(inv.amount_paid_cents, inv.currency)} of {formatMoney(inv.total_cents, inv.currency)}
              </span>
            </CardHeader>
            {payments?.length ? (
              <ul className="divide-y border-t">
                {payments.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center gap-3 px-5 py-2.5 text-[13px]">
                    <span className="w-24 text-muted-foreground">{formatDate(p.payment_date)}</span>
                    <span className="min-w-0 flex-1">
                      {PAYMENT_METHODS[p.method]}
                      {p.reference ? ` · ${p.reference}` : ""}
                      <span className="block text-[12px] text-muted-foreground">Recorded by {p.recorder?.full_name ?? "—"}</span>
                    </span>
                    {canManage ? <PaymentStatusSelect id={p.id} status={p.status} /> : <StatusBadge status={p.status} map={PAYMENT_STATUSES} />}
                    <span className="w-28 text-right font-medium tabular">{formatMoney(p.amount_cents, inv.currency)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <CardContent>
                <p className="text-[13px] text-muted-foreground">No payments recorded yet.</p>
              </CardContent>
            )}
          </Card>
        </div>
        <div className="grid content-start gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Balance due</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tracking-tight tabular">{formatMoney(balance, inv.currency)}</p>
              <p className="mt-1 text-[12.5px] text-muted-foreground">
                {inv.paid_at ? `Paid in full on ${formatDate(inv.paid_at)}` : inv.sent_at ? `Issued ${formatDateTime(inv.sent_at)}` : "Draft — not visible to the client yet"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>History</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityFeed items={(activity ?? []).map((a) => ({ id: a.id, description: a.description, created_at: a.created_at, actor: a.actor?.full_name }))} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
