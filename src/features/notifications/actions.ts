"use server";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/session";

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export async function listNotifications(limit = 20): Promise<{ items: NotificationItem[]; unread: number }> {
  const user = await getUser();
  if (!user) return { items: [], unread: 0 };
  const sb = await createClient();
  const [{ data }, { count }] = await Promise.all([
    sb.from("notifications").select("id, type, title, body, link, read_at, created_at").order("created_at", { ascending: false }).limit(limit),
    sb.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null),
  ]);
  return { items: data ?? [], unread: count ?? 0 };
}

export async function markNotificationsRead(ids?: string[]) {
  const user = await getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };
  const sb = await createClient();
  let q = sb.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null);
  if (ids?.length) q = q.in("id", ids);
  const { error } = await q;
  return error ? { ok: false as const, error: error.message } : { ok: true as const, data: null };
}
