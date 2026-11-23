"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Field, SubmitButton, applyFieldErrors } from "@/components/shared/form";
import { useServerAction } from "@/hooks/use-action";
import { changeMyPassword, runAutomationsNow, updateMyProfile, updateNotificationPrefs, updateOrgSettings, type OrgSettingsInput } from "../actions";

export function ProfileForm({ values }: { values: { full_name: string; phone: string; job_title: string; timezone: string } }) {
  const { execute } = useServerAction();
  const form = useForm({ defaultValues: values });
  return (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={form.handleSubmit((v) => execute(() => updateMyProfile(v), { onError: (r) => applyFieldErrors(form, r.fieldErrors) }))}>
      <Field label="Full name" error={form.formState.errors.full_name?.message}>
        <Input {...form.register("full_name")} />
      </Field>
      <Field label="Phone">
        <Input {...form.register("phone")} />
      </Field>
      <Field label="Job title">
        <Input {...form.register("job_title")} />
      </Field>
      <Field label="Time zone">
        <Input {...form.register("timezone")} placeholder="Asia/Dubai" />
      </Field>
      <div className="sm:col-span-2">
        <SubmitButton pending={form.formState.isSubmitting}>Save profile</SubmitButton>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const { execute } = useServerAction();
  const form = useForm({ defaultValues: { current: "", password: "" } });
  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={form.handleSubmit((v) => execute(() => changeMyPassword(v), { onSuccess: () => form.reset(), onError: (r) => applyFieldErrors(form, r.fieldErrors) }))}
    >
      <Field label="Current password" error={form.formState.errors.current?.message}>
        <Input type="password" autoComplete="current-password" {...form.register("current")} />
      </Field>
      <Field label="New password" error={form.formState.errors.password?.message} hint="10+ characters with a letter and a number.">
        <Input type="password" autoComplete="new-password" {...form.register("password")} />
      </Field>
      <div className="sm:col-span-2">
        <SubmitButton pending={form.formState.isSubmitting}>Change password</SubmitButton>
      </div>
    </form>
  );
}

export function NotificationPrefsForm({ types, initial }: { types: Record<string, string>; initial: { email_enabled: boolean; email_types: Record<string, boolean> } }) {
  const [state, setState] = useState(initial);
  const { execute, pending } = useServerAction();
  return (
    <div className="grid gap-3">
      <label className="flex items-center justify-between rounded-md border p-3 text-[13.5px]">
        <span>
          <span className="font-medium">Email notifications</span>
          <span className="block text-[12.5px] text-muted-foreground">In-app notifications are always on.</span>
        </span>
        <Switch checked={state.email_enabled} onCheckedChange={(v) => setState((s) => ({ ...s, email_enabled: v }))} />
      </label>
      <div className="grid gap-2 sm:grid-cols-2">
        {Object.entries(types).map(([key, label]) => (
          <label key={key} className="flex items-center justify-between rounded-md border px-3 py-2 text-[13px]">
            {label}
            <Switch
              disabled={!state.email_enabled}
              checked={state.email_types[key] !== false}
              onCheckedChange={(v) => setState((s) => ({ ...s, email_types: { ...s.email_types, [key]: v } }))}
            />
          </label>
        ))}
      </div>
      <div>
        <Button disabled={pending} onClick={() => execute(() => updateNotificationPrefs(state))}>
          Save preferences
        </Button>
      </div>
    </div>
  );
}

export function OrgSettingsForm({ values }: { values: OrgSettingsInput }) {
  const { execute } = useServerAction();
  const form = useForm<OrgSettingsInput>({ defaultValues: values });
  const r = form.register;
  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit((v) => execute(() => updateOrgSettings(v), { onError: (x) => applyFieldErrors(form, x.fieldErrors) }))}>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Agency name" hint="Website branding lives in src/config/site.ts.">
          <Input {...r("name")} />
        </Field>
        <Field label="Currency" hint="ISO code, e.g. USD, AED, GBP">
          <Input {...r("currency")} maxLength={3} />
        </Field>
        <Field label="Time zone">
          <Input {...r("timezone")} />
        </Field>
        <Field label="Default tax rate (%)" error={form.formState.errors.default_tax_rate?.message}>
          <Input inputMode="decimal" {...r("default_tax_rate")} />
        </Field>
        <Field label="Payment terms (days)">
          <Input type="number" {...r("default_payment_terms_days")} />
        </Field>
        <Field label="Lead capacity (active projects)" hint="Used by lead qualification.">
          <Input type="number" {...r("lead_capacity_projects")} />
        </Field>
        <Field label="Invoice prefix">
          <Input {...r("invoice_prefix")} />
        </Field>
        <Field label="Proposal prefix">
          <Input {...r("proposal_prefix")} />
        </Field>
        <Field label="Project prefix">
          <Input {...r("project_prefix")} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Legal name">
          <Input {...r("company_legal_name")} />
        </Field>
        <Field label="Tax / VAT ID">
          <Input {...r("tax_id")} />
        </Field>
        <Field label="Billing email">
          <Input {...r("company_email")} />
        </Field>
        <Field label="Phone">
          <Input {...r("company_phone")} />
        </Field>
      </div>
      <Field label="Address (shown on invoices)">
        <Textarea rows={2} {...r("company_address")} />
      </Field>
      <Field label="Payment instructions" hint="Shown on invoices and in the client portal.">
        <Textarea rows={4} {...r("payment_instructions")} />
      </Field>
      <Field label="Invoice footer">
        <Textarea rows={2} {...r("invoice_footer")} />
      </Field>
      <div>
        <SubmitButton pending={form.formState.isSubmitting}>Save organization settings</SubmitButton>
      </div>
    </form>
  );
}

export function RunAutomationsButton() {
  const { execute, pending } = useServerAction();
  const [result, setResult] = useState<string | null>(null);
  return (
    <div className="grid gap-2">
      <div>
        <Button variant="outline" disabled={pending} onClick={() => execute(() => runAutomationsNow(), { onSuccess: (d) => setResult(JSON.stringify(d, null, 2)) })}>
          {pending ? "Running…" : "Run automations now"}
        </Button>
      </div>
      {result ? <pre className="overflow-x-auto rounded-md bg-muted p-3 text-[11.5px]">{result}</pre> : null}
    </div>
  );
}
