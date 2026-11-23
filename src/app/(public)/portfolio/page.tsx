import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Section } from "@/components/public/section";
import { ContactCta } from "@/components/public/home-sections";
import { WorkCover } from "@/components/public/work-cover";
import { EmptyState } from "@/components/shared/empty-state";
import { getPortfolio } from "@/features/website/queries";

export const revalidate = 300;
export const metadata: Metadata = { title: "Work", description: "Case studies across web, product, data and AI." };

export default async function PortfolioPage() {
  const items = await getPortfolio();
  return (
    <>
      <PageHero label="Work" title="Selected case studies.">
        Each project below started with a business problem. Here&apos;s what we built and what changed.
      </PageHero>
      <Section>
        {items.length ? (
          <div className="grid gap-x-8 gap-y-14 md:grid-cols-2">
            {items.map((item) => (
              <Link key={item.id} href={`/portfolio/${item.slug}`} className="group">
                <WorkCover item={item} className="aspect-[4/3]" />
                <div className="mt-5 flex items-baseline justify-between gap-4">
                  <h2 className="text-[19px] font-medium tracking-tight group-hover:text-primary">{item.title}</h2>
                  <span className="shrink-0 font-mono text-[12px] text-muted-foreground">{item.year}</span>
                </div>
                <p className="mt-1.5 text-[14.5px] text-muted-foreground">{item.summary}</p>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title="Case studies coming soon" description="We're writing up recent projects. Ask us for references in the meantime." />
        )}
      </Section>
      <ContactCta />
    </>
  );
}
