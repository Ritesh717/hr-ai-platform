import { expect, test } from "@playwright/test";
import { loadTestUsers, STATE } from "./fixtures";

const users = loadTestUsers();

test.describe("Profile — employee", () => {
  test.use({ storageState: STATE.employee });

  test("PROF-01 own profile renders About/Skills/Employment history/Performance", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/profile");
    await expect(page.getByRole("heading", { name: users.employee.name })).toBeVisible();
    await expect(page.getByText("About", { exact: true })).toBeVisible();
    await expect(page.getByText("Skills", { exact: true })).toBeVisible();
    await expect(page.getByText("Employment history")).toBeVisible();
    expect(errors).toEqual([]);
  });
});
