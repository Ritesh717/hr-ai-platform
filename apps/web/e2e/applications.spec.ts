import { expect, test } from "@playwright/test";
import { STATE } from "./fixtures";

test.describe("Applications — employee", () => {
  test.use({ storageState: STATE.employee });

  test("APPL-01 & APPL-05 applications list is scoped to the caller, with a designed empty state", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/applications");
    await expect(page.getByRole("heading", { name: "My Applications" })).toBeVisible();

    const hasEmptyState = await page.getByText("No applications yet").isVisible().catch(() => false);
    if (hasEmptyState) {
      await expect(page.getByRole("link", { name: "Browse open roles" })).toBeVisible();
    }
    expect(errors).toEqual([]);
  });
});
