"use client";
import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarClock } from "lucide-react";
import { UserAvatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LEAD_PIPELINE, LEAD_STATUSES } from "@/lib/status";
import { formatDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { updateLeadStatus } from "../actions";
import { scoreLabel } from "../qualification";

export interface BoardLead {
  id: string;
  full_name: string;
  company: string | null;
  status: string;
  qualification_score: number | null;
  budget_cents: number | null;
  requested_service: string | null;
  follow_up_at: string | null;
  assignee: string | null;
  priority: string;
}

/** Pipeline board with native drag & drop (status select in each card keeps it keyboard-accessible). */
export function LeadBoard({ leads, currency }: { leads: BoardLead[]; currency: string }) {
  const router = useRouter();
  const [, start] = useTransition();
  const [optimistic, move] = useOptimistic(leads, (state, { id, status }: { id: string; status: string }) => state.map((l) => (l.id === id ? { ...l, status } : l)));
  const [dragOver, setDragOver] = useState<string | null>(null);
  const now = new Date().toISOString();

  function changeStatus(id: string, status: string) {
    start(async () => {
      move({ id, status });
      const r = await updateLeadStatus(id, status);
      if (!r.ok) toast.error(r.error);
      router.refresh();
    });
  }

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex min-w-max gap-3">
        {LEAD_PIPELINE.map((status) => {
          const items = optimistic.filter((l) => l.status === status);
          const total = items.reduce((s, l) => s + (l.budget_cents ?? 0), 0);
          return (
            <section
              key={status}
              aria-label={LEAD_STATUSES[status].label}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(status);
              }}
              onDragLeave={() => setDragOver((s) => (s === status ? null : s))}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(null);
                const id = e.dataTransfer.getData("text/lead-id");
                const lead = optimistic.find((l) => l.id === id);
                if (lead && lead.status !== status) changeStatus(id, status);
              }}
              className={cn("flex w-[272px] shrink-0 flex-col rounded-lg border bg-surface transition-colors", dragOver === status && "border-primary/50 bg-primary/[0.04]")}
            >
              <header className="flex items-center justify-between px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium">{LEAD_STATUSES[status].label}</span>
                  <span className="rounded-full bg-muted px-1.5 text-[11px] text-muted-foreground tabular">{items.length}</span>
                </div>
                {total ? <span className="text-[11.5px] text-muted-foreground tabular">{formatMoney(total, currency, { compact: true })}</span> : null}
              </header>
              <div className="flex min-h-24 flex-1 flex-col gap-2 px-2 pb-2">
                {items.map((l) => {
                  const score = scoreLabel(l.qualification_score);
                  const due = l.follow_up_at && l.follow_up_at <= now;
                  return (
                    <article
                      key={l.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("text/lead-id", l.id)}
                      className="group cursor-grab rounded-md border bg-card p-3 shadow-xs transition-shadow hover:shadow-sm active:cursor-grabbing"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <Link href={`/admin/leads/${l.id}`} className="min-w-0 text-[13px] font-medium leading-snug hover:underline">
                          {l.full_name}
                          {l.company ? <span className="block truncate text-[12px] font-normal text-muted-foreground">{l.company}</span> : null}
                        </Link>
                        {l.qualification_score !== null ? (
                          <Badge variant={score.variant} className="shrink-0 tabular">
                            {l.qualification_score}
                          </Badge>
                        ) : null}
                      </div>
                      {l.requested_service ? <p className="mt-2 truncate text-[12px] text-muted-foreground">{l.requested_service}</p> : null}
                      <div className="mt-2.5 flex items-center justify-between gap-2 text-[11.5px] text-muted-foreground">
                        <span className="tabular">{l.budget_cents ? formatMoney(l.budget_cents, currency, { compact: true }) : "—"}</span>
                        <div className="flex items-center gap-1.5">
                          {l.follow_up_at ? (
                            <span className={cn("flex items-center gap-1", due && "text-destructive")}>
                              <CalendarClock className="size-3" />
                              {formatDate(l.follow_up_at, "d MMM")}
                            </span>
                          ) : null}
                          {l.assignee ? <UserAvatar name={l.assignee} className="size-5 text-[9px]" /> : null}
                        </div>
                      </div>
                      <label className="sr-only" htmlFor={`status-${l.id}`}>
                        Move {l.full_name}
                      </label>
                      <select
                        id={`status-${l.id}`}
                        value={l.status}
                        onChange={(e) => changeStatus(l.id, e.target.value)}
                        className="sr-only focus:not-sr-only focus:mt-2 focus:w-full focus:rounded focus:border focus:text-xs"
                      >
                        {LEAD_PIPELINE.map((s) => (
                          <option key={s} value={s}>
                            {LEAD_STATUSES[s].label}
                          </option>
                        ))}
                      </select>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
