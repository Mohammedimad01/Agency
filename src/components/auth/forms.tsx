"use client";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Field, NativeSelect, SubmitButton, applyFieldErrors } from "@/components/shared/form";
import { acceptInvitation, completeSetup, requestPasswordReset, signIn, updatePassword } from "@/features/auth/actions";
import { acceptInviteSchema, forgotSchema, loginSchema, resetSchema, setupSchema } from "@/features/auth/schemas";

type Result = { ok: boolean; error?: string; fieldErrors?: Record<string, string[] | undefined> } | undefined;
function handle<T extends Record<string, unknown>>(form: ReturnType<typeof useForm<T>>, r: Result) {
  if (r && !r.ok) {
    applyFieldErrors(form as never, r.fieldErrors);
    toast.error(r.error ?? "Something went wrong");
  }
}

export function LoginForm({ next }: { next?: string }) {
  const form = useForm<z.input<typeof loginSchema>>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "", next } });
  const e = form.formState.errors;
  return (
    <form onSubmit={form.handleSubmit(async (v) => handle(form, await signIn(v)))} className="grid gap-4" noValidate>
      <Field label="Email" htmlFor="email" error={e.email?.message}>
        <Input id="email" type="email" autoComplete="email" autoFocus {...form.register("email")} />
      </Field>
      <Field label="Password" htmlFor="password" error={e.password?.message}>
        <Input id="password" type="password" autoComplete="current-password" {...form.register("password")} />
      </Field>
      <div className="-mt-1 text-right">
        <Link href="/forgot-password" className="text-[13px] text-muted-foreground hover:text-foreground">
          Forgot password?
        </Link>
      </div>
      <SubmitButton pending={form.formState.isSubmitting}>Sign in</SubmitButton>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const form = useForm<z.input<typeof forgotSchema>>({ resolver: zodResolver(forgotSchema), defaultValues: { email: "" } });
  if (sent) return <p className="rounded-lg border bg-muted/40 p-4 text-sm">If an account exists for that email, a reset link is on its way. It expires in one hour.</p>;
  return (
    <form
      onSubmit={form.handleSubmit(async (v) => {
        const r = await requestPasswordReset(v);
        if (r.ok) setSent(true);
        else handle(form, r);
      })}
      className="grid gap-4"
      noValidate
    >
      <Field label="Email" htmlFor="email" error={form.formState.errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" autoFocus {...form.register("email")} />
      </Field>
      <SubmitButton pending={form.formState.isSubmitting}>Send reset link</SubmitButton>
    </form>
  );
}

export function ResetPasswordForm() {
  const form = useForm<z.input<typeof resetSchema>>({ resolver: zodResolver(resetSchema), defaultValues: { password: "", confirm: "" } });
  const e = form.formState.errors;
  return (
    <form onSubmit={form.handleSubmit(async (v) => handle(form, await updatePassword(v)))} className="grid gap-4" noValidate>
      <Field label="New password" htmlFor="password" error={e.password?.message} hint="At least 10 characters with a letter and a number.">
        <Input id="password" type="password" autoComplete="new-password" {...form.register("password")} />
      </Field>
      <Field label="Confirm password" htmlFor="confirm" error={e.confirm?.message}>
        <Input id="confirm" type="password" autoComplete="new-password" {...form.register("confirm")} />
      </Field>
      <SubmitButton pending={form.formState.isSubmitting}>Update password</SubmitButton>
    </form>
  );
}

export function AcceptInviteForm({ defaultName }: { defaultName?: string }) {
  const form = useForm<z.input<typeof acceptInviteSchema>>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: { fullName: defaultName ?? "", password: "", confirm: "" },
  });
  const e = form.formState.errors;
  return (
    <form onSubmit={form.handleSubmit(async (v) => handle(form, await acceptInvitation(v)))} className="grid gap-4" noValidate>
      <Field label="Your name" htmlFor="fullName" error={e.fullName?.message}>
        <Input id="fullName" autoComplete="name" {...form.register("fullName")} />
      </Field>
      <Field label="Create a password" htmlFor="password" error={e.password?.message} hint="At least 10 characters with a letter and a number.">
        <Input id="password" type="password" autoComplete="new-password" {...form.register("password")} />
      </Field>
      <Field label="Confirm password" htmlFor="confirm" error={e.confirm?.message}>
        <Input id="confirm" type="password" autoComplete="new-password" {...form.register("confirm")} />
      </Field>
      <SubmitButton pending={form.formState.isSubmitting}>Continue</SubmitButton>
    </form>
  );
}

const CURRENCIES = ["USD", "EUR", "GBP", "AED", "SAR", "INR", "PKR", "CAD", "AUD", "SGD", "MYR", "QAR", "KWD", "TRY"];

export function SetupForm() {
  const [done, setDone] = useState<{ email: string; devLink: string | null } | null>(null);
  const tz = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC";
  const form = useForm<z.input<typeof setupSchema>>({
    resolver: zodResolver(setupSchema),
    defaultValues: { agencyName: "GridLab", fullName: "", email: "", password: "", currency: "USD", timezone: tz },
  });
  const e = form.formState.errors;
  if (done) {
    return (
      <div className="grid gap-3 rounded-lg border bg-muted/40 p-5 text-sm">
        <p className="font-medium">Check your inbox</p>
        <p className="text-muted-foreground">We sent a confirmation link to {done.email}. Confirm your email to open your workspace.</p>
        {done.devLink ? (
          <a className="break-all text-primary underline" href={done.devLink}>
            Development only: confirm now
          </a>
        ) : null}
      </div>
    );
  }
  return (
    <form
      onSubmit={form.handleSubmit(async (v) => {
        const r = await completeSetup(v);
        if (r.ok) setDone(r.data);
        else handle(form, r);
      })}
      className="grid gap-4"
      noValidate
    >
      <Field label="Agency name" htmlFor="agencyName" error={e.agencyName?.message} hint="You can rename it later in src/config/site.ts and Settings.">
        <Input id="agencyName" {...form.register("agencyName")} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Currency" htmlFor="currency" error={e.currency?.message}>
          <NativeSelect id="currency" {...form.register("currency")}>
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Time zone" htmlFor="timezone" error={e.timezone?.message}>
          <Input id="timezone" {...form.register("timezone")} />
        </Field>
      </div>
      <Field label="Your name" htmlFor="fullName" error={e.fullName?.message}>
        <Input id="fullName" autoComplete="name" {...form.register("fullName")} />
      </Field>
      <Field label="Email" htmlFor="email" error={e.email?.message}>
        <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
      </Field>
      <Field label="Password" htmlFor="password" error={e.password?.message} hint="At least 10 characters with a letter and a number.">
        <Input id="password" type="password" autoComplete="new-password" {...form.register("password")} />
      </Field>
      <SubmitButton pending={form.formState.isSubmitting}>Create workspace</SubmitButton>
    </form>
  );
}
