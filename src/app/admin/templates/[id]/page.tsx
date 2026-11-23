import { notFound } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import { requireTeam } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormDialog } from "@/components/shared/form-dialog";
import { ConfirmAction } from "@/components/shared/confirm-action";
import { EmptyState } from "@/components/shared/empty-state";
import { RemoveButton, TemplateForm, TemplateMilestoneForm, TemplateTaskForm } from "@/features/templates/components/template-forms";
import { deleteTemplate } from "@/features/templates/actions";
import { getServiceOptions } from "@/features/settings/queries";
import { ROLE_LABELS, type TeamRole } from "@/lib/permissions";

export default async function TemplateDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireTeam("templates.manage");
  const sb = await createClient();
  const [{ data: tpl }, services] = await Promise.all([
    sb.from("project_templates").select("*, project_template_milestones(*), project_template_tasks(*)").eq("id", id).maybeSingle(),
    getServiceOptions(ctx.organizationId),
  ]);
  if (!tpl) notFound();
  const milestones = [...tpl.project_template_milestones].sort((a, b) => a.sort_order - b.sort_order);
  const tasks = [...tpl.project_template_tasks].sort((a, b) => a.sort_order - b.sort_order);
  const totalDays = milestones.reduce((m, x) => Math.max(m, x.offset_days + x.duration_days), 0);
  const totalHours = tasks.reduce((s, t) => s + Number(t.estimated_hours ?? 0), 0);
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Templates", href: "/admin/templates" }, { label: tpl.name }]}
        title={tpl.name}
        description={`${milestones.length} milestones · ${tasks.length} tasks · ~${totalDays} days · ${totalHours}h estimated`}
        actions={
          <>
            <FormDialog title="Edit template" trigger={<Button variant="outline" size="sm"><Pencil /> Edit</Button>}>
              <TemplateForm services={services.map((s) => ({ id: s.id, name: s.name }))} template={{ id: tpl.id, name: tpl.name, description: tpl.description ?? "", service_id: tpl.service_id ?? "", is_active: tpl.is_active }} />
            </FormDialog>
            <ConfirmAction trigger={<Button variant="ghost" size="sm">Delete</Button>} title="Delete this template?" description="Existing projects are not affected." destructive confirmLabel="Delete" action={deleteTemplate.bind(null, tpl.id)} />
            <FormDialog title="Add milestone" trigger={<Button size="sm"><Plus /> Milestone</Button>}>
              <TemplateMilestoneForm templateId={tpl.id} />
            </FormDialog>
          </>
        }
      />
      {milestones.length ? (
        <div className="grid gap-3">
          {milestones.map((m, i) => {
            const mt = tasks.filter((t) => t.milestone_id === m.id);
            return (
              <Card key={m.id}>
                <CardHeader>
                  <div>
                    <CardTitle>
                      <span className="mr-2 font-mono text-[12px] text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                      {m.title}
                    </CardTitle>
                    <CardDescription>
                      Day {m.offset_days} → {m.offset_days + m.duration_days} · weight {m.weight}
                      {!m.is_client_visible ? " · internal" : ""}
                    </CardDescription>
                  </div>
                  <div className="flex items-center">
                    <FormDialog title="Edit milestone" trigger={<Button variant="ghost" size="icon-sm" aria-label="Edit milestone"><Pencil /></Button>}>
                      <TemplateMilestoneForm templateId={tpl.id} milestone={{ id: m.id, template_id: tpl.id, title: m.title, description: m.description ?? "", offset_days: m.offset_days, duration_days: m.duration_days, weight: m.weight, is_client_visible: m.is_client_visible }} />
                    </FormDialog>
                    <RemoveButton kind="milestone" id={m.id} templateId={tpl.id} />
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="grid gap-1">
                    {mt.map((t) => (
                      <li key={t.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] hover:bg-accent/40">
                        <span className="flex-1">{t.title}</span>
                        {t.requires_client_action ? <Badge variant="warning">Client action</Badge> : null}
                        {t.is_client_visible ? <Badge variant="info">Visible</Badge> : null}
                        {t.default_role ? <Badge variant="outline">{ROLE_LABELS[t.default_role as TeamRole] ?? t.default_role}</Badge> : null}
                        <span className="w-12 text-right text-[12px] text-muted-foreground">{t.estimated_hours ? `${t.estimated_hours}h` : ""}</span>
                        <RemoveButton kind="task" id={t.id} templateId={tpl.id} />
                      </li>
                    ))}
                  </ul>
                  <FormDialog title={`Add task to ${m.title}`} trigger={<Button variant="ghost" size="sm" className="mt-1"><Plus /> Task</Button>}>
                    <TemplateTaskForm templateId={tpl.id} milestoneId={m.id} />
                  </FormDialog>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No milestones" description="Add milestones, then tasks within them." />
      )}
    </>
  );
}
