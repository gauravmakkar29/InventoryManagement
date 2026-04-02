import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for visual regression tests.
 *
 * Runs against the Vite preview server (npm run preview → localhost:4173).
 * Snapshots are stored in e2e/visual/snapshots/ and committed to the repo
 * so every developer and CI runner shares the same baselines.
 */
export default defineConfig({
  testDir: "./tests",
  snapshotDir: "./snapshots",
  outputDir: "./test-results",

  /* Fail the build if any test.only() slips through */
  forbidOnly: !!process.env.CI,

  /* Retry once on CI to reduce flakiness from rendering timing */
  retries: process.env.CI ? 1 : 0,

  /* Single worker keeps screenshot timing deterministic */
  workers: 1,

  /* HTML reporter for local review, line reporter for CI */
  reporter: process.env.CI ? "line" : "html",

  use: {
    baseURL: "http://localhost:4173",
    /* Wait until no network activity for 500 ms before taking screenshots */
    actionTimeout: 10_000,
    screenshot: "off", // we take manual screenshots via toHaveScreenshot
    trace: "retain-on-failure",
  },

  expect: {
    toHaveScreenshot: {
      /* Allow up to 0.3 % pixel difference to absorb minor anti-aliasing
         variations across OS / GPU combinations */
      maxDiffPixelRatio: 0.003,
      /* Animation settling time — wait 500 ms after page looks stable */
      animations: "disabled",
    },
  },

  projects: [
    {
      name: "desktop-chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: "mobile-chrome",
      use: {
        ...devices["Pixel 5"],
      },
    },
  ],
});
