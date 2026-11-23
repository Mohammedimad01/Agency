import { UserPlus } from "lucide-react";
import { requireTeam } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/shared/status-badge";
import { FormDialog } from "@/components/shared/form-dialog";
import { InviteForm, MemberActions } from "@/features/team/components/team-forms";
import { getTeamWorkload } from "@/features/reports/queries";
import { getCurrency } from "@/features/settings/queries";
import { MEMBER_STATUSES } from "@/lib/status";
import { ROLE_LABELS, type TeamRole } from "@/lib/permissions";
import { formatDate, formatMoney } from "@/lib/format";
import { minorToInput } from "@/lib/finance/money";

export const metadata = { title: "Team" };

export default async function TeamPage() {
  const ctx = await requireTeam("team.view");
  const sb = await createClient();
  const [{ data }, workload, currency] = await Promise.all([
    sb.from("team_members").select("*, profile:profiles!team_members_profile_id_fkey(full_name, email, avatar_url)").eq("organization_id", ctx.organizationId).order("status").order("joined_at"),
    getTeamWorkload(ctx),
    getCurrency(ctx.organizationId),
  ]);
  const load = new Map(workload.map((w) => [w.profile_id, w]));
  const canManage = ctx.can("team.manage");
  const showCost = ctx.can("finance.view");
  return (
    <>
      <PageHeader
        title="Team"
        description="People, roles, capacity and workload."
        actions={
          canManage ? (
            <FormDialog title="Invite a team member" trigger={<Button size="sm"><UserPlus /> Invite</Button>}>
              <InviteForm canInviteOwner={ctx.role === "owner"} />
            </FormDialog>
          ) : null
        }
      />
      <Card>
        <ul className="divide-y">
          {(data ?? []).map((m) => {
            const w = load.get(m.profile_id);
            const pct = w && m.capacity_hours_per_week ? Math.min(100, Math.round((Number(w.estimated_hours) / m.capacity_hours_per_week) * 100)) : 0;
            return (
              <li key={m.id} className="flex flex-wrap items-center gap-4 px-5 py-3.5">
                <UserAvatar name={m.profile?.full_name} src={m.profile?.avatar_url} className="size-9" />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium">
                    {m.profile?.full_name ?? String(m.profile?.email)} {m.profile_id === ctx.userId ? <span className="text-[12px] font-normal text-muted-foreground">(you)</span> : null}
                  </p>
                  <p className="truncate text-[12.5px] text-muted-foreground">
                    {ROLE_LABELS[m.role_key as TeamRole]}
                    {m.title ? ` · ${m.title}` : ""} · {String(m.profile?.email)}
                  </p>
                </div>
                {m.status === "active" && w ? (
                  <div className="hidden w-48 md:block">
                    <div className="flex justify-between text-[12px] text-muted-foreground">
                      <span>{w.open_tasks} open tasks</span>
                      <span>
                        {Number(w.estimated_hours)}h / {m.capacity_hours_per_week}h
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className={`h-full rounded-full ${pct > 90 ? "bg-destructive" : pct > 70 ? "bg-warning" : "bg-primary"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ) : null}
                {showCost ? <span className="w-24 text-right text-[12.5px] text-muted-foreground tabular">{m.hourly_cost_cents ? `${formatMoney(m.hourly_cost_cents, currency)}/h` : ""}</span> : null}
                <span className="hidden w-28 text-right text-[12px] text-muted-foreground sm:inline">{m.status === "invited" ? `Invited ${formatDate(m.invited_at)}` : m.joined_at ? `Joined ${formatDate(m.joined_at)}` : ""}</span>
                <StatusBadge status={m.status} map={MEMBER_STATUSES} />
                {canManage ? (
                  <MemberActions
                    memberId={m.id}
                    status={m.status}
                    isSelf={m.profile_id === ctx.userId}
                    protectedOwner={m.role_key === "owner" && ctx.role !== "owner"}
                    currency={currency}
                    canEditCost={ctx.can("finance.manage")}
                    canAssignOwner={ctx.role === "owner"}
                    values={{ role_key: m.role_key as TeamRole, title: m.title ?? "", capacity_hours_per_week: m.capacity_hours_per_week, hourly_cost: minorToInput(m.hourly_cost_cents, currency) }}
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      </Card>
    </>
  );
}
