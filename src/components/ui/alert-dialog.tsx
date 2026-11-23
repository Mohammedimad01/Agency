"use client";
import * as React from "react";
import { AlertDialog as P } from "radix-ui";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export const AlertDialog = P.Root;
export const AlertDialogTrigger = P.Trigger;

export function AlertDialogContent({ className, ...props }: React.ComponentProps<typeof P.Content>) {
  return (
    <P.Portal>
      <P.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
      <P.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 grid w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl border bg-background p-6 shadow-xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.98]",
          className,
        )}
        {...props}
      />
    </P.Portal>
  );
}
export const AlertDialogHeader = ({ className, ...props }: React.ComponentProps<"div">) => <div className={cn("flex flex-col gap-1.5", className)} {...props} />;
export const AlertDialogFooter = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />
);
export function AlertDialogTitle({ className, ...props }: React.ComponentProps<typeof P.Title>) {
  return <P.Title className={cn("text-base font-semibold", className)} {...props} />;
}
export function AlertDialogDescription({ className, ...props }: React.ComponentProps<typeof P.Description>) {
  return <P.Description className={cn("text-sm text-muted-foreground", className)} {...props} />;
}
export function AlertDialogAction({ className, destructive, ...props }: React.ComponentProps<typeof P.Action> & { destructive?: boolean }) {
  return <P.Action className={cn(buttonVariants({ variant: destructive ? "destructive" : "default" }), className)} {...props} />;
}
export function AlertDialogCancel({ className, ...props }: React.ComponentProps<typeof P.Cancel>) {
  return <P.Cancel className={cn(buttonVariants({ variant: "outline" }), className)} {...props} />;
}
