"use server";
import { headers } from "next/headers";
import { createHash } from "node:crypto";
import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ActionError, parseInput, publicAction } from "@/lib/action";
import { inquirySchema, BUDGET_RANGES, type InquiryInput } from "./schemas";
import { qualifyLead } from "@/features/leads/qualification";
import { getPublicOrganization } from "@/features/website/queries";
import { dispatchOutbox } from "@/lib/email/dispatcher";
import type { Json } from "@/types/database";

function clientIpHash(h: Headers) {
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  return createHash("sha256").update(`${ip}:${process.env.RATE_LIMIT_SALT ?? ""}`).digest("hex").slice(0, 32);
}

/**
 * Website inquiry intake (workflow #1): validates, rate-limits, scores and stores
 * the lead. Database triggers then notify the team and queue emails (workflow #2).
 */
export async function submitInquiry(input: InquiryInput) {
  return publicAction(async () => {
    const data = parseInput(inquirySchema, input);
    // Bots: honeypot filled or submitted implausibly fast. Pretend success, store nothing.
    if (data.company_url || (data.elapsedMs > 0 && data.elapsedMs < 1500)) return { received: true };

    const h = await headers();
    const ipHash = clientIpHash(h);
    const admin = createAdminClient();

    const [{ data: perIp }, { data: perEmail }] = await Promise.all([
      admin.rpc("check_rate_limit", { p_key: `inquiry:ip:${ipHash}`, p_max: 5, p_window_seconds: 3600 }),
      admin.rpc("check_rate_limit", { p_key: `inquiry:email:${data.email}`, p_max: 3, p_window_seconds: 3600 }),
    ]);
    if (perIp === false || perEmail === false) {
      throw new ActionError("You've sent several messages recently. Please try again in an hour or email us directly.");
    }

    const org = await getPublicOrganization();
    if (!org) throw new ActionError("We can't accept inquiries right now. Please email us directly.");

    const [{ data: service }, { data: settings }, { count: activeProjects }] = await Promise.all([
      data.serviceSlug
        ? admin.from("services").select("id, name, starting_price_cents").eq("organization_id", org.id).eq("slug", data.serviceSlug).eq("is_active", true).maybeSingle()
        : Promise.resolve({ data: null }),
      admin.from("settings").select("lead_capacity_projects").eq("organization_id", org.id).maybeSingle(),
      admin
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", org.id)
        .in("status", ["planning", "in_progress", "awaiting_client", "in_review"])
        .is("deleted_at", null),
    ]);

    const budget = BUDGET_RANGES.find((b) => b.value === data.budget);
    const budgetCents = budget?.cents ?? null;
    const { score, breakdown } = qualifyLead({
      budgetCents,
      serviceStartingPriceCents: service?.starting_price_cents ?? null,
      serviceMatched: Boolean(service),
      requestedService: service?.name ?? null,
      timeline: data.timeline || null,
      activeProjects: activeProjects ?? 0,
      capacityProjects: settings?.lead_capacity_projects ?? 6,
    });

    const sourceLabel = { message: "website", brief: "website_brief", booking: "booking_form" }[data.kind];
    const { data: lead, error } = await admin
      .from("leads")
      .insert({
        organization_id: org.id,
        full_name: data.fullName,
        email: data.email,
        phone: data.phone || null,
        company: data.company || null,
        website: data.website || null,
        country: data.country || null,
        source: sourceLabel,
        service_id: service?.id ?? null,
        requested_service: service?.name ?? null,
        budget_cents: budgetCents,
        budget_range: budget?.label ?? null,
        timeline: data.timeline || null,
        description: data.message,
        qualification_score: score,
        qualification: { breakdown, scored_at: new Date().toISOString(), engine: "v1" } as unknown as NonNullable<Json>,
        priority: score >= 75 ? "high" : score >= 50 ? "medium" : "low",
        metadata: {
          ip_hash: ipHash,
          user_agent: h.get("user-agent")?.slice(0, 200) ?? null,
          referer: h.get("referer")?.slice(0, 300) ?? null,
          form: data.kind,
        },
      })
      .select("id")
      .single();
    if (error || !lead) {
      console.error("[inquiry]", error);
      throw new ActionError("We couldn't send your message. Please try again or email us directly.");
    }

    if (data.kind === "booking") {
      const when = data.preferredDate ? `${data.preferredDate}T${data.preferredTime || "10:00"}:00` : null;
      await admin.from("meeting_records").insert({
        organization_id: org.id,
        lead_id: lead.id,
        title: `Discovery call — ${data.fullName}${data.company ? ` (${data.company})` : ""}`,
        status: "requested",
        scheduled_at: when ? new Date(when).toISOString() : null,
        duration_minutes: 30,
        agenda: data.message,
        notes: data.timezone ? `Visitor timezone: ${data.timezone}` : null,
        source: "booking_form",
      });
    }

    // Confirmation to the visitor (idempotent per lead) + immediate dispatch.
    await admin.from("email_outbox").insert({
      organization_id: org.id,
      to_email: data.email,
      to_name: data.fullName,
      template: "inquiry_received",
      payload: { recipient_name: data.fullName, kind: data.kind },
      idempotency_key: `inquiry_received:${lead.id}`,
    });
    after(() => dispatchOutbox({ limit: 10 }).catch((e) => console.error("[outbox]", e)));
    return { received: true };
  });
}
