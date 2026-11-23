import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { PageHero, Section } from "@/components/public/section";
import { InquiryForm } from "@/components/public/inquiry-form";
import { Button } from "@/components/ui/button";
import { getPublicServices } from "@/features/website/queries";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Book a call", description: "Book a free 30-minute discovery call." };

const AGENDA = ["Your goals and what success looks like", "Scope, constraints and timeline", "Budget ranges and engagement options", "Clear next steps — usually a written proposal"];

export default async function BookCallPage() {
  const services = (await getPublicServices()).map((s) => ({ slug: s.slug, name: s.name }));
  return (
    <>
      <PageHero label="Discovery call" title="Thirty minutes, no obligation.">
        A short conversation to understand your project and tell you honestly whether — and how — we can help.
      </PageHero>
      <Section>
        <div className="grid gap-14 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <p className="font-medium">What we&apos;ll cover</p>
            <ol className="mt-4 space-y-3 text-[15px] text-muted-foreground">
              {AGENDA.map((a, i) => (
                <li key={a} className="flex gap-3">
                  <span className="font-mono text-[12px] text-primary">{String(i + 1).padStart(2, "0")}</span>
                  {a}
                </li>
              ))}
            </ol>
            {siteConfig.bookingUrl ? (
              <Button className="mt-8" size="lg" asChild>
                <a href={siteConfig.bookingUrl} target="_blank" rel="noreferrer">
                  Pick a time instantly <ArrowUpRight />
                </a>
              </Button>
            ) : null}
          </div>
          <div className="rounded-xl border p-6 sm:p-8">
            <p className="mb-6 text-[15px] text-muted-foreground">
              {siteConfig.bookingUrl ? "Or request a time and we'll confirm by email:" : "Request a time and we'll confirm by email within one business day."}
            </p>
            <InquiryForm kind="booking" services={services} />
          </div>
        </div>
      </Section>
    </>
  );
}
