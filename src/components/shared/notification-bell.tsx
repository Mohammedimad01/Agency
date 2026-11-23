"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getBrowserClient } from "@/lib/supabase/client";
import { listNotifications, markNotificationsRead, type NotificationItem } from "@/features/notifications/actions";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

/** In-app notification centre with Realtime updates (RLS limits the stream to the recipient's rows). */
export function NotificationBell({ userId, allHref }: { userId: string; allHref: string }) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    const r = await listNotifications(15);
    setItems(r.items);
    setUnread(r.unread);
  }, []);

  useEffect(() => {
    void load();
    const sb = getBrowserClient();
    const channel = sb
      .channel(`notifications:${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_id=eq.${userId}` }, () => void load())
      .subscribe();
    return () => {
      void sb.removeChannel(channel);
    };
  }, [userId, load]);

  async function markAll() {
    await markNotificationsRead();
    await load();
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`} className="relative">
          <Bell />
          {unread > 0 ? (
            <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[9.5px] font-semibold text-primary-foreground tabular">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <p className="text-sm font-medium">Notifications</p>
          {unread > 0 ? (
            <button className="text-[12px] text-muted-foreground hover:text-foreground" onClick={markAll}>
              Mark all read
            </button>
          ) : null}
        </div>
        <ul className="max-h-[420px] overflow-y-auto">
          {items.length === 0 ? <li className="px-4 py-10 text-center text-sm text-muted-foreground">You&apos;re all caught up.</li> : null}
          {items.map((n) => (
            <li key={n.id} className="border-b last:border-0">
              <Link
                href={n.link ?? allHref}
                onClick={() => {
                  setOpen(false);
                  if (!n.read_at) void markNotificationsRead([n.id]).then(load);
                }}
                className={cn("flex gap-3 px-4 py-3 hover:bg-accent/60", !n.read_at && "bg-primary/[0.035]")}
              >
                <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", n.read_at ? "bg-transparent" : "bg-primary")} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium">{n.title}</span>
                  {n.body ? <span className="line-clamp-2 text-[12.5px] text-muted-foreground">{n.body}</span> : null}
                  <span className="mt-0.5 block text-[11.5px] text-muted-foreground">{formatRelative(n.created_at)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="border-t px-4 py-2 text-center">
          <Link href={allHref} onClick={() => setOpen(false)} className="text-[12.5px] text-muted-foreground hover:text-foreground">
            View all
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
