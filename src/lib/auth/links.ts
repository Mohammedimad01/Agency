import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { serverEnv } from "@/lib/env";

type LinkKind = "invite" | "recovery" | "signup" | "magiclink";

function confirmUrl(hashedToken: string, type: string, next: string) {
  const u = new URL("/auth/confirm", serverEnv.appUrl);
  u.searchParams.set("token_hash", hashedToken);
  u.searchParams.set("type", type);
  u.searchParams.set("next", next);
  return u.toString();
}

/**
 * Generates a one-time auth link (without Supabase sending any email) so the
 * message can be delivered through our own email provider and templates.
 * For an email that already has an account, an invite falls back to a magic link.
 */
export async function generateAuthLink(opts: { kind: LinkKind; email: string; next: string; password?: string; fullName?: string | null }) {
  const admin = createAdminClient();
  const data = opts.fullName ? { full_name: opts.fullName } : undefined;

  const attempt = async (kind: LinkKind) => {
    if (kind === "signup") {
      return admin.auth.admin.generateLink({ type: "signup", email: opts.email, password: opts.password ?? "", options: { data } });
    }
    if (kind === "invite") return admin.auth.admin.generateLink({ type: "invite", email: opts.email, options: { data } });
    if (kind === "recovery") return admin.auth.admin.generateLink({ type: "recovery", email: opts.email });
    return admin.auth.admin.generateLink({ type: "magiclink", email: opts.email });
  };

  let kind = opts.kind;
  let res = await attempt(kind);
  if (res.error && kind === "invite" && /already (been )?registered|exists/i.test(res.error.message)) {
    kind = "magiclink";
    res = await attempt(kind);
  }
  if (res.error || !res.data.properties?.hashed_token || !res.data.user) {
    throw new Error(res.error?.message ?? "Could not generate the link");
  }
  const verifyType = kind === "magiclink" ? "magiclink" : kind;
  return { userId: res.data.user.id, actionLink: confirmUrl(res.data.properties.hashed_token, verifyType, opts.next), kind };
}
