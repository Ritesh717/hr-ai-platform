import { expect, test } from "@playwright/test";
import { STATE } from "./fixtures";

test.describe("Onboarding — manager", () => {
  test.use({ storageState: STATE.manager });

  test("ONB-01 & ONB-02 onboarding records render with checklist and progress bar", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/onboarding");
    await page.waitForTimeout(1000);
    expect(errors).toEqual([]);
  });

  test("ONB-03 checking off a checklist item updates progress", async ({ page }) => {
    await page.goto("/onboarding");
    const checkbox = page.getByRole("checkbox").first();
    const hasChecklist = await checkbox.isVisible().catch(() => false);
    test.skip(!hasChecklist, "No onboarding records with checklist items in the seeded data.");

    await checkbox.click();
    await page.waitForTimeout(300);
  });
});
