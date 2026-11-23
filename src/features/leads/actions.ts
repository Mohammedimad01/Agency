"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ActionError, dbError, parseInput, teamAction } from "@/lib/action";
import { getCurrency } from "@/features/settings/queries";
import { qualifyLead } from "./qualification";
import { activitySchema, convertSchema, leadFormSchema, leadStatusEnum, meetingSchema, noteSchema } from "./schemas";
import type { Json } from "@/types/database";
import { z } from "zod";

type SB = Awaited<ReturnType<typeof createClient>>;

async function score(sb: SB, orgId: string, input: { service_id?: string | null; requested_service?: string | null; budget_cents: number | null; timeline?: string | null }) {
  const [{ data: service }, { data: settings }, { count }] = await Promise.all([
    input.service_id ? sb.from("services").select("name, starting_price_cents").eq("id", input.service_id).maybeSingle() : Promise.resolve({ data: null }),
    sb.from("settings").select("lead_capacity_projects").eq("organization_id", orgId).maybeSingle(),
    sb.from("projects").select("id", { count: "exact", head: true }).eq("organization_id", orgId).is("deleted_at", null).in("status", ["planning", "in_progress", "awaiting_client", "in_review"]),
  ]);
  const result = qualifyLead({
    budgetCents: input.budget_cents,
    serviceStartingPriceCents: service?.starting_price_cents ?? null,
    serviceMatched: Boolean(service),
    requestedService: service?.name ?? input.requested_service ?? null,
    timeline: input.timeline ?? null,
    activeProjects: count ?? 0,
    capacityProjects: settings?.lead_capacity_projects ?? 6,
  });
  return { qualification_score: result.score, qualification: { breakdown: result.breakdown, scored_at: new Date().toISOString(), engine: "v1" } as unknown as NonNullable<Json>, serviceName: service?.name ?? null };
}

export async function saveLead(id: string | null, input: unknown) {
  return teamAction(id ? null : "leads.manage", async (ctx) => {
    const currency = await getCurrency(ctx.organizationId);
    const d = parseInput(leadFormSchema(currency), input);
    const sb = await createClient();
    const scored = await score(sb, ctx.organizationId, { service_id: d.service_id, requested_service: d.requested_service, budget_cents: d.budget ?? null, timeline: d.timeline });
    const row = {
      full_name: d.full_name, company: d.company ?? null, email: d.email, phone: d.phone ?? null, website: d.website ?? null,
      industry: d.industry ?? null, country: d.country ?? null, source: d.source, service_id: d.service_id ?? null,
      requested_service: d.requested_service ?? scored.serviceName, budget_cents: d.budget ?? null, timeline: d.timeline ?? null,
      description: d.description ?? null, assigned_to: d.assigned_to ?? null, priority: d.priority, status: d.status as never,
      follow_up_at: d.follow_up_at ? new Date(d.follow_up_at).toISOString() : null, internal_notes: d.internal_notes ?? null,
      qualification_score: scored.qualification_score, qualification: scored.qualification,
    };
    if (id) {
      const { data, error } = await sb.from("leads").update(row).eq("id", id).select("id").maybeSingle();
      if (error) dbError(error);
      if (!data) throw new ActionError("Lead not found or you can't edit it.");
      revalidatePath(`/admin/leads/${id}`);
      return { id };
    }
    const { data, error } = await sb.from("leads").insert({ ...row, organization_id: ctx.organizationId, created_by: ctx.userId }).select("id").single();
    if (error) dbError(error);
    revalidatePath("/admin/leads");
    return { id: data.id };
  }, id ? "Lead updated" : "Lead created");
}

export async function updateLeadStatus(id: string, status: string) {
  return teamAction(null, async () => {
    const s = parseInput(leadStatusEnum, status);
    const sb = await createClient();
    const { data, error } = await sb.from("leads").update({ status: s as never }).eq("id", id).select("id").maybeSingle();
    if (error) dbError(error);
    if (!data) throw new ActionError("You can't update this lead.");
    revalidatePath("/admin/leads");
    return null;
  });
}

export async function assignLead(id: string, assigneeId: string | null) {
  return teamAction("leads.manage", async () => {
    const sb = await createClient();
    const { error } = await sb.from("leads").update({ assigned_to: assigneeId }).eq("id", id);
    if (error) dbError(error);
    return null;
  }, "Lead assigned");
}

export async function setFollowUp(id: string, at: string | null) {
  return teamAction(null, async () => {
    const sb = await createClient();
    const value = at ? new Date(at) : null;
    if (value && Number.isNaN(value.getTime())) throw new ActionError("Invalid date");
    const { data, error } = await sb.from("leads").update({ follow_up_at: value?.toISOString() ?? null }).eq("id", id).select("id").maybeSingle();
    if (error) dbError(error);
    if (!data) throw new ActionError("You can't update this lead.");
    return null;
  }, at ? "Follow-up scheduled" : "Follow-up cleared");
}

