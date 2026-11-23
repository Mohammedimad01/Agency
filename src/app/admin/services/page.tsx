import { Pencil, Plus } from "lucide-react";
import { requireTeam } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { FormDialog } from "@/components/shared/form-dialog";
import { ServiceIcon } from "@/components/shared/icon";
import { ServiceForm } from "@/features/services/components/service-form";
import { getCurrency } from "@/features/settings/queries";
import { formatMoney } from "@/lib/format";
import { minorToInput } from "@/lib/finance/money";

export const metadata = { title: "Services" };

export default async function ServicesAdmin() {
  const ctx = await requireTeam("services.manage");
  const sb = await createClient();
  const [{ data }, currency] = await Promise.all([sb.from("services").select("*").eq("organization_id", ctx.organizationId).order("sort_order"), getCurrency(ctx.organizationId)]);
  return (
    <>
      <PageHeader
        title="Service catalogue"
        description="Used on the website, in lead qualification, proposals and projects."
        actions={
          <FormDialog size="lg" title="New service" trigger={<Button size="sm"><Plus /> New service</Button>}>
            <ServiceForm currency={currency} />
          </FormDialog>
        }
      />
      <Card>
        <ul className="divide-y">
          {(data ?? []).map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-4 px-5 py-3.5">
              <ServiceIcon name={s.icon} className="size-5 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium">{s.name}</p>
                <p className="truncate text-[12.5px] text-muted-foreground">
                  {s.category} · {s.summary}
                </p>
              </div>
              <span className="text-[13px] tabular">{s.starting_price_cents ? `From ${formatMoney(s.starting_price_cents, currency)}` : "—"}</span>
              <span className="w-24 text-[12.5px] text-muted-foreground">{s.delivery_time}</span>
              {!s.is_active ? <Badge variant="neutral">Inactive</Badge> : !s.is_public ? <Badge variant="outline">Hidden</Badge> : <Badge variant="success">Live</Badge>}
              <FormDialog size="lg" title={`Edit ${s.name}`} trigger={<Button variant="ghost" size="icon-sm" aria-label={`Edit ${s.name}`}><Pencil /></Button>}>
                <ServiceForm
                  id={s.id}
                  currency={currency}
                  service={{
                    name: s.name, slug: s.slug, category: s.category, summary: s.summary ?? "", description: s.description ?? "", icon: s.icon ?? "",
                    starting_price: minorToInput(s.starting_price_cents, currency), delivery_time: s.delivery_time ?? "", deliverables: s.deliverables.join("\n"),
                    features: s.features.join("\n"), is_active: s.is_active, is_public: s.is_public, sort_order: s.sort_order,
                  }}
                />
              </FormDialog>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
