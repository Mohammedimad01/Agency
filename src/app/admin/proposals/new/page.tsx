import { requireTeam } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { DocumentEditor } from "@/features/finance/components/document-editor";
import { blankEditor, editorOptions } from "@/features/finance/editor-data";
import { getCurrency, getOrgSettings } from "@/features/settings/queries";
import { bpsToPercent } from "@/lib/finance/calculations";
import { createClient } from "@/lib/supabase/server";
import { minorToInput } from "@/lib/finance/money";

export const metadata = { title: "New proposal" };

export default async function NewProposal({ searchParams }: { searchParams: Promise<{ client?: string; lead?: string }> }) {
  const ctx = await requireTeam("proposals.manage");
  const { client, lead } = await searchParams;
  const [currency, settings, opts] = await Promise.all([getCurrency(ctx.organizationId), getOrgSettings(ctx.organizationId), editorOptions(ctx.organizationId, true)]);
  const validUntil = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
  let prefill = {};
  if (lead) {
    const sb = await createClient();
    const { data: l } = await sb.from("leads").select("full_name, company, service_id, requested_service, description, budget_cents, converted_client_id").eq("id", lead).maybeSingle();
    if (l) {
      const service = opts.services.find((s) => s.id === l.service_id);
      prefill = {
        lead_id: l.converted_client_id ? "" : lead,
        client_id: l.converted_client_id ?? "",
        title: `${l.requested_service ?? "Project"} for ${l.company ?? l.full_name}`,
        summary: l.description ?? "",
        items: [{ service_id: l.service_id ?? "", description: service?.name ?? l.requested_service ?? "", details: "", quantity: "1", unit_price: minorToInput(service?.starting_price_cents ?? l.budget_cents, currency) }],
      };
      if (!opts.leads.some((x) => x.id === lead) && !l.converted_client_id) opts.leads.push({ id: lead, name: l.full_name });
    }
  }
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader breadcrumbs={[{ label: "Proposals", href: "/admin/proposals" }, { label: "New" }]} title="New proposal" />
      <DocumentEditor
        kind="proposal"
        currency={currency}
        clients={opts.clients}
        leads={opts.leads}
        services={opts.services}
        initial={blankEditor({
          client_id: client ?? "", valid_until: validUntil, tax_rate: bpsToPercent(settings?.default_tax_rate_bps ?? 0),
          payment_terms: "50% deposit to begin, 50% on delivery.", ...prefill,
        })}
      />
    </div>
  );
}
