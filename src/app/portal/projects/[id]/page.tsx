import { notFound } from "next/navigation";
import { CalendarDays, ExternalLink, Mail, TriangleExclamationPoint } from "lucide-react";
import { requireClient } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { TabNav } from "@/components/shared/tab-nav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ActivityFeed } from "@/components/shared/activity-feed";
import { DeliverableReview } from "@/features/portal/components/review";
import { PortalProjectFiles, PortalProjectConversation } from "@/features/portal/components/portal-client";
import { DELIVERABLE_STATUSES, MILESTONE_STATUSES, PROJECT_STATUSES, REVISION_STATUSES, TASK_STATUSES } from "@/lib/status";
import { formatDate, formatDateTime } from "@/lib/format";
import { cn, formatBytes } from "@/lib/utils";

export default async function PortalProject({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const [{ id }, { tab = "overview" }] = await Promise.all([params, searchParams]);
  await requireClient();
  const sb = await createClient();
  const { data: project } = await sb.from("portal_projects").select("*").eq("id", id).maybeSingle();
  if (!project) notFound();

  const [milestones, tasks, deliverables, versions, reviews, revisions, files, activity, conversation] = await Promise.all([
    sb.from("portal_milestones").select("*").eq("project_id", id).order("sort_order"),
    sb.from("portal_tasks").select("*").eq("project_id", id).order("sort_order"),
    sb.from("portal_deliverables").select("*").eq("project_id", id).order("created_at", { ascending: false }),
    sb.from("portal_deliverable_versions").select("*").order("version", { ascending: false }),
    sb.from("portal_deliverable_reviews").select("*").order("created_at", { ascending: false }),
    sb.from("portal_revisions").select("*").eq("project_id", id).order("created_at", { ascending: false }),
    sb.from("portal_files").select("*").eq("project_id", id).order("created_at", { ascending: false }),
    sb.from("portal_activity").select("id, description, created_at").eq("project_id", id).order("created_at", { ascending: false }).limit(50),
    sb.from("conversations").select("id").eq("project_id", id).eq("is_internal", false).order("created_at").limit(1).maybeSingle(),
  ]);
  const pending = (deliverables.data ?? []).filter((d) => d.status === "submitted").length;
  const actions = (tasks.data ?? []).filter((t) => t.requires_client_action && t.status !== "done");
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Projects", href: "/portal/projects" }, { label: project.code! }]}
        title={project.name}
        meta={<StatusBadge status={project.status!} map={PROJECT_STATUSES} />}
        description={project.service_name ?? undefined}
      />
      <TabNav
        baseHref={`/portal/projects/${id}`}
        active={tab}
        tabs={[
          { key: "overview", label: "Overview" },
          { key: "deliverables", label: "Deliverables & approvals", count: pending || undefined },
          { key: "files", label: "Files", count: files.data?.length },
          { key: "messages", label: "Messages" },
          { key: "activity", label: "Activity" },
        ]}
      />

      {tab === "overview" ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          <div className="grid content-start gap-4">
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[13px] text-muted-foreground">Overall progress</p>
                    <p className="text-3xl font-semibold tracking-tight tabular">{project.progress}%</p>
                  </div>
                  <p className="text-right text-[13px] text-muted-foreground">
                    {formatDate(project.start_date)} → {formatDate(project.due_date)}
                  </p>
                </div>
                <Progress value={project.progress ?? 0} className="mt-4 h-2.5" />
              </CardContent>
            </Card>
            {actions.length ? (
              <Card className="border-warning/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TriangleExclamationPoint className="size-4 text-warning" /> Waiting on you
                  </CardTitle>
                </CardHeader>
                <ul className="divide-y border-t">
                  {actions.map((t) => (
                    <li key={t.id} className="px-5 py-3 text-[13.5px]">
                      <p className="font-medium">{t.title}</p>
                      {t.description ? <p className="text-[12.5px] text-muted-foreground">{t.description}</p> : null}
                      {t.due_date ? <p className={cn("text-[12px]", t.due_date < today ? "text-destructive" : "text-muted-foreground")}>Due {formatDate(t.due_date)}</p> : null}
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}
            <Card>
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                {milestones.data?.length ? (
                  <ol>
                    {milestones.data.map((m, i) => {
                      const mt = (tasks.data ?? []).filter((t) => t.milestone_id === m.id);
                      return (
                        <li key={m.id} className="relative flex gap-3 pb-5 last:pb-0">
                          {i < milestones.data.length - 1 ? <span className="absolute left-[7px] top-5 h-full w-px bg-border" /> : null}
                          <span className={cn("relative mt-1 size-[15px] shrink-0 rounded-full border-2", m.status === "completed" ? "border-success bg-success" : m.status === "in_progress" ? "border-primary bg-background" : "border-border bg-background")} />
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-[14px] font-medium">{m.title}</p>
                              <StatusBadge status={m.status!} map={MILESTONE_STATUSES} />
                            </div>
                            <p className="text-[12.5px] text-muted-foreground">{m.completed_at ? `Completed ${formatDate(m.completed_at)}` : `Target ${formatDate(m.due_date)}`}</p>
                            {mt.length ? (
                              <ul className="mt-2 grid gap-1 text-[13px]">
                                {mt.map((t) => (
                                  <li key={t.id} className="flex items-center gap-2">
                                    <span className={cn("size-1.5 rounded-full", t.status === "done" ? "bg-success" : "bg-border")} />
                                    <span className={cn(t.status === "done" && "text-muted-foreground")}>{t.title}</span>
                                    {t.status !== "done" && t.status !== "todo" ? <StatusBadge status={t.status!} map={TASK_STATUSES} /> : null}
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                ) : (
                  <EmptyState compact icon={CalendarDays} title="Timeline coming soon" description="Your project manager is finalising the plan." />
                )}
              </CardContent>
            </Card>
            {project.description || project.scope ? (
              <Card>
                <CardHeader>
                  <CardTitle>Scope of work</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 text-[14px] leading-relaxed">
                  {project.description ? <p className="whitespace-pre-line">{project.description}</p> : null}
                  {project.scope ? <p className="whitespace-pre-line text-muted-foreground">{project.scope}</p> : null}
                </CardContent>
              </Card>
            ) : null}
          </div>
          <div className="grid content-start gap-4">
            {project.project_manager_name ? (
              <Card>
                <CardHeader>
                  <CardTitle>Your project manager</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-3">
                  <UserAvatar name={project.project_manager_name} src={project.project_manager_avatar} className="size-10" />
                  <div className="min-w-0 text-[13px]">
                    <p className="font-medium">{project.project_manager_name}</p>
                    {project.project_manager_email ? (
                      <a href={`mailto:${project.project_manager_email}`} className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
                        <Mail className="size-3.5" /> {String(project.project_manager_email)}
                      </a>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ) : null}
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 text-[13px]">
                <Detail label="Reference" value={project.code} />
                <Detail label="Started" value={formatDate(project.start_date)} />
                <Detail label="Target delivery" value={formatDate(project.due_date)} />
                <Detail label="Pending approvals" value={String(pending)} />
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      {tab === "deliverables" ? (
        <div className="grid gap-4">
          {deliverables.data?.length ? (
            deliverables.data.map((d) => {
              const vs = (versions.data ?? []).filter((v) => v.deliverable_id === d.id);
              const rs = (reviews.data ?? []).filter((r) => r.deliverable_id === d.id);
              const latest = vs[0];
              return (
                <Card key={d.id} className={d.status === "submitted" ? "border-primary/40" : undefined}>
                  <CardHeader>
                    <div>
                      <CardTitle className="flex flex-wrap items-center gap-2">
                        {d.title} <StatusBadge status={d.status!} map={DELIVERABLE_STATUSES} />
                      </CardTitle>
                      <CardDescription>
                        Version {d.current_version}
                        {d.submitted_at ? ` · delivered ${formatDate(d.submitted_at)}` : ""}
                        {d.approved_at ? ` · approved ${formatDate(d.approved_at)}` : ""}
                      </CardDescription>
                    </div>
                    {d.status === "submitted" ? <DeliverableReview deliverableId={d.id!} title={d.title!} /> : null}
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div>
                      {d.description ? <p className="mb-3 text-[13.5px]">{d.description}</p> : null}
                      {latest ? (
                        <div className="rounded-lg border bg-surface p-3 text-[13px]">
                          <p className="mb-1 text-[12px] text-muted-foreground">Latest version (v{latest.version})</p>
                          {latest.file_id ? (
                            <div className="flex flex-wrap gap-3">
                              <a href={`/api/files/${latest.file_id}`} className="font-medium text-primary hover:underline">
                                Download {latest.file_name}
                              </a>
                              {latest.mime_type?.startsWith("image/") || latest.mime_type === "application/pdf" ? (
                                <a href={`/api/files/${latest.file_id}?inline=1`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
                                  Preview <ExternalLink className="size-3" />
                                </a>
                              ) : null}
                            </div>
                          ) : latest.external_url ? (
                            <a href={latest.external_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                              Open link <ExternalLink className="size-3" />
                            </a>
                          ) : null}
                          {latest.notes ? <p className="mt-2 whitespace-pre-line text-muted-foreground">{latest.notes}</p> : null}
                        </div>
                      ) : null}
                      {vs.length > 1 ? (
                        <details className="mt-3 text-[12.5px]">
                          <summary className="cursor-pointer text-muted-foreground">Version history ({vs.length})</summary>
                          <ul className="mt-2 grid gap-1">
                            {vs.map((v) => (
                              <li key={v.id} className="flex gap-2">
                                <Badge variant="outline">v{v.version}</Badge>
                                {v.file_id ? <a href={`/api/files/${v.file_id}`} className="hover:underline">{v.file_name}</a> : v.external_url ? <a href={v.external_url} className="hover:underline">Link</a> : null}
                                <span className="ml-auto text-muted-foreground">{formatDate(v.created_at)}</span>
                              </li>
                            ))}
                          </ul>
                        </details>
                      ) : null}
                    </div>
                    <div>
                      <p className="mb-2 text-[12px] font-medium uppercase tracking-wider text-muted-foreground">Review history</p>
                      {rs.length ? (
                        <ul className="grid gap-2 text-[13px]">
                          {rs.map((r) => (
                            <li key={r.id}>
                              <span className={r.decision === "approved" ? "text-success" : "text-destructive"}>{r.decision === "approved" ? "Approved" : "Changes requested"}</span>
                              <span className="text-muted-foreground"> · v{r.version} · {r.reviewer_name ?? "You"} · {formatDate(r.created_at)}</span>
                              {r.feedback ? <p className="whitespace-pre-line text-muted-foreground">“{r.feedback}”</p> : null}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[13px] text-muted-foreground">No reviews yet.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <EmptyState title="No deliverables yet" description="When the team shares work for review, it appears here for your approval." />
          )}
          {revisions.data?.length ? (
            <Card>
              <CardHeader>
                <CardTitle>Your revision requests</CardTitle>
              </CardHeader>
              <ul className="divide-y border-t">
                {revisions.data.map((r) => (
                  <li key={r.id} className="flex items-start justify-between gap-3 px-5 py-3 text-[13px]">
                    <div>
                      <p className="whitespace-pre-line">{r.description}</p>
                      <p className="text-[12px] text-muted-foreground">{formatDateTime(r.created_at)}</p>
                    </div>
                    <StatusBadge status={r.status!} map={REVISION_STATUSES} />
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>
      ) : null}

      {tab === "files" ? (
        <div className="grid gap-4">
          <PortalProjectFiles projectId={id} />
          <Card>
            {files.data?.length ? (
              <ul className="divide-y">
                {files.data.map((f) => (
                  <li key={f.id} className="flex flex-wrap items-center gap-3 px-5 py-2.5 text-[13px]">
                    <a href={`/api/files/${f.id}`} className="min-w-0 flex-1 truncate font-medium hover:underline">
                      {f.name}
                    </a>
                    <Badge variant="neutral" className="capitalize">{f.category === "brief" ? "Shared by you" : f.category}</Badge>
                    <span className="w-16 text-right text-muted-foreground">{formatBytes(Number(f.size_bytes))}</span>
                    <span className="w-24 text-right text-muted-foreground">{formatDate(f.created_at)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <CardContent className="pt-5">
                <EmptyState compact title="No files yet" />
              </CardContent>
            )}
          </Card>
        </div>
      ) : null}

      {tab === "messages" ? conversation.data ? <PortalProjectConversation projectId={id} conversationId={conversation.data.id} /> : <EmptyState title="Messaging isn't set up for this project yet" /> : null}

      {tab === "activity" ? (
        <Card>
          <CardContent className="pt-5">
            <ActivityFeed items={(activity.data ?? []).map((a) => ({ id: a.id!, description: a.description!, created_at: a.created_at!, actor: "" }))} />
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value ?? "—"}</span>
    </div>
  );
}
