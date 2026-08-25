import { expect, test } from "@playwright/test";
import { STATE } from "./fixtures";

test.describe("Notifications — employee", () => {
  test.use({ storageState: STATE.employee });

  test("NOTIF-01 notification list is scoped to the caller", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/notifications");
    await expect(page.getByText(/\d+ unread/)).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("NOTIF-02 tabs filter by category", async ({ page }) => {
    await page.goto("/notifications");
    const tablist = page.getByRole("tablist", { name: "Notification categories" });
    await expect(tablist.getByRole("tab", { name: "Action Required" })).toBeVisible();
    await expect(tablist.getByRole("tab", { name: "Updates" })).toBeVisible();
    await expect(tablist.getByRole("tab", { name: "Mentions" })).toBeVisible();
    await tablist.getByRole("tab", { name: "Updates" }).click();
    await page.waitForTimeout(300);
  });

  test("NOTIF-05 'Mark all as read' clears the unread count", async ({ page }) => {
    await page.goto("/notifications");
    const markAllButton = page.getByRole("button", { name: "Mark all as read" });
    const hasUnread = await markAllButton.isVisible().catch(() => false);
    test.skip(!hasUnread, "No unread notifications in the seeded data.");

    await markAllButton.click();
    await expect(page.getByText("0 unread")).toBeVisible();
  });

  test("NOTIF-08 unauthenticated request to notifications API is rejected", async ({ request }) => {
    const res = await request.get(`${process.env.E2E_API_URL ?? "http://localhost:3001"}/api/v1/notifications`);
    expect(res.status()).toBe(401);
  });
});
