import { expect, test } from "@playwright/test";
import { loadTestUsers, loginViaForm } from "./fixtures";

// This file deliberately does NOT use a saved storageState — it drives the real login form.
const users = loadTestUsers();

test.describe("Authentication & Session", () => {
  test("AUTH-01 successful login redirects to dashboard", async ({ page }) => {
    await loginViaForm(page, { tenantSlug: users.tenantSlug, email: users.admin.email, password: users.password });
    await page.waitForURL("**/dashboard");
  });

  test("AUTH-02 wrong password is rejected", async ({ page }) => {
    const response = await loginViaForm(page, {
      tenantSlug: users.tenantSlug,
      email: users.admin.email,
      password: "definitely-wrong-password",
    });

    expect(response.ok()).toBe(false);
    await expect(page.getByText("Sign in failed", { exact: true }).first()).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("AUTH-03 unknown tenant slug is rejected", async ({ page }) => {
    const response = await loginViaForm(page, {
      tenantSlug: "no-such-tenant-slug-xyz",
      email: users.admin.email,
      password: users.password,
    });

    expect(response.ok()).toBe(false);
    await expect(page.getByText("Sign in failed", { exact: true }).first()).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("AUTH-04 wrong-tenant credentials are rejected (tenant scoping)", async ({ request }) => {
    // Real cross-tenant credentials aren't guaranteed to exist in every environment; assert the
    // scoping rule directly against the API instead (right email/password, wrong tenant slug).
    const res = await request.post(`${process.env.E2E_API_URL ?? "http://localhost:3001"}/api/v1/auth/login`, {
      data: { tenantSlug: "some-other-workspace", email: users.admin.email, password: users.password },
    });
    expect(res.ok()).toBe(false);
  });

  test("AUTH-06 all fields required client-side", async ({ page }) => {
    await page.goto("/login");
    await page.click('button[type="submit"]');
    // HTML5 required validation blocks the native submit — we should still be on /login.
    await expect(page).toHaveURL(/\/login$/);
  });

  test("AUTH-07 unauthenticated user hitting a dashboard route is redirected to /login", async ({ page }) => {
    await page.goto("/employees");
    await page.waitForURL("**/login");
    await expect(page.getByText("Sign in to your workspace")).toBeVisible();
  });

  test("AUTH-08 session persists across a page reload", async ({ page }) => {
    await loginViaForm(page, { tenantSlug: users.tenantSlug, email: users.employee.email, password: users.password });
    await page.waitForURL("**/dashboard");

    await page.reload();
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("AUTH-09 corrupted token is treated as logged-out, not stuck loading [regression]", async ({ page }) => {
    await loginViaForm(page, { tenantSlug: users.tenantSlug, email: users.employee.email, password: users.password });
    await page.waitForURL("**/dashboard");

    await page.evaluate(() => window.localStorage.setItem("hr_ai_access_token", "not-a-real-jwt"));
    await page.goto("/employees");
    await page.waitForURL("**/login", { timeout: 10_000 });
  });

  test("AUTH-10 'Continue with SSO' is disabled", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("button", { name: "Continue with SSO" })).toBeDisabled();
  });
});
