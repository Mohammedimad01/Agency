import Link from "next/link";
import { requireClient } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { MarkAllReadButton } from "@/components/shared/mark-all-read";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata = { title: "Notifications" };

export default async function PortalNotifications() {
  await requireClient();
  const sb = await createClient();
  const { data } = await sb.from("notifications").select("*").order("created_at", { ascending: false }).limit(100);
  return (
    <>
      <PageHeader title="Notifications" actions={<MarkAllReadButton />} />
      {data?.length ? (
        <ul className="divide-y rounded-lg border bg-card">
          {data.map((n) => (
            <li key={n.id}>
              <Link href={n.link ?? "/portal"} className={cn("flex items-start gap-3 px-5 py-3.5 hover:bg-accent/40", !n.read_at && "bg-primary/[0.03]")}>
                <span className={cn("mt-2 size-1.5 rounded-full", n.read_at ? "bg-border" : "bg-primary")} />
                <div className="flex-1">
                  <p className="text-[13.5px] font-medium">{n.title}</p>
                  {n.body ? <p className="text-[13px] text-muted-foreground">{n.body}</p> : null}
                </div>
                <span className="text-[12px] text-muted-foreground">{formatDateTime(n.created_at)}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="No notifications yet" />
      )}
    </>
  );
}
