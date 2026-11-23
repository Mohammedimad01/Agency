"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheck, Circle, Ellipsis, Eye, EyeOff, Pencil, Plus, Send, Trash, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Field, NativeSelect, SubmitButton, applyFieldErrors } from "@/components/shared/form";
import { FormDialog, useDialogClose } from "@/components/shared/form-dialog";
import { FileUploader } from "@/components/shared/file-uploader";
import { StatusBadge } from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/ui/avatar";
import { useServerAction } from "@/hooks/use-action";
import {
  addDeliverableVersion, addTaskComment, applyTemplate, createDeliverable, deleteMilestone, deleteTask, deleteTimeEntry, logTime,
  saveMilestone, saveTask, setMilestoneStatus, setProjectMembers, setProjectStatus, setRevisionStatus, setTaskStatus, submitDeliverable,
} from "../actions";
import { createUploadTarget, deleteFile, registerFile, setFileVisibility } from "@/features/files/actions";
import { deliverableSchema, milestoneSchema, taskSchema, timeEntrySchema, type DeliverableInput, type MilestoneInput, type TaskInput, type TimeEntryInput } from "../schemas";
import { PROJECT_PIPELINE, PROJECT_STATUSES, PRIORITIES, TASK_PIPELINE, TASK_STATUSES } from "@/lib/status";
import { formatDate, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

type Opt = { id: string; name: string };

export function ProjectStatusSelect({ id, status, disabled }: { id: string; status: string; disabled?: boolean }) {
  const { execute, pending } = useServerAction();
  return (
    <NativeSelect aria-label="Project status" className="h-8 w-44" value={status} disabled={disabled || pending} onChange={(e) => execute(() => setProjectStatus(id, e.target.value))}>
      {PROJECT_PIPELINE.map((s) => (
        <option key={s} value={s}>
          {PROJECT_STATUSES[s].label}
        </option>
      ))}
    </NativeSelect>
  );
}

export function MembersEditor({ projectId, team, selected }: { projectId: string; team: Opt[]; selected: string[] }) {
  const [ids, setIds] = useState(selected);
  const { execute, pending } = useServerAction();
  return (
    <FormDialog title="Project team" description="Members can see this project and work on its tasks." trigger={<Button variant="outline" size="sm"><Users /> Team</Button>}>
      <MembersBody team={team} ids={ids} setIds={setIds} pending={pending} onSave={(close) => execute(() => setProjectMembers(projectId, ids), { onSuccess: close })} />
    </FormDialog>
  );
}
function MembersBody({ team, ids, setIds, pending, onSave }: { team: Opt[]; ids: string[]; setIds: (v: string[]) => void; pending: boolean; onSave: (close: () => void) => void }) {
  const close = useDialogClose();
  return (
    <div className="grid gap-4">
      <div className="grid gap-2 sm:grid-cols-2">
        {team.map((t) => (
          <label key={t.id} className="flex items-center gap-2 rounded-md border p-2 text-[13px]">
            <Checkbox checked={ids.includes(t.id)} onCheckedChange={(v) => setIds(v ? [...ids, t.id] : ids.filter((i) => i !== t.id))} />
            <UserAvatar name={t.name} className="size-6" />
            {t.name}
          </label>
        ))}
      </div>
      <div className="flex justify-end">
        <Button disabled={pending} onClick={() => onSave(() => close?.())}>
          Save team
        </Button>
      </div>
    </div>
  );
}

export function ApplyTemplateButton({ projectId, templates, startDate }: { projectId: string; templates: Opt[]; startDate: string | null }) {
  const [tpl, setTpl] = useState("");
  const [start, setStart] = useState(startDate ?? new Date().toISOString().slice(0, 10));
  const { execute, pending } = useServerAction();
  return (
    <FormDialog title="Apply a template" description="Adds the template's milestones and tasks to this project." trigger={<Button variant="outline" size="sm">Apply template</Button>}>
      <ApplyBody>
        {(close) => (
          <div className="grid gap-4">
            <Field label="Template">
              <NativeSelect value={tpl} onChange={(e) => setTpl(e.target.value)}>
                <option value="">Select…</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Start date">
              <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </Field>
            <div className="flex justify-end">
              <Button disabled={!tpl || pending} onClick={() => execute(() => applyTemplate(projectId, tpl, start), { onSuccess: close })}>
                Apply
              </Button>
            </div>
          </div>
        )}
      </ApplyBody>
    </FormDialog>
  );
}
function ApplyBody({ children }: { children: (close: () => void) => React.ReactNode }) {
  const close = useDialogClose();
  return <>{children(() => close?.())}</>;
}

// --- Milestones -----------------------------------------------------------------
export function MilestoneForm({ projectId, milestone }: { projectId: string; milestone?: MilestoneInput }) {
  const close = useDialogClose();
  const { execute } = useServerAction();
  const form = useForm<MilestoneInput>({
    resolver: zodResolver(milestoneSchema),
    defaultValues: { project_id: projectId, title: "", description: "", start_date: "", due_date: "", weight: 1, is_client_visible: true, status: "pending", id: "", ...milestone },
  });
  const e = form.formState.errors;
  return (
    <form noValidate className="grid gap-4" onSubmit={form.handleSubmit((v) => execute(() => saveMilestone(v), { onSuccess: () => close?.(), onError: (r) => applyFieldErrors(form, r.fieldErrors) }))}>
      <Field label="Title" error={e.title?.message} required>
        <Input {...form.register("title")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Start">
          <Input type="date" {...form.register("start_date")} />
        </Field>
        <Field label="Due">
          <Input type="date" {...form.register("due_date")} />
        </Field>
        <Field label="Weight" hint="Share of overall progress.">
          <Input type="number" min={1} max={100} {...form.register("weight")} />
        </Field>
      </div>
      <Field label="Description">
        <Textarea rows={2} {...form.register("description")} />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={form.watch("is_client_visible") === true} onCheckedChange={(v) => form.setValue("is_client_visible", v === true)} />
        Visible to the client
      </label>
      <div className="flex justify-end">
        <SubmitButton pending={form.formState.isSubmitting}>Save milestone</SubmitButton>
      </div>
    </form>
  );
}

export function MilestoneControls({ m, projectId, canManage }: { m: MilestoneInput & { id: string; status: string }; projectId: string; canManage: boolean }) {
  const { execute, pending } = useServerAction();
  const [edit, setEdit] = useState(false);
  const done = m.status === "completed";
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={!canManage || pending}
        aria-label={done ? "Reopen milestone" : "Complete milestone"}
        onClick={() => execute(() => setMilestoneStatus(m.id, projectId, done ? "in_progress" : "completed"))}
      >
        {done ? <CircleCheck className="text-success" /> : <Circle />}
      </Button>
      {canManage ? (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Milestone actions">
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setEdit(true)}>
                <Pencil /> Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive onSelect={() => execute(() => deleteMilestone(m.id, projectId))}>
                <Trash /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <FormDialog title="Edit milestone" open={edit} onOpenChange={setEdit}>
            <MilestoneForm projectId={projectId} milestone={m} />
          </FormDialog>
        </>
      ) : null}
    </div>
  );
}

