import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/** Erlyst mark: three stacked bars forming an "E", the top bar in the signal colour. */
export function LogoMark({ className, inverted }: { className?: string; inverted?: boolean }) {
  return (
    <span aria-hidden className={cn("flex size-8 items-center justify-center rounded-[9px] bg-ink", inverted && "bg-white/10 ring-1 ring-white/15", className)}>
      <svg viewBox="0 0 20 20" className="size-[18px]">
        <rect x="4" y="3.5" width="12" height="3" rx="1.5" fill="var(--signal)" />
        <rect x="4" y="8.5" width="8.5" height="3" rx="1.5" fill="var(--ink-foreground)" />
        <rect x="4" y="13.5" width="12" height="3" rx="1.5" fill="var(--ink-foreground)" />
      </svg>
    </span>
  );
}

export function Logo({ href = "/", className, compact, subline, inverted }: { href?: string; className?: string; compact?: boolean; subline?: boolean; inverted?: boolean }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5 font-semibold tracking-tight", inverted && "text-ink-foreground", className)} aria-label={`${siteConfig.name} home`}>
      {siteConfig.logo.src ? <Image src={siteConfig.logo.src} alt={siteConfig.name} width={32} height={32} className="size-8" /> : <LogoMark inverted={inverted} />}
      {compact ? null : subline && siteConfig.logo.subline ? (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[19px] !tracking-[-0.03em]">{siteConfig.name}</span>
          <span className={cn("mt-1 font-mono text-[9px] font-normal uppercase tracking-[0.2em]", inverted ? "text-ink-foreground/60" : "text-muted-foreground")}>{siteConfig.logo.subline}</span>
        </span>
      ) : (
        <span className="font-display text-[17px] !tracking-[-0.03em]">{siteConfig.name}</span>
      )}
    </Link>
  );
}
