import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { requireClient } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { LineItemsTable } from "@/components/shared/document-view";
import { INVOICE_STATUSES, PAYMENT_METHODS } from "@/lib/status";
import { formatDate, formatMoney } from "@/lib/format";

export default async function PortalInvoice({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireClient();
  const sb = await createClient();
  const { data: inv } = await sb.from("portal_invoices").select("*").eq("id", id).maybeSingle();
  if (!inv) notFound();
  const [{ data: items }, { data: payments }, { data: agency }] = await Promise.all([
    sb.from("portal_invoice_items").select("*").eq("invoice_id", id).order("sort_order"),
    sb.from("portal_payments").select("*").eq("invoice_id", id).order("payment_date"),
    sb.from("portal_agency").select("*").eq("organization_id", inv.organization_id!).maybeSingle(),
  ]);
  const currency = inv.currency!;
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Invoices", href: "/portal/invoices" }, { label: inv.number! }]}
        title={`Invoice ${inv.number}`}
        meta={<StatusBadge status={inv.status!} map={INVOICE_STATUSES} />}
        description={`Issued ${formatDate(inv.issue_date)} · due ${formatDate(inv.due_date)}`}
        actions={
          <Button variant="outline" size="sm" asChild>
            <a href={`/api/pdf/invoice/${inv.id}`}>
              <Download /> Download PDF
            </a>
          </Button>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardContent className="pt-5">
            <LineItemsTable
              items={(items ?? []).map((i) => ({ id: i.id!, description: i.description!, quantity: Number(i.quantity), unit_price_cents: Number(i.unit_price_cents), amount_cents: Number(i.amount_cents) }))}
              currency={currency}
              totals={{
                subtotal_cents: Number(inv.subtotal_cents), discount_cents: Number(inv.discount_cents), discount_type: inv.discount_type!, discount_value: Number(inv.discount_value),
                tax_rate_bps: Number(inv.tax_rate_bps), tax_cents: Number(inv.tax_cents), total_cents: Number(inv.total_cents), amount_paid_cents: Number(inv.amount_paid_cents),
                balance_cents: Number(inv.balance_cents),
              }}
            />
            {inv.notes ? <p className="mt-6 whitespace-pre-line text-[13px] text-muted-foreground">{inv.notes}</p> : null}
          </CardContent>
        </Card>
        <div className="grid content-start gap-4">
          {Number(inv.balance_cents) > 0 ? (
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle>How to pay</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 text-[13px]">
                <p className="text-2xl font-semibold tabular">{formatMoney(inv.balance_cents, currency)}</p>
                <p className="whitespace-pre-line text-muted-foreground">{agency?.payment_instructions ?? "Please contact us for payment details."}</p>
                <p className="text-[12px] text-muted-foreground">Please use <strong>{inv.number}</strong> as your payment reference. Payments are confirmed by our finance team once received.</p>
                {inv.payment_terms ? <p className="text-[12px] text-muted-foreground">Terms: {inv.payment_terms}</p> : null}
              </CardContent>
            </Card>
          ) : null}
          <Card>
            <CardHeader>
              <CardTitle>Payments received</CardTitle>
            </CardHeader>
            <CardContent>
              {payments?.length ? (
                <ul className="grid gap-2 text-[13px]">
                  {payments.map((p) => (
                    <li key={p.id} className="flex justify-between gap-2">
                      <span className="text-muted-foreground">
                        {formatDate(p.payment_date)} · {PAYMENT_METHODS[p.method!]}
                      </span>
                      <span className="font-medium tabular">{formatMoney(p.amount_cents, currency)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[13px] text-muted-foreground">No payments recorded yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
