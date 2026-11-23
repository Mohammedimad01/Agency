"use client";
import * as React from "react";
import { Select as P } from "radix-ui";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Select = P.Root;
export const SelectValue = P.Value;
export const SelectGroup = P.Group;

export function SelectTrigger({ className, children, ...props }: React.ComponentProps<typeof P.Trigger>) {
  return (
    <P.Trigger
      className={cn(
        "flex h-9 w-full items-center justify-between gap-2 whitespace-nowrap rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive data-[placeholder]:text-muted-foreground/70 [&>span]:truncate",
        className,
      )}
      {...props}
    >
      {children}
      <P.Icon asChild>
        <ChevronDown className="size-4 opacity-50" />
      </P.Icon>
    </P.Trigger>
  );
}
export function SelectContent({ className, children, position = "popper", ...props }: React.ComponentProps<typeof P.Content>) {
  return (
    <P.Portal>
      <P.Content
        position={position}
        className={cn(
          "relative z-50 max-h-80 min-w-[8rem] overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=open]:fade-in-0",
          position === "popper" && "w-full min-w-[var(--radix-select-trigger-width)] data-[side=bottom]:translate-y-1",
          className,
        )}
        {...props}
      >
        <P.Viewport className="p-1">{children}</P.Viewport>
      </P.Content>
    </P.Portal>
  );
}
export function SelectItem({ className, children, ...props }: React.ComponentProps<typeof P.Item>) {
  return (
    <P.Item
      className={cn("relative flex w-full cursor-default select-none items-center rounded-md py-1.5 pl-2 pr-8 text-[13px] outline-none focus:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className)}
      {...props}
    >
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        <P.ItemIndicator>
          <Check className="size-3.5" />
        </P.ItemIndicator>
      </span>
      <P.ItemText>{children}</P.ItemText>
    </P.Item>
  );
}
