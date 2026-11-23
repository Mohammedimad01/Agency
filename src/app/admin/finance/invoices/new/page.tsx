import { requireTeam } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { DocumentEditor } from "@/features/finance/components/document-editor";
import { blankEditor, editorOptions } from "@/features/finance/editor-data";
import { getCurrency, getOrgSettings } from "@/features/settings/queries";
import { bpsToPercent } from "@/lib/finance/calculations";
import { isoDaysFromNow } from "@/lib/format";

export const metadata = { title: "New invoice" };

export default async function NewInvoice({ searchParams }: { searchParams: Promise<{ client?: string; project?: string }> }) {
  const ctx = await requireTeam("finance.manage");
  const { client, project } = await searchParams;
  const [currency, settings, opts] = await Promise.all([getCurrency(ctx.organizationId), getOrgSettings(ctx.organizationId), editorOptions(ctx.organizationId, false)]);
  const terms = settings?.default_payment_terms_days ?? 14;
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader breadcrumbs={[{ label: "Invoices", href: "/admin/finance/invoices" }, { label: "New" }]} title="New invoice" description="Created as a draft. The number is assigned automatically." />
      <DocumentEditor
        kind="invoice"
        currency={currency}
        clients={opts.clients}
        projects={opts.projects}
        services={opts.services}
        initial={blankEditor({
          client_id: client ?? "", project_id: project ?? "", due_date: isoDaysFromNow(terms),
          tax_rate: bpsToPercent(settings?.default_tax_rate_bps ?? 0), payment_terms: `Payment due within ${terms} days.`,
        })}
      />
    </div>
  );
}
