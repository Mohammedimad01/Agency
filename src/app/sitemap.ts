import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { getPortfolio, getPublicServices } from "@/features/website/queries";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url.replace(/\/$/, "");
  const [services, portfolio] = await Promise.all([getPublicServices(), getPortfolio()]);
  const staticRoutes = ["", "/about", "/services", "/portfolio", "/pricing", "/contact", "/book-a-call"].map((p) => ({
    url: `${base}${p}`,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.7,
  }));
  return [
    ...staticRoutes,
    ...services.map((s) => ({ url: `${base}/services/${s.slug}`, lastModified: s.updated_at, priority: 0.6 })),
    ...portfolio.map((p) => ({ url: `${base}/portfolio/${p.slug}`, lastModified: p.updated_at, priority: 0.5 })),
  ];
}
