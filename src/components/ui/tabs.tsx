"use client";
import * as React from "react";
import { Tabs as P } from "radix-ui";
import { cn } from "@/lib/utils";

export const Tabs = P.Root;
export function TabsList({ className, ...props }: React.ComponentProps<typeof P.List>) {
  return <P.List className={cn("inline-flex h-9 items-center gap-1 rounded-lg bg-muted p-1 text-muted-foreground", className)} {...props} />;
}
export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof P.Trigger>) {
  return (
    <P.Trigger
      className={cn(
        "inline-flex h-7 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 text-[13px] font-medium outline-none transition-all focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        className,
      )}
      {...props}
    />
  );
}
export function TabsContent({ className, ...props }: React.ComponentProps<typeof P.Content>) {
  return <P.Content className={cn("outline-none", className)} {...props} />;
}
