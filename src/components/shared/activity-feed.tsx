import { formatDateTime } from "@/lib/format";
import { EmptyState } from "./empty-state";

export function ActivityFeed({ items }: { items: { id: string; description: string; created_at: string; actor?: string | null }[] }) {
  if (!items.length) return <EmptyState compact title="No activity yet" />;
  return (
    <ol className="relative grid gap-4 border-l pl-5">
      {items.map((a) => (
        <li key={a.id} className="relative text-[13.5px]">
          <span className="absolute -left-[25px] top-1.5 size-2 rounded-full border-2 border-background bg-primary/60" />
          <p>{a.description}</p>
          <p className="text-[12px] text-muted-foreground">
            {a.actor ?? "System"} · {formatDateTime(a.created_at)}
          </p>
        </li>
      ))}
    </ol>
  );
}
