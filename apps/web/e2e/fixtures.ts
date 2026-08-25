import fs from "node:fs";
import path from "node:path";
import { expect, type Page, type Response } from "@playwright/test";

const AUTH_DIR = path.join(__dirname, ".auth");

export const STATE = {
  admin: path.join(AUTH_DIR, "admin.json"),
  manager: path.join(AUTH_DIR, "manager.json"),
  employee: path.join(AUTH_DIR, "employee.json"),
};

export interface TestUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface TestUsers {
  tenantSlug: string;
  password: string;
  admin: TestUser;
  manager: TestUser;
  employee: TestUser;
}

export function loadTestUsers(): TestUsers {
  const raw = fs.readFileSync(path.join(AUTH_DIR, "test-users.json"), "utf-8");
  return JSON.parse(raw) as TestUsers;
}

/** Fails the console-cleanliness assertions (UI-04) if any of these substrings appear. */
export const IGNORED_CONSOLE_PATTERNS = [
  "[HMR]",
  "Download the React DevTools",
  "autocomplete attributes",
];

/**
 * Drives the real /login form. Chromium applies its own autofill-related styling to
 * password/email inputs shortly after first paint, which can race a fast programmatic `fill()`
 * and wipe an already-typed value (observed on the tenantSlug/email fields specifically) — the
 * short settle here isn't working around an app bug, just letting that settle before typing.
 */
export async function loginViaForm(
  page: Page,
  opts: { tenantSlug: string; email: string; password: string },
): Promise<Response> {
  await page.goto("/login");
  await expect(page.getByText("Sign in to your workspace")).toBeVisible();
  await page.waitForTimeout(400);

  await page.fill("#tenantSlug", opts.tenantSlug);
  await page.fill("#email", opts.email);
  await page.fill("#password", opts.password);
  await expect(page.locator("#tenantSlug")).toHaveValue(opts.tenantSlug);
  await expect(page.locator("#email")).toHaveValue(opts.email);

  // Wait for the actual login response rather than guessing at settle time — deterministic for
  // both the success (redirect) and failure (toast) paths.
  const [response] = await Promise.all([
    page.waitForResponse((res) => res.url().includes("/api/v1/auth/login")),
    page.click('button[type="submit"]'),
  ]);
  return response;
}

export function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (IGNORED_CONSOLE_PATTERNS.some((p) => text.includes(p))) return;
    errors.push(text);
  });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}
