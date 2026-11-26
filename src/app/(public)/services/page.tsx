import type { Metadata } from "next";
import { PageHero, Section } from "@/components/public/section";
import { ContactCta, ServiceGroups } from "@/components/public/home-sections";
import { EmptyState } from "@/components/shared/empty-state";
import { getPublicServices } from "@/features/website/queries";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Services",
  description: "Web development, web design, e-commerce, custom web and mobile apps, invoicing, quotation and ERP software, SEO, technical SEO, local SEO, AI search optimisation and digital marketing.",
};

export default async function ServicesPage() {
  const services = await getPublicServices();
  return (
    <>
      <PageHero label="Services" title="Everything you need to build, launch and grow online.">
        Engage us for a single service or the whole journey — from your website and custom software to rankings on Google and visibility in AI answers. Every engagement follows the same transparent, milestone-based delivery.
      </PageHero>
      <Section>
        {services.length ? <ServiceGroups services={services} /> : <EmptyState title="Our service catalogue is being updated" description="Please get in touch and we'll walk you through what we offer." />}
      </Section>
      <ContactCta />
    </>
  );
}
