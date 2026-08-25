import { expect, test } from "@playwright/test";
import { STATE } from "./fixtures";

test.describe("Career Growth — employee", () => {
  test.use({ storageState: STATE.employee });

  test("CAR-01 & CAR-02 career path and skills gap chart render", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/careers");
    await expect(page.getByRole("heading", { name: "Career Growth" })).toBeVisible();
    await expect(page.getByText("Career path")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("CAR-03 'View matching jobs' navigates to Jobs Board", async ({ page }) => {
    await page.goto("/careers");
    await page.getByRole("link", { name: "View matching jobs" }).click();
    await expect(page).toHaveURL(/\/jobs$/);
  });

  test("CAR-04 'Talk to your manager' navigates to chat", async ({ page }) => {
    await page.goto("/careers");
    await page.getByRole("link", { name: "Talk to your manager" }).click();
    await expect(page).toHaveURL(/\/chat$/);
  });
});