export async function addLeadNote(input: unknown) {
  return teamAction(null, async (ctx) => {
    const d = parseInput(noteSchema, input);
    const sb = await createClient();
    const { error } = await sb.from("lead_notes").insert({ lead_id: d.lead_id, body: d.body, author_id: ctx.userId, organization_id: ctx.organizationId });
    if (error) dbError(error);
    await sb.from("lead_activities").insert({ lead_id: d.lead_id, organization_id: ctx.organizationId, actor_id: ctx.userId, type: "note", description: "Added a note" });
    return null;
  }, "Note added");
}

export async function deleteLeadNote(id: string) {
  return teamAction(null, async () => {
    const sb = await createClient();
    const { error } = await sb.from("lead_notes").delete().eq("id", id);
    if (error) dbError(error);
    return null;
  }, "Note deleted");
}

export async function logLeadActivity(input: unknown) {
  return teamAction(null, async (ctx) => {
    const d = parseInput(activitySchema, input);
    const sb = await createClient();
    const { error } = await sb.from("lead_activities").insert({ ...d, organization_id: ctx.organizationId, actor_id: ctx.userId });
    if (error) dbError(error);
    // Logging first contact moves a brand-new lead forward automatically.
    await sb.from("leads").update({ status: "contacted" }).eq("id", d.lead_id).eq("status", "new");
    return null;
  }, "Activity logged");
}

export async function rescoreLead(id: string) {
  return teamAction(null, async (ctx) => {
    const sb = await createClient();
    const { data: lead } = await sb.from("leads").select("service_id, requested_service, budget_cents, timeline").eq("id", id).maybeSingle();
    if (!lead) throw new ActionError("Lead not found");
    const scored = await score(sb, ctx.organizationId, lead);
    const { error } = await sb.from("leads").update({ qualification_score: scored.qualification_score, qualification: scored.qualification }).eq("id", id);
    if (error) dbError(error);
    return { score: scored.qualification_score };
  }, "Qualification score recalculated");
}

/** Workflow #4: lead -> client (+ optional project from template). Runs in a single DB transaction. */
export async function convertLead(input: unknown) {
  return teamAction("leads.manage", async (ctx) => {
    if (!ctx.can("clients.manage")) throw new ActionError("You need client management permission to convert leads.");
    const d = parseInput(convertSchema, input);
    if (d.mode === "existing" && !d.existing_client_id) throw new ActionError("Choose an existing client.", { existing_client_id: ["Required"] });
    if (d.create_project && !d.project_name) throw new ActionError("Enter a project name.", { project_name: ["Required"] });
    const sb = await createClient();
    const { data, error } = await sb.rpc("convert_lead", {
      p_lead: d.lead_id,
      p_client: d.mode === "existing" ? { existing_client_id: d.existing_client_id } : { name: d.client_name ?? "", type: d.client_type },
      p_project: d.create_project
        ? { name: d.project_name, template_id: d.template_id ?? "", start_date: d.start_date ?? "", due_date: d.due_date ?? "", project_manager_id: d.project_manager_id ?? "" }
        : undefined,
    });
    if (error) dbError(error);
    revalidatePath("/admin/leads");
    revalidatePath("/admin/clients");
    return data as { client_id: string; project_id: string | null; already_converted: boolean };
  }, "Lead converted");
}

export async function deleteLead(id: string) {
  return teamAction("leads.manage", async () => {
    const sb = await createClient();
    const { error } = await sb.from("leads").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    if (error) dbError(error);
    revalidatePath("/admin/leads");
    return null;
  }, "Lead archived");
}

export async function saveMeeting(input: unknown) {
  return teamAction(null, async (ctx) => {
    const d = parseInput(meetingSchema, input);
    const sb = await createClient();
    const row = {
      lead_id: d.lead_id ?? null, client_id: d.client_id ?? null, title: d.title, status: d.status,
      scheduled_at: d.scheduled_at ? new Date(d.scheduled_at).toISOString() : null, duration_minutes: d.duration_minutes,
      meeting_url: d.meeting_url ?? null, agenda: d.agenda ?? null, notes: d.notes ?? null,
    };
    if (d.id) {
      const { error } = await sb.from("meeting_records").update(row).eq("id", d.id);
      if (error) dbError(error);
    } else {
      const { error } = await sb.from("meeting_records").insert({ ...row, organization_id: ctx.organizationId, created_by: ctx.userId });
      if (error) dbError(error);
      if (d.lead_id) {
        await sb.from("lead_activities").insert({ lead_id: d.lead_id, organization_id: ctx.organizationId, actor_id: ctx.userId, type: "meeting", description: `Meeting scheduled: ${d.title}` });
        await sb.from("leads").update({ status: "discovery" }).eq("id", d.lead_id).in("status", ["new", "contacted"]);
      }
    }
    revalidatePath("/admin/meetings");
    return null;
  }, "Meeting saved");
}

export async function updateMeetingStatus(id: string, status: string) {
  return teamAction(null, async () => {
    const s = parseInput(z.enum(["requested", "scheduled", "completed", "cancelled"]), status);
    const sb = await createClient();
    const { error } = await sb.from("meeting_records").update({ status: s }).eq("id", id);
    if (error) dbError(error);
    return null;
  }, "Meeting updated");
}
