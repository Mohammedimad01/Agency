import { format, formatDistanceToNowStrict, isValid, parseISO } from "date-fns";
import { siteConfig } from "@/config/site";
import { fromMinorUnits } from "@/lib/finance/money";

export function formatMoney(cents: number | bigint | null | undefined, currency: string = siteConfig.currency, opts?: { compact?: boolean }) {
  const value = fromMinorUnits(cents ?? 0, currency);
  if (opts?.compact) return compactMoney(value, currency);
  return new Intl.NumberFormat(siteConfig.locale, { style: "currency", currency }).format(value);
}

/** Deterministic compact formatting (identical on server and client, avoiding hydration mismatches). */
function compactMoney(value: number, currency: string) {
  const abs = Math.abs(value);
  const [div, suffix] = abs >= 1e9 ? [1e9, "B"] : abs >= 1e6 ? [1e6, "M"] : abs >= 1e3 ? [1e3, "K"] : [1, ""];
  const scaled = Math.round((abs / div) * 10) / 10;
  const num = (Number.isInteger(scaled) ? scaled.toFixed(0) : scaled.toFixed(1)) + suffix;
  const parts = new Intl.NumberFormat(siteConfig.locale, { style: "currency", currency, maximumFractionDigits: 0 }).formatToParts(0);
  const symbol = parts.find((p) => p.type === "currency")?.value ?? currency;
  const symbolFirst = parts.findIndex((p) => p.type === "currency") < parts.findIndex((p) => p.type === "integer");
  const sign = value < 0 ? "-" : "";
  return symbolFirst ? `${sign}${symbol}${num}` : `${sign}${num} ${symbol}`;
}

function toDate(value: string | Date | null | undefined) {
  if (!value) return null;
  const d = typeof value === "string" ? (value.length === 10 ? parseISO(`${value}T00:00:00`) : parseISO(value)) : value;
  return isValid(d) ? d : null;
}

export function formatDate(value: string | Date | null | undefined, pattern = "d MMM yyyy") {
  const d = toDate(value);
  return d ? format(d, pattern) : "—";
}

export function formatDateTime(value: string | Date | null | undefined) {
  return formatDate(value, "d MMM yyyy, HH:mm");
}

export function formatRelative(value: string | Date | null | undefined) {
  const d = toDate(value);
  return d ? `${formatDistanceToNowStrict(d)} ago` : "—";
}

export function formatPercent(value: number, digits = 0) {
  return `${value.toFixed(digits)}%`;
}

export function todayISO() {
  return format(new Date(), "yyyy-MM-dd");
}

/** ISO date (yyyy-MM-dd) n days from today (server-side helper, keeps render functions pure). */
export function isoDaysFromNow(days: number) {
  return format(new Date(Date.now() + days * 86_400_000), "yyyy-MM-dd");
}
