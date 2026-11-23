import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { TeamContext } from "@/lib/auth/session";
import type { Permission } from "@/lib/permissions";
import { getLeadBreakdown, getLeadFunnel, getMonthlyFinance, getProjectProfitability, getRevenueByClient, getRevenueByService, getTeamWorkload, type DateRange } from "./queries";
import { fromMinorUnits } from "@/lib/finance/money";
import { EXPENSE_CATEGORIES, type ExpenseCategory } from "@/lib/status";

export type Cell = string | number | null;
export interface Dataset {
  title: string;
  columns: { key: string; label: string; money?: boolean; align?: "right" }[];
  rows: Record<string, Cell>[];
}

export const REPORTS: Record<string, { label: string; permission: Permission }> = {
  revenue: { label: "Revenue", permission: "reports.finance" },
  expenses: { label: "Expenses", permission: "reports.finance" },
  profitability: { label: "Project profitability", permission: "reports.finance" },
  outstanding: { label: "Outstanding invoices", permission: "reports.finance" },
  clients: { label: "Client performance", permission: "reports.finance" },
  services: { label: "Service performance", permission: "reports.view" },
  leads: { label: "Lead performance", permission: "reports.view" },
  delivery: { label: "Project delivery", permission: "reports.view" },
  workload: { label: "Team workload", permission: "reports.view" },
};

const m = (v: unknown) => Number(v ?? 0);

