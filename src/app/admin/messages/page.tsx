import Link from "next/link";
import { Lock, MessagesSquare } from "lucide-react";
import { requireTeam } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { FormDialog } from "@/components/shared/form-dialog";
import { Button } from "@/components/ui/button";
import { Conversation } from "@/features/messages/components/conversation";
import { NewConversationForm } from "@/features/messages/components/new-conversation";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata = { title: "Messages" };

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const ctx = await requireTeam();
  const { c } = await searchParams;
  const sb = await createClient();
  const [{ data: conversations }, { data: reads }, { data: clients }, { data: projects }] = await Promise.all([
    sb.from("conversations").select("id, subject, is_internal, last_message_at, client:clients(name), project:projects(name, code)").order("last_message_at", { ascending: false, nullsFirst: false }).limit(100),
    sb.from("conversation_reads").select("conversation_id, last_read_at").eq("profile_id", ctx.userId),
    sb.from("clients").select("id, name").is("deleted_at", null).order("name"),
    sb.from("projects").select("id, name, client_id").is("deleted_at", null).order("name"),
  ]);
  const readMap = new Map((reads ?? []).map((r) => [r.conversation_id, r.last_read_at]));
  const active = conversations?.find((x) => x.id === c) ?? conversations?.[0];
  return (
    <>
      <PageHeader
        title="Messages"
        description="Client conversations and internal threads. New messages arrive in real time."
        actions={
          <FormDialog title="New conversation" trigger={<Button size="sm">New conversation</Button>}>
            <NewConversationForm clients={clients ?? []} projects={projects ?? []} />
          </FormDialog>
        }
      />
      {!conversations?.length ? (
        <EmptyState icon={MessagesSquare} title="No conversations yet" description="Each project gets a discussion thread automatically." />
      ) : (
        <Card className="grid overflow-hidden md:grid-cols-[300px_1fr]">
          <ul className="max-h-[70vh] divide-y overflow-y-auto border-b md:border-b-0 md:border-r">
            {conversations.map((conv) => {
              const unread = conv.last_message_at && (!readMap.get(conv.id) || readMap.get(conv.id)! < conv.last_message_at);
              return (
                <li key={conv.id}>
                  <Link href={`/admin/messages?c=${conv.id}`} className={cn("block px-4 py-3 hover:bg-accent/40", active?.id === conv.id && "bg-accent/60")}>
                    <div className="flex items-center gap-2">
                      {conv.is_internal ? <Lock className="size-3 text-muted-foreground" /> : null}
                      <p className={cn("flex-1 truncate text-[13.5px]", unread ? "font-semibold" : "font-medium")}>{conv.client?.name ?? "Internal"}</p>
                      {unread ? <span className="size-2 rounded-full bg-primary" /> : null}
                    </div>
                    <p className="truncate text-[12.5px] text-muted-foreground">{conv.project?.name ?? conv.subject}</p>
                    <p className="text-[11.5px] text-muted-foreground">{conv.last_message_at ? formatRelative(conv.last_message_at) : "No messages"}</p>
                  </Link>
                </li>
              );
            })}
          </ul>
          {active ? (
            <div className="flex flex-col">
              <div className="border-b px-4 py-3">
                <p className="text-[14px] font-medium">{active.subject}</p>
                <p className="text-[12.5px] text-muted-foreground">
                  {active.client?.name}
                  {active.project ? ` · ${active.project.code}` : ""}
                  {active.is_internal ? " · internal (team only)" : " · visible to client"}
                </p>
              </div>
              <Conversation key={active.id} conversationId={active.id} className="max-h-[62vh]" />
            </div>
          ) : null}
        </Card>
      )}
    </>
  );
}
