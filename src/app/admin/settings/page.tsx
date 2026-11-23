import { requireTeam } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/shared/page-header";
import { TabNav } from "@/components/shared/tab-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NotificationPrefsForm, OrgSettingsForm, PasswordForm, ProfileForm, RunAutomationsButton } from "@/features/settings/components/settings-forms";
import { PermissionToggle } from "@/features/team/components/team-forms";
import { EMAIL_PREF_TYPES } from "@/features/settings/constants";
import { getOrgSettings } from "@/features/settings/queries";
import { ROLE_LABELS, TEAM_ROLES } from "@/lib/permissions";
import { bpsToPercent } from "@/lib/finance/calculations";
import { formatDateTime } from "@/lib/format";
import { serverEnv } from "@/lib/env";

export const metadata = { title: "Settings" };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const ctx = await requireTeam();
  const { tab = "profile" } = await searchParams;
  const sb = await createClient();
  const canOrg = ctx.can("settings.manage");
  const tabs = [
    { key: "profile", label: "Profile" },
    { key: "notifications", label: "Notifications" },
    ...(canOrg ? [{ key: "organization", label: "Organization" }] : []),
    { key: "roles", label: "Roles & permissions" },
    ...(canOrg ? [{ key: "automation", label: "Automation & email" }] : []),
  ];
  return (
    <>
      <PageHeader title="Settings" />
      <TabNav tabs={tabs} active={tab} baseHref="/admin/settings" />
      {tab === "profile" ? <ProfileTab ctx={ctx} /> : null}
      {tab === "notifications" ? <NotificationsTab userId={ctx.userId} sb={sb} /> : null}
      {tab === "organization" && canOrg ? <OrgTab orgId={ctx.organizationId} orgName={ctx.organization.name} /> : null}
      {tab === "roles" ? <RolesTab sb={sb} isOwner={ctx.role === "owner"} /> : null}
      {tab === "automation" && canOrg ? <AutomationTab /> : null}
    </>
  );
}

async function ProfileTab({ ctx }: { ctx: Awaited<ReturnType<typeof requireTeam>> }) {
  const sb = await createClient();
  const { data: p } = await sb.from("profiles").select("full_name, phone, job_title, timezone").eq("id", ctx.userId).single();
  return (
    <div className="grid max-w-3xl gap-4">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Your profile</CardTitle>
            <CardDescription>{ctx.profile.email} · {ROLE_LABELS[ctx.role]}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <ProfileForm values={{ full_name: p?.full_name ?? "", phone: p?.phone ?? "", job_title: p?.job_title ?? "", timezone: p?.timezone ?? "" }} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
        </CardHeader>
        <CardContent>
          <PasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}

async function NotificationsTab({ userId, sb }: { userId: string; sb: Awaited<ReturnType<typeof createClient>> }) {
  const { data } = await sb.from("notification_preferences").select("email_enabled, email_types").eq("profile_id", userId).maybeSingle();
  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Email notifications</CardTitle>
      </CardHeader>
      <CardContent>
        <NotificationPrefsForm types={EMAIL_PREF_TYPES} initial={{ email_enabled: data?.email_enabled ?? true, email_types: (data?.email_types ?? {}) as Record<string, boolean> }} />
      </CardContent>
    </Card>
  );
}

async function OrgTab({ orgId, orgName }: { orgId: string; orgName: string }) {
  const s = await getOrgSettings(orgId);
  if (!s) return null;
  return (
    <Card className="max-w-4xl">
      <CardContent className="pt-5">
        <OrgSettingsForm
          values={{
            name: orgName, currency: s.currency, timezone: s.timezone, default_tax_rate: bpsToPercent(s.default_tax_rate_bps), default_payment_terms_days: s.default_payment_terms_days,
            invoice_prefix: s.invoice_prefix, proposal_prefix: s.proposal_prefix, project_prefix: s.project_prefix, company_legal_name: s.company_legal_name ?? "",
            company_address: s.company_address ?? "", company_email: s.company_email ?? "", company_phone: s.company_phone ?? "", tax_id: s.tax_id ?? "",
            payment_instructions: s.payment_instructions ?? "", invoice_footer: s.invoice_footer ?? "", lead_capacity_projects: s.lead_capacity_projects,
          }}
        />
      </CardContent>
    </Card>
  );
}

