"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Archive, ArrowRightLeft, Pencil, RefreshCw, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FormDialog } from "@/components/shared/form-dialog";
import { ConfirmAction } from "@/components/shared/confirm-action";
import { Field, NativeSelect, SubmitButton, applyFieldErrors } from "@/components/shared/form";
import { useServerAction } from "@/hooks/use-action";
import { useDialogClose } from "@/components/shared/form-dialog";
import { addLeadNote, convertLead, deleteLead, deleteLeadNote, logLeadActivity, rescoreLead, saveMeeting, setFollowUp } from "../actions";
import { convertSchema, meetingSchema, type ConvertInput, type MeetingInput, type LeadFormInput } from "../schemas";
import { LeadForm, type Option } from "./lead-form";

export function LeadHeaderActions({
  lead,
  currency,
  services,
  team,
  clients,
  templates,
  canManage,
  canConvert,
  converted,
}: {
  lead: { id: string; full_name: string; company: string | null } & Partial<LeadFormInput>;
  currency: string;
  services: Option[];
  team: Option[];
  clients: Option[];
  templates: Option[];
  canManage: boolean;
  canConvert: boolean;
  converted: boolean;
}) {
  const router = useRouter();
  const { execute, pending } = useServerAction();
  return (
    <>
      <Button variant="ghost" size="sm" disabled={pending} onClick={() => execute(() => rescoreLead(lead.id))}>
        <RefreshCw /> Rescore
      </Button>
      <FormDialog size="lg" title="Edit lead" trigger={<Button variant="outline" size="sm"><Pencil /> Edit</Button>}>
        {(close) => <LeadForm lead={lead} currency={currency} services={services} team={team} onDone={close} />}
      </FormDialog>
      {canConvert && !converted ? (
        <FormDialog
          size="lg"
          title="Convert to client"
          description="Creates the client and primary contact from this lead — optionally with a project generated from a template."
          trigger={<Button size="sm"><ArrowRightLeft /> Convert</Button>}
        >
          {(close) => <ConvertForm lead={lead} clients={clients} templates={templates} team={team} onDone={close} />}
        </FormDialog>
      ) : null}
      {canManage ? (
        <ConfirmAction
          trigger={<Button variant="ghost" size="icon-sm" aria-label="Archive lead"><Archive /></Button>}
          title="Archive this lead?"
          description="It will be hidden from the pipeline. Its history is kept."
          confirmLabel="Archive"
          destructive
          action={() => deleteLead(lead.id)}
          onDone={() => router.push("/admin/leads")}
        />
      ) : null}
    </>
  );
}

function ConvertForm({ lead, clients, templates, team, onDone }: { lead: { id: string; full_name: string; company: string | null }; clients: Option[]; templates: Option[]; team: Option[]; onDone?: () => void }) {
  const router = useRouter();
  const { execute } = useServerAction();
  const dialogClose = useDialogClose();
  const form = useForm<ConvertInput>({
    resolver: zodResolver(convertSchema),
    defaultValues: {
      lead_id: lead.id, mode: "new", client_name: lead.company ?? lead.full_name, client_type: lead.company ? "company" : "individual",
      create_project: true, project_name: `${lead.company ?? lead.full_name} project`, template_id: "", start_date: new Date().toISOString().slice(0, 10),
      due_date: "", project_manager_id: "", existing_client_id: "",
    },
  });
  const mode = form.watch("mode");
  const createProject = form.watch("create_project");
  const e = form.formState.errors;
  return (
    <form
      className="grid gap-4"
      noValidate
      onSubmit={form.handleSubmit((v) =>
        execute(() => convertLead(v), {
          onSuccess: (d) => {
            (onDone ?? dialogClose)?.();
            router.push(d.project_id ? `/admin/projects/${d.project_id}` : `/admin/clients/${d.client_id}`);
          },
          onError: (r) => applyFieldErrors(form, r.fieldErrors),
        }),
      )}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Client">
          <NativeSelect {...form.register("mode")}>
            <option value="new">Create a new client</option>
            <option value="existing">Link to existing client</option>
          </NativeSelect>
        </Field>
        {mode === "existing" ? (
          <Field label="Existing client" error={e.existing_client_id?.message}>
            <NativeSelect {...form.register("existing_client_id")}>
              <option value="">Select…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
        ) : (
          <>
            <Field label="Client name">
              <Input {...form.register("client_name")} />
            </Field>
            <Field label="Client type">
              <NativeSelect {...form.register("client_type")}>
                <option value="company">Company</option>
                <option value="individual">Individual</option>
              </NativeSelect>
            </Field>
          </>
        )}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={createProject} onCheckedChange={(v) => form.setValue("create_project", v === true)} />
        Also create a project
      </label>
      {createProject ? (
        <div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
          <Field label="Project name" error={e.project_name?.message} className="sm:col-span-2">
            <Input {...form.register("project_name")} />
          </Field>
          <Field label="Template" hint="Generates milestones and tasks automatically.">
            <NativeSelect {...form.register("template_id")}>
              <option value="">No template</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Project manager">
            <NativeSelect {...form.register("project_manager_id")}>
              <option value="">Me</option>
              {team.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Start date">
            <Input type="date" {...form.register("start_date")} />
          </Field>
          <Field label="Deadline" hint="Defaults to the template's last milestone.">
            <Input type="date" {...form.register("due_date")} />
          </Field>
        </div>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => (onDone ?? dialogClose)?.()}>
          Cancel
        </Button>
        <SubmitButton pending={form.formState.isSubmitting}>Convert lead</SubmitButton>
      </div>
    </form>
  );
}

export function NoteComposer({ leadId }: { leadId: string }) {
  const [body, setBody] = useState("");
  const [type, setType] = useState<"note" | "call" | "email" | "meeting" | "other">("note");
  const { execute, pending } = useServerAction();
  return (
    <form
      className="grid gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!body.trim()) return;
        void execute(() => (type === "note" ? addLeadNote({ lead_id: leadId, body }) : logLeadActivity({ lead_id: leadId, type, description: body })), {
          onSuccess: () => setBody(""),
        });
      }}
    >
      <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder={type === "note" ? "Write a note…" : "What happened?"} rows={3} aria-label="Note" />
      <div className="flex items-center justify-between gap-2">
        <NativeSelect value={type} onChange={(e) => setType(e.target.value as typeof type)} className="h-8 w-40" aria-label="Entry type">
          <option value="note">Note</option>
          <option value="call">Log a call</option>
          <option value="email">Log an email</option>
          <option value="meeting">Log a meeting</option>
          <option value="other">Other activity</option>
        </NativeSelect>
        <SubmitButton size="sm" pending={pending} disabled={!body.trim()}>
          Save
        </SubmitButton>
      </div>
    </form>
  );
}

