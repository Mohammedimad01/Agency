import { calcLineAmount } from "@/lib/finance/calculations";

/** Converts validated line items to the RPC payload (amounts are recomputed in the DB). */
export function toItemPayload(items: { service_id?: string | null; description: string; details?: string | null; quantity: string; unit_price: number }[]) {
  return items.map((i) => {
    calcLineAmount(i.quantity, i.unit_price); // throws on invalid input before hitting the DB
    return { service_id: i.service_id ?? "", description: i.description, details: i.details ?? "", quantity: i.quantity, unit_price_cents: i.unit_price };
  });
}
