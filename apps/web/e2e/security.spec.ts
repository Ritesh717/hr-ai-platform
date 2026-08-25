import fs from "node:fs";
import { expect, test } from "@playwright/test";
import { STATE } from "./fixtures";

const API = process.env.E2E_API_URL ?? "http://localhost:3001";

test.describe("Cross-cutting security", () => {
  test("SEC-05 protected endpoints reject a garbage token uniformly (401)", async ({ request }) => {
    const endpoints = [
      "/api/v1/employees",
      "/api/v1/departments",
      "/api/v1/leave/requests",
      "/api/v1/payroll/summary",
      "/api/v1/expenses",
    ];
    for (const path of endpoints) {
      const res = await request.get(`${API}${path}`, { headers: { Authorization: "Bearer not-a-real-jwt" } });
      expect(res.status(), `${path} should 401 on a garbage token`).toBe(401);
    }
  });

  test("SEC-04 no JWT/password ever appears in a rendered page's HTML", async ({ page }) => {
    const state = JSON.parse(fs.readFileSync(STATE.employee, "utf-8"));
    const token: string = state.origins[0].localStorage[0].value;

    await page.context().addInitScript((t) => window.localStorage.setItem("hr_ai_access_token", t), token);
    await page.goto("/dashboard");
    await page.waitForTimeout(1000);
    const html = await page.content();
    expect(html.includes(token)).toBe(false);
  });
});

test.describe("Cross-cutting security — manager", () => {
  test.use({ storageState: STATE.manager });

  test("SEC-06 assistant does not unilaterally execute a high-impact action", async () => {
    test.fixme(
      true,
      "Requires a configured LLM provider key to exercise a real conversational turn — verify manually or once an eval harness/mock provider is wired up for CI. The tool-layer authorization itself is already covered at the API level in apps/api/test/agent-tools.e2e-spec.ts.",
    );
  });
});
