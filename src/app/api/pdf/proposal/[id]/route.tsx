import { NextResponse, type NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { BusinessDocument } from "@/lib/pdf/document";
import { loadProposalPdf } from "@/lib/pdf/load";
import { getUser } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await getUser())) return NextResponse.redirect(new URL(`/login?next=/api/pdf/proposal/${id}`, request.url));
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const doc = await loadProposalPdf(id);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const buffer = await renderToBuffer(<BusinessDocument doc={doc} />);
  return new NextResponse(new Uint8Array(buffer), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${doc.number}.pdf"`, "Cache-Control": "private, no-store" },
  });
}
