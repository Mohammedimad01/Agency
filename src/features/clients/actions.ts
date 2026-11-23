"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ActionError, dbError, parseInput, teamAction } from "@/lib/action";
import { generateAuthLink } from "@/lib/auth/links";
import { sendEmailNow } from "@/lib/email/dispatcher";
import { clientSchema, contactSchema } from "./schemas";

export async function saveClient(id: string | null, input: unknown) {
  return teamAction("clients.manage", async (ctx) => {
    const d = parseInput(clientSchema, input);
    const sb = await createClient();
    const row = { ...d, account_manager_id: d.account_manager_id ?? null };
    if (id) {
      const { error } = await sb.from("clients").update(row).eq("id", id);
      if (error) dbError(error);
      revalidatePath(`/admin/clients/${id}`);
      return { id };
    }
    const { data, error } = await sb.from("clients").insert({ ...row, organization_id: ctx.organizationId, created_by: ctx.userId }).select("id").single();
    if (error) dbError(error);
    // A client with an email gets a primary contact automatically.
    if (d.email) {
      await sb.from("client_contacts").insert({
        organization_id: ctx.organizationId, client_id: data.id, full_name: d.type === "individual" ? d.name : (d.company_name ?? d.name),
        email: d.email, phone: d.phone ?? null, is_primary: true,
      });
    }
    revalidatePath("/admin/clients");
    return { id: data.id };
  }, id ? "Client updated" : "Client created");
}

export async function archiveClient(id: string) {
  return teamAction("clients.manage", async () => {
    const sb = await createClient();
    const { error } = await sb.from("clients").update({ status: "archived", deleted_at: new Date().toISOString() }).eq("id", id);
    if (error) dbError(error);
    revalidatePath("/admin/clients");
    return null;
  }, "Client archived");
}

export async function saveContact(input: unknown) {
  return teamAction("clients.manage", async (ctx) => {
    const d = parseInput(contactSchema, input);
    const sb = await createClient();
    if (d.is_primary) await sb.from("client_contacts").update({ is_primary: false }).eq("client_id", d.client_id);
    const row = { full_name: d.full_name, email: d.email, phone: d.phone ?? null, job_title: d.job_title ?? null, is_primary: d.is_primary };
    const { error } = d.id
      ? await sb.from("client_contacts").update(row).eq("id", d.id)
      : await sb.from("client_contacts").insert({ ...row, client_id: d.client_id, organization_id: ctx.organizationId });
    if (error) dbError(error);
    revalidatePath(`/admin/clients/${d.client_id}`);
    return null;
  }, "Contact saved");
}

export async function removeContact(id: string) {
  return teamAction("clients.manage", async () => {
    const sb = await createClient();
    const { error } = await sb.from("client_contacts").update({ deleted_at: new Date().toISOString(), portal_access: false }).eq("id", id);
    if (error) dbError(error);
    return null;
  }, "Contact removed");
}

/**
 * Grants a contact access to the client portal. The authorization check runs
 * against the user's own RLS-scoped view of the contact before any
 * service-role call is made.
 */
export async function inviteContactToPortal(contactId: string) {
  return teamAction("clients.manage", async (ctx) => {
    const sb = await createClient();
    const { data: contact } = await sb
      .from("client_contacts")
      .select("id, email, full_name, client_id, organization_id, clients(name)")
      .eq("id", contactId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!contact || contact.organization_id !== ctx.organizationId) throw new ActionError("Contact not found.");

    const admin = createAdminClient();
    // Team members can't also be portal users of their own agency.
    const { data: existingProfile } = await admin.from("profiles").select("id").eq("email", contact.email).maybeSingle();
    if (existingProfile) {
      const { data: tm } = await admin.from("team_members").select("id").eq("profile_id", existingProfile.id).eq("organization_id", ctx.organizationId).maybeSingle();
      if (tm) throw new ActionError("This email belongs to a team member and can't be used for client portal access.");
    }
    const { userId, actionLink } = await generateAuthLink({ kind: "invite", email: String(contact.email), fullName: contact.full_name, next: "/accept-invite" });
    const { error } = await admin
      .from("client_contacts")
      .update({ profile_id: userId, portal_access: true, invited_at: new Date().toISOString() })
      .eq("id", contact.id);
    if (error) dbError(error);
    await sendEmailNow(String(contact.email), contact.full_name, "client_invitation", {
      action_link: actionLink,
      client_name: contact.clients?.name,
      inviter: ctx.profile.full_name ?? ctx.organization.name,
    });
    await sb.from("activity_logs").insert({
      organization_id: ctx.organizationId, actor_id: ctx.userId, entity_type: "client", entity_id: contact.client_id,
      action: "portal_invited", description: `Portal invitation sent to ${contact.full_name}`, client_id: contact.client_id,
    });
    revalidatePath(`/admin/clients/${contact.client_id}`);
    return null;
  }, "Portal invitation sent");
}

export async function revokePortalAccess(contactId: string) {
  return teamAction("clients.manage", async () => {
    const sb = await createClient();
    const { error } = await sb.from("client_contacts").update({ portal_access: false }).eq("id", contactId);
    if (error) dbError(error);
    return null;
  }, "Portal access revoked");
}
