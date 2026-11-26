import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section, SectionIntro } from "@/components/public/section";
import { WorkCover } from "@/components/public/work-cover";
import { ServiceIcon } from "@/components/shared/icon";
import { portfolioMetrics, type Faq, type PortfolioItem, type PublicService, type Testimonial } from "@/features/website/queries";
import { formatMoney } from "@/lib/format";
import { siteConfig } from "@/config/site";
import { groupServices } from "@/features/website/service-groups";

export function Hero({ services }: { services: PublicService[] }) {
  return (
    <section className="relative overflow-hidden border-b">
      <div className="container-page pb-20 pt-16 sm:pb-28 sm:pt-28">
        <p className="animate-fade-up font-mono text-[12px] uppercase tracking-[0.14em] text-muted-foreground">{siteConfig.tagline}</p>
        <h1 className="mt-6 max-w-5xl animate-fade-up font-display text-[clamp(2.8rem,7.4vw,6rem)] leading-[0.98] tracking-tight text-balance [animation-delay:80ms]">
          Websites, apps and search visibility that <em className="text-primary">grow</em> your business.
        </h1>
        <div className="mt-10 grid animate-fade-up gap-8 [animation-delay:160ms] md:grid-cols-[1.2fr_1fr] md:items-end">
          <p className="max-w-xl text-[17px] leading-relaxed text-muted-foreground">
            {siteConfig.name} designs and builds fast websites, online stores, custom apps and business software — then helps customers find you on Google, in maps and in AI answers. Clear scope, visible milestones, no surprises.
          </p>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <Button size="lg" asChild>
              <Link href="/contact?type=brief">
                Start a project <ArrowRight />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/portfolio">See our work</Link>
            </Button>
          </div>
        </div>
        {services.length ? (
          <dl className="mt-16 grid gap-6 border-t pt-8 sm:grid-cols-3">
            {[
              { k: "Websites", v: "Business sites & e-commerce" },
              { k: "Custom apps & software", v: "Portals, mobile, invoicing & ERP" },
              { k: "SEO & growth", v: "Google, local & AI search" },
            ].map((x) => (
              <div key={x.k}>
                <dt className="text-[13px] font-medium">{x.k}</dt>
                <dd className="mt-1 text-[13.5px] text-muted-foreground">{x.v}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </section>
  );
}

export function Intro() {
  return (
    <Section>
      <div className="grid gap-10 md:grid-cols-[1fr_1fr]">
        <p className="font-display text-[clamp(1.8rem,3.4vw,2.6rem)] leading-[1.15] tracking-tight text-balance">
          A small, senior team that builds what you need — then makes sure people can find it.
        </p>
        <div className="space-y-5 text-[15.5px] leading-relaxed text-muted-foreground">
          <p>
            {siteConfig.name} brings design, engineering and search growth under one roof. Your website is built SEO-ready from the first line of code, your software fits the way your team works, and every project is measured against real business results.
          </p>
          <p>
            Every engagement comes with a private client portal: live progress, deliverables to approve, invoices and a direct line to the people doing the work.
          </p>
          <Link href="/about" className="inline-flex items-center gap-1.5 font-medium text-foreground underline-offset-4 hover:underline">
            More about how we think <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </Section>
  );
}

export function ServicesIndex({ services, showPrices }: { services: PublicService[]; showPrices?: boolean }) {
  if (!services.length) return null;
  return (
    <ol className="border-t">
      {services.map((s, i) => (
        <li key={s.id} className="border-b">
          <Link href={`/services/${s.slug}`} className="group grid items-center gap-3 py-6 sm:grid-cols-[3rem_1fr_1.2fr_auto] sm:gap-6">
            <span className="font-mono text-[12px] text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
            <span className="flex items-center gap-3 text-[19px] font-medium tracking-tight">
              <ServiceIcon name={s.icon} className="size-5 text-primary" />
              {s.name}
            </span>
            <span className="text-[14.5px] text-muted-foreground">
              {s.summary}
              {showPrices && s.starting_price_cents ? <span className="ml-2 text-foreground">From {formatMoney(s.starting_price_cents)}</span> : null}
            </span>
            <ArrowUpRight className="hidden size-5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground sm:block" />
          </Link>
        </li>
      ))}
    </ol>
  );
}

export function ServiceGroups({ services }: { services: PublicService[] }) {
  const { groups, more } = groupServices(services);
  return (
    <div className="grid gap-12">
      <div className="grid gap-px overflow-hidden rounded-xl border bg-border lg:grid-cols-3">
        {groups.map((g) => (
          <div key={g.category} className="flex flex-col bg-background p-6 sm:p-7">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-md bg-primary/10">
                <ServiceIcon name={g.icon} className="size-4 text-primary" />
              </span>
              <h3 className="text-[17px] font-medium tracking-tight">{g.label}</h3>
            </div>
            <p className="mt-3 text-[14px] text-muted-foreground">{g.blurb}</p>
            <ul className="mt-6 grid gap-1">
              {g.services.map((sv) => (
                <li key={sv.id}>
                  <Link href={`/services/${sv.slug}`} className="group -mx-2 flex items-start justify-between gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-accent">
                    <span>
                      <span className="block text-[15px] font-medium group-hover:text-primary">{sv.name}</span>
                      {sv.summary ? <span className="block text-[13px] text-muted-foreground">{sv.summary}</span> : null}
                    </span>
                    <ArrowUpRight className="mt-1 size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {more.length ? (
        <div>
          <p className="mb-4 font-mono text-[12px] uppercase tracking-[0.14em] text-muted-foreground">Also available</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {more.map((sv) => (
              <Link key={sv.id} href={`/services/${sv.slug}`} className="group flex items-start gap-3 rounded-xl border bg-background p-4 transition-colors hover:border-foreground/20">
                <ServiceIcon name={sv.icon} className="mt-0.5 size-5 shrink-0 text-primary" />
                <span>
                  <span className="block text-[15px] font-medium group-hover:text-primary">{sv.name}</span>
                  {sv.summary ? <span className="block text-[13px] text-muted-foreground">{sv.summary}</span> : null}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function ServicesOverview({ services }: { services: PublicService[] }) {
  if (!services.length) return null;
  return (
    <Section tone="muted" id="services">
      <SectionIntro label="Services" title="Build it, launch it, get it found.">
        Websites, custom software and search growth from one team — so what we build is fast, usable and visible from day one.
      </SectionIntro>
      <ServiceGroups services={services} />
      <div className="mt-10">
        <Button variant="outline" asChild>
          <Link href="/services">
            Explore all services <ArrowRight />
          </Link>
        </Button>
      </div>
    </Section>
  );
}

export function SelectedWork({ items }: { items: PortfolioItem[] }) {
  const featured = items.filter((i) => i.is_featured).slice(0, 3);
  const list = featured.length ? featured : items.slice(0, 3);
  if (!list.length) return null;
  return (
    <Section id="work">
      <SectionIntro label="Selected work" title="Outcomes, not just outputs.">
        A few recent engagements and the numbers our clients cared about.
      </SectionIntro>
      <div className="grid gap-14">
        {list.map((item, i) => (
          <Link key={item.id} href={`/portfolio/${item.slug}`} className="group grid gap-6 md:grid-cols-2 md:items-center md:gap-12">
            <WorkCover item={item} className={`aspect-[4/3] ${i % 2 ? "md:order-2" : ""}`} />
            <div>
              <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-muted-foreground">{item.client_name}</p>
              <h3 className="mt-3 font-display text-[clamp(1.8rem,3vw,2.4rem)] leading-[1.08] tracking-tight group-hover:text-primary">{item.title}</h3>
              <p className="mt-4 max-w-md text-[15.5px] leading-relaxed text-muted-foreground">{item.summary}</p>
              {portfolioMetrics(item).length ? (
                <dl className="mt-6 flex gap-10">
                  {portfolioMetrics(item).slice(0, 2).map((m) => (
                    <div key={m.label}>
                      <dt className="text-[12.5px] text-muted-foreground">{m.label}</dt>
                      <dd className="mt-1 text-2xl font-semibold tracking-tight tabular">{m.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
              <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium">
                Read case study <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </Section>
  );
}

const STEPS = [
  { title: "Discover", body: "A focused workshop to understand goals, users and constraints. You get a written scope, milestones and a fixed price." },
  { title: "Design", body: "Flows, wireframes and high-fidelity designs, reviewed and approved in your portal before a line of production code." },
  { title: "Build", body: "Iterative development in weekly increments with a live staging link, tests and code review on every change." },
  { title: "Launch & grow", body: "Deployment, training and handover — then optional support, analytics and continuous improvement." },
];

export function Process() {
  return (
    <Section tone="muted">
      <SectionIntro label="How we work" title="A process you can see into.">
        No black boxes. Milestones, approvals and invoices live in one place, so you always know what&apos;s done, what&apos;s next and what needs your input.
      </SectionIntro>
      <ol className="grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s, i) => (
          <li key={s.title} className="bg-background p-6">
            <span className="font-mono text-[12px] text-primary">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="mt-6 text-[17px] font-medium">{s.title}</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{s.body}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

const STACK = [
  { group: "Websites & stores", items: ["Next.js", "React", "Shopify", "WordPress", "Figma"] },
  { group: "Apps & software", items: ["TypeScript", "React Native", "Node.js", "PostgreSQL", "Supabase"] },
  { group: "SEO & growth", items: ["Google Search Console", "Google Analytics 4", "Schema.org", "Google Business Profile", "Google & Meta Ads"] },
  { group: "AI & infrastructure", items: ["LLM APIs", "Workflow automation", "Vercel", "Cloudflare", "AWS"] },
];

export function TechStack() {
  return (
    <Section>
      <SectionIntro label="Technology" title="Boring where it should be. Modern where it matters.">
        We choose proven, well-supported tools so what we build is easy to maintain — by us or by your own team later.
      </SectionIntro>
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {STACK.map((g) => (
          <div key={g.group}>
            <p className="border-b pb-3 text-[13px] font-medium">{g.group}</p>
            <ul className="mt-3 space-y-2 text-[14.5px] text-muted-foreground">
              {g.items.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}

export function Testimonials({ items }: { items: Testimonial[] }) {
  if (!items.length) return null;
  const [first, ...rest] = items;
  return (
    <Section tone="muted">
      <p className="mb-10 font-mono text-[12px] uppercase tracking-[0.14em] text-muted-foreground">Client words</p>
      {first ? (
        <figure className="max-w-4xl">
          <blockquote className="font-display text-[clamp(1.8rem,3.6vw,2.8rem)] leading-[1.15] tracking-tight text-balance">“{first.quote}”</blockquote>
          <figcaption className="mt-6 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{first.author_name}</span>
            {first.author_title ? `, ${first.author_title}` : ""}
            {first.company ? ` · ${first.company}` : ""}
          </figcaption>
        </figure>
      ) : null}
      {rest.length ? (
        <div className="mt-14 grid gap-8 border-t pt-10 md:grid-cols-2">
          {rest.slice(0, 4).map((t) => (
            <figure key={t.id}>
              <blockquote className="text-[16px] leading-relaxed">“{t.quote}”</blockquote>
              <figcaption className="mt-3 text-[13px] text-muted-foreground">
                <span className="font-medium text-foreground">{t.author_name}</span>
                {t.author_title ? `, ${t.author_title}` : ""}
                {t.company ? ` · ${t.company}` : ""}
              </figcaption>
            </figure>
          ))}
        </div>
      ) : null}
    </Section>
  );
}

const REASONS = [
  { title: "Senior people, start to finish", body: "The people who scope your project are the people who build it." },
  { title: "Fixed scope, clear milestones", body: "You approve each milestone before we move on. No surprise invoices." },
  { title: "Built to rank from day one", body: "Speed, schema and clean structure are part of every build — not an add-on later." },
  { title: "Your own client portal", body: "Progress, files, approvals and invoices in one secure place." },
  { title: "Built to be maintained", body: "Documented, tested code on mainstream technology that you own." },
  { title: "Long-term partnership", body: "Support plans and continuous improvement after launch." },
];

export function WhyUs() {
  return (
    <Section>
      <SectionIntro label="Why choose us" title="What working with us feels like." />
      <dl className="grid gap-x-12 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {REASONS.map((r) => (
          <div key={r.title} className="border-t pt-5">
            <dt className="text-[16px] font-medium">{r.title}</dt>
            <dd className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">{r.body}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

export function FaqList({ faqs }: { faqs: Faq[] }) {
  if (!faqs.length) return null;
  return (
    <div className="divide-y border-y">
      {faqs.map((f) => (
        <details key={f.id} className="group py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[16.5px] font-medium [&::-webkit-details-marker]:hidden">
            {f.question}
            <span aria-hidden className="text-xl font-light text-muted-foreground transition-transform group-open:rotate-45">
              +
            </span>
          </summary>
          <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-muted-foreground">{f.answer}</p>
        </details>
      ))}
    </div>
  );
}

export function FaqSection({ faqs }: { faqs: Faq[] }) {
  if (!faqs.length) return null;
  return (
    <Section tone="muted">
      <div className="grid gap-10 md:grid-cols-[1fr_1.6fr]">
        <div>
          <p className="mb-4 font-mono text-[12px] uppercase tracking-[0.14em] text-muted-foreground">FAQ</p>
          <h2 className="font-display text-[clamp(2rem,4vw,3rem)] leading-[1.05] tracking-tight">Questions we hear often.</h2>
        </div>
        <FaqList faqs={faqs} />
      </div>
    </Section>
  );
}

export function ContactCta() {
  return (
    <section className="dark bg-background text-foreground">
      <div className="container-page py-20 sm:py-28">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr] md:items-end">
          <h2 className="font-display text-[clamp(2.4rem,5.4vw,4.4rem)] leading-[1] tracking-tight text-balance">Have a project in mind? Let&apos;s talk it through.</h2>
          <div className="space-y-6">
            <p className="text-[15.5px] leading-relaxed text-muted-foreground">
              A 30-minute call is usually enough to tell whether we&apos;re a good fit — and to give you an honest view of scope, timeline and budget.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/book-a-call">Book a call</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href={`mailto:${siteConfig.contact.email}`}>{siteConfig.contact.email}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
