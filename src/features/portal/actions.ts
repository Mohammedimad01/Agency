"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { clientAction, dbError, parseInput } from "@/lib/action";

/** Client approval or change request (workflow #8). Authorization happens inside the SECURITY DEFINER RPC. */
export async function reviewDeliverable(input: { deliverableId: string; decision: "approved" | "changes_requested"; feedback?: string }) {
  return clientAction(async () => {
    const d = parseInput(z.object({ deliverableId: z.uuid(), decision: z.enum(["approved", "changes_requested"]), feedback: z.string().max(5000).optional() }), input);
    const sb = await createClient();
    const { error } = await sb.rpc("portal_review_deliverable", { p_deliverable: d.deliverableId, p_decision: d.decision, p_feedback: d.feedback ?? "" });
    if (error) dbError(error);
    revalidatePath("/portal", "layout");
    return null;
  }, input.decision === "approved" ? "Approved — thank you!" : "Your feedback has been sent to the team");
}

export async function respondToProposal(input: { proposalId: string; decision: "accepted" | "rejected"; note?: string }) {
  return clientAction(async () => {
    const d = parseInput(z.object({ proposalId: z.uuid(), decision: z.enum(["accepted", "rejected"]), note: z.string().max(3000).optional() }), input);
    const sb = await createClient();
    const { error } = await sb.rpc("portal_respond_proposal", { p_proposal: d.proposalId, p_decision: d.decision, p_note: d.note ?? "" });
    if (error) dbError(error);
    revalidatePath("/portal", "layout");
    return null;
  }, input.decision === "accepted" ? "Proposal accepted. We'll be in touch shortly." : "Response sent");
}

export async function markProposalViewed(proposalId: string) {
  const sb = await createClient();
  await sb.rpc("portal_mark_proposal_viewed", { p_proposal: proposalId });
}

export async function acceptContract(contractId: string) {
  return clientAction(async () => {
    const sb = await createClient();
    const { error } = await sb.rpc("portal_accept_contract", { p_contract: contractId });
    if (error) dbError(error);
    revalidatePath("/portal/documents");
    return null;
  }, "Acceptance recorded");
}

export async function updateMyContact(input: { full_name: string; phone: string; job_title: string }) {
  return clientAction(async () => {
    const d = parseInput(z.object({ full_name: z.string().trim().min(2).max(120), phone: z.string().max(40), job_title: z.string().max(100) }), input);
    const sb = await createClient();
    const { error } = await sb.rpc("portal_update_my_contact", { p_full_name: d.full_name, p_phone: d.phone, p_job_title: d.job_title });
    if (error) dbError(error);
    revalidatePath("/portal/settings");
    return null;
  }, "Details updated");
}
