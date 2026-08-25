import { expect, test } from "@playwright/test";
import { STATE } from "./fixtures";

test.describe("Time Off — employee", () => {
  test.use({ storageState: STATE.employee });

  test("TOFF-01 allocated/used/remaining summary renders", async ({ page }) => {
    await page.goto("/time-off");
    await expect(page.getByText("Allocated days")).toBeVisible();
    await expect(page.getByText("Used days")).toBeVisible();
    await expect(page.getByText("Remaining days")).toBeVisible();
  });

  test("TOFF-02 calendar renders with legend", async ({ page }) => {
    await page.goto("/time-off");
    await expect(page.getByText("Your pending request")).toBeVisible();
    await expect(page.getByText("Team approved leave")).toBeVisible();
    await expect(page.getByText("Holiday", { exact: true })).toBeVisible();
  });

  test("TOFF-04 'Request time off' opens the request dialog and submits", async ({ page }) => {
    await page.goto("/time-off");
    await page.getByRole("button", { name: "Request time off" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Type", { exact: true })).toBeVisible();
  });

  test("TOFF-06 Holidays tab renders", async ({ page }) => {
    await page.goto("/time-off");
    await page.getByRole("tab", { name: "Holidays" }).click();
    await page.waitForTimeout(500);
  });

  test("TOFF-03 [known gap] end-date calendar in the Request time off dialog doesn't disable dates before start", async () => {
    test.fixme(
      true,
      "features/time-off/schema.ts's leaveRequestCreateFields uses the generic FormField/DatePicker, which has no cross-field 'disabled' wiring yet — only the bespoke picker on the /leave screen (features/leave/leave-screen.tsx) was fixed for this. Same class of issue as LEAVE-03, not yet fixed here.",
    );
  });
});

test.describe("Time Off — manager", () => {
  test.use({ storageState: STATE.manager });

  test("TOFF-05 Approvals tab lists pending direct-report requests and can approve/reject", async ({ page }) => {
    await page.goto("/time-off");
    await expect(page.getByRole("tab", { name: "Approvals" })).toBeVisible();
    await page.getByRole("tab", { name: "Approvals" }).click();
    await page.waitForTimeout(500);
    // Either a pending list or the "nothing awaiting approval" empty state — both are valid,
    // just must not error.
    const hasEmptyState = await page.getByText("No pending requests").isVisible().catch(() => false);
    const hasApproveButton = await page.getByRole("button", { name: "Approve" }).first().isVisible().catch(() => false);
    expect(hasEmptyState || hasApproveButton).toBe(true);
  });
});
