import { z } from "zod";
import { checkbox, optionalDate, optionalMoneyInput, optionalText, optionalUuid, requiredText } from "@/lib/validations/common";
import { PROJECT_PIPELINE, TASK_PIPELINE } from "@/lib/status";

export const projectStatusEnum = z.enum(PROJECT_PIPELINE as [string, ...string[]]);
export const taskStatusEnum = z.enum(TASK_PIPELINE as [string, ...string[]]);
const priority = z.enum(["low", "medium", "high", "urgent"]);

export const projectSchema = (currency = "USD") =>
  z
    .object({
      name: requiredText("Project name", 200),
      client_id: z.uuid({ message: "Choose a client" }),
      service_id: optionalUuid,
      template_id: optionalUuid,
      description: optionalText(5000),
      scope: optionalText(20000),
      budget: optionalMoneyInput(currency),
      contract_value: optionalMoneyInput(currency),
      start_date: optionalDate,
      due_date: optionalDate,
      priority: priority.default("medium"),
      status: projectStatusEnum.default("planning"),
      project_manager_id: optionalUuid,
      member_ids: z.array(z.uuid()).default([]),
      internal_notes: optionalText(10000),
      progress_mode: z.enum(["milestones", "manual"]).default("milestones"),
      progress: z.coerce.number().int().min(0).max(100).optional(),
    })
    .refine((v) => !v.start_date || !v.due_date || v.due_date >= v.start_date, { message: "Deadline must be after the start date", path: ["due_date"] });
export type ProjectInput = z.input<ReturnType<typeof projectSchema>>;

export const milestoneSchema = z.object({
  id: optionalUuid,
  project_id: z.uuid(),
  title: requiredText("Title", 200),
  description: optionalText(5000),
  start_date: optionalDate,
  due_date: optionalDate,
  weight: z.coerce.number().int().min(1).max(100).default(1),
  is_client_visible: checkbox.default(true),
  status: z.enum(["pending", "in_progress", "completed"]).default("pending"),
});
export type MilestoneInput = z.input<typeof milestoneSchema>;

export const taskSchema = z.object({
  id: optionalUuid,
  project_id: z.uuid(),
  milestone_id: optionalUuid,
  parent_task_id: optionalUuid,
  title: requiredText("Title", 300),
  description: optionalText(10000),
  status: taskStatusEnum.default("todo"),
  priority: priority.default("medium"),
  assignee_id: optionalUuid,
  start_date: optionalDate,
  due_date: optionalDate,
  estimated_hours: z.preprocess((v) => (v === "" || v === null ? null : v), z.coerce.number().min(0).max(10000).nullable().optional()),
  is_client_visible: checkbox.default(false),
  requires_client_action: checkbox.default(false),
});
export type TaskInput = z.input<typeof taskSchema>;

export const deliverableSchema = z.object({
  project_id: z.uuid(),
  milestone_id: optionalUuid,
  title: requiredText("Title", 200),
  description: optionalText(5000),
  due_date: optionalDate,
});
export type DeliverableInput = z.input<typeof deliverableSchema>;

export const timeEntrySchema = z.object({
  project_id: z.uuid(),
  task_id: optionalUuid,
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hours: z.coerce.number().min(0.25, "Minimum 15 minutes").max(24),
  description: optionalText(500),
  billable: checkbox.default(true),
});
export type TimeEntryInput = z.input<typeof timeEntrySchema>;
