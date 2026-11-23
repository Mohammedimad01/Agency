import "server-only";
import { format, startOfMonth, subMonths } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import type { TeamContext } from "@/lib/auth/session";

const iso = (d: Date) => format(d, "yyyy-MM-dd");

export interface DateRange {
  from: string;
  to: string;
}

export function resolveRange(params: { from?: string; to?: string; preset?: string }): DateRange & { preset: string } {
  const today = new Date();
  const preset = params.preset ?? (params.from || params.to ? "custom" : "12m");
  const valid = (v?: string) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);
  if (preset === "custom") return { preset, from: valid(params.from) ?? iso(subMonths(today, 12)), to: valid(params.to) ?? iso(today) };
  const months = { "1m": 1, "3m": 3, "6m": 6, "12m": 12, "24m": 24 }[preset] ?? 12;
  if (preset === "ytd") return { preset, from: `${today.getFullYear()}-01-01`, to: iso(today) };
  return { preset, from: iso(startOfMonth(subMonths(today, months - 1))), to: iso(today) };
}

const num = (v: unknown) => Number(v ?? 0);

/** Centralised financial metrics (cash basis: revenue = completed payments). */
export async function getFinanceSummary(ctx: TeamContext, range?: DateRange) {
  if (!ctx.can("finance.view")) return null;
  const sb = await createClient();
  const monthStart = iso(startOfMonth(new Date()));
  const [allPayments, monthPayments, expenses, open] = await Promise.all([
    sumPayments(sb, ctx.organizationId, range?.from, range?.to),
    sumPayments(sb, ctx.organizationId, monthStart),
    sb.rpc("report_monthly_finance", { p_org: ctx.organizationId, p_from: range?.from ?? "2000-01-01", p_to: range?.to ?? iso(new Date()) }),
    sb.from("invoices").select("balance_cents, status, due_date").eq("organization_id", ctx.organizationId).is("deleted_at", null).in("status", ["sent", "partially_paid", "overdue"]),
  ]);
  const totalExpenses = (expenses.data ?? []).reduce((s, r) => s + num(r.expenses_cents), 0);
  const outstanding = (open.data ?? []).reduce((s, r) => s + num(r.balance_cents), 0);
  const overdueRows = (open.data ?? []).filter((r) => r.status === "overdue");
  return {
    revenue: allPayments,
    revenueThisMonth: monthPayments,
    expenses: totalExpenses,
    profit: allPayments - totalExpenses,
    outstanding,
    overdueAmount: overdueRows.reduce((s, r) => s + num(r.balance_cents), 0),
    overdueCount: overdueRows.length,
  };
}

async function sumPayments(sb: Awaited<ReturnType<typeof createClient>>, org: string, from?: string, to?: string) {
  const { data } = await sb.rpc("report_monthly_finance", { p_org: org, p_from: from ?? "2000-01-01", p_to: to ?? iso(new Date()) });
  return (data ?? []).reduce((s, r) => s + num(r.revenue_cents), 0);
}

export async function getMonthlyFinance(ctx: TeamContext, range: DateRange) {
  if (!ctx.can("finance.view")) return [];
  const sb = await createClient();
  const { data } = await sb.rpc("report_monthly_finance", { p_org: ctx.organizationId, p_from: range.from, p_to: range.to });
  return (data ?? []).map((r) => ({
    month: format(new Date(`${r.month}T00:00:00`), "MMM yy"),
    revenue: num(r.revenue_cents),
    expenses: num(r.expenses_cents),
    invoiced: num(r.invoiced_cents),
    profit: num(r.revenue_cents) - num(r.expenses_cents),
  }));
}

export async function getLeadFunnel(ctx: TeamContext, range: DateRange) {
  if (!ctx.can("leads.view")) return [];
  const sb = await createClient();
  const { data } = await sb.rpc("report_lead_funnel", { p_org: ctx.organizationId, p_from: range.from, p_to: range.to });
  return (data ?? []).map((r) => ({ month: format(new Date(`${r.month}T00:00:00`), "MMM yy"), created: r.created, won: r.won, lost: r.lost }));
}

export async function getLeadMetrics(ctx: TeamContext) {
  if (!ctx.can("leads.view")) return null;
  const sb = await createClient();
  const since = iso(subMonths(new Date(), 1));
  const { data } = await sb.from("leads").select("status, created_at").eq("organization_id", ctx.organizationId).is("deleted_at", null);
  const rows = data ?? [];
  const won = rows.filter((r) => r.status === "won").length;
  const closed = rows.filter((r) => ["won", "lost", "not_qualified"].includes(r.status)).length;
  return {
    newLast30: rows.filter((r) => r.created_at >= since).length,
    newOpen: rows.filter((r) => r.status === "new").length,
    qualified: rows.filter((r) => ["qualified", "proposal_sent", "negotiation"].includes(r.status)).length,
    conversionRate: closed ? (won / closed) * 100 : null,
    total: rows.length,
  };
}

export async function getProjectMetrics(ctx: TeamContext) {
  const sb = await createClient();
  const { data } = await sb.from("projects").select("status, due_date").eq("organization_id", ctx.organizationId).is("deleted_at", null);
  const rows = data ?? [];
  const today = iso(new Date());
  const byStatus = rows.reduce<Record<string, number>>((acc, r) => ((acc[r.status] = (acc[r.status] ?? 0) + 1), acc), {});
  return {
    byStatus,
    active: rows.filter((r) => ["planning", "in_progress", "awaiting_client", "in_review"].includes(r.status)).length,
    completed: byStatus.completed ?? 0,
    overdue: rows.filter((r) => r.due_date && r.due_date < today && !["completed", "cancelled", "draft"].includes(r.status)).length,
  };
}

export async function getTeamWorkload(ctx: TeamContext) {
  const sb = await createClient();
  const { data } = await sb.rpc("report_team_workload", { p_org: ctx.organizationId });
  return data ?? [];
}

export async function getRevenueByClient(ctx: TeamContext, range: DateRange) {
  if (!ctx.can("finance.view")) return [];
  const sb = await createClient();
  const { data } = await sb.rpc("report_revenue_by_client", { p_org: ctx.organizationId, p_from: range.from, p_to: range.to });
  return data ?? [];
}

export async function getRevenueByService(ctx: TeamContext, range: DateRange) {
  if (!ctx.can("finance.view")) return [];
  const sb = await createClient();
  const { data } = await sb.rpc("report_revenue_by_service", { p_org: ctx.organizationId, p_from: range.from, p_to: range.to });
  return data ?? [];
}

export async function getProjectProfitability(ctx: TeamContext) {
  if (!ctx.can("finance.view")) return [];
  const sb = await createClient();
  const { data } = await sb.rpc("report_project_profitability", { p_org: ctx.organizationId });
  return data ?? [];
}

export async function getLeadBreakdown(ctx: TeamContext, range: DateRange) {
  if (!ctx.can("leads.view")) return [];
  const sb = await createClient();
  const { data } = await sb.rpc("report_lead_breakdown", { p_org: ctx.organizationId, p_from: range.from, p_to: range.to });
  return data ?? [];
}

export async function getProjectDelivery(ctx: TeamContext, range: DateRange) {
  const sb = await createClient();
  const { data } = await sb.rpc("report_project_delivery", { p_org: ctx.organizationId, p_from: range.from, p_to: range.to });
  return data?.[0] ?? null;
}
