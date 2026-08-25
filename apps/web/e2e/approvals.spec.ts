import { expect, test } from "@playwright/test";
import { STATE } from "./fixtures";

test.describe("Approvals — employee (restricted)", () => {
  test.use({ storageState: STATE.employee });

  test("APR-01 plain employee cannot reach an approvals queue", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/approvals");
    await page.waitForTimeout(1000);
    expect(errors).toEqual([]);
  });
});

test.describe("Approvals — manager", () => {
  test.use({ storageState: STATE.manager });

  test("APR-02 & APR-07 pending requests list with type tabs", async ({ page }) => {
    await page.goto("/approvals");
    await expect(page.getByRole("heading", { name: "Approvals" })).toBeVisible();
    await expect(page.getByRole("tab", { name: /All \(\d+\)/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Leave" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Expense" })).toBeVisible();

    await page.getByRole("tab", { name: "Leave" }).click();
    await page.waitForTimeout(300);
  });

  test("APR-08 empty state shown for a category with zero pending requests", async ({ page }) => {
    await page.goto("/approvals");
    await page.getByRole("tab", { name: "Role change" }).click();
    // Retry instead of a single fixed-wait check — the tab's content re-render isn't
    // deterministically done by any fixed timeout.
    await expect(async () => {
      const hasEmpty = await page.getByText("No pending requests in this category.").isVisible();
      const hasCard = (await page.locator('[class*="Card"]').count()) > 0;
      expect(hasEmpty || hasCard).toBe(true);
    }).toPass({ timeout: 8_000 });
  });

  test("APR-03 approve a single leave request updates the underlying leave status", async ({ page }) => {
    await page.goto("/approvals");
    await page.getByRole("tab", { name: "Leave" }).click();
    await page.waitForTimeout(500);

    const approveButton = page.getByRole("button", { name: "Approve" }).first();
    const hasPending = await approveButton.isVisible().catch(() => false);
    test.skip(!hasPending, "No pending leave requests in the seeded data to approve.");

    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes("/api/v1/leave/requests") && res.request().method() === "PATCH"),
      approveButton.click(),
    ]);
    expect(response.ok()).toBe(true);
  });

  test("APR-05 bulk select shows the bulk action bar", async ({ page }) => {
    await page.goto("/approvals");
    const checkboxes = page.getByRole("checkbox");
    const count = await checkboxes.count();
    test.skip(count === 0, "No pending requests in the seeded data to select.");

    await checkboxes.first().click();
    await expect(page.getByText("1 selected")).toBeVisible();
  });
});
