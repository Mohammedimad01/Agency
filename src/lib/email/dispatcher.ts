import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmailProvider } from "@/lib/services/email-provider";
import { serverEnv } from "@/lib/env";
import { EMAIL_TEMPLATES, TRANSACTIONAL_ONLY, isEmailTemplate, type EmailTemplateName } from "./templates";

const urlFor = (path: string) => (/^https?:\/\//.test(path) ? path : `${serverEnv.appUrl}${path.startsWith("/") ? path : `/${path}`}`);

export function renderTemplate(template: EmailTemplateName, payload: Record<string, unknown>) {
  return EMAIL_TEMPLATES[template](payload, urlFor);
}

/** Sends an email immediately, without persisting it (used for auth links that carry one-time tokens). */
export async function sendEmailNow(to: string, toName: string | null, template: EmailTemplateName, payload: Record<string, unknown>) {
  const email = renderTemplate(template, { recipient_name: toName, ...payload });
  return getEmailProvider().send({ to, toName, ...email });
}

/**
 * Processes the email outbox: claims due rows (SKIP LOCKED, so concurrent runs
 * are safe), honours per-user preferences, sends, and records the outcome with
 * exponential backoff on failure. Idempotency keys are forwarded to the provider.
 */
export async function dispatchOutbox({ limit = 25 }: { limit?: number } = {}) {
  const admin = createAdminClient();
  const provider = getEmailProvider();
  const { data: batch, error } = await admin.rpc("claim_email_batch", { p_limit: limit });
  if (error) throw error;
  const results = { sent: 0, failed: 0, skipped: 0 };

  for (const row of batch ?? []) {
    try {
      if (!isEmailTemplate(row.template)) throw new Error(`Unknown template "${row.template}"`);

      if (!TRANSACTIONAL_ONLY.includes(row.template)) {
        const { data: profile } = await admin.from("profiles").select("id").eq("email", row.to_email).maybeSingle();
        if (profile) {
          const { data: prefs } = await admin.from("notification_preferences").select("email_enabled, email_types").eq("profile_id", profile.id).maybeSingle();
          const types = (prefs?.email_types ?? {}) as Record<string, boolean>;
          if (prefs && (!prefs.email_enabled || types[row.template] === false)) {
            await admin.from("email_outbox").update({ status: "cancelled", last_error: "Recipient opted out", locked_at: null }).eq("id", row.id);
            results.skipped++;
            continue;
          }
        }
      }

      const email = renderTemplate(row.template, (row.payload ?? {}) as Record<string, unknown>);
      const { id } = await provider.send({ to: String(row.to_email), toName: row.to_name, ...email, idempotencyKey: row.idempotency_key });
      await admin.rpc("complete_email", { p_id: row.id, p_ok: true, p_provider: provider.name, p_message_id: id, p_error: "" });
      results.sent++;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      await admin.rpc("complete_email", { p_id: row.id, p_ok: false, p_provider: provider.name, p_message_id: "", p_error: message });
      results.failed++;
    }
  }
  return results;
}
