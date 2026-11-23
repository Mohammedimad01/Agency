import { Badge } from "@/components/ui/badge";
import type { Variant } from "@/lib/status";

export function StatusBadge<K extends string>({
  status,
  map,
  className,
  dot = true,
}: {
  status: K | null | undefined;
  map: Record<K, { label: string; variant: Variant }>;
  className?: string;
  dot?: boolean;
}) {
  if (!status) return <span className="text-muted-foreground">—</span>;
  const def = map[status] ?? { label: String(status), variant: "neutral" as Variant };
  return (
    <Badge variant={def.variant} className={className}>
      {dot ? <span aria-hidden className="size-1.5 rounded-full bg-current opacity-80" /> : null}
      {def.label}
    </Badge>
  );
}
