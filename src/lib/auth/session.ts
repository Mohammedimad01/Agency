import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PERMISSIONS, isPermission, type Permission, type TeamRole } from "@/lib/permissions";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  job_title: string | null;
}

export interface TeamContext {
  kind: "team";
  userId: string;
  profile: Profile;
  organizationId: string;
  organization: { id: string; name: string; slug: string };
  role: TeamRole;
  memberId: string;
  permissions: ReadonlySet<Permission>;
  can: (permission: Permission) => boolean;
}

export interface ClientContext {
  kind: "client";
  userId: string;
  profile: Profile;
  clientIds: string[];
  clients: { id: string; name: string; organization_id: string }[];
  contact: { id: string; client_id: string; full_name: string; email: string; phone: string | null; job_title: string | null } | null;
}

/** Verified user (validated with the Auth server, not just the cookie). */
export const getUser = cache(async () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
});

const getProfile = cache(async (userId: string): Promise<Profile | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url, phone, job_title")
    .eq("id", userId)
    .maybeSingle();
  return data ? { ...data, email: String(data.email) } : null;
});

export const getTeamContext = cache(async (): Promise<TeamContext | null> => {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("team_members")
    .select("id, organization_id, role_key, status, organizations(id, name, slug)")
    .eq("profile_id", user.id)
    .eq("status", "active")
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!membership || !membership.organizations) return null;

  const role = membership.role_key as TeamRole;
  let permissions: Permission[];
  if (role === "owner") {
    permissions = [...PERMISSIONS];
  } else {
    const { data: rows } = await supabase.from("role_permissions").select("permission_key").eq("role_key", role);
    permissions = (rows ?? []).map((r) => r.permission_key).filter(isPermission);
  }
  const set = new Set(permissions);
  const profile = (await getProfile(user.id)) ?? {
    id: user.id,
    email: user.email ?? "",
    full_name: null,
    avatar_url: null,
    phone: null,
    job_title: null,
  };
  return {
    kind: "team",
    userId: user.id,
    profile,
    organizationId: membership.organization_id,
    organization: membership.organizations,
    role,
    memberId: membership.id,
    permissions: set,
    can: (p) => set.has(p),
  };
});

export const getClientContext = cache(async (): Promise<ClientContext | null> => {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const [{ data: clients }, { data: contact }] = await Promise.all([
    supabase.from("portal_clients").select("id, name, organization_id").order("name"),
    supabase.from("portal_my_contact").select("id, client_id, full_name, email, phone, job_title").limit(1).maybeSingle(),
  ]);
  if (!clients || clients.length === 0) return null;
  const profile = (await getProfile(user.id)) ?? {
    id: user.id,
    email: user.email ?? "",
    full_name: null,
    avatar_url: null,
    phone: null,
    job_title: null,
  };
  return {
    kind: "client",
    userId: user.id,
    profile,
    clientIds: clients.map((c) => c.id!),
    clients: clients.map((c) => ({ id: c.id!, name: c.name!, organization_id: c.organization_id! })),
    contact: contact
      ? {
          id: contact.id!,
          client_id: contact.client_id!,
          full_name: contact.full_name!,
          email: String(contact.email),
          phone: contact.phone,
          job_title: contact.job_title,
        }
      : null,
  };
});

/** Where a signed-in user belongs. */
export async function homePathFor(): Promise<string> {
  if (await getTeamContext()) return "/admin";
  if (await getClientContext()) return "/portal";
  return "/login?error=no_access";
}

export async function requireTeam(permission?: Permission): Promise<TeamContext> {
  const user = await getUser();
  if (!user) redirect("/login?next=/admin");
  const ctx = await getTeamContext();
  if (!ctx) {
    if (await getClientContext()) redirect("/portal");
    redirect("/login?error=no_access");
  }
  if (permission && !ctx.can(permission)) redirect(`/admin/access-denied?permission=${permission}`);
  return ctx;
}

export async function requireClient(): Promise<ClientContext> {
  const user = await getUser();
  if (!user) redirect("/login?next=/portal");
  const ctx = await getClientContext();
  if (!ctx) {
    if (await getTeamContext()) redirect("/admin");
    redirect("/login?error=no_access");
  }
  return ctx;
}