// --- Tasks ----------------------------------------------------------------------
export function TaskForm({ projectId, task, milestones, team, parentTaskId }: { projectId: string; task?: TaskInput; milestones: Opt[]; team: Opt[]; parentTaskId?: string }) {
  const close = useDialogClose();
  const { execute } = useServerAction();
  const form = useForm<TaskInput>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      project_id: projectId, milestone_id: "", parent_task_id: parentTaskId ?? "", title: "", description: "", status: "todo", priority: "medium", assignee_id: "",
      start_date: "", due_date: "", estimated_hours: "", is_client_visible: false, requires_client_action: false, id: "", ...task,
    },
  });
  const e = form.formState.errors;
  const r = form.register;
  return (
    <form noValidate className="grid gap-4" onSubmit={form.handleSubmit((v) => execute(() => saveTask(v), { onSuccess: () => close?.(), onError: (res) => applyFieldErrors(form, res.fieldErrors) }))}>
      <Field label="Title" error={e.title?.message} required>
        <Input {...r("title")} autoFocus />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        {!parentTaskId ? (
          <Field label="Milestone">
            <NativeSelect {...r("milestone_id")}>
              <option value="">No milestone</option>
              {milestones.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
        ) : null}
        <Field label="Assignee">
          <NativeSelect {...r("assignee_id")}>
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
            {TASK_PIPELINE.map((s) => (
              <option key={s} value={s}>
                {TASK_STATUSES[s].label}
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
        <Field label="Due date">
          <Input type="date" {...r("due_date")} />
        </Field>
        <Field label="Estimate (hours)" error={e.estimated_hours?.message}>
          <Input type="number" step="0.5" min={0} {...r("estimated_hours")} />
        </Field>
      </div>
      <Field label="Description">
        <Textarea rows={3} {...r("description")} />
      </Field>
      <div className="grid gap-2 text-sm">
        <label className="flex items-center gap-2">
          <Checkbox checked={form.watch("is_client_visible") === true} onCheckedChange={(v) => form.setValue("is_client_visible", v === true)} />
          Visible to the client
        </label>
        <label className="flex items-center gap-2">
          <Checkbox checked={form.watch("requires_client_action") === true} onCheckedChange={(v) => form.setValue("requires_client_action", v === true)} />
          Requires client action (shown as “action needed” in the portal)
        </label>
      </div>
      <div className="flex justify-end">
        <SubmitButton pending={form.formState.isSubmitting}>Save task</SubmitButton>
      </div>
    </form>
  );
}

export function TaskCheck({ id, done, disabled }: { id: string; done: boolean; disabled?: boolean }) {
  const { execute, pending } = useServerAction();
  return (
    <button
      type="button"
      disabled={disabled || pending}
      aria-label={done ? "Mark as not done" : "Mark as done"}
      onClick={() => execute(() => setTaskStatus(id, done ? "todo" : "done"))}
      className="shrink-0 text-muted-foreground hover:text-primary disabled:opacity-50"
    >
      {done ? <CircleCheck className="size-[18px] text-success" /> : <Circle className="size-[18px]" />}
    </button>
  );
}

export function TaskStatusSelect({ id, status }: { id: string; status: string }) {
  const { execute, pending } = useServerAction();
  return (
    <NativeSelect aria-label="Task status" className="h-7 w-32 text-[12px]" value={status} disabled={pending} onChange={(e) => execute(() => setTaskStatus(id, e.target.value))}>
      {TASK_PIPELINE.map((s) => (
        <option key={s} value={s}>
          {TASK_STATUSES[s].label}
        </option>
      ))}
    </NativeSelect>
  );
}

export interface TaskDetail {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  estimated_hours: number | null;
  assignee_id: string | null;
  assignee: string | null;
  milestone_id: string | null;
  is_client_visible: boolean;
  requires_client_action: boolean;
  comments: { id: string; body: string; author: string; created_at: string }[];
  subtasks: { id: string; title: string; status: string; assignee: string | null }[];
}

/** Task detail drawer, driven by ?task=<id> so tasks are linkable from notifications. */
export function TaskSheet({ task, projectId, milestones, team, canDelete }: { task: TaskDetail; projectId: string; milestones: Opt[]; team: Opt[]; canDelete: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [comment, setComment] = useState("");
  const { execute, pending } = useServerAction();
  const close = () => {
    const p = new URLSearchParams(params.toString());
    p.delete("task");
    router.replace(`${pathname}${p.size ? `?${p}` : ""}`, { scroll: false });
  };
  return (
    <Sheet open onOpenChange={(o) => !o && close()}>
      <SheetContent className="max-w-xl">
        <div className="flex items-start gap-3 pr-6">
          <TaskCheck id={task.id} done={task.status === "done"} />
          <div>
            <SheetTitle className="text-lg leading-snug">{task.title}</SheetTitle>
            <SheetDescription className="mt-1 flex flex-wrap items-center gap-2">
              <StatusBadge status={task.status as keyof typeof TASK_STATUSES} map={TASK_STATUSES} />
              <StatusBadge status={task.priority as keyof typeof PRIORITIES} map={PRIORITIES} dot={false} />
              {task.is_client_visible ? <span className="text-[12px]">Client-visible</span> : <span className="text-[12px]">Internal</span>}
            </SheetDescription>
          </div>
        </div>
        <dl className="grid grid-cols-3 gap-3 rounded-lg border p-3 text-[13px]">
          <div>
            <dt className="text-[12px] text-muted-foreground">Assignee</dt>
            <dd className="font-medium">{task.assignee ?? "Unassigned"}</dd>
          </div>
          <div>
            <dt className="text-[12px] text-muted-foreground">Due</dt>
            <dd className="font-medium">{formatDate(task.due_date)}</dd>
          </div>
          <div>
            <dt className="text-[12px] text-muted-foreground">Estimate</dt>
            <dd className="font-medium">{task.estimated_hours ? `${task.estimated_hours}h` : "—"}</dd>
          </div>
        </dl>
        {task.description ? <p className="whitespace-pre-line text-[13.5px]">{task.description}</p> : null}
        <div className="flex gap-2">
          <FormDialog size="lg" title="Edit task" trigger={<Button variant="outline" size="sm"><Pencil /> Edit</Button>}>
            <TaskForm
              projectId={projectId}
              milestones={milestones}
              team={team}
              task={{
                id: task.id, project_id: projectId, title: task.title, description: task.description ?? "", status: task.status as TaskInput["status"],
                priority: task.priority as TaskInput["priority"], assignee_id: task.assignee_id ?? "", due_date: task.due_date ?? "",
                estimated_hours: task.estimated_hours ?? "", milestone_id: task.milestone_id ?? "", is_client_visible: task.is_client_visible,
                requires_client_action: task.requires_client_action,
              }}
            />
          </FormDialog>
          {canDelete ? (
            <Button variant="ghost" size="sm" disabled={pending} onClick={() => execute(() => deleteTask(task.id), { onSuccess: close })}>
              <Trash /> Delete
            </Button>
          ) : null}
        </div>
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold">Subtasks</h3>
            <FormDialog title="Add subtask" trigger={<Button variant="ghost" size="sm"><Plus /> Add</Button>}>
              <TaskForm projectId={projectId} milestones={milestones} team={team} parentTaskId={task.id} />
            </FormDialog>
          </div>
          {task.subtasks.length ? (
            <ul className="divide-y rounded-md border">
              {task.subtasks.map((s) => (
                <li key={s.id} className="flex items-center gap-2 px-3 py-2 text-[13px]">
                  <TaskCheck id={s.id} done={s.status === "done"} />
                  <span className={cn("flex-1", s.status === "done" && "text-muted-foreground line-through")}>{s.title}</span>
                  <span className="text-[12px] text-muted-foreground">{s.assignee ?? ""}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[12.5px] text-muted-foreground">No subtasks.</p>
          )}
        </section>
        <section className="grid gap-3">
          <h3 className="text-[13px] font-semibold">Comments</h3>
          {task.comments.map((c) => (
            <div key={c.id} className="rounded-md bg-muted/50 p-3 text-[13px]">
              <p className="mb-1 text-[12px] text-muted-foreground">
                {c.author} · {formatDateTime(c.created_at)}
              </p>
              <p className="whitespace-pre-line">{c.body}</p>
            </div>
          ))}
          <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} placeholder="Write a comment…" aria-label="Comment" />
          <div className="flex justify-end">
            <Button size="sm" disabled={!comment.trim() || pending} onClick={() => execute(() => addTaskComment(task.id, comment), { onSuccess: () => setComment("") })}>
              Comment
            </Button>
          </div>
        </section>
      </SheetContent>
    </Sheet>
  );
}

// --- Deliverables ---------------------------------------------------------------
export function DeliverableForm({ projectId, milestones }: { projectId: string; milestones: Opt[] }) {
  const close = useDialogClose();
  const { execute } = useServerAction();
  const form = useForm<DeliverableInput>({ resolver: zodResolver(deliverableSchema), defaultValues: { project_id: projectId, title: "", description: "", milestone_id: "", due_date: "" } });
  return (
    <form noValidate className="grid gap-4" onSubmit={form.handleSubmit((v) => execute(() => createDeliverable(v), { onSuccess: () => close?.(), onError: (r) => applyFieldErrors(form, r.fieldErrors) }))}>
      <Field label="Title" error={form.formState.errors.title?.message} required>
        <Input {...form.register("title")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Milestone">
          <NativeSelect {...form.register("milestone_id")}>
            <option value="">—</option>
            {milestones.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Due date">
          <Input type="date" {...form.register("due_date")} />
        </Field>
      </div>
      <Field label="Description">
        <Textarea rows={2} {...form.register("description")} />
      </Field>
      <div className="flex justify-end">
        <SubmitButton pending={form.formState.isSubmitting}>Create deliverable</SubmitButton>
      </div>
    </form>
  );
}

export function NewVersionForm({ deliverableId, projectId }: { deliverableId: string; projectId: string }) {
  const close = useDialogClose();
  const [fileId, setFileId] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const { execute, pending } = useServerAction();
  const submit = (send: boolean) => execute(() => addDeliverableVersion({ deliverable_id: deliverableId, file_id: fileId, external_url: url || null, notes, submit: send }), { onSuccess: () => close?.() });
  return (
    <div className="grid gap-4">
      {fileName ? (
        <p className="rounded-md border bg-muted/40 px-3 py-2 text-[13px]">Attached: {fileName}</p>
      ) : (
        <FileUploader
          multiple={false}
          label="Upload the deliverable file"
          createTarget={(f) => createUploadTarget({ scope: "project", projectId }, f)}
          register={async (t, file) => {
            const r = await registerFile({ bucket: t.bucket as "project-files", path: t.path, name: file.name, category: "deliverable", visibility: "client", project_id: projectId });
            if (r.ok && r.data.id) {
              setFileId(r.data.id);
              setFileName(file.name);
            }
            return r;
          }}
        />
      )}
      <Field label="…or a link" hint="Figma, staging site, Loom, etc.">
        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
      </Field>
      <Field label="Notes for the client">
        <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      <div className="flex justify-end gap-2">
        <Button variant="outline" disabled={pending || (!fileId && !url)} onClick={() => submit(false)}>
          Save draft version
        </Button>
        <Button disabled={pending || (!fileId && !url)} onClick={() => submit(true)}>
          <Send /> Submit for approval
        </Button>
      </div>
    </div>
  );
}

export function SubmitDeliverableButton({ id }: { id: string }) {
  const { execute, pending } = useServerAction();
  return (
    <Button size="sm" variant="outline" disabled={pending} onClick={() => execute(() => submitDeliverable(id))}>
      <Send /> Send for approval
    </Button>
  );
}

export function RevisionStatusSelect({ id, status }: { id: string; status: string }) {
  const { execute, pending } = useServerAction();
  return (
    <NativeSelect aria-label="Revision status" className="h-7 w-32 text-[12px]" value={status} disabled={pending} onChange={(e) => execute(() => setRevisionStatus(id, e.target.value as "open"))}>
      <option value="open">Open</option>
      <option value="in_progress">In progress</option>
      <option value="resolved">Resolved</option>
    </NativeSelect>
  );
}

// --- Files ----------------------------------------------------------------------
export function ProjectFileUploader({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [shared, setShared] = useState(false);
  return (
    <div className="grid gap-2">
      <FileUploader
        hint="Up to 50 MB · images, PDFs, documents, archives, video"
        createTarget={(f) => createUploadTarget({ scope: "project", projectId }, f)}
        register={(t, file) => registerFile({ bucket: t.bucket as "project-files", path: t.path, name: file.name, category: "attachment", visibility: shared ? "client" : "internal", project_id: projectId })}
        onComplete={() => router.refresh()}
      />
      <label className="flex items-center gap-2 text-[13px] text-muted-foreground">
        <Checkbox checked={shared} onCheckedChange={(v) => setShared(v === true)} />
        Share new uploads with the client
      </label>
    </div>
  );
}

export function FileRowActions({ id, visibility, canDelete }: { id: string; visibility: "internal" | "client"; canDelete: boolean }) {
  const { execute, pending } = useServerAction();
  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon-sm" disabled={pending} aria-label={visibility === "client" ? "Make internal" : "Share with client"} onClick={() => execute(() => setFileVisibility(id, visibility === "client" ? "internal" : "client"))}>
        {visibility === "client" ? <Eye /> : <EyeOff />}
      </Button>
      {canDelete ? (
        <Button variant="ghost" size="icon-sm" disabled={pending} aria-label="Delete file" onClick={() => execute(() => deleteFile(id))}>
          <Trash />
        </Button>
      ) : null}
    </div>
  );
}

// --- Time -----------------------------------------------------------------------
export function TimeEntryForm({ projectId, tasks }: { projectId: string; tasks: Opt[] }) {
  const close = useDialogClose();
  const { execute } = useServerAction();
  const form = useForm<TimeEntryInput>({
    resolver: zodResolver(timeEntrySchema),
    defaultValues: { project_id: projectId, task_id: "", entry_date: new Date().toISOString().slice(0, 10), hours: 1, description: "", billable: true },
  });
  return (
    <form noValidate className="grid gap-4" onSubmit={form.handleSubmit((v) => execute(() => logTime(v), { onSuccess: () => close?.(), onError: (r) => applyFieldErrors(form, r.fieldErrors) }))}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date">
          <Input type="date" {...form.register("entry_date")} />
        </Field>
        <Field label="Hours" error={form.formState.errors.hours?.message}>
          <Input type="number" step="0.25" min={0.25} {...form.register("hours")} />
        </Field>
      </div>
      <Field label="Task">
        <NativeSelect {...form.register("task_id")}>
          <option value="">General</option>
          {tasks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field label="Description">
        <Input {...form.register("description")} />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={form.watch("billable") === true} onCheckedChange={(v) => form.setValue("billable", v === true)} />
        Billable
      </label>
      <div className="flex justify-end">
        <SubmitButton pending={form.formState.isSubmitting}>Log time</SubmitButton>
      </div>
    </form>
  );
}

export function DeleteTimeButton({ id, projectId }: { id: string; projectId: string }) {
  const { execute, pending } = useServerAction();
  return (
    <Button variant="ghost" size="icon-sm" disabled={pending} aria-label="Delete entry" onClick={() => execute(() => deleteTimeEntry(id, projectId))}>
      <Trash />
    </Button>
  );
}

export function TaskLink({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const p = new URLSearchParams(params.toString());
  p.set("task", id);
  return (
    <Link href={`${pathname}?${p}`} scroll={false} className={className}>
      {children}
    </Link>
  );
}
