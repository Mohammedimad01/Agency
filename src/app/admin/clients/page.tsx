import { Building, Plus } from "lucide-react";
import { requireTeam } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { FormDialog } from "@/components/shared/form-dialog";
import { ClientForm } from "@/features/clients/components/client-forms";
import { ClientTable } from "@/features/clients/components/client-table";
import { getCurrency, getTeamDirectory } from "@/features/settings/queries";

export const metadata = { title: "Clients" };

export default async function ClientsPage() {
  const ctx = await requireTeam("clients.view");
  const sb = await createClient();
  const showFinance = ctx.can("finance.view");
  const [{ data }, currency, team, invoices] = await Promise.all([
    sb
      .from("clients")
      .select("id, name, type, email, industry, country, status, created_at, manager:profiles!clients_account_manager_id_fkey(full_name), projects(status, deleted_at)")
      .eq("organization_id", ctx.organizationId)
      .is("deleted_at", null)
      .order("name"),
    getCurrency(ctx.organizationId),
    getTeamDirectory(ctx.organizationId),
    showFinance
      ? sb.from("invoices").select("client_id, balance_cents").is("deleted_at", null).in("status", ["sent", "partially_paid", "overdue"])
      : Promise.resolve({ data: [] as { client_id: string; balance_cents: number | null }[] }),
  ]);
  const outstanding = new Map<string, number>();
  for (const i of invoices.data ?? []) outstanding.set(i.client_id, (outstanding.get(i.client_id) ?? 0) + Number(i.balance_cents ?? 0));
  const rows = (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    email: c.email ? String(c.email) : null,
    industry: c.industry,
    country: c.country,
    status: c.status,
    manager: c.manager?.full_name ?? null,
    active_projects: (c.projects ?? []).filter((p) => !p.deleted_at && ["planning", "in_progress", "awaiting_client", "in_review"].includes(p.status)).length,
    outstanding_cents: outstanding.get(c.id) ?? null,
    created_at: c.created_at,
  }));
  return (
    <>
      <PageHeader
        title="Clients"
        description="Your client database — companies and individuals, with their projects, money and history."
        actions={
          ctx.can("clients.manage") ? (
            <FormDialog size="lg" title="New client" trigger={<Button size="sm"><Plus /> New client</Button>}>
              <ClientForm team={team.map((t) => ({ id: t.id, name: t.name }))} />
            </FormDialog>
          ) : null
        }
      />
      {rows.length ? <ClientTable rows={rows} currency={currency} showFinance={showFinance} /> : <EmptyState icon={Building} title="No clients yet" description="Convert a won lead or add a client manually." />}
    </>
  );
}
