import { expect, test } from "@playwright/test";
import { STATE } from "./fixtures";

test.describe("Settings — employee", () => {
  test.use({ storageState: STATE.employee });

  test("SET-02 change password — mismatched confirmation is caught client-side", async ({ page }) => {
    await page.goto("/settings");
    await page.getByRole("tab", { name: "Security" }).click();
    await page.getByLabel("Current password").fill("whatever-current");
    await page.getByLabel("New password", { exact: true }).fill("newpassword123");
    await page.getByLabel("Confirm new password").fill("different123");
    await page.getByRole("button", { name: "Update password" }).click();
    await expect(page.getByText("New password and confirmation do not match.")).toBeVisible();
  });

  test("SET-02b change password — too-short new password is caught client-side", async ({ page }) => {
    await page.goto("/settings");
    await page.getByRole("tab", { name: "Security" }).click();
    await page.getByLabel("Current password").fill("whatever-current");
    await page.getByLabel("New password", { exact: true }).fill("short");
    await page.getByLabel("Confirm new password").fill("short");
    await page.getByRole("button", { name: "Update password" }).click();
    await expect(page.getByText("New password must be at least 8 characters.")).toBeVisible();
  });

  test("SET-01 change password actually updates the account", async () => {
    test.fixme(
      true,
      "features/settings/settings-screen.tsx's handleChangePassword only validates client-side and sets a local 'success' flag — it never calls the backend, so the password is never actually changed.",
    );
  });

  test("SET-04 'Enable MFA' control", async () => {
    test.fixme(true, "The 'Enable MFA' button in features/settings/settings-screen.tsx has no onClick handler wired up.");
  });
});
