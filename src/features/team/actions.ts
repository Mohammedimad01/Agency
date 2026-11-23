"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ActionError, dbError, parseInput, teamAction } from "@/lib/action";
import { generateAuthLink } from "@/lib/auth/links";
import { sendEmailNow } from "@/lib/email/dispatcher";
import { ROLE_LABELS, TEAM_ROLES, isPermission, type TeamRole } from "@/lib/permissions";
import { email, optionalMoneyInput, optionalText, requiredText } from "@/lib/validations/common";
import { getCurrency } from "@/features/settings/queries";

const roleEnum = z.enum(TEAM_ROLES);

const inviteSchema = z.object({ full_name: requiredText("Name", 120), email, role_key: roleEnum, title: optionalText(100) });

export async function inviteTeamMember(input: unknown) {
  return teamAction("team.manage", async (ctx) => {
    const d = parseInput(inviteSchema, input);
    if (d.role_key === "owner" && ctx.role !== "owner") throw new ActionError("Only an owner can invite another owner.");
    const admin = createAdminClient();
    const { data: existing } = await admin.from("profiles").select("id").eq("email", d.email).maybeSingle();
    if (existing) {
      const { data: tm } = await admin.from("team_members").select("id, status").eq("profile_id", existing.id).eq("organization_id", ctx.organizationId).maybeSingle();
      if (tm && tm.status !== "invited") throw new ActionError("This person is already on the team.");
      const { data: cc } = await admin.from("client_contacts").select("id").eq("profile_id", existing.id).eq("portal_access", true).limit(1);
      if (cc?.length) throw new ActionError("This email is used by a client portal account. Use a different email for team access.");
    }
    const { userId, actionLink } = await generateAuthLink({ kind: "invite", email: d.email, fullName: d.full_name, next: "/accept-invite" });
    const sb = await createClient();
    const { error } = await sb.from("team_members").upsert(
      { organization_id: ctx.organizationId, profile_id: userId, role_key: d.role_key, title: d.title ?? null, status: "invited", invited_by: ctx.userId, invited_at: new Date().toISOString() },
      { onConflict: "organization_id,profile_id" },
    );
    if (error) dbError(error);
    await admin.from("profiles").update({ full_name: d.full_name }).eq("id", userId);
    await sendEmailNow(d.email, d.full_name, "team_invitation", { action_link: actionLink, inviter: ctx.profile.full_name ?? ctx.organization.name, role: ROLE_LABELS[d.role_key] });
    revalidatePath("/admin/team");
    return null;
  }, "Invitation sent");
}

const memberSchema = (currency: string) =>
  z.object({
    role_key: roleEnum,
    title: optionalText(100),
    capacity_hours_per_week: z.coerce.number().int().min(0).max(168),
    hourly_cost: optionalMoneyInput(currency),
  });

export async function updateTeamMember(memberId: string, input: unknown) {
  return teamAction("team.manage", async (ctx) => {
    const d = parseInput(memberSchema(await getCurrency(ctx.organizationId)), input);
    const sb = await createClient();
    // Cost rates are financial data: only finance-capable roles may change them.
    const patch = {
      role_key: d.role_key, title: d.title ?? null, capacity_hours_per_week: d.capacity_hours_per_week,
      ...(ctx.can("finance.manage") ? { hourly_cost_cents: d.hourly_cost ?? null } : {}),
    };
    const { data, error } = await sb.from("team_members").update(patch).eq("id", memberId).select("id").maybeSingle();
    if (error) dbError(error);
    if (!data) throw new ActionError("Member not found.");
    revalidatePath("/admin/team");
    return null;
  }, "Member updated");
}

export async function setMemberStatus(memberId: string, status: "active" | "deactivated") {
  return teamAction("team.manage", async () => {
    const sb = await createClient();
    const { error } = await sb.from("team_members").update({ status }).eq("id", memberId);
    if (error) dbError(error);
    revalidatePath("/admin/team");
    return null;
  }, status === "active" ? "Member reactivated" : "Member deactivated");
}

export async function revokeInvitation(memberId: string) {
  return teamAction("team.manage", async () => {
    const sb = await createClient();
    const { error } = await sb.from("team_members").delete().eq("id", memberId).eq("status", "invited");
    if (error) dbError(error);
    revalidatePath("/admin/team");
    return null;
  }, "Invitation revoked");
}

/** Owner-only: edit the role → permission matrix (role_permissions is writable only by the service role). */
export async function setRolePermission(role: string, permission: string, enabled: boolean) {
  return teamAction(null, async (ctx) => {
    if (ctx.role !== "owner") throw new ActionError("Only an owner can change role permissions.");
    const r = parseInput(roleEnum, role) as TeamRole;
    if (r === "owner") throw new ActionError("The owner role always has every permission.");
    if (!isPermission(permission)) throw new ActionError("Unknown permission.");
    const admin = createAdminClient();
    const { error } = enabled
      ? await admin.from("role_permissions").upsert({ role_key: r, permission_key: permission })
      : await admin.from("role_permissions").delete().eq("role_key", r).eq("permission_key", permission);
    if (error) dbError(error);
    await admin.from("activity_logs").insert({
      organization_id: ctx.organizationId, actor_id: ctx.userId, entity_type: "role", action: enabled ? "permission_granted" : "permission_revoked",
      description: `${enabled ? "Granted" : "Revoked"} ${permission} ${enabled ? "to" : "from"} ${ROLE_LABELS[r]}`,
    });
    revalidatePath("/admin/settings");
    return null;
  });
}
