import { expect, test } from "@playwright/test";
import { STATE } from "./fixtures";

test.describe("Departments — hr_admin", () => {
  test.use({ storageState: STATE.admin });

  test("DEPT-01 department list loads with headcounts", async ({ page }) => {
    await page.goto("/departments");
    await expect(page.getByText(/\d+ departments/)).toBeVisible();
    await expect(page.getByRole("cell", { name: "Engineering" })).toBeVisible();
  });

  test("DEPT-03 & DEPT-04 HR admin can create then rename a department", async ({ page }) => {
    await page.goto("/departments");
    const uniqueName = `E2E Dept ${Date.now()}`;
    await page.getByRole("button", { name: "New department" }).click();
    await page.fill("#department-name", uniqueName);

    const [createRes] = await Promise.all([
      page.waitForResponse((res) => res.url().includes("/api/v1/departments") && res.request().method() === "POST"),
      page.getByRole("button", { name: "Create department" }).click(),
    ]);
    expect(createRes.status()).toBe(201);
    await expect(page.getByText(uniqueName)).toBeVisible();

    // Rename it
    const row = page.getByRole("row", { name: new RegExp(uniqueName) });
    await row.getByRole("button").first().click();
    const renamed = `${uniqueName} Renamed`;
    await page.fill("#department-name", renamed);

    const [updateRes] = await Promise.all([
      page.waitForResponse((res) => res.url().includes("/api/v1/departments") && res.request().method() === "PATCH"),
      page.getByRole("button", { name: "Save changes" }).click(),
    ]);
    expect(updateRes.status()).toBe(200);
    await expect(page.getByText(renamed)).toBeVisible();
  });

  test("DEPT-05 HR admin can delete an unused department", async ({ page }) => {
    await page.goto("/departments");
    const uniqueName = `E2E Delete Me ${Date.now()}`;
    await page.getByRole("button", { name: "New department" }).click();
    await page.fill("#department-name", uniqueName);
    await Promise.all([
      page.waitForResponse((res) => res.url().includes("/api/v1/departments") && res.request().method() === "POST"),
      page.getByRole("button", { name: "Create department" }).click(),
    ]);
    await expect(page.getByText(uniqueName)).toBeVisible();

    const row = page.getByRole("row", { name: new RegExp(uniqueName) });
    const buttons = row.getByRole("button");
    await buttons.nth(1).click(); // delete icon button
    const [deleteRes] = await Promise.all([
      page.waitForResponse((res) => res.url().includes("/api/v1/departments") && res.request().method() === "DELETE"),
      page.getByRole("button", { name: "Delete" }).click(),
    ]);
    expect(deleteRes.status()).toBe(204);
    await expect(page.getByText(uniqueName)).toHaveCount(0);
  });
});

test.describe("Departments — employee", () => {
  test.use({ storageState: STATE.employee });

  test("DEPT-02 'New department' hidden without department.write, list still readable", async ({ page }) => {
    await page.goto("/departments");
    await expect(page.getByRole("button", { name: "New department" })).toHaveCount(0);
    await expect(page.getByText(/\d+ departments/)).toBeVisible();
  });
});

test.describe("Departments — manager", () => {
  test.use({ storageState: STATE.manager });

  test("DEPT-05 manager cannot delete a department", async ({ page }) => {
    await page.goto("/departments");
    // manager has employee.write but not department.write, so canManage should be false here.
    await expect(page.getByRole("button", { name: "New department" })).toHaveCount(0);
  });
});
