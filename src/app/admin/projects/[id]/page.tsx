import Link from "next/link";
import { notFound } from "next/navigation";
import { Archive, CalendarRange, Clock, ExternalLink, Pencil, Plus } from "lucide-react";
import { requireTeam } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { TabNav } from "@/components/shared/tab-nav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { UserAvatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { FormDialog } from "@/components/shared/form-dialog";
import { ConfirmAction } from "@/components/shared/confirm-action";
import { ActivityFeed } from "@/components/shared/activity-feed";
import { ProjectForm } from "@/features/projects/components/project-form";
import {
  ApplyTemplateButton, DeleteTimeButton, DeliverableForm, FileRowActions, MembersEditor, MilestoneControls, MilestoneForm, NewVersionForm,
  ProjectFileUploader, ProjectStatusSelect, RevisionStatusSelect, SubmitDeliverableButton, TaskCheck, TaskForm, TaskLink, TaskSheet, TaskStatusSelect, TimeEntryForm,
  type TaskDetail,
} from "@/features/projects/components/workspace";
import { ProjectConversation } from "@/features/projects/components/project-conversation";
import { archiveProject } from "@/features/projects/actions";
import { getClientOptions, getCurrency, getServiceOptions, getTeamDirectory, getTemplateOptions } from "@/features/settings/queries";
import { DELIVERABLE_STATUSES, MILESTONE_STATUSES, PRIORITIES, PROJECT_STATUSES, REVISION_STATUSES, TASK_STATUSES } from "@/lib/status";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { minorToInput } from "@/lib/finance/money";
import { cn, formatBytes } from "@/lib/utils";

