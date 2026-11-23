import type { Metadata } from "next";
import { PageHero, Section } from "@/components/public/section";
import { ContactCta, ServicesIndex } from "@/components/public/home-sections";
import { EmptyState } from "@/components/shared/empty-state";
import { getPublicServices } from "@/features/website/queries";

export const revalidate = 300;
export const metadata: Metadata = { title: "Services", description: "Websites, web applications, UI/UX, branding, business intelligence, Power BI, AI solutions and automation." };

export default async function ServicesPage() {
  const services = await getPublicServices();
  return (
    <>
      <PageHero label="Services" title="Everything you need to build, run and measure your digital business.">
        Engage us for a single discipline or the whole stack. Every service follows the same transparent, milestone-based delivery.
      </PageHero>
      <Section>
        {services.length ? <ServicesIndex services={services} showPrices /> : <EmptyState title="Our service catalogue is being updated" description="Please get in touch and we'll walk you through what we offer." />}
      </Section>
      <ContactCta />
    </>
  );
}
