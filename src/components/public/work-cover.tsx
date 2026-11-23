import Image from "next/image";
import type { PortfolioItem } from "@/features/website/queries";
import { cn } from "@/lib/utils";

/** Uses the uploaded cover image, or a typographic cover (never a fake screenshot). */
export function WorkCover({ item, className, priority }: { item: PortfolioItem; className?: string; priority?: boolean }) {
  if (item.cover_image_url) {
    return (
      <div className={cn("relative overflow-hidden rounded-lg bg-muted", className)}>
        <Image src={item.cover_image_url} alt={item.title} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" priority={priority} />
      </div>
    );
  }
  return (
    <div
      className={cn("relative flex flex-col justify-between overflow-hidden rounded-lg p-6 text-primary-foreground sm:p-8", className)}
      style={{ background: "linear-gradient(160deg, color-mix(in oklch, var(--brand) 92%, black) 0%, color-mix(in oklch, var(--brand) 70%, black) 100%)" }}
    >
      <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.14em] opacity-75">
        <span>{item.industry ?? "Case study"}</span>
        <span>{item.year ?? ""}</span>
      </div>
      <p className="max-w-md font-display text-[clamp(1.6rem,3vw,2.4rem)] leading-[1.05]">{item.title}</p>
      <div className="flex flex-wrap gap-1.5">
        {item.tech_stack.slice(0, 4).map((t) => (
          <span key={t} className="rounded-full border border-white/25 px-2.5 py-0.5 text-[11.5px] opacity-90">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
