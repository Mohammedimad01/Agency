import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("public site, admin and portal work at phone width without horizontal scroll", async ({ page }) => {
  for (const path of ["/", "/services", "/pricing", "/contact"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, path).toBeLessThanOrEqual(1);
  }
  await page.goto("/");
  await page.getByRole("button", { name: "Toggle menu" }).click();
  await expect(page.getByRole("navigation", { name: "Mobile" }).getByText("Pricing")).toBeVisible();

  await login(page, "client@acme.test");
  const portalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(portalOverflow).toBeLessThanOrEqual(1);
});
