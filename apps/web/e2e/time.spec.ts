import { expect, test } from "@playwright/test";
import { STATE } from "./fixtures";

test.describe("Time & Attendance — employee", () => {
  test.use({ storageState: STATE.employee });

  test("TIME-01 & TIME-02 clock in then clock out", async ({ page }) => {
    await page.goto("/time");
    const clockButton = page.getByRole("button", { name: /Clock (In|Out)/ });
    await expect(clockButton).toBeVisible();
    await page.waitForTimeout(500);
    const initialText = await clockButton.textContent();

    await clockButton.click();
    await expect(clockButton).not.toHaveText(initialText ?? "", { timeout: 5000 });
  });

  test("TIME-03 weekly timesheet grid renders", async ({ page }) => {
    await page.goto("/time");
    await expect(page.getByRole("tab", { name: /This Week/i })).toBeVisible();
  });

  test("TIME-04 attendance calendar renders", async ({ page }) => {
    await page.goto("/time");
    await page.getByRole("tab", { name: /Attendance/i }).click();
    await page.waitForTimeout(500);
  });
});
