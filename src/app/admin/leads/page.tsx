import Link from "next/link";
import { Inbox, Kanban, Plus, Table2 } from "lucide-react";
import { requireTeam } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { FormDialog } from "@/components/shared/form-dialog";
import { LeadBoard } from "@/features/leads/components/lead-board";
import { LeadTable } from "@/features/leads/components/lead-table";
import { LeadForm } from "@/features/leads/components/lead-form";
import { getCurrency, getServiceOptions, getTeamDirectory } from "@/features/settings/queries";
import { cn } from "@/lib/utils";

export const metadata = { title: "Leads" };

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const ctx = await requireTeam("leads.view");
  const { view = "board" } = await searchParams;
  const sb = await createClient();
  const [{ data }, currency, services, team] = await Promise.all([
    sb
      .from("leads")
      .select("id, full_name, company, email, status, source, priority, qualification_score, budget_cents, requested_service, follow_up_at, created_at, assignee:profiles!leads_assigned_to_fkey(full_name)")
      .eq("organization_id", ctx.organizationId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    getCurrency(ctx.organizationId),
    getServiceOptions(ctx.organizationId),
    getTeamDirectory(ctx.organizationId),
  ]);
  const leads = (data ?? []).map((l) => ({ ...l, email: String(l.email), assignee: l.assignee?.full_name ?? null }));
  const canManage = ctx.can("leads.manage");

  return (
    <>
      <PageHeader
        title="Leads"
        description="Every inquiry from the website lands here automatically, scored and ready to qualify."
        actions={
          <>
            <div className="flex rounded-md border p-0.5">
              {[
                { key: "board", icon: Kanban, label: "Pipeline" },
                { key: "table", icon: Table2, label: "Table" },
              ].map((v) => (
                <Link
                  key={v.key}
                  href={`/admin/leads?view=${v.key}`}
                  className={cn("flex h-7 items-center gap-1.5 rounded px-2.5 text-[12.5px] text-muted-foreground", view === v.key && "bg-accent text-foreground")}
                  aria-current={view === v.key ? "page" : undefined}
                >
                  <v.icon className="size-3.5" />
                  {v.label}
                </Link>
              ))}
            </div>
            {canManage ? (
              <FormDialog
                size="lg"
                title="New lead"
                trigger={
                  <Button size="sm">
                    <Plus /> New lead
                  </Button>
                }
              >
                <LeadForm currency={currency} services={services} team={team.map((t) => ({ id: t.id, name: t.name }))} />
              </FormDialog>
            ) : null}
          </>
        }
      />
      {leads.length === 0 ? (
        <EmptyState icon={Inbox} title="No leads yet" description="Share your website's contact page — inquiries will appear here instantly with a qualification score." />
      ) : view === "table" ? (
        <LeadTable leads={leads} currency={currency} />
      ) : (
        <LeadBoard leads={leads} currency={currency} />
      )}
    </>
  );
}
