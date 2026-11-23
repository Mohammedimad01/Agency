import Link from "next/link";
import { CalendarDays, Plus } from "lucide-react";
import { requireTeam } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { FormDialog } from "@/components/shared/form-dialog";
import { Button } from "@/components/ui/button";
import { MeetingForm } from "@/features/leads/components/lead-detail-client";
import { MeetingStatusSelect } from "@/features/leads/components/meeting-status";
import { MEETING_STATUSES } from "@/lib/status";
import { formatDateTime } from "@/lib/format";

export const metadata = { title: "Meetings" };

export default async function MeetingsPage() {
  await requireTeam("leads.view");
  const sb = await createClient();
  const { data } = await sb
    .from("meeting_records")
    .select("*, lead:leads(id, full_name, company), client:clients(id, name)")
    .order("scheduled_at", { ascending: false, nullsFirst: true })
    .limit(200);
  const upcoming = (data ?? []).filter((m) => m.status === "requested" || m.status === "scheduled");
  const past = (data ?? []).filter((m) => m.status === "completed" || m.status === "cancelled");
  return (
    <>
      <PageHeader
        title="Meetings"
        description="Discovery calls requested through the website and meetings your team schedules."
        actions={
          <FormDialog title="Schedule meeting" trigger={<Button size="sm"><Plus /> New meeting</Button>}>
            <MeetingForm />
          </FormDialog>
        }
      />
      {!data?.length ? (
        <EmptyState icon={CalendarDays} title="No meetings yet" description="Booking requests from /book-a-call appear here automatically." />
      ) : (
        <div className="grid gap-6">
          {[{ title: "Requested & upcoming", rows: upcoming }, { title: "Past", rows: past }].map((g) =>
            g.rows.length ? (
              <section key={g.title}>
                <h2 className="mb-2 text-sm font-semibold">{g.title}</h2>
                <ul className="divide-y rounded-lg border bg-card">
                  {g.rows.map((m) => (
                    <li key={m.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-[13.5px]">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{m.title}</p>
                        <p className="text-[12.5px] text-muted-foreground">
                          {m.scheduled_at ? formatDateTime(m.scheduled_at) : "Time to be confirmed"} · {m.duration_minutes ?? 30} min
                          {m.lead ? (
                            <>
                              {" · "}
                              <Link href={`/admin/leads/${m.lead.id}`} className="hover:underline">
                                {m.lead.full_name}
                              </Link>
                            </>
                          ) : null}
                          {m.client ? (
                            <>
                              {" · "}
                              <Link href={`/admin/clients/${m.client.id}`} className="hover:underline">
                                {m.client.name}
                              </Link>
                            </>
                          ) : null}
                        </p>
                        {m.agenda ? <p className="mt-1 line-clamp-1 text-[12.5px] text-muted-foreground">{m.agenda}</p> : null}
                      </div>
                      {m.meeting_url ? (
                        <a href={m.meeting_url} target="_blank" rel="noreferrer" className="text-[12.5px] text-primary hover:underline">
                          Join link
                        </a>
                      ) : null}
                      <StatusBadge status={m.status} map={MEETING_STATUSES} />
                      <MeetingStatusSelect id={m.id} status={m.status} />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null,
          )}
        </div>
      )}
    </>
  );
}
