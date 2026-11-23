import Link from "next/link";
import { notFound } from "next/navigation";
import { Archive, Globe, Mail, MapPin, Pencil, Phone, Plus, UserPlus } from "lucide-react";
import { requireTeam } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { TabNav } from "@/components/shared/tab-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { FormDialog } from "@/components/shared/form-dialog";
import { ConfirmAction } from "@/components/shared/confirm-action";
import { ActivityFeed } from "@/components/shared/activity-feed";
import { ClientForm, ContactActions, ContactForm } from "@/features/clients/components/client-forms";
import { archiveClient } from "@/features/clients/actions";
import { getCurrency, getTeamDirectory } from "@/features/settings/queries";
import { CLIENT_STATUSES, CONTRACT_STATUSES, INVOICE_STATUSES, PAYMENT_METHODS, PROJECT_STATUSES, PROPOSAL_STATUSES } from "@/lib/status";
import { formatDate, formatMoney, formatRelative } from "@/lib/format";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatBytes } from "@/lib/utils";

export default async function ClientDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const [{ id }, { tab = "overview" }] = await Promise.all([params, searchParams]);
  const ctx = await requireTeam("clients.view");
  const sb = await createClient();
  const { data: client } = await sb.from("clients").select("*, manager:profiles!clients_account_manager_id_fkey(full_name)").eq("id", id).is("deleted_at", null).maybeSingle();
  if (!client) notFound();
  const showFinance = ctx.can("finance.view");

  const [currency, team, contacts, projects, invoices, payments, contracts, proposals, files, activity, conversations] = await Promise.all([
    getCurrency(ctx.organizationId),
    getTeamDirectory(ctx.organizationId),
    sb.from("client_contacts").select("*").eq("client_id", id).is("deleted_at", null).order("is_primary", { ascending: false }),
    sb.from("projects").select("id, code, name, status, progress, due_date, finance:project_finances(contract_value_cents)").eq("client_id", id).is("deleted_at", null).order("created_at", { ascending: false }),
    showFinance ? sb.from("invoices").select("id, number, status, total_cents, balance_cents, due_date, issue_date").eq("client_id", id).is("deleted_at", null).order("issue_date", { ascending: false }) : Promise.resolve({ data: [] as never[] }),
    showFinance ? sb.from("payments").select("id, amount_cents, payment_date, method, status, reference, invoices(number)").eq("client_id", id).order("payment_date", { ascending: false }) : Promise.resolve({ data: [] as never[] }),
    ctx.can("contracts.view") ? sb.from("contracts").select("id, title, status, value_cents, end_date").eq("client_id", id).is("deleted_at", null) : Promise.resolve({ data: [] as never[] }),
    ctx.can("proposals.view") ? sb.from("proposals").select("id, number, title, status, total_cents").eq("client_id", id).is("deleted_at", null) : Promise.resolve({ data: [] as never[] }),
    sb.from("files").select("id, name, size_bytes, category, visibility, created_at, project_id").eq("client_id", id).is("deleted_at", null).order("created_at", { ascending: false }).limit(50),
    sb.from("activity_logs").select("id, description, created_at, actor:profiles!activity_logs_actor_id_fkey(full_name)").eq("client_id", id).order("created_at", { ascending: false }).limit(50),
    sb.from("conversations").select("id, subject, last_message_at, is_internal, project_id").eq("client_id", id).order("last_message_at", { ascending: false, nullsFirst: false }),
  ]);

  const revenue = (payments.data ?? []).filter((p) => p.status === "completed").reduce((s, p) => s + p.amount_cents, 0);
  const outstanding = (invoices.data ?? []).filter((i) => ["sent", "partially_paid", "overdue"].includes(i.status)).reduce((s, i) => s + Number(i.balance_cents ?? 0), 0);
  const active = (projects.data ?? []).filter((p) => ["planning", "in_progress", "awaiting_client", "in_review"].includes(p.status));
  const canManage = ctx.can("clients.manage");
  const address = [client.address_line1, client.address_line2, client.city, client.state, client.postal_code, client.country].filter(Boolean).join(", ");
  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "projects", label: "Projects", count: projects.data?.length },
    ...(showFinance ? [{ key: "finance", label: "Invoices & payments", count: invoices.data?.length }] : []),
    { key: "documents", label: "Documents & files", count: (contracts.data?.length ?? 0) + (proposals.data?.length ?? 0) + (files.data?.length ?? 0) },
    { key: "messages", label: "Communication", count: conversations.data?.length },
    { key: "activity", label: "Activity" },
  ];
  const teamOptions = team.map((t) => ({ id: t.id, name: t.name }));

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Clients", href: "/admin/clients" }, { label: client.name }]}
        title={client.name}
        meta={
          <>
            <StatusBadge status={client.status} map={CLIENT_STATUSES} />
            <Badge variant="outline" className="capitalize">{client.type}</Badge>
          </>
        }
        description={[client.industry, client.manager?.full_name ? `Managed by ${client.manager.full_name}` : null, `Client since ${formatDate(client.created_at)}`].filter(Boolean).join(" · ")}
        actions={
          canManage ? (
            <>
              {ctx.can("projects.manage") ? (
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/admin/projects/new?client=${client.id}`}>
                    <Plus /> Project
                  </Link>
                </Button>
              ) : null}
              <FormDialog size="lg" title="Edit client" trigger={<Button size="sm" variant="outline"><Pencil /> Edit</Button>}>
                <ClientForm
                    team={teamOptions}
                    client={{
                      id: client.id, type: client.type, name: client.name, company_name: client.company_name ?? "", email: client.email ? String(client.email) : "",
                      phone: client.phone ?? "", website: client.website ?? "", industry: client.industry ?? "", address_line1: client.address_line1 ?? "",
                      address_line2: client.address_line2 ?? "", city: client.city ?? "", state: client.state ?? "", postal_code: client.postal_code ?? "",
                      country: client.country ?? "", tax_id: client.tax_id ?? "", status: client.status, source: client.source ?? "",
                      account_manager_id: client.account_manager_id ?? "", notes: client.notes ?? "",
                    }}
                  />
              </FormDialog>
              <ConfirmAction
                trigger={<Button size="icon-sm" variant="ghost" aria-label="Archive client"><Archive /></Button>}
                title="Archive this client?"
                description="The client will be hidden from lists. Projects, invoices and history are preserved."
                destructive
                confirmLabel="Archive"
                action={archiveClient.bind(null, client.id)}
              />
            </>
          ) : null
        }
      />

      <TabNav tabs={tabs} active={tab} baseHref={`/admin/clients/${client.id}`} />

      {tab === "overview" ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="grid content-start gap-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard label="Active projects" value={active.length} hint={`${projects.data?.length ?? 0} total`} />
              {showFinance ? <StatCard label="Lifetime revenue" value={formatMoney(revenue, currency)} /> : null}
              {showFinance ? <StatCard label="Outstanding" value={formatMoney(outstanding, currency)} tone={outstanding ? "warning" : "default"} /> : null}
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Active projects</CardTitle>
              </CardHeader>
              <CardContent>
                {active.length ? (
                  <ul className="grid gap-3">
                    {active.map((p) => (
                      <li key={p.id}>
                        <Link href={`/admin/projects/${p.id}`} className="flex items-center gap-4 rounded-md border p-3 hover:bg-accent/40">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13.5px] font-medium">{p.name}</p>
                            <p className="text-[12px] text-muted-foreground">
                              {p.code} · due {formatDate(p.due_date)}
                            </p>
                          </div>
                          <div className="w-32">
                            <Progress value={p.progress} />
                            <p className="mt-1 text-right text-[11.5px] text-muted-foreground tabular">{p.progress}%</p>
                          </div>
                          <StatusBadge status={p.status} map={PROJECT_STATUSES} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState compact title="No active projects" />
                )}
              </CardContent>
            </Card>
            {client.notes ? (
              <Card>
                <CardHeader>
                  <CardTitle>Internal notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line text-[13.5px] text-muted-foreground">{client.notes}</p>
                </CardContent>
              </Card>
            ) : null}
          </div>
          <div className="grid content-start gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Company details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 text-[13.5px]">
                {client.email ? <p className="flex items-center gap-2"><Mail className="size-4 text-muted-foreground" />{String(client.email)}</p> : null}
                {client.phone ? <p className="flex items-center gap-2"><Phone className="size-4 text-muted-foreground" />{client.phone}</p> : null}
                {client.website ? <a href={client.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-primary"><Globe className="size-4 text-muted-foreground" />{client.website.replace(/^https?:\/\//, "")}</a> : null}
                {address ? <p className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />{address}</p> : null}
                {client.tax_id ? <p className="text-muted-foreground">Tax ID: {client.tax_id}</p> : null}
                {client.source ? <p className="text-muted-foreground">Source: {client.source}</p> : null}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Contacts & portal access</CardTitle>
                {canManage ? (
                  <FormDialog title="Add contact" trigger={<Button variant="ghost" size="icon-sm" aria-label="Add contact"><UserPlus /></Button>}>
                    <ContactForm clientId={client.id} />
                  </FormDialog>
                ) : null}
              </CardHeader>
              <CardContent>
                {contacts.data?.length ? (
                  <ul className="grid gap-3">
                    {contacts.data.map((c) => (
                      <li key={c.id} className="flex items-start justify-between gap-2 text-[13px]">
                        <div className="min-w-0">
                          <p className="font-medium">
                            {c.full_name} {c.is_primary ? <Badge variant="neutral" className="ml-1">Primary</Badge> : null}
                          </p>
                          <p className="truncate text-muted-foreground">{String(c.email)}</p>
                          <p className="mt-1 text-[12px]">
                            {c.portal_access ? (
                              <span className="text-success">Portal access{c.last_seen_at ? ` · seen ${formatRelative(c.last_seen_at)}` : c.invited_at ? " · invited" : ""}</span>
                            ) : (
                              <span className="text-muted-foreground">No portal access</span>
                            )}
                          </p>
                        </div>
                        <ContactActions
                          canManage={canManage}
                          contact={{ id: c.id, client_id: c.client_id, full_name: c.full_name, email: String(c.email), phone: c.phone ?? "", job_title: c.job_title ?? "", is_primary: c.is_primary, portal_access: c.portal_access, profile_id: c.profile_id }}
                        />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState compact title="No contacts" description="Add a contact to give them portal access." />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      {tab === "projects" ? (
        <Card>
          {projects.data?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Deadline</TableHead>
                  {showFinance ? <TableHead className="text-right">Contract value</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.data.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link href={`/admin/projects/${p.id}`} className="font-medium hover:underline">{p.name}</Link>
                      <span className="ml-2 text-[12px] text-muted-foreground">{p.code}</span>
                    </TableCell>
                    <TableCell><StatusBadge status={p.status} map={PROJECT_STATUSES} /></TableCell>
                    <TableCell className="tabular">{p.progress}%</TableCell>
                    <TableCell>{formatDate(p.due_date)}</TableCell>
                    {showFinance ? <TableCell className="text-right tabular">{p.finance?.contract_value_cents ? formatMoney(p.finance.contract_value_cents, currency) : "—"}</TableCell> : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState compact title="No projects" className="m-5" />
          )}
        </Card>
      ) : null}

      {tab === "finance" && showFinance ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
              {ctx.can("finance.manage") ? <Link href={`/admin/finance/invoices/new?client=${client.id}`} className="text-[12.5px] text-muted-foreground hover:text-foreground">New invoice →</Link> : null}
            </CardHeader>
            <CardContent className="px-0">
              {invoices.data?.length ? (
                <ul className="divide-y">
                  {invoices.data.map((i) => (
                    <li key={i.id} className="flex items-center gap-3 px-5 py-2.5 text-[13px]">
                      <Link href={`/admin/finance/invoices/${i.id}`} className="flex-1 font-medium hover:underline">{i.number}</Link>
                      <span className="text-muted-foreground">due {formatDate(i.due_date)}</span>
                      <StatusBadge status={i.status} map={INVOICE_STATUSES} />
                      <span className="w-24 text-right tabular">{formatMoney(i.total_cents, currency)}</span>
                    </li>
                  ))}
                </ul>
              ) : <div className="px-5"><EmptyState compact title="No invoices" /></div>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Payments</CardTitle></CardHeader>
            <CardContent className="px-0">
              {payments.data?.length ? (
                <ul className="divide-y">
                  {payments.data.map((p) => (
                    <li key={p.id} className="flex items-center gap-3 px-5 py-2.5 text-[13px]">
                      <span className="flex-1">{formatDate(p.payment_date)} · {PAYMENT_METHODS[p.method]}{p.reference ? ` · ${p.reference}` : ""}</span>
                      <span className="text-muted-foreground">{p.invoices?.number}</span>
                      <span className="w-24 text-right font-medium tabular">{formatMoney(p.amount_cents, currency)}</span>
                    </li>
                  ))}
                </ul>
              ) : <div className="px-5"><EmptyState compact title="No payments" /></div>}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {tab === "documents" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {ctx.can("proposals.view") ? (
            <Card>
              <CardHeader><CardTitle>Proposals</CardTitle></CardHeader>
              <CardContent>
                {proposals.data?.length ? (
                  <ul className="grid gap-2 text-[13px]">
                    {proposals.data.map((p) => (
                      <li key={p.id} className="flex items-center justify-between gap-2">
                        <Link href={`/admin/proposals/${p.id}`} className="hover:underline">{p.number} · {p.title}</Link>
                        <span className="flex items-center gap-2"><span className="tabular text-muted-foreground">{formatMoney(p.total_cents, currency)}</span><StatusBadge status={p.status} map={PROPOSAL_STATUSES} /></span>
                      </li>
                    ))}
                  </ul>
                ) : <EmptyState compact title="No proposals" />}
              </CardContent>
            </Card>
          ) : null}
          {ctx.can("contracts.view") ? (
            <Card>
              <CardHeader><CardTitle>Contracts</CardTitle></CardHeader>
              <CardContent>
                {contracts.data?.length ? (
                  <ul className="grid gap-2 text-[13px]">
                    {contracts.data.map((c) => (
                      <li key={c.id} className="flex items-center justify-between gap-2">
                        <Link href={`/admin/contracts/${c.id}`} className="hover:underline">{c.title}</Link>
                        <StatusBadge status={c.status} map={CONTRACT_STATUSES} />
                      </li>
                    ))}
                  </ul>
                ) : <EmptyState compact title="No contracts" />}
              </CardContent>
            </Card>
          ) : null}
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Files</CardTitle></CardHeader>
            <CardContent>
              {files.data?.length ? (
                <ul className="divide-y text-[13px]">
                  {files.data.map((f) => (
                    <li key={f.id} className="flex items-center gap-3 py-2">
                      <a href={`/api/files/${f.id}`} className="flex-1 truncate hover:underline">{f.name}</a>
                      <Badge variant={f.visibility === "client" ? "info" : "neutral"}>{f.visibility === "client" ? "Shared" : "Internal"}</Badge>
                      <span className="w-16 text-right text-muted-foreground">{formatBytes(f.size_bytes)}</span>
                      <span className="w-24 text-right text-muted-foreground">{formatDate(f.created_at)}</span>
                    </li>
                  ))}
                </ul>
              ) : <EmptyState compact title="No files" description="Files uploaded to this client's projects appear here." />}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {tab === "messages" ? (
        <Card>
          <CardContent className="pt-4">
            {conversations.data?.length ? (
              <ul className="divide-y text-[13.5px]">
                {conversations.data.map((c) => (
                  <li key={c.id} className="flex items-center justify-between py-2.5">
                    <Link href={`/admin/messages?c=${c.id}`} className="font-medium hover:underline">{c.subject}</Link>
                    <span className="text-[12px] text-muted-foreground">{c.last_message_at ? formatRelative(c.last_message_at) : "No messages yet"}</span>
                  </li>
                ))}
              </ul>
            ) : <EmptyState compact title="No conversations" />}
          </CardContent>
        </Card>
      ) : null}

      {tab === "activity" ? (
        <Card>
          <CardContent className="pt-5">
            <ActivityFeed items={(activity.data ?? []).map((a) => ({ id: a.id, description: a.description, created_at: a.created_at, actor: a.actor?.full_name }))} />
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}
