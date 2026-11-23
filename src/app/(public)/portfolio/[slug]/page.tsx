import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Section } from "@/components/public/section";
import { ContactCta } from "@/components/public/home-sections";
import { WorkCover } from "@/components/public/work-cover";
import { getPortfolio, getPortfolioItem, portfolioMetrics } from "@/features/website/queries";

export const revalidate = 300;

export async function generateStaticParams() {
  return (await getPortfolio()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = await getPortfolioItem(slug);
  return item ? { title: item.title, description: item.summary ?? undefined } : { title: "Case study not found" };
}

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getPortfolioItem(slug);
  if (!item) notFound();
  const metrics = portfolioMetrics(item);
  const blocks = [
    { title: "The challenge", body: item.challenge },
    { title: "Our approach", body: item.solution },
    { title: "The result", body: item.results },
  ].filter((b) => b.body);

  return (
    <>
      <section className="border-b">
        <div className="container-page pb-14 pt-12 sm:pt-16">
          <Link href="/portfolio" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> All work
          </Link>
          <p className="mt-10 font-mono text-[12px] uppercase tracking-[0.14em] text-muted-foreground">
            {item.client_name} {item.industry ? `· ${item.industry}` : ""} {item.year ? `· ${item.year}` : ""}
          </p>
          <h1 className="mt-5 max-w-4xl font-display text-[clamp(2.4rem,5.6vw,4.2rem)] leading-[1.02] tracking-tight text-balance">{item.title}</h1>
          <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-muted-foreground">{item.summary}</p>
          <WorkCover item={item} className="mt-12 aspect-[16/8]" priority />
          {metrics.length ? (
            <dl className="mt-10 grid gap-6 border-t pt-8 sm:grid-cols-3">
              {metrics.map((m) => (
                <div key={m.label}>
                  <dt className="text-[13px] text-muted-foreground">{m.label}</dt>
                  <dd className="mt-1 text-3xl font-semibold tracking-tight tabular">{m.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </section>
      <Section>
        <div className="grid gap-12 md:grid-cols-[1fr_2fr]">
          <aside className="space-y-6 text-sm">
            {item.services.length ? (
              <div>
                <p className="font-medium">Services</p>
                <ul className="mt-2 space-y-1 text-muted-foreground">{item.services.map((s) => <li key={s}>{s}</li>)}</ul>
              </div>
            ) : null}
            {item.tech_stack.length ? (
              <div>
                <p className="font-medium">Technology</p>
                <ul className="mt-2 space-y-1 text-muted-foreground">{item.tech_stack.map((s) => <li key={s}>{s}</li>)}</ul>
              </div>
            ) : null}
            {item.project_url ? (
              <a href={item.project_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium hover:text-primary">
                Visit project <ArrowUpRight className="size-4" />
              </a>
            ) : null}
          </aside>
          <div className="space-y-12">
            {blocks.map((b) => (
              <div key={b.title}>
                <h2 className="text-[22px] font-medium tracking-tight">{b.title}</h2>
                <p className="mt-3 whitespace-pre-line text-[16px] leading-relaxed text-muted-foreground">{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>
      <ContactCta />
    </>
  );
}
