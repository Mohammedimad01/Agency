import Link from "next/link";
import { format, subMonths, startOfMonth } from "date-fns";
import {
  Banknote, Building, CalendarClock, ChartLine, CircleCheck, FolderKanban, Inbox, ListTodo, Receipt, TriangleExclamationPoint, Wallet, Target,
} from "lucide-react";
import { requireTeam } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DonutChart, MoneyAreaChart, SimpleBarChart } from "@/components/shared/charts";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/ui/avatar";
import { getFinanceSummary, getLeadFunnel, getLeadMetrics, getMonthlyFinance, getProjectMetrics, getTeamWorkload } from "@/features/reports/queries";
import { getCurrency } from "@/features/settings/queries";
import { formatDate, formatMoney, formatRelative } from "@/lib/format";
import { PAYMENT_METHODS, PROJECT_STATUSES } from "@/lib/status";
import { ROLE_LABELS, type TeamRole } from "@/lib/permissions";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const ctx = await requireTeam("dashboard.view");
  const sb = await createClient();
  const currency = await getCurrency(ctx.organizationId);
  const range12 = { from: format(startOfMonth(subMonths(new Date(), 11)), "yyyy-MM-dd"), to: format(new Date(), "yyyy-MM-dd") };
  const range6 = { from: format(startOfMonth(subMonths(new Date(), 5)), "yyyy-MM-dd"), to: range12.to };
  const in14 = format(new Date(Date.now() + 14 * 864e5), "yyyy-MM-dd");

  const [finance, monthly, leadMetrics, funnel, projects, workload, recentPayments, deadlines, milestones, activity, pendingTasks] = await Promise.all([
    getFinanceSummary(ctx),
    getMonthlyFinance(ctx, range12),
    getLeadMetrics(ctx),
    getLeadFunnel(ctx, range6),
    getProjectMetrics(ctx),
    getTeamWorkload(ctx),
    ctx.can("finance.view")
      ? sb.from("payments").select("id, amount_cents, payment_date, method, invoices(number, id), clients(name)").eq("status", "completed").order("payment_date", { ascending: false }).limit(6)
      : Promise.resolve({ data: [] as never[] }),
    sb.from("tasks").select("id, title, due_date, status, project_id, projects(name), profiles:assignee_id(full_name)").is("deleted_at", null).neq("status", "done").lte("due_date", in14).order("due_date").limit(8),
    sb.from("milestones").select("id, title, due_date, project_id, projects(name)").neq("status", "completed").lte("due_date", in14).order("due_date").limit(5),
    sb.from("activity_logs").select("id, description, created_at, entity_type, profiles:actor_id(full_name)").order("created_at", { ascending: false }).limit(8),
    sb.from("tasks").select("id", { count: "exact", head: true }).is("deleted_at", null).neq("status", "done"),
  ]);

  const firstName = (ctx.profile.full_name ?? "").split(" ")[0] || "there";
  const projectDonut = Object.entries(projects.byStatus)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: PROJECT_STATUSES[k as keyof typeof PROJECT_STATUSES]?.label ?? k, value: v }));
  const today = format(new Date(), "yyyy-MM-dd");

  return (
    <>
      <PageHeader title={`Good ${greeting()}, ${firstName}`} description={`Here's what's happening at ${ctx.organization.name} today, ${format(new Date(), "EEEE d MMMM")}.`} />

      {finance ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total revenue" value={formatMoney(finance.revenue, currency)} hint="All completed payments" icon={Banknote} href="/admin/finance/payments" />
          <StatCard label="Revenue this month" value={formatMoney(finance.revenueThisMonth, currency)} hint={format(new Date(), "MMMM yyyy")} icon={ChartLine} />
          <StatCard
            label="Outstanding payments"
            value={formatMoney(finance.outstanding, currency)}
            hint={finance.overdueCount ? `${finance.overdueCount} overdue · ${formatMoney(finance.overdueAmount, currency)}` : "Nothing overdue"}
            tone={finance.overdueCount ? "negative" : "default"}
            icon={Receipt}
            href="/admin/finance/invoices"
          />
          <StatCard
            label="Estimated profit"
            value={formatMoney(finance.profit, currency)}
            hint={`Expenses ${formatMoney(finance.expenses, currency)}`}
            tone={finance.profit >= 0 ? "positive" : "negative"}
            icon={Wallet}
          />
        </div>
      ) : null}

      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active projects" value={projects.active} hint={`${projects.completed} completed`} icon={FolderKanban} href="/admin/projects" />
        <StatCard label="Overdue projects" value={projects.overdue} tone={projects.overdue ? "negative" : "default"} hint={projects.overdue ? "Past their deadline" : "All on schedule"} icon={TriangleExclamationPoint} />
        {leadMetrics ? (
          <StatCard
            label="New leads (30 days)"
            value={leadMetrics.newLast30}
            hint={`${leadMetrics.qualified} qualified · ${leadMetrics.conversionRate === null ? "no closed leads yet" : `${leadMetrics.conversionRate.toFixed(0)}% conversion`}`}
            icon={Inbox}
            href="/admin/leads"
          />
        ) : (
          <StatCard label="Active clients" value="—" icon={Building} />
        )}
        <StatCard label="Pending tasks" value={pendingTasks.count ?? 0} hint="Open across your projects" icon={ListTodo} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        {finance ? (
          <Card className="xl:col-span-2">
            <CardHeader>
              <div>
                <CardTitle>Revenue & expenses</CardTitle>
                <CardDescription>Last 12 months · cash basis</CardDescription>
              </div>
              <Link href="/admin/reports" className="text-[12.5px] text-muted-foreground hover:text-foreground">
                Reports →
              </Link>
            </CardHeader>
            <CardContent>
              {monthly.some((m) => m.revenue || m.expenses) ? (
                <MoneyAreaChart data={monthly} xKey="month" currency={currency} series={[{ key: "revenue", label: "Revenue" }, { key: "expenses", label: "Expenses", color: "var(--chart-3)" }]} />
              ) : (
                <EmptyState compact title="No financial activity yet" description="Record a payment or expense to see trends." />
              )}
            </CardContent>
          </Card>
        ) : null}
        <Card className={finance ? "" : "xl:col-span-2"}>
          <CardHeader>
            <div>
              <CardTitle>Project status</CardTitle>
              <CardDescription>All projects you can see</CardDescription>
            </div>
          </CardHeader>
          <CardContent>{projectDonut.length ? <DonutChart data={projectDonut} height={180} /> : <EmptyState compact title="No projects yet" />}</CardContent>
        </Card>
        {leadMetrics ? (
          <Card className={finance ? "xl:col-span-1" : ""}>
            <CardHeader>
              <div>
                <CardTitle>Lead conversion</CardTitle>
                <CardDescription>New vs won, last 6 months</CardDescription>
              </div>
              <Target className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {funnel.some((f) => f.created || f.won) ? (
                <SimpleBarChart data={funnel} xKey="month" height={220} series={[{ key: "created", label: "New" }, { key: "won", label: "Won", color: "var(--chart-2)" }]} />
              ) : (
                <EmptyState compact title="No leads yet" description="Website inquiries appear here automatically." />
              )}
            </CardContent>
          </Card>
        ) : null}

        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Upcoming deadlines</CardTitle>
              <CardDescription>Tasks and milestones due in the next 14 days</CardDescription>
            </div>
            <CalendarClock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-0">
            {(deadlines.data?.length ?? 0) + (milestones.data?.length ?? 0) === 0 ? (
              <div className="px-5">
                <EmptyState compact icon={CircleCheck} title="Nothing due soon" />
              </div>
            ) : (
              <ul className="divide-y">
                {(milestones.data ?? []).map((m) => (
                  <li key={m.id} className="flex items-center gap-3 px-5 py-2.5 text-[13px]">
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">Milestone</span>
                    <Link href={`/admin/projects/${m.project_id}`} className="flex-1 truncate hover:underline">
                      {m.title} <span className="text-muted-foreground">· {m.projects?.name}</span>
                    </Link>
                    <DueLabel date={m.due_date} today={today} />
                  </li>
                ))}
                {(deadlines.data ?? []).map((t) => (
                  <li key={t.id} className="flex items-center gap-3 px-5 py-2.5 text-[13px]">
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">Task</span>
                    <Link href={`/admin/projects/${t.project_id}?task=${t.id}`} className="flex-1 truncate hover:underline">
                      {t.title} <span className="text-muted-foreground">· {t.projects?.name}</span>
                    </Link>
                    <span className="hidden text-muted-foreground sm:inline">{t.profiles?.full_name ?? "Unassigned"}</span>
                    <DueLabel date={t.due_date} today={today} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {finance ? (
          <Card>
            <CardHeader>
              <CardTitle>Recent transactions</CardTitle>
              <Link href="/admin/finance/payments" className="text-[12.5px] text-muted-foreground hover:text-foreground">
                All →
              </Link>
            </CardHeader>
            <CardContent className="px-0">
              {recentPayments.data?.length ? (
                <ul className="divide-y">
                  {recentPayments.data.map((p) => (
                    <li key={p.id} className="flex items-center gap-3 px-5 py-2.5 text-[13px]">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{p.clients?.name}</p>
                        <p className="text-[12px] text-muted-foreground">
                          {p.invoices?.number} · {PAYMENT_METHODS[p.method]} · {formatDate(p.payment_date)}
                        </p>
                      </div>
                      <span className="font-medium tabular text-success">+{formatMoney(p.amount_cents, currency)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-5">
                  <EmptyState compact title="No payments recorded" />
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}

        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Team workload</CardTitle>
              <CardDescription>Open tasks and estimated hours per person</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-0">
            {workload.length ? (
              <ul className="divide-y">
                {workload.map((w) => {
                  const load = w.capacity_hours ? Math.min(100, Math.round((Number(w.estimated_hours) / w.capacity_hours) * 100)) : 0;
                  return (
                    <li key={w.profile_id} className="flex items-center gap-3 px-5 py-2.5 text-[13px]">
                      <UserAvatar name={w.full_name} className="size-7" />
                      <div className="w-40 min-w-0">
                        <p className="truncate font-medium">{w.full_name}</p>
                        <p className="text-[12px] text-muted-foreground">{ROLE_LABELS[w.role_key as TeamRole] ?? w.role_key}</p>
                      </div>
                      <div className="hidden flex-1 sm:block">
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                          <div className={`h-full rounded-full ${load > 90 ? "bg-destructive" : load > 70 ? "bg-warning" : "bg-primary"}`} style={{ width: `${load}%` }} />
                        </div>
                      </div>
                      <span className="w-20 text-right tabular">{w.open_tasks} tasks</span>
                      <span className="w-16 text-right text-muted-foreground tabular">{Number(w.estimated_hours)}h</span>
                      {w.overdue_tasks ? <span className="w-16 text-right text-destructive tabular">{w.overdue_tasks} late</span> : <span className="w-16" />}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="px-5">
                <EmptyState compact title="No team members yet" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            {activity.data?.length ? (
              <ul className="divide-y">
                {activity.data.map((a) => (
                  <li key={a.id} className="px-5 py-2.5 text-[13px]">
                    <p className="line-clamp-2">{a.description}</p>
                    <p className="text-[12px] text-muted-foreground">
                      {a.profiles?.full_name ?? "System"} · {formatRelative(a.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-5">
                <EmptyState compact title="No activity yet" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function DueLabel({ date, today }: { date: string | null; today: string }) {
  if (!date) return null;
  const overdue = date < today;
  return <span className={`w-20 shrink-0 text-right tabular ${overdue ? "text-destructive" : "text-muted-foreground"}`}>{overdue ? "Overdue" : formatDate(date, "d MMM")}</span>;
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
}
