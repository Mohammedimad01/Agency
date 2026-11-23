"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Paperclip, Send, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/ui/avatar";
import { getBrowserClient } from "@/lib/supabase/client";
import { listMessages, sendMessage, type ChatMessage } from "../actions";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

type Target = { bucket: string; path: string; token: string };
type Res<T> = { ok: true; data: T } | { ok: false; error: string };

/**
 * Realtime conversation thread. Live updates arrive through Supabase Realtime
 * (RLS-filtered), and each change triggers a refetch through the server.
 */
export function Conversation({
  conversationId,
  emptyHint = "No messages yet. Say hello 👋",
  upload,
  className,
}: {
  conversationId: string;
  emptyHint?: string;
  upload?: { createTarget: (f: { name: string; size: number; mime: string }) => Promise<Res<Target>>; register: (t: Target, f: File) => Promise<Res<{ id: string | null } | null>> };
  className?: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [files, setFiles] = useState<{ id: string; name: string }[]>([]);
  const bottom = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setMessages(await listMessages(conversationId));
    setLoaded(true);
  }, [conversationId]);

  useEffect(() => {
    let active = true;
    listMessages(conversationId).then((m) => {
      if (!active) return;
      setMessages(m);
      setLoaded(true);
    });
    const sb = getBrowserClient();
    const ch = sb
      .channel(`conversation:${conversationId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` }, () => void load())
      .subscribe();
    return () => {
      active = false;
      void sb.removeChannel(ch);
    };
  }, [conversationId, load]);

  useEffect(() => {
    void bottom.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function attach(list: FileList | null) {
    if (!list || !upload) return;
    for (const file of Array.from(list)) {
      const t = await upload.createTarget({ name: file.name, size: file.size, mime: file.type || "application/octet-stream" });
      if (!t.ok) {
        toast.error(t.error);
        continue;
      }
      const { error } = await getBrowserClient().storage.from(t.data.bucket).uploadToSignedUrl(t.data.path, t.data.token, file, { contentType: file.type });
      if (error) {
        toast.error("Upload failed");
        continue;
      }
      const r = await upload.register(t.data, file);
      if (r.ok && r.data?.id) setFiles((f) => [...f, { id: r.data!.id!, name: file.name }]);
      else if (!r.ok) toast.error(r.error);
    }
    if (fileInput.current) fileInput.current.value = "";
  }

  async function send() {
    if (!body.trim()) return;
    setSending(true);
    const r = await sendMessage({ conversationId, body, fileIds: files.map((f) => f.id) });
    setSending(false);
    if (!r.ok) return toast.error(r.error);
    setBody("");
    setFiles([]);
    void load();
  }

  return (
    <div className={cn("flex min-h-[420px] flex-col", className)}>
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {loaded && messages.length === 0 ? <p className="py-16 text-center text-sm text-muted-foreground">{emptyHint}</p> : null}
        {messages.map((m) => (
          <div key={m.id} className={cn("flex gap-2.5", m.is_mine && "flex-row-reverse")}>
            <UserAvatar name={m.author_name} className="size-7" />
            <div className={cn("max-w-[78%]", m.is_mine && "text-right")}>
              <p className="mb-1 text-[11.5px] text-muted-foreground">
                {m.is_mine ? "You" : m.author_name} · {formatDateTime(m.created_at)}
              </p>
              <div className={cn("inline-block whitespace-pre-wrap rounded-lg px-3 py-2 text-left text-[13.5px]", m.is_mine ? "bg-primary text-primary-foreground" : "bg-muted")}>{m.body}</div>
              {m.attachments.length ? (
                <div className={cn("mt-1 flex flex-wrap gap-1.5", m.is_mine && "justify-end")}>
                  {m.attachments.map((a) => (
                    <a key={a.id} href={`/api/files/${a.id}`} className="inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[12px] hover:bg-accent">
                      <Paperclip className="size-3" />
                      {a.name}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ))}
        <div ref={bottom} />
      </div>
      <div className="border-t p-3">
        {files.length ? (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {files.map((f) => (
              <span key={f.id} className="inline-flex items-center gap-1 rounded border bg-muted/50 px-2 py-0.5 text-[12px]">
                {f.name}
                <button type="button" onClick={() => setFiles((x) => x.filter((y) => y.id !== f.id))} aria-label={`Remove ${f.name}`}>
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        ) : null}
        <div className="flex items-end gap-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void send();
            }}
            placeholder="Write a message… (⌘/Ctrl + Enter to send)"
            rows={2}
            className="min-h-0 resize-none"
            aria-label="Message"
          />
          {upload ? (
            <>
              <Button type="button" variant="outline" size="icon" onClick={() => fileInput.current?.click()} aria-label="Attach files">
                <Paperclip />
              </Button>
              <input ref={fileInput} type="file" multiple className="sr-only" onChange={(e) => attach(e.target.files)} />
            </>
          ) : null}
          <Button type="button" size="icon" onClick={send} disabled={sending || !body.trim()} aria-label="Send message">
            <Send />
          </Button>
        </div>
      </div>
    </div>
  );
}
