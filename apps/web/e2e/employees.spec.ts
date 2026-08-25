import { expect, test } from "@playwright/test";
import { loadTestUsers, STATE } from "./fixtures";

const users = loadTestUsers();

test.describe("Employees — hr_admin", () => {
  test.use({ storageState: STATE.admin });

  test("EMP-01 employee list loads with correct count", async ({ page }) => {
    await page.goto("/employees");
    await expect(page.locator("tbody tr").first()).toBeVisible({ timeout: 10_000 });
    const headerText = await page.getByText(/\d+ people across the organization/).textContent();
    const expectedCount = Number(headerText?.match(/(\d+) people/)?.[1]);
    expect(expectedCount).toBeGreaterThanOrEqual(150);
    await expect(page.locator("tbody tr")).toHaveCount(expectedCount);
  });

  test("EMP-02 search by name filters the list", async ({ page }) => {
    await page.goto("/employees");
    await page.getByPlaceholder("Search by name, email, or role…").fill(users.manager.name);
    await expect(page.locator("tbody tr")).toHaveCount(1);
    await expect(page.getByText(users.manager.name).first()).toBeVisible();
  });

  test("EMP-04 [regression] HR admin can create an employee — 'New employee' button had no handler wired up", async ({ page }) => {
    await page.goto("/employees");
    await page.getByRole("button", { name: "New employee" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    const uniqueEmail = `e2e.candidate.${Date.now()}@globex.com`;
    await page.fill("#field-fullName", "E2E Test Candidate");
    await page.fill("#field-email", uniqueEmail);
    await page.fill("#field-password", "TempPassw0rd!23");
    await page.fill("#field-jobTitle", "QA Engineer");

    await page.click("#field-roleId");
    await page.getByRole("option", { name: "employee", exact: true }).click();

    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes("/api/v1/employees") && res.request().method() === "POST"),
      page.getByRole("button", { name: "Create employee" }).click(),
    ]);
    expect(response.status()).toBe(201);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.getByPlaceholder("Search by name, email, or role…").fill("E2E Test Candidate");
    await expect(page.getByText("E2E Test Candidate").first()).toBeVisible();
  });

  test("EMP-05 duplicate email is rejected", async ({ page }) => {
    await page.goto("/employees");
    await page.getByRole("button", { name: "New employee" }).click();
    await page.fill("#field-fullName", "Duplicate Test");
    await page.fill("#field-email", users.manager.email);
    await page.fill("#field-password", "TempPassw0rd!23");
    await page.fill("#field-jobTitle", "Tester");
    await page.click("#field-roleId");
    await page.getByRole("option", { name: "employee", exact: true }).click();

    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes("/api/v1/employees") && res.request().method() === "POST"),
      page.getByRole("button", { name: "Create employee" }).click(),
    ]);
    expect(response.status()).toBe(409);
  });

  test("EMP-06 & EMP-07 employee detail renders and HR admin can edit it", async ({ page }) => {
    await page.goto(`/employees/${users.manager.id}`);
    await expect(page.getByRole("heading", { name: users.manager.name })).toBeVisible();

    await page.getByRole("button", { name: "Edit profile" }).click();
    const newTitle = `QA Lead ${Date.now()}`;
    await page.fill("#field-jobTitle", newTitle);

    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes(`/api/v1/employees/${users.manager.id}`) && res.request().method() === "PATCH"),
      page.getByRole("button", { name: "Save" }).click(),
    ]);
    expect(response.ok()).toBe(true);
    await expect(page.getByText(newTitle, { exact: true })).toBeVisible();
  });

  test("EMP-09 self role-escalation is not reachable — edit form has no role control", async ({ page }) => {
    await page.goto(`/employees/${users.employee.id}`);
    await page.getByRole("button", { name: "Edit profile" }).click();
    await expect(page.locator("#field-roleId")).toHaveCount(0);
  });

  test("EMP-11 bulk select shows the bulk action bar with correct count", async ({ page }) => {
    await page.goto("/employees");
    const checkboxes = page.locator("tbody tr").getByRole("checkbox");
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();
    await expect(page.getByText("2 selected")).toBeVisible();

    await page.getByRole("button", { name: "Clear selection" }).click();
    await expect(page.getByText(/\d selected/)).toHaveCount(0);
  });

  test("EMP-12 lifecycle action: transfer employee actually persists a department/manager change", async () => {
    test.fixme(
      true,
      "The Transfer dialog's 'Confirm transfer' button is UI-only today — it just closes the dialog, no API call is wired up (features/employees/lifecycle-action-menu.tsx).",
    );
  });

  test("EMP-13 lifecycle action: terminate/offboard employee actually updates status", async () => {
    test.fixme(
      true,
      "The Offboard/Deactivate dialogs are UI-only today — their confirm buttons just close the dialog, no API call is wired up (features/employees/lifecycle-action-menu.tsx).",
    );
  });

  test("EMP-15 nonexistent employee ID shows an error state, not a crash", async ({ page }) => {
    await page.goto("/employees/000000000000000000000000");
    await expect(page.getByText("Couldn't load this employee.")).toBeVisible();
  });

  test("EMP-16 [regression] employee list respects the backend's pagination cap", async ({ page }) => {
    const badResponses: string[] = [];
    page.on("response", (res) => {
      if (res.url().includes("/api/v1/employees") && res.status() === 422) badResponses.push(res.url());
    });
    await page.goto("/employees");
    await page.waitForTimeout(1500);
    expect(badResponses).toEqual([]);
  });
});

test.describe("Employees — manager", () => {
  test.use({ storageState: STATE.manager });

  test("EMP-14 manager cannot delete an employee", async ({ page }) => {
    await page.goto(`/employees/${users.employee.id}`);
    await expect(page.getByRole("button", { name: "Delete" })).toHaveCount(0);
  });
});

test.describe("Employees — employee", () => {
  test.use({ storageState: STATE.employee });

  test("EMP-03 'New employee' hidden without employee.write", async ({ page }) => {
    await page.goto("/employees");
    await expect(page.getByRole("button", { name: "New employee" })).toHaveCount(0);
  });

  test("EMP-08 [regression] employee can self-update a non-privileged field (jobTitle) — form was sending the whole payload incl. privileged fields", async ({ page }) => {
    await page.goto(`/employees/${users.employee.id}`);
    await page.getByRole("button", { name: "Edit profile" }).click();
    const newTitle = `Self Update ${Date.now()}`;
    await page.fill("#field-jobTitle", newTitle);

    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes(`/api/v1/employees/${users.employee.id}`) && res.request().method() === "PATCH"),
      page.getByRole("button", { name: "Save" }).click(),
    ]);
    expect(response.ok()).toBe(true);
  });

  test("EMP-10 an employee reading another employee's profile is blocked", async ({ page }) => {
    await page.goto(`/employees/${users.manager.id}`);
    await expect(page.getByText("Couldn't load this employee.")).toBeVisible();
  });
});
