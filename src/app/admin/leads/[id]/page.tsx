import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarPlus, Mail, Phone, Globe, ExternalLink } from "lucide-react";
import { requireTeam } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/shared/form-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { LeadHeaderActions, NoteComposer, DeleteNoteButton, FollowUpPicker, MeetingForm } from "@/features/leads/components/lead-detail-client";
import { getClientOptions, getCurrency, getServiceOptions, getTeamDirectory, getTemplateOptions } from "@/features/settings/queries";
import { scoreLabel, type CriterionResult } from "@/features/leads/qualification";
import { LEAD_STATUSES, MEETING_STATUSES, PRIORITIES, PROPOSAL_STATUSES } from "@/lib/status";
import { formatDate, formatDateTime, formatMoney, formatRelative } from "@/lib/format";
import { minorToInput } from "@/lib/finance/money";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireTeam();
  const sb = await createClient();
  const { data: lead } = await sb
    .from("leads")
    .select("*, assignee:profiles!leads_assigned_to_fkey(full_name), service:services(name), client:clients!leads_converted_client_id_fkey(id, name)")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!lead) notFound();

  const [currency, services, team, clients, templates, notes, activities, meetings, proposals] = await Promise.all([
    getCurrency(ctx.organizationId),
    getServiceOptions(ctx.organizationId),
    getTeamDirectory(ctx.organizationId),
    ctx.can("clients.view") ? getClientOptions(ctx.organizationId) : Promise.resolve([]),
    getTemplateOptions(ctx.organizationId),
    sb.from("lead_notes").select("id, body, created_at, author_id, author:profiles!lead_notes_author_id_fkey(full_name)").eq("lead_id", id).order("created_at", { ascending: false }),
    sb.from("lead_activities").select("id, type, description, created_at, actor:profiles!lead_activities_actor_id_fkey(full_name)").eq("lead_id", id).order("created_at", { ascending: false }).limit(50),
    sb.from("meeting_records").select("*").eq("lead_id", id).order("scheduled_at", { ascending: false }),
    ctx.can("proposals.view") ? sb.from("proposals").select("id, number, title, status, total_cents").eq("lead_id", id).is("deleted_at", null) : Promise.resolve({ data: [] as never[] }),
  ]);

  const breakdown = ((lead.qualification as { breakdown?: CriterionResult[] } | null)?.breakdown ?? []) as CriterionResult[];
  const score = scoreLabel(lead.qualification_score);
  const teamOptions = team.map((t) => ({ id: t.id, name: t.name }));
  const formValues = {
    id: lead.id, full_name: lead.full_name, company: lead.company ?? "", email: String(lead.email), phone: lead.phone ?? "", website: lead.website ?? "",
    industry: lead.industry ?? "", country: lead.country ?? "", source: lead.source, service_id: lead.service_id ?? "", requested_service: lead.requested_service ?? "",
    budget: minorToInput(lead.budget_cents, currency), timeline: lead.timeline ?? "", description: lead.description ?? "", assigned_to: lead.assigned_to ?? "",
    priority: lead.priority, status: lead.status, follow_up_at: lead.follow_up_at ? lead.follow_up_at.slice(0, 16) : "", internal_notes: lead.internal_notes ?? "",
  };

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Leads", href: "/admin/leads" }, { label: lead.full_name }]}
        title={lead.full_name}
        meta={
          <>
            <StatusBadge status={lead.status} map={LEAD_STATUSES} />
            <StatusBadge status={lead.priority} map={PRIORITIES} dot={false} />
          </>
        }
        description={[lead.company, lead.requested_service ?? lead.service?.name].filter(Boolean).join(" · ") || undefined}
        actions={
          <LeadHeaderActions
            lead={formValues}
            currency={currency}
            services={services.map((s) => ({ id: s.id, name: s.name }))}
            team={teamOptions}
            clients={clients}
            templates={templates}
            canManage={ctx.can("leads.manage")}
            canConvert={ctx.can("leads.manage") && ctx.can("clients.manage")}
            converted={!!lead.converted_client_id}
          />
        }
      />
      {lead.client ? (
        <div className="mb-5 flex items-center justify-between rounded-lg border border-success/30 bg-success/5 px-4 py-3 text-[13.5px]">
          <span>
            Converted to client <strong>{lead.client.name}</strong> on {formatDate(lead.converted_at)}.
          </span>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/admin/clients/${lead.client.id}`}>Open client</Link>
          </Button>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Inquiry</CardTitle>
              <span className="text-[12px] text-muted-foreground">
                {lead.source} · {formatDateTime(lead.created_at)}
              </span>
            </CardHeader>
            <CardContent className="grid gap-4">
              <p className="whitespace-pre-line text-[14px] leading-relaxed">{lead.description || <span className="text-muted-foreground">No description provided.</span>}</p>
              <dl className="grid gap-3 border-t pt-4 text-[13px] sm:grid-cols-3">
                <Info label="Budget" value={lead.budget_cents ? formatMoney(lead.budget_cents, currency) : (lead.budget_range ?? "—")} />
                <Info label="Timeline" value={lead.timeline ?? "—"} />
                <Info label="Industry" value={lead.industry ?? "—"} />
                <Info label="Country" value={lead.country ?? "—"} />
                <Info label="Owner" value={lead.assignee?.full_name ?? "Unassigned"} />
                <Info label="Created" value={formatRelative(lead.created_at)} />
              </dl>
              {lead.internal_notes ? <p className="rounded-md bg-muted/60 p-3 text-[13px] text-muted-foreground">{lead.internal_notes}</p> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes & activity</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5">
              <NoteComposer leadId={lead.id} />
              {notes.data?.length ? (
                <ul className="grid gap-3">
                  {notes.data.map((n) => (
                    <li key={n.id} className="rounded-md border bg-surface p-3">
                      <div className="flex items-center justify-between text-[12px] text-muted-foreground">
                        <span>
                          {n.author?.full_name ?? "Someone"} · {formatRelative(n.created_at)}
                        </span>
                        {n.author_id === ctx.userId || ctx.can("leads.manage") ? <DeleteNoteButton id={n.id} /> : null}
                      </div>
                      <p className="mt-1 whitespace-pre-line text-[13.5px]">{n.body}</p>
                    </li>
                  ))}
                </ul>
              ) : null}
              <div>
                <p className="mb-3 text-[12px] font-medium uppercase tracking-wider text-muted-foreground">History</p>
                <ol className="relative grid gap-3 border-l pl-4">
                  {(activities.data ?? []).map((a) => (
                    <li key={a.id} className="relative text-[13px]">
                      <span className="absolute -left-[21px] top-1.5 size-2 rounded-full border-2 border-background bg-primary/60" />
                      <p>{a.description}</p>
                      <p className="text-[12px] text-muted-foreground">
                        {a.actor?.full_name ?? "System"} · {formatDateTime(a.created_at)}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid content-start gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-[13.5px]">
              <a href={`mailto:${lead.email}`} className="flex items-center gap-2 hover:text-primary">
                <Mail className="size-4 text-muted-foreground" />
                {String(lead.email)}
              </a>
              {lead.phone ? (
                <a href={`tel:${lead.phone}`} className="flex items-center gap-2 hover:text-primary">
                  <Phone className="size-4 text-muted-foreground" />
                  {lead.phone}
                </a>
              ) : null}
              {lead.website ? (
                <a href={lead.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-primary">
                  <Globe className="size-4 text-muted-foreground" />
                  {lead.website.replace(/^https?:\/\//, "")}
                  <ExternalLink className="size-3" />
                </a>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Qualification</CardTitle>
              <Badge variant={score.variant} className="tabular">
                {lead.qualification_score ?? "—"} · {score.label}
              </Badge>
            </CardHeader>
            <CardContent className="grid gap-3">
              {breakdown.length ? (
                breakdown.map((b) => (
                  <div key={b.key}>
                    <div className="flex justify-between text-[12.5px]">
                      <span className="font-medium">{b.label}</span>
                      <span className="text-muted-foreground tabular">
                        {b.points}/{b.max}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${(b.points / b.max) * 100}%` }} />
                    </div>
                    <p className="mt-1 text-[12px] text-muted-foreground">{b.reason}</p>
                  </div>
                ))
              ) : (
                <p className="text-[13px] text-muted-foreground">Not scored yet. Use “Rescore”.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Follow-up</CardTitle>
              {lead.follow_up_at ? <span className="text-[12px] text-muted-foreground">{formatDateTime(lead.follow_up_at)}</span> : null}
            </CardHeader>
            <CardContent>
              <FollowUpPicker leadId={lead.id} value={lead.follow_up_at} />
              <p className="mt-2 text-[12px] text-muted-foreground">The owner gets a reminder notification when it&apos;s due.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Meetings</CardTitle>
              <FormDialog title="Schedule meeting" trigger={<Button variant="ghost" size="icon-sm" aria-label="Schedule meeting"><CalendarPlus /></Button>}>
                <MeetingForm leadId={lead.id} />
              </FormDialog>
            </CardHeader>
            <CardContent>
              {meetings.data?.length ? (
                <ul className="grid gap-2 text-[13px]">
                  {meetings.data.map((m) => (
                    <li key={m.id} className="flex items-center justify-between gap-2">
                      <span className="min-w-0">
                        <span className="block truncate">{m.title}</span>
                        <span className="text-[12px] text-muted-foreground">{m.scheduled_at ? formatDateTime(m.scheduled_at) : "Time not set"}</span>
                      </span>
                      <StatusBadge status={m.status} map={MEETING_STATUSES} />
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState compact title="No meetings" />
              )}
            </CardContent>
          </Card>

          {ctx.can("proposals.view") ? (
            <Card>
              <CardHeader>
                <CardTitle>Proposals</CardTitle>
                {ctx.can("proposals.manage") ? (
                  <Link href={`/admin/proposals/new?lead=${lead.id}`} className="text-[12.5px] text-muted-foreground hover:text-foreground">
                    New →
                  </Link>
                ) : null}
              </CardHeader>
              <CardContent>
                {proposals.data?.length ? (
                  <ul className="grid gap-2 text-[13px]">
                    {proposals.data.map((p) => (
                      <li key={p.id} className="flex items-center justify-between">
                        <Link href={`/admin/proposals/${p.id}`} className="hover:underline">
                          {p.number} · {p.title}
                        </Link>
                        <StatusBadge status={p.status} map={PROPOSAL_STATUSES} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState compact title="No proposals yet" />
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[12px] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}