export function DeleteNoteButton({ id }: { id: string }) {
  const { execute, pending } = useServerAction();
  return (
    <Button variant="ghost" size="icon-sm" disabled={pending} aria-label="Delete note" onClick={() => execute(() => deleteLeadNote(id))}>
      <Trash className="size-3.5" />
    </Button>
  );
}

export function FollowUpPicker({ leadId, value }: { leadId: string; value: string | null }) {
  const [v, setV] = useState(value ? value.slice(0, 16) : "");
  const { execute, pending } = useServerAction();
  return (
    <div className="flex gap-2">
      <Input type="datetime-local" value={v} onChange={(e) => setV(e.target.value)} className="h-8" aria-label="Follow-up date" />
      <Button size="sm" variant="outline" disabled={pending} onClick={() => execute(() => setFollowUp(leadId, v || null))}>
        Set
      </Button>
    </div>
  );
}

export function MeetingForm({ leadId, clientId, meeting, onDone }: { leadId?: string; clientId?: string; meeting?: MeetingInput; onDone?: () => void }) {
  const { execute } = useServerAction();
  const dialogClose = useDialogClose();
  const form = useForm<MeetingInput>({
    resolver: zodResolver(meetingSchema),
    defaultValues: { lead_id: leadId ?? "", client_id: clientId ?? "", title: "Discovery call", status: "scheduled", scheduled_at: "", duration_minutes: 30, meeting_url: "", agenda: "", notes: "", ...meeting },
  });
  const e = form.formState.errors;
  return (
    <form className="grid gap-4" noValidate onSubmit={form.handleSubmit((v) => execute(() => saveMeeting(v), { onSuccess: () => (onDone ?? dialogClose)?.(), onError: (r) => applyFieldErrors(form, r.fieldErrors) }))}>
      <Field label="Title" error={e.title?.message}>
        <Input {...form.register("title")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="When" className="sm:col-span-2">
          <Input type="datetime-local" {...form.register("scheduled_at")} />
        </Field>
        <Field label="Minutes">
          <Input type="number" min={5} step={5} {...form.register("duration_minutes")} />
        </Field>
        <Field label="Status">
          <NativeSelect {...form.register("status")}>
            <option value="requested">Requested</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </NativeSelect>
        </Field>
        <Field label="Meeting link" error={e.meeting_url?.message} className="sm:col-span-2">
          <Input {...form.register("meeting_url")} placeholder="https://meet…" />
        </Field>
      </div>
      <Field label="Agenda">
        <Textarea rows={2} {...form.register("agenda")} />
      </Field>
      <Field label="Notes">
        <Textarea rows={3} {...form.register("notes")} />
      </Field>
      <div className="flex justify-end">
        <SubmitButton pending={form.formState.isSubmitting}>Save meeting</SubmitButton>
      </div>
    </form>
  );
}
