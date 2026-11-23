import { z } from "zod";
import { parseToMinor } from "@/lib/finance/money";
import { percentToBps } from "@/lib/finance/calculations";

export const uuid = z.uuid({ message: "Invalid identifier" });
export const optionalUuid = z.preprocess((v) => (v === "" || v === "none" ? null : v), z.uuid().nullable().optional());

/** Trimmed text; empty strings become null. */
export const optionalText = (max = 5000) =>
  z.preprocess((v) => (typeof v === "string" ? (v.trim() === "" ? null : v.trim()) : v), z.string().max(max).nullable().optional());

export const requiredText = (label: string, max = 200) =>
  z.string({ message: `${label} is required` }).trim().min(1, `${label} is required`).max(max, `${label} is too long`);

export const email = z.string().trim().toLowerCase().pipe(z.email({ message: "Enter a valid email address" }));
export const optionalEmail = z.preprocess((v) => (v === "" ? null : v), email.nullable().optional());

export const optionalUrl = z.preprocess(
  (v) => {
    if (typeof v !== "string" || v.trim() === "") return null;
    const s = v.trim();
    return /^https?:\/\//i.test(s) ? s : `https://${s}`;
  },
  z.url({ message: "Enter a valid URL" }).nullable().optional(),
);

export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date");
export const optionalDate = z.preprocess((v) => (v === "" ? null : v), isoDate.nullable().optional());

/** Money typed by a person ("1,250.00") -> integer minor units. */
export const moneyInput = (currency = "USD", { min = 0 }: { min?: number } = {}) =>
  z
    .union([z.string(), z.number()])
    .transform((v, ctx) => {
      try {
        const minor = Number(parseToMinor(v, currency));
        if (minor < min) {
          ctx.addIssue({ code: "custom", message: min > 0 ? "Amount must be greater than zero" : "Amount cannot be negative" });
          return z.NEVER;
        }
        if (!Number.isSafeInteger(minor)) {
          ctx.addIssue({ code: "custom", message: "Amount is too large" });
          return z.NEVER;
        }
        return minor;
      } catch {
        ctx.addIssue({ code: "custom", message: "Enter a valid amount" });
        return z.NEVER;
      }
    });

export const optionalMoneyInput = (currency = "USD") =>
  z.preprocess((v) => (v === "" || v === null || v === undefined ? null : v), moneyInput(currency).nullable());

export const percentInput = z.union([z.string(), z.number()]).transform((v, ctx) => {
  try {
    const bps = percentToBps(v);
    if (bps > 10000) {
      ctx.addIssue({ code: "custom", message: "Must be 100% or less" });
      return z.NEVER;
    }
    return bps;
  } catch {
    ctx.addIssue({ code: "custom", message: "Enter a valid percentage" });
    return z.NEVER;
  }
});

export const quantityInput = z
  .union([z.string(), z.number()])
  .transform((v) => String(v).trim())
  .refine((v) => /^\d{1,10}(\.\d{1,2})?$/.test(v) && Number(v) > 0, "Quantity must be a positive number (max 2 decimals)");

export const checkbox = z.preprocess((v) => v === true || v === "on" || v === "true", z.boolean());
