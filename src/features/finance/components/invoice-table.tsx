"use client";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { INVOICE_STATUSES } from "@/lib/status";
import { formatDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

type Row = { id: string; number: string; status: keyof typeof INVOICE_STATUSES; issue_date: string; due_date: string; total: number; paid: number; balance: number; client: string; project: string | null };

export function InvoiceTable({ rows, currency }: { rows: Row[]; currency: string }) {
  const router = useRouter();
  const columns: ColumnDef<Row>[] = [
    { accessorKey: "number", header: "Invoice", cell: ({ row }) => <span className="font-medium">{row.original.number}</span> },
    { accessorKey: "client", header: "Client", cell: ({ row }) => <div><p>{row.original.client}</p>{row.original.project ? <p className="text-[12px] text-muted-foreground">{row.original.project}</p> : null}</div> },
    { accessorKey: "issue_date", header: "Issued", cell: ({ getValue }) => formatDate(getValue() as string) },
    { accessorKey: "due_date", header: "Due", cell: ({ row }) => <span className={cn(row.original.status === "overdue" && "font-medium text-destructive")}>{formatDate(row.original.due_date)}</span> },
    { accessorKey: "status", header: "Status", filterFn: "equals", cell: ({ getValue }) => <StatusBadge status={getValue() as Row["status"]} map={INVOICE_STATUSES} /> },
    { accessorKey: "total", header: () => <span className="block text-right">Total</span>, cell: ({ getValue }) => <span className="block text-right tabular">{formatMoney(getValue() as number, currency)}</span> },
    { accessorKey: "balance", header: () => <span className="block text-right">Balance</span>, cell: ({ getValue }) => <span className="block text-right font-medium tabular">{(getValue() as number) > 0 ? formatMoney(getValue() as number, currency) : "—"}</span> },
  ];
  return (
    <DataTable
      columns={columns}
      data={rows}
      searchPlaceholder="Search invoices…"
      onRowClick={(r) => router.push(`/admin/finance/invoices/${r.id}`)}
      facets={[{ columnId: "status", label: "Statuses", options: Object.entries(INVOICE_STATUSES).map(([k, v]) => ({ value: k, label: v.label })) }]}
    />
  );
}
