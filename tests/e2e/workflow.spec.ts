import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { login } from "./helpers";
import { SERVICE, URL } from "../integration/helpers";

test.describe("public website → CRM", () => {
  test("an inquiry submitted on the website appears in the admin CRM", async ({ page }) => {
    const name = `E2E Visitor ${Date.now()}`;
    await page.goto("/contact?type=brief");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Tell us what you're building");
    await page.getByLabel("Full name").fill(name);
    await page.getByLabel("Work email").fill(`e2e-${Date.now()}@example.test`);
    await page.getByLabel("Company", { exact: true }).fill("E2E Industries");
    await page.getByLabel("Service").selectOption({ label: "Web development" });
    await page.getByLabel("Budget").selectOption({ label: "$5k–$10k" });
    await page.getByLabel("Timeline").selectOption("1–3 months");
    await page.getByLabel("Project requirements").fill("A marketing website with a CMS and a blog.");
    await page.waitForTimeout(1600); // honeypot timing check
    await page.getByRole("checkbox").click();
    await page.getByRole("button", { name: "Send project brief" }).click();
    await expect(page.getByText("Message received.")).toBeVisible();

    await login(page, "owner@team.test");
    await page.goto("/admin/leads?view=table");
    await page.getByPlaceholder("Search leads…").fill(name);
    await page.getByText(name).click();
    await expect(page.getByRole("heading", { name })).toBeVisible();
    await expect(page.getByText("Lead created from website_brief")).toBeVisible();
    await expect(page.getByText("Service fit")).toBeVisible(); // qualification breakdown
  });

  test("validation errors are shown without submitting", async ({ page }) => {
    await page.goto("/contact");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText("Please enter your name")).toBeVisible();
    await expect(page.getByText("Enter a valid email address")).toBeVisible();
  });
});

test.describe("authorization", () => {
  test("signed-out users are redirected to login", async ({ page }) => {
    await page.goto("/admin/finance");
    await expect(page).toHaveURL(/\/login\?next=%2Fadmin%2Ffinance/);
  });

  test("a developer cannot open finance pages", async ({ page }) => {
    await login(page, "dev@team.test");
    await page.goto("/admin/finance/invoices");
    await expect(page).toHaveURL(/access-denied/);
    await expect(page.getByRole("navigation", { name: "Admin" }).getByText("Invoices")).toHaveCount(0);
  });

  test("clients are kept in the portal", async ({ page }) => {
    await login(page, "client@globex.test");
    await expect(page).toHaveURL(/\/portal/);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/portal/);
    await page.goto("/portal/projects");
    await expect(page.getByText("Acme Corporate Website")).toHaveCount(0);
    await expect(page.getByText("Globex Retail Dashboards")).toBeVisible();
  });
});

test.describe("client portal", () => {
  test.beforeEach(async () => {
    // Make the test re-runnable: put the seeded deliverable back into review.
    const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });
    await admin.from("deliverables").update({ status: "submitted" }).eq("title", "Homepage & inner page designs");
  });

  test("a client reviews a deliverable and requests changes", async ({ page }) => {
    await login(page, "client@acme.test");
    await expect(page.getByRole("heading", { name: "Needs your attention" })).toBeVisible();
    await page.getByRole("link", { name: /Review/ }).first().click();
    await expect(page.getByText("Awaiting Approval").first()).toBeVisible();
    await page.getByRole("button", { name: "Request changes" }).click();
    await page.getByLabel("Your feedback").fill("Please make the hero image larger.");
    await page.getByRole("button", { name: "Send feedback" }).click();
    await expect(page.getByText("Changes Requested").first()).toBeVisible();
    await expect(page.getByText("Please make the hero image larger.").first()).toBeVisible();
  });
});

test.describe("operations", () => {
  test("finance creates an invoice with live totals, issues it and records a payment", async ({ page }) => {
    await login(page, "finance@team.test");
    await page.goto("/admin/finance/invoices/new");
    await page.getByLabel("Client").selectOption({ label: "Nadia Studio" });
    await page.getByLabel("Description").first().fill("Brand photography retouching");
    await page.getByLabel("Quantity").first().fill("3");
    await page.getByLabel("Unit price").first().fill("150.50");
    await page.getByLabel("Tax %").fill("5");
    await expect(page.getByText("$474.08")).toBeVisible(); // 451.50 + 5% tax, computed client-side
    await page.getByRole("button", { name: "Create draft invoice" }).click();
    await expect(page.getByRole("heading", { name: /Invoice INV-/ })).toBeVisible();
    await expect(page.getByText("Draft").first()).toBeVisible();
    await page.getByRole("button", { name: "Issue & send" }).click();
    await page.getByRole("button", { name: "Issue invoice" }).click();
    await expect(page.getByText("Sent").first()).toBeVisible();
    await page.getByRole("button", { name: "Record payment" }).click();
    await page.getByLabel(/Amount/).fill("200");
    await page.getByRole("button", { name: "Record payment" }).last().click();
    await expect(page.getByText("Partially Paid").first()).toBeVisible();
    await expect(page.getByText("$274.08").first()).toBeVisible();
  });

  test("a project manager creates a project from a template", async ({ page }) => {
    await login(page, "pm@team.test");
    await page.goto("/admin/projects/new");
    await page.getByLabel("Project name").fill(`E2E Website ${Date.now()}`);
    await page.getByLabel("Client").selectOption({ label: "Nadia Studio" });
    await page.getByLabel("Template").selectOption({ label: "Website Development" });
    await page.getByRole("button", { name: "Create project" }).click();
    await expect(page.getByText("Discovery & requirements").first()).toBeVisible();
    await page.getByRole("link", { name: /Tasks/ }).click();
    await expect(page.getByText("Kickoff meeting")).toBeVisible();
  });
});
