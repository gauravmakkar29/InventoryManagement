import { test, expect } from "@playwright/test";

test.describe("Dashboard — visual regression", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
  });

  test("light mode", async ({ page }) => {
    // Ensure light mode is active
    await page.evaluate(() => {
      document.documentElement.classList.remove("dark");
    });
    // Allow repaint
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot("dashboard-light.png", {
      fullPage: true,
    });
  });

  test("dark mode", async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.classList.add("dark");
    });
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot("dashboard-dark.png", {
      fullPage: true,
    });
  });
});
