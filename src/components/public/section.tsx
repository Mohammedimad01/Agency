import { cn } from "@/lib/utils";

export function Section({ id, className, children, tone = "default" }: { id?: string; className?: string; children: React.ReactNode; tone?: "default" | "muted" | "dark" }) {
  return (
    <section
      id={id}
      className={cn(
        "py-20 sm:py-28",
        tone === "muted" && "bg-surface",
        tone === "dark" && "dark bg-background text-foreground",
        className,
      )}
    >
      <div className="container-page">{children}</div>
    </section>
  );
}

export function SectionIntro({ label, title, children, className }: { label?: string; title: React.ReactNode; children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mb-12 grid gap-6 md:grid-cols-[1fr_1.1fr] md:items-end", className)}>
      <div>
        {label ? <p className="mb-4 font-mono text-[12px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p> : null}
        <h2 className="font-display text-[clamp(2rem,4.2vw,3.1rem)] leading-[1.05] tracking-tight text-balance">{title}</h2>
      </div>
      {children ? <div className="max-w-lg text-[15.5px] leading-relaxed text-muted-foreground md:justify-self-end">{children}</div> : null}
    </div>
  );
}

export function PageHero({ label, title, children }: { label?: string; title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <section className="border-b">
      <div className="container-page pb-16 pt-16 sm:pb-20 sm:pt-24">
        {label ? <p className="mb-5 font-mono text-[12px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p> : null}
        <h1 className="max-w-4xl font-display text-[clamp(2.6rem,6vw,4.6rem)] leading-[1.02] tracking-tight text-balance">{title}</h1>
        {children ? <div className="mt-6 max-w-2xl text-[17px] leading-relaxed text-muted-foreground">{children}</div> : null}
      </div>
    </section>
  );
}
