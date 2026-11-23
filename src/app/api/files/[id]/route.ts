import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSignedDownload } from "@/lib/services/storage";

/**
 * Secure download: the file row must be visible to the caller — via team RLS on
 * `files` or the client's `portal_files` view — before a 60-second signed URL is issued.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const sb = await createClient();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return NextResponse.redirect(new URL(`/login?next=/api/files/${id}`, request.url));

  let found = false;
  const { data: teamFile } = await sb.from("files").select("id").eq("id", id).is("deleted_at", null).maybeSingle();
  if (teamFile) found = true;
  else {
    const { data: portalFile } = await sb.from("portal_files").select("id").eq("id", id).maybeSingle();
    found = Boolean(portalFile);
  }
  if (!found) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: file } = await createAdminClient().from("files").select("bucket, path, name").eq("id", id).single();
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const inline = request.nextUrl.searchParams.get("inline") === "1";
  try {
    const url = await createSignedDownload(file.bucket, file.path, inline ? "" : file.name);
    return NextResponse.redirect(inline ? url.replace(/[?&]download=[^&]*/, "") : url, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "This file is no longer available." }, { status: 410 });
  }
}
