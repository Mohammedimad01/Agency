import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHero, Section, SectionIntro } from "@/components/public/section";
import { ContactCta } from "@/components/public/home-sections";
import { WorkCover } from "@/components/public/work-cover";
import { BrowserMockup, InvoiceCard, RankingCard, TrafficCard, AiAnswerCard } from "@/components/public/visuals";
import { getPortfolio } from "@/features/website/queries";

export const revalidate = 300;
export const metadata: Metadata = { title: "Work", description: "Websites, custom software and SEO projects — what we build and how." };

const BUILDS = [
  { title: "Business websites that win enquiries", body: "Fast, mobile-first company websites with service pages, lead forms, structured data and Search Console from day one.", tags: ["Web development", "Web design", "Technical SEO"], href: "/services/website-development", visual: <BrowserMockup className="w-[86%]" /> },
  { title: "Quotation & invoicing systems", body: "Branded quotes, VAT-ready invoices, payment tracking and reminders — quote to invoice in one flow, no retyping.", tags: ["Quotation apps", "Invoicing apps", "Business software"], href: "/services/invoicing-apps", visual: <InvoiceCard className="w-[70%]" /> },
  { title: "Search visibility programmes", body: "Technical fixes, local SEO and answer-first content that move rankings and get you cited in AI answers.", tags: ["SEO services", "Local SEO", "AI search"], href: "/services/seo-services", visual: <div className="grid w-[86%] gap-3"><RankingCard className="w-full" /><TrafficCard className="ml-auto w-44" /></div> },
  { title: "Portals, dashboards & ERP", body: "Client portals, internal dashboards and operations systems that replace spreadsheets with one source of truth.", tags: ["Custom web apps", "ERP software", "AI automation"], href: "/services/custom-web-apps", visual: <div className="dark w-[86%]"><AiAnswerCard className="w-full" /></div> },
];

export default async function PortfolioPage() {
  const items = await getPortfolio();
  return (
    <>
      <PageHero label="Work" title="What we build — and what it changes.">
        Every project starts with a business problem: more enquiries, less admin, better visibility. Here&apos;s the kind of work we do.
      </PageHero>
      {items.length ? (
        <Section>
          <SectionIntro label="Case studies" title="Selected projects." />
          <div className="grid gap-x-8 gap-y-14 md:grid-cols-2">
            {items.map((item) => (
              <Link key={item.id} href={`/portfolio/${item.slug}`} className="group">
                <WorkCover item={item} className="aspect-[4/3]" />
                <div className="mt-5 flex items-baseline justify-between gap-4">
                  <h2 className="text-[19px] font-semibold tracking-tight group-hover:text-primary">{item.title}</h2>
                  <span className="shrink-0 font-mono text-[12px] text-muted-foreground">{item.year}</span>
                </div>
                <p className="mt-1.5 text-[14.5px] text-muted-foreground">{item.summary}</p>
              </Link>
            ))}
          </div>
        </Section>
      ) : null}
      <Section tone={items.length ? "muted" : "default"}>
        <SectionIntro label="Capabilities" title="Projects we're built for.">
          Ask us for references and detailed examples on a call.
        </SectionIntro>
        <div className="grid gap-5 md:grid-cols-2">
          {BUILDS.map((b) => (
            <Link key={b.title} href={b.href} className="group overflow-hidden rounded-[22px] border bg-background transition-colors hover:border-primary/30">
              <div className="relative flex h-56 items-center justify-center overflow-hidden bg-paper" aria-hidden>
                <div className="absolute inset-0 opacity-60 [background-image:radial-gradient(color-mix(in_oklch,var(--foreground)_12%,transparent)_1px,transparent_1px)] [background-size:16px_16px]" />
                <div className="relative flex w-full justify-center">{b.visual}</div>
                <span className="absolute bottom-3 left-3 rounded-full bg-background/80 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground">Example</span>
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-display text-[22px] leading-tight group-hover:text-primary">{b.title}</h3>
                  <ArrowUpRight className="mt-1 size-5 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>
                <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">{b.body}</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {b.tags.map((t) => (
                    <li key={t} className="rounded-full border px-2.5 py-0.5 text-[12px] text-foreground/75">
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </Link>
          ))}
        </div>
      </Section>
      <ContactCta />
    </>
  );
}
