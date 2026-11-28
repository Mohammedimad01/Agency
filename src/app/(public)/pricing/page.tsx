import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { PageHero, Section, SectionIntro } from "@/components/public/section";
import { ContactCta, FaqList } from "@/components/public/home-sections";
import { Button } from "@/components/ui/button";
import { getFaqs, getPublicServices } from "@/features/website/queries";
import { ENGAGEMENTS } from "@/config/content";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export const revalidate = 300;
export const metadata: Metadata = { title: "Pricing", description: "Fixed written quotes for websites, custom software and SEO. See how we price projects and monthly services." };

export default async function PricingPage() {
  const [services, faqs] = await Promise.all([getPublicServices(), getFaqs()]);
  const priced = services.filter((s) => s.starting_price_cents);
  return (
    <>
      <PageHero label="Pricing" title="Clear scope. Fixed quotes. No surprises.">
        Every project is quoted in writing after a short scoping call: one price, clear milestones, and nothing added later without your approval.
      </PageHero>
      <Section>
        <div className="grid gap-5 lg:grid-cols-3">
          {ENGAGEMENTS.map((m) => (
            <div key={m.name} className={cn("relative flex flex-col rounded-[24px] border p-7", m.featured ? "dark border-transparent bg-ink text-ink-foreground" : "bg-background")}>
              {m.featured ? <span className="absolute -top-3 left-7 rounded-full bg-signal px-3 py-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink">Most requested</span> : null}
              <h2 className="font-display text-[26px] leading-tight">{m.name}</h2>
              <p className={cn("mt-2 text-[15px]", m.featured ? "text-ink-foreground/70" : "text-muted-foreground")}>{m.summary}</p>
              <p className="mt-6 flex items-baseline gap-2">
                <span className="font-display text-[30px]">{m.price ?? "Fixed quote"}</span>
                <span className={cn("text-[13px]", m.featured ? "text-ink-foreground/60" : "text-muted-foreground")}>{m.price ? m.unit : `· ${m.unit}`}</span>
              </p>
              <ul className="mt-6 flex-1 space-y-3 text-[15px]">
                {m.points.map((p) => (
                  <li key={p} className="flex items-start gap-2.5">
                    <Check className={cn("mt-0.5 size-4 shrink-0", m.featured ? "text-signal" : "text-primary")} />
                    {p}
                  </li>
                ))}
              </ul>
              <Button className={cn("mt-8 rounded-full", m.featured && "bg-signal font-semibold text-ink hover:bg-signal/90")} variant={m.featured ? "default" : "outline"} asChild>
                <Link href={m.href}>{m.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
        <p className="mt-6 text-[13.5px] text-muted-foreground">Monthly services (SEO, maintenance, hosting) are billed monthly with no long lock-in. Prices exclude third-party costs such as domains, licences and ad spend.</p>
      </Section>
      {priced.length ? (
        <Section tone="muted">
          <SectionIntro label="Starting prices" title="Typical starting points by service.">
            Final pricing depends on scope, integrations and timeline.
          </SectionIntro>
          <div className="divide-y overflow-hidden rounded-[22px] border bg-background">
            {priced.map((s) => (
              <Link key={s.id} href={`/services/${s.slug}`} className="flex flex-col gap-1 px-6 py-4 hover:bg-accent/50 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-medium">{s.name}</span>
                <span className="text-sm text-muted-foreground">
                  {s.delivery_time ? `${s.delivery_time} · ` : ""}
                  <span className="font-medium text-foreground tabular">From {formatMoney(s.starting_price_cents)}</span>
                </span>
              </Link>
            ))}
          </div>
        </Section>
      ) : null}
      {faqs.length ? (
        <Section>
          <div className="grid gap-10 md:grid-cols-[1fr_1.7fr]">
            <h2 className="font-display text-[clamp(2rem,3.6vw,2.8rem)] leading-[1.05]">Pricing questions</h2>
            <FaqList faqs={faqs} />
          </div>
        </Section>
      ) : null}
      <ContactCta />
    </>
  );
}
