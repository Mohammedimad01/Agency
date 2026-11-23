import type { Metadata } from "next";
import { requireClient } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PortalShell } from "@/features/portal/components/portal-shell";

export const metadata: Metadata = { title: { default: "Client portal", template: "%s · Client portal" }, robots: { index: false } };

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireClient();
  const sb = await createClient();
  const [{ data: agency }] = await Promise.all([sb.from("portal_agency").select("name").limit(1).maybeSingle(), sb.rpc("portal_touch")]);
  return (
    <PortalShell
      user={{ id: ctx.userId, name: ctx.profile.full_name ?? ctx.profile.email, email: ctx.profile.email, avatar: ctx.profile.avatar_url }}
      clientName={ctx.clients.map((c) => c.name).join(", ")}
      agencyName={agency?.name ?? ""}
    >
      {children}
    </PortalShell>
  );
}