/** Single source for every report table and CSV export. All data comes from RLS-scoped queries. */
export async function buildDataset(key: string, ctx: TeamContext, range: DateRange, currency: string): Promise<Dataset | null> {
  const def = REPORTS[key];
  if (!def || !ctx.can(def.permission)) return null;
  const sb = await createClient();
  switch (key) {
    case "revenue": {
      const rows = await getMonthlyFinance(ctx, range);
      return {
        title: "Revenue by month",
        columns: [{ key: "month", label: "Month" }, { key: "invoiced", label: "Invoiced", money: true }, { key: "revenue", label: "Collected", money: true }, { key: "expenses", label: "Expenses", money: true }, { key: "profit", label: "Net", money: true }],
        rows,
      };
    }
    case "expenses": {
      const { data } = await sb.from("expenses").select("category, amount_cents").eq("organization_id", ctx.organizationId).is("deleted_at", null).gte("expense_date", range.from).lte("expense_date", range.to);
      const map = new Map<string, { total: number; count: number }>();
      for (const e of data ?? []) {
        const cur = map.get(e.category) ?? { total: 0, count: 0 };
        map.set(e.category, { total: cur.total + e.amount_cents, count: cur.count + 1 });
      }
      return {
        title: "Expenses by category",
        columns: [{ key: "category", label: "Category" }, { key: "count", label: "Entries", align: "right" }, { key: "total", label: "Total", money: true }],
        rows: [...map.entries()].sort((a, b) => b[1].total - a[1].total).map(([k, v]) => ({ category: EXPENSE_CATEGORIES[k as ExpenseCategory] ?? k, count: v.count, total: v.total })),
      };
    }
    case "profitability": {
      const rows = await getProjectProfitability(ctx);
      return {
        title: "Project profitability (lifetime)",
        columns: [
          { key: "code", label: "Code" }, { key: "name", label: "Project" }, { key: "client_name", label: "Client" }, { key: "contract_value_cents", label: "Contract", money: true },
          { key: "invoiced_cents", label: "Invoiced", money: true }, { key: "collected_cents", label: "Collected", money: true }, { key: "expenses_cents", label: "Expenses", money: true },
          { key: "labor_cost_cents", label: "Labour", money: true }, { key: "profit_cents", label: "Profit", money: true }, { key: "hours", label: "Hours", align: "right" },
        ],
        rows: rows.map((r) => ({ ...r, hours: Number(r.hours) })),
      };
    }
    case "outstanding": {
      const { data } = await sb.from("invoices").select("number, issue_date, due_date, status, total_cents, balance_cents, client:clients(name)").eq("organization_id", ctx.organizationId).is("deleted_at", null).in("status", ["sent", "partially_paid", "overdue"]).order("due_date");
      const today = Date.now();
      return {
        title: "Outstanding invoices",
        columns: [{ key: "number", label: "Invoice" }, { key: "client", label: "Client" }, { key: "due_date", label: "Due" }, { key: "days_overdue", label: "Days overdue", align: "right" }, { key: "status", label: "Status" }, { key: "total", label: "Total", money: true }, { key: "balance", label: "Balance", money: true }],
        rows: (data ?? []).map((i) => ({
          number: i.number, client: i.client?.name ?? "", due_date: i.due_date, status: i.status, total: i.total_cents, balance: m(i.balance_cents),
          days_overdue: Math.max(0, Math.floor((today - new Date(`${i.due_date}T00:00:00`).getTime()) / 864e5)),
        })),
      };
    }
    case "clients": {
      const rows = await getRevenueByClient(ctx, range);
      return {
        title: "Client performance",
        columns: [{ key: "client_name", label: "Client" }, { key: "projects", label: "Projects", align: "right" }, { key: "invoiced_cents", label: "Invoiced", money: true }, { key: "revenue_cents", label: "Collected", money: true }, { key: "outstanding_cents", label: "Outstanding", money: true }],
        rows: rows.map((r) => ({ ...r })),
      };
    }
    case "services": {
      const [revenue, leads] = await Promise.all([ctx.can("finance.view") ? getRevenueByService(ctx, range) : Promise.resolve([]), getLeadBreakdown(ctx, range)]);
      const demand = new Map(leads.filter((l) => l.dimension === "service").map((l) => [l.key, l]));
      const names = new Set([...revenue.map((r) => r.service_name), ...demand.keys()]);
      return {
        title: "Service performance",
        columns: [
          { key: "service", label: "Service" }, { key: "leads", label: "Leads", align: "right" }, { key: "won", label: "Won", align: "right" },
          ...(ctx.can("finance.view") ? [{ key: "revenue", label: "Revenue", money: true }] : []),
        ],
        rows: [...names].map((n) => ({ service: n, leads: demand.get(n)?.total ?? 0, won: demand.get(n)?.won ?? 0, revenue: m(revenue.find((r) => r.service_name === n)?.revenue_cents) })).sort((a, b) => b.revenue - a.revenue || b.leads - a.leads),
      };
    }
    case "leads": {
      const [funnel, breakdown] = await Promise.all([getLeadFunnel(ctx, range), getLeadBreakdown(ctx, range)]);
      const sources = breakdown.filter((b) => b.dimension === "source");
      return {
        title: "Lead performance by source",
        columns: [{ key: "source", label: "Source" }, { key: "total", label: "Leads", align: "right" }, { key: "won", label: "Won", align: "right" }, { key: "rate", label: "Conversion", align: "right" }],
        rows: [
          ...sources.sort((a, b) => b.total - a.total).map((s) => ({ source: s.key, total: s.total, won: s.won, rate: s.total ? `${Math.round((s.won / s.total) * 100)}%` : "—" })),
          ...(funnel.length ? [] : []),
        ],
      };
    }
    case "delivery": {
      const { data } = await sb.from("projects").select("code, name, status, start_date, due_date, completed_at, progress, client:clients(name)").eq("organization_id", ctx.organizationId).is("deleted_at", null).order("due_date");
      return {
        title: "Project delivery",
        columns: [{ key: "code", label: "Code" }, { key: "name", label: "Project" }, { key: "client", label: "Client" }, { key: "status", label: "Status" }, { key: "progress", label: "Progress", align: "right" }, { key: "due_date", label: "Deadline" }, { key: "completed", label: "Completed" }, { key: "on_time", label: "On time" }],
        rows: (data ?? []).map((p) => ({
          code: p.code, name: p.name, client: p.client?.name ?? "", status: p.status, progress: `${p.progress}%`, due_date: p.due_date, completed: p.completed_at?.slice(0, 10) ?? "",
          on_time: p.completed_at ? (!p.due_date || p.completed_at.slice(0, 10) <= p.due_date ? "Yes" : "No") : p.due_date && p.due_date < new Date().toISOString().slice(0, 10) && !["completed", "cancelled"].includes(p.status) ? "Overdue" : "",
        })),
      };
    }
    case "workload": {
      const rows = await getTeamWorkload(ctx);
      return {
        title: "Team workload",
        columns: [{ key: "full_name", label: "Person" }, { key: "role_key", label: "Role" }, { key: "active_projects", label: "Projects", align: "right" }, { key: "open_tasks", label: "Open tasks", align: "right" }, { key: "overdue_tasks", label: "Overdue", align: "right" }, { key: "due_this_week", label: "Due this week", align: "right" }, { key: "estimated_hours", label: "Est. hours", align: "right" }, { key: "capacity_hours", label: "Capacity/wk", align: "right" }, { key: "logged_hours_30d", label: "Logged (30d)", align: "right" }],
        rows: rows.map((r) => ({ ...r, estimated_hours: Number(r.estimated_hours), logged_hours_30d: Number(r.logged_hours_30d) })),
      };
    }
  }
  return null;
}

export function toCsv(ds: Dataset, currency: string): string {
  const esc = (v: Cell) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    // Neutralise spreadsheet formula injection and quote special characters.
    const safe = /^[=+\-@\t\r]/.test(s) && !/^-?\d/.test(s) ? `'${s}` : s;
    return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  const header = ds.columns.map((c) => esc(c.money ? `${c.label} (${currency})` : c.label)).join(",");
  const lines = ds.rows.map((r) => ds.columns.map((c) => esc(c.money ? fromMinorUnits(m(r[c.key]), currency).toFixed(2) : r[c.key])).join(","));
  return [header, ...lines].join("\n");
}
