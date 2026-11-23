"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { ActionError, dbError, parseInput, teamAction } from "@/lib/action";
import { getCurrency } from "@/features/settings/queries";
import { deliverableSchema, milestoneSchema, projectSchema, projectStatusEnum, taskSchema, taskStatusEnum, timeEntrySchema } from "./schemas";

const path = (id: string) => `/admin/projects/${id}`;

export async function createProject(input: unknown) {
  return teamAction("projects.manage", async (ctx) => {
    const currency = await getCurrency(ctx.organizationId);
    const d = parseInput(projectSchema(currency), input);
    const sb = await createClient();
    const { data, error } = await sb
      .from("projects")
      .insert({
        organization_id: ctx.organizationId, code: "", name: d.name, client_id: d.client_id, service_id: d.service_id ?? null,
        description: d.description ?? null, scope: d.scope ?? null,
        start_date: d.start_date ?? null, due_date: d.due_date ?? null, priority: d.priority, status: d.status as never,
        project_manager_id: d.project_manager_id ?? ctx.userId, internal_notes: d.internal_notes ?? null, progress_mode: d.progress_mode, created_by: ctx.userId,
      })
      .select("id")
      .single();
    if (error) dbError(error);
    if (d.budget !== null || d.contract_value !== null) {
      const { error: fErr } = await sb.from("project_finances").insert({ project_id: data.id, organization_id: ctx.organizationId, budget_cents: d.budget ?? null, contract_value_cents: d.contract_value ?? null });
      if (fErr) dbError(fErr);
    }
    const members = [...new Set(d.member_ids)].filter(Boolean);
    if (members.length) {
      const { error: mErr } = await sb.from("project_members").insert(members.map((m) => ({ project_id: data.id, profile_id: m, added_by: ctx.userId })));
      if (mErr) dbError(mErr);
    }
    // Members first, so template tasks can be auto-assigned by role (workflow #6).
    if (d.template_id) {
      const { error: tErr } = await sb.rpc("apply_project_template", { p_project: data.id, p_template: d.template_id, p_start: d.start_date ?? undefined });
      if (tErr) dbError(tErr);
    }
    revalidatePath("/admin/projects");
    return { id: data.id };
  }, "Project created");
}

export async function updateProject(id: string, input: unknown) {
  return teamAction(null, async (ctx) => {
    const currency = await getCurrency(ctx.organizationId);
    const d = parseInput(projectSchema(currency), input);
    const sb = await createClient();
    const { data, error } = await sb
      .from("projects")
      .update({
        name: d.name, client_id: d.client_id, service_id: d.service_id ?? null, description: d.description ?? null, scope: d.scope ?? null,
        start_date: d.start_date ?? null, due_date: d.due_date ?? null,
        priority: d.priority, status: d.status as never, project_manager_id: d.project_manager_id ?? null, internal_notes: d.internal_notes ?? null,
        progress_mode: d.progress_mode, ...(d.progress_mode === "manual" && d.progress !== undefined ? { progress: d.progress } : {}),
      })
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error) dbError(error);
    if (!data) throw new ActionError("You can't edit this project.");
    // Money fields are only written by roles allowed to see them (RLS on project_finances enforces this too).
    if (ctx.can("projects.manage") || ctx.can("finance.manage")) {
      const { error: fErr } = await sb
        .from("project_finances")
        .upsert({ project_id: id, organization_id: ctx.organizationId, budget_cents: d.budget ?? null, contract_value_cents: d.contract_value ?? null });
      if (fErr) dbError(fErr);
    }
    revalidatePath(path(id));
    return null;
  }, "Project updated");
}

export async function setProjectStatus(id: string, status: string) {
  return teamAction(null, async () => {
    const s = parseInput(projectStatusEnum, status);
    const sb = await createClient();
    const { data, error } = await sb.from("projects").update({ status: s as never }).eq("id", id).select("id").maybeSingle();
    if (error) dbError(error);
    if (!data) throw new ActionError("You can't change this project's status.");
    revalidatePath(path(id));
    revalidatePath("/admin/projects");
    return null;
  }, "Status updated");
}

export async function archiveProject(id: string) {
  return teamAction("projects.manage", async () => {
    const sb = await createClient();
    const { error } = await sb.from("projects").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    if (error) dbError(error);
    revalidatePath("/admin/projects");
    return null;
  }, "Project archived");
}

export async function applyTemplate(projectId: string, templateId: string, startDate?: string) {
  return teamAction(null, async () => {
    const sb = await createClient();
    const { data, error } = await sb.rpc("apply_project_template", { p_project: projectId, p_template: templateId, p_start: startDate || undefined });
    if (error) dbError(error);
    revalidatePath(path(projectId));
    return { tasks: data ?? 0 };
  }, "Template applied");
}