async function RolesTab({ sb, isOwner }: { sb: Awaited<ReturnType<typeof createClient>>; isOwner: boolean }) {
  const [{ data: perms }, { data: rp }] = await Promise.all([sb.from("permissions").select("*").order("module"), sb.from("role_permissions").select("*")]);
  const has = new Set((rp ?? []).map((r) => `${r.role_key}:${r.permission_key}`));
  const roles = TEAM_ROLES;
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Role permissions</CardTitle>
          <CardDescription>{isOwner ? "As an owner you can adjust what each role can do. Changes apply immediately and are enforced by the database." : "Only owners can change role permissions."}</CardDescription>
        </div>
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-y bg-muted/40 text-left text-[12px] text-muted-foreground">
              <th className="px-5 py-2 font-medium">Permission</th>
              {roles.map((r) => (
                <th key={r} className="px-2 py-2 text-center font-medium">
                  {ROLE_LABELS[r]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(perms ?? []).map((p) => (
              <tr key={p.key} className="border-b last:border-0">
                <td className="px-5 py-2">
                  <p className="font-medium">{p.description}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">{p.key}</p>
                </td>
                {roles.map((r) => (
                  <td key={r} className="px-2 py-2 text-center">
                    <span className="inline-flex">
                      <PermissionToggle role={r} permission={p.key} checked={r === "owner" || has.has(`${r}:${p.key}`)} disabled={!isOwner || r === "owner"} />
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

async function AutomationTab() {
  const admin = createAdminClient();
  const [pending, failed, sent, recent] = await Promise.all([
    admin.from("email_outbox").select("id", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("email_outbox").select("id", { count: "exact", head: true }).in("status", ["failed", "cancelled"]),
    admin.from("email_outbox").select("id", { count: "exact", head: true }).eq("status", "sent"),
    admin.from("email_outbox").select("id, template, to_email, status, attempts, last_error, created_at, sent_at").order("created_at", { ascending: false }).limit(15),
  ]);
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Scheduled automations</CardTitle>
            <CardDescription>
              Supabase Cron runs follow-up reminders, task deadline alerts, overdue invoices, payment reminders and proposal/contract expiry every hour. Email is dispatched every 5 minutes.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 text-[13px]">
          <p>
            Email provider: <strong>{serverEnv.emailProvider === "resend" && serverEnv.resendApiKey ? "Resend" : "Console (development — emails are logged, not sent)"}</strong>
          </p>
          <p>
            Outbox: <strong>{pending.count ?? 0}</strong> pending · <strong>{sent.count ?? 0}</strong> sent · <strong>{failed.count ?? 0}</strong> failed/cancelled
          </p>
          <RunAutomationsButton />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Recent emails</CardTitle>
        </CardHeader>
        <ul className="divide-y border-t text-[13px]">
          {(recent.data ?? []).map((e) => (
            <li key={e.id} className="flex flex-wrap items-center gap-3 px-5 py-2">
              <span className="w-40 font-mono text-[12px]">{e.template}</span>
              <span className="min-w-0 flex-1 truncate">{String(e.to_email)}</span>
              <span className="text-muted-foreground">{e.status}{e.attempts > 1 ? ` (${e.attempts} attempts)` : ""}</span>
              {e.last_error ? <span className="w-full truncate text-[12px] text-destructive">{e.last_error}</span> : null}
              <span className="text-[12px] text-muted-foreground">{formatDateTime(e.sent_at ?? e.created_at)}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
