import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { requireClient } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { LineItemsTable } from "@/components/shared/document-view";
import { MarkViewed, ProposalResponse } from "@/features/portal/components/review";
import { PROPOSAL_STATUSES } from "@/lib/status";
import { formatDate, formatDateTime } from "@/lib/format";

export default async function PortalProposal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireClient();
  const sb = await createClient();
  const { data: p } = await sb.from("portal_proposals").select("*").eq("id", id).maybeSingle();
  if (!p) notFound();
  const { data: items } = await sb.from("portal_proposal_items").select("*").eq("proposal_id", id).order("sort_order");
  const open = p.status === "sent" || p.status === "viewed";
  const expired = p.valid_until && p.valid_until < new Date().toISOString().slice(0, 10);
  return (
    <>
      {p.status === "sent" ? <MarkViewed proposalId={p.id!} /> : null}
      <PageHeader
        breadcrumbs={[{ label: "Documents", href: "/portal/documents" }, { label: p.number! }]}
        title={p.title!}
        meta={<StatusBadge status={p.status!} map={PROPOSAL_STATUSES} />}
        description={`${p.number} · ${p.valid_until ? `valid until ${formatDate(p.valid_until)}` : "no expiry"}`}
        actions={
          <Button variant="outline" size="sm" asChild>
            <a href={`/api/pdf/proposal/${p.id}`}>
              <Download /> PDF
            </a>
          </Button>
        }
      />
      {open && !expired ? (
        <Card className="mb-4 border-primary/30">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-5">
            <p className="text-[14px]">Ready to go ahead? Accept the proposal and we&apos;ll set up your project and agreement.</p>
            <ProposalResponse proposalId={p.id!} />
          </CardContent>
        </Card>
      ) : null}
      {p.responded_at ? (
        <p className="mb-4 rounded-lg border bg-card px-4 py-3 text-[13.5px]">
          You {p.status === "accepted" ? "accepted" : "declined"} this proposal on {formatDateTime(p.responded_at)}.{p.client_response_note ? ` Note: “${p.client_response_note}”` : ""}
        </p>
      ) : null}
      <div className="grid gap-4">
        {p.summary ? (
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line text-[14px] leading-relaxed">{p.summary}</p>
            </CardContent>
          </Card>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2">
          {p.scope ? (
            <Card>
              <CardHeader>
                <CardTitle>Scope of work</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-[13.5px] leading-relaxed">{p.scope}</p>
              </CardContent>
            </Card>
          ) : null}
          <Card>
            <CardHeader>
              <CardTitle>Timeline & terms</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-[13.5px]">
              {p.timeline ? <p><span className="text-muted-foreground">Timeline:</span> {p.timeline}</p> : null}
              {p.payment_terms ? <p><span className="text-muted-foreground">Payment terms:</span> {p.payment_terms}</p> : null}
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Investment</CardTitle>
          </CardHeader>
          <CardContent>
            <LineItemsTable
              items={(items ?? []).map((i) => ({ id: i.id!, description: i.description!, details: i.details, quantity: Number(i.quantity), unit_price_cents: Number(i.unit_price_cents), amount_cents: Number(i.amount_cents) }))}
              currency={p.currency!}
              totals={{ subtotal_cents: Number(p.subtotal_cents), discount_cents: Number(p.discount_cents), discount_type: p.discount_type!, discount_value: Number(p.discount_value), tax_rate_bps: Number(p.tax_rate_bps), tax_cents: Number(p.tax_cents), total_cents: Number(p.total_cents) }}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
