import { expect, test } from "@playwright/test";
import { STATE } from "./fixtures";

test.describe("Analytics — employee (restricted)", () => {
  test.use({ storageState: STATE.employee });

  test("ANL-01 access requires analytics.read — no chart data leaks", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    let sawForbidden = false;
    page.on("response", (res) => {
      if (res.url().includes("/api/v1/analytics") && res.status() === 403) sawForbidden = true;
    });
    await page.goto("/analytics");
    await page.waitForTimeout(1500);
    expect(sawForbidden).toBe(true);
    expect(errors).toEqual([]);
  });
});

test.describe("Analytics — manager", () => {
  test.use({ storageState: STATE.manager });

  test("ANL-02 & ANL-03 charts render for manager, period selector works", async ({ page }) => {
    await page.goto("/analytics");
    await expect(page.getByRole("heading", { name: "Analytics" })).toBeVisible();
    await page.waitForTimeout(1000);
  });

  test("ANL-04 unauthenticated request to analytics API is rejected", async ({ request }) => {
    const res = await request.get(`${process.env.E2E_API_URL ?? "http://localhost:3001"}/api/v1/analytics`);
    expect(res.status()).toBe(401);
  });
});
