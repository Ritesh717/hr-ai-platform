import { expect, test } from "@playwright/test";
import { collectConsoleErrors, STATE } from "./fixtures";

// /directory is deliberately excluded here — a plain employee gets a 403 there today
// (see org-directory.spec.ts's DIR-BUG regression test), which would make every run of this
// generic sweep fail on a already-tracked, already-explained issue.
const EMPLOYEE_ROUTES = [
  "/dashboard", "/profile", "/time", "/leave", "/time-off", "/payroll",
  "/expenses", "/careers", "/jobs", "/applications", "/interviews", "/notifications",
  "/assistant", "/settings",
];

const MANAGER_ROUTES = ["/my-team", "/org", "/departments", "/approvals", "/onboarding"];
const ADMIN_ROUTES = ["/admin", "/employees", "/analytics", "/roles", "/audit-log"];

test.describe("UI-04 console is free of unhandled errors — employee routes", () => {
  test.use({ storageState: STATE.employee });

  for (const route of EMPLOYEE_ROUTES) {
    test(`no console errors on ${route}`, async ({ page }) => {
      const errors = collectConsoleErrors(page);
      await page.goto(route);
      await page.waitForTimeout(1200);
      expect(errors, `console errors on ${route}: ${JSON.stringify(errors)}`).toEqual([]);
    });
  }
});

test.describe("UI-04 console is free of unhandled errors — manager routes", () => {
  test.use({ storageState: STATE.manager });

  for (const route of MANAGER_ROUTES) {
    test(`no console errors on ${route}`, async ({ page }) => {
      const errors = collectConsoleErrors(page);
      await page.goto(route);
      await page.waitForTimeout(1200);
      expect(errors, `console errors on ${route}: ${JSON.stringify(errors)}`).toEqual([]);
    });
  }
});

test.describe("UI-04 console is free of unhandled errors — admin routes", () => {
  test.use({ storageState: STATE.admin });

  for (const route of ADMIN_ROUTES) {
    test(`no console errors on ${route}`, async ({ page }) => {
      const errors = collectConsoleErrors(page);
      await page.goto(route);
      await page.waitForTimeout(1200);
      expect(errors, `console errors on ${route}: ${JSON.stringify(errors)}`).toEqual([]);
    });
  }
});

test.describe("UI-06 responsive layout — key screens", () => {
  test.use({ storageState: STATE.employee });

  for (const width of [1280, 768, 375]) {
    test(`dashboard has no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/dashboard");
      await page.waitForTimeout(800);
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth, `page scrolls horizontally at ${width}px (scrollWidth=${scrollWidth} > clientWidth=${clientWidth})`).toBeLessThanOrEqual(clientWidth + 1);
    });
  }
});
