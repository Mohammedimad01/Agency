import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Section } from "@/components/public/section";
import { InquiryForm } from "@/components/public/inquiry-form";
import { getPublicServices } from "@/features/website/queries";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Contact", description: `Start a project or ask a question. ${siteConfig.name} replies within one business day.` };

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ type?: string; service?: string }> }) {
  const { type, service } = await searchParams;
  const kind = type === "brief" ? "brief" : "message";
  const services = (await getPublicServices()).map((s) => ({ slug: s.slug, name: s.name }));
  const tabs = [
    { key: "message", label: "Quick message", href: "/contact" },
    { key: "brief", label: "Project brief", href: "/contact?type=brief" },
  ];
  return (
    <>
      <PageHero label="Contact" title="Tell us what you're building.">
        Share a few details and we&apos;ll reply within one business day — usually with questions, sometimes with a rough estimate.
      </PageHero>
      <Section>
        <div className="grid gap-14 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <div className="mb-8 inline-flex rounded-lg bg-muted p-1" role="tablist">
              {tabs.map((t) => (
                <Link
                  key={t.key}
                  href={t.href}
                  role="tab"
                  aria-selected={kind === t.key}
                  className={cn("rounded-md px-4 py-1.5 text-sm font-medium text-muted-foreground", kind === t.key && "bg-background text-foreground shadow-sm")}
                >
                  {t.label}
                </Link>
              ))}
            </div>
            <InquiryForm key={kind} kind={kind} services={services} defaultService={service} />
          </div>
          <aside className="space-y-8 text-[15px]">
            <div>
              <p className="font-medium">Email</p>
              <a href={`mailto:${siteConfig.contact.email}`} className="mt-1 block text-muted-foreground hover:text-foreground">
                {siteConfig.contact.email}
              </a>
            </div>
            <div>
              <p className="font-medium">Phone</p>
              <p className="mt-1 text-muted-foreground">{siteConfig.contact.phone}</p>
            </div>
            <div>
              <p className="font-medium">Studio</p>
              <p className="mt-1 text-muted-foreground">{siteConfig.contact.address}</p>
              <p className="text-muted-foreground">{siteConfig.contact.hours}</p>
            </div>
            <div className="rounded-lg border p-5">
              <p className="font-medium">Prefer to talk?</p>
              <p className="mt-1 text-sm text-muted-foreground">Book a free 30-minute discovery call.</p>
              <Link href="/book-a-call" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
                Book a call →
              </Link>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
