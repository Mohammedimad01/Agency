"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ActionError, dbError, parseInput, teamAction } from "@/lib/action";
import { checkbox, optionalText, optionalUrl, requiredText } from "@/lib/validations/common";
import { slugify } from "@/lib/utils";

const lines = z.preprocess((v) => (typeof v === "string" ? v.split(/\n|,/).map((s) => s.trim()).filter(Boolean) : v), z.array(z.string().max(120)).max(30));

const portfolioSchema = z.object({
  title: requiredText("Title", 200), slug: z.string().optional(), client_name: optionalText(200), industry: optionalText(100),
  year: z.preprocess((v) => (v === "" ? null : v), z.coerce.number().int().min(1990).max(2100).nullable()),
  summary: optionalText(500), challenge: optionalText(5000), solution: optionalText(5000), results: optionalText(5000),
  metrics: z.preprocess(
    (v) => (typeof v === "string" ? v.split("\n").map((l) => l.split("|").map((x) => x.trim())).filter((p) => p.length === 2 && p[0] && p[1]).map(([label, value]) => ({ label, value })) : v),
    z.array(z.object({ label: z.string().max(60), value: z.string().max(30) })).max(6),
  ),
  cover_image_url: optionalUrl, services: lines, tech_stack: lines, project_url: optionalUrl,
  is_published: checkbox, is_featured: checkbox, sort_order: z.coerce.number().int().min(0).max(999).default(0),
});
const testimonialSchema = z.object({
  author_name: requiredText("Name", 120), author_title: optionalText(120), company: optionalText(120), quote: requiredText("Quote", 2000),
  rating: z.preprocess((v) => (v === "" ? null : v), z.coerce.number().int().min(1).max(5).nullable()), is_published: checkbox, sort_order: z.coerce.number().int().min(0).default(0),
});
const faqSchema = z.object({ question: requiredText("Question", 300), answer: requiredText("Answer", 3000), category: z.string().default("general"), is_published: checkbox, sort_order: z.coerce.number().int().min(0).default(0) });

export type PortfolioFormInput = z.input<typeof portfolioSchema>;
export type TestimonialFormInput = z.input<typeof testimonialSchema>;
export type FaqFormInput = z.input<typeof faqSchema>;

function refreshSite() {
  revalidatePath("/", "layout");
  revalidatePath("/admin/website");
}

type Table = "portfolio_items" | "testimonials" | "faqs";

export async function saveContent(table: Table, id: string | null, input: unknown) {
  return teamAction("content.manage", async (ctx) => {
    const sb = await createClient();
    let row: Record<string, unknown>;
    if (table === "portfolio_items") {
      const d = parseInput(portfolioSchema, input);
      row = { ...d, slug: slugify(d.slug || d.title) };
    } else if (table === "testimonials") row = parseInput(testimonialSchema, input);
    else row = parseInput(faqSchema, input);
    const query = id
      ? sb.from(table).update(row as never).eq("id", id)
      : sb.from(table).insert({ ...row, organization_id: ctx.organizationId } as never);
    const { error } = await query;
    if (error) dbError(error);
    refreshSite();
    return null;
  }, "Saved — the website will update shortly");
}

export async function deleteContent(table: Table, id: string) {
  return teamAction("content.manage", async () => {
    if (!["portfolio_items", "testimonials", "faqs"].includes(table)) throw new ActionError("Invalid content type");
    const sb = await createClient();
    const { error } = await sb.from(table).delete().eq("id", id);
    if (error) dbError(error);
    refreshSite();
    return null;
  }, "Deleted");
}
