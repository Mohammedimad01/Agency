import Link from "next/link";
import { FolderKanban } from "lucide-react";
import { requireClient } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { PROJECT_STATUSES } from "@/lib/status";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Projects" };

export default async function PortalProjects() {
  await requireClient();
  const sb = await createClient();
  const { data } = await sb.from("portal_projects").select("*").order("created_at", { ascending: false });
  return (
    <>
      <PageHeader title="Your projects" />
      {data?.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.map((p) => (
            <Link key={p.id} href={`/portal/projects/${p.id}`} className="rounded-xl border bg-card p-5 transition-colors hover:border-foreground/20">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[15px] font-medium">{p.name}</p>
                  <p className="text-[12.5px] text-muted-foreground">
                    {p.code}
                    {p.service_name ? ` · ${p.service_name}` : ""}
                  </p>
                </div>
                <StatusBadge status={p.status!} map={PROJECT_STATUSES} />
              </div>
              <div className="mt-5 flex items-center gap-3">
                <Progress value={p.progress ?? 0} className="h-2 flex-1" />
                <span className="text-[13px] font-medium tabular">{p.progress}%</span>
              </div>
              <p className="mt-3 text-[12.5px] text-muted-foreground">
                {formatDate(p.start_date)} → {p.completed_at ? `completed ${formatDate(p.completed_at)}` : formatDate(p.due_date)}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState icon={FolderKanban} title="No projects yet" description="Your projects will appear here once they begin." />
      )}
    </>
  );
}
