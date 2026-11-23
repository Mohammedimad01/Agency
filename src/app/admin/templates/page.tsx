import Link from "next/link";
import { LayoutTemplate, Plus } from "lucide-react";
import { requireTeam } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { FormDialog } from "@/components/shared/form-dialog";
import { TemplateForm } from "@/features/templates/components/template-forms";
import { getServiceOptions } from "@/features/settings/queries";

export const metadata = { title: "Templates" };

export default async function TemplatesPage() {
  const ctx = await requireTeam("templates.manage");
  const sb = await createClient();
  const [{ data }, services] = await Promise.all([
    sb.from("project_templates").select("id, name, description, is_active, service:services(name), project_template_milestones(id), project_template_tasks(id)").eq("organization_id", ctx.organizationId).order("name"),
    getServiceOptions(ctx.organizationId),
  ]);
  return (
    <>
      <PageHeader
        title="Project templates"
        description="Reusable delivery plans. Choosing a template when creating a project generates its milestones and tasks."
        actions={
          <FormDialog title="New template" trigger={<Button size="sm"><Plus /> New template</Button>}>
            <TemplateForm services={services.map((s) => ({ id: s.id, name: s.name }))} />
          </FormDialog>
        }
      />
      {data?.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((t) => (
            <Link key={t.id} href={`/admin/templates/${t.id}`} className="rounded-lg border bg-card p-4 transition-colors hover:border-foreground/20">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium">{t.name}</p>
                {!t.is_active ? <Badge variant="neutral">Inactive</Badge> : null}
              </div>
              <p className="mt-1 line-clamp-2 text-[13px] text-muted-foreground">{t.description ?? "No description"}</p>
              <p className="mt-4 text-[12px] text-muted-foreground">
                {t.project_template_milestones.length} milestones · {t.project_template_tasks.length} tasks{t.service?.name ? ` · ${t.service.name}` : ""}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState icon={LayoutTemplate} title="No templates yet" />
      )}
    </>
  );
}
