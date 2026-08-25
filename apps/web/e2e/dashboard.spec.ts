import { expect, test } from "@playwright/test";
import { collectConsoleErrors, STATE } from "./fixtures";

test.describe("Dashboard — employee home", () => {
  test.use({ storageState: STATE.employee });

  test("DASH-01 employee dashboard loads live leave/payroll/task widgets", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/dashboard");

    await expect(page.getByText("Leave balances")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Payroll" })).toBeVisible();
    await expect(page.getByText("Open tasks")).toBeVisible();
    await expect(page.getByText("Career", { exact: true })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("DASH-02 'View payslips' navigates to payroll [regression: was linking to /payslips, a 404]", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("link", { name: "View payslips" }).click();
    await expect(page).toHaveURL(/\/payroll$/);
  });

  test("DASH-03 AI Insight panel renders without crashing", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/dashboard");
    await expect(page.getByText("AI INSIGHT")).toBeVisible();
    await page.waitForTimeout(1500);
    expect(errors).toEqual([]);
  });
});

test.describe("Dashboard — admin dashboard (employee, restricted)", () => {
  test.use({ storageState: STATE.employee });

  test("DASH-05 access restricted without employee.write or rbac.manage", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByText("Access restricted")).toBeVisible();
    await expect(page.getByText("You need HR Admin or RBAC permissions")).toBeVisible();
  });
});

test.describe("Dashboard — admin dashboard (hr_admin)", () => {
  test.use({ storageState: STATE.admin });

  test("DASH-06 admin KPIs render for HR admin", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByText("Access restricted")).toHaveCount(0);
    await expect(page.getByText("Add employee")).toBeVisible();
  });

  test("DASH-08 quick action links navigate correctly", async ({ page }) => {
    await page.goto("/admin");
    await page.getByRole("link", { name: "Add employee" }).click();
    await expect(page).toHaveURL(/\/employees$/);

    await page.goto("/admin");
    await page.getByRole("link", { name: /View pending approvals/ }).click();
    await expect(page).toHaveURL(/\/approvals$/);

    await page.goto("/admin");
    await page.getByRole("link", { name: /Run payroll/ }).click();
    await expect(page).toHaveURL(/\/payroll$/);

    await page.goto("/admin");
    await page.getByRole("link", { name: /Export headcount report/ }).click();
    await expect(page).toHaveURL(/\/analytics$/);
  });
});

test.describe("Dashboard — admin dashboard (manager)", () => {
  test.use({ storageState: STATE.manager });

  test("DASH-07 manager can access admin dashboard via employee.write", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByText("Access restricted")).toHaveCount(0);
    await expect(page.getByText("Add employee")).toBeVisible();
  });
});
