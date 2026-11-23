import Link from "next/link";
import { cn } from "@/lib/utils";

/** URL-driven tabs (server-rendered, shareable, back-button friendly). */
export function TabNav({ tabs, active, baseHref }: { tabs: { key: string; label: string; count?: number }[]; active: string; baseHref: string }) {
  return (
    <nav className="-mx-1 mb-5 flex gap-1 overflow-x-auto border-b px-1" aria-label="Sections">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.key === tabs[0]?.key ? baseHref : `${baseHref}?tab=${t.key}`}
          aria-current={active === t.key ? "page" : undefined}
          className={cn(
            "-mb-px flex shrink-0 items-center gap-1.5 border-b-2 border-transparent px-2.5 pb-2.5 pt-1 text-[13.5px] text-muted-foreground hover:text-foreground",
            active === t.key && "border-primary font-medium text-foreground",
          )}
        >
          {t.label}
          {t.count ? <span className="rounded-full bg-muted px-1.5 text-[11px] tabular">{t.count}</span> : null}
        </Link>
      ))}
    </nav>
  );
}
