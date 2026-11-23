import { z } from "zod";
import { email, optionalEmail, optionalText, optionalUrl, optionalUuid, requiredText, checkbox } from "@/lib/validations/common";

export const clientSchema = z.object({
  type: z.enum(["individual", "company"]),
  name: requiredText("Client name", 200),
  company_name: optionalText(200),
  email: optionalEmail,
  phone: optionalText(40),
  website: optionalUrl,
  industry: optionalText(100),
  address_line1: optionalText(200),
  address_line2: optionalText(200),
  city: optionalText(100),
  state: optionalText(100),
  postal_code: optionalText(20),
  country: optionalText(80),
  tax_id: optionalText(60),
  status: z.enum(["active", "inactive", "archived"]).default("active"),
  source: optionalText(60),
  account_manager_id: optionalUuid,
  notes: optionalText(10000),
});
export type ClientInput = z.input<typeof clientSchema>;

export const contactSchema = z.object({
  id: optionalUuid,
  client_id: z.uuid(),
  full_name: requiredText("Name", 200),
  email,
  phone: optionalText(40),
  job_title: optionalText(100),
  is_primary: checkbox.default(false),
});
export type ContactInput = z.input<typeof contactSchema>;
