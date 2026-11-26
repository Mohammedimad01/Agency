import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("flex size-7 items-center justify-center rounded-md bg-primary font-display text-[17px] leading-none text-primary-foreground", className)}
    >
      {siteConfig.logo.mark}
    </span>
  );
}

export function Logo({ href = "/", className, compact, subline }: { href?: string; className?: string; compact?: boolean; subline?: boolean }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5 font-semibold tracking-tight", className)} aria-label={`${siteConfig.name} home`}>
      {siteConfig.logo.src ? (
        <Image src={siteConfig.logo.src} alt={siteConfig.name} width={28} height={28} className="size-7" />
      ) : (
        <LogoMark />
      )}
      {compact ? null : subline && siteConfig.logo.subline ? (
        <span className="flex flex-col leading-none">
          <span className="text-[16px]">{siteConfig.name}</span>
          <span className="mt-1 font-mono text-[9.5px] font-normal uppercase tracking-[0.18em] text-muted-foreground">{siteConfig.logo.subline}</span>
        </span>
      ) : (
        <span className="text-[15px]">{siteConfig.name}</span>
      )}
    </Link>
  );
}
