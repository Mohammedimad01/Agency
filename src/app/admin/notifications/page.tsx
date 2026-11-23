import Link from "next/link";
import { Bell } from "lucide-react";
import { requireTeam } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { MarkAllReadButton } from "@/components/shared/mark-all-read";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  await requireTeam();
  const sb = await createClient();
  const { data } = await sb.from("notifications").select("*").order("created_at", { ascending: false }).limit(100);
  return (
    <>
      <PageHeader title="Notifications" description="Everything that needs your attention, newest first." actions={<MarkAllReadButton />} />
      {data?.length ? (
        <ul className="divide-y rounded-lg border bg-card">
          {data.map((n) => (
            <li key={n.id}>
              <Link href={n.link ?? "#"} className={cn("flex items-start gap-3 px-5 py-3.5 hover:bg-accent/40", !n.read_at && "bg-primary/[0.03]")}>
                <span className={cn("mt-2 size-1.5 shrink-0 rounded-full", n.read_at ? "bg-border" : "bg-primary")} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-medium">{n.title}</p>
                  {n.body ? <p className="text-[13px] text-muted-foreground">{n.body}</p> : null}
                </div>
                <span className="shrink-0 text-[12px] text-muted-foreground">{formatDateTime(n.created_at)}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={Bell} title="No notifications yet" description="New leads, assignments, approvals and payments will show up here." />
      )}
    </>
  );
}
