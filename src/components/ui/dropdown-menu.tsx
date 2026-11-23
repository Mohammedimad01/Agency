"use client";
import * as React from "react";
import { DropdownMenu as P } from "radix-ui";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const DropdownMenu = P.Root;
export const DropdownMenuTrigger = P.Trigger;
export const DropdownMenuGroup = P.Group;
export const DropdownMenuRadioGroup = P.RadioGroup;

export function DropdownMenuContent({ className, sideOffset = 6, ...props }: React.ComponentProps<typeof P.Content>) {
  return (
    <P.Portal>
      <P.Content
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-[10rem] overflow-hidden rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          className,
        )}
        {...props}
      />
    </P.Portal>
  );
}
export function DropdownMenuItem({ className, destructive, ...props }: React.ComponentProps<typeof P.Item> & { destructive?: boolean }) {
  return (
    <P.Item
      className={cn(
        "relative flex cursor-default select-none items-center gap-2 rounded-md px-2 py-1.5 text-[13px] outline-none transition-colors focus:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:size-4 [&_svg]:text-muted-foreground",
        destructive && "text-destructive focus:bg-destructive/10 [&_svg]:text-destructive",
        className,
      )}
      {...props}
    />
  );
}
export function DropdownMenuRadioItem({ className, children, ...props }: React.ComponentProps<typeof P.RadioItem>) {
  return (
    <P.RadioItem className={cn("relative flex cursor-default select-none items-center gap-2 rounded-md py-1.5 pl-7 pr-2 text-[13px] outline-none focus:bg-accent", className)} {...props}>
      <span className="absolute left-2 flex size-3.5 items-center justify-center">
        <P.ItemIndicator>
          <Check className="size-3.5" />
        </P.ItemIndicator>
      </span>
      {children}
    </P.RadioItem>
  );
}
export function DropdownMenuLabel({ className, ...props }: React.ComponentProps<typeof P.Label>) {
  return <P.Label className={cn("px-2 py-1.5 text-xs font-medium text-muted-foreground", className)} {...props} />;
}
export function DropdownMenuSeparator({ className, ...props }: React.ComponentProps<typeof P.Separator>) {
  return <P.Separator className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />;
}
