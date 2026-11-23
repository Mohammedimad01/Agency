import { ContactCta, FaqSection, Hero, Intro, Process, SelectedWork, ServicesOverview, TechStack, Testimonials, WhyUs } from "@/components/public/home-sections";
import { getFaqs, getPortfolio, getPublicServices, getTestimonials } from "@/features/website/queries";
import { siteConfig } from "@/config/site";

export const revalidate = 300;

export default async function HomePage() {
  const [services, portfolio, testimonials, faqs] = await Promise.all([getPublicServices(), getPortfolio(), getTestimonials(), getFaqs()]);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    email: siteConfig.contact.email,
    telephone: siteConfig.contact.phone,
    address: siteConfig.contact.address,
    makesOffer: services.map((s) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: s.name, description: s.summary } })),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Hero services={services} />
      <Intro />
      <ServicesOverview services={services} />
      <SelectedWork items={portfolio} />
      <Process />
      <TechStack />
      <Testimonials items={testimonials} />
      <WhyUs />
      <FaqSection faqs={faqs} />
      <ContactCta />
    </>
  );
}
