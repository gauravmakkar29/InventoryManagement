# Visual Regression Testing

Visual regression tests use Playwright's built-in `toHaveScreenshot()` to detect unintended UI changes. Tests run in Node.js (separate from the Java E2E framework) and compare screenshots against committed baseline images.

## Quick Start

### Prerequisites

- Node.js 18+
- Playwright browsers installed: `npx playwright install chromium`

### Running Tests

```bash
# 1. Build and serve the production bundle
npm run build
npm run preview          # starts on localhost:4173

# 2. In another terminal, run visual tests
npm run test:visual
```

### Updating Baselines

When you intentionally change the UI, update the baseline snapshots:

```bash
npm run test:visual:update
```

This regenerates every snapshot in `e2e/visual/snapshots/`. Review the diffs in git before committing.

## How It Works

| Concept         | Detail                                               |
| --------------- | ---------------------------------------------------- |
| Config          | `e2e/visual/playwright.config.ts`                    |
| Test files      | `e2e/visual/tests/*.visual.ts`                       |
| Baseline images | `e2e/visual/snapshots/` (committed to git)           |
| Diff / results  | `e2e/visual/test-results/` (git-ignored)             |
| Pixel tolerance | 0.3 % (`maxDiffPixelRatio: 0.003`)                   |
| Browsers        | Desktop Chromium (1280x720), Mobile Chrome (Pixel 5) |

Each test navigates to a page, optionally toggles dark mode, and calls `toHaveScreenshot()`. On the first run (no baseline exists), Playwright saves the screenshot as the new baseline. Subsequent runs compare against the baseline and fail if the diff exceeds the threshold.

## Reviewing Diffs

When a test fails, Playwright generates three images in `e2e/visual/test-results/`:

- `*-actual.png` — what the test captured
- `*-expected.png` — the committed baseline
- `*-diff.png` — highlighted pixel differences

Open the HTML report for a side-by-side viewer:

```bash
npx playwright show-report --config e2e/visual/playwright.config.ts
```

## Dark Mode Coverage

Every page test includes a light mode and dark mode variant. Dark mode is activated by adding the `dark` class to `<html>`:

```ts
await page.evaluate(() => document.documentElement.classList.add("dark"));
```

## CI Integration (GitHub Actions)

Below is a reference workflow step. Add it to your CI pipeline when ready:

```yaml
# .github/workflows/visual-regression.yml (example)
name: Visual Regression

on:
  pull_request:
    paths:
      - "src/**"
      - "e2e/visual/**"

jobs:
  visual:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci
      - run: npx playwright install --with-deps chromium

      - run: npm run build
      - name: Start preview server
        run: npm run preview &

      - name: Wait for server
        run: npx wait-on http://localhost:4173 --timeout 30000

      - name: Run visual tests
        run: npm run test:visual

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: visual-diff
          path: e2e/visual/test-results/
          retention-days: 7
```

## Adding New Visual Tests

1. Create a new file in `e2e/visual/tests/`, e.g., `settings.visual.ts`
2. Follow the existing pattern: navigate, set theme, call `toHaveScreenshot()`
3. Run `npm run test:visual:update` to generate the initial baseline
4. Commit the new snapshot files in `e2e/visual/snapshots/`

## Troubleshooting

| Problem                     | Solution                                                        |
| --------------------------- | --------------------------------------------------------------- |
| Tests fail on first run     | Expected — run `npm run test:visual:update` to create baselines |
| Diffs on CI but not locally | Ensure CI uses the same OS/browser. Pin `ubuntu-latest`.        |
| Flaky 1-2 pixel diffs       | Increase `maxDiffPixelRatio` in `playwright.config.ts`          |
| Preview server not running  | Start `npm run preview` before running visual tests             |
