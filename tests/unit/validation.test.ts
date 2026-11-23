import { describe, expect, it } from "vitest";
import { inquirySchema } from "@/features/inquiries/schemas";
import { moneyInput, optionalUrl } from "@/lib/validations/common";
import { safeRedirectPath, slugify } from "@/lib/utils";
import { renderEmail } from "@/lib/email/layout";
import { EMAIL_TEMPLATES } from "@/lib/email/templates";

describe("validation", () => {
  it("validates public inquiries and rejects the honeypot", () => {
    const ok = inquirySchema.safeParse({ kind: "message", fullName: "Jane Doe", email: "JANE@Example.com ", message: "We need a new website soon.", consent: true });
    expect(ok.success).toBe(true);
    if (ok.success) expect(ok.data.email).toBe("jane@example.com");
    expect(inquirySchema.safeParse({ kind: "message", fullName: "J", email: "bad", message: "short", consent: false }).success).toBe(false);
    expect(inquirySchema.safeParse({ kind: "message", fullName: "Jane", email: "j@x.io", message: "We need a new website.", consent: true, company_url: "http://spam" }).success).toBe(false);
  });
  it("parses money input to integer minor units", () => {
    expect(moneyInput("USD").parse("1,250.50")).toBe(125050);
    expect(moneyInput("USD", { min: 1 }).safeParse("0").success).toBe(false);
    expect(moneyInput("USD").safeParse("12abc").success).toBe(false);
  });
  it("normalises URLs", () => {
    expect(optionalUrl.parse("example.com")).toBe("https://example.com");
    expect(optionalUrl.parse("")).toBeNull();
  });
  it("only allows same-origin redirects", () => {
    expect(safeRedirectPath("/admin/leads")).toBe("/admin/leads");
    expect(safeRedirectPath("//evil.com", "/")).toBe("/");
    expect(safeRedirectPath("https://evil.com", "/")).toBe("/");
    expect(safeRedirectPath("/\\evil.com", "/")).toBe("/");
  });
  it("slugifies", () => {
    expect(slugify("Power BI Dashboards & Reporting")).toBe("power-bi-dashboards-reporting");
  });
});

describe("email templates", () => {
  it("escapes user-provided content", () => {
    const out = EMAIL_TEMPLATES.new_lead({ lead_name: "<script>alert(1)</script>", description: "<img src=x onerror=alert(1)>", email: "a@b.c", link: "/admin/leads/1" }, (p) => `https://app.test${p}`);
    expect(out.html).not.toContain("<script>");
    expect(out.html).not.toContain("<img src=x");
    expect(out.html).toContain("https://app.test/admin/leads/1");
    expect(out.text).toContain("A new lead just came in");
  });
  it("renders every template", () => {
    for (const [name, fn] of Object.entries(EMAIL_TEMPLATES)) {
      const out = fn({ recipient_name: "Ann", project_name: "P", number: "INV-1", total_cents: 1000, currency: "USD", link: "/x", action_link: "https://x" }, (p) => p);
      expect(out.subject.length, name).toBeGreaterThan(3);
      expect(out.html).toContain("<!doctype html>");
    }
  });
  it("layout produces plain-text alternative", () => {
    expect(renderEmail({ subject: "S", heading: "H", paragraphs: ["a &amp; b"] }).text).toContain("a & b");
  });
});
