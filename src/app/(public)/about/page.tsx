import type { Metadata } from "next";
import { PageHero, Section, SectionIntro } from "@/components/public/section";
import { ContactCta, Process, WhyUs } from "@/components/public/home-sections";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "About", description: `How ${siteConfig.name} works, what we believe and who we work with.` };

const VALUES = [
  { title: "Clarity over cleverness", body: "Plain-language scopes, honest estimates, and interfaces people understand on the first try." },
  { title: "Built to be found", body: "A beautiful site nobody finds is a cost. Speed, structure and search visibility are part of every build." },
  { title: "Small team, high ownership", body: "We stay deliberately small so every project gets senior attention from kickoff to handover." },
  { title: "Measured outcomes", body: "We agree on what success looks like up front, and we instrument the work so we can tell." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero label="About" title={<>A studio for businesses that want it done <span className="font-serif font-normal italic tracking-normal text-primary">properly</span>.</>}>
        {siteConfig.name} designs and builds websites, online stores, custom apps and business software — and makes sure customers can find them on Google, in maps and in AI answers. We work with founders and growing businesses who want one dependable partner for build and growth.
      </PageHero>
      <Section>
        <SectionIntro label="What we believe" title="Principles we work by." />
        <dl className="grid gap-x-12 gap-y-10 md:grid-cols-2">
          {VALUES.map((v, i) => (
            <div key={v.title} className="grid grid-cols-[2.5rem_1fr] rounded-[22px] border bg-background p-6">
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
