import { expect, test } from "@playwright/test";
import { STATE } from "./fixtures";

test.describe("Leave — employee", () => {
  test.use({ storageState: STATE.employee });

  test("LEAVE-01 leave balances render correctly", async ({ page }) => {
    await page.goto("/leave");
    await expect(page.getByText("Leave balances")).toBeVisible();
    await expect(page.getByText("Annual", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Sick", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Personal", { exact: true }).first()).toBeVisible();
  });

  test("LEAVE-02 & LEAVE-03 [regression] apply for leave, end-date calendar disables dates before start", async ({ page }) => {
    await page.goto("/leave");
    await page.click("#leave-type");
    await page.getByRole("option", { name: "Annual", exact: true }).first().click();

    await page.getByText("From", { exact: true }).click();
    await page.getByRole("gridcell", { name: "25" }).first().click();
    await page.waitForTimeout(500);

    await page.getByText("To", { exact: true }).click();
    // Regression: End-date calendar must disable every day before the chosen start date.
    const disabledDay = page.getByRole("gridcell", { name: "20" }).first().locator("button");
    await expect(disabledDay).toBeDisabled();

    await page.getByRole("gridcell", { name: "27" }).first().click();
    await page.fill("textarea", "E2E smoke test leave request");

    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes("/api/v1/leave") && res.request().method() === "POST"),
      page.getByRole("button", { name: "Submit request" }).click(),
    ]);
    expect(response.status()).toBe(201);
    await expect(page.getByText("Leave request submitted", { exact: true })).toBeVisible();
  });

  test("LEAVE-04 submitting with a missing required field is blocked client-side", async ({ page }) => {
    await page.goto("/leave");
    let postFired = false;
    page.on("request", (r) => {
      if (r.url().includes("/api/v1/leave/requests") && r.method() === "POST") postFired = true;
    });
    await page.getByRole("button", { name: "Submit request" }).click();
    await page.waitForTimeout(1000);
    expect(postFired).toBe(false);
  });

  test("LEAVE-06 leave history lists past requests", async ({ page }) => {
    await page.goto("/leave");
    await expect(page.getByRole("heading", { name: "Leave history" })).toBeVisible();
    await expect(page.locator("table")).toBeVisible();
  });
});

test.describe("Leave — manager", () => {
  test.use({ storageState: STATE.manager });

  test("LEAVE-07 manager sees an AI insight about pending team approvals", async ({ page }) => {
    await page.goto("/leave");
    await expect(page.getByText("AI INSIGHT")).toBeVisible();
  });
});
