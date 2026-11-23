import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  href,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: LucideIcon;
  tone?: "default" | "positive" | "negative" | "warning";
  href?: string;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <p className="text-[12.5px] font-medium text-muted-foreground">{label}</p>
        {Icon ? <Icon className="size-4 text-muted-foreground/70" /> : null}
      </div>
      <p className="mt-2 text-[22px] font-semibold tracking-tight tabular">{value}</p>
      {hint ? (
        <p
          className={cn(
            "mt-1 text-[12px]",
            tone === "positive" && "text-success",
            tone === "negative" && "text-destructive",
            tone === "warning" && "text-[color-mix(in_oklch,var(--warning)_60%,black)] dark:text-warning",
            tone === "default" && "text-muted-foreground",
          )}
        >
          {hint}
        </p>
      ) : null}
    </>
  );
  const cls = "block rounded-lg border bg-card px-4 py-3.5 transition-colors";
  return href ? (
    <Link href={href} className={cn(cls, "hover:border-foreground/20")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
