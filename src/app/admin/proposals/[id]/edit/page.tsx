import { notFound, redirect } from "next/navigation";
import { requireTeam } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { DocumentEditor } from "@/features/finance/components/document-editor";
import { blankEditor, editorFromDocument, editorOptions } from "@/features/finance/editor-data";

export default async function EditProposal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireTeam("proposals.manage");
  const sb = await createClient();
  const { data: p } = await sb.from("proposals").select("*, proposal_items(*)").eq("id", id).maybeSingle();
  if (!p) notFound();
  if (!["draft", "sent", "viewed"].includes(p.status)) redirect(`/admin/proposals/${id}`);
  const opts = await editorOptions(ctx.organizationId, true);
  if (p.lead_id && !opts.leads.some((l) => l.id === p.lead_id)) opts.leads.push({ id: p.lead_id, name: "Linked lead" });
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader breadcrumbs={[{ label: "Proposals", href: "/admin/proposals" }, { label: p.number, href: `/admin/proposals/${id}` }, { label: "Edit" }]} title={`Edit ${p.number}`} />
      <DocumentEditor
        kind="proposal"
        id={id}
        currency={p.currency}
        clients={opts.clients}
        leads={opts.leads}
        services={opts.services}
        initial={blankEditor({
          client_id: p.client_id ?? "", lead_id: p.lead_id ?? "", title: p.title, summary: p.summary ?? "", scope: p.scope ?? "", timeline: p.timeline ?? "",
          payment_terms: p.payment_terms ?? "", valid_until: p.valid_until ?? "",
          ...editorFromDocument(p, [...p.proposal_items].sort((a, b) => a.sort_order - b.sort_order), p.currency),
        })}
      />
    </div>
  );
}
