"use client";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { CLIENT_STATUSES } from "@/lib/status";
import { formatDate, formatMoney } from "@/lib/format";

export interface ClientRow {
  id: string;
  name: string;
  type: string;
  email: string | null;
  industry: string | null;
  country: string | null;
  status: keyof typeof CLIENT_STATUSES;
  manager: string | null;
  active_projects: number;
  outstanding_cents: number | null;
  created_at: string;
}

export function ClientTable({ rows, currency, showFinance }: { rows: ClientRow[]; currency: string; showFinance: boolean }) {
  const router = useRouter();
  const columns: ColumnDef<ClientRow>[] = [
    {
      accessorKey: "name",
      header: "Client",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          <p className="text-[12px] text-muted-foreground">{row.original.email ?? (row.original.type === "company" ? "Company" : "Individual")}</p>
        </div>
      ),
    },
    { accessorKey: "industry", header: "Industry", cell: ({ getValue }) => (getValue() as string) ?? "—" },
    { accessorKey: "country", header: "Country", cell: ({ getValue }) => (getValue() as string) ?? "—" },
    { accessorKey: "active_projects", header: "Active projects", cell: ({ getValue }) => <span className="tabular">{getValue() as number}</span> },
    ...(showFinance
      ? ([{ accessorKey: "outstanding_cents", header: "Outstanding", cell: ({ getValue }) => <span className="tabular">{getValue() ? formatMoney(getValue() as number, currency) : "—"}</span> }] as ColumnDef<ClientRow>[])
      : []),
    { accessorKey: "manager", header: "Account manager", cell: ({ getValue }) => (getValue() as string) ?? "—" },
    { accessorKey: "status", header: "Status", filterFn: "equals", cell: ({ getValue }) => <StatusBadge status={getValue() as keyof typeof CLIENT_STATUSES} map={CLIENT_STATUSES} /> },
    { accessorKey: "type", header: "Type", filterFn: "equals", cell: ({ getValue }) => <span className="capitalize text-muted-foreground">{getValue() as string}</span> },
    { accessorKey: "created_at", header: "Since", cell: ({ getValue }) => formatDate(getValue() as string) },
  ];
  return (
    <DataTable
      columns={columns}
      data={rows}
      searchPlaceholder="Search clients…"
      onRowClick={(r) => router.push(`/admin/clients/${r.id}`)}
      facets={[
        { columnId: "status", label: "Statuses", options: Object.entries(CLIENT_STATUSES).map(([k, v]) => ({ value: k, label: v.label })) },
        { columnId: "type", label: "Types", options: [{ value: "company", label: "Company" }, { value: "individual", label: "Individual" }] },
      ]}
    />
  );
}
