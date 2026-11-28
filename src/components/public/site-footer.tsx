import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";
import { siteConfig } from "@/config/site";
import { Logo } from "@/components/shared/logo";
import { GitHubIcon, InstagramIcon, LinkedInIcon, XIcon } from "@/components/shared/social-icons";
import type { PublicService } from "@/features/website/queries";
import { groupServices } from "@/features/website/service-groups";
import { whatsappHref } from "@/components/public/home-sections";

export function SiteFooter({ services }: { services: PublicService[] }) {
  const year = new Date().getFullYear();
  const { groups, more } = groupServices(services);
  const wa = whatsappHref();
  const socials = [
    { href: siteConfig.social.linkedin, label: "LinkedIn", Icon: LinkedInIcon },
    { href: siteConfig.social.instagram, label: "Instagram", Icon: InstagramIcon },
    { href: siteConfig.social.x, label: "X", Icon: XIcon },
    { href: siteConfig.social.github, label: "GitHub", Icon: GitHubIcon },
  ].filter((s) => s.href);
  return (
    <footer className="px-2 pb-2 pt-10 sm:px-3">
      <div className="dark overflow-hidden rounded-[28px] bg-ink text-ink-foreground">
        <div className="container-page grid gap-12 py-16 lg:grid-cols-[1.3fr_repeat(4,1fr)]">
          <div className="max-w-xs">
            <Logo subline inverted />
            <p className="mt-5 text-[14.5px] leading-relaxed text-ink-foreground/65">{siteConfig.tagline}</p>
            <div className="mt-6 grid gap-2 text-[14px]">
              <a href={`mailto:${siteConfig.contact.email}`} className="inline-flex items-center gap-2 text-ink-foreground/85 hover:text-signal">
                <Mail className="size-4" /> {siteConfig.contact.email}
              </a>
              {wa ? (
                <a href={wa} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-ink-foreground/85 hover:text-signal">
                  <MessageCircle className="size-4" /> WhatsApp
                </a>
              ) : null}
              {siteConfig.contact.phone ? <span className="text-ink-foreground/65">{siteConfig.contact.phone}</span> : null}
              {siteConfig.contact.address ? <span className="text-ink-foreground/65">{siteConfig.contact.address}</span> : null}
            </div>
            {socials.length ? (
              <div className="mt-5 flex gap-1">
                {socials.map(({ href, label, Icon }) => (
                  <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} className="rounded-lg p-2 text-ink-foreground/60 transition-colors hover:bg-white/10 hover:text-ink-foreground">
                    <Icon className="size-4" />
                  </a>
                ))}
              </div>
            ) : null}
          </div>
          {groups.map((g) => (
            <FooterCol key={g.category} title={g.label} links={g.services.map((s) => ({ href: `/services/${s.slug}`, label: s.name }))} />
          ))}
          <FooterCol
            title="Studio"
            links={[
              { href: "/services", label: "All services" },
              ...more.slice(0, 3).map((s) => ({ href: `/services/${s.slug}`, label: s.name })),
              { href: "/portfolio", label: "Work" },
              { href: "/pricing", label: "Pricing" },
              { href: "/about", label: "About" },
              { href: "/contact", label: "Contact" },
              { href: "/login", label: "Client login" },
            ]}
          />
        </div>
        <div className="container-page flex flex-col gap-2 border-t border-white/10 py-8 text-[12.5px] text-ink-foreground/50 sm:flex-row sm:justify-between">
          <p>
            © {year} {siteConfig.name}. All rights reserved.
          </p>
          <p>Websites · Custom apps & software · SEO & growth</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-foreground/50">{title}</p>
      <ul className="mt-4 space-y-2.5 text-[14px]">
        {links.map((l) => (
          <li key={l.href + l.label}>
            <Link href={l.href} className="text-ink-foreground/80 transition-colors hover:text-signal">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
