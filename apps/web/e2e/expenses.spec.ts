import { expect, test } from "@playwright/test";
import { STATE } from "./fixtures";

const FAKE_RECEIPT = {
  name: "receipt.png",
  mimeType: "image/png",
  // Minimal valid 1x1 PNG.
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  ),
};

async function openDetailsFormViaUpload(page: import("@playwright/test").Page) {
  await page.goto("/expenses");
  await page.getByRole("button", { name: "New expense" }).click();
  await page.locator('input[type="file"]').setInputFiles(FAKE_RECEIPT);
  await page.getByText("OCR complete", { exact: false }).waitFor({ timeout: 10_000 });
  await page.getByRole("button", { name: "Use these values" }).click();
}

test.describe("Expenses — employee", () => {
  test.use({ storageState: STATE.employee });

  test("EXP-01 create an expense as a draft (via receipt-upload flow)", async ({ page }) => {
    await openDetailsFormViaUpload(page);

    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes("/api/v1/expenses") && res.request().method() === "POST"),
      page.getByRole("button", { name: "Save as draft" }).click(),
    ]);
    expect(response.status()).toBe(201);
    // The toast text is rendered twice (visible toast + an aria-live screen-reader echo) — scope
    // to the first match rather than tightening the locator, since both are legitimately present.
    await expect(page.getByText("Expense saved as draft").first()).toBeVisible();
  });

  test("EXP-02 submit an expense for approval (via receipt-upload flow)", async ({ page }) => {
    await openDetailsFormViaUpload(page);

    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes("/api/v1/expenses") && res.request().method() === "POST"),
      page.getByRole("button", { name: "Submit for approval" }).click(),
    ]);
    expect(response.status()).toBe(201);
    await expect(page.getByText("Expense submitted for approval").first()).toBeVisible();
  });

  test("EXP-03 missing required fields blocks submission", async ({ page }) => {
    await openDetailsFormViaUpload(page);
    await page.getByPlaceholder("0.00").fill("");
    await page.getByRole("button", { name: "Submit for approval" }).click();
    await expect(page.getByText("Please fill in amount, date, and vendor").first()).toBeVisible();
  });

  test("EXP-09 expense history renders without error", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/expenses");
    await expect(page.getByText("Expense history")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("EXP-10 unauthenticated request to expenses API is rejected", async ({ request }) => {
    const res = await request.get(`${process.env.E2E_API_URL ?? "http://localhost:3001"}/api/v1/expenses`);
    expect(res.status()).toBe(401);
  });

  test("EXP-11 all 6 expense categories are selectable", async ({ page }) => {
    await openDetailsFormViaUpload(page);
    await page.getByRole("combobox").click();
    for (const label of ["Travel", "Accommodation", "Meals & Entertainment", "Equipment", "Training & Events", "Other"]) {
      await expect(page.getByRole("option", { name: label, exact: true })).toBeVisible();
    }
  });

  test("EXP-04 delete a draft expense", async () => {
    test.fixme(
      true,
      "No delete control was found on the Expense history rows in this pass — verify against the shipped columns/list UI and fill in once confirmed.",
    );
  });
});
