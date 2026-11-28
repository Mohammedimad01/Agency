/**
 * End-to-end business workflow (the project brief's "Definition of Done"),
 * executed against the real database with real users and RLS:
 * inquiry → lead → qualified → client → proposal → accepted → project (template)
 * → team assigned → client portal access → milestones → deliverable approved
 * → invoice → payments → project completed.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { admin, createUser, signIn, stackAvailable, uid, type DB } from "./helpers";

const live = await stackAvailable();

describe.skipIf(!live)("agency workflow, end to end", () => {
  const run = uid();
  const clientEmail = `buyer-${run}@example.test`;
  let owner: DB, pm: DB, finance: DB, buyer: DB;
  let orgId: string, leadId: string, clientId: string, proposalId: string, projectId: string, deliverableId: string, invoiceId: string, devId: string;

  beforeAll(async () => {
    [owner, pm, finance] = await Promise.all([signIn("owner@team.test"), signIn("pm@team.test"), signIn("finance@team.test")]);
    orgId = (await admin().from("organizations").select("id").single()).data!.id;
    devId = (await admin().from("profiles").select("id").eq("email", "dev@team.test").single()).data!.id;
  });

  it("1. a website inquiry creates a lead and notifies the team (workflows #1–#2)", async () => {
    // The public form posts through a server action that uses the service role after rate limiting.
    const { data, error } = await admin()
      .from("leads")
      .insert({ organization_id: orgId, full_name: `Buyer ${run}`, company: `Buyer Co ${run}`, email: clientEmail, source: "website", requested_service: "Website Development", budget_cents: 800000, timeline: "1–3 months", description: "We need a new website." })
      .select("id")
      .single();
    expect(error).toBeNull();
    leadId = data!.id;
    const notes = await owner.from("notifications").select("id").eq("entity_id", leadId).eq("type", "lead_created");
    expect(notes.data!.length).toBe(1);
    const outbox = await admin().from("email_outbox").select("template").like("idempotency_key", `new_lead:${leadId}:%`);
    expect(outbox.data!.length).toBeGreaterThan(0);
    const activity = await owner.from("lead_activities").select("type").eq("lead_id", leadId);
    expect(activity.data!.map((a) => a.type)).toContain("created");
  });

  it("2. the lead is qualified, assigned and gets a follow-up reminder (workflow #3)", async () => {
    const pmId = (await pm.auth.getUser()).data.user!.id;
    const { error } = await owner.from("leads").update({ status: "qualified", assigned_to: pmId, follow_up_at: new Date(Date.now() - 60_000).toISOString() }).eq("id", leadId);
    expect(error).toBeNull();
    await admin().rpc("run_scheduled_automations");
    await admin().rpc("run_scheduled_automations"); // idempotent: must not duplicate
    const reminders = await pm.from("notifications").select("id").eq("entity_id", leadId).eq("type", "lead_follow_up");
    expect(reminders.data!.length).toBe(1);
    const history = await owner.from("lead_activities").select("type").eq("lead_id", leadId);
    expect(history.data!.map((h) => h.type)).toEqual(expect.arrayContaining(["status_change", "assignment", "follow_up"]));
  });

  it("3. a proposal with server-computed totals is sent to the lead's new client record", async () => {
    const { data: p, error } = await owner
      .from("proposals")
      .insert({ organization_id: orgId, number: "", lead_id: leadId, title: `Website for ${run}`, discount_type: "percent", discount_value: 1000, tax_rate_bps: 500, total_cents: 1 /* ignored */ })
      .select("id")
      .single();
    expect(error).toBeNull();
    proposalId = p!.id;
    const items = await owner.rpc("replace_document_items", {
      p_kind: "proposal",
      p_id: proposalId,
      p_items: [
        { description: "Design & build", quantity: "1", unit_price_cents: 700000 },
        { description: "Content pages", quantity: "4", unit_price_cents: 25000 },
      ],
    });
    expect(items.error).toBeNull();
    const { data: totals } = await owner.from("proposals").select("subtotal_cents, discount_cents, tax_cents, total_cents").eq("id", proposalId).single();
    expect(totals).toEqual({ subtotal_cents: 800000, discount_cents: 80000, tax_cents: 36000, total_cents: 756000 });

    // Sending to a lead creates the client (without marking the deal won) and grants portal access.
    const conv = await owner.rpc("convert_lead", { p_lead: leadId, p_client: {}, p_mark_won: false });
    expect(conv.error).toBeNull();
    clientId = (conv.data as { client_id: string }).client_id;
    expect((await owner.from("leads").select("status").eq("id", leadId).single()).data!.status).toBe("qualified");
    const buyerId = await createUser(clientEmail, `Buyer ${run}`);
    await owner.from("client_contacts").update({ profile_id: buyerId, portal_access: true }).eq("client_id", clientId).eq("email", clientEmail);
    buyer = await signIn(clientEmail);
    const sent = await owner.from("proposals").update({ status: "sent" }).eq("id", proposalId);
    expect(sent.error).toBeNull();
    expect((await buyer.from("portal_proposals").select("status").eq("id", proposalId).single()).data!.status).toBe("sent");
  });

  it("4. the client accepts in the portal; the lead becomes won and the team is notified", async () => {
    await buyer.rpc("portal_mark_proposal_viewed", { p_proposal: proposalId });
    const accept = await buyer.rpc("portal_respond_proposal", { p_proposal: proposalId, p_decision: "accepted", p_note: "Let's go" });
    expect(accept.error).toBeNull();
    const again = await buyer.rpc("portal_respond_proposal", { p_proposal: proposalId, p_decision: "rejected", p_note: "" });
    expect(again.error).not.toBeNull(); // decisions are final
    expect((await owner.from("leads").select("status").eq("id", leadId).single()).data!.status).toBe("won");
    expect((await owner.from("notifications").select("id").eq("entity_id", proposalId).eq("type", "proposal_accepted")).data!.length).toBe(1);
  });

  it("5. the accepted proposal becomes a project from a template, with a contract (workflows #5–#6)", async () => {
    const tpl = (await owner.from("project_templates").select("id").eq("name", "Website Development").single()).data!;
    const res = await owner.rpc("create_project_from_proposal", { p_proposal: proposalId, p_template: tpl.id, p_options: { create_contract: true } });
    expect(res.error).toBeNull();
    projectId = (res.data as { project_id: string }).project_id;
    const again = await owner.rpc("create_project_from_proposal", { p_proposal: proposalId, p_template: tpl.id, p_options: {} });
    expect((again.data as { already_created: boolean }).already_created).toBe(true);
    const [ms, tasks, contract, finances] = await Promise.all([
      owner.from("milestones").select("id").eq("project_id", projectId),
      owner.from("tasks").select("id").eq("project_id", projectId),
      owner.from("contracts").select("status, accepted_at, value_cents").eq("project_id", projectId).single(),
      owner.from("project_finances").select("contract_value_cents").eq("project_id", projectId).single(),
    ]);
    expect(ms.data!.length).toBe(11);
    expect(tasks.data!.length).toBe(17);
    expect(contract.data!.accepted_at).not.toBeNull();
    expect(contract.data!.value_cents).toBe(756000);
    expect(finances.data!.contract_value_cents).toBe(756000);
  });

  it("6. teammates are assigned and the client gets portal access to the project", async () => {
    const add = await owner.from("project_members").insert({ project_id: projectId, profile_id: devId });
    expect(add.error).toBeNull();
    const dev = await signIn("dev@team.test");
    expect((await dev.from("projects").select("id").eq("id", projectId)).data!.length).toBe(1);
    expect((await dev.from("project_finances").select("project_id").eq("project_id", projectId)).data).toEqual([]);
    expect((await dev.from("notifications").select("type").eq("entity_id", projectId).eq("type", "project_assigned")).data!.length).toBeGreaterThan(0);
    await owner.from("projects").update({ status: "in_progress" }).eq("id", projectId);
    expect((await buyer.from("portal_projects").select("id").eq("id", projectId)).data!.length).toBe(1);
  });

  it("7. completing tasks completes milestones and updates progress (workflow #7)", async () => {
    const first = (await owner.from("milestones").select("id, weight").eq("project_id", projectId).order("sort_order").limit(2)).data!;
    for (const m of first) {
      const { error } = await owner.from("tasks").update({ status: "done" }).eq("milestone_id", m.id);
      expect(error).toBeNull();
    }
    const statuses = (await owner.from("milestones").select("status").in("id", first.map((m) => m.id))).data!;
    expect(statuses.every((s) => s.status === "completed")).toBe(true);
    const { data: p } = await owner.from("projects").select("progress").eq("id", projectId).single();
    expect(p!.progress).toBe(Math.round((100 * 2) / 14)); // 2 of 14 weight units
    expect((await buyer.from("notifications").select("id").eq("type", "milestone_completed")).data!.length).toBeGreaterThan(0);
    expect((await admin().from("email_outbox").select("id").eq("template", "milestone_update").eq("to_email", clientEmail)).data!.length).toBe(2);
  });

  it("8. a deliverable is submitted and the client requests changes, then approves (workflow #8)", async () => {
    const { data: d } = await owner.from("deliverables").insert({ organization_id: orgId, project_id: projectId, title: "Homepage design" }).select("id").single();
    deliverableId = d!.id;
    await owner.from("deliverable_versions").insert({ deliverable_id: deliverableId, version: 1, external_url: "https://figma.example/v1", created_by: (await owner.auth.getUser()).data.user!.id });
    await owner.from("deliverables").update({ current_version: 1, status: "submitted" }).eq("id", deliverableId);
    expect((await buyer.from("portal_deliverables").select("status").eq("id", deliverableId).single()).data!.status).toBe("submitted");

    const noFeedback = await buyer.rpc("portal_review_deliverable", { p_deliverable: deliverableId, p_decision: "changes_requested", p_feedback: "" });
    expect(noFeedback.error).not.toBeNull();
    const changes = await buyer.rpc("portal_review_deliverable", { p_deliverable: deliverableId, p_decision: "changes_requested", p_feedback: "Bigger logo please" });
    expect(changes.error).toBeNull();
    expect((await owner.from("revisions").select("description").eq("deliverable_id", deliverableId)).data![0]!.description).toBe("Bigger logo please");

    await owner.from("deliverable_versions").insert({ deliverable_id: deliverableId, version: 2, external_url: "https://figma.example/v2", created_by: (await owner.auth.getUser()).data.user!.id });
    await owner.from("deliverables").update({ current_version: 2, status: "submitted" }).eq("id", deliverableId);
    const approve = await buyer.rpc("portal_review_deliverable", { p_deliverable: deliverableId, p_decision: "approved", p_feedback: "" });
    expect(approve.error).toBeNull();
    const { data: final } = await owner.from("deliverables").select("status, approved_at").eq("id", deliverableId).single();
    expect(final!.status).toBe("approved");
    expect(final!.approved_at).not.toBeNull();
    // Another client can never review it
    const globex = await signIn("client@globex.test");
    expect((await globex.rpc("portal_review_deliverable", { p_deliverable: deliverableId, p_decision: "approved", p_feedback: "" })).error).not.toBeNull();
  });

  it("9. an invoice is generated and payments update balances (workflows #9–#10)", async () => {
    const res = await finance.rpc("create_invoice_from_proposal", { p_proposal: proposalId, p_percent: 100 });
    expect(res.error).toBeNull();
    invoiceId = res.data as string;
    const draft = (await finance.from("invoices").select("status, total_cents").eq("id", invoiceId).single()).data!;
    expect(draft).toEqual({ status: "draft", total_cents: 756000 });
    expect((await buyer.from("portal_invoices").select("id").eq("id", invoiceId)).data).toEqual([]); // drafts are invisible

    // Recording a payment against a draft is rejected
    const finId = (await finance.auth.getUser()).data.user!.id;
    const early = await finance.from("payments").insert({ organization_id: orgId, invoice_id: invoiceId, client_id: clientId, amount_cents: 100, recorded_by: finId });
    expect(early.error).not.toBeNull();

    await finance.from("invoices").update({ status: "sent" }).eq("id", invoiceId);
    expect((await buyer.from("portal_invoices").select("status").eq("id", invoiceId).single()).data!.status).toBe("sent");

    // Forged ownership is overwritten by the trigger; status is derived from real payments.
    const p1 = await finance.from("payments").insert({ organization_id: orgId, invoice_id: invoiceId, client_id: clientId, amount_cents: 300000, recorded_by: finId, idempotency_key: `t-${run}-1` });
    expect(p1.error).toBeNull();
    const dup = await finance.from("payments").insert({ organization_id: orgId, invoice_id: invoiceId, client_id: clientId, amount_cents: 300000, recorded_by: finId, idempotency_key: `t-${run}-1` });
    expect(dup.error?.code).toBe("23505"); // duplicate submission rejected
    let inv = (await finance.from("invoices").select("status, amount_paid_cents, balance_cents").eq("id", invoiceId).single()).data!;
    expect(inv).toEqual({ status: "partially_paid", amount_paid_cents: 300000, balance_cents: 456000 });

    const over = await finance.from("payments").insert({ organization_id: orgId, invoice_id: invoiceId, client_id: clientId, amount_cents: 456001, recorded_by: finId });
    expect(over.error?.message).toMatch(/exceeds the outstanding balance/);

    const manualPaid = await finance.from("invoices").update({ status: "paid" }).eq("id", invoiceId).select("status").single();
    expect(manualPaid.data!.status).toBe("partially_paid"); // can't fake "paid"

    const p2 = await finance.from("payments").insert({ organization_id: orgId, invoice_id: invoiceId, client_id: clientId, amount_cents: 456000, recorded_by: finId, idempotency_key: `t-${run}-2` });
    expect(p2.error).toBeNull();
    inv = (await finance.from("invoices").select("status, amount_paid_cents, balance_cents").eq("id", invoiceId).single()).data!;
    expect(inv).toEqual({ status: "paid", amount_paid_cents: 756000, balance_cents: 0 });
    expect((await finance.from("invoice_items").update({ unit_price_cents: 1 }).eq("invoice_id", invoiceId)).error).not.toBeNull(); // paid invoices are locked
    expect((await buyer.from("portal_payments").select("id").eq("invoice_id", invoiceId)).data!.length).toBe(2);
  });

  it("10. completing the project notifies the client and schedules a review request (workflows #11–#12)", async () => {
    const { error } = await owner.from("projects").update({ status: "completed" }).eq("id", projectId);
    expect(error).toBeNull();
    const { data: p } = await owner.from("projects").select("progress, completed_at, review_requested_at").eq("id", projectId).single();
    expect(p!.progress).toBe(100);
    expect(p!.completed_at).not.toBeNull();
    expect(p!.review_requested_at).not.toBeNull();
    expect((await buyer.from("notifications").select("id").eq("type", "project_completed")).data!.length).toBe(1);
    const emails = (await admin().from("email_outbox").select("template, next_attempt_at").eq("to_email", clientEmail).in("template", ["project_completed", "review_request"])).data!;
    expect(emails.map((e) => e.template).sort()).toEqual(["project_completed", "review_request"]);
    const review = emails.find((e) => e.template === "review_request")!;
    expect(new Date(review.next_attempt_at).getTime()).toBeGreaterThan(Date.now() + 2 * 864e5); // sent 3 days later
    // Re-completing doesn't duplicate anything
    await owner.from("projects").update({ status: "in_review" }).eq("id", projectId);
    await owner.from("projects").update({ status: "completed" }).eq("id", projectId);
    expect((await admin().from("email_outbox").select("id").eq("to_email", clientEmail).eq("template", "review_request")).data!.length).toBe(1);
  });

  it("11. the email outbox dispatcher claims each email exactly once", async () => {
    const a = admin();
    const first = await a.rpc("claim_email_batch", { p_limit: 500 });
    const second = await a.rpc("claim_email_batch", { p_limit: 500 });
    const ids = new Set((first.data ?? []).map((r) => r.id));
    expect((second.data ?? []).some((r) => ids.has(r.id))).toBe(false);
    for (const row of first.data ?? []) await a.rpc("complete_email", { p_id: row.id, p_ok: true, p_provider: "test", p_message_id: "x", p_error: "" });
  });
});
