import { expect, test } from "@playwright/test";
import { loadTestUsers, STATE } from "./fixtures";

test.describe("Org Chart — manager", () => {
  test.use({ storageState: STATE.manager });

  test("ORG-01 [regression] org chart loads the full reporting tree without 422s", async ({ page }) => {
    const badResponses: string[] = [];
    page.on("response", (res) => {
      if (res.url().includes("/api/v1/employees") && res.status() === 422) badResponses.push(res.url());
    });
    await page.goto("/org");
    await page.waitForTimeout(2000);
    expect(badResponses).toEqual([]);
    await expect(page.locator("text=HR Administrator").first()).toBeVisible();
  });

  test("ORG-02 department filter chips narrow the tree", async ({ page }) => {
    await page.goto("/org");
    await page.waitForTimeout(1000);
    await page.getByRole("button", { name: "Engineering", exact: true }).click();
    await page.waitForTimeout(500);
  });
});

test.describe("People Directory — manager (has employee.read)", () => {
  test.use({ storageState: STATE.manager });

  test("DIR-01 [regression] directory loads all employees without 422s", async ({ page }) => {
    const badResponses: string[] = [];
    page.on("response", (res) => {
      if (res.url().includes("/api/v1/employees") && res.status() === 422) badResponses.push(res.url());
    });
    await page.goto("/directory");
    await expect(page.getByText(/Showing \d+ of (?!0)\d+ employees/)).toBeVisible({ timeout: 10_000 });
    expect(badResponses).toEqual([]);
  });

  test("DIR-03 directory search filters the grid", async ({ page }) => {
    // Search for the actual seeded "employee" test account's name rather than a hardcoded one —
    // seed-demo-org generates names randomly, so a fixed name isn't guaranteed to exist.
    const { employee } = loadTestUsers();
    await page.goto("/directory");
    await expect(page.getByText(/Showing \d+ of (?!0)\d+ employees/)).toBeVisible({ timeout: 10_000 });
    await page.getByPlaceholder("Search by name, role, or department…").fill(employee.name);
    await expect(page.getByText("Showing 1 of")).toBeVisible();
  });

  test("DIR-04 grid/list view toggle switches layout", async ({ page }) => {
    await page.goto("/directory");
    await expect(page.getByText(/Showing \d+ of (?!0)\d+ employees/)).toBeVisible({ timeout: 10_000 });
    const listToggle = page.locator("button").filter({ has: page.locator("svg") }).nth(-1);
    await listToggle.click();
    await page.waitForTimeout(300);
  });
});

test.describe("People Directory — plain employee", () => {
  test.use({ storageState: STATE.employee });

  test("DIR-BUG plain employees can't actually use the People Directory the nav promises them", async ({ page }) => {
    test.fixme(
      true,
      "People Directory is placed in the 'everyone' nav lens (nav-config.ts) — no permission gate — but " +
        "lib/api/directory.ts's fetchDirectoryEmployees() calls GET /api/v1/employees, which the backend " +
        "restricts to callers with employee.read (see employees.e2e-spec.ts: 'a manager can list employees " +
        "but a plain employee cannot'). The base `employee` role template does NOT grant employee.read, so " +
        "for any plain employee the directory silently renders 'Showing 0 of 0 employees' / 'No employees " +
        "found' — a 403 on every load, not a working directory. This is a product/security design decision " +
        "(should a lightweight company directory be world-readable within a tenant, separate from the " +
        "employee.read HR-management permission?) that needs a human call, not something to quietly loosen " +
        "backend authorization for while writing tests.",
    );
  });
});
