import { defineConfig, devices } from "@playwright/test";

/**
 * Browser end-to-end tests. Requires the local Supabase stack (`npx supabase start`,
 * then `npx supabase db reset` for fresh seed data) and the app (`npm run dev` or
 * `npm run build && npm start`). Set E2E_BASE_URL to target another deployment.
 */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "off",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, testIgnore: /responsive\.spec\.ts/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /responsive\.spec\.ts/ },
  ],
});
