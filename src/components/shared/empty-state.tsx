import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-lg border border-dashed text-center", compact ? "px-4 py-8" : "px-6 py-14", className)}>
      {Icon ? (
        <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted">
          <Icon className="size-[18px] text-muted-foreground" />
        </div>
      ) : null}
      <p className="text-sm font-medium">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-[13px] text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
