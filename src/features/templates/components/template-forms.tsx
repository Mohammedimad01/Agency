"use client";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Trash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, NativeSelect, SubmitButton } from "@/components/shared/form";
import { useDialogClose } from "@/components/shared/form-dialog";
import { useServerAction } from "@/hooks/use-action";
import { addTemplateTask, deleteTemplateMilestone, deleteTemplateTask, saveTemplate, saveTemplateMilestone, type TemplateInput, type TplMilestoneInput, type TplTaskInput } from "../actions";
import { ROLE_LABELS, TEAM_ROLES } from "@/lib/permissions";

export function TemplateForm({ template, services }: { template?: { id: string } & TemplateInput; services: { id: string; name: string }[] }) {
  const router = useRouter();
  const close = useDialogClose();
  const { execute } = useServerAction();
  const form = useForm<TemplateInput>({ defaultValues: { name: "", description: "", service_id: "", is_active: true, ...template } });
  return (
    <form
      className="grid gap-4"
      onSubmit={form.handleSubmit((v) => execute(() => saveTemplate(template?.id ?? null, v), { onSuccess: (d) => { close?.(); if (!template) router.push(`/admin/templates/${d.id}`); } }))}
    >
      <Field label="Name" required>
        <Input {...form.register("name", { required: true })} />
      </Field>
      <Field label="Service">
        <NativeSelect {...form.register("service_id")}>
          <option value="">—</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field label="Description">
        <Textarea rows={2} {...form.register("description")} />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={form.watch("is_active") === true} onCheckedChange={(v) => form.setValue("is_active", v === true)} />
        Active (available when creating projects)
      </label>
      <div className="flex justify-end">
        <SubmitButton pending={form.formState.isSubmitting}>Save template</SubmitButton>
      </div>
    </form>
  );
}

export function TemplateMilestoneForm({ templateId, milestone }: { templateId: string; milestone?: TplMilestoneInput }) {
  const close = useDialogClose();
  const { execute } = useServerAction();
  const form = useForm<TplMilestoneInput>({ defaultValues: { template_id: templateId, title: "", description: "", offset_days: 0, duration_days: 7, weight: 1, is_client_visible: true, id: "", ...milestone } });
  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit((v) => execute(() => saveTemplateMilestone(v), { onSuccess: () => close?.() }))}>
      <Field label="Title" required>
        <Input {...form.register("title")} />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Starts on day" hint="From project start">
          <Input type="number" min={0} {...form.register("offset_days")} />
        </Field>
        <Field label="Duration (days)">
          <Input type="number" min={0} {...form.register("duration_days")} />
        </Field>
        <Field label="Weight">
          <Input type="number" min={1} max={100} {...form.register("weight")} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={form.watch("is_client_visible") === true} onCheckedChange={(v) => form.setValue("is_client_visible", v === true)} />
        Visible to clients
      </label>
      <div className="flex justify-end">
        <SubmitButton pending={form.formState.isSubmitting}>Save</SubmitButton>
      </div>
    </form>
  );
}

export function TemplateTaskForm({ templateId, milestoneId }: { templateId: string; milestoneId: string | null }) {
  const close = useDialogClose();
  const { execute } = useServerAction();
  const form = useForm<TplTaskInput>({
    defaultValues: { template_id: templateId, milestone_id: milestoneId ?? "", title: "", offset_days: 0, estimated_hours: "", is_client_visible: false, requires_client_action: false, default_role: "" },
  });
  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit((v) => execute(() => addTemplateTask(v), { onSuccess: () => close?.() }))}>
      <Field label="Task title" required>
        <Input {...form.register("title")} autoFocus />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Due on day" hint="Within milestone">
          <Input type="number" min={0} {...form.register("offset_days")} />
        </Field>
        <Field label="Estimate (h)">
          <Input type="number" step="0.5" min={0} {...form.register("estimated_hours")} />
        </Field>
        <Field label="Auto-assign role">
          <NativeSelect {...form.register("default_role")}>
            <option value="">—</option>
            {TEAM_ROLES.filter((r) => r !== "owner").map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>
      <div className="grid gap-2 text-sm">
        <label className="flex items-center gap-2">
          <Checkbox checked={form.watch("is_client_visible") === true} onCheckedChange={(v) => form.setValue("is_client_visible", v === true)} /> Visible to the client
        </label>
        <label className="flex items-center gap-2">
          <Checkbox checked={form.watch("requires_client_action") === true} onCheckedChange={(v) => form.setValue("requires_client_action", v === true)} /> Requires client action
        </label>
      </div>
      <div className="flex justify-end">
        <SubmitButton pending={form.formState.isSubmitting}>Add task</SubmitButton>
      </div>
    </form>
  );
}

export function RemoveButton({ kind, id, templateId }: { kind: "milestone" | "task"; id: string; templateId: string }) {
  const { execute, pending } = useServerAction();
  return (
    <Button variant="ghost" size="icon-sm" disabled={pending} aria-label={`Remove ${kind}`} onClick={() => execute(() => (kind === "milestone" ? deleteTemplateMilestone(id, templateId) : deleteTemplateTask(id, templateId)))}>
      <Trash />
    </Button>
  );
}
