import { defineConfig, devices } from "@playwright/test";

// See e2e/README.md for prerequisites (seeded tenant, running backend/frontend).
export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.E2E_WEB_URL ?? "http://localhost:3000",
    // In CI (the PR gate) always record trace + video, pass or fail, so a reviewer can watch any
    // run from the uploaded artifact — locally, keep it to failures only to save disk.
    trace: process.env.CI ? "on" : "retain-on-failure",
    screenshot: "only-on-failure",
    video: process.env.CI ? "on" : "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
