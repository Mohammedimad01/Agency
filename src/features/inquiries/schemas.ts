import { z } from "zod";
import { TIMELINE_OPTIONS } from "@/features/leads/qualification";

/** Public budget ranges. `cents` is the lower bound used for qualification. */
export const BUDGET_RANGES = [
  { value: "under-2.5k", label: "Under $2.5k", cents: 150000 },
  { value: "2.5k-5k", label: "$2.5k–$5k", cents: 250000 },
  { value: "5k-10k", label: "$5k–$10k", cents: 500000 },
  { value: "10k-25k", label: "$10k–$25k", cents: 1000000 },
  { value: "25k-plus", label: "$25k+", cents: 2500000 },
  { value: "unsure", label: "Not sure yet", cents: null },
] as const;

const text = (max: number) => z.string().trim().max(max);

export const inquirySchema = z.object({
  kind: z.enum(["message", "brief", "booking"]),
  fullName: text(120).min(2, "Please enter your name"),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")),
  phone: text(40).optional().default(""),
  company: text(160).optional().default(""),
  website: text(200).optional().default(""),
  country: text(80).optional().default(""),
  serviceSlug: text(80).optional().default(""),
  budget: z.enum(BUDGET_RANGES.map((b) => b.value) as [string, ...string[]]).optional().or(z.literal("")),
  timeline: z.enum(TIMELINE_OPTIONS).optional().or(z.literal("")),
  message: text(5000).min(10, "Tell us a little more (at least 10 characters)"),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  preferredTime: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal("")),
  timezone: text(64).optional().default(""),
  consent: z.literal(true, { message: "Please agree so we can contact you" }),
  // Honeypot: real users never fill this in
  company_url: z.string().max(0).optional().default(""),
  // Simple bot timing check (ms since form render)
  elapsedMs: z.coerce.number().optional().default(0),
});

export type InquiryInput = z.input<typeof inquirySchema>;
