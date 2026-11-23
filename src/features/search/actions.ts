"use server";
import { createClient } from "@/lib/supabase/server";
import { getTeamContext } from "@/lib/auth/session";

export interface SearchHit {
  type: "lead" | "client" | "project" | "invoice" | "proposal";
  id: string;
  title: string;
  subtitle?: string | null;
  href: string;
}

/** Global search across the records the current user is allowed to see (RLS applies). */
export async function globalSearch(query: string): Promise<SearchHit[]> {
  const ctx = await getTeamContext();
  const q = query.trim().replace(/[%_,()]/g, " ").slice(0, 60);
  if (!ctx || q.length < 2) return [];
  const sb = await createClient();
  const like = `%${q}%`;
  const [leads, clients, projects, invoices, proposals] = await Promise.all([
    ctx.can("leads.view") ? sb.from("leads").select("id, full_name, company").is("deleted_at", null).or(`full_name.ilike.${like},company.ilike.${like},email.ilike.${like}`).limit(5) : { data: [] },
    sb.from("clients").select("id, name, email").is("deleted_at", null).or(`name.ilike.${like},company_name.ilike.${like},email.ilike.${like}`).limit(5),
    sb.from("projects").select("id, name, code").is("deleted_at", null).or(`name.ilike.${like},code.ilike.${like}`).limit(5),
    ctx.can("finance.view") ? sb.from("invoices").select("id, number, total_cents").is("deleted_at", null).ilike("number", like).limit(5) : { data: [] },
    ctx.can("proposals.view") ? sb.from("proposals").select("id, number, title").is("deleted_at", null).or(`title.ilike.${like},number.ilike.${like}`).limit(5) : { data: [] },
  ]);
  return [
    ...(leads.data ?? []).map((l) => ({ type: "lead" as const, id: l.id, title: l.full_name, subtitle: l.company, href: `/admin/leads/${l.id}` })),
    ...(clients.data ?? []).map((c) => ({ type: "client" as const, id: c.id, title: c.name, subtitle: c.email ? String(c.email) : null, href: `/admin/clients/${c.id}` })),
    ...(projects.data ?? []).map((p) => ({ type: "project" as const, id: p.id, title: p.name, subtitle: p.code, href: `/admin/projects/${p.id}` })),
    ...(invoices.data ?? []).map((i) => ({ type: "invoice" as const, id: i.id, title: i.number, subtitle: null, href: `/admin/finance/invoices/${i.id}` })),
    ...(proposals.data ?? []).map((p) => ({ type: "proposal" as const, id: p.id, title: p.title, subtitle: p.number, href: `/admin/proposals/${p.id}` })),
  ];
}
