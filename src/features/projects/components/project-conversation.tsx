"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Conversation } from "@/features/messages/components/conversation";
import { createUploadTarget, registerFile } from "@/features/files/actions";
import { cn } from "@/lib/utils";

export function ProjectConversation({ projectId, conversations }: { projectId: string; conversations: { id: string; subject: string; is_internal: boolean }[] }) {
  const [active, setActive] = useState(conversations[0]?.id);
  const router = useRouter();
  if (!active) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        No conversation yet. <Button variant="link" onClick={() => router.refresh()}>Refresh</Button>
      </Card>
    );
  }
  return (
    <Card className="overflow-hidden">
      {conversations.length > 1 ? (
        <div className="flex gap-1 border-b p-2">
          {conversations.map((c) => (
            <button key={c.id} onClick={() => setActive(c.id)} className={cn("flex items-center gap-1 rounded-md px-2.5 py-1 text-[13px] text-muted-foreground", active === c.id && "bg-accent text-foreground")}>
              {c.is_internal ? <Lock className="size-3" /> : null}
              {c.subject}
            </button>
          ))}
        </div>
      ) : (
        <div className="border-b px-4 py-2.5 text-[13px] text-muted-foreground">Messages here are visible to the client in their portal.</div>
      )}
      <Conversation
        key={active}
        conversationId={active}
        upload={{
          createTarget: (f) => createUploadTarget({ scope: "project", projectId }, f),
          register: async (t, file) => {
            const r = await registerFile({ bucket: t.bucket as "project-files", path: t.path, name: file.name, category: "message", visibility: "client", project_id: projectId });
            return r.ok ? { ok: true as const, data: { id: r.data.id } } : r;
          },
        }}
      />
    </Card>
  );
}
