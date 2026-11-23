import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { requireTeam } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { getCurrency } from "@/features/settings/queries";
import { PROPOSAL_STATUSES } from "@/lib/status";
import { formatDate, formatMoney } from "@/lib/format";

export const metadata = { title: "Proposals" };

export default async function ProposalsPage() {
  const ctx = await requireTeam("proposals.view");
  const sb = await createClient();
  const [{ data }, currency] = await Promise.all([
    sb.from("proposals").select("id, number, title, status, total_cents, valid_until, created_at, client:clients(name), lead:leads(full_name)").eq("organization_id", ctx.organizationId).is("deleted_at", null).order("created_at", { ascending: false }),
    getCurrency(ctx.organizationId),
  ]);
  const rows = data ?? [];
  const open = rows.filter((p) => ["sent", "viewed"].includes(p.status));
  const accepted = rows.filter((p) => p.status === "accepted");
  const decided = rows.filter((p) => ["accepted", "rejected", "expired"].includes(p.status)).length;
  return (
    <>
      <PageHeader
        title="Proposals"
        description="Quotes and proposals. Clients review and accept them in their portal."
        actions={
          ctx.can("proposals.manage") ? (
            <Button size="sm" asChild>
              <Link href="/admin/proposals/new">
                <Plus /> New proposal
              </Link>
            </Button>
          ) : null
        }
      />
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <StatCard label="Open pipeline" value={formatMoney(open.reduce((s, p) => s + p.total_cents, 0), currency)} hint={`${open.length} awaiting response`} />
        <StatCard label="Accepted value" value={formatMoney(accepted.reduce((s, p) => s + p.total_cents, 0), currency)} hint={`${accepted.length} accepted`} />
        <StatCard label="Win rate" value={decided ? `${Math.round((accepted.length / decided) * 100)}%` : "—"} hint="Accepted ÷ decided" />
      </div>
      {rows.length ? (
        <Card>
          <ul className="divide-y">
            {rows.map((p) => (
              <li key={p.id}>
                <Link href={`/admin/proposals/${p.id}`} className="flex flex-wrap items-center gap-3 px-5 py-3 text-[13.5px] hover:bg-accent/40">
                  <span className="w-24 text-muted-foreground">{p.number}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{p.title}</span>
                    <span className="text-[12px] text-muted-foreground">{p.client?.name ?? `Lead: ${p.lead?.full_name ?? "—"}`}</span>
                  </span>
                  <span className="w-28 text-[12.5px] text-muted-foreground">{p.valid_until ? `valid ${formatDate(p.valid_until, "d MMM")}` : ""}</span>
                  <StatusBadge status={p.status} map={PROPOSAL_STATUSES} />
                  <span className="w-28 text-right font-medium tabular">{formatMoney(p.total_cents, currency)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <EmptyState icon={FileText} title="No proposals yet" />
      )}
    </>
  );
}
