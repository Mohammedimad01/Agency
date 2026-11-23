"use client";
import { Button } from "@/components/ui/button";
import { useServerAction } from "@/hooks/use-action";
import { markNotificationsRead } from "@/features/notifications/actions";

export function MarkAllReadButton() {
  const { pending, execute } = useServerAction();
  return (
    <Button variant="outline" size="sm" disabled={pending} onClick={() => execute(() => markNotificationsRead(), { success: "All caught up" })}>
      Mark all as read
    </Button>
  );
}
