import Link from "next/link";
import { endOfMonth, format, parse, startOfMonth, isValid } from "date-fns";
import { CalendarDays, FolderKanban, Kanban, Plus, Table2 } from "lucide-react";
import { requireTeam } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ProjectBoard, ProjectTable } from "@/features/projects/components/project-views";
import { ProjectCalendar, type CalendarEvent } from "@/features/projects/components/project-calendar";
import { cn } from "@/lib/utils";

export const metadata = { title: "Projects" };

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ view?: string; month?: string; scope?: string }> }) {
  const ctx = await requireTeam();
  const { view = "list", month, scope } = await searchParams;
  const sb = await createClient();
  let q = sb
    .from("projects")
    .select("id, code, name, status, priority, progress, due_date, client:clients(name), service:services(name), manager:profiles!projects_project_manager_id_fkey(full_name), project_members(profile_id)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (scope === "mine") q = q.or(`project_manager_id.eq.${ctx.userId}`);
  const { data } = await q;
  const rows = (data ?? [])
    .filter((p) => scope !== "mine" || true)
    .map((p) => ({
      id: p.id, code: p.code, name: p.name, client: p.client?.name ?? "—", status: p.status, priority: p.priority, progress: p.progress,
      due_date: p.due_date, manager: p.manager?.full_name ?? null, service: p.service?.name ?? null,
    }));

  let calendar: { month: Date; events: CalendarEvent[] } | null = null;
  if (view === "calendar") {
    const m = month ? parse(month, "yyyy-MM", new Date()) : new Date();
    const current = isValid(m) ? m : new Date();
    const from = format(startOfMonth(current), "yyyy-MM-dd");
    const to = format(endOfMonth(current), "yyyy-MM-dd");
    const [milestones, tasks] = await Promise.all([
      sb.from("milestones").select("id, title, due_date, project_id, projects(name)").gte("due_date", from).lte("due_date", to),
      sb.from("tasks").select("id, title, due_date, project_id").is("deleted_at", null).neq("status", "done").gte("due_date", from).lte("due_date", to),
    ]);
    calendar = {
      month: current,
      events: [
        ...rows.filter((p) => p.due_date && p.due_date >= from && p.due_date <= to).map((p) => ({ id: p.id, date: p.due_date!, title: `⚑ ${p.name}`, href: `/admin/projects/${p.id}`, kind: "deadline" as const })),
        ...(milestones.data ?? []).map((m) => ({ id: m.id, date: m.due_date!, title: `${m.title} · ${m.projects?.name ?? ""}`, href: `/admin/projects/${m.project_id}?tab=milestones`, kind: "milestone" as const })),
        ...(tasks.data ?? []).map((t) => ({ id: t.id, date: t.due_date!, title: t.title, href: `/admin/projects/${t.project_id}?task=${t.id}`, kind: "task" as const })),
      ],
    };
  }

  const views = [
    { key: "list", label: "List", icon: Table2 },
    { key: "board", label: "Board", icon: Kanban },
    { key: "calendar", label: "Calendar", icon: CalendarDays },
  ];
  return (
    <>
      <PageHeader
        title="Projects"
        description={ctx.can("projects.view_all") ? "Every project across the agency." : "Projects you manage or are a member of."}
        actions={
          <>
            <div className="flex rounded-md border p-0.5">
              {views.map((v) => (
                <Link key={v.key} href={`/admin/projects?view=${v.key}`} className={cn("flex h-7 items-center gap-1.5 rounded px-2.5 text-[12.5px] text-muted-foreground", view === v.key && "bg-accent text-foreground")}>
                  <v.icon className="size-3.5" />
                  {v.label}
                </Link>
              ))}
            </div>
            {ctx.can("projects.manage") ? (
              <Button size="sm" asChild>
                <Link href="/admin/projects/new">
                  <Plus /> New project
                </Link>
              </Button>
            ) : null}
          </>
        }
      />
      {rows.length === 0 && view !== "calendar" ? (
        <EmptyState icon={FolderKanban} title="No projects yet" description="Create a project from scratch, from a template, or by converting a lead or an accepted proposal." />
      ) : view === "board" ? (
        <ProjectBoard rows={rows} canMove={ctx.can("projects.manage")} />
      ) : view === "calendar" && calendar ? (
        <ProjectCalendar month={calendar.month} events={calendar.events} baseHref="/admin/projects?view=calendar" />
      ) : (
        <ProjectTable rows={rows} />
      )}
    </>
  );
}
