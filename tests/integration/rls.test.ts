import { beforeAll, describe, expect, it } from "vitest";
import { admin, anon, signIn, stackAvailable, type DB } from "./helpers";

const live = await stackAvailable();

describe.skipIf(!live)("Row Level Security & client isolation", () => {
  let owner: DB, dev: DB, finance: DB, acme: DB, globex: DB;
  let acmeClientId: string, globexClientId: string, acmeProjectId: string, acmeInvoiceId: string;

  beforeAll(async () => {
    [owner, dev, finance, acme, globex] = await Promise.all([
      signIn("owner@team.test"), signIn("dev@team.test"), signIn("finance@team.test"), signIn("client@acme.test"), signIn("client@globex.test"),
    ]);
    const a = admin();
    acmeClientId = (await a.from("clients").select("id").eq("name", "Acme Logistics").single()).data!.id;
    globexClientId = (await a.from("clients").select("id").eq("name", "Globex Retail").single()).data!.id;
    acmeProjectId = (await a.from("projects").select("id").eq("client_id", acmeClientId).eq("status", "in_progress").single()).data!.id;
    acmeInvoiceId = (await a.from("invoices").select("id").eq("client_id", acmeClientId).limit(1).single()).data!.id;
  });

  it("anonymous visitors can read published website content only", async () => {
    const a = anon();
    expect((await a.from("services").select("id")).data!.length).toBeGreaterThan(0);
    expect((await a.from("leads").select("id")).data).toEqual([]);
    expect((await a.from("clients").select("id")).data).toEqual([]);
    expect((await a.from("invoices").select("id")).data).toEqual([]);
    expect((await a.from("portal_projects").select("id")).error).not.toBeNull();
    const insert = await a.from("leads").insert({ organization_id: "00000000-0000-0000-0000-000000000000", full_name: "x", email: "x@y.z" });
    expect(insert.error).not.toBeNull();
  });

  it("clients see only their own organization through portal views", async () => {
    const acmeProjects = (await acme.from("portal_projects").select("id, client_id")).data!;
    expect(acmeProjects.length).toBeGreaterThan(0);
    expect(acmeProjects.every((p) => p.client_id === acmeClientId)).toBe(true);
    const globexProjects = (await globex.from("portal_projects").select("id, client_id")).data!;
    expect(globexProjects.every((p) => p.client_id === globexClientId)).toBe(true);
    expect(globexProjects.some((p) => p.id === acmeProjectId)).toBe(false);
    expect((await globex.from("portal_invoices").select("id").eq("id", acmeInvoiceId)).data).toEqual([]);
    expect((await globex.from("portal_files").select("id").eq("project_id", acmeProjectId)).data).toEqual([]);
  });

  it("clients cannot read base tables or internal fields", async () => {
    for (const table of ["projects", "invoices", "clients", "leads", "tasks", "files", "payments", "proposals", "team_members", "expenses"] as const) {
      const { data } = await acme.from(table).select("id");
      expect(data, table).toEqual([]);
    }
    const { error } = await acme.from("portal_projects").select("internal_notes");
    expect(error).not.toBeNull(); // column is not exposed by the view
    const tasks = (await acme.from("portal_tasks").select("id").eq("project_id", acmeProjectId)).data!;
    const allTasks = (await admin().from("tasks").select("id, is_client_visible").eq("project_id", acmeProjectId)).data!;
    expect(tasks.length).toBe(allTasks.filter((t) => t.is_client_visible).length);
  });

  it("clients cannot write through portal views or forge records", async () => {
    const upd = await acme.from("portal_projects").update({ progress: 100 } as never).eq("id", acmeProjectId);
    expect(upd.error).not.toBeNull();
    const pay = await acme.from("payments").insert({ organization_id: "00000000-0000-0000-0000-000000000000", invoice_id: acmeInvoiceId, client_id: acmeClientId, amount_cents: 100 });
    expect(pay.error).not.toBeNull();
    const notif = await acme.from("notifications").insert({ recipient_id: "00000000-0000-0000-0000-000000000000", type: "x", title: "x" });
    expect(notif.error).not.toBeNull();
  });

  it("clients only see conversations of their own projects, never internal threads", async () => {
    const { data: convs } = await globex.from("conversations").select("id, project_id, is_internal");
    expect(convs!.some((c) => c.project_id === acmeProjectId)).toBe(false);
    expect(convs!.every((c) => !c.is_internal)).toBe(true);
    const acmeConv = (await admin().from("conversations").select("id").eq("project_id", acmeProjectId).limit(1).single()).data!;
    const write = await globex.from("messages").insert({ organization_id: "00000000-0000-0000-0000-000000000000", conversation_id: acmeConv.id, body: "hi", author_id: (await globex.auth.getUser()).data.user!.id });
    expect(write.error).not.toBeNull();
  });

  it("developers see only assigned projects and no financial or CRM data", async () => {
    const projects = (await dev.from("projects").select("id")).data!;
    const memberships = (await admin().from("project_members").select("project_id").eq("profile_id", (await dev.auth.getUser()).data.user!.id)).data!;
    expect(projects.map((p) => p.id).sort()).toEqual([...new Set(memberships.map((m) => m.project_id))].sort());
    expect((await dev.from("invoices").select("id")).data).toEqual([]);
    expect((await dev.from("payments").select("id")).data).toEqual([]);
    expect((await dev.from("expenses").select("id")).data).toEqual([]);
    expect((await dev.from("leads").select("id")).data).toEqual([]);
    expect((await dev.from("project_finances").select("budget_cents")).data).toEqual([]);
    const fin = await dev.rpc("report_project_profitability", { p_org: (await admin().from("organizations").select("id").single()).data!.id });
    expect(fin.data).toEqual([]);
  });

  it("finance can read invoices but cannot see leads or manage the team", async () => {
    expect((await finance.from("invoices").select("id")).data!.length).toBeGreaterThan(0);
    expect((await finance.from("leads").select("id")).data).toEqual([]);
    const tm = (await admin().from("team_members").select("id").eq("role_key", "developer").single()).data!;
    const res = await finance.from("team_members").update({ role_key: "admin" }).eq("id", tm.id).select("id");
    expect(res.data ?? []).toEqual([]);
  });

  it("non-owners cannot grant the owner role and the last owner cannot be removed", async () => {
    const pm = await signIn("pm@team.test");
    const tm = (await admin().from("team_members").select("id, profile_id").eq("role_key", "developer").single()).data!;
    // PM lacks team.manage entirely → no rows updated
    expect((await pm.from("team_members").update({ role_key: "owner" }).eq("id", tm.id).select("id")).data ?? []).toEqual([]);
    const ownerRow = (await admin().from("team_members").select("id").eq("role_key", "owner").single()).data!;
    const demote = await owner.from("team_members").update({ role_key: "admin" }).eq("id", ownerRow.id);
    expect(demote.error?.message).toMatch(/at least one active owner/i);
  });

  it("role permissions and the email outbox are not writable by users", async () => {
    expect((await owner.from("role_permissions").insert({ role_key: "developer", permission_key: "finance.view" })).error).not.toBeNull();
    expect((await owner.from("email_outbox").select("id")).error).not.toBeNull();
    expect((await owner.rpc("run_scheduled_automations")).error).not.toBeNull();
    expect((await owner.rpc("bootstrap_organization", { p_owner: "00000000-0000-0000-0000-000000000000", p_name: "x", p_slug: "x" })).error).not.toBeNull();
  });
});
