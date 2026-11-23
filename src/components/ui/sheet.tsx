"use client";
import * as React from "react";
import { Dialog as P } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Sheet = P.Root;
export const SheetTrigger = P.Trigger;
export const SheetClose = P.Close;

export function SheetContent({ className, children, side = "right", ...props }: React.ComponentProps<typeof P.Content> & { side?: "left" | "right" }) {
  return (
    <P.Portal>
      <P.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
      <P.Content
        className={cn(
          "fixed inset-y-0 z-50 flex w-[88%] max-w-md flex-col gap-4 overflow-y-auto bg-background p-6 shadow-xl transition ease-in-out data-[state=open]:animate-in data-[state=open]:duration-300 data-[state=closed]:animate-out data-[state=closed]:duration-200",
          side === "right"
            ? "right-0 border-l data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right"
            : "left-0 border-r data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left",
          className,
        )}
        {...props}
      >
        {children}
        <P.Close className="absolute right-4 top-4 rounded-sm opacity-60 hover:opacity-100">
          <X className="size-4" />
          <span className="sr-only">Close</span>
        </P.Close>
      </P.Content>
    </P.Portal>
  );
}
export function SheetTitle({ className, ...props }: React.ComponentProps<typeof P.Title>) {
  return <P.Title className={cn("text-base font-semibold", className)} {...props} />;
}
export function SheetDescription({ className, ...props }: React.ComponentProps<typeof P.Description>) {
  return <P.Description className={cn("text-sm text-muted-foreground", className)} {...props} />;
}
