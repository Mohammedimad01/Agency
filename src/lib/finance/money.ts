/**
 * Money utilities. All amounts are integer minor units (e.g. cents).
 * Never use floating point for financial arithmetic; parsing happens on strings
 * and maths happens in BigInt. Numbers are only produced for display.
 */
const MINOR_DIGITS_CACHE = new Map<string, number>();

export function minorDigits(currency: string): number {
  const key = currency.toUpperCase();
  const cached = MINOR_DIGITS_CACHE.get(key);
  if (cached !== undefined) return cached;
  let digits = 2;
  try {
    digits = new Intl.NumberFormat("en", { style: "currency", currency: key }).resolvedOptions().maximumFractionDigits ?? 2;
  } catch {
    digits = 2;
  }
  MINOR_DIGITS_CACHE.set(key, digits);
  return digits;
}

/** "1,234.5" -> 123450n (USD). Throws on invalid input. Rounds half away from zero beyond the currency precision. */
export function parseToMinor(input: string | number, currency = "USD"): bigint {
  const digits = minorDigits(currency);
  const raw = String(input).trim().replace(/[,\s]/g, "");
  if (!/^-?\d*(\.\d*)?$/.test(raw) || raw === "" || raw === "." || raw === "-") {
    throw new Error(`Invalid amount: "${input}"`);
  }
  const negative = raw.startsWith("-");
  const [intPart = "0", fracPart = ""] = raw.replace("-", "").split(".");
  const padded = (fracPart + "0".repeat(digits + 1)).slice(0, digits + 1);
  const base = BigInt((intPart || "0") + padded.slice(0, digits));
  const roundDigit = Number(padded[digits] ?? "0");
  const value = roundDigit >= 5 ? base + 1n : base;
  return negative ? -value : value;
}

export function toMinorUnits(input: string | number, currency = "USD"): number {
  return Number(parseToMinor(input, currency));
}

export function fromMinorUnits(minor: number | bigint, currency = "USD"): number {
  const digits = minorDigits(currency);
  return Number(minor) / 10 ** digits;
}

/** 123450 -> "1234.50" (for form inputs) */
export function minorToInput(minor: number | bigint | null | undefined, currency = "USD"): string {
  if (minor === null || minor === undefined) return "";
  const digits = minorDigits(currency);
  const v = BigInt(minor);
  const neg = v < 0n;
  const abs = neg ? -v : v;
  const s = abs.toString().padStart(digits + 1, "0");
  const out = digits === 0 ? s : `${s.slice(0, -digits)}.${s.slice(-digits)}`;
  return neg ? `-${out}` : out;
}
