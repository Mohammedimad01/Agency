import { cn } from "@/lib/utils";

export function Section({ id, className, children, tone = "default" }: { id?: string; className?: string; children: React.ReactNode; tone?: "default" | "muted" | "dark" }) {
  if (tone === "dark") {
    return (
      <section id={id} className={cn("px-2 py-2 sm:px-3", className)}>
        <div className="dark relative overflow-hidden rounded-[28px] bg-ink py-20 text-ink-foreground sm:py-28">
          <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 size-[520px] rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--brand)_45%,transparent),transparent_65%)] opacity-60" />
          <div className="container-page relative">{children}</div>
        </div>
      </section>
    );
  }
  return (
    <section id={id} className={cn("py-20 sm:py-28", tone === "muted" && "bg-paper", className)}>
      <div className="container-page">{children}</div>
    </section>
  );
}

/** Erlyst section label: mono index + label, e.g. "01 — What we build". */
export function Eyebrow({ index, children, className }: { index?: string; children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("mb-5 flex h-fit items-center gap-2.5 self-start font-mono text-[11.5px] uppercase tracking-[0.16em] text-muted-foreground", className)}>
      {index ? <span className="text-primary">{index}</span> : <span className="size-1.5 rounded-full bg-primary" />}
      <span className="h-px w-6 bg-current opacity-40" />
      {children}
    </p>
  );
}

export function SectionIntro({ label, index, title, children, className }: { label?: string; index?: string; title: React.ReactNode; children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mb-12 grid gap-6 md:grid-cols-[1.15fr_1fr] md:items-end", className)}>
      <div>
        {label ? <Eyebrow index={index}>{label}</Eyebrow> : null}
        <h2 className="font-display text-[clamp(2.1rem,4.4vw,3.4rem)] leading-[1.02] text-balance">{title}</h2>
      </div>
      {children ? <div className="max-w-lg text-[16px] leading-relaxed text-muted-foreground md:justify-self-end">{children}</div> : null}
    </div>
  );
}

export function PageHero({ label, title, children, aside }: { label?: string; title: React.ReactNode; children?: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section className="px-2 pt-2 sm:px-3">
      <div className="relative overflow-hidden rounded-[28px] bg-paper">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-32 size-[420px] rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--signal)_35%,transparent),transparent_65%)] opacity-50" />
        <div className={cn("container-page relative grid gap-10 pb-16 pt-14 sm:pb-20 sm:pt-20", aside && "lg:grid-cols-[1.25fr_1fr] lg:items-center")}>
          <div>
            {label ? <Eyebrow>{label}</Eyebrow> : null}
            <h1 className="max-w-4xl font-display text-[clamp(2.5rem,5.8vw,4.5rem)] leading-[1] text-balance">{title}</h1>
            {children ? <div className="mt-6 max-w-2xl text-[17px] leading-relaxed text-muted-foreground">{children}</div> : null}
          </div>
          {aside}
        </div>
      </div>
    </section>
  );
}
