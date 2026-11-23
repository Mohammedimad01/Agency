"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ActionError, dbError, parseInput, teamAction } from "@/lib/action";
import { getCurrency } from "@/features/settings/queries";
import { normaliseDiscount, proposalSchema } from "@/features/finance/schemas";
import { toItemPayload } from "@/features/finance/items";
import { inviteContactToPortal } from "@/features/clients/actions";

export async function saveProposal(id: string | null, input: unknown) {
  return teamAction("proposals.manage", async (ctx) => {
    const currency = await getCurrency(ctx.organizationId);
    const d = parseInput(proposalSchema(currency), input);
    let discount: number;
    try {
      discount = normaliseDiscount(d.discount_type, d.discount_value, currency);
    } catch (e) {
      throw new ActionError((e as Error).message, { discount_value: [(e as Error).message] });
    }
    const sb = await createClient();
    const header = {
      client_id: d.client_id ?? null, lead_id: d.lead_id ?? null, title: d.title, summary: d.summary ?? null, scope: d.scope ?? null, timeline: d.timeline ?? null,
      payment_terms: d.payment_terms ?? null, valid_until: d.valid_until ?? null, discount_type: d.discount_type, discount_value: discount, tax_rate_bps: d.tax_rate,
    };
    let proposalId = id;
    if (id) {
      const { data, error } = await sb.from("proposals").update(header).eq("id", id).in("status", ["draft", "sent", "viewed"]).select("id").maybeSingle();
      if (error) dbError(error);
      if (!data) throw new ActionError("Only draft or open proposals can be edited.");
    } else {
      const { data, error } = await sb.from("proposals").insert({ ...header, organization_id: ctx.organizationId, number: "", created_by: ctx.userId }).select("id").single();
      if (error) dbError(error);
      proposalId = data.id;
    }
    const { error: itemsError } = await sb.rpc("replace_document_items", { p_kind: "proposal", p_id: proposalId!, p_items: toItemPayload(d.items) });
    if (itemsError) dbError(itemsError);
    revalidatePath("/admin/proposals");
    return { id: proposalId! };
  }, "Proposal saved");
}

/**
 * Sends the proposal to the client portal. A lead-only proposal first gets a
 * client record (without marking the lead as won) and portal access, so the
 * prospect can review and accept online.
 */
export async function sendProposal(id: string) {
  return teamAction("proposals.manage", async (ctx) => {
    const sb = await createClient();
    const { data: p } = await sb.from("proposals").select("id, status, client_id, lead_id, total_cents").eq("id", id).maybeSingle();
    if (!p) throw new ActionError("Proposal not found.");
    if (p.total_cents <= 0) throw new ActionError("Add priced line items before sending.");
    if (!["draft", "sent", "viewed"].includes(p.status)) throw new ActionError("This proposal can no longer be sent.");
    let clientId = p.client_id;
    if (!clientId && p.lead_id) {
      if (!ctx.can("clients.manage")) throw new ActionError("Convert the lead to a client before sending (requires client management permission).");
      const { data, error } = await sb.rpc("convert_lead", { p_lead: p.lead_id, p_client: {}, p_mark_won: false });
      if (error) dbError(error);
      clientId = (data as { client_id: string }).client_id;
    }
    if (!clientId) throw new ActionError("The proposal needs a client.");
    // Make sure at least one contact can open the portal.
    const { data: contacts } = await sb.from("client_contacts").select("id, portal_access, is_primary").eq("client_id", clientId).is("deleted_at", null);
    if (!contacts?.some((c) => c.portal_access)) {
      const primary = contacts?.find((c) => c.is_primary) ?? contacts?.[0];
      if (!primary) throw new ActionError("Add a contact to this client before sending.");
      const invited = await inviteContactToPortal(primary.id);
      if (!invited.ok) throw new ActionError(invited.error);
    }
    const { error } = await sb.from("proposals").update({ status: "sent", client_id: clientId }).eq("id", id);
    if (error) dbError(error);
    revalidatePath(`/admin/proposals/${id}`);
    return null;
  }, "Proposal sent to the client portal");
}

/** Records a decision received outside the portal (e.g. by email or in a meeting). */
export async function recordProposalDecision(id: string, decision: "accepted" | "rejected", note?: string) {
  return teamAction("proposals.manage", async (ctx) => {
    const sb = await createClient();
    const { data, error } = await sb
      .from("proposals")
      .update({ status: decision, responded_at: new Date().toISOString(), responded_by: ctx.userId, client_response_note: note ? `Recorded by team: ${note}` : "Recorded by team" })
      .eq("id", id)
      .in("status", ["sent", "viewed"])
      .select("id")
      .maybeSingle();
    if (error) dbError(error);
    if (!data) throw new ActionError("Only sent proposals can be accepted or rejected.");
    revalidatePath(`/admin/proposals/${id}`);
    return null;
  }, decision === "accepted" ? "Marked as accepted" : "Marked as rejected");
}

/** Workflow #5: accepted proposal -> project (+ contract), optionally from a template. */
export async function convertProposalToProject(id: string, input: { template_id?: string; start_date?: string; project_manager_id?: string; create_contract: boolean }) {
  return teamAction("proposals.manage", async () => {
    const sb = await createClient();
    const { data, error } = await sb.rpc("create_project_from_proposal", {
      p_proposal: id,
      p_template: input.template_id || undefined,
      p_options: { start_date: input.start_date ?? "", project_manager_id: input.project_manager_id ?? "", create_contract: input.create_contract },
    });
    if (error) dbError(error);
    revalidatePath(`/admin/proposals/${id}`);
    return data as { project_id: string; contract_id: string | null };
  }, "Project created from proposal");
}

export async function invoiceFromProposal(id: string, percent: number) {
  return teamAction("finance.manage", async () => {
    if (!Number.isInteger(percent) || percent < 1 || percent > 100) throw new ActionError("Percent must be between 1 and 100.");
    const sb = await createClient();
    const { data, error } = await sb.rpc("create_invoice_from_proposal", { p_proposal: id, p_percent: percent });
    if (error) dbError(error);
    return { id: data as string };
  }, "Draft invoice created");
}

export async function archiveProposal(id: string) {
  return teamAction("proposals.manage", async () => {
    const sb = await createClient();
    const { error } = await sb.from("proposals").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    if (error) dbError(error);
    revalidatePath("/admin/proposals");
    return null;
  }, "Proposal archived");
}
