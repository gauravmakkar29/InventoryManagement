import { test, expect } from "@playwright/test";

test.describe("Deployment — visual regression", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/deployments", { waitUntil: "networkidle" });
  });

  test("light mode", async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.classList.remove("dark");
    });
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot("deployment-light.png", {
      fullPage: true,
    });
  });

  test("dark mode", async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.classList.add("dark");
    });
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot("deployment-dark.png", {
      fullPage: true,
    });
  });
});
