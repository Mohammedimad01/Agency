import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { PageHero, Section } from "@/components/public/section";
import { ContactCta, Process } from "@/components/public/home-sections";
import { Button } from "@/components/ui/button";
import { ServiceIcon } from "@/components/shared/icon";
import { getPortfolio, getPublicService, getPublicServices } from "@/features/website/queries";
import { WorkCover } from "@/components/public/work-cover";
import { formatMoney } from "@/lib/format";

export const revalidate = 300;

export async function generateStaticParams() {
  const services = await getPublicServices();
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = await getPublicService(slug);
  if (!service) return { title: "Service not found" };
  return { title: service.name, description: service.summary ?? undefined, openGraph: { title: service.name, description: service.summary ?? undefined } };
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [service, portfolio] = await Promise.all([getPublicService(slug), getPortfolio()]);
  if (!service) notFound();
  const related = portfolio.filter((p) => p.services.includes(service.name)).slice(0, 2);

  return (
    <>
      <PageHero label={service.category} title={service.name}>
        <p>{service.description ?? service.summary}</p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button size="lg" asChild>
            <Link href={`/contact?type=brief&service=${service.slug}`}>
              Discuss your project <ArrowRight />
            </Link>
          </Button>
          <span className="text-sm text-muted-foreground">
            {service.starting_price_cents ? `From ${formatMoney(service.starting_price_cents)}` : "Scoped per project"}
            {service.delivery_time ? ` · typically ${service.delivery_time}` : ""}
          </span>
        </div>
      </PageHero>
      <Section>
        <div className="grid gap-12 md:grid-cols-[1fr_1.3fr]">
          <div>
            <ServiceIcon name={service.icon} className="size-8 text-primary" />
            <h2 className="mt-6 font-display text-[clamp(1.8rem,3vw,2.4rem)] leading-tight tracking-tight">What you get</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">Concrete deliverables, agreed up front and approved by you at each milestone.</p>
          </div>
          <ul className="divide-y border-y">
            {(service.deliverables.length ? service.deliverables : ["Scoped deliverables agreed in your proposal"]).map((d) => (
              <li key={d} className="flex items-center gap-3 py-4 text-[15.5px]">
                <Check className="size-4 text-primary" />
                {d}
              </li>
            ))}
          </ul>
        </div>
      </Section>
      {related.length ? (
        <Section tone="muted">
          <h2 className="mb-8 font-display text-[clamp(1.8rem,3vw,2.4rem)] tracking-tight">Related work</h2>
          <div className="grid gap-8 md:grid-cols-2">
            {related.map((p) => (
              <Link key={p.id} href={`/portfolio/${p.slug}`} className="group">
                <WorkCover item={p} className="aspect-[16/10]" />
                <p className="mt-4 text-[17px] font-medium group-hover:text-primary">{p.title}</p>
                <p className="text-sm text-muted-foreground">{p.summary}</p>
              </Link>
            ))}
          </div>
        </Section>
      ) : null}
      <Process />
      <ContactCta />
    </>
  );
}