export async function setProjectMembers(projectId: string, memberIds: string[]) {
  return teamAction(null, async (ctx) => {
    const ids = parseInput(z.array(z.uuid()), memberIds);
    const sb = await createClient();
    const { data: current, error } = await sb.from("project_members").select("profile_id").eq("project_id", projectId);
    if (error) dbError(error);
    const existing = new Set((current ?? []).map((m) => m.profile_id));
    const add = ids.filter((i) => !existing.has(i));
    const remove = [...existing].filter((i) => !ids.includes(i));
    if (add.length) {
      const { error: e } = await sb.from("project_members").insert(add.map((p) => ({ project_id: projectId, profile_id: p, added_by: ctx.userId })));
      if (e) dbError(e);
    }
    if (remove.length) {
      const { error: e } = await sb.from("project_members").delete().eq("project_id", projectId).in("profile_id", remove);
      if (e) dbError(e);
    }
    revalidatePath(path(projectId));
    return null;
  }, "Team updated");
}

// --- Milestones -------------------------------------------------------------
export async function saveMilestone(input: unknown) {
  return teamAction(null, async (ctx) => {
    const d = parseInput(milestoneSchema, input);
    const sb = await createClient();
    const row = {
      title: d.title, description: d.description ?? null, start_date: d.start_date ?? null, due_date: d.due_date ?? null,
      weight: d.weight, is_client_visible: d.is_client_visible, status: d.status,
    };
    if (d.id) {
      const { data, error } = await sb.from("milestones").update(row).eq("id", d.id).select("id").maybeSingle();
      if (error) dbError(error);
      if (!data) throw new ActionError("You can't edit this milestone.");
    } else {
      const { count } = await sb.from("milestones").select("id", { count: "exact", head: true }).eq("project_id", d.project_id);
      const { error } = await sb.from("milestones").insert({ ...row, project_id: d.project_id, organization_id: ctx.organizationId, sort_order: (count ?? 0) + 1 });
      if (error) dbError(error);
    }
    revalidatePath(path(d.project_id));
    return null;
  }, "Milestone saved");
}

export async function setMilestoneStatus(id: string, projectId: string, status: "pending" | "in_progress" | "completed") {
  return teamAction(null, async () => {
    const sb = await createClient();
    const { data, error } = await sb.from("milestones").update({ status }).eq("id", id).select("id").maybeSingle();
    if (error) dbError(error);
    if (!data) throw new ActionError("You can't update this milestone.");
    revalidatePath(path(projectId));
    return null;
  }, status === "completed" ? "Milestone completed" : "Milestone updated");
}

export async function deleteMilestone(id: string, projectId: string) {
  return teamAction(null, async () => {
    const sb = await createClient();
    const { error } = await sb.from("milestones").delete().eq("id", id);
    if (error) dbError(error);
    revalidatePath(path(projectId));
    return null;
  }, "Milestone deleted");
}

// --- Tasks ------------------------------------------------------------------
export async function saveTask(input: unknown) {
  return teamAction(null, async (ctx) => {
    const d = parseInput(taskSchema, input);
    const sb = await createClient();
    const row = {
      title: d.title, description: d.description ?? null, status: d.status as never, priority: d.priority, assignee_id: d.assignee_id ?? null,
      start_date: d.start_date ?? null, due_date: d.due_date ?? null, estimated_hours: d.estimated_hours ?? null,
      milestone_id: d.milestone_id ?? null, is_client_visible: d.is_client_visible, requires_client_action: d.requires_client_action,
    };
    if (d.id) {
      const { data, error } = await sb.from("tasks").update(row).eq("id", d.id).select("id").maybeSingle();
      if (error) dbError(error);
      if (!data) throw new ActionError("You can't edit this task.");
      revalidatePath(path(d.project_id));
      return { id: d.id };
    }
    const { data, error } = await sb
      .from("tasks")
      .insert({ ...row, project_id: d.project_id, parent_task_id: d.parent_task_id ?? null, organization_id: ctx.organizationId, created_by: ctx.userId })
      .select("id")
      .single();
    if (error) dbError(error);
    revalidatePath(path(d.project_id));
    return { id: data.id };
  }, "Task saved");
}

export async function setTaskStatus(id: string, status: string) {
  return teamAction(null, async () => {
    const s = parseInput(taskStatusEnum, status);
    const sb = await createClient();
    const { data, error } = await sb.from("tasks").update({ status: s as never }).eq("id", id).select("project_id").maybeSingle();
    if (error) dbError(error);
    if (!data) throw new ActionError("You can't update this task.");
    revalidatePath(path(data.project_id));
    return null;
  });
}

export async function deleteTask(id: string) {
  return teamAction(null, async () => {
    const sb = await createClient();
    const { data, error } = await sb.from("tasks").update({ deleted_at: new Date().toISOString() }).eq("id", id).select("project_id").maybeSingle();
    if (error) dbError(error);
    if (!data) throw new ActionError("You can't delete this task.");
    revalidatePath(path(data.project_id));
    return null;
  }, "Task deleted");
}

