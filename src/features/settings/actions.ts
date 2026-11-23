"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ActionError, dbError, parseInput, publicAction, teamAction } from "@/lib/action";
import { getUser } from "@/lib/auth/session";
import { optionalText, percentInput, requiredText } from "@/lib/validations/common";
import { passwordSchema } from "@/features/auth/schemas";
import { dispatchOutbox } from "@/lib/email/dispatcher";
import { EMAIL_PREF_TYPES } from "./constants";

const profileSchema = z.object({ full_name: requiredText("Name", 120), phone: optionalText(40), job_title: optionalText(100), timezone: optionalText(64) });

export async function updateMyProfile(input: unknown) {
  return publicAction(async () => {
    const user = await getUser();
    if (!user) throw new ActionError("Your session has expired.");
    const d = parseInput(profileSchema, input);
    const sb = await createClient();
    const { error } = await sb.from("profiles").update(d).eq("id", user.id);
    if (error) dbError(error);
    revalidatePath("/", "layout");
    return null;
  }, "Profile updated");
}

export async function changeMyPassword(input: unknown) {
  return publicAction(async () => {
    const user = await getUser();
    if (!user?.email) throw new ActionError("Your session has expired.");
    const d = parseInput(z.object({ current: z.string().min(1, "Enter your current password"), password: passwordSchema }), input);
    const sb = await createClient();
    // Re-authenticate before changing credentials.
    const { error: authError } = await sb.auth.signInWithPassword({ email: user.email, password: d.current });
    if (authError) throw new ActionError("Your current password is incorrect.", { current: ["Incorrect password"] });
    const { error } = await sb.auth.updateUser({ password: d.password });
    if (error) throw new ActionError(error.message);
    return null;
  }, "Password changed");
}


export async function updateNotificationPrefs(input: { email_enabled: boolean; email_types: Record<string, boolean> }) {
  return publicAction(async () => {
    const user = await getUser();
    if (!user) throw new ActionError("Your session has expired.");
    const d = parseInput(z.object({ email_enabled: z.boolean(), email_types: z.record(z.enum(Object.keys(EMAIL_PREF_TYPES) as [string, ...string[]]), z.boolean()) }), input);
    const sb = await createClient();
    const { error } = await sb.from("notification_preferences").upsert({ profile_id: user.id, ...d });
    if (error) dbError(error);
    return null;
  }, "Notification preferences saved");
}

const orgSchema = z.object({
  name: requiredText("Agency name", 120),
  currency: z.string().regex(/^[A-Z]{3}$/),
  timezone: requiredText("Time zone", 64),
  default_tax_rate: percentInput,
  default_payment_terms_days: z.coerce.number().int().min(0).max(365),
  invoice_prefix: z.string().trim().min(1).max(12),
  proposal_prefix: z.string().trim().min(1).max(12),
  project_prefix: z.string().trim().min(1).max(12),
  company_legal_name: optionalText(200),
  company_address: optionalText(500),
  company_email: optionalText(200),
  company_phone: optionalText(60),
  tax_id: optionalText(60),
  payment_instructions: optionalText(3000),
  invoice_footer: optionalText(1000),
  lead_capacity_projects: z.coerce.number().int().min(1).max(500),
});
export type OrgSettingsInput = z.input<typeof orgSchema>;

export async function updateOrgSettings(input: unknown) {
  return teamAction("settings.manage", async (ctx) => {
    const { name, default_tax_rate, ...d } = parseInput(orgSchema, input);
    const sb = await createClient();
    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      sb.from("organizations").update({ name }).eq("id", ctx.organizationId),
      sb.from("settings").update({ ...d, default_tax_rate_bps: default_tax_rate }).eq("organization_id", ctx.organizationId),
    ]);
    if (e1 || e2) dbError(e1 ?? e2);
    revalidatePath("/admin", "layout");
    return null;
  }, "Settings saved");
}

/** Lets an admin run the scheduled automations and email dispatch on demand (same code paths as cron). */
export async function runAutomationsNow() {
  return teamAction("settings.manage", async () => {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("run_scheduled_automations");
    if (error) dbError(error);
    const emails = await dispatchOutbox({ limit: 50 });
    return { automations: data, emails };
  }, "Automations ran successfully");
}
