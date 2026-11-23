import type { Metadata } from "next";
import { PageHero, Section, SectionIntro } from "@/components/public/section";
import { ContactCta, Process, WhyUs } from "@/components/public/home-sections";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "About", description: `How ${siteConfig.name} works, what we believe and who we work with.` };

const VALUES = [
  { title: "Clarity over cleverness", body: "Plain-language scopes, honest estimates, and interfaces people understand on the first try." },
  { title: "Craft is a business decision", body: "Polish compounds: faster sites convert better, cleaner code costs less to change, good data gets used." },
  { title: "Small team, high ownership", body: "We stay deliberately small so every project gets senior attention from kickoff to handover." },
  { title: "Measured outcomes", body: "We agree on what success looks like up front, and we instrument the work so we can tell." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero label="About" title={<>A studio for teams who want it done <em className="text-primary">properly</em>.</>}>
        {siteConfig.name} is a digital solutions studio combining product design, software engineering, business intelligence and applied AI. We work with founders, operators and leadership teams who need a dependable technical partner.
      </PageHero>
      <Section>
        <SectionIntro label="What we believe" title="Principles we actually work by." />
        <dl className="grid gap-x-12 gap-y-10 md:grid-cols-2">
          {VALUES.map((v, i) => (
            <div key={v.title} className="grid grid-cols-[2.5rem_1fr] border-t pt-6">
              <span className="font-mono text-[12px] text-primary">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <dt className="text-[18px] font-medium">{v.title}</dt>
                <dd className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{v.body}</dd>
              </div>
            </div>
          ))}
        </dl>
      </Section>
      <Process />
      <WhyUs />
      <ContactCta />
    </>
  );
}
