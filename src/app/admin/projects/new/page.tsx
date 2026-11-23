import { requireTeam } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectForm } from "@/features/projects/components/project-form";
import { getClientOptions, getCurrency, getServiceOptions, getTeamDirectory, getTemplateOptions } from "@/features/settings/queries";

export const metadata = { title: "New project" };

export default async function NewProjectPage({ searchParams }: { searchParams: Promise<{ client?: string }> }) {
  const ctx = await requireTeam("projects.manage");
  const { client } = await searchParams;
  const [currency, clients, services, templates, team] = await Promise.all([
    getCurrency(ctx.organizationId),
    getClientOptions(ctx.organizationId),
    getServiceOptions(ctx.organizationId),
    getTemplateOptions(ctx.organizationId),
    getTeamDirectory(ctx.organizationId),
  ]);
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader breadcrumbs={[{ label: "Projects", href: "/admin/projects" }, { label: "New" }]} title="New project" description="Pick a template to generate milestones and tasks automatically." />
      <Card>
        <CardContent className="pt-5">
          <ProjectForm
            currency={currency}
            clients={clients}
            services={services.map((s) => ({ id: s.id, name: s.name }))}
            templates={templates}
            team={team.map((t) => ({ id: t.id, name: t.name }))}
            canSeeMoney={ctx.can("finance.view") || ctx.can("projects.manage")}
            project={client ? { id: "", client_id: client } : undefined}
          />
        </CardContent>
      </Card>
    </div>
  );
}
