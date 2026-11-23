"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Progress } from "@/components/ui/progress";
import { UserAvatar } from "@/components/ui/avatar";
import { PROJECT_PIPELINE, PROJECT_STATUSES, PRIORITIES } from "@/lib/status";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { setProjectStatus } from "../actions";

export interface ProjectRow {
  id: string;
  code: string;
  name: string;
  client: string;
  status: keyof typeof PROJECT_STATUSES;
  priority: keyof typeof PRIORITIES;
  progress: number;
  due_date: string | null;
  manager: string | null;
  service: string | null;
}

export function ProjectTable({ rows }: { rows: ProjectRow[] }) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const columns: ColumnDef<ProjectRow>[] = [
    {
      accessorKey: "name",
      header: "Project",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          <p className="text-[12px] text-muted-foreground">
            {row.original.code} · {row.original.client}
          </p>
        </div>
      ),
    },
    { accessorKey: "service", header: "Service", cell: ({ getValue }) => <span className="text-muted-foreground">{(getValue() as string) ?? "—"}</span> },
    { accessorKey: "status", header: "Status", filterFn: "equals", cell: ({ getValue }) => <StatusBadge status={getValue() as ProjectRow["status"]} map={PROJECT_STATUSES} /> },
    { accessorKey: "priority", header: "Priority", filterFn: "equals", cell: ({ getValue }) => <StatusBadge status={getValue() as ProjectRow["priority"]} map={PRIORITIES} dot={false} /> },
    {
      accessorKey: "progress",
      header: "Progress",
      cell: ({ getValue }) => (
        <div className="flex w-32 items-center gap-2">
          <Progress value={getValue() as number} />
          <span className="w-9 text-right text-[12px] tabular">{getValue() as number}%</span>
        </div>
      ),
    },
    {
      accessorKey: "due_date",
      header: "Deadline",
      cell: ({ row }) => {
        const late = row.original.due_date && row.original.due_date < today && !["completed", "cancelled"].includes(row.original.status);
        return <span className={cn(late && "font-medium text-destructive")}>{formatDate(row.original.due_date)}</span>;
      },
    },
    { accessorKey: "manager", header: "Manager", cell: ({ getValue }) => (getValue() as string) ?? "—" },
  ];
  return (
    <DataTable
      columns={columns}
      data={rows}
      searchPlaceholder="Search projects…"
      onRowClick={(r) => router.push(`/admin/projects/${r.id}`)}
      facets={[
        { columnId: "status", label: "Statuses", options: PROJECT_PIPELINE.map((s) => ({ value: s, label: PROJECT_STATUSES[s].label })) },
        { columnId: "priority", label: "Priorities", options: Object.entries(PRIORITIES).map(([k, v]) => ({ value: k, label: v.label })) },
      ]}
    />
  );
}

export function ProjectBoard({ rows, canMove }: { rows: ProjectRow[]; canMove: boolean }) {
  const router = useRouter();
  const [, start] = useTransition();
  const [items, move] = useOptimistic(rows, (s, { id, status }: { id: string; status: ProjectRow["status"] }) => s.map((p) => (p.id === id ? { ...p, status } : p)));
  const [over, setOver] = useState<string | null>(null);
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex min-w-max gap-3">
        {PROJECT_PIPELINE.map((status) => {
          const list = items.filter((p) => p.status === status);
          return (
            <section
              key={status}
              aria-label={PROJECT_STATUSES[status].label}
              onDragOver={(e) => {
                if (!canMove) return;
                e.preventDefault();
                setOver(status);
              }}
              onDragLeave={() => setOver(null)}
              onDrop={(e) => {
                e.preventDefault();
                setOver(null);
                const id = e.dataTransfer.getData("text/project-id");
                if (!id || items.find((p) => p.id === id)?.status === status) return;
                start(async () => {
                  move({ id, status });
                  const r = await setProjectStatus(id, status);
                  if (!r.ok) toast.error(r.error);
                  router.refresh();
                });
              }}
              className={cn("flex w-[264px] shrink-0 flex-col rounded-lg border bg-surface", over === status && "border-primary/50 bg-primary/[0.04]")}
            >
              <header className="flex items-center gap-2 px-3 py-2.5">
                <span className="text-[13px] font-medium">{PROJECT_STATUSES[status].label}</span>
                <span className="rounded-full bg-muted px-1.5 text-[11px] text-muted-foreground tabular">{list.length}</span>
              </header>
              <div className="flex min-h-20 flex-col gap-2 px-2 pb-2">
                {list.map((p) => (
                  <article key={p.id} draggable={canMove} onDragStart={(e) => e.dataTransfer.setData("text/project-id", p.id)} className="rounded-md border bg-card p-3 shadow-xs">
                    <Link href={`/admin/projects/${p.id}`} className="block text-[13px] font-medium leading-snug hover:underline">
                      {p.name}
                    </Link>
                    <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{p.client}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <Progress value={p.progress} className="flex-1" />
                      <span className="text-[11.5px] tabular text-muted-foreground">{p.progress}%</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11.5px] text-muted-foreground">
                      <span>{p.due_date ? `Due ${formatDate(p.due_date, "d MMM")}` : "No deadline"}</span>
                      {p.manager ? <UserAvatar name={p.manager} className="size-5 text-[9px]" /> : null}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
