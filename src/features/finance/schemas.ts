import { z } from "zod";
import { isoDate, moneyInput, optionalDate, optionalText, optionalUuid, percentInput, quantityInput, requiredText } from "@/lib/validations/common";
import { parseToMinor } from "@/lib/finance/money";

export const lineItemSchema = (currency: string) =>
  z.object({
    service_id: optionalUuid,
    description: requiredText("Description", 500),
    details: optionalText(2000),
    quantity: quantityInput,
    unit_price: moneyInput(currency),
  });

/** Discount: percent input -> basis points; fixed input -> minor units. */
const discountFields = (currency: string) => ({
  discount_type: z.enum(["none", "percent", "fixed"]).default("none"),
  discount_value: z.union([z.string(), z.number()]).optional().default("0"),
  tax_rate: percentInput,
  _currency: z.literal(currency).optional(),
});

export function normaliseDiscount(type: "none" | "percent" | "fixed", raw: string | number | undefined, currency: string): number {
  const v = String(raw ?? "").trim() || "0";
  if (type === "percent") {
    const bps = Math.round(Number(v) * 100);
    if (!Number.isFinite(bps) || bps < 0 || bps > 10000) throw new Error("Discount must be between 0 and 100%");
    return bps;
  }
  if (type === "fixed") return Number(parseToMinor(v, currency));
  return 0;
}

export const proposalSchema = (currency: string) =>
  z
    .object({
      client_id: optionalUuid,
      lead_id: optionalUuid,
      title: requiredText("Title", 200),
      summary: optionalText(10000),
      scope: optionalText(20000),
      timeline: optionalText(2000),
      payment_terms: optionalText(2000),
      valid_until: optionalDate,
      items: z.array(lineItemSchema(currency)).min(1, "Add at least one line item").max(100),
      ...discountFields(currency),
    })
    .refine((v) => v.client_id || v.lead_id, { message: "Choose a client or a lead", path: ["client_id"] });
export type ProposalInput = z.input<ReturnType<typeof proposalSchema>>;

export const invoiceSchema = (currency: string) =>
  z
    .object({
      client_id: z.uuid({ message: "Choose a client" }),
      project_id: optionalUuid,
      issue_date: isoDate,
      due_date: isoDate,
      payment_terms: optionalText(2000),
      notes: optionalText(5000),
      items: z.array(lineItemSchema(currency)).min(1, "Add at least one line item").max(100),
      ...discountFields(currency),
    })
    .refine((v) => v.due_date >= v.issue_date, { message: "Due date must be on or after the issue date", path: ["due_date"] });
export type InvoiceInput = z.input<ReturnType<typeof invoiceSchema>>;

export const paymentSchema = (currency: string) =>
  z.object({
    invoice_id: z.uuid(),
    amount: moneyInput(currency, { min: 1 }),
    payment_date: isoDate,
    method: z.enum(["bank_transfer", "card", "cash", "cheque", "upi", "paypal", "stripe", "other"]),
    reference: optionalText(200),
    notes: optionalText(2000),
    idempotency_key: z.string().min(8).max(100),
  });
export type PaymentInput = z.input<ReturnType<typeof paymentSchema>>;

export const expenseSchema = (currency: string) =>
  z.object({
    category: z.enum(["software", "hardware", "contractor", "marketing", "office", "travel", "hosting", "fees", "taxes", "other"]),
    description: requiredText("Description", 500),
    amount: moneyInput(currency, { min: 1 }),
    expense_date: isoDate,
    vendor: optionalText(200),
    project_id: optionalUuid,
    receipt_file_id: optionalUuid,
  });
export type ExpenseInput = z.input<ReturnType<typeof expenseSchema>>;

export const contractSchema = (currency: string) =>
  z.object({
    client_id: z.uuid({ message: "Choose a client" }),
    project_id: optionalUuid,
    title: requiredText("Title", 200),
    description: optionalText(5000),
    status: z.enum(["draft", "sent", "signed", "active", "expired", "terminated"]).default("draft"),
    value: z.preprocess((v) => (v === "" ? null : v), moneyInput(currency).nullable().optional()),
    start_date: optionalDate,
    end_date: optionalDate,
    signed_by_name: optionalText(200),
    signed_at: optionalDate,
    notes: optionalText(5000),
  });
export type ContractInput = z.input<ReturnType<typeof contractSchema>>;
