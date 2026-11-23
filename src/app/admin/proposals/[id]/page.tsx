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
import { ProposalActions } from "@/features/proposals/components/proposal-actions";
import { getTeamDirectory, getTemplateOptions } from "@/features/settings/queries";
import { PROPOSAL_STATUSES } from "@/lib/status";
import { formatDate, formatDateTime } from "@/lib/format";

export default async function ProposalDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireTeam("proposals.view");
  const sb = await createClient();
  const { data: p } = await sb.from("proposals").select("*, proposal_items(*), client:clients(id, name), lead:leads(id, full_name)").eq("id", id).is("deleted_at", null).maybeSingle();
  if (!p) notFound();
  const [templates, team, activity] = await Promise.all([
    getTemplateOptions(ctx.organizationId),
    getTeamDirectory(ctx.organizationId),
    sb.from("activity_logs").select("id, description, created_at, actor:profiles!activity_logs_actor_id_fkey(full_name)").eq("entity_type", "proposal").eq("entity_id", id).order("created_at", { ascending: false }),
  ]);
  const items = [...p.proposal_items].sort((a, b) => a.sort_order - b.sort_order);
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Proposals", href: "/admin/proposals" }, { label: p.number }]}
        title={p.title}
        meta={<StatusBadge status={p.status} map={PROPOSAL_STATUSES} />}
        description={
          <>
            {p.client ? <Link href={`/admin/clients/${p.client.id}`} className="hover:underline">{p.client.name}</Link> : p.lead ? <Link href={`/admin/leads/${p.lead.id}`} className="hover:underline">Lead: {p.lead.full_name}</Link> : null}
            {` · ${p.number}`}
            {p.valid_until ? ` · valid until ${formatDate(p.valid_until)}` : ""}
          </>
        }
        actions={
          <>
            <Button variant="ghost" size="sm" asChild>
              <a href={`/api/pdf/proposal/${p.id}`}>
                <Download /> PDF
              </a>
            </Button>
            {ctx.can("proposals.manage") ? (
              <ProposalActions
                id={p.id}
                status={p.status}
                hasProject={!!p.project_id}
                projectId={p.project_id}
                canFinance={ctx.can("finance.manage")}
                templates={templates}
                team={team.map((t) => ({ id: t.id, name: t.name }))}
                leadOnly={!p.client_id}
              />
            ) : null}
          </>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="grid content-start gap-4">
          {p.summary || p.scope ? (
            <Card>
              <CardContent className="grid gap-4 pt-5 text-[14px] leading-relaxed">
                {p.summary ? <p className="whitespace-pre-line">{p.summary}</p> : null}
                {p.scope ? (
                  <div>
                    <p className="mb-1 text-[12px] font-medium uppercase tracking-wider text-muted-foreground">Scope</p>
                    <p className="whitespace-pre-line">{p.scope}</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <LineItemsTable items={items.map((i) => ({ ...i, quantity: Number(i.quantity) }))} currency={p.currency} totals={p} />
            </CardContent>
          </Card>
        </div>
        <div className="grid content-start gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-[13px]">
              <Row label="Created" value={formatDateTime(p.created_at)} />
              <Row label="Sent" value={p.sent_at ? formatDateTime(p.sent_at) : "—"} />
              <Row label="Viewed" value={p.viewed_at ? formatDateTime(p.viewed_at) : "—"} />
              <Row label="Responded" value={p.responded_at ? formatDateTime(p.responded_at) : "—"} />
              {p.client_response_note ? <p className="rounded-md bg-muted/60 p-2 text-[12.5px]">“{p.client_response_note}”</p> : null}
              {p.timeline ? <Row label="Timeline" value={p.timeline} /> : null}
              {p.payment_terms ? <p className="text-[12.5px] text-muted-foreground">Terms: {p.payment_terms}</p> : null}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>History</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityFeed items={(activity.data ?? []).map((a) => ({ id: a.id, description: a.description, created_at: a.created_at, actor: a.actor?.full_name }))} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
