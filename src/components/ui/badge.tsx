import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1 whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[11.5px] font-medium leading-4 [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/10 text-primary",
        neutral: "border-transparent bg-muted text-muted-foreground",
        outline: "text-foreground",
        success: "border-transparent bg-success/12 text-[color-mix(in_oklch,var(--success)_75%,black)] dark:text-success",
        warning: "border-transparent bg-warning/18 text-[color-mix(in_oklch,var(--warning)_55%,black)] dark:text-warning",
        danger: "border-transparent bg-destructive/10 text-destructive",
        info: "border-transparent bg-info/12 text-[color-mix(in_oklch,var(--info)_75%,black)] dark:text-info",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export function Badge({ className, variant, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}
