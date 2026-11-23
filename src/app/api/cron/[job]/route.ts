import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { dispatchOutbox } from "@/lib/email/dispatcher";

export const runtime = "nodejs";
export const maxDuration = 60;

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization") ?? "";
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(header);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/**
 * Scheduled job endpoints (called by Supabase pg_cron via pg_net, or Vercel Cron):
 *   /api/cron/outbox       → deliver queued emails (idempotent, retried with backoff)
 *   /api/cron/automations  → run reminders/overdue/expiry automations + deliver emails
 */
async function handle(request: NextRequest, { params }: { params: Promise<{ job: string }> }) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { job } = await params;
  try {
    if (job === "outbox") return NextResponse.json({ ok: true, emails: await dispatchOutbox({ limit: 50 }) });
    if (job === "automations") {
      const { data, error } = await createAdminClient().rpc("run_scheduled_automations");
      if (error) throw error;
      return NextResponse.json({ ok: true, automations: data, emails: await dispatchOutbox({ limit: 50 }) });
    }
    return NextResponse.json({ error: "Unknown job" }, { status: 404 });
  } catch (e) {
    console.error(`[cron:${job}]`, e);
    return NextResponse.json({ ok: false, error: "Job failed" }, { status: 500 });
  }
}

export { handle as GET, handle as POST };
