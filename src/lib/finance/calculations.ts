/**
 * Document totals. This is a faithful TypeScript mirror of the PostgreSQL
 * functions calc_line_amount / calc_discount_cents / calc_tax_cents
 * (supabase/migrations/..._finance.sql). The database is the source of truth;
 * this module powers live previews and is covered by unit tests that pin
 * both implementations to the same rounding rules (half away from zero).
 */
export type DiscountType = "none" | "percent" | "fixed";

export interface LineInput {
  quantity: string | number; // up to 2 decimals
  unitPriceCents: number | bigint;
}

export interface Totals {
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
}

/** round(a / b) for a >= 0, b > 0, half away from zero */
function roundDiv(a: bigint, b: bigint): bigint {
  if (a < 0n) return -roundDiv(-a, b);
  return (2n * a + b) / (2n * b);
}

/** quantity "1.5" -> 150n hundredths */
export function quantityToHundredths(quantity: string | number): bigint {
  const raw = String(quantity).trim();
  if (!/^\d+(\.\d+)?$/.test(raw)) throw new Error(`Invalid quantity: "${quantity}"`);
  const [i = "0", f = ""] = raw.split(".");
  const padded = (f + "000").slice(0, 3);
  let hundredths = BigInt(i + padded.slice(0, 2));
  if (Number(padded[2]) >= 5) hundredths += 1n; // numeric(12,2) rounding
  return hundredths;
}

export function calcLineAmount(quantity: string | number, unitPriceCents: number | bigint): number {
  const q = quantityToHundredths(quantity);
  return Number(roundDiv(q * BigInt(unitPriceCents), 100n));
}

export function calcDiscount(subtotalCents: number, type: DiscountType, value: number): number {
  const subtotal = BigInt(subtotalCents);
  const v = BigInt(Math.max(0, Math.trunc(value)));
  if (type === "percent") {
    const bps = v > 10000n ? 10000n : v;
    const d = roundDiv(subtotal * bps, 10000n);
    return Number(d > subtotal ? subtotal : d);
  }
  if (type === "fixed") return Number(v > subtotal ? subtotal : v);
  return 0;
}

export function calcTax(taxableCents: number, taxRateBps: number): number {
  const taxable = BigInt(Math.max(0, taxableCents));
  return Number(roundDiv(taxable * BigInt(Math.max(0, Math.trunc(taxRateBps))), 10000n));
}

export function calcTotals(lines: LineInput[], discountType: DiscountType, discountValue: number, taxRateBps: number): Totals {
  const subtotalCents = lines.reduce((sum, l) => sum + calcLineAmount(l.quantity, l.unitPriceCents), 0);
  const discountCents = calcDiscount(subtotalCents, discountType, discountValue);
  const taxCents = calcTax(subtotalCents - discountCents, taxRateBps);
  return { subtotalCents, discountCents, taxCents, totalCents: subtotalCents - discountCents + taxCents };
}

/** Percent string ("7.5") -> basis points (750) */
export function percentToBps(percent: string | number): number {
  const raw = String(percent).trim();
  if (raw === "") return 0;
  if (!/^\d+(\.\d{1,2})?$/.test(raw)) throw new Error(`Invalid percentage: "${percent}"`);
  const [i = "0", f = ""] = raw.split(".");
  return Number(i) * 100 + Number((f + "00").slice(0, 2));
}

export function bpsToPercent(bps: number): string {
  const whole = Math.trunc(bps / 100);
  const frac = bps % 100;
  return frac === 0 ? String(whole) : `${whole}.${String(frac).padStart(2, "0").replace(/0$/, "")}`;
}
