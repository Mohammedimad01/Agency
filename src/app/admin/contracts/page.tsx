import Link from "next/link";
import { Plus, Signature } from "lucide-react";
import { requireTeam } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { FormDialog } from "@/components/shared/form-dialog";
import { ContractForm } from "@/features/contracts/components/contract-forms";
import { getCurrency } from "@/features/settings/queries";
import { CONTRACT_STATUSES } from "@/lib/status";
import { formatDate, formatMoney } from "@/lib/format";

export const metadata = { title: "Contracts" };

export default async function ContractsPage() {
  const ctx = await requireTeam("contracts.view");
  const sb = await createClient();
  const [{ data }, currency, { data: clients }, { data: projects }] = await Promise.all([
    sb.from("contracts").select("*, client:clients(name), project:projects(name)").eq("organization_id", ctx.organizationId).is("deleted_at", null).order("created_at", { ascending: false }),
    getCurrency(ctx.organizationId),
    sb.from("clients").select("id, name").is("deleted_at", null).order("name"),
    sb.from("projects").select("id, name, client_id").is("deleted_at", null),
  ]);
  const soon = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
  return (
    <>
      <PageHeader
        title="Contracts"
        description="Agreements with clients: versions, signing dates and expiry."
        actions={
          ctx.can("contracts.manage") ? (
            <FormDialog size="lg" title="New contract" trigger={<Button size="sm"><Plus /> New contract</Button>}>
              <ContractForm currency={currency} clients={clients ?? []} projects={projects ?? []} />
            </FormDialog>
          ) : null
        }
      />
      {data?.length ? (
        <Card>
          <ul className="divide-y">
            {data.map((c) => (
              <li key={c.id}>
                <Link href={`/admin/contracts/${c.id}`} className="flex flex-wrap items-center gap-3 px-5 py-3 text-[13.5px] hover:bg-accent/40">
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{c.title}</span>
                    <span className="text-[12px] text-muted-foreground">
                      {c.client?.name}
                      {c.project ? ` · ${c.project.name}` : ""} · v{c.current_version}
                    </span>
                  </span>
                  <span className={`text-[12.5px] ${c.end_date && c.end_date <= soon && ["signed", "active"].includes(c.status) ? "text-destructive" : "text-muted-foreground"}`}>
                    {c.end_date ? `ends ${formatDate(c.end_date)}` : ""}
                  </span>
                  {c.accepted_at ? <span className="text-[12px] text-success">client accepted</span> : null}
                  <StatusBadge status={c.status} map={CONTRACT_STATUSES} />
                  <span className="w-28 text-right tabular">{c.value_cents ? formatMoney(c.value_cents, currency) : "—"}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <EmptyState icon={Signature} title="No contracts yet" description="Contracts are created automatically when an accepted proposal becomes a project." />
      )}
    </>
  );
}
