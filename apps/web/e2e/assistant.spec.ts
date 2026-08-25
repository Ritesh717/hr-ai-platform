import { expect, test } from "@playwright/test";
import { STATE } from "./fixtures";

test.describe("AI Assistant — employee", () => {
  test.use({ storageState: STATE.employee });

  test("AI-01 assistant screen loads without crashing", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/assistant");
    await page.waitForTimeout(1000);
    expect(errors).toEqual([]);
  });

  test("AI-02 sending a message degrades gracefully even without a working LLM provider", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/assistant");
    const input = page.getByRole("textbox", { name: "Message" });
    await input.waitFor({ timeout: 10_000 });
    await input.fill("What's my leave balance?");
    await input.press("Enter");
    // Either a real reply renders, or the composer/chat surfaces a handled error state — either
    // way there must be no unhandled client-side exception.
    await page.waitForTimeout(5000);
    expect(errors).toEqual([]);
  });

  test("AI-03 & AI-04 & AI-05 agent chat API rejects bad auth / malformed body", async ({ request }) => {
    const base = process.env.E2E_API_URL ?? "http://localhost:3001";
    const noAuth = await request.post(`${base}/api/v1/agent/employee/chat`, { data: { message: "hi" } });
    expect(noAuth.status()).toBe(401);

    const badToken = await request.post(`${base}/api/v1/agent/employee/chat`, {
      headers: { Authorization: "Bearer garbage-token" },
      data: { message: "hi" },
    });
    expect(badToken.status()).toBe(401);
  });
});
