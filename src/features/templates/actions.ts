"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { dbError, parseInput, teamAction } from "@/lib/action";
import { checkbox, optionalText, optionalUuid, requiredText } from "@/lib/validations/common";

const templateSchema = z.object({ name: requiredText("Name", 120), description: optionalText(2000), service_id: optionalUuid, is_active: checkbox.default(true) });
const tplMilestoneSchema = z.object({
  id: optionalUuid, template_id: z.uuid(), title: requiredText("Title", 200), description: optionalText(2000),
  offset_days: z.coerce.number().int().min(0).max(3650), duration_days: z.coerce.number().int().min(0).max(3650),
  weight: z.coerce.number().int().min(1).max(100), is_client_visible: checkbox.default(true),
});
const tplTaskSchema = z.object({
  template_id: z.uuid(), milestone_id: optionalUuid, title: requiredText("Title", 300), offset_days: z.coerce.number().int().min(0).max(3650).default(0),
  estimated_hours: z.preprocess((v) => (v === "" ? null : v), z.coerce.number().min(0).max(1000).nullable().optional()),
  is_client_visible: checkbox.default(false), requires_client_action: checkbox.default(false), default_role: optionalText(40),
});
export type TemplateInput = z.input<typeof templateSchema>;
export type TplMilestoneInput = z.input<typeof tplMilestoneSchema>;
export type TplTaskInput = z.input<typeof tplTaskSchema>;

export async function saveTemplate(id: string | null, input: unknown) {
  return teamAction("templates.manage", async (ctx) => {
    const d = parseInput(templateSchema, input);
    const sb = await createClient();
    const row = { ...d, service_id: d.service_id ?? null, description: d.description ?? null };
    if (id) {
      const { error } = await sb.from("project_templates").update(row).eq("id", id);
      if (error) dbError(error);
      revalidatePath(`/admin/templates/${id}`);
      return { id };
    }
    const { data, error } = await sb.from("project_templates").insert({ ...row, organization_id: ctx.organizationId, created_by: ctx.userId }).select("id").single();
    if (error) dbError(error);
    return { id: data.id };
  }, "Template saved");
}

export async function deleteTemplate(id: string) {
  return teamAction("templates.manage", async () => {
    const sb = await createClient();
    const { error } = await sb.from("project_templates").delete().eq("id", id);
    if (error) dbError(error);
    revalidatePath("/admin/templates");
    return null;
  }, "Template deleted");
}

export async function saveTemplateMilestone(input: unknown) {
  return teamAction("templates.manage", async () => {
    const d = parseInput(tplMilestoneSchema, input);
    const sb = await createClient();
    const row = { title: d.title, description: d.description ?? null, offset_days: d.offset_days, duration_days: d.duration_days, weight: d.weight, is_client_visible: d.is_client_visible };
    if (d.id) {
      const { error } = await sb.from("project_template_milestones").update(row).eq("id", d.id);
      if (error) dbError(error);
    } else {
      const { count } = await sb.from("project_template_milestones").select("id", { count: "exact", head: true }).eq("template_id", d.template_id);
      const { error } = await sb.from("project_template_milestones").insert({ ...row, template_id: d.template_id, sort_order: (count ?? 0) + 1 });
      if (error) dbError(error);
    }
    revalidatePath(`/admin/templates/${d.template_id}`);
    return null;
  }, "Milestone saved");
}

export async function deleteTemplateMilestone(id: string, templateId: string) {
  return teamAction("templates.manage", async () => {
    const sb = await createClient();
    const { error } = await sb.from("project_template_milestones").delete().eq("id", id);
    if (error) dbError(error);
    revalidatePath(`/admin/templates/${templateId}`);
    return null;
  }, "Milestone removed");
}

export async function addTemplateTask(input: unknown) {
  return teamAction("templates.manage", async () => {
    const d = parseInput(tplTaskSchema, input);
    const sb = await createClient();
    const { count } = await sb.from("project_template_tasks").select("id", { count: "exact", head: true }).eq("template_id", d.template_id);
    const { error } = await sb.from("project_template_tasks").insert({
      template_id: d.template_id, milestone_id: d.milestone_id ?? null, title: d.title, offset_days: d.offset_days, estimated_hours: d.estimated_hours ?? null,
      is_client_visible: d.is_client_visible, requires_client_action: d.requires_client_action, default_role: d.default_role ?? null, sort_order: (count ?? 0) + 1,
    });
    if (error) dbError(error);
    revalidatePath(`/admin/templates/${d.template_id}`);
    return null;
  }, "Task added");
}

export async function deleteTemplateTask(id: string, templateId: string) {
  return teamAction("templates.manage", async () => {
    const sb = await createClient();
    const { error } = await sb.from("project_template_tasks").delete().eq("id", id);
    if (error) dbError(error);
    revalidatePath(`/admin/templates/${templateId}`);
    return null;
  }, "Task removed");
}
