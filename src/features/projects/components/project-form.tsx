"use client";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, NativeSelect, SubmitButton, applyFieldErrors } from "@/components/shared/form";
import { useDialogClose } from "@/components/shared/form-dialog";
import { useServerAction } from "@/hooks/use-action";
import { createProject, updateProject } from "../actions";
import { projectSchema, type ProjectInput } from "../schemas";
import { PROJECT_PIPELINE, PROJECT_STATUSES, PRIORITIES } from "@/lib/status";

type Opt = { id: string; name: string };

export function ProjectForm({
  project,
  currency,
  clients,
  services,
  templates,
  team,
  canSeeMoney,
  onDone,
}: {
  project?: { id: string } & Partial<ProjectInput>;
  currency: string;
  clients: Opt[];
  services: Opt[];
  templates: (Opt & { service_id: string | null })[];
  team: Opt[];
  canSeeMoney: boolean;
  onDone?: () => void;
}) {
  const router = useRouter();
  const { execute } = useServerAction();
  const dialogClose = useDialogClose();
  const form = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema(currency)),
    defaultValues: {
      name: "", client_id: "", service_id: "", template_id: "", description: "", scope: "", budget: "", contract_value: "", start_date: new Date().toISOString().slice(0, 10),
      due_date: "", priority: "medium", status: "planning", project_manager_id: "", member_ids: [], internal_notes: "", progress_mode: "milestones", ...project,
    },
  });
  const e = form.formState.errors;
  const r = form.register;
  const members = form.watch("member_ids") ?? [];
  const serviceId = form.watch("service_id");
  const progressMode = form.watch("progress_mode");
  const isNew = !project?.id;

  return (
    <form
      noValidate
      className="grid gap-5"
      onSubmit={form.handleSubmit((v) =>
        execute(() => (isNew ? createProject(v) : updateProject(project!.id, v)), {
          onSuccess: (d) => {
            (onDone ?? dialogClose)?.();
            if (isNew && d && typeof d === "object" && "id" in d) router.push(`/admin/projects/${(d as { id: string }).id}`);
          },
          onError: (res) => applyFieldErrors(form, res.fieldErrors),
        }),
      )}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Project name" error={e.name?.message} required className="sm:col-span-2">
          <Input {...r("name")} aria-invalid={!!e.name} />
        </Field>
        <Field label="Client" error={e.client_id?.message} required>
          <NativeSelect {...r("client_id")} aria-invalid={!!e.client_id}>
            <option value="">Select a client…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
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
        {isNew ? (
          <Field label="Template" hint="Generates milestones & tasks with dates relative to the start date." className="sm:col-span-2">
            <NativeSelect {...r("template_id")}>
              <option value="">Start from scratch</option>
              {[...templates].sort((a, b) => Number(b.service_id === serviceId) - Number(a.service_id === serviceId)).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                  {t.service_id && t.service_id === serviceId ? " (recommended)" : ""}
                </option>
              ))}
            </NativeSelect>
          </Field>
        ) : null}
        <Field label="Start date">
          <Input type="date" {...r("start_date")} />
        </Field>
        <Field label="Deadline" error={e.due_date?.message}>
          <Input type="date" {...r("due_date")} />
        </Field>
        <Field label="Status">
          <NativeSelect {...r("status")}>
            {PROJECT_PIPELINE.map((s) => (
              <option key={s} value={s}>
                {PROJECT_STATUSES[s].label}
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
        {canSeeMoney ? (
          <>
            <Field label={`Budget (${currency})`} error={e.budget?.message}>
              <Input inputMode="decimal" {...r("budget")} placeholder="0.00" />
            </Field>
            <Field label={`Contract value (${currency})`} error={e.contract_value?.message}>
              <Input inputMode="decimal" {...r("contract_value")} placeholder="0.00" />
            </Field>
          </>
        ) : null}
        <Field label="Project manager">
          <NativeSelect {...r("project_manager_id")}>
            <option value="">{isNew ? "Me" : "—"}</option>
            {team.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Progress tracking">
          <NativeSelect {...r("progress_mode")}>
            <option value="milestones">Automatic (from milestones)</option>
            <option value="manual">Manual</option>
          </NativeSelect>
        </Field>
        {progressMode === "manual" && !isNew ? (
          <Field label="Progress (%)">
            <Input type="number" min={0} max={100} {...r("progress")} />
          </Field>
        ) : null}
      </div>
      {isNew ? (
        <Field label="Team members">
          <div className="grid gap-2 rounded-md border p-3 sm:grid-cols-2">
            {team.map((t) => (
              <label key={t.id} className="flex items-center gap-2 text-[13px]">
                <Checkbox
                  checked={members.includes(t.id)}
                  onCheckedChange={(v) => form.setValue("member_ids", v ? [...members, t.id] : members.filter((m) => m !== t.id))}
                />
                {t.name}
              </label>
            ))}
          </div>
        </Field>
      ) : null}
      <Field label="Description" hint="Shown to the client in their portal.">
        <Textarea rows={3} {...r("description")} />
      </Field>
      <Field label="Scope of work" hint="Shown to the client in their portal.">
        <Textarea rows={5} {...r("scope")} />
      </Field>
      <Field label="Internal notes" hint="Team only — never shown to clients.">
        <Textarea rows={2} {...r("internal_notes")} />
      </Field>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => (onDone ?? dialogClose ?? (() => router.back()))()}>
          Cancel
        </Button>
        <SubmitButton pending={form.formState.isSubmitting}>{isNew ? "Create project" : "Save changes"}</SubmitButton>
      </div>
    </form>
  );
}
