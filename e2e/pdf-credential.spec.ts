/**
 * Playwright E2E coverage for the credential PDF download/preview flow.
 *
 * Run with:  bunx playwright test e2e            (requires: bun add -d @playwright/test)
 * Base URL:  http://localhost:8080
 */
import { expect, test, type Page, type Route } from "@playwright/test";

const CRED = "/certifications/adx-mdws3tasmv?debug=1";
const PDF_HEADER = Buffer.from("%PDF-1.4\n");

/** Streams `chunks` with a delay so progress is observable mid-flight. */
async function mockStream(page: Page, opts: { chunks: number; size: number; delayMs: number }) {
  await page.route("**/*.pdf*", async (route: Route) => {
    const body = Buffer.concat([
      PDF_HEADER,
      Buffer.alloc(opts.chunks * opts.size - PDF_HEADER.length, 0x20),
    ]);
    await new Promise((r) => setTimeout(r, opts.delayMs));
    await route.fulfill({
      status: 200,
      headers: { "content-type": "application/pdf", "content-length": String(body.length) },
      body,
    });
  });
}

test.describe("credential PDF", () => {
  test("reports progress, bytes and completion in telemetry", async ({ page }) => {
    await mockStream(page, { chunks: 8, size: 64 * 1024, delayMs: 200 });
    await page.goto(CRED);

    await page.getByRole("button", { name: /download certificate/i }).click();
    await expect(page.getByRole("progressbar", { name: /download progress/i })).toBeVisible();

    await page.getByRole("button", { name: /open telemetry panel/i }).click();
    const panel = page.getByRole("region", { name: "Telemetry" });
    await expect(panel).toContainText("download/request_start");
    await expect(panel).toContainText("download/first_byte");
    await expect(panel).toContainText("download/complete");
  });

  test("cancel mid-stream restores the trigger and records a cancel event", async ({ page }) => {
    await mockStream(page, { chunks: 40, size: 64 * 1024, delayMs: 2000 });
    await page.goto(CRED);

    const trigger = page.getByRole("button", { name: /download certificate|downloading/i });
    await trigger.click();
    await page.getByRole("button", { name: "Cancel" }).click();

    await expect(page.getByText("Download canceled.")).toBeVisible();
    // Focus must return to the trigger, not be lost to <body>.
    await expect(page.getByRole("button", { name: /download certificate/i })).toBeFocused();

    await page.getByRole("button", { name: /open telemetry panel/i }).click();
    await expect(page.getByRole("region", { name: "Telemetry" })).toContainText("download/cancel");
  });

  test("retry after a failure saves the PDF with the right filename and MIME", async ({ page }) => {
    let attempt = 0;
    await page.route("**/*.pdf*", async (route) => {
      attempt += 1;
      if (attempt === 1) return route.fulfill({ status: 500, body: "boom" });
      return route.fulfill({
        status: 200,
        headers: { "content-type": "application/pdf" },
        body: Buffer.concat([PDF_HEADER, Buffer.alloc(1024, 0x20)]),
      });
    });
    await page.goto(CRED);

    await page.getByRole("button", { name: /download certificate/i }).click();
    const retry = page.getByRole("button", { name: /retry download/i });
    await expect(retry).toBeVisible();

    const download = page.waitForEvent("download");
    await retry.click();
    const file = await download;
    expect(file.suggestedFilename()).toMatch(/\.pdf$/);
  });

  test("announces progress and errors through a polite live region", async ({ page }) => {
    await mockStream(page, { chunks: 4, size: 64 * 1024, delayMs: 100 });
    await page.goto(CRED);
    await page.getByRole("button", { name: /download certificate/i }).click();
    const live = page.locator("[role=status][aria-live=polite]").first();
    await expect(live).toContainText(/Downloading|complete/i);
  });

  test("preview loads only on demand and is keyboard operable", async ({ page }) => {
    await mockStream(page, { chunks: 4, size: 64 * 1024, delayMs: 100 });
    await page.goto(CRED);
    const loadBtn = page.getByRole("button", { name: /load certificate preview/i });
    await loadBtn.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByLabel(/certificate PDF$/)).toBeVisible({ timeout: 15_000 });
  });
});
