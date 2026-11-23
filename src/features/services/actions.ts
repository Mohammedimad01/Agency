"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { dbError, parseInput, teamAction } from "@/lib/action";
import { checkbox, optionalMoneyInput, optionalText, requiredText } from "@/lib/validations/common";
import { getCurrency } from "@/features/settings/queries";
import { slugify } from "@/lib/utils";

const lines = z.preprocess((v) => (typeof v === "string" ? v.split("\n").map((s) => s.trim()).filter(Boolean) : v), z.array(z.string().max(200)).max(30));

const serviceSchema = (currency: string) =>
  z.object({
    name: requiredText("Name", 120),
    slug: z.preprocess((v) => (typeof v === "string" && v.trim() ? slugify(v) : undefined), z.string().optional()),
    category: requiredText("Category", 60),
    summary: optionalText(300),
    description: optionalText(5000),
    icon: optionalText(40),
    starting_price: optionalMoneyInput(currency),
    delivery_time: optionalText(60),
    deliverables: lines,
    features: lines,
    is_active: checkbox,
    is_public: checkbox,
    sort_order: z.coerce.number().int().min(0).max(999).default(0),
  });
export type ServiceInput = z.input<ReturnType<typeof serviceSchema>>;

export async function saveService(id: string | null, input: unknown) {
  return teamAction("services.manage", async (ctx) => {
    const d = parseInput(serviceSchema(await getCurrency(ctx.organizationId)), input);
    const sb = await createClient();
    const row = {
      name: d.name, slug: d.slug ?? slugify(d.name), category: d.category, summary: d.summary ?? null, description: d.description ?? null, icon: d.icon ?? null,
      starting_price_cents: d.starting_price ?? null, delivery_time: d.delivery_time ?? null, deliverables: d.deliverables, features: d.features,
      is_active: d.is_active, is_public: d.is_public, sort_order: d.sort_order,
    };
    const { error } = id ? await sb.from("services").update(row).eq("id", id) : await sb.from("services").insert({ ...row, organization_id: ctx.organizationId });
    if (error) dbError(error);
    revalidatePath("/admin/services");
    revalidatePath("/services", "layout");
    revalidatePath("/");
    return null;
  }, "Service saved");
}
