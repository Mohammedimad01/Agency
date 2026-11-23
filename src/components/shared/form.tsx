"use client";
import * as React from "react";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { LoaderCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  className,
  children,
}: {
  label?: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  // Associate the label (and help/error text) with the single child control automatically.
  const autoId = React.useId();
  const child = React.isValidElement<{ id?: string; "aria-describedby"?: string; "aria-invalid"?: boolean }>(children) ? children : null;
  const controlId = htmlFor ?? child?.props.id ?? autoId;
  const messageId = `${controlId}-message`;
  const message = error ?? hint;
  const control =
    child && typeof child.type !== "symbol"
      ? React.cloneElement(child, {
          id: controlId,
          "aria-describedby": message ? messageId : child.props["aria-describedby"],
          "aria-invalid": error ? true : child.props["aria-invalid"],
        })
      : children;
  return (
    <div className={cn("grid gap-1.5", className)}>
      {label ? (
        <Label htmlFor={controlId}>
          {label}
          {required ? <span className="text-destructive">*</span> : null}
        </Label>
      ) : null}
      {control}
      {error ? (
        <p id={messageId} role="alert" className="text-[12px] text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="text-[12px] text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Copies server-side field errors into react-hook-form. */
export function applyFieldErrors<T extends FieldValues>(form: UseFormReturn<T>, fieldErrors?: Record<string, string[] | undefined>) {
  if (!fieldErrors) return;
  for (const [key, messages] of Object.entries(fieldErrors)) {
    if (messages?.[0]) form.setError(key as Path<T>, { type: "server", message: messages[0] });
  }
}

export function SubmitButton({ pending, children, className, ...props }: React.ComponentProps<typeof Button> & { pending?: boolean }) {
  return (
    <Button type="submit" disabled={pending || props.disabled} className={className} {...props}>
      {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
      {children}
    </Button>
  );
}

/** Native <select> styled like inputs: keyboard-friendly, works inside RHF with register(). */
export const NativeSelect = React.forwardRef<HTMLSelectElement, React.ComponentProps<"select">>(function NativeSelect(
  { className, children, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(
        "flex h-9 w-full appearance-none rounded-md border border-input bg-background bg-[length:16px] bg-[right_0.6rem_center] bg-no-repeat px-3 pr-8 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50 aria-invalid:border-destructive",
        "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")]",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});
