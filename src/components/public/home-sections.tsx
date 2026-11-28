import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Code, Gauge, MessageCircle, ReceiptText, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow, Section, SectionIntro } from "@/components/public/section";
import { WorkCover } from "@/components/public/work-cover";
import { ServiceIcon } from "@/components/shared/icon";
import { BrowserMockup, HeroVisual, InvoiceCard, RankingCard, TrafficCard } from "@/components/public/visuals";
import { portfolioMetrics, type Faq, type PortfolioItem, type PublicService, type Testimonial } from "@/features/website/queries";
import { groupServices } from "@/features/website/service-groups";
import { GOAL_GUIDE } from "@/config/content";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export function whatsappHref(text = "Hi Erlyst, I'd like to talk about a project.") {
  return siteConfig.contact.whatsapp ? `https://wa.me/${siteConfig.contact.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(text)}` : null;
}

export function Hero(_props: { services?: PublicService[] }) {
  return (
    <section className="px-2 pt-2 sm:px-3">
      <div className="dark relative overflow-hidden rounded-[28px] bg-ink text-ink-foreground">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(var(--ink-foreground)_1px,transparent_1px)] [background-size:22px_22px]" />
        <div aria-hidden className="pointer-events-none absolute -bottom-48 -left-40 size-[620px] rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--brand)_55%,transparent),transparent_65%)] opacity-70" />
        <div className="container-page relative grid gap-12 pb-16 pt-14 sm:pb-24 sm:pt-20 lg:grid-cols-[1.05fr_1fr] lg:items-center">
          <div>
            <p className="inline-flex animate-fade-up items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-foreground/80">
              <span className="size-1.5 rounded-full bg-signal" /> Web · Apps · SEO studio
            </p>
            <h1 className="mt-6 animate-fade-up font-display text-[clamp(2.6rem,5.6vw,4.7rem)] leading-[0.98] text-balance [animation-delay:80ms]">
              Websites, apps and search visibility that{" "}
              <span className="font-serif text-[1.08em] font-normal italic tracking-normal text-signal">grow</span> your business.
            </h1>
            <p className="mt-6 max-w-xl animate-fade-up text-[17px] leading-relaxed text-ink-foreground/70 [animation-delay:140ms]">
              {siteConfig.name} designs and builds fast websites, online stores, custom apps and business software — then gets you found on Google, in maps and in AI answers.
            </p>
            <div className="mt-9 flex animate-fade-up flex-wrap gap-3 [animation-delay:200ms]">
              <Button size="lg" asChild className="rounded-full bg-signal px-6 font-semibold text-ink hover:bg-signal/90">
                <Link href="/contact?type=brief">
                  Get a free quote <ArrowRight />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="rounded-full border-white/20 bg-transparent px-6 text-ink-foreground hover:bg-white/10 hover:text-ink-foreground">
                <Link href="/services">Explore services</Link>
              </Button>
            </div>
            <ul className="mt-9 grid animate-fade-up gap-2.5 text-[13.5px] text-ink-foreground/75 [animation-delay:260ms] sm:grid-cols-2">
              {["Fixed written quotes", "SEO built into every site", "Milestones you can review", "Reply within one business day"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Check className="size-4 text-signal" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="animate-fade-up [animation-delay:200ms]">
            <HeroVisual />
          </div>
        </div>
      </div>
    </section>
  );
}

const CAPABILITIES = ["Web development", "E-commerce", "UI/UX design", "Custom web apps", "Mobile apps", "Invoicing & quotation apps", "ERP software", "SEO", "Local SEO", "AI search (GEO & AEO)", "Digital marketing", "AI automation"];

export function CapabilityMarquee() {
  const row = [...CAPABILITIES, ...CAPABILITIES];
  return (
    <div className="relative overflow-hidden border-b py-6" aria-label="What we do">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-background to-transparent" />
      <ul className="flex w-max animate-marquee gap-10 motion-reduce:animate-none">
        {row.map((c, i) => (
          <li key={i} aria-hidden={i >= CAPABILITIES.length} className="flex items-center gap-10 whitespace-nowrap font-display text-[22px] text-foreground/70">
            {c}
            <span className="size-2 rotate-45 rounded-[2px] bg-primary/60" />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Intro() {
  return (
    <Section>
      <div className="grid gap-12 md:grid-cols-[0.8fr_2fr]">
        <Eyebrow>Who we are</Eyebrow>
        <div>
          <p className="font-display text-[clamp(1.7rem,3.2vw,2.6rem)] leading-[1.15] text-balance">
            An independent studio for businesses that want their website, software and search presence built properly — by the same people, from first call to first page.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              { icon: Code, t: "Build", d: "Websites, stores and custom software engineered to be fast, secure and easy to run." },
              { icon: Search, t: "Get found", d: "SEO, local SEO and AI search optimisation planned into every build." },
              { icon: Gauge, t: "Grow", d: "Clear reporting, ongoing care and improvements that compound month after month." },
            ].map((x) => (
              <div key={x.t} className="border-t pt-5">
                <x.icon className="size-5 text-primary" />
                <p className="mt-4 text-[17px] font-semibold">{x.t}</p>
                <p className="mt-1.5 text-[14.5px] leading-relaxed text-muted-foreground">{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

const GROUP_VISUAL: Record<string, React.ReactNode> = {
  Websites: <BrowserMockup className="w-[88%] translate-y-6 rotate-[-2deg]" />,
  "Custom apps & software": <InvoiceCard className="w-[78%] translate-y-6 rotate-[2deg]" />,
  "SEO & growth": (
    <div className="relative w-[88%] translate-y-4">
      <RankingCard className="w-full" />
      <TrafficCard className="absolute -bottom-4 right-0 w-40 rotate-[3deg]" />
    </div>
  ),
};

export function ServiceGroups({ services }: { services: PublicService[] }) {
  const { groups, more } = groupServices(services);
  return (
    <div className="grid gap-5">
      <div className="grid gap-5 lg:grid-cols-3">
        {groups.map((g) => (
          <div key={g.category} className="group/card flex flex-col overflow-hidden rounded-[22px] border bg-background">
            <div className="relative flex h-48 items-end justify-center overflow-hidden bg-paper" aria-hidden>
              <div aria-hidden className="absolute inset-0 opacity-60 [background-image:radial-gradient(color-mix(in_oklch,var(--foreground)_12%,transparent)_1px,transparent_1px)] [background-size:16px_16px]" />
              {GROUP_VISUAL[g.category] ?? null}
            </div>
            <div className="flex flex-1 flex-col p-6 sm:p-7">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                  <ServiceIcon name={g.icon} className="size-4 text-primary" />
                </span>
                <h3 className="font-display text-[22px] leading-tight">{g.label}</h3>
              </div>
              <p className="mt-3 text-[14.5px] text-muted-foreground">{g.blurb}</p>
              <ul className="mt-5 grid gap-0.5">
                {g.services.map((sv) => (
                  <li key={sv.id}>
                    <Link href={`/services/${sv.slug}`} className="group -mx-2 flex items-start justify-between gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent">
                      <span>
                        <span className="block text-[15px] font-medium group-hover:text-primary">{sv.name}</span>
                        {sv.summary ? <span className="block text-[13px] text-muted-foreground">{sv.summary}</span> : null}
                      </span>
                      <ArrowUpRight className="mt-1 size-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
      {more.length ? (
        <div className="flex flex-col gap-4 rounded-[22px] border bg-paper p-5 sm:flex-row sm:items-center">
          <p className="shrink-0 font-mono text-[11.5px] uppercase tracking-[0.16em] text-muted-foreground">Also from {siteConfig.name}</p>
          <ul className="flex flex-wrap gap-2">
            {more.map((sv) => (
              <li key={sv.id}>
                <Link href={`/services/${sv.slug}`} className="inline-flex items-center gap-2 rounded-full border bg-background px-3.5 py-2 text-[13.5px] font-medium transition-colors hover:border-primary/40 hover:text-primary">
                  <ServiceIcon name={sv.icon} className="size-3.5 text-primary" />
                  {sv.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function ServicesOverview({ services }: { services: PublicService[] }) {
  if (!services.length) return null;
  return (
    <Section id="services">
      <SectionIntro index="01" label="What we build" title="Build it, launch it, get it found.">
        One team for your website, your software and your search visibility — so everything is fast, usable and visible from day one.
      </SectionIntro>
      <ServiceGroups services={services} />
    </Section>
  );
}

export function GoalGuide() {
  return (
    <Section tone="muted">
      <SectionIntro index="02" label="Start here" title="Not sure what you need?">
        Pick the goal that sounds most like yours. Most businesses start with one service and add the rest as they grow.
      </SectionIntro>
      <div className="overflow-hidden rounded-[22px] border bg-background">
        <div className="hidden grid-cols-[1.2fr_1fr_1.2fr] gap-6 border-b bg-ink px-6 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-foreground/70 md:grid">
          <span>If your goal is to…</span>
          <span className="text-signal">Start with</span>
          <span>Then add</span>
        </div>
        <ul className="divide-y">
          {GOAL_GUIDE.map((g) => (
            <li key={g.goal} className="grid gap-2 px-6 py-5 md:grid-cols-[1.2fr_1fr_1.2fr] md:items-center md:gap-6">
              <span className="text-[16px] font-medium">{g.goal}</span>
              <span className="flex flex-wrap gap-2">
                {g.start.map((s) => (
                  <Link key={s.slug} href={`/services/${s.slug}`} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-[13.5px] font-medium text-primary hover:bg-primary/15">
                    {s.label} <ArrowUpRight className="size-3.5" />
                  </Link>
                ))}
              </span>
              <span className="text-[14.5px] text-muted-foreground">{g.then}</span>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

export function SelectedWork({ items }: { items: PortfolioItem[] }) {
  const featured = items.filter((i) => i.is_featured).slice(0, 3);
  const list = featured.length ? featured : items.slice(0, 3);
  if (!list.length) return null;
  return (
    <Section>
      <SectionIntro label="Selected work" title="Outcomes, not just outputs.">
        A few recent engagements and the numbers our clients cared about.
      </SectionIntro>
      <div className="grid gap-14">
        {list.map((item, i) => (
          <Link key={item.id} href={`/portfolio/${item.slug}`} className="group grid gap-6 md:grid-cols-2 md:items-center md:gap-12">
            <WorkCover item={item} className={cn("aspect-[4/3]", i % 2 && "md:order-2")} />
            <div>
              <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-muted-foreground">{item.client_name}</p>
              <h3 className="mt-3 font-display text-[clamp(1.8rem,3vw,2.4rem)] leading-[1.08] group-hover:text-primary">{item.title}</h3>
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
            </div>
          </Link>
        ))}
      </div>
    </Section>
  );
}

const REASONS = [
  { icon: Code, title: "The builders scope the work", body: "The people who quote your project are the people who build it. No hand-offs, no jargon." },
  { icon: ReceiptText, title: "Fixed, written quotes", body: "Scope, price and milestones in writing before work starts. No surprise invoices." },
  { icon: Search, title: "SEO from the first line of code", body: "Speed, structure, schema and Search Console are part of every build, not an add-on." },
  { icon: ShieldCheck, title: "You own everything", body: "Your domain, your code and your data. Documented, on mainstream technology." },
];

export function WhyUs() {
  return (
    <Section>
      <SectionIntro index="03" label={`Why ${siteConfig.name}`} title="Built properly. Explained plainly.">
        Small enough that you talk to the people doing the work, rigorous enough that it keeps working after launch.
      </SectionIntro>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {REASONS.map((r) => (
          <div key={r.title} className="rounded-[22px] border bg-background p-6 transition-colors hover:border-primary/30">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
              <r.icon className="size-5 text-primary" />
            </span>
            <h3 className="mt-6 text-[17px] font-semibold leading-snug">{r.title}</h3>
            <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">{r.body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

const STEPS = [
  { title: "Discovery call", body: "A 30-minute call about your goals, customers and budget. Bring a brief, a sketch or just a problem." },
  { title: "Fixed quote", body: "A written scope with price and milestones, so you know exactly what you get before work starts." },
  { title: "Design & build", body: "You review working pages and screens along the way — not just static mock-ups." },
  { title: "Launch & index", body: "Go live with analytics, sitemap and Search Console set up, so Google finds you straight away." },
  { title: "Support & growth", body: "Optional care plans for updates and backups, plus SEO and marketing to keep enquiries coming." },
];

export function Process() {
  return (
    <Section tone="dark">
      <SectionIntro index="04" label="How we work" title="Five steps, something to review at each.">
        No black boxes. Every project moves through the same clear stages, with your sign-off before the next one starts.
      </SectionIntro>
      <ol className="grid gap-4 md:grid-cols-5">
        {STEPS.map((s, i) => (
          <li key={s.title} className="relative rounded-[20px] border border-white/10 bg-white/[0.04] p-5">
            <span className="font-mono text-[12px] text-signal">Step {String(i + 1).padStart(2, "0")}</span>
            <h3 className="mt-8 text-[17px] font-semibold text-ink-foreground">{s.title}</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-foreground/65">{s.body}</p>
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
    <Section tone="muted">
      <SectionIntro index="05" label="Technology" title="Proven tools, chosen for the long run.">
        Mainstream, well-supported technology so your site and software are easy to maintain — by us or by your own team later.
      </SectionIntro>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STACK.map((g) => (
          <div key={g.group} className="rounded-[22px] border bg-background p-6">
            <p className="font-mono text-[11.5px] uppercase tracking-[0.14em] text-primary">{g.group}</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {g.items.map((i) => (
                <li key={i} className="rounded-full border px-3 py-1 text-[13px] text-foreground/80">
                  {i}
                </li>
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
  return (
    <Section>
      <SectionIntro label="Client words" title="What clients say." />
      <div className="grid gap-4 md:grid-cols-3">
        {items.slice(0, 6).map((t) => (
          <figure key={t.id} className="flex flex-col justify-between rounded-[22px] border bg-background p-6">
            <blockquote className="text-[15.5px] leading-relaxed">“{t.quote}”</blockquote>
            <figcaption className="mt-6 text-[13px] text-muted-foreground">
              <span className="font-semibold text-foreground">{t.author_name}</span>
              {t.author_title ? `, ${t.author_title}` : ""}
              {t.company ? ` · ${t.company}` : ""}
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  );
}

export function FaqList({ faqs }: { faqs: Faq[] }) {
  if (!faqs.length) return null;
  return (
    <div className="grid gap-3">
      {faqs.map((f, i) => (
        <details key={f.id} open={i === 0} className="group rounded-2xl border bg-background px-5 py-4 open:border-primary/30 open:shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[16px] font-medium [&::-webkit-details-marker]:hidden">
            {f.question}
            <span aria-hidden className="flex size-7 shrink-0 items-center justify-center rounded-full border text-lg leading-none text-muted-foreground transition-transform group-open:rotate-45 group-open:border-primary group-open:bg-primary group-open:text-primary-foreground">
              +
            </span>
          </summary>
          <p className="mt-3 max-w-3xl pr-10 text-[15px] leading-relaxed text-muted-foreground">{f.answer}</p>
        </details>
      ))}
    </div>
  );
}

export function FaqSection({ faqs }: { faqs: Faq[] }) {
  if (!faqs.length) return null;
  return (
    <Section>
      <div className="grid gap-10 md:grid-cols-[1fr_1.7fr]">
        <div>
          <Eyebrow index="06">FAQ</Eyebrow>
          <h2 className="font-display text-[clamp(2.1rem,4vw,3.2rem)] leading-[1.02]">Questions we hear most.</h2>
          <p className="mt-4 max-w-sm text-[15px] text-muted-foreground">
            Can&apos;t find your answer?{" "}
            <a href={`mailto:${siteConfig.contact.email}`} className="font-medium text-primary hover:underline">
              Email us
            </a>
            .
          </p>
        </div>
        <FaqList faqs={faqs} />
      </div>
    </Section>
  );
}

export function ContactCta() {
  const wa = whatsappHref();
  return (
    <section className="px-2 py-2 sm:px-3">
      <div className="dark relative overflow-hidden rounded-[28px] bg-ink text-ink-foreground">
        <div aria-hidden className="pointer-events-none absolute -right-32 -top-40 size-[560px] rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--signal)_40%,transparent),transparent_62%)] opacity-40" />
        <div className="container-page relative grid gap-10 py-20 sm:py-24 md:grid-cols-[1.4fr_1fr] md:items-end">
          <div>
            <Eyebrow className="text-ink-foreground/60">Let&apos;s talk</Eyebrow>
            <h2 className="font-display text-[clamp(2.4rem,5.4vw,4.4rem)] leading-[1] text-balance">
              Have a project in mind? <span className="font-serif font-normal italic tracking-normal text-signal">Let&apos;s build it.</span>
            </h2>
          </div>
          <div className="space-y-6">
            <p className="text-[16px] leading-relaxed text-ink-foreground/70">
              A 30-minute call is usually enough to agree scope, timeline and budget. You&apos;ll get a fixed written quote afterwards.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild className="rounded-full bg-signal px-6 font-semibold text-ink hover:bg-signal/90">
                <Link href="/book-a-call">
                  Book a free call <ArrowRight />
                </Link>
              </Button>
              {wa ? (
                <Button size="lg" variant="outline" asChild className="rounded-full border-white/20 bg-transparent text-ink-foreground hover:bg-white/10 hover:text-ink-foreground">
                  <a href={wa} target="_blank" rel="noreferrer">
                    <MessageCircle /> WhatsApp
                  </a>
                </Button>
              ) : (
                <Button size="lg" variant="outline" asChild className="rounded-full border-white/20 bg-transparent text-ink-foreground hover:bg-white/10 hover:text-ink-foreground">
                  <a href={`mailto:${siteConfig.contact.email}`}>{siteConfig.contact.email}</a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
