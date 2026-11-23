import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { siteConfig } from "@/config/site";

/** Organization settings (currency, numbering, payment instructions…). */
export const getOrgSettings = cache(async (organizationId: string) => {
  const sb = await createClient();
  const { data } = await sb.from("settings").select("*").eq("organization_id", organizationId).maybeSingle();
  return data;
});

export async function getCurrency(organizationId: string) {
  return (await getOrgSettings(organizationId))?.currency ?? siteConfig.currency;
}

/** Lightweight lookups used by many forms. */
export const getTeamDirectory = cache(async (organizationId: string) => {
  const sb = await createClient();
  const { data } = await sb
    .from("team_members")
    .select("profile_id, role_key, status, title, profiles!team_members_profile_id_fkey(full_name, email, avatar_url)")
    .eq("organization_id", organizationId)
    .eq("status", "active");
  return (data ?? []).map((m) => ({
    id: m.profile_id,
    name: m.profiles?.full_name ?? String(m.profiles?.email ?? ""),
    email: String(m.profiles?.email ?? ""),
    avatar: m.profiles?.avatar_url ?? null,
    role: m.role_key,
    title: m.title,
  }));
});

export const getServiceOptions = cache(async (organizationId: string) => {
  const sb = await createClient();
  const { data } = await sb.from("services").select("id, name, starting_price_cents, is_active").eq("organization_id", organizationId).order("sort_order");
  return data ?? [];
});

export const getClientOptions = cache(async (organizationId: string) => {
  const sb = await createClient();
  const { data } = await sb.from("clients").select("id, name").eq("organization_id", organizationId).is("deleted_at", null).order("name");
  return data ?? [];
});

export const getTemplateOptions = cache(async (organizationId: string) => {
  const sb = await createClient();
  const { data } = await sb.from("project_templates").select("id, name, service_id").eq("organization_id", organizationId).eq("is_active", true).order("name");
  return data ?? [];
});
