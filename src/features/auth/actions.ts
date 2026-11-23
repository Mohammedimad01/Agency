"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createHash } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ActionError, parseInput, publicAction } from "@/lib/action";
import { generateAuthLink } from "@/lib/auth/links";
import { sendEmailNow } from "@/lib/email/dispatcher";
import { getUser, homePathFor } from "@/lib/auth/session";
import { safeRedirectPath, slugify } from "@/lib/utils";
import { serverEnv } from "@/lib/env";
import { acceptInviteSchema, forgotSchema, loginSchema, resetSchema, setupSchema } from "./schemas";

async function ipKey() {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  return createHash("sha256").update(`${ip}:${process.env.RATE_LIMIT_SALT ?? ""}`).digest("hex").slice(0, 24);
}

async function rateLimit(key: string, max: number, windowSeconds: number, cost = 1) {
  const { data } = await createAdminClient().rpc("check_rate_limit", { p_key: key, p_max: max, p_window_seconds: windowSeconds, p_cost: cost });
  if (data === false) throw new ActionError("Too many attempts. Please wait a few minutes and try again.");
}

export async function signIn(input: unknown) {
  const result = await publicAction(async () => {
    const data = parseInput(loginSchema, input);
    // Only failed attempts count towards the limits (checked first, recorded on failure).
    const ipLimitKey = `login:${await ipKey()}`;
    const emailLimitKey = `login:email:${data.email}`;
    await rateLimit(ipLimitKey, 30, 900, 0);
    await rateLimit(emailLimitKey, 10, 900, 0);
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password });
    if (error) {
      await Promise.all([rateLimit(ipLimitKey, 30, 900).catch(() => null), rateLimit(emailLimitKey, 10, 900).catch(() => null)]);
      if (/confirm/i.test(error.message)) throw new ActionError("Please confirm your email address first — check your inbox for the link.");
      throw new ActionError("Incorrect email or password.");
    }
    return { next: data.next };
  });
  if (!result.ok) return result;
  const next = safeRedirectPath(result.data.next, "");
  redirect(next || (await homePathFor()));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(input: unknown) {
  return publicAction(async () => {
    const { email } = parseInput(forgotSchema, input);
    await rateLimit(`reset:${await ipKey()}`, 5, 3600);
    await rateLimit(`reset:email:${email}`, 3, 3600);
    const admin = createAdminClient();
    const { data: profile } = await admin.from("profiles").select("full_name").eq("email", email).maybeSingle();
    // Always respond the same way so the form can't be used to discover accounts.
    if (profile) {
      try {
        const { actionLink } = await generateAuthLink({ kind: "recovery", email, next: "/reset-password" });
        await sendEmailNow(email, profile.full_name, "password_reset", { action_link: actionLink });
      } catch (e) {
        console.error("[password-reset]", e);
      }
    }
    return { sent: true };
  }, "If an account exists for that email, a reset link is on its way.");
}

export async function updatePassword(input: unknown) {
  const result = await publicAction(async () => {
    const data = parseInput(resetSchema, input);
    const user = await getUser();
    if (!user) throw new ActionError("Your reset link has expired. Please request a new one.");
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password: data.password });
    if (error) throw new ActionError(error.message);
    return null;
  });
  if (!result.ok) return result;
  redirect(await homePathFor());
}

/** Completes a team or client invitation: sets name + password and activates access. */
export async function acceptInvitation(input: unknown) {
  const result = await publicAction(async () => {
    const data = parseInput(acceptInviteSchema, input);
    const user = await getUser();
    if (!user) throw new ActionError("Your invitation link has expired. Ask for a new invitation.");
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password: data.password, data: { full_name: data.fullName } });
    if (error) throw new ActionError(error.message);

    const admin = createAdminClient();
    await admin.from("profiles").update({ full_name: data.fullName }).eq("id", user.id);
    // Activate pending team membership(s) for this exact user (never by client-supplied ids).
    await admin
      .from("team_members")
      .update({ status: "active", joined_at: new Date().toISOString() })
      .eq("profile_id", user.id)
      .eq("status", "invited");
    await admin.from("client_contacts").update({ last_seen_at: new Date().toISOString() }).eq("profile_id", user.id);
    return null;
  });
  if (!result.ok) return result;
  redirect(await homePathFor());
}

export async function isSetupComplete() {
  try {
    const { count } = await createAdminClient().from("organizations").select("id", { count: "exact", head: true });
    return (count ?? 0) > 0;
  } catch {
    return false;
  }
}

/** First-run setup: creates the owner account (email verification required) and the organization. */
export async function completeSetup(input: unknown) {
  return publicAction(async () => {
    const data = parseInput(setupSchema, input);
    await rateLimit(`setup:${await ipKey()}`, 5, 3600);
    if (await isSetupComplete()) throw new ActionError("This workspace has already been set up. Please sign in.");

    const { userId, actionLink } = await generateAuthLink({
      kind: "signup",
      email: data.email,
      password: data.password,
      fullName: data.fullName,
      next: "/admin",
    });
    const admin = createAdminClient();
    const { error } = await admin.rpc("bootstrap_organization", {
      p_owner: userId,
      p_name: data.agencyName,
      p_slug: slugify(data.agencyName) || "agency",
      p_currency: data.currency,
      p_timezone: data.timezone,
    });
    if (error) {
      await admin.auth.admin.deleteUser(userId);
      throw new ActionError(error.message);
    }
    await admin.from("profiles").update({ full_name: data.fullName }).eq("id", userId);
    await sendEmailNow(data.email, data.fullName, "verify_email", { action_link: actionLink });
    // Local development convenience only: expose the link when no real email provider is configured.
    const devLink = process.env.NODE_ENV !== "production" && serverEnv.emailProvider === "console" ? actionLink : null;
    return { email: data.email, devLink };
  });
}
