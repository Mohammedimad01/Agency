import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { siteConfig } from "@/config/site";
import type { Database } from "@/types/database";
import { STATIC_FAQS, STATIC_SERVICES } from "@/config/content";

type Tables = Database["public"]["Tables"];
export type PublicService = Tables["services"]["Row"];
export type PortfolioItem = Tables["portfolio_items"]["Row"];
export type Testimonial = Tables["testimonials"]["Row"];
export type Faq = Tables["faqs"]["Row"];

/** Public website content is read anonymously (RLS: published rows only). Failures degrade to empty sections. */
export const getPublicOrganization = cache(async () => {
  const sb = createPublicClient();
  if (!sb) return null;
  let q = sb.from("organizations").select("id, name, slug").order("created_at").limit(1);
  if (siteConfig.organizationSlug) q = q.eq("slug", siteConfig.organizationSlug);
  const { data } = await q.maybeSingle();
  return data;
});

async function withOrg<T>(fn: (sb: NonNullable<ReturnType<typeof createPublicClient>>, orgId: string) => Promise<T>, fallback: T): Promise<T> {
  try {
    const sb = createPublicClient();
    const org = await getPublicOrganization();
    if (!sb || !org) return fallback;
    return await fn(sb, org.id);
  } catch (e) {
    console.error("[website]", e);
    return fallback;
  }
}

const EPOCH = "2026-11-26T00:00:00.000Z";
const FALLBACK_SERVICES: PublicService[] = STATIC_SERVICES.map((s) => ({
  ...s,
  id: s.slug,
  organization_id: "",
  features: [],
  is_active: true,
  is_public: true,
  created_at: EPOCH,
  updated_at: EPOCH,
}));
const FALLBACK_FAQS: Faq[] = STATIC_FAQS.map((f, i) => ({
  ...f,
  id: `faq-${i}`,
  organization_id: "",
  category: "general",
  is_published: true,
  sort_order: i,
  created_at: EPOCH,
  updated_at: EPOCH,
}));

/** Services from the database, or the built-in catalogue when the backend isn't set up yet. */
export const getPublicServices = cache(async () => {
  const rows = await withOrg(async (sb, org) => {
    const { data } = await sb.from("services").select("*").eq("organization_id", org).order("sort_order");
    return data ?? [];
  }, [] as PublicService[]);
  return rows.length ? rows : FALLBACK_SERVICES;
});

export const getPublicService = cache(async (slug: string) => {
  const services = await getPublicServices();
  return services.find((s) => s.slug === slug) ?? null;
});

export const getPortfolio = cache(() =>
  withOrg(async (sb, org) => {
    const { data } = await sb.from("portfolio_items").select("*").eq("organization_id", org).order("sort_order");
    return data ?? [];
  }, [] as PortfolioItem[]),
);

export const getPortfolioItem = cache((slug: string) =>
  withOrg(async (sb, org) => {
    const { data } = await sb.from("portfolio_items").select("*").eq("organization_id", org).eq("slug", slug).maybeSingle();
    return data;
  }, null as PortfolioItem | null),
);

export const getTestimonials = cache(() =>
  withOrg(async (sb, org) => {
    const { data } = await sb.from("testimonials").select("*").eq("organization_id", org).order("sort_order");
    return data ?? [];
  }, [] as Testimonial[]),
);

export const getFaqs = cache(async () => {
  const rows = await withOrg(async (sb, org) => {
    const { data } = await sb.from("faqs").select("*").eq("organization_id", org).order("sort_order");
    return data ?? [];
  }, [] as Faq[]);
  return rows.length ? rows : FALLBACK_FAQS;
});

export type PortfolioMetric = { label: string; value: string };
export function portfolioMetrics(item: Pick<PortfolioItem, "metrics">): PortfolioMetric[] {
  return Array.isArray(item.metrics)
    ? (item.metrics as unknown[]).filter((m): m is PortfolioMetric => !!m && typeof m === "object" && "label" in m && "value" in m)
    : [];
}
