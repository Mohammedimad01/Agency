import { z } from "zod";
import { LEAD_PIPELINE } from "@/lib/status";
import { email, optionalDate, optionalMoneyInput, optionalText, optionalUrl, optionalUuid, requiredText } from "@/lib/validations/common";

export const leadStatusEnum = z.enum(LEAD_PIPELINE as [string, ...string[]]);
export const priorityEnum = z.enum(["low", "medium", "high", "urgent"]);

export const leadFormSchema = (currency = "USD") =>
  z.object({
    full_name: requiredText("Name", 200),
    company: optionalText(200),
    email,
    phone: optionalText(40),
    website: optionalUrl,
    industry: optionalText(100),
    country: optionalText(80),
    source: z.string().trim().min(1).max(40).default("manual"),
    service_id: optionalUuid,
    requested_service: optionalText(200),
    budget: optionalMoneyInput(currency),
    timeline: optionalText(60),
    description: optionalText(5000),
    assigned_to: optionalUuid,
    priority: priorityEnum.default("medium"),
    status: leadStatusEnum.default("new"),
    follow_up_at: z.preprocess((v) => (v === "" ? null : v), z.string().nullable().optional()),
    internal_notes: optionalText(10000),
  });

export type LeadFormInput = z.input<ReturnType<typeof leadFormSchema>>;

export const noteSchema = z.object({ lead_id: z.uuid(), body: requiredText("Note", 10000) });

export const activitySchema = z.object({
  lead_id: z.uuid(),
  type: z.enum(["call", "email", "meeting", "other"]),
  description: requiredText("Summary", 2000),
});

export const convertSchema = z.object({
  lead_id: z.uuid(),
  mode: z.enum(["new", "existing"]),
  existing_client_id: optionalUuid,
  client_name: optionalText(200),
  client_type: z.enum(["individual", "company"]).default("company"),
  create_project: z.boolean().default(false),
  project_name: optionalText(200),
  template_id: optionalUuid,
  start_date: optionalDate,
  due_date: optionalDate,
  project_manager_id: optionalUuid,
});
export type ConvertInput = z.input<typeof convertSchema>;

export const meetingSchema = z.object({
  id: optionalUuid,
  lead_id: optionalUuid,
  client_id: optionalUuid,
  title: requiredText("Title", 200),
  status: z.enum(["requested", "scheduled", "completed", "cancelled"]).default("scheduled"),
  scheduled_at: z.preprocess((v) => (v === "" ? null : v), z.string().nullable().optional()),
  duration_minutes: z.coerce.number().int().min(5).max(600).default(30),
  meeting_url: optionalUrl,
  agenda: optionalText(5000),
  notes: optionalText(10000),
});
export type MeetingInput = z.input<typeof meetingSchema>;
