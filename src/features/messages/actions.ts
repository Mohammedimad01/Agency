"use server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ActionError, dbError, parseInput, publicAction, teamAction, clientAction } from "@/lib/action";
import { getUser } from "@/lib/auth/session";

export interface ChatMessage {
  id: string;
  body: string;
  created_at: string;
  author_id: string | null;
  author_name: string;
  is_mine: boolean;
  attachments: { id: string; name: string }[];
}

/** Works for team members and clients alike: RLS decides which conversations are readable. */
export async function listMessages(conversationId: string): Promise<ChatMessage[]> {
  const user = await getUser();
  if (!user || !/^[0-9a-f-]{36}$/i.test(conversationId)) return [];
  const sb = await createClient();
  const { data } = await sb
    .from("messages")
    .select("id, body, created_at, author_id, author:profiles!messages_author_id_fkey(full_name, email), message_attachments(file_id, files(id, name))")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(300);
  await sb.from("conversation_reads").upsert({ conversation_id: conversationId, profile_id: user.id, last_read_at: new Date().toISOString() });
  return (data ?? []).map((m) => ({
    id: m.id,
    body: m.body,
    created_at: m.created_at,
    author_id: m.author_id,
    author_name: m.author?.full_name ?? (m.author_id === user.id ? "You" : "Team member"),
    is_mine: m.author_id === user.id,
    attachments: (m.message_attachments ?? []).map((a) => ({ id: a.file_id, name: a.files?.name ?? "Attachment" })),
  }));
}

const sendSchema = z.object({ conversationId: z.uuid(), body: z.string().trim().min(1, "Write a message").max(20000), fileIds: z.array(z.uuid()).max(10).default([]) });

export async function sendMessage(input: z.input<typeof sendSchema>) {
  return publicAction(async () => {
    const d = parseInput(sendSchema, input);
    const user = await getUser();
    if (!user) throw new ActionError("Your session has expired.");
    const sb = await createClient();
    const { data, error } = await sb
      .from("messages")
      .insert({ conversation_id: d.conversationId, body: d.body, author_id: user.id, organization_id: "00000000-0000-0000-0000-000000000000" })
      .select("id")
      .single();
    if (error) dbError(error);
    if (d.fileIds.length) {
      // Only files the author can already see may be attached (checked via RLS / portal view).
      const [{ data: teamFiles }, { data: portalFiles }] = await Promise.all([
        sb.from("files").select("id").in("id", d.fileIds),
        sb.from("portal_files").select("id").in("id", d.fileIds),
      ]);
      const allowed = new Set([...(teamFiles ?? []).map((f) => f.id), ...(portalFiles ?? []).map((f) => f.id!)]);
      const rows = d.fileIds.filter((id) => allowed.has(id)).map((file_id) => ({ message_id: data.id, file_id }));
      if (rows.length) {
        const { error: aErr } = await createAdminClient().from("message_attachments").insert(rows);
        if (aErr) dbError(aErr);
      }
    }
    return { id: data.id };
  });
}

export async function startConversation(input: { clientId: string; projectId?: string | null; subject: string; internal?: boolean }) {
  return teamAction(null, async (ctx) => {
    const d = parseInput(z.object({ clientId: z.uuid(), projectId: z.uuid().nullable().optional(), subject: z.string().trim().min(2).max(200), internal: z.boolean().default(false) }), input);
    const sb = await createClient();
    const { data, error } = await sb
      .from("conversations")
      .insert({ organization_id: ctx.organizationId, client_id: d.clientId, project_id: d.projectId ?? null, subject: d.subject, is_internal: d.internal, created_by: ctx.userId })
      .select("id")
      .single();
    if (error) dbError(error);
    return { id: data.id };
  }, "Conversation started");
}

export async function portalStartConversation(input: { subject: string; projectId?: string | null }) {
  return clientAction(async (ctx) => {
    const d = parseInput(z.object({ subject: z.string().trim().min(2, "Add a subject").max(200), projectId: z.uuid().nullable().optional() }), input);
    const sb = await createClient();
    let clientId = ctx.clientIds[0]!;
    if (d.projectId) {
      const { data: p } = await sb.from("portal_projects").select("client_id").eq("id", d.projectId).maybeSingle();
      if (!p) throw new ActionError("Project not found.");
      clientId = p.client_id!;
    }
    const org = ctx.clients.find((c) => c.id === clientId)!.organization_id;
    const { data, error } = await sb
      .from("conversations")
      .insert({ organization_id: org, client_id: clientId, project_id: d.projectId ?? null, subject: d.subject, is_internal: false, created_by: ctx.userId })
      .select("id")
      .single();
    if (error) dbError(error);
    return { id: data.id };
  }, "Conversation started");
}
