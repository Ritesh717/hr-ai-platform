import { expect, test } from "@playwright/test";
import { STATE } from "./fixtures";

test.describe("Payroll — employee", () => {
  test.use({ storageState: STATE.employee });

  test("PAY-01 payroll summary renders", async ({ page }) => {
    await page.goto("/payroll");
    await expect(page.getByRole("heading", { name: "Payroll" })).toBeVisible();
    await expect(page.getByText("Salary summary and payslip history")).toBeVisible();
  });

  test("PAY-02 & PAY-03 payslip history lists own payslips and detail renders composition", async ({ page }) => {
    await page.goto("/payroll");
    await expect(page.getByRole("heading", { name: "Payslip history" })).toBeVisible();
    const firstPayslipLink = page.locator('a[href^="/payroll/payslips/"]').first();
    await expect(firstPayslipLink).toBeVisible({ timeout: 10_000 });
    await firstPayslipLink.click();
    await expect(page).toHaveURL(/\/payroll\/payslips\/.+/);
    await expect(page.getByRole("heading", { name: "Earnings" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Deductions" })).toBeVisible();
  });

  test("PAY-05 unauthenticated request to payroll API is rejected", async ({ request }) => {
    const res = await request.get(`${process.env.E2E_API_URL ?? "http://localhost:3001"}/api/v1/payroll/summary`);
    expect(res.status()).toBe(401);
  });
});
