import { expect, test } from "@playwright/test";
import { STATE } from "./fixtures";

test.describe("Interviews — employee", () => {
  test.use({ storageState: STATE.employee });

  test("INT-01 & INT-05 upcoming interviews list, with a designed empty state", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/interviews");
    await expect(page.getByRole("heading", { name: "Interviews" })).toBeVisible();

    const hasEmptyState = await page.getByText("No upcoming interviews").isVisible().catch(() => false);
    if (hasEmptyState) {
      await expect(page.getByRole("link", { name: "Browse open roles" })).toBeVisible();
    }
    expect(errors).toEqual([]);
  });
});
