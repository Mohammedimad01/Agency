import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { requireTeam } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { FormDialog } from "@/components/shared/form-dialog";
import { ContractForm, ContractVersionUploader } from "@/features/contracts/components/contract-forms";
import { getCurrency } from "@/features/settings/queries";
import { CONTRACT_STATUSES } from "@/lib/status";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { minorToInput } from "@/lib/finance/money";

export default async function ContractDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireTeam("contracts.view");
  const sb = await createClient();
  const { data: c } = await sb.from("contracts").select("*, client:clients(id, name), project:projects(id, name), proposal:proposals(id, number), accepter:profiles!contracts_accepted_by_fkey(full_name)").eq("id", id).maybeSingle();
  if (!c) notFound();
  const [{ data: versions }, currency, { data: clients }, { data: projects }] = await Promise.all([
    sb.from("contract_versions").select("*, file:files(id, name, size_bytes)").eq("contract_id", id).order("version", { ascending: false }),
    getCurrency(ctx.organizationId),
    sb.from("clients").select("id, name").is("deleted_at", null),
    sb.from("projects").select("id, name, client_id").is("deleted_at", null),
  ]);
  const canManage = ctx.can("contracts.manage");
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Contracts", href: "/admin/contracts" }, { label: c.title }]}
        title={c.title}
        meta={<StatusBadge status={c.status} map={CONTRACT_STATUSES} />}
        description={
          <>
            <Link href={`/admin/clients/${c.client?.id}`} className="hover:underline">{c.client?.name}</Link>
            {c.project ? <> · <Link href={`/admin/projects/${c.project.id}`} className="hover:underline">{c.project.name}</Link></> : null}
            {c.proposal ? <> · from <Link href={`/admin/proposals/${c.proposal.id}`} className="hover:underline">{c.proposal.number}</Link></> : null}
          </>
        }
        actions={
          canManage ? (
            <FormDialog size="lg" title="Edit contract" trigger={<Button variant="outline" size="sm"><Pencil /> Edit</Button>}>
              <ContractForm
                id={c.id}
                currency={currency}
                clients={clients ?? []}
                projects={projects ?? []}
                contract={{
                  client_id: c.client_id, project_id: c.project_id ?? "", title: c.title, description: c.description ?? "", status: c.status, value: minorToInput(c.value_cents, currency),
                  start_date: c.start_date ?? "", end_date: c.end_date ?? "", signed_by_name: c.signed_by_name ?? "", signed_at: c.signed_at?.slice(0, 10) ?? "", notes: c.notes ?? "",
                }}
              />
            </FormDialog>
          ) : null
        }
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="grid content-start gap-4">
          {canManage ? <ContractVersionUploader contractId={c.id} /> : null}
          <Card>
            <CardHeader>
              <CardTitle>Document versions</CardTitle>
            </CardHeader>
            {versions?.length ? (
              <ul className="divide-y border-t">
                {versions.map((v) => (
                  <li key={v.id} className="flex items-center gap-3 px-5 py-2.5 text-[13px]">
                    <Badge variant="outline">v{v.version}</Badge>
                    <a href={`/api/files/${v.file?.id}`} className="flex-1 truncate hover:underline">{v.file?.name}</a>
                    <span className="text-muted-foreground">{formatDateTime(v.created_at)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <CardContent>
                <p className="text-[13px] text-muted-foreground">No documents uploaded yet.</p>
              </CardContent>
            )}
          </Card>
          {c.description || c.notes ? (
            <Card>
              <CardContent className="grid gap-3 pt-5 text-[13.5px]">
                {c.description ? <p className="whitespace-pre-line">{c.description}</p> : null}
                {c.notes ? <p className="whitespace-pre-line text-muted-foreground">{c.notes}</p> : null}
              </CardContent>
            </Card>
          ) : null}
        </div>
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-[13px]">
            {[
              ["Value", c.value_cents ? formatMoney(c.value_cents, currency) : "—"],
              ["Start", formatDate(c.start_date)],
              ["End / expiry", formatDate(c.end_date)],
              ["Signed", c.signed_at ? `${formatDate(c.signed_at)}${c.signed_by_name ? ` by ${c.signed_by_name}` : ""}` : "—"],
              ["Client acceptance", c.accepted_at ? `${formatDateTime(c.accepted_at)}${c.accepter?.full_name ? ` · ${c.accepter.full_name}` : ""}` : "—"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3">
                <span className="text-muted-foreground">{k}</span>
                <span className="text-right font-medium">{v}</span>
              </div>
            ))}
            {c.status === "draft" ? <p className="mt-2 text-[12px] text-muted-foreground">Set status to “Sent” to let the client view and record acceptance in their portal.</p> : null}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
