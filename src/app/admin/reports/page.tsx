import Link from "next/link";
import { Download } from "lucide-react";
import { requireTeam } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/shared/stat-card";
import { MoneyAreaChart, SimpleBarChart } from "@/components/shared/charts";
import { EmptyState } from "@/components/shared/empty-state";
import { REPORTS, buildDataset } from "@/features/reports/datasets";
import { getFinanceSummary, getLeadFunnel, getMonthlyFinance, getProjectDelivery, resolveRange } from "@/features/reports/queries";
import { getCurrency } from "@/features/settings/queries";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ReportFilters } from "@/features/reports/report-filters";

export const metadata = { title: "Reports" };

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ section?: string; preset?: string; from?: string; to?: string }> }) {
  const ctx = await requireTeam("reports.view");
  const sp = await searchParams;
  const range = resolveRange(sp);
  const available = Object.entries(REPORTS).filter(([, d]) => ctx.can(d.permission));
  const section = available.find(([k]) => k === sp.section)?.[0] ?? available[0]?.[0] ?? "leads";
  const currency = await getCurrency(ctx.organizationId);
  const [ds, summary, monthly, funnel, delivery] = await Promise.all([
    buildDataset(section, ctx, range, currency),
    ctx.can("reports.finance") ? getFinanceSummary(ctx, range) : Promise.resolve(null),
    ctx.can("reports.finance") ? getMonthlyFinance(ctx, range) : Promise.resolve([]),
    getLeadFunnel(ctx, range),
    getProjectDelivery(ctx, range),
  ]);
  const qs = new URLSearchParams({ preset: range.preset, from: range.from, to: range.to });
  const leadsTotal = funnel.reduce((s, f) => s + f.created, 0);
  const won = funnel.reduce((s, f) => s + f.won, 0);
  const lost = funnel.reduce((s, f) => s + f.lost, 0);

  return (
    <>
      <PageHeader title="Reports" description={`${range.from} → ${range.to}`} actions={<ReportFilters preset={range.preset} from={range.from} to={range.to} section={section} />} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summary ? <StatCard label="Revenue (period)" value={formatMoney(summary.revenue, currency)} /> : null}
        {summary ? <StatCard label="Net profit (period)" value={formatMoney(summary.profit, currency)} tone={summary.profit >= 0 ? "positive" : "negative"} /> : null}
        <StatCard label="Leads (period)" value={leadsTotal} hint={won + lost ? `${Math.round((won / (won + lost)) * 100)}% conversion of closed` : "No closed leads"} />
        <StatCard label="Projects delivered" value={delivery?.completed ?? 0} hint={delivery?.completed ? `${delivery.on_time} on time · ${delivery.late} late` : `${delivery?.active ?? 0} active · ${delivery?.overdue ?? 0} overdue`} />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {monthly.length ? (
          <Card>
            <CardHeader>
              <CardTitle>Revenue vs expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <MoneyAreaChart data={monthly} xKey="month" currency={currency} height={220} series={[{ key: "revenue", label: "Revenue" }, { key: "expenses", label: "Expenses", color: "var(--chart-3)" }]} />
            </CardContent>
          </Card>
        ) : null}
        <Card className={monthly.length ? "" : "xl:col-span-2"}>
          <CardHeader>
            <CardTitle>Lead conversion</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={funnel} xKey="month" height={220} series={[{ key: "created", label: "New" }, { key: "won", label: "Won", color: "var(--chart-2)" }, { key: "lost", label: "Lost", color: "var(--chart-5)" }]} />
          </CardContent>
        </Card>
      </div>
      <div className="mt-6 flex gap-1 overflow-x-auto border-b">
        {available.map(([k, d]) => (
          <Link key={k} href={`/admin/reports?section=${k}&${qs}`} className={cn("-mb-px shrink-0 border-b-2 border-transparent px-3 pb-2.5 text-[13.5px] text-muted-foreground hover:text-foreground", section === k && "border-primary font-medium text-foreground")}>
            {d.label}
          </Link>
        ))}
      </div>
      {ds ? (
        <Card className="mt-4">
          <CardHeader>
            <div>
              <CardTitle>{ds.title}</CardTitle>
              <CardDescription>{ds.rows.length} rows</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href={`/api/export/${section}?${qs}`}>
                <Download /> Export CSV
              </a>
            </Button>
          </CardHeader>
          {ds.rows.length ? (
            <div className="overflow-x-auto border-t">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b bg-muted/40 text-[12px] text-muted-foreground">
                    {ds.columns.map((c) => (
                      <th key={c.key} className={cn("whitespace-nowrap px-4 py-2 text-left font-medium first:pl-5", (c.money || c.align === "right") && "text-right")}>
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ds.rows.map((r, i) => (
                    <tr key={i} className="border-b last:border-0">
                      {ds.columns.map((c) => (
                        <td key={c.key} className={cn("whitespace-nowrap px-4 py-2 first:pl-5", (c.money || c.align === "right") && "text-right tabular")}>
                          {c.money ? formatMoney(Number(r[c.key] ?? 0), currency) : String(r[c.key] ?? "—")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <CardContent>
              <EmptyState compact title="No data for this period" />
            </CardContent>
          )}
        </Card>
      ) : null}
    </>
  );
}
