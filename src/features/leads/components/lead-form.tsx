"use client";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Field, NativeSelect, SubmitButton, applyFieldErrors } from "@/components/shared/form";
import { useServerAction } from "@/hooks/use-action";
import { useDialogClose } from "@/components/shared/form-dialog";
import { saveLead } from "../actions";
import { leadFormSchema, type LeadFormInput } from "../schemas";
import { LEAD_PIPELINE, LEAD_STATUSES, LEAD_SOURCES, PRIORITIES } from "@/lib/status";
import { TIMELINE_OPTIONS } from "../qualification";
import { titleCase } from "@/lib/utils";

export interface Option {
  id: string;
  name: string;
}

export function LeadForm({
  lead,
  currency,
  services,
  team,
  onDone,
}: {
  lead?: { id: string } & Partial<LeadFormInput>;
  currency: string;
  services: Option[];
  team: Option[];
  onDone?: () => void;
}) {
  const router = useRouter();
  const { execute } = useServerAction();
  const dialogClose = useDialogClose();
  const form = useForm<LeadFormInput>({
    resolver: zodResolver(leadFormSchema(currency)),
    defaultValues: {
      full_name: "", company: "", email: "", phone: "", website: "", industry: "", country: "", source: "manual",
      service_id: "", requested_service: "", budget: "", timeline: "", description: "", assigned_to: "", priority: "medium",
      status: "new", follow_up_at: "", internal_notes: "",
      ...lead,
    },
  });
  const e = form.formState.errors;
  const r = form.register;

  return (
    <form
      noValidate
      className="grid gap-4"
      onSubmit={form.handleSubmit((v) =>
        execute(() => saveLead(lead?.id ?? null, v), {
          onSuccess: (d) => {
            (onDone ?? dialogClose)?.();
            if (!lead?.id) router.push(`/admin/leads/${d.id}`);
          },
          onError: (res) => applyFieldErrors(form, res.fieldErrors),
        }),
      )}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" error={e.full_name?.message} required>
          <Input {...r("full_name")} aria-invalid={!!e.full_name} />
        </Field>
        <Field label="Email" error={e.email?.message} required>
          <Input type="email" {...r("email")} aria-invalid={!!e.email} />
        </Field>
        <Field label="Company" error={e.company?.message}>
          <Input {...r("company")} />
        </Field>
        <Field label="Phone">
          <Input {...r("phone")} />
        </Field>
        <Field label="Website" error={e.website?.message}>
          <Input {...r("website")} placeholder="example.com" />
        </Field>
        <Field label="Industry">
          <Input {...r("industry")} />
        </Field>
        <Field label="Country">
          <Input {...r("country")} />
        </Field>
        <Field label="Source">
          <NativeSelect {...r("source")}>
            <option value="manual">Manual entry</option>
            {LEAD_SOURCES.map((s) => (
              <option key={s} value={s}>
                {titleCase(s)}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Service">
          <NativeSelect {...r("service_id")}>
            <option value="">—</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label={`Estimated budget (${currency})`} error={e.budget?.message}>
          <Input inputMode="decimal" {...r("budget")} placeholder="0.00" />
        </Field>
        <Field label="Timeline">
          <NativeSelect {...r("timeline")}>
            <option value="">—</option>
            {TIMELINE_OPTIONS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Assigned to">
          <NativeSelect {...r("assigned_to")}>
            <option value="">Unassigned</option>
            {team.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Status">
          <NativeSelect {...r("status")}>
            {LEAD_PIPELINE.map((s) => (
              <option key={s} value={s}>
                {LEAD_STATUSES[s].label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Priority">
          <NativeSelect {...r("priority")}>
            {Object.entries(PRIORITIES).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Follow-up" className="sm:col-span-2">
          <Input type="datetime-local" {...r("follow_up_at")} />
        </Field>
      </div>
      <Field label="Description">
        <Textarea rows={3} {...r("description")} />
      </Field>
      <Field label="Internal notes" hint="Only visible to your team.">
        <Textarea rows={2} {...r("internal_notes")} />
      </Field>
      <div className="flex justify-end gap-2">
        {onDone ? (
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
        ) : null}
        <SubmitButton pending={form.formState.isSubmitting}>{lead?.id ? "Save changes" : "Create lead"}</SubmitButton>
      </div>
    </form>
  );
}
