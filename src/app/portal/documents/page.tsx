import Link from "next/link";
import { FileText } from "lucide-react";
import { requireClient } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { AcceptContractButton } from "@/features/portal/components/review";
import { CONTRACT_STATUSES, PROPOSAL_STATUSES } from "@/lib/status";
import { formatDate, formatMoney } from "@/lib/format";
import { formatBytes } from "@/lib/utils";

export const metadata = { title: "Documents" };

export default async function PortalDocuments() {
  await requireClient();
  const sb = await createClient();
  const [{ data: proposals }, { data: contracts }, { data: files }] = await Promise.all([
    sb.from("portal_proposals").select("*").order("created_at", { ascending: false }),
    sb.from("portal_contracts").select("*").order("created_at", { ascending: false }),
    sb.from("portal_files").select("*").in("category", ["document", "contract", "proposal", "brief", "deliverable"]).order("created_at", { ascending: false }).limit(50),
  ]);
  return (
    <>
      <PageHeader title="Documents" description="Proposals, agreements and shared documents." />
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Proposals</CardTitle>
          </CardHeader>
          {proposals?.length ? (
            <ul className="divide-y border-t">
              {proposals.map((p) => (
                <li key={p.id}>
                  <Link href={`/portal/documents/proposals/${p.id}`} className="flex flex-wrap items-center gap-3 px-5 py-3 text-[13.5px] hover:bg-accent/40">
                    <span className="w-24 text-muted-foreground">{p.number}</span>
                    <span className="flex-1 font-medium">{p.title}</span>
                    <span className="tabular">{formatMoney(p.total_cents, p.currency!)}</span>
                    <StatusBadge status={p.status!} map={PROPOSAL_STATUSES} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <CardContent>
              <EmptyState compact icon={FileText} title="No proposals" />
            </CardContent>
          )}
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Agreements</CardTitle>
          </CardHeader>
          {contracts?.length ? (
            <ul className="divide-y border-t">
              {contracts.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-[13.5px]">
                  <span className="flex-1 font-medium">{c.title}</span>
                  <span className="text-muted-foreground">
                    {c.start_date ? formatDate(c.start_date) : ""}
                    {c.end_date ? ` → ${formatDate(c.end_date)}` : ""}
                  </span>
                  {c.latest_file_id ? (
                    <a href={`/api/files/${c.latest_file_id}`} className="text-primary hover:underline">
                      Download
                    </a>
                  ) : null}
                  {c.status === "sent" && !c.accepted_at ? <AcceptContractButton contractId={c.id!} /> : null}
                  {c.accepted_at ? <span className="text-[12px] text-success">Accepted {formatDate(c.accepted_at)}</span> : null}
                  <StatusBadge status={c.status!} map={CONTRACT_STATUSES} />
                </li>
              ))}
            </ul>
          ) : (
            <CardContent>
              <EmptyState compact title="No agreements" />
            </CardContent>
          )}
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Shared documents</CardTitle>
          </CardHeader>
          {files?.length ? (
            <ul className="divide-y border-t">
              {files.map((f) => (
                <li key={f.id} className="flex items-center gap-3 px-5 py-2.5 text-[13px]">
                  <a href={`/api/files/${f.id}`} className="flex-1 truncate font-medium hover:underline">
                    {f.name}
                  </a>
                  <span className="text-muted-foreground">{formatBytes(Number(f.size_bytes))}</span>
                  <span className="w-24 text-right text-muted-foreground">{formatDate(f.created_at)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <CardContent>
              <EmptyState compact title="No shared documents" />
            </CardContent>
          )}
        </Card>
      </div>
    </>
  );
}
