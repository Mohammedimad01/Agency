"use client";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { LEAD_PIPELINE, LEAD_STATUSES, PRIORITIES } from "@/lib/status";
import { formatDate, formatMoney } from "@/lib/format";
import { scoreLabel } from "../qualification";
import type { BoardLead } from "./lead-board";

type Row = BoardLead & { email: string; source: string; created_at: string };

export function LeadTable({ leads, currency }: { leads: Row[]; currency: string }) {
  const router = useRouter();
  const columns: ColumnDef<Row>[] = [
    {
      accessorKey: "full_name",
      header: "Lead",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.full_name}</p>
          <p className="text-[12px] text-muted-foreground">{row.original.company ?? row.original.email}</p>
        </div>
      ),
    },
    { accessorKey: "requested_service", header: "Service", cell: ({ getValue }) => <span className="text-muted-foreground">{(getValue() as string) ?? "—"}</span> },
    { accessorKey: "budget_cents", header: "Budget", cell: ({ getValue }) => <span className="tabular">{getValue() ? formatMoney(getValue() as number, currency) : "—"}</span> },
    {
      accessorKey: "qualification_score",
      header: "Score",
      cell: ({ getValue }) => {
        const v = getValue() as number | null;
        const s = scoreLabel(v);
        return v === null ? "—" : <Badge variant={s.variant} className="tabular">{v} · {s.label}</Badge>;
      },
    },
    { accessorKey: "status", header: "Status", filterFn: "equals", cell: ({ getValue }) => <StatusBadge status={getValue() as keyof typeof LEAD_STATUSES} map={LEAD_STATUSES} /> },
    { accessorKey: "priority", header: "Priority", filterFn: "equals", cell: ({ getValue }) => <StatusBadge status={getValue() as keyof typeof PRIORITIES} map={PRIORITIES} dot={false} /> },
    { accessorKey: "source", header: "Source", filterFn: "equals" },
    { accessorKey: "assignee", header: "Owner", cell: ({ getValue }) => (getValue() as string) ?? <span className="text-muted-foreground">Unassigned</span> },
    { accessorKey: "follow_up_at", header: "Follow-up", cell: ({ getValue }) => formatDate(getValue() as string | null) },
    { accessorKey: "created_at", header: "Created", cell: ({ getValue }) => formatDate(getValue() as string) },
  ];
  const sources = [...new Set(leads.map((l) => l.source))];
  return (
    <DataTable
      columns={columns}
      data={leads}
      searchPlaceholder="Search leads…"
      onRowClick={(r) => router.push(`/admin/leads/${r.id}`)}
      facets={[
        { columnId: "status", label: "Statuses", options: LEAD_PIPELINE.map((s) => ({ value: s, label: LEAD_STATUSES[s].label })) },
        { columnId: "priority", label: "Priorities", options: Object.entries(PRIORITIES).map(([k, v]) => ({ value: k, label: v.label })) },
        { columnId: "source", label: "Sources", options: sources.map((s) => ({ value: s, label: s })) },
      ]}
      emptyMessage="No leads match your filters."
    />
  );
}
