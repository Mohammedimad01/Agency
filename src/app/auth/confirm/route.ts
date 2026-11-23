import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/utils";

const ALLOWED: EmailOtpType[] = ["signup", "invite", "magiclink", "recovery", "email_change", "email"];

/** Verifies one-time email links (signup, invite, recovery, magic link) and establishes a session. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  let next = safeRedirectPath(searchParams.get("next"), "/");

  if (tokenHash && type && ALLOWED.includes(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      if (type === "invite" || (type === "magiclink" && next.startsWith("/accept-invite"))) next = "/accept-invite";
      if (type === "recovery") next = "/reset-password";
      return NextResponse.redirect(new URL(next, origin));
    }
  }
  return NextResponse.redirect(new URL("/login?error=link_expired", origin));
}
