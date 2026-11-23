import "server-only";
import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { ActionError } from "@/lib/action";

export const BUCKETS = { project: "project-files", finance: "finance-files", public: "public-assets" } as const;
export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS];

/** Mirrors the bucket configuration in the storage migration (defence in depth). */
export const UPLOAD_RULES: Record<BucketName, { maxBytes: number; mimes: string[] }> = {
  "project-files": {
    maxBytes: 50 * 1024 * 1024,
    mimes: [
      "image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml", "application/pdf", "application/zip", "application/x-zip-compressed",
      "text/plain", "text/csv", "text/markdown", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation", "video/mp4", "video/quicktime", "application/json", "application/figma",
    ],
  },
  "finance-files": { maxBytes: 20 * 1024 * 1024, mimes: ["image/png", "image/jpeg", "image/webp", "application/pdf"] },
  "public-assets": { maxBytes: 5 * 1024 * 1024, mimes: ["image/png", "image/jpeg", "image/webp", "image/svg+xml", "image/gif"] },
};

export function safeFileName(name: string) {
  const cleaned = name.normalize("NFKD").replace(/[^\w.\- ]+/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(-120);
  return cleaned || "file";
}

export function assertUploadAllowed(bucket: BucketName, mime: string, size: number) {
  const rule = UPLOAD_RULES[bucket];
  if (!rule.mimes.includes(mime)) throw new ActionError(`Files of type "${mime || "unknown"}" aren't allowed here.`);
  if (!Number.isFinite(size) || size <= 0) throw new ActionError("The file is empty.");
  if (size > rule.maxBytes) throw new ActionError(`Files must be smaller than ${Math.round(rule.maxBytes / 1024 / 1024)} MB.`);
}

/** Issues a one-time signed upload URL. Call only after the caller's access has been verified. */
export async function createSignedUpload(bucket: BucketName, prefix: string, fileName: string) {
  const path = `${prefix}/${randomUUID()}-${safeFileName(fileName)}`;
  const { data, error } = await createAdminClient().storage.from(bucket).createSignedUploadUrl(path);
  if (error || !data) throw new ActionError("Couldn't prepare the upload. Please try again.");
  return { bucket, path: data.path, token: data.token };
}

/** Confirms the object really exists (and its real size/type) before metadata is recorded. */
export async function verifyUploadedObject(bucket: BucketName, path: string) {
  const admin = createAdminClient();
  const folder = path.split("/").slice(0, -1).join("/");
  const name = path.split("/").pop()!;
  const { data } = await admin.storage.from(bucket).list(folder, { search: name, limit: 1 });
  const obj = data?.find((o) => o.name === name);
  if (!obj) throw new ActionError("Upload not found. Please try again.");
  const meta = (obj.metadata ?? {}) as { size?: number; mimetype?: string };
  return { size: Number(meta.size ?? 0), mime: String(meta.mimetype ?? "application/octet-stream") };
}

export async function createSignedDownload(bucket: string, path: string, fileName: string, seconds = 60) {
  const { data, error } = await createAdminClient().storage.from(bucket).createSignedUrl(path, seconds, { download: fileName });
  if (error || !data) throw new Error("Could not sign download URL");
  return data.signedUrl;
}
