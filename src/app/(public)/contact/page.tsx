import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { PageHero, Section } from "@/components/public/section";
import { InquiryForm } from "@/components/public/inquiry-form";
import { whatsappHref } from "@/components/public/home-sections";
import { getPublicServices } from "@/features/website/queries";
import { siteConfig } from "@/config/site";
import { backendReady } from "@/lib/backend";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Contact", description: `Start a project or ask a question. ${siteConfig.name} replies within one business day.` };

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ type?: string; service?: string }> }) {
  const { type, service } = await searchParams;
  const kind = type === "brief" ? "brief" : "message";
  const services = (await getPublicServices()).map((s) => ({ slug: s.slug, name: s.name }));
  const wa = whatsappHref();
  const tabs = [
    { key: "brief", label: "Project brief", href: "/contact?type=brief" },
    { key: "message", label: "Quick message", href: "/contact" },
  ];
  return (
    <>
      <PageHero label="Contact" title="Tell us what you're building.">
        Share a few details and we&apos;ll reply within one business day — usually with questions, often with a ballpark estimate.
      </PageHero>
      <Section>
        <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr]">
          <div className="rounded-[22px] border bg-background p-6 sm:p-8">
            <div className="mb-8 inline-flex rounded-full bg-muted p-1" role="tablist">
              {tabs.map((t) => (
                <Link
                  key={t.key}
                  href={t.href}
                  role="tab"
                  aria-selected={kind === t.key}
                  className={cn("rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground", kind === t.key && "bg-background text-foreground shadow-sm")}
                >
                  {t.label}
                </Link>
              ))}
            </div>
            <InquiryForm key={kind} kind={kind} services={services} defaultService={service} delivery={backendReady() ? "server" : "email"} />
          </div>
          <aside className="grid content-start gap-3 text-[15px]">
            <ContactRow icon={Mail} label="Email" value={siteConfig.contact.email} href={`mailto:${siteConfig.contact.email}`} />
            {wa ? <ContactRow icon={MessageCircle} label="WhatsApp" value="Message us" href={wa} external /> : null}
            {siteConfig.contact.phone ? <ContactRow icon={Phone} label="Phone" value={siteConfig.contact.phone} href={`tel:${siteConfig.contact.phone.replace(/\s/g, "")}`} /> : null}
            {siteConfig.contact.address ? <ContactRow icon={MapPin} label="Studio" value={siteConfig.contact.address} /> : null}
            {siteConfig.contact.hours ? <ContactRow icon={Clock} label="Response time" value={siteConfig.contact.hours} /> : null}
            <div className="mt-2 rounded-[22px] bg-ink p-6 text-ink-foreground">
              <CalendarDays className="size-5 text-signal" />
              <p className="mt-4 text-[17px] font-semibold">Prefer to talk?</p>
              <p className="mt-1 text-sm text-ink-foreground/65">Book a free 30-minute discovery call.</p>
              <Link href="/book-a-call" className="mt-4 inline-flex rounded-full bg-signal px-4 py-2 text-sm font-semibold text-ink hover:bg-signal/90">
                Book a call
              </Link>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}

function ContactRow({ icon: Icon, label, value, href, external }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; href?: string; external?: boolean }) {
  const body = (
    <>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
        <Icon className="size-4 text-primary" />
      </span>
      <span className="min-w-0">
        <span className="block text-[12.5px] text-muted-foreground">{label}</span>
        <span className="block truncate font-medium">{value}</span>
      </span>
    </>
  );
  const cls = "flex items-center gap-3 rounded-[18px] border bg-background p-4";
  return href ? (
    <a href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className={cn(cls, "transition-colors hover:border-primary/40")}>
      {body}
    </a>
  ) : (
    <div className={cls}>{body}</div>
  );
}