export async function addTaskComment(taskId: string, body: string) {
  return teamAction(null, async (ctx) => {
    const text = parseInput(z.string().trim().min(1, "Write a comment").max(10000), body);
    const sb = await createClient();
    const { error } = await sb.from("task_comments").insert({ task_id: taskId, body: text, author_id: ctx.userId, organization_id: ctx.organizationId });
    if (error) dbError(error);
    return null;
  });
}

// --- Deliverables -------------------------------------------------------------
export async function createDeliverable(input: unknown) {
  return teamAction(null, async (ctx) => {
    const d = parseInput(deliverableSchema, input);
    const sb = await createClient();
    const { data, error } = await sb
      .from("deliverables")
      .insert({ ...d, milestone_id: d.milestone_id ?? null, description: d.description ?? null, due_date: d.due_date ?? null, organization_id: ctx.organizationId, created_by: ctx.userId })
      .select("id")
      .single();
    if (error) dbError(error);
    revalidatePath(path(d.project_id));
    return { id: data.id };
  }, "Deliverable created");
}

/** Adds a new version (file or link). Optionally submits it to the client for approval (workflow #8). */
export async function addDeliverableVersion(input: { deliverable_id: string; file_id?: string | null; external_url?: string | null; notes?: string | null; submit: boolean }) {
  return teamAction(null, async (ctx) => {
    const d = parseInput(
      z.object({
        deliverable_id: z.uuid(),
        file_id: z.uuid().nullable().optional(),
        external_url: z.preprocess((v) => (v === "" ? null : v), z.url().nullable().optional()),
        notes: z.string().max(5000).nullable().optional(),
        submit: z.boolean(),
      }),
      input,
    );
    if (!d.file_id && !d.external_url) throw new ActionError("Attach a file or a link.");
    const sb = await createClient();
    const { data: del } = await sb.from("deliverables").select("id, project_id, current_version").eq("id", d.deliverable_id).maybeSingle();
    if (!del) throw new ActionError("Deliverable not found.");
    const version = del.current_version + 1;
    const { error } = await sb.from("deliverable_versions").insert({
      deliverable_id: del.id, version, file_id: d.file_id ?? null, external_url: d.external_url ?? null, notes: d.notes ?? null, created_by: ctx.userId,
    });
    if (error) dbError(error);
    if (d.file_id) await sb.from("files").update({ visibility: "client", category: "deliverable" }).eq("id", d.file_id);
    const { error: uErr } = await sb
      .from("deliverables")
      .update({ current_version: version, ...(d.submit ? { status: "submitted" as const, submitted_at: new Date().toISOString() } : {}) })
      .eq("id", del.id);
    if (uErr) dbError(uErr);
    revalidatePath(path(del.project_id));
    return null;
  }, input.submit ? "Version submitted for client approval" : "Version added");
}

export async function submitDeliverable(id: string) {
  return teamAction(null, async () => {
    const sb = await createClient();
    const { data: del } = await sb.from("deliverables").select("id, project_id, current_version, status").eq("id", id).maybeSingle();
    if (!del) throw new ActionError("Deliverable not found.");
    if (del.current_version < 1) throw new ActionError("Add a version before submitting.");
    const { error } = await sb.from("deliverables").update({ status: "submitted", submitted_at: new Date().toISOString() }).eq("id", id);
    if (error) dbError(error);
    revalidatePath(path(del.project_id));
    return null;
  }, "Sent to client for approval");
}

export async function setRevisionStatus(id: string, status: "open" | "in_progress" | "resolved") {
  return teamAction(null, async (ctx) => {
    const sb = await createClient();
    const { data, error } = await sb
      .from("revisions")
      .update({ status, resolved_at: status === "resolved" ? new Date().toISOString() : null, resolved_by: status === "resolved" ? ctx.userId : null })
      .eq("id", id)
      .select("project_id")
      .maybeSingle();
    if (error) dbError(error);
    if (!data) throw new ActionError("You can't update this revision.");
    revalidatePath(path(data.project_id));
    return null;
  }, "Revision updated");
}

// --- Time tracking ------------------------------------------------------------
export async function logTime(input: unknown) {
  return teamAction(null, async (ctx) => {
    const d = parseInput(timeEntrySchema, input);
    const sb = await createClient();
    const { error } = await sb.from("time_entries").insert({
      organization_id: ctx.organizationId, project_id: d.project_id, task_id: d.task_id ?? null, profile_id: ctx.userId,
      entry_date: d.entry_date, minutes: Math.round(d.hours * 60), description: d.description ?? null, billable: d.billable,
    });
    if (error) dbError(error);
    revalidatePath(path(d.project_id));
    return null;
  }, "Time logged");
}

export async function deleteTimeEntry(id: string, projectId: string) {
  return teamAction(null, async () => {
    const sb = await createClient();
    const { error } = await sb.from("time_entries").delete().eq("id", id);
    if (error) dbError(error);
    revalidatePath(path(projectId));
    return null;
  }, "Entry removed");
}
