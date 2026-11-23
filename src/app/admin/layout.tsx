import type { Metadata } from "next";
import { requireTeam } from "@/lib/auth/session";
import { adminNav } from "@/config/admin-nav";
import { AdminShell } from "@/components/admin/admin-shell";
import { ROLE_LABELS } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: { default: "Dashboard", template: "%s · Admin" }, robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireTeam();
  const groups = adminNav
    .map((g) => ({ label: g.label, items: g.items.filter((i) => !i.permission || ctx.can(i.permission)) }))
    .filter((g) => g.items.length);

  const sb = await createClient();
  const badges: Record<string, number> = {};
  if (ctx.can("leads.view")) {
    const { count } = await sb.from("leads").select("id", { count: "exact", head: true }).eq("status", "new").is("deleted_at", null);
    if (count) badges["/admin/leads"] = count;
  }

  return (
    <AdminShell
      groups={groups}
      orgName={ctx.organization.name}
      badges={badges}
      user={{ id: ctx.userId, name: ctx.profile.full_name ?? ctx.profile.email, email: ctx.profile.email, avatar: ctx.profile.avatar_url, role: ROLE_LABELS[ctx.role] }}
    >
      {children}
    </AdminShell>
  );
}
