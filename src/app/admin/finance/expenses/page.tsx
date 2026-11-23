import { Paperclip, Pencil, Plus, Wallet } from "lucide-react";
import { requireTeam } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { FormDialog } from "@/components/shared/form-dialog";
import { DeleteExpenseButton, ExpenseForm } from "@/features/finance/components/finance-actions";
import { getCurrency } from "@/features/settings/queries";
import { EXPENSE_CATEGORIES, type ExpenseCategory } from "@/lib/status";
import { formatDate, formatMoney } from "@/lib/format";
import { minorToInput } from "@/lib/finance/money";

export const metadata = { title: "Expenses" };

export default async function ExpensesPage() {
  const ctx = await requireTeam("finance.view");
  const sb = await createClient();
  const [{ data }, currency, { data: projects }] = await Promise.all([
    sb.from("expenses").select("*, project:projects(name)").eq("organization_id", ctx.organizationId).is("deleted_at", null).order("expense_date", { ascending: false }).limit(500),
    getCurrency(ctx.organizationId),
    sb.from("projects").select("id, name").is("deleted_at", null).order("name"),
  ]);
  const rows = data ?? [];
  const byCat = Object.entries(rows.reduce<Record<string, number>>((acc, e) => ((acc[e.category] = (acc[e.category] ?? 0) + e.amount_cents), acc), {})).sort((a, b) => b[1] - a[1]);
  const total = rows.reduce((s, e) => s + e.amount_cents, 0);
  const canManage = ctx.can("finance.manage");
  return (
    <>
      <PageHeader
        title="Expenses"
        actions={
          canManage ? (
            <FormDialog title="New expense" trigger={<Button size="sm"><Plus /> Add expense</Button>}>
              <ExpenseForm currency={currency} projects={projects ?? []} />
            </FormDialog>
          ) : null
        }
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        {rows.length ? (
          <Card>
            <ul className="divide-y">
              {rows.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-[13.5px]">
                  <span className="w-24 text-muted-foreground">{formatDate(e.expense_date)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="font-medium">{e.description}</span>
                    <span className="block text-[12px] text-muted-foreground">
                      {e.vendor ?? "—"}
                      {e.project ? ` · ${e.project.name}` : " · overhead"}
                    </span>
                  </span>
                  {e.receipt_file_id ? (
                    <a href={`/api/files/${e.receipt_file_id}`} aria-label="Download receipt" className="text-muted-foreground hover:text-foreground">
                      <Paperclip className="size-4" />
                    </a>
                  ) : null}
                  <Badge variant="neutral">{EXPENSE_CATEGORIES[e.category as ExpenseCategory]}</Badge>
                  <span className="w-24 text-right font-medium tabular">{formatMoney(e.amount_cents, currency)}</span>
                  {canManage ? (
                    <>
                      <FormDialog title="Edit expense" trigger={<Button variant="ghost" size="icon-sm" aria-label="Edit"><Pencil /></Button>}>
                        <ExpenseForm
                          id={e.id}
                          currency={currency}
                          projects={projects ?? []}
                          expense={{ category: e.category as ExpenseCategory, description: e.description, amount: minorToInput(e.amount_cents, currency), expense_date: e.expense_date, vendor: e.vendor ?? "", project_id: e.project_id ?? "", receipt_file_id: e.receipt_file_id ?? "" }}
                        />
                      </FormDialog>
                      <DeleteExpenseButton id={e.id} />
                    </>
                  ) : null}
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <EmptyState icon={Wallet} title="No expenses recorded" />
        )}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>By category</CardTitle>
            <span className="text-[13px] font-semibold tabular">{formatMoney(total, currency)}</span>
          </CardHeader>
          <CardContent className="grid gap-2.5">
            {byCat.map(([k, v]) => (
              <div key={k}>
                <div className="flex justify-between text-[13px]">
                  <span>{EXPENSE_CATEGORIES[k as ExpenseCategory]}</span>
                  <span className="tabular">{formatMoney(v, currency)}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-chart-3" style={{ width: `${(v / (total || 1)) * 100}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
