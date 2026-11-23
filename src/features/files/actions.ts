"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ActionError, clientAction, dbError, parseInput, teamAction } from "@/lib/action";
import { BUCKETS, assertUploadAllowed, createSignedUpload, verifyUploadedObject, type BucketName } from "@/lib/services/storage";

const targetSchema = z.discriminatedUnion("scope", [
  z.object({ scope: z.literal("project"), projectId: z.uuid() }),
  z.object({ scope: z.literal("finance"), category: z.enum(["receipt", "contract"]) }),
  z.object({ scope: z.literal("public") }),
]);
export type UploadTarget = z.input<typeof targetSchema>;

const fileMeta = z.object({ name: z.string().min(1).max(255), size: z.number().int().positive(), mime: z.string().max(150) });

/** Team: request a signed upload URL after verifying access to the destination. */
export async function createUploadTarget(target: UploadTarget, file: { name: string; size: number; mime: string }) {
  return teamAction(null, async (ctx) => {
    const t = parseInput(targetSchema, target);
    const f = parseInput(fileMeta, file);
    const sb = await createClient();
    let bucket: BucketName;
    let prefix: string;
    if (t.scope === "project") {
      const { data } = await sb.from("projects").select("id, organization_id").eq("id", t.projectId).maybeSingle();
      if (!data) throw new ActionError("Project not found.");
      bucket = BUCKETS.project;
      prefix = `${data.organization_id}/${data.id}`;
    } else if (t.scope === "finance") {
      if (!ctx.can(t.category === "receipt" ? "finance.manage" : "contracts.manage")) throw new ActionError("You don't have permission to upload here.");
      bucket = BUCKETS.finance;
      prefix = `${ctx.organizationId}/${t.category}s`;
    } else {
      if (!ctx.can("content.manage")) throw new ActionError("You don't have permission to upload here.");
      bucket = BUCKETS.public;
      prefix = `${ctx.organizationId}/site`;
    }
    assertUploadAllowed(bucket, f.mime, f.size);
    return createSignedUpload(bucket, prefix, f.name);
  });
}

const registerSchema = z.object({
  bucket: z.enum([BUCKETS.project, BUCKETS.finance, BUCKETS.public]),
  path: z.string().min(3).max(500),
  name: z.string().min(1).max(255),
  category: z.enum(["attachment", "deliverable", "contract", "receipt", "document", "message", "brief", "proposal"]).default("attachment"),
  visibility: z.enum(["internal", "client"]).default("internal"),
  project_id: z.uuid().nullable().optional(),
  client_id: z.uuid().nullable().optional(),
  task_id: z.uuid().nullable().optional(),
});

/** Team: record metadata for an uploaded object (verifies it exists; RLS checks project access). */
export async function registerFile(input: z.input<typeof registerSchema>) {
  return teamAction(null, async (ctx) => {
    const d = parseInput(registerSchema, input);
    if (!d.path.startsWith(`${ctx.organizationId}/`)) throw new ActionError("Invalid upload path.");
    if (d.bucket === BUCKETS.public) {
      const base = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/$/, "");
      return { id: null, publicUrl: `${base}/storage/v1/object/public/${d.bucket}/${d.path}` };
    }
    const obj = await verifyUploadedObject(d.bucket, d.path);
    const sb = await createClient();
    let clientId = d.client_id ?? null;
    if (d.project_id && !clientId) {
      const { data: p } = await sb.from("projects").select("client_id").eq("id", d.project_id).maybeSingle();
      clientId = p?.client_id ?? null;
    }
    const { data, error } = await sb
      .from("files")
      .insert({
        organization_id: ctx.organizationId, bucket: d.bucket, path: d.path, name: d.name, mime_type: obj.mime, size_bytes: obj.size,
        category: d.category, visibility: d.visibility, project_id: d.project_id ?? null, client_id: clientId, task_id: d.task_id ?? null, uploaded_by: ctx.userId,
      })
      .select("id")
      .single();
    if (error) dbError(error);
    if (d.project_id) revalidatePath(`/admin/projects/${d.project_id}`);
    return { id: data.id, publicUrl: null };
  });
}

export async function setFileVisibility(id: string, visibility: "internal" | "client") {
  return teamAction(null, async () => {
    const sb = await createClient();
    const { data, error } = await sb.from("files").update({ visibility }).eq("id", id).select("id").maybeSingle();
    if (error) dbError(error);
    if (!data) throw new ActionError("You can't change this file.");
    return null;
  }, visibility === "client" ? "Shared with client" : "Made internal");
}

export async function deleteFile(id: string) {
  return teamAction(null, async () => {
    const sb = await createClient();
    const { data, error } = await sb.from("files").update({ deleted_at: new Date().toISOString() }).eq("id", id).select("id").maybeSingle();
    if (error) dbError(error);
    if (!data) throw new ActionError("You can't delete this file.");
    return null;
  }, "File removed");
}

/** Client portal: upload into one of the client's visible projects. */
export async function portalCreateUploadTarget(projectId: string, file: { name: string; size: number; mime: string }) {
  return clientAction(async () => {
    const f = parseInput(fileMeta, file);
    const sb = await createClient();
    const { data: project } = await sb.from("portal_projects").select("id, organization_id").eq("id", projectId).maybeSingle();
    if (!project) throw new ActionError("Project not found.");
    assertUploadAllowed(BUCKETS.project, f.mime, f.size);
    return createSignedUpload(BUCKETS.project, `${project.organization_id}/${project.id}/client`, f.name);
  });
}

export async function portalRegisterFile(input: { path: string; name: string; projectId: string }) {
  return clientAction(async (ctx) => {
    const d = parseInput(z.object({ path: z.string().min(3).max(500), name: z.string().min(1).max(255), projectId: z.uuid() }), input);
    const sb = await createClient();
    const { data: project } = await sb.from("portal_projects").select("id, organization_id, client_id").eq("id", d.projectId).maybeSingle();
    if (!project || !d.path.startsWith(`${project.organization_id}/${project.id}/client/`)) throw new ActionError("Invalid upload.");
    const obj = await verifyUploadedObject(BUCKETS.project, d.path);
    // Client uploads are inserted with the service role (clients have no direct table access); ownership is derived server-side.
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    const { data: inserted, error } = await admin.from("files").insert({
      organization_id: project.organization_id!, bucket: BUCKETS.project, path: d.path, name: d.name, mime_type: obj.mime, size_bytes: obj.size,
      category: "brief", visibility: "client", project_id: project.id!, client_id: project.client_id!, uploaded_by: ctx.userId,
    }).select("id").single();
    if (error) dbError(error);
    await admin.from("activity_logs").insert({
      organization_id: project.organization_id!, actor_id: ctx.userId, entity_type: "file", action: "uploaded", project_id: project.id!, client_id: project.client_id!,
      description: `${ctx.profile.full_name ?? "Client"} uploaded ${d.name}`, is_client_visible: true,
    });
    revalidatePath(`/portal/projects/${project.id}`);
    return { id: inserted.id };
  }, "File uploaded");
}
