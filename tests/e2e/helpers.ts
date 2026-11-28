import { expect, type Page } from "@playwright/test";

/** Test accounts come from tests/fixtures/test-data.sql; the password from TEST_USER_PASSWORD. */
export async function login(page: Page, email: string, password = process.env.TEST_USER_PASSWORD) {
  if (!password) throw new Error("Set TEST_USER_PASSWORD (the password used with `npm run db:test-data`).");
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).not.toHaveURL(/\/login/);
}
