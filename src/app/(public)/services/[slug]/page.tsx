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
import { BrowserMockup, InvoiceCard, RankingCard, TrafficCard } from "@/components/public/visuals";
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
  const [service, portfolio, all] = await Promise.all([getPublicService(slug), getPortfolio(), getPublicServices()]);
  if (!service) notFound();
  const siblings = all.filter((s) => s.category === service.category && s.slug !== service.slug).slice(0, 6);
  const related = portfolio.filter((p) => p.services.includes(service.name)).slice(0, 2);

  return (
    <>
      <PageHero
        label={service.category}
        title={service.name}
        aside={
          <div className="relative hidden h-72 items-center justify-center lg:flex" aria-hidden>
            {service.category === "Custom apps & software" ? (
              <InvoiceCard className="w-72 rotate-[2deg] scale-110" />
            ) : service.category === "SEO & growth" ? (
              <div className="grid w-80 gap-3">
                <RankingCard className="w-full" />
                <TrafficCard className="ml-auto w-48" />
              </div>
            ) : (
              <BrowserMockup className="w-[92%] rotate-[-1.5deg]" />
            )}
          </div>
        }
      >
        <p>{service.description ?? service.summary}</p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button size="lg" asChild className="rounded-full">
            <Link href={`/contact?type=brief&service=${service.slug}`}>
              Discuss your project <ArrowRight />
            </Link>
          </Button>
          <span className="text-sm text-muted-foreground">
            {service.starting_price_cents ? `From ${formatMoney(service.starting_price_cents)}` : "Fixed written quote"}
            {service.delivery_time ? ` · typically ${service.delivery_time}` : ""}
          </span>
        </div>
      </PageHero>
      <Section>
        <div className="grid gap-12 md:grid-cols-[1fr_1.3fr]">
          <div>
            <ServiceIcon name={service.icon} className="size-8 text-primary" />
            <h2 className="mt-6 font-display text-[clamp(1.9rem,3vw,2.6rem)] leading-tight">What you get</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">Concrete deliverables, agreed up front and approved by you at each milestone.</p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {(service.deliverables.length ? service.deliverables : ["Scoped deliverables agreed in your proposal"]).map((d) => (
              <li key={d} className="flex items-center gap-3 rounded-[18px] border bg-background p-4 text-[15px]">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Check className="size-3.5 text-primary" />
                </span>
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
      {siblings.length ? (
        <Section>
          <h2 className="mb-6 font-display text-[clamp(1.8rem,3vw,2.4rem)] tracking-tight">More in {service.category}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {siblings.map((s) => (
              <Link key={s.id} href={`/services/${s.slug}`} className="group flex items-start gap-3 rounded-xl border p-4 transition-colors hover:border-foreground/20">
                <ServiceIcon name={s.icon} className="mt-0.5 size-5 shrink-0 text-primary" />
                <span>
                  <span className="block font-medium group-hover:text-primary">{s.name}</span>
                  <span className="block text-[13px] text-muted-foreground">{s.summary}</span>
                </span>
              </Link>
            ))}
          </div>
        </Section>
      ) : null}
      <ContactCta />
    </>
  );
}
