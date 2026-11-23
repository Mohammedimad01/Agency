import Link from "next/link";
import { ArrowRight, CircleCheck, FileText, Receipt, TriangleExclamationPoint } from "lucide-react";
import { requireClient } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate, formatMoney, formatRelative } from "@/lib/format";
import { INVOICE_STATUSES, PROJECT_STATUSES } from "@/lib/status";

export const metadata = { title: "Overview" };

export default async function PortalHome() {
  const ctx = await requireClient();
  const sb = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const [projects, milestones, approvals, actions, invoices, proposals, activity, notifications, agency] = await Promise.all([
    sb.from("portal_projects").select("*").order("updated_at", { ascending: false }),
    sb.from("portal_milestones").select("id, title, due_date, project_id, status").neq("status", "completed").order("due_date").limit(5),
    sb.from("portal_deliverables").select("id, title, project_id, current_version, submitted_at").eq("status", "submitted"),
    sb.from("portal_tasks").select("id, title, project_id, due_date").eq("requires_client_action", true).neq("status", "done"),
    sb.from("portal_invoices").select("id, number, status, balance_cents, due_date, currency").in("status", ["sent", "partially_paid", "overdue"]).order("due_date"),
    sb.from("portal_proposals").select("id, number, title, total_cents, currency, valid_until").in("status", ["sent", "viewed"]),
    sb.from("portal_activity").select("id, description, created_at").order("created_at", { ascending: false }).limit(6),
    sb.from("notifications").select("id, title, body, link, created_at, read_at").order("created_at", { ascending: false }).limit(4),
    sb.from("portal_agency").select("name, currency").limit(1).maybeSingle(),
  ]);
  const active = (projects.data ?? []).filter((p) => !["completed", "cancelled"].includes(p.status!));
  const pending = (approvals.data?.length ?? 0) + (actions.data?.length ?? 0) + (proposals.data?.length ?? 0);
  const outstanding = (invoices.data ?? []).reduce((s, i) => s + Number(i.balance_cents ?? 0), 0);
  const currency = invoices.data?.[0]?.currency ?? agency.data?.currency ?? "USD";
  const firstName = (ctx.contact?.full_name ?? ctx.profile.full_name ?? "").split(" ")[0];
  const pname = (id: string | null) => projects.data?.find((p) => p.id === id)?.name ?? "";

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-display text-[2.4rem] leading-tight tracking-tight">Welcome back{firstName ? `, ${firstName}` : ""}.</h1>
        <p className="mt-1 text-[14.5px] text-muted-foreground">
          {pending ? `${pending} item${pending > 1 ? "s" : ""} need${pending > 1 ? "" : "s"} your attention.` : "Everything is on track — nothing needs your attention right now."}
        </p>
      </div>

      {pending ? (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle>Needs your attention</CardTitle>
          </CardHeader>
          <ul className="divide-y border-t">
            {(proposals.data ?? []).map((p) => (
              <AttentionItem key={p.id} icon={FileText} href={`/portal/documents/proposals/${p.id}`} title={`Review proposal: ${p.title}`} meta={`${formatMoney(p.total_cents, p.currency!)}${p.valid_until ? ` · valid until ${formatDate(p.valid_until)}` : ""}`} cta="Review" />
            ))}
            {(approvals.data ?? []).map((d) => (
              <AttentionItem key={d.id} icon={CircleCheck} href={`/portal/projects/${d.project_id}?tab=deliverables`} title={`Approve: ${d.title}`} meta={`${pname(d.project_id)} · version ${d.current_version}`} cta="Review" />
            ))}
            {(actions.data ?? []).map((t) => (
              <AttentionItem key={t.id} icon={TriangleExclamationPoint} href={`/portal/projects/${t.project_id}`} title={t.title} meta={`${pname(t.project_id)}${t.due_date ? ` · due ${formatDate(t.due_date)}` : ""}`} cta="Open" />
            ))}
          </ul>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Active projects</CardTitle>
            <Link href="/portal/projects" className="text-[12.5px] text-muted-foreground hover:text-foreground">
              All projects →
            </Link>
          </CardHeader>
          <CardContent className="grid gap-3">
            {active.length ? (
              active.map((p) => (
                <Link key={p.id} href={`/portal/projects/${p.id}`} className="group rounded-lg border p-4 transition-colors hover:border-foreground/20">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium group-hover:text-primary">{p.name}</p>
                      <p className="text-[12.5px] text-muted-foreground">
                        {p.service_name ?? p.code} · {p.due_date ? `target ${formatDate(p.due_date)}` : "dates to be confirmed"}
                      </p>
                    </div>
                    <StatusBadge status={p.status!} map={PROJECT_STATUSES} />
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <Progress value={p.progress ?? 0} className="h-2 flex-1" />
                    <span className="w-10 text-right text-[13px] font-medium tabular">{p.progress}%</span>
                  </div>
                </Link>
              ))
            ) : (
              <EmptyState compact title="No active projects" />
            )}
          </CardContent>
        </Card>

        <div className="grid content-start gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Outstanding balance</CardTitle>
              <Receipt className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tracking-tight tabular">{formatMoney(outstanding, currency)}</p>
              <ul className="mt-3 grid gap-2 text-[13px]">
                {(invoices.data ?? []).map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-2">
                    <Link href={`/portal/invoices/${i.id}`} className="hover:underline">
                      {i.number}
                    </Link>
                    <span className="flex items-center gap-2">
                      <span className={i.due_date && i.due_date < today ? "text-destructive" : "text-muted-foreground"}>due {formatDate(i.due_date, "d MMM")}</span>
                      <StatusBadge status={i.status!} map={INVOICE_STATUSES} />
                    </span>
                  </li>
                ))}
              </ul>
              {!invoices.data?.length ? <p className="mt-1 text-[13px] text-muted-foreground">You&apos;re all paid up. Thank you!</p> : null}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Upcoming milestones</CardTitle>
            </CardHeader>
            <CardContent>
              {milestones.data?.length ? (
                <ul className="grid gap-2.5 text-[13px]">
                  {milestones.data.map((m) => (
                    <li key={m.id} className="flex justify-between gap-2">
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{m.title}</span>
                        <span className="text-[12px] text-muted-foreground">{pname(m.project_id)}</span>
                      </span>
                      <span className="shrink-0 text-muted-foreground">{formatDate(m.due_date, "d MMM")}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[13px] text-muted-foreground">No upcoming milestones.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activity.data?.length ? (
              <ul className="grid gap-3 text-[13.5px]">
                {activity.data.map((a) => (
                  <li key={a.id} className="flex justify-between gap-4">
                    <span>{a.description}</span>
                    <span className="shrink-0 text-[12px] text-muted-foreground">{formatRelative(a.created_at)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] text-muted-foreground">No activity yet.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Latest updates</CardTitle>
            <Link href="/portal/messages" className="text-[12.5px] text-muted-foreground hover:text-foreground">
              Messages →
            </Link>
          </CardHeader>
          <CardContent>
            {notifications.data?.length ? (
              <ul className="grid gap-3 text-[13px]">
                {notifications.data.map((n) => (
                  <li key={n.id}>
                    <Link href={n.link ?? "/portal"} className="font-medium hover:underline">
                      {n.title}
                    </Link>
                    <p className="text-[12px] text-muted-foreground">{formatRelative(n.created_at)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] text-muted-foreground">No updates yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AttentionItem({ icon: Icon, href, title, meta, cta }: { icon: React.ComponentType<{ className?: string }>; href: string; title: string; meta: string; cta: string }) {
  return (
    <li className="flex items-center gap-3 px-5 py-3">
      <Icon className="size-4 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-medium">{title}</p>
        <p className="truncate text-[12.5px] text-muted-foreground">{meta}</p>
      </div>
      <Button size="sm" variant="outline" asChild>
        <Link href={href}>
          {cta} <ArrowRight />
        </Link>
      </Button>
    </li>
  );
}
