import { NextResponse, type NextRequest } from "next/server";
import { getTeamContext } from "@/lib/auth/session";
import { buildDataset, toCsv } from "@/features/reports/datasets";
import { resolveRange } from "@/features/reports/queries";
import { getCurrency } from "@/features/settings/queries";

/** CSV export of any report the caller is permitted to see. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ report: string }> }) {
  const ctx = await getTeamContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { report } = await params;
  const sp = request.nextUrl.searchParams;
  const range = resolveRange({ from: sp.get("from") ?? undefined, to: sp.get("to") ?? undefined, preset: sp.get("preset") ?? undefined });
  const currency = await getCurrency(ctx.organizationId);
  const ds = await buildDataset(report, ctx, range, currency);
  if (!ds) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return new NextResponse(`﻿${toCsv(ds, currency)}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${report}-${range.from}-to-${range.to}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
