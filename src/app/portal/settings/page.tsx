import { requireClient } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ContactDetailsForm } from "@/features/portal/components/review";
import { NotificationPrefsForm, PasswordForm } from "@/features/settings/components/settings-forms";
import { EMAIL_PREF_TYPES } from "@/features/settings/constants";

export const metadata = { title: "Settings" };

export default async function PortalSettings() {
  const ctx = await requireClient();
  const sb = await createClient();
  const [{ data: clients }, { data: prefs }] = await Promise.all([
    sb.from("portal_clients").select("*"),
    sb.from("notification_preferences").select("email_enabled, email_types").eq("profile_id", ctx.userId).maybeSingle(),
  ]);
  const clientTypes = Object.fromEntries(Object.entries(EMAIL_PREF_TYPES).filter(([k]) => k !== "new_lead"));
  return (
    <>
      <PageHeader title="Settings" />
      <div className="grid max-w-3xl gap-4">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Your details</CardTitle>
              <CardDescription>{ctx.profile.email}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ContactDetailsForm values={{ full_name: ctx.contact?.full_name ?? ctx.profile.full_name ?? "", phone: ctx.contact?.phone ?? "", job_title: ctx.contact?.job_title ?? "" }} />
          </CardContent>
        </Card>
        {(clients ?? []).map((c) => (
          <Card key={c.id}>
            <CardHeader>
              <div>
                <CardTitle>Company information</CardTitle>
                <CardDescription>To update company or billing details, message your project manager.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 text-[13.5px] sm:grid-cols-2">
                {[
                  ["Name", c.company_name ?? c.name],
                  ["Billing email", c.email ? String(c.email) : null],
                  ["Phone", c.phone],
                  ["Website", c.website],
                  ["Address", [c.address_line1, c.city, c.country].filter(Boolean).join(", ")],
                  ["Tax ID", c.tax_id],
                ].map(([k, v]) => (
                  <div key={k as string}>
                    <dt className="text-[12px] text-muted-foreground">{k}</dt>
                    <dd className="font-medium">{v || "—"}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
          </CardHeader>
          <CardContent>
            <PasswordForm />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <NotificationPrefsForm types={clientTypes} initial={{ email_enabled: prefs?.email_enabled ?? true, email_types: (prefs?.email_types ?? {}) as Record<string, boolean> }} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
