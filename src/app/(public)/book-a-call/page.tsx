import type { Metadata } from "next";
import { ArrowUpRight, Check } from "lucide-react";
import { PageHero, Section } from "@/components/public/section";
import { InquiryForm } from "@/components/public/inquiry-form";
import { Button } from "@/components/ui/button";
import { getPublicServices } from "@/features/website/queries";
import { siteConfig } from "@/config/site";
import { backendReady } from "@/lib/backend";

export const metadata: Metadata = { title: "Book a call", description: `Book a free 30-minute discovery call with ${siteConfig.name}.` };

const AGENDA = ["Your goals and what success looks like", "Scope, constraints and timeline", "Budget ranges and the right starting point", "Clear next steps — usually a fixed written quote"];

export default async function BookCallPage() {
  const services = (await getPublicServices()).map((s) => ({ slug: s.slug, name: s.name }));
  return (
    <>
      <PageHero label="Discovery call" title="Thirty minutes. No obligation.">
        A short conversation to understand your project and tell you honestly whether — and how — we can help.
      </PageHero>
      <Section>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <p className="font-display text-[24px] leading-tight">What we&apos;ll cover</p>
            <ul className="mt-6 grid gap-3">
              {AGENDA.map((a) => (
                <li key={a} className="flex gap-3 rounded-[18px] border bg-background p-4 text-[15px]">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  {a}
                </li>
              ))}
            </ul>
            {siteConfig.bookingUrl ? (
              <Button className="mt-8 rounded-full" size="lg" asChild>
                <a href={siteConfig.bookingUrl} target="_blank" rel="noreferrer">
                  Pick a time instantly <ArrowUpRight />
                </a>
              </Button>
            ) : null}
          </div>
          <div className="rounded-[22px] border bg-background p-6 sm:p-8">
            <p className="mb-6 text-[15px] text-muted-foreground">
              {siteConfig.bookingUrl ? "Or request a time and we'll confirm by email:" : "Request a time and we'll confirm by email within one business day."}
            </p>
            <InquiryForm kind="booking" services={services} delivery={backendReady() ? "server" : "email"} />
          </div>
        </div>
      </Section>
    </>
  );
}
