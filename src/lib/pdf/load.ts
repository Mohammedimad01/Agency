import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { PdfDoc } from "./document";
import { fmtDate } from "./document";

type SB = Awaited<ReturnType<typeof createClient>>;

async function issuer(sb: SB, orgId: string) {
  const { data: team } = await sb.from("settings").select("*, organizations(name)").eq("organization_id", orgId).maybeSingle();
  if (team) {
    return {
      name: team.company_legal_name || team.organizations?.name || "",
      lines: [team.company_address, team.company_email, team.company_phone],
      taxId: team.tax_id,
      paymentInstructions: team.payment_instructions,
      footer: team.invoice_footer,
    };
  }
  const { data: a } = await sb.from("portal_agency").select("*").eq("organization_id", orgId).maybeSingle();
  return {
    name: a?.company_legal_name || a?.name || "",
    lines: [a?.company_address, a?.company_email, a?.company_phone],
    taxId: a?.tax_id,
    paymentInstructions: a?.payment_instructions,
    footer: null,
  };
}

function recipientOf(c: { name: string | null; company_name?: string | null; email?: unknown; address_line1?: string | null; city?: string | null; country?: string | null; tax_id?: string | null } | null) {
  if (!c) return { name: "", lines: [] };
  return {
    name: c.company_name || c.name || "",
    lines: [c.company_name && c.name !== c.company_name ? c.name : null, c.address_line1, [c.city, c.country].filter(Boolean).join(", "), c.email ? String(c.email) : null, c.tax_id ? `Tax ID: ${c.tax_id}` : null],
  };
}

/** Loads an invoice for PDF rendering. Team access via RLS; client access via portal views. Returns null if not visible. */
export async function loadInvoicePdf(id: string): Promise<PdfDoc | null> {
  const sb = await createClient();
  const { data: inv } = await sb.from("invoices").select("*, invoice_items(*), client:clients(*)").eq("id", id).is("deleted_at", null).maybeSingle();
  if (inv) {
    const iss = await issuer(sb, inv.organization_id);
    return build(inv, [...inv.invoice_items].sort((a, b) => a.sort_order - b.sort_order), recipientOf(inv.client), iss);
  }
  const { data: p } = await sb.from("portal_invoices").select("*").eq("id", id).maybeSingle();
  if (!p) return null;
  const [{ data: items }, { data: client }] = await Promise.all([
    sb.from("portal_invoice_items").select("*").eq("invoice_id", id).order("sort_order"),
    sb.from("portal_clients").select("*").eq("id", p.client_id!).maybeSingle(),
  ]);
  const iss = await issuer(sb, p.organization_id!);
  return build(p as never, (items ?? []) as never, recipientOf(client as never), iss);

  function build(
    v: { number: string; status: string; currency: string; issue_date: string; due_date: string; payment_terms: string | null; notes: string | null; subtotal_cents: number; discount_cents: number; discount_type: string; discount_value: number; tax_rate_bps: number; tax_cents: number; total_cents: number; amount_paid_cents: number; balance_cents: number | null },
    lines: { description: string; quantity: number; unit_price_cents: number; amount_cents: number }[],
    recipient: { name: string; lines: (string | null | undefined)[] },
    iss: Awaited<ReturnType<typeof issuer>>,
  ): PdfDoc {
    return {
      kind: "Invoice", number: v.number, status: v.status, currency: v.currency, issuer: iss, recipient,
      meta: [{ label: "Issue date", value: fmtDate(v.issue_date) }, { label: "Due date", value: fmtDate(v.due_date) }],
      items: lines.map((l) => ({ ...l, quantity: Number(l.quantity), unit_price_cents: Number(l.unit_price_cents), amount_cents: Number(l.amount_cents) })),
      totals: { ...v, balance_cents: Number(v.balance_cents ?? 0) },
      notes: [v.payment_terms, v.notes],
      paymentInstructions: Number(v.balance_cents ?? 0) > 0 && v.status !== "draft" ? iss.paymentInstructions : null,
      footer: iss.footer,
    };
  }
}

export async function loadProposalPdf(id: string): Promise<PdfDoc | null> {
  const sb = await createClient();
  let p: Record<string, unknown> | null = null;
  let items: { description: string; details: string | null; quantity: number; unit_price_cents: number; amount_cents: number }[] = [];
  let recipient: { name: string; lines: (string | null | undefined)[] } = { name: "", lines: [] };
  const { data: team } = await sb.from("proposals").select("*, proposal_items(*), client:clients(*), lead:leads(full_name, company, email)").eq("id", id).is("deleted_at", null).maybeSingle();
  if (team) {
    p = team;
    items = [...team.proposal_items].sort((a, b) => a.sort_order - b.sort_order);
    recipient = team.client ? recipientOf(team.client) : { name: team.lead?.company ?? team.lead?.full_name ?? "", lines: [team.lead?.company ? team.lead.full_name : null, team.lead?.email ? String(team.lead.email) : null] };
  } else {
    const { data: portal } = await sb.from("portal_proposals").select("*").eq("id", id).maybeSingle();
    if (!portal) return null;
    p = portal;
    const [{ data: its }, { data: client }] = await Promise.all([
      sb.from("portal_proposal_items").select("*").eq("proposal_id", id).order("sort_order"),
      sb.from("portal_clients").select("*").eq("id", portal.client_id!).maybeSingle(),
    ]);
    items = (its ?? []) as never;
    recipient = recipientOf(client as never);
  }
  const v = p as { organization_id: string; number: string; status: string; currency: string; title: string; summary: string | null; scope: string | null; timeline: string | null; payment_terms: string | null; valid_until: string | null; created_at: string; subtotal_cents: number; discount_cents: number; discount_type: string; discount_value: number; tax_rate_bps: number; tax_cents: number; total_cents: number };
  const iss = await issuer(sb, v.organization_id);
  return {
    kind: "Proposal", number: v.number, status: v.status, currency: v.currency, issuer: iss, recipient, title: v.title,
    meta: [{ label: "Date", value: fmtDate(v.created_at) }, { label: "Valid until", value: fmtDate(v.valid_until) }],
    sections: [
      { heading: "Summary", body: v.summary ?? "" },
      { heading: "Scope of work", body: v.scope ?? "" },
      { heading: "Timeline", body: v.timeline ?? "" },
      { heading: "Payment terms", body: v.payment_terms ?? "" },
    ],
    items: items.map((l) => ({ ...l, quantity: Number(l.quantity), unit_price_cents: Number(l.unit_price_cents), amount_cents: Number(l.amount_cents) })),
    totals: v,
    footer: iss.footer,
  };
}
