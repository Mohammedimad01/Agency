import Link from "next/link";
import { requireClient } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { FormDialog } from "@/components/shared/form-dialog";
import { Button } from "@/components/ui/button";
import { Conversation } from "@/features/messages/components/conversation";
import { PortalNewConversation } from "@/features/portal/components/portal-new-conversation";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata = { title: "Messages" };

export default async function PortalMessages({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  await requireClient();
  const { c } = await searchParams;
  const sb = await createClient();
  const [{ data: conversations }, { data: projects }] = await Promise.all([
    sb.from("conversations").select("id, subject, last_message_at, project_id").order("last_message_at", { ascending: false, nullsFirst: false }),
    sb.from("portal_projects").select("id, name"),
  ]);
  const active = conversations?.find((x) => x.id === c) ?? conversations?.[0];
  const pname = (id: string | null) => projects?.find((p) => p.id === id)?.name;
  return (
    <>
      <PageHeader
        title="Messages"
        description="Talk directly with the team working on your projects."
        actions={
          <FormDialog title="New message" trigger={<Button size="sm">New conversation</Button>}>
            <PortalNewConversation projects={(projects ?? []).map((p) => ({ id: p.id!, name: p.name! }))} />
          </FormDialog>
        }
      />
      <Card className="grid overflow-hidden md:grid-cols-[280px_1fr]">
        <ul className="max-h-[70vh] divide-y overflow-y-auto border-b md:border-b-0 md:border-r">
          {(conversations ?? []).map((conv) => (
            <li key={conv.id}>
              <Link href={`/portal/messages?c=${conv.id}`} className={cn("block px-4 py-3 hover:bg-accent/40", active?.id === conv.id && "bg-accent/60")}>
                <p className="truncate text-[13.5px] font-medium">{pname(conv.project_id) ?? conv.subject}</p>
                <p className="truncate text-[12.5px] text-muted-foreground">{conv.subject}</p>
                <p className="text-[11.5px] text-muted-foreground">{conv.last_message_at ? formatRelative(conv.last_message_at) : "No messages yet"}</p>
              </Link>
            </li>
          ))}
        </ul>
        {active ? <Conversation key={active.id} conversationId={active.id} className="max-h-[70vh]" emptyHint="Send the first message — the team is notified immediately." /> : <p className="p-10 text-center text-sm text-muted-foreground">Start a conversation with the team.</p>}
      </Card>
    </>
  );
}
