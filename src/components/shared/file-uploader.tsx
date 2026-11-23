"use client";
import { useRef, useState } from "react";
import { Upload, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { getBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Target = { bucket: string; path: string; token: string };
type Result<T> = { ok: true; data: T } | { ok: false; error: string };

/**
 * Two-step secure upload: the server authorises and signs an upload URL, the
 * browser uploads directly to Storage, then the server verifies and records it.
 */
export function FileUploader({
  createTarget,
  register,
  onComplete,
  accept,
  multiple = true,
  label = "Drop files here or click to upload",
  hint,
  compact,
}: {
  createTarget: (file: { name: string; size: number; mime: string }) => Promise<Result<Target>>;
  register: (target: Target, file: File) => Promise<Result<unknown>>;
  onComplete?: () => void;
  accept?: string;
  multiple?: boolean;
  label?: string;
  hint?: string;
  compact?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    let okCount = 0;
    for (const file of Array.from(files)) {
      const t = await createTarget({ name: file.name, size: file.size, mime: file.type || "application/octet-stream" });
      if (!t.ok) {
        toast.error(`${file.name}: ${t.error}`);
        continue;
      }
      const { error } = await getBrowserClient().storage.from(t.data.bucket).uploadToSignedUrl(t.data.path, t.data.token, file, { contentType: file.type });
      if (error) {
        toast.error(`${file.name}: upload failed`);
        continue;
      }
      const r = await register(t.data, file);
      if (!r.ok) toast.error(`${file.name}: ${r.error}`);
      else okCount++;
    }
    setBusy(false);
    if (input.current) input.current.value = "";
    if (okCount) {
      toast.success(okCount === 1 ? "File uploaded" : `${okCount} files uploaded`);
      onComplete?.();
    }
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        void upload(e.dataTransfer.files);
      }}
      className={cn("rounded-lg border border-dashed transition-colors", over && "border-primary bg-primary/[0.04]", compact ? "p-3" : "p-6")}
    >
      <button type="button" disabled={busy} onClick={() => input.current?.click()} className="flex w-full flex-col items-center gap-1.5 text-center disabled:opacity-60">
        {busy ? <LoaderCircle className="size-5 animate-spin text-muted-foreground" /> : <Upload className="size-5 text-muted-foreground" />}
        <span className="text-[13px] font-medium">{busy ? "Uploading…" : label}</span>
        {hint ? <span className="text-[12px] text-muted-foreground">{hint}</span> : null}
      </button>
      <input ref={input} type="file" className="sr-only" accept={accept} multiple={multiple} onChange={(e) => upload(e.target.files)} />
    </div>
  );
}
