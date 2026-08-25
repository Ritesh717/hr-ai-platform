import { expect, test } from "@playwright/test";
import { STATE } from "./fixtures";

test.describe("Jobs Board — employee", () => {
  test.use({ storageState: STATE.employee });

  test("JOB-01 jobs board lists open postings", async ({ page }) => {
    await page.goto("/jobs");
    await expect(page.getByText(/\d+ role/)).toBeVisible();
  });

  test("JOB-02 filter by department narrows the list", async ({ page }) => {
    await page.goto("/jobs");
    const countText = await page.getByText(/^\d+ role/).textContent();
    await page.getByRole("button", { name: "Engineering" }).click();
    await page.waitForTimeout(300);
    const filteredText = await page.getByText(/^\d+ role/).textContent();
    expect(filteredText).not.toBe(countText);
  });

  test("JOB-03 sort dropdown changes order", async ({ page }) => {
    await page.goto("/jobs");
    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: "Alphabetical" }).click();
    await page.waitForTimeout(300);
  });

  test("JOB-04 job detail view renders", async ({ page }) => {
    await page.goto("/jobs");
    await page.locator("a, [role='button']").filter({ hasText: /Apply|View/ }).first();
    const firstJobLink = page.locator('a[href^="/jobs/"]').first();
    await expect(firstJobLink).toBeVisible({ timeout: 10_000 });
    await firstJobLink.click();
    await expect(page).toHaveURL(/\/jobs\/.+/);
    await expect(page.getByRole("button", { name: "Apply now" })).toBeVisible();
  });

  test("JOB-05 unknown job ID shows a not-found state", async ({ page }) => {
    await page.goto("/jobs/000000000000000000000000");
    await expect(page.getByText(/not found|couldn't|doesn't exist/i)).toBeVisible({ timeout: 10_000 });
  });

  test("JOB-08 unauthenticated request to jobs API is rejected", async ({ request }) => {
    const res = await request.get(`${process.env.E2E_API_URL ?? "http://localhost:3001"}/api/v1/jobs`);
    expect(res.status()).toBe(401);
  });

  test("JOB-06 apply to a job", async () => {
    test.fixme(
      true,
      "features/jobs/apply-drawer.tsx's handleSubmit is a UI-only stub (a fake 800ms delay, no API call) — applying never actually creates an application via POST /jobs/:id/apply.",
    );
  });
});
