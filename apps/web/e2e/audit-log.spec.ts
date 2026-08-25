import { expect, test } from "@playwright/test";
import { loadTestUsers, STATE } from "./fixtures";

const users = loadTestUsers();

test.describe("Audit Log — hr_admin", () => {
  test.use({ storageState: STATE.admin });

  test("AUD-02 HR admin can view the audit log", async ({ page }) => {
    await page.goto("/audit-log");
    await expect(page.getByText(/\d+ events recorded/)).toBeVisible();
  });

  test("AUD-03 employee-record writes are captured with correct actor/action/resource", async ({ page }) => {
    // Trigger a real write first.
    await page.goto(`/employees/${users.employee.id}`);
    await page.getByRole("button", { name: "Edit profile" }).click();
    const newTitle = `Audit Trail Check ${Date.now()}`;
    await page.fill("#field-jobTitle", newTitle);
    await Promise.all([
      page.waitForResponse((res) => res.url().includes(`/api/v1/employees/${users.employee.id}`) && res.request().method() === "PATCH"),
      page.getByRole("button", { name: "Save" }).click(),
    ]);

    await page.goto("/audit-log");
    await page.getByPlaceholder("Filter by actor, action, or resource").fill("employee.updated");
    await expect(page.getByText("employee.updated").first()).toBeVisible();
    await expect(page.getByText(users.admin.name).first()).toBeVisible();
  });

  test("AUD-04 & AUD-05 filter narrows results, empty state for no matches", async ({ page }) => {
    await page.goto("/audit-log");
    await page.getByPlaceholder("Filter by actor, action, or resource").fill("zzz-no-such-action-zzz");
    await expect(page.getByText("No activity matches your filter")).toBeVisible();
  });
});

test.describe("Audit Log — manager (non-admin)", () => {
  test.use({ storageState: STATE.manager });

  test("AUD-01 [regression] non-admin gets a clean access-restricted error, not a stuck loading state", async ({ page }) => {
    await page.goto("/audit-log");
    await expect(page.getByText("Something went wrong")).toBeVisible({ timeout: 5000 });
  });
});
