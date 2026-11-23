import Link from "next/link";
import { format, startOfMonth, subMonths } from "date-fns";
import { requireTeam } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MoneyAreaChart, SimpleBarChart } from "@/components/shared/charts";
import { EmptyState } from "@/components/shared/empty-state";
import { getFinanceSummary, getMonthlyFinance, getRevenueByClient, getRevenueByService } from "@/features/reports/queries";
import { getCurrency } from "@/features/settings/queries";
import { formatMoney } from "@/lib/format";

export const metadata = { title: "Finance" };

export default async function FinanceOverview() {
  const ctx = await requireTeam("finance.view");
  const sb = await createClient();
  const currency = await getCurrency(ctx.organizationId);
  const range = { from: format(startOfMonth(subMonths(new Date(), 11)), "yyyy-MM-dd"), to: format(new Date(), "yyyy-MM-dd") };
  const [summary, monthly, byClient, byService, { data: open }] = await Promise.all([
    getFinanceSummary(ctx),
    getMonthlyFinance(ctx, range),
    getRevenueByClient(ctx, range),
    getRevenueByService(ctx, range),
    sb.from("invoices").select("id, number, due_date, balance_cents, client:clients(name)").is("deleted_at", null).in("status", ["sent", "partially_paid", "overdue"]).order("due_date"),
  ]);
  const today = new Date();
  const buckets = { Current: 0, "1–30 days": 0, "31–60 days": 0, "61–90 days": 0, "90+ days": 0 };
  for (const i of open ?? []) {
    const days = Math.floor((today.getTime() - new Date(`${i.due_date}T00:00:00`).getTime()) / 864e5);
    const k = days <= 0 ? "Current" : days <= 30 ? "1–30 days" : days <= 60 ? "31–60 days" : days <= 90 ? "61–90 days" : "90+ days";
    buckets[k] += Number(i.balance_cents ?? 0);
  }
  return (
    <>
      <PageHeader title="Finance" description="Cash-basis view: revenue is money received; profit is revenue minus expenses." />
      {summary ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total revenue" value={formatMoney(summary.revenue, currency)} href="/admin/finance/payments" />
          <StatCard label="Outstanding receivables" value={formatMoney(summary.outstanding, currency)} hint={summary.overdueCount ? `${formatMoney(summary.overdueAmount, currency)} overdue` : "Nothing overdue"} tone={summary.overdueCount ? "negative" : "default"} href="/admin/finance/invoices" />
          <StatCard label="Total expenses" value={formatMoney(summary.expenses, currency)} href="/admin/finance/expenses" />
          <StatCard label="Net profit" value={formatMoney(summary.profit, currency)} tone={summary.profit >= 0 ? "positive" : "negative"} hint={summary.revenue ? `${((summary.profit / summary.revenue) * 100).toFixed(0)}% margin` : undefined} />
        </div>
      ) : null}
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Revenue, invoiced & expenses</CardTitle>
              <CardDescription>Last 12 months</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <MoneyAreaChart data={monthly} xKey="month" currency={currency} series={[{ key: "revenue", label: "Revenue" }, { key: "invoiced", label: "Invoiced", color: "var(--chart-2)" }, { key: "expenses", label: "Expenses", color: "var(--chart-3)" }]} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Receivables aging</CardTitle>
              <CardDescription>Open balances by days overdue</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={Object.entries(buckets).map(([k, v]) => ({ bucket: k, amount: v }))} xKey="bucket" money={currency} series={[{ key: "amount", label: "Balance" }]} height={240} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Revenue by client</CardTitle>
            <Link href="/admin/reports?section=clients" className="text-[12.5px] text-muted-foreground hover:text-foreground">Report →</Link>
          </CardHeader>
          <CardContent>
            {byClient.some((c) => Number(c.revenue_cents) > 0) ? (
              <ul className="grid gap-2.5 text-[13px]">
                {byClient.filter((c) => Number(c.revenue_cents) > 0).slice(0, 8).map((c) => (
                  <li key={c.client_id} className="flex justify-between gap-2">
                    <span className="truncate">{c.client_name}</span>
                    <span className="tabular">{formatMoney(Number(c.revenue_cents), currency)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState compact title="No revenue in this period" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Revenue by service</CardTitle>
          </CardHeader>
          <CardContent>
            {byService.length ? (
              <ul className="grid gap-2.5 text-[13px]">
                {byService.map((s) => (
                  <li key={s.service_name} className="flex justify-between gap-2">
                    <span className="truncate">{s.service_name}</span>
                    <span className="tabular">{formatMoney(Number(s.revenue_cents), currency)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState compact title="No revenue in this period" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Open invoices</CardTitle>
          </CardHeader>
          <CardContent>
            {open?.length ? (
              <ul className="grid gap-2 text-[13px]">
                {open.slice(0, 8).map((i) => (
                  <li key={i.id} className="flex justify-between gap-2">
                    <Link href={`/admin/finance/invoices/${i.id}`} className="truncate hover:underline">
                      {i.number} · {i.client?.name}
                    </Link>
                    <span className="tabular">{formatMoney(Number(i.balance_cents), currency)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState compact title="All invoices are paid" />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
