import { expect, test } from "@playwright/test";
import { STATE } from "./fixtures";

test.describe("Navigation & RBAC-Gated UI — employee", () => {
  test.use({ storageState: STATE.employee });

  test("NAV-01 employee sidebar hides manager/admin sections", async ({ page }) => {
    await page.goto("/dashboard");
    const sidebar = page.locator("aside");
    await expect(sidebar.getByText("Dashboard", { exact: true })).toBeVisible();
    await expect(sidebar.getByText("Manager", { exact: true })).toHaveCount(0);
    await expect(sidebar.getByText("HR Admin", { exact: true })).toHaveCount(0);
    await expect(sidebar.getByText("My Team", { exact: true })).toHaveCount(0);
    await expect(sidebar.getByText("Roles & Permissions", { exact: true })).toHaveCount(0);
  });

  test("NAV-04 direct URL nav to an admin route as employee shows a restricted state, not a crash", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));

    await page.goto("/admin");
    await expect(page.getByText("Access restricted")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("NAV-05 sidebar collapse/expand toggle", async ({ page }) => {
    await page.goto("/dashboard");
    const sidebar = page.locator("aside");
    await expect(sidebar.getByText("Dashboard", { exact: true })).toBeVisible();

    // force: true — the button sits where the Next.js dev-mode overlay badge (bottom-left "N"
    // issue indicator, dev-only, never present in production) can physically cover it.
    await page.getByRole("button", { name: /collapse sidebar/i }).click({ force: true });
    await expect(sidebar.getByText("Dashboard", { exact: true })).toBeHidden();

    await page.getByRole("button", { name: /expand sidebar/i }).click({ force: true });
    await expect(sidebar.getByText("Dashboard", { exact: true })).toBeVisible();
  });

  test("NAV-06 theme toggle persists across reload", async ({ page }) => {
    await page.goto("/dashboard");
    const html = page.locator("html");
    const before = await html.getAttribute("data-theme");

    // The theme toggle is the moon/sun icon button in the top bar — first icon-only button there.
    const themeButton = page.locator("header button").first();
    await themeButton.click();
    const after = await html.getAttribute("data-theme");
    expect(after).not.toBe(before);

    await page.reload();
    await expect(html).toHaveAttribute("data-theme", after ?? "");
  });
});

test.describe("Navigation & RBAC-Gated UI — manager", () => {
  test.use({ storageState: STATE.manager });

  test("NAV-02 manager sidebar shows the Manager section", async ({ page }) => {
    await page.goto("/dashboard");
    const sidebar = page.locator("aside");
    await expect(sidebar.getByText("Manager", { exact: true })).toBeVisible();
    await expect(sidebar.getByText("My Team", { exact: true })).toBeVisible();
    await expect(sidebar.getByText("Org Chart", { exact: true })).toBeVisible();
    await expect(sidebar.getByText("Approvals", { exact: true })).toBeVisible();
  });
});

test.describe("Navigation & RBAC-Gated UI — hr_admin", () => {
  test.use({ storageState: STATE.admin });

  test("NAV-03 hr_admin sidebar shows the HR Admin section", async ({ page }) => {
    await page.goto("/dashboard");
    const sidebar = page.locator("aside");
    await expect(sidebar.getByText("HR Admin", { exact: true })).toBeVisible();
    await expect(sidebar.getByText("Roles & Permissions", { exact: true })).toBeVisible();
    await expect(sidebar.getByText("Audit Log", { exact: true })).toBeVisible();
  });
});