export default async function ProjectWorkspace({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string; task?: string }> }) {
  const [{ id }, { tab = "overview", task: taskId }] = await Promise.all([params, searchParams]);
  const ctx = await requireTeam();
  const sb = await createClient();
  const { data: project } = await sb
    .from("projects")
    .select("*, client:clients(id, name), service:services(name), manager:profiles!projects_project_manager_id_fkey(id, full_name, avatar_url), project_members(profile_id, role, profile:profiles!project_members_profile_id_fkey(full_name, avatar_url))")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!project) notFound();

  const canManage = ctx.can("projects.manage") || project.project_manager_id === ctx.userId;
  const showMoney = ctx.can("finance.view");
  const canSeeBudget = showMoney || ctx.can("projects.manage");
  const { data: money } = canSeeBudget ? await sb.from("project_finances").select("budget_cents, contract_value_cents").eq("project_id", id).maybeSingle() : { data: null };
  const [currency, team, templates, milestones, tasks, deliverables, revisions, files, time, activity, conversations, clients, services, finance] = await Promise.all([
    getCurrency(ctx.organizationId),
    getTeamDirectory(ctx.organizationId),
    getTemplateOptions(ctx.organizationId),
    sb.from("milestones").select("*").eq("project_id", id).order("sort_order"),
    sb.from("tasks").select("id, title, status, priority, due_date, milestone_id, parent_task_id, estimated_hours, is_client_visible, requires_client_action, assignee_id, assignee:profiles!tasks_assignee_id_fkey(full_name)").eq("project_id", id).is("deleted_at", null).order("sort_order"),
    sb.from("deliverables").select("*, deliverable_versions(id, version, notes, external_url, created_at, file:files(id, name, size_bytes)), deliverable_reviews(id, version, decision, feedback, created_at, reviewer:profiles!deliverable_reviews_reviewer_id_fkey(full_name))").eq("project_id", id).order("created_at", { ascending: false }),
    sb.from("revisions").select("*, requester:profiles!revisions_requested_by_fkey(full_name), deliverable:deliverables(title)").eq("project_id", id).order("created_at", { ascending: false }),
    sb.from("files").select("id, name, size_bytes, mime_type, category, visibility, created_at, uploaded_by, uploader:profiles!files_uploaded_by_fkey(full_name)").eq("project_id", id).is("deleted_at", null).order("created_at", { ascending: false }),
    sb.from("time_entries").select("id, minutes, entry_date, description, billable, profile_id, person:profiles!time_entries_profile_id_fkey(full_name), task:tasks(title)").eq("project_id", id).order("entry_date", { ascending: false }).limit(100),
    sb.from("activity_logs").select("id, description, created_at, actor:profiles!activity_logs_actor_id_fkey(full_name)").eq("project_id", id).order("created_at", { ascending: false }).limit(60),
    sb.from("conversations").select("id, subject, is_internal").eq("project_id", id).order("created_at"),
    ctx.can("projects.manage") ? getClientOptions(ctx.organizationId) : Promise.resolve([{ id: project.client_id, name: project.client?.name ?? "" }]),
    getServiceOptions(ctx.organizationId),
    showMoney ? sb.rpc("report_project_profitability", { p_org: ctx.organizationId }) : Promise.resolve({ data: [] as never[] }),
  ]);

  const allTasks = tasks.data ?? [];
  const topTasks = allTasks.filter((t) => !t.parent_task_id);
  const doneTasks = topTasks.filter((t) => t.status === "done").length;
  const msOptions = (milestones.data ?? []).map((m) => ({ id: m.id, name: m.title }));
  const teamOptions = team.map((t) => ({ id: t.id, name: t.name }));
  const memberIds = (project.project_members ?? []).map((m) => m.profile_id);
  const projectTeam = teamOptions.filter((t) => memberIds.includes(t.id) || t.id === project.project_manager_id);
  const fin = (finance.data ?? []).find((f) => f.project_id === id);
  const today = new Date().toISOString().slice(0, 10);
  const openRevisions = (revisions.data ?? []).filter((r) => r.status !== "resolved").length;
  const totalMinutes = (time.data ?? []).reduce((s, t) => s + t.minutes, 0);

  let taskDetail: TaskDetail | null = null;
  if (taskId) {
    const t = allTasks.find((x) => x.id === taskId);
    if (t) {
      const [{ data: comments }, { data: full }] = await Promise.all([
        sb.from("task_comments").select("id, body, created_at, author:profiles!task_comments_author_id_fkey(full_name)").eq("task_id", taskId).order("created_at"),
        sb.from("tasks").select("description").eq("id", taskId).maybeSingle(),
      ]);
      taskDetail = {
        id: t.id, title: t.title, description: full?.description ?? null, status: t.status, priority: t.priority, due_date: t.due_date,
        estimated_hours: t.estimated_hours, assignee_id: t.assignee_id, assignee: t.assignee?.full_name ?? null, milestone_id: t.milestone_id,
        is_client_visible: t.is_client_visible, requires_client_action: t.requires_client_action,
        comments: (comments ?? []).map((c) => ({ id: c.id, body: c.body, created_at: c.created_at, author: c.author?.full_name ?? "Someone" })),
        subtasks: allTasks.filter((s) => s.parent_task_id === t.id).map((s) => ({ id: s.id, title: s.title, status: s.status, assignee: s.assignee?.full_name ?? null })),
      };
    }
  }

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "tasks", label: "Tasks", count: topTasks.length - doneTasks },
    { key: "milestones", label: "Milestones", count: milestones.data?.length },
    { key: "deliverables", label: "Deliverables", count: openRevisions || undefined },
    { key: "files", label: "Files", count: files.data?.length },
    { key: "messages", label: "Messages" },
    { key: "time", label: "Time" },
    { key: "activity", label: "Activity" },
  ];

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Projects", href: "/admin/projects" }, { label: project.code }]}
        title={project.name}
        meta={
          <>
            <StatusBadge status={project.status} map={PROJECT_STATUSES} />
            <StatusBadge status={project.priority} map={PRIORITIES} dot={false} />
          </>
        }
        description={
          <>
            <Link href={`/admin/clients/${project.client?.id}`} className="hover:text-foreground hover:underline">
              {project.client?.name}
            </Link>
            {project.service?.name ? ` · ${project.service.name}` : ""} · {project.code}
          </>
        }
        actions={
          <>
            <ProjectStatusSelect id={project.id} status={project.status} disabled={!canManage} />
            {canManage ? <MembersEditor projectId={project.id} team={teamOptions} selected={memberIds} /> : null}
            {canManage ? (
              <FormDialog size="lg" title="Edit project" trigger={<Button variant="outline" size="sm"><Pencil /> Edit</Button>}>
                <ProjectForm
                  currency={currency}
                  clients={clients}
                  services={services.map((s) => ({ id: s.id, name: s.name }))}
                  templates={templates}
                  team={teamOptions}
                  canSeeMoney={canSeeBudget}
                  project={{
                    id: project.id, name: project.name, client_id: project.client_id, service_id: project.service_id ?? "", description: project.description ?? "",
                    scope: project.scope ?? "", budget: minorToInput(money?.budget_cents, currency), contract_value: minorToInput(money?.contract_value_cents, currency),
                    start_date: project.start_date ?? "", due_date: project.due_date ?? "", priority: project.priority, status: project.status,
                    project_manager_id: project.project_manager_id ?? "", internal_notes: project.internal_notes ?? "", progress_mode: project.progress_mode as "milestones",
                    progress: project.progress,
                  }}
                />
              </FormDialog>
            ) : null}
            {ctx.can("projects.manage") ? (
              <ConfirmAction
                trigger={<Button variant="ghost" size="icon-sm" aria-label="Archive project"><Archive /></Button>}
                title="Archive this project?"
                description="It disappears from lists and the client portal. Data is kept."
                destructive
                confirmLabel="Archive"
                action={archiveProject.bind(null, project.id)}
              />
            ) : null}
          </>
        }
      />

      <TabNav tabs={tabs} active={tab} baseHref={`/admin/projects/${project.id}`} />

      {tab === "overview" ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="grid content-start gap-4">
            <div className="grid gap-3 sm:grid-cols-4">
              <StatCard label="Progress" value={`${project.progress}%`} hint={project.progress_mode === "milestones" ? "From milestones" : "Manual"} />
              <StatCard label="Tasks done" value={`${doneTasks}/${topTasks.length}`} />
              <StatCard label="Deadline" value={formatDate(project.due_date, "d MMM")} tone={project.due_date && project.due_date < today && project.status !== "completed" ? "negative" : "default"} hint={project.due_date && project.due_date < today && project.status !== "completed" ? "Overdue" : project.start_date ? `Started ${formatDate(project.start_date, "d MMM")}` : undefined} />
              <StatCard label="Open revisions" value={openRevisions} tone={openRevisions ? "warning" : "default"} />
            </div>
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Timeline</CardTitle>
                  <CardDescription>Milestones and their status</CardDescription>
                </div>
                {canManage && !(milestones.data ?? []).length ? <ApplyTemplateButton projectId={project.id} templates={templates} startDate={project.start_date} /> : null}
              </CardHeader>
              <CardContent>
                <Progress value={project.progress} className="mb-5 h-2" />
                {milestones.data?.length ? (
                  <ol className="grid gap-0">
                    {milestones.data.map((m, i) => (
                      <li key={m.id} className="relative flex gap-3 pb-4 last:pb-0">
                        {i < milestones.data.length - 1 ? <span className="absolute left-[7px] top-5 h-full w-px bg-border" /> : null}
                        <span className={cn("relative mt-1 size-[15px] shrink-0 rounded-full border-2", m.status === "completed" ? "border-success bg-success" : m.status === "in_progress" ? "border-primary bg-background" : "border-border bg-background")} />
                        <div className="flex flex-1 flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className={cn("text-[13.5px] font-medium", m.status === "completed" && "text-muted-foreground")}>{m.title}</p>
                            <p className="text-[12px] text-muted-foreground">
                              {formatDate(m.start_date, "d MMM")} – {formatDate(m.due_date, "d MMM")}
                              {!m.is_client_visible ? " · internal" : ""}
                            </p>
                          </div>
                          <StatusBadge status={m.status} map={MILESTONE_STATUSES} />
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <EmptyState compact title="No milestones yet" description="Apply a template or add milestones manually." />
                )}
              </CardContent>
            </Card>
            {project.description || project.scope ? (
              <Card>
                <CardHeader>
                  <CardTitle>Brief & scope</CardTitle>
                  <Badge variant="info">Client-visible</Badge>
                </CardHeader>
                <CardContent className="grid gap-3 text-[13.5px]">
                  {project.description ? <p className="whitespace-pre-line">{project.description}</p> : null}
                  {project.scope ? <p className="whitespace-pre-line text-muted-foreground">{project.scope}</p> : null}
                </CardContent>
              </Card>
            ) : null}
          </div>
          <div className="grid content-start gap-4">
            <Card>
              <CardHeader>
                <CardTitle>People</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 text-[13px]">
                {project.manager ? (
                  <div className="flex items-center gap-2.5">
                    <UserAvatar name={project.manager.full_name} src={project.manager.avatar_url} className="size-7" />
                    <div>
                      <p className="font-medium">{project.manager.full_name}</p>
                      <p className="text-[12px] text-muted-foreground">Project manager</p>
                    </div>
                  </div>
                ) : null}
                {(project.project_members ?? []).map((m) => (
                  <div key={m.profile_id} className="flex items-center gap-2.5">
                    <UserAvatar name={m.profile?.full_name} src={m.profile?.avatar_url} className="size-7" />
                    <div>
                      <p className="font-medium">{m.profile?.full_name}</p>
                      <p className="text-[12px] text-muted-foreground">{m.role ?? "Member"}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            {showMoney ? (
              <Card>
                <CardHeader>
                  <CardTitle>Financials</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2 text-[13px]">
                  <Row label="Budget" value={money?.budget_cents ? formatMoney(money.budget_cents, currency) : "—"} />
                  <Row label="Contract value" value={money?.contract_value_cents ? formatMoney(money.contract_value_cents, currency) : "—"} />
                  <Row label="Invoiced" value={formatMoney(fin?.invoiced_cents ?? 0, currency)} />
                  <Row label="Collected" value={formatMoney(fin?.collected_cents ?? 0, currency)} />
                  <Row label="Expenses" value={formatMoney(fin?.expenses_cents ?? 0, currency)} />
                  <Row label="Labour cost" value={formatMoney(fin?.labor_cost_cents ?? 0, currency)} />
                  <div className="mt-1 border-t pt-2">
                    <Row label="Profit to date" value={<span className={(fin?.profit_cents ?? 0) >= 0 ? "text-success" : "text-destructive"}>{formatMoney(fin?.profit_cents ?? 0, currency)}</span>} />
                  </div>
                  {ctx.can("finance.manage") ? (
                    <Link href={`/admin/finance/invoices/new?client=${project.client_id}&project=${project.id}`} className="mt-1 text-[12.5px] text-primary hover:underline">
                      Create invoice →
                    </Link>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}
            {project.internal_notes ? (
              <Card>
                <CardHeader>
                  <CardTitle>Internal notes</CardTitle>
                  <Badge variant="neutral">Team only</Badge>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line text-[13px] text-muted-foreground">{project.internal_notes}</p>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      ) : null}

      {tab === "tasks" ? (
        <div className="grid gap-4">
          <div className="flex justify-end gap-2">
            <FormDialog size="lg" title="New task" trigger={<Button size="sm"><Plus /> New task</Button>}>
              <TaskForm projectId={project.id} milestones={msOptions} team={projectTeam.length ? projectTeam : teamOptions} />
            </FormDialog>
          </div>
          {topTasks.length === 0 ? (
            <EmptyState title="No tasks yet" description="Add tasks or apply a template." />
          ) : (
            [...(milestones.data ?? []).map((m) => ({ id: m.id, title: m.title })), { id: null as string | null, title: "Other tasks" }].map((group) => {
              const list = topTasks.filter((t) => t.milestone_id === group.id);
              if (!list.length) return null;
              return (
                <Card key={group.id ?? "none"}>
                  <CardHeader className="pb-2">
                    <CardTitle>{group.title}</CardTitle>
                    <span className="text-[12px] text-muted-foreground tabular">
                      {list.filter((t) => t.status === "done").length}/{list.length}
                    </span>
                  </CardHeader>
                  <ul className="divide-y border-t">
                    {list.map((t) => {
                      const subs = allTasks.filter((s) => s.parent_task_id === t.id);
                      return (
                        <li key={t.id} className="flex flex-wrap items-center gap-3 px-5 py-2.5 text-[13.5px]">
                          <TaskCheck id={t.id} done={t.status === "done"} />
                          <TaskLink id={t.id} className={cn("min-w-0 flex-1 truncate hover:underline", t.status === "done" && "text-muted-foreground line-through")}>
                            {t.title}
                          </TaskLink>
                          {subs.length ? <span className="text-[12px] text-muted-foreground tabular">{subs.filter((s) => s.status === "done").length}/{subs.length} subtasks</span> : null}
                          {t.requires_client_action ? <Badge variant="warning">Client action</Badge> : null}
                          {t.is_client_visible ? <Badge variant="info" className="hidden sm:inline-flex">Visible</Badge> : null}
                          <span className={cn("w-16 text-right text-[12px] tabular", t.due_date && t.due_date < today && t.status !== "done" ? "text-destructive" : "text-muted-foreground")}>
                            {t.due_date ? formatDate(t.due_date, "d MMM") : ""}
                          </span>
                          <span className="hidden w-28 truncate text-[12px] text-muted-foreground md:inline">{t.assignee?.full_name ?? "Unassigned"}</span>
                          <TaskStatusSelect id={t.id} status={t.status} />
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              );
            })
          )}
        </div>
      ) : null}

      {tab === "milestones" ? (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Milestones</CardTitle>
              <CardDescription>Milestones complete automatically when all their tasks are done, and drive project progress.</CardDescription>
            </div>
            {canManage ? (
              <div className="flex gap-2">
                <ApplyTemplateButton projectId={project.id} templates={templates} startDate={project.start_date} />
                <FormDialog title="New milestone" trigger={<Button size="sm"><Plus /> Milestone</Button>}>
                  <MilestoneForm projectId={project.id} />
                </FormDialog>
              </div>
            ) : null}
          </CardHeader>
          {milestones.data?.length ? (
            <ul className="divide-y border-t">
              {milestones.data.map((m) => {
                const mt = topTasks.filter((t) => t.milestone_id === m.id);
                return (
                  <li key={m.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-[13.5px]">
                    <MilestoneControls
                      projectId={project.id}
                      canManage={canManage}
                      m={{ id: m.id, project_id: project.id, title: m.title, description: m.description ?? "", start_date: m.start_date ?? "", due_date: m.due_date ?? "", weight: m.weight, is_client_visible: m.is_client_visible, status: m.status }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{m.title}</p>
                      <p className="text-[12px] text-muted-foreground">
                        {formatDate(m.due_date)} · weight {m.weight} · {mt.filter((t) => t.status === "done").length}/{mt.length} tasks{m.is_client_visible ? "" : " · internal"}
                      </p>
                    </div>
                    {m.completed_at ? <span className="text-[12px] text-muted-foreground">Completed {formatDate(m.completed_at)}</span> : null}
                    <StatusBadge status={m.status} map={MILESTONE_STATUSES} />
                  </li>
                );
              })}
            </ul>
          ) : (
            <CardContent>
              <EmptyState compact icon={CalendarRange} title="No milestones" />
            </CardContent>
          )}
        </Card>
      ) : null}

      {tab === "deliverables" ? (
        <div className="grid gap-4">
          <div className="flex justify-end">
            <FormDialog title="New deliverable" trigger={<Button size="sm"><Plus /> Deliverable</Button>}>
              <DeliverableForm projectId={project.id} milestones={msOptions} />
            </FormDialog>
          </div>
          {(revisions.data ?? []).some((r) => r.status !== "resolved") ? (
            <Card className="border-warning/40">
              <CardHeader>
                <CardTitle>Revision requests</CardTitle>
              </CardHeader>
              <ul className="divide-y border-t">
                {(revisions.data ?? []).filter((r) => r.status !== "resolved").map((r) => (
                  <li key={r.id} className="flex flex-wrap items-start gap-3 px-5 py-3 text-[13.5px]">
                    <div className="min-w-0 flex-1">
                      <p className="whitespace-pre-line">{r.description}</p>
                      <p className="mt-1 text-[12px] text-muted-foreground">
                        {r.deliverable?.title} · {r.requester?.full_name ?? "Client"} · {formatDateTime(r.created_at)}
                      </p>
                    </div>
                    <StatusBadge status={r.status} map={REVISION_STATUSES} />
                    <RevisionStatusSelect id={r.id} status={r.status} />
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
          {deliverables.data?.length ? (
            deliverables.data.map((d) => {
              const versions = [...(d.deliverable_versions ?? [])].sort((a, b) => b.version - a.version);
              const reviews = [...(d.deliverable_reviews ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at));
              return (
                <Card key={d.id}>
                  <CardHeader>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {d.title} <StatusBadge status={d.status} map={DELIVERABLE_STATUSES} />
                      </CardTitle>
                      <CardDescription>
                        {d.current_version ? `Version ${d.current_version}` : "No versions yet"}
                        {d.due_date ? ` · due ${formatDate(d.due_date)}` : ""}
                        {d.approved_at ? ` · approved ${formatDate(d.approved_at)}` : ""}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {d.current_version > 0 && (d.status === "draft" || d.status === "changes_requested") ? <SubmitDeliverableButton id={d.id} /> : null}
                      <FormDialog title={`New version of ${d.title}`} trigger={<Button size="sm"><Plus /> Version</Button>}>
                        <NewVersionForm deliverableId={d.id} projectId={project.id} />
                      </FormDialog>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="mb-2 text-[12px] font-medium uppercase tracking-wider text-muted-foreground">Versions</p>
                      {versions.length ? (
                        <ul className="grid gap-2 text-[13px]">
                          {versions.map((v) => (
                            <li key={v.id} className="flex items-center gap-2">
                              <Badge variant="outline">v{v.version}</Badge>
                              {v.file ? (
                                <a href={`/api/files/${v.file.id}`} className="truncate hover:underline">
                                  {v.file.name}
                                </a>
                              ) : v.external_url ? (
                                <a href={v.external_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 truncate hover:underline">
                                  {v.external_url.replace(/^https?:\/\//, "").slice(0, 40)} <ExternalLink className="size-3" />
                                </a>
                              ) : null}
                              <span className="ml-auto text-[12px] text-muted-foreground">{formatDate(v.created_at)}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[13px] text-muted-foreground">Upload a file or add a link.</p>
                      )}
                    </div>
                    <div>
                      <p className="mb-2 text-[12px] font-medium uppercase tracking-wider text-muted-foreground">Client feedback</p>
                      {reviews.length ? (
                        <ul className="grid gap-2 text-[13px]">
                          {reviews.map((r) => (
                            <li key={r.id}>
                              <span className={r.decision === "approved" ? "text-success" : "text-destructive"}>{r.decision === "approved" ? "Approved" : "Changes requested"}</span>
                              <span className="text-muted-foreground"> · v{r.version} · {r.reviewer?.full_name ?? "Client"} · {formatDate(r.created_at)}</span>
                              {r.feedback ? <p className="mt-0.5 whitespace-pre-line text-muted-foreground">“{r.feedback}”</p> : null}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[13px] text-muted-foreground">No feedback yet.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <EmptyState title="No deliverables yet" description="Create a deliverable, upload a version and submit it — the client approves or requests changes from their portal." />
          )}
        </div>
      ) : null}

      {tab === "files" ? (
        <div className="grid gap-4">
          <ProjectFileUploader projectId={project.id} />
          <Card>
            {files.data?.length ? (
              <ul className="divide-y">
                {files.data.map((f) => (
                  <li key={f.id} className="flex flex-wrap items-center gap-3 px-5 py-2.5 text-[13px]">
                    <a href={`/api/files/${f.id}`} className="min-w-0 flex-1 truncate font-medium hover:underline">
                      {f.name}
                    </a>
                    <Badge variant="neutral" className="capitalize">{f.category}</Badge>
                    <Badge variant={f.visibility === "client" ? "info" : "outline"}>{f.visibility === "client" ? "Shared" : "Internal"}</Badge>
                    <span className="w-16 text-right text-muted-foreground">{formatBytes(f.size_bytes)}</span>
                    <span className="hidden w-40 truncate text-right text-muted-foreground md:inline">
                      {f.uploader?.full_name ?? ""} · {formatDate(f.created_at, "d MMM")}
                    </span>
                    <FileRowActions id={f.id} visibility={f.visibility} canDelete={canManage || f.uploaded_by === ctx.userId} />
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

      {tab === "messages" ? <ProjectConversation projectId={project.id} conversations={conversations.data ?? []} /> : null}

      {tab === "time" ? (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Time tracking</CardTitle>
              <CardDescription>{(totalMinutes / 60).toFixed(1)} hours logged</CardDescription>
            </div>
            <FormDialog title="Log time" trigger={<Button size="sm"><Clock /> Log time</Button>}>
              <TimeEntryForm projectId={project.id} tasks={topTasks.map((t) => ({ id: t.id, name: t.title }))} />
            </FormDialog>
          </CardHeader>
          {time.data?.length ? (
            <ul className="divide-y border-t">
              {time.data.map((t) => (
                <li key={t.id} className="flex items-center gap-3 px-5 py-2.5 text-[13px]">
                  <span className="w-24 text-muted-foreground">{formatDate(t.entry_date, "d MMM")}</span>
                  <span className="w-32 truncate">{t.person?.full_name}</span>
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">{[t.task?.title, t.description].filter(Boolean).join(" — ") || "General"}</span>
                  {!t.billable ? <Badge variant="neutral">Non-billable</Badge> : null}
                  <span className="w-14 text-right font-medium tabular">{(t.minutes / 60).toFixed(2)}h</span>
                  {t.profile_id === ctx.userId || canManage ? <DeleteTimeButton id={t.id} projectId={project.id} /> : <span className="w-8" />}
                </li>
              ))}
            </ul>
          ) : (
            <CardContent>
              <EmptyState compact title="No time logged" />
            </CardContent>
          )}
        </Card>
      ) : null}

      {tab === "activity" ? (
        <Card>
          <CardContent className="pt-5">
            <ActivityFeed items={(activity.data ?? []).map((a) => ({ id: a.id, description: a.description, created_at: a.created_at, actor: a.actor?.full_name }))} />
          </CardContent>
        </Card>
      ) : null}

      {taskDetail ? <TaskSheet task={taskDetail} projectId={project.id} milestones={msOptions} team={projectTeam.length ? projectTeam : teamOptions} canDelete={canManage} /> : null}
    </>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular">{value}</span>
    </div>
  );
}
