import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";
import { getPublicServices } from "@/features/website/queries";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const services = await getPublicServices();
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2">
        Skip to content
      </a>
      <SiteHeader services={services.map((s) => ({ slug: s.slug, name: s.name, summary: s.summary, icon: s.icon, category: s.category }))} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter services={services} />
    </div>
  );
}
