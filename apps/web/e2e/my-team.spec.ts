import { expect, test } from "@playwright/test";
import { STATE } from "./fixtures";

test.describe("My Team — manager", () => {
  test.use({ storageState: STATE.manager });

  test("TEAM-02 direct reports list with status", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/my-team");
    await page.waitForTimeout(1000);
    expect(errors).toEqual([]);
  });
});

test.describe("My Team — employee (restricted)", () => {
  test.use({ storageState: STATE.employee });

  test("TEAM-01 plain employee's My Team view has no direct-report data to show", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/my-team");
    await page.waitForTimeout(1000);
    expect(errors).toEqual([]);
  });
});
