import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { PageHero, Section, SectionIntro } from "@/components/public/section";
import { ContactCta, FaqList } from "@/components/public/home-sections";
import { Button } from "@/components/ui/button";
import { getFaqs, getPublicServices } from "@/features/website/queries";
import { formatMoney } from "@/lib/format";

export const revalidate = 300;
export const metadata: Metadata = { title: "Pricing", description: "Transparent starting prices and engagement models." };

const MODELS = [
  {
    name: "Fixed-scope project",
    body: "Best for well-defined work: a website, a dashboard suite, a brand identity.",
    points: ["Written scope & milestones", "Fixed price, milestone billing", "Approval at each stage", "30-day post-launch support"],
    cta: "Start a project",
    href: "/contact?type=brief",
    featured: true,
  },
  {
    name: "Product partnership",
    body: "A dedicated slice of our team for ongoing product development.",
    points: ["Monthly capacity block", "Fortnightly planning", "Roadmap & analytics", "Priority support"],
    cta: "Talk to us",
    href: "/book-a-call",
  },
  {
    name: "Care & support",
    body: "Keep what we built fast, secure and up to date.",
    points: ["Monitoring & updates", "Monthly improvements", "Response-time commitment", "Quarterly review"],
    cta: "Ask about support",
    href: "/contact",
  },
];

export default async function PricingPage() {
  const [services, faqs] = await Promise.all([getPublicServices(), getFaqs()]);
  const priced = services.filter((s) => s.starting_price_cents);
  return (
    <>
      <PageHero label="Pricing" title="Clear pricing. No surprises.">
        Every project is scoped individually, but here&apos;s where engagements typically start. Your proposal will include a fixed price, payment schedule and timeline.
      </PageHero>
      <Section>
        <div className="grid gap-4 lg:grid-cols-3">
          {MODELS.map((m) => (
            <div key={m.name} className={`flex flex-col rounded-xl border p-7 ${m.featured ? "border-primary/40 bg-primary/[0.03]" : ""}`}>
              <h2 className="text-[18px] font-medium">{m.name}</h2>
              <p className="mt-2 text-[14.5px] text-muted-foreground">{m.body}</p>
              <ul className="mt-6 flex-1 space-y-2.5 text-[14.5px]">
                {m.points.map((p) => (
                  <li key={p} className="flex items-center gap-2.5">
                    <Check className="size-4 text-primary" />
                    {p}
                  </li>
                ))}
              </ul>
              <Button className="mt-8" variant={m.featured ? "default" : "outline"} asChild>
                <Link href={m.href}>{m.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </Section>
      {priced.length ? (
        <Section tone="muted">
          <SectionIntro label="Starting prices" title="Typical starting points by service.">
            Prices exclude applicable taxes. Final pricing depends on scope, integrations and timeline.
          </SectionIntro>
          <div className="divide-y rounded-lg border bg-background">
            {priced.map((s) => (
              <Link key={s.id} href={`/services/${s.slug}`} className="flex flex-col gap-1 px-5 py-4 hover:bg-accent/50 sm:flex-row sm:items-center sm:justify-between">
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
          <h2 className="mb-8 font-display text-[clamp(1.8rem,3vw,2.4rem)] tracking-tight">Pricing questions</h2>
          <FaqList faqs={faqs} />
        </Section>
      ) : null}
      <ContactCta />
    </>
  );
}
