import { CapabilityMarquee, ContactCta, FaqSection, GoalGuide, Hero, Intro, Process, SelectedWork, ServicesOverview, TechStack, Testimonials, WhyUs } from "@/components/public/home-sections";
import { getFaqs, getPortfolio, getPublicServices, getTestimonials } from "@/features/website/queries";
import { siteConfig } from "@/config/site";

export const revalidate = 300;

export default async function HomePage() {
  const [services, portfolio, testimonials, faqs] = await Promise.all([getPublicServices(), getPortfolio(), getTestimonials(), getFaqs()]);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      name: siteConfig.name,
      slogan: siteConfig.tagline,
      description: siteConfig.description,
      url: siteConfig.url,
      email: siteConfig.contact.email,
      ...(siteConfig.contact.phone ? { telephone: siteConfig.contact.phone } : {}),
      ...(siteConfig.contact.address ? { address: siteConfig.contact.address } : {}),
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Services",
        itemListElement: services.map((s) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: s.name, description: s.summary, url: `${siteConfig.url}/services/${s.slug}` } })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
    },
  ];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Hero />
      <CapabilityMarquee />
      <Intro />
      <ServicesOverview services={services} />
      <GoalGuide />
      <WhyUs />
      <Process />
      <SelectedWork items={portfolio} />
      <TechStack />
      <Testimonials items={testimonials} />
      <FaqSection faqs={faqs} />
      <ContactCta />
    </>
  );
}
