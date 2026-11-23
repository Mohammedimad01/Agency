import "server-only";
import { createClient } from "@/lib/supabase/server";
import { minorToInput } from "@/lib/finance/money";
import { bpsToPercent } from "@/lib/finance/calculations";
import type { EditorItem, EditorValues } from "./components/document-editor";

export async function editorOptions(organizationId: string, withLeads: boolean) {
  const sb = await createClient();
  const [clients, services, projects, leads] = await Promise.all([
    sb.from("clients").select("id, name").eq("organization_id", organizationId).is("deleted_at", null).order("name"),
    sb.from("services").select("id, name, starting_price_cents").eq("organization_id", organizationId).eq("is_active", true).order("sort_order"),
    sb.from("projects").select("id, name, client_id").eq("organization_id", organizationId).is("deleted_at", null).order("name"),
    withLeads
      ? sb.from("leads").select("id, full_name, company").eq("organization_id", organizationId).is("deleted_at", null).is("converted_client_id", null).not("status", "in", "(lost,not_qualified,won)").order("full_name")
      : Promise.resolve({ data: [] as { id: string; full_name: string; company: string | null }[] }),
  ]);
  return {
    clients: clients.data ?? [],
    services: services.data ?? [],
    projects: projects.data ?? [],
    leads: (leads.data ?? []).map((l) => ({ id: l.id, name: l.company ? `${l.full_name} (${l.company})` : l.full_name })),
  };
}

export function blankEditor(overrides: Partial<EditorValues> = {}): EditorValues {
  const today = new Date().toISOString().slice(0, 10);
  return {
    client_id: "", lead_id: "", project_id: "", title: "", summary: "", scope: "", timeline: "", payment_terms: "", valid_until: "", issue_date: today,
    due_date: today, notes: "", discount_type: "none", discount_value: "", tax_rate: "0",
    items: [{ service_id: "", description: "", details: "", quantity: "1", unit_price: "" }],
    ...overrides,
  };
}

export function editorFromDocument(
  doc: { discount_type: "none" | "percent" | "fixed"; discount_value: number; tax_rate_bps: number },
  items: { service_id: string | null; description: string; details?: string | null; quantity: number; unit_price_cents: number }[],
  currency: string,
): Pick<EditorValues, "discount_type" | "discount_value" | "tax_rate" | "items"> {
  return {
    discount_type: doc.discount_type,
    discount_value: doc.discount_type === "percent" ? bpsToPercent(doc.discount_value) : doc.discount_type === "fixed" ? minorToInput(doc.discount_value, currency) : "",
    tax_rate: bpsToPercent(doc.tax_rate_bps),
    items: items.map<EditorItem>((i) => ({
      service_id: i.service_id ?? "", description: i.description, details: i.details ?? "", quantity: String(Number(i.quantity)), unit_price: minorToInput(i.unit_price_cents, currency),
    })),
  };
}
