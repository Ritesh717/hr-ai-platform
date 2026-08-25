import { expect, test } from "@playwright/test";
import { STATE } from "./fixtures";

test.describe("Roles & Permissions — hr_admin", () => {
  test.use({ storageState: STATE.admin });

  test("RBAC-01 Roles tab lists all seed roles with permissions", async ({ page }) => {
    await page.goto("/roles");
    await expect(page.getByText("employee", { exact: true })).toBeVisible();
    await expect(page.getByText("manager", { exact: true })).toBeVisible();
    await expect(page.getByText("hr_admin", { exact: true })).toBeVisible();
    await expect(page.getByText("rbac.manage")).toBeVisible();
  });

  test("RBAC-03, RBAC-05, RBAC-07 create, edit, then delete a throwaway role", async ({ page }) => {
    await page.goto("/roles");
    const uniqueName = `e2e-role-${Date.now()}`;
    await page.getByRole("button", { name: "New role" }).click();
    await page.fill("#role-name", uniqueName);
    await page.getByLabel("employee.read", { exact: true }).check();

    const [createRes] = await Promise.all([
      page.waitForResponse((res) => res.url().includes("/api/v1/roles") && res.request().method() === "POST"),
      page.getByRole("button", { name: "Create role" }).click(),
    ]);
    expect(createRes.status()).toBe(201);
    await expect(page.getByText(uniqueName)).toBeVisible();

    // Edit: add a second permission
    const row = page.getByRole("row", { name: new RegExp(uniqueName) });
    await row.getByRole("button").first().click();
    await page.getByLabel("department.read", { exact: true }).check();
    const [updateRes] = await Promise.all([
      page.waitForResponse((res) => res.url().includes("/api/v1/roles") && res.request().method() === "PATCH"),
      page.getByRole("button", { name: "Save changes" }).click(),
    ]);
    expect(updateRes.status()).toBe(200);

    // Delete: unused role should succeed
    const buttons = page.getByRole("row", { name: new RegExp(uniqueName) }).getByRole("button");
    await buttons.nth(1).click();
    const [deleteRes] = await Promise.all([
      page.waitForResponse((res) => res.url().includes("/api/v1/roles") && res.request().method() === "DELETE"),
      page.getByRole("button", { name: "Delete" }).click(),
    ]);
    expect(deleteRes.status()).toBe(204);
    await expect(page.getByText(uniqueName)).toHaveCount(0);
  });

  test("RBAC-04 duplicate role name is rejected", async ({ page }) => {
    await page.goto("/roles");
    await page.getByRole("button", { name: "New role" }).click();
    await page.fill("#role-name", "employee");
    await page.getByLabel("employee.read", { exact: true }).check();

    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes("/api/v1/roles") && res.request().method() === "POST"),
      page.getByRole("button", { name: "Create role" }).click(),
    ]);
    expect(response.status()).toBe(409);
  });

  test("RBAC-06 cannot delete a role still assigned to an employee", async ({ page, request }) => {
    // "manager" and "hr_admin" both have assignees in the seeded org.
    await page.goto("/roles");
    const row = page.getByRole("row", { name: /^manager/ });
    const buttons = row.getByRole("button");
    await buttons.nth(1).click();

    const [deleteRes] = await Promise.all([
      page.waitForResponse((res) => res.url().includes("/api/v1/roles") && res.request().method() === "DELETE"),
      page.getByRole("button", { name: "Delete" }).click(),
    ]);
    expect(deleteRes.ok()).toBe(false);
    // Role should still be present.
    await expect(page.getByText("manager", { exact: true })).toBeVisible();
  });

  test("RBAC-08 cannot strip rbac.manage from the only role that grants it", async ({ page }) => {
    await page.goto("/roles");
    const row = page.getByRole("row", { name: /^hr_admin/ });
    await row.getByRole("button").first().click();
    await page.getByLabel("rbac.manage", { exact: true }).uncheck();

    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes("/api/v1/roles") && res.request().method() === "PATCH"),
      page.getByRole("button", { name: "Save changes" }).click(),
    ]);
    expect(response.ok()).toBe(false);
  });

  test("RBAC-09 Access Matrix tab renders", async ({ page }) => {
    await page.goto("/roles");
    await page.getByRole("tab", { name: "Access Matrix" }).click();
    await expect(page.getByText("employee", { exact: true })).toBeVisible();
  });

  test("RBAC-10 Approval Hierarchy tab renders without crashing", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/roles");
    await page.getByRole("tab", { name: "Approval Hierarchy" }).click();
    await page.waitForTimeout(1000);
    expect(errors).toEqual([]);
  });

  test("RBAC-12 permission catalog is complete (15 codes)", async ({ page }) => {
    await page.goto("/roles");
    await page.getByRole("button", { name: "New role" }).click();
    const labels = page.locator('label[for^="permission-"]');
    await expect(labels).toHaveCount(15);
  });
});

test.describe("Roles & Permissions — manager (non-admin)", () => {
  test.use({ storageState: STATE.manager });

  test("RBAC-02 [regression] non-admin gets a clean access-restricted error, not a stuck loading state", async ({ page }) => {
    await page.goto("/roles");
    await expect(page.getByText("Something went wrong")).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("button", { name: "New role" })).toHaveCount(0);
  });
});
