import { notFound, redirect } from "next/navigation";
import { requireTeam } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { DocumentEditor } from "@/features/finance/components/document-editor";
import { blankEditor, editorFromDocument, editorOptions } from "@/features/finance/editor-data";

export default async function EditInvoice({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireTeam("finance.manage");
  const sb = await createClient();
  const { data: inv } = await sb.from("invoices").select("*, invoice_items(*)").eq("id", id).maybeSingle();
  if (!inv) notFound();
  if (inv.amount_paid_cents > 0 || ["paid", "cancelled"].includes(inv.status)) redirect(`/admin/finance/invoices/${id}`);
  const opts = await editorOptions(ctx.organizationId, false);
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader breadcrumbs={[{ label: "Invoices", href: "/admin/finance/invoices" }, { label: inv.number, href: `/admin/finance/invoices/${id}` }, { label: "Edit" }]} title={`Edit ${inv.number}`} />
      <DocumentEditor
        kind="invoice"
        id={id}
        currency={inv.currency}
        clients={opts.clients}
        projects={opts.projects}
        services={opts.services}
        initial={blankEditor({
          client_id: inv.client_id, project_id: inv.project_id ?? "", issue_date: inv.issue_date, due_date: inv.due_date, payment_terms: inv.payment_terms ?? "", notes: inv.notes ?? "",
          ...editorFromDocument(inv, [...inv.invoice_items].sort((a, b) => a.sort_order - b.sort_order), inv.currency),
        })}
      />
    </div>
  );
}
