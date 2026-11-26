import Link from "next/link";
import { siteConfig } from "@/config/site";
import { Logo } from "@/components/shared/logo";
import { GitHubIcon, InstagramIcon, LinkedInIcon, XIcon } from "@/components/shared/social-icons";
import type { PublicService } from "@/features/website/queries";
import { groupServices } from "@/features/website/service-groups";

export function SiteFooter({ services }: { services: PublicService[] }) {
  const year = new Date().getFullYear();
  const socials = [
    { href: siteConfig.social.linkedin, label: "LinkedIn", Icon: LinkedInIcon },
    { href: siteConfig.social.instagram, label: "Instagram", Icon: InstagramIcon },
    { href: siteConfig.social.x, label: "X", Icon: XIcon },
    { href: siteConfig.social.github, label: "GitHub", Icon: GitHubIcon },
  ].filter((s) => s.href);
  const { groups } = groupServices(services);
  return (
    <footer className="border-t bg-surface">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(5,1fr)]">
        <div className="max-w-xs">
          <Logo subline />
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{siteConfig.tagline}</p>
          <div className="mt-5 flex gap-1">
            {socials.map(({ href, label, Icon }) => (
              <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>
        {groups.map((g) => (
          <FooterCol key={g.category} title={g.label} links={g.services.map((s) => ({ href: `/services/${s.slug}`, label: s.name }))} />
        ))}
        <FooterCol
          title="Studio"
          links={[
            { href: "/about", label: "About" },
            { href: "/portfolio", label: "Work" },
            { href: "/pricing", label: "Pricing" },
            { href: "/contact", label: "Contact" },
            { href: "/login", label: "Client portal" },
          ]}
        />
        <div>
          <p className="text-[13px] font-medium">Get in touch</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <a href={`mailto:${siteConfig.contact.email}`} className="hover:text-foreground">
                {siteConfig.contact.email}
              </a>
            </li>
            <li>{siteConfig.contact.phone}</li>
            <li>{siteConfig.contact.address}</li>
            <li>{siteConfig.contact.hours}</li>
          </ul>
        </div>
      </div>
      <div className="border-t">
        <div className="container-page flex flex-col gap-2 py-5 text-[12.5px] text-muted-foreground sm:flex-row sm:justify-between">
          <p>
            © {year} {siteConfig.name}. All rights reserved.
          </p>
          <p>Built in-house on our own platform.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <p className="text-[13px] font-medium">{title}</p>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="hover:text-foreground">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
