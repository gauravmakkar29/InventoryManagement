# IMS Gen2 — E2E QA Process

## Overview

End-to-end quality assurance process for the IMS Gen2 Hardware Lifecycle Management platform. Tests are authored using the IMS E2E framework (Java 17 / Maven / TestNG / Playwright) and executed via GitHub Actions — no local setup required.

---

## Process Flow

```
  STORY AUTHORED                    QA PLANNING                      CODE GENERATION
  ─────────────                    ───────────                      ───────────────
  ┌──────────────┐    /test-plan   ┌──────────────────┐  /generate-e2e  ┌────────────────┐
  │  Story N.M   │───────────────> │  QA Plan Issue   │───────────────> │  Java E2E Code │
  │  (GitHub #)  │                 │  (sub-issue of   │                 │  Page / Impl / │
  │              │                 │   parent story)  │                 │  Test class    │
  └──────────────┘                 └──────────────────┘                 └────────────────┘
        │                                │                                    │
        │                                │                                    │
        ▼                                ▼                                    ▼
  Status: In QA              Status: In Development                   QA Status: Tests Written
  (project board)            (project board)                          (project board)



  EXECUTION (GitHub Actions)
  ──────────────────────────

  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │                        E2E Nightly Regression Workflow                          │
  │                                                                                 │
  │   Trigger:  Nightly (2:00 UTC)  OR  Manual (workflow_dispatch from GitHub UI)   │
  │                                                                                 │
  │   ┌─────────┐  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌────────────────┐  │
  │   │ Checkout │─>│ Build App│─>│ Build E2E │─>│ Run Tests│─>│ Publish Report │  │
  │   │         │  │ (Vite)   │  │ (Maven)   │  │ (TestNG) │  │ (GitHub Pages) │  │
  │   └─────────┘  └──────────┘  └───────────┘  └──────────┘  └────────────────┘  │
  │                                                   │                             │
  │                                                   ▼                             │
  │                                          ┌─────────────────┐                    │
  │                                          │  Retry Analyzer  │                    │
  │                                          │  (auto-retry 1x) │                    │
  │                                          └─────────────────┘                    │
  │                                                   │                             │
  │                                        Pass on retry?                           │
  │                                          YES → Flaky (ignored)                  │
  │                                          NO  → Classify ▼                       │
  └─────────────────────────────────────────────────────────────────────────────────┘



  FAILURE CLASSIFICATION
  ──────────────────────

  ┌──────────────────────┐
  │   Test Still Fails   │
  │   (after 1 retry)    │
  └──────────┬───────────┘
             │
             ▼
  ┌──────────────────────┐
  │  Analyze Error Msgs  │
  └──────────┬───────────┘
             │
     ┌───────┼────────┬──────────────────┐
     ▼       ▼        ▼                  ▼
  ┌──────┐ ┌──────┐ ┌──────────┐  ┌────────────┐
  │GENUINEAPP  │SELECTOR │ENV/INFRA│  │FLAKY       │
  │ BUG  │ │ERROR │ │  ERROR   │  │(pass retry)│
  └──┬───┘ └──┬───┘ └────┬─────┘  └─────┬──────┘
     │        │           │              │
     ▼        ▼           ▼              ▼
  Check for  Log in      Log in        Ignored.
  duplicate  Job Summary Job Summary   Not reported.
  open issue (no issue)  (no issue)
     │
     ├── Existing open issue within 7 days?
     │     YES → Comment on existing issue
     │     NO  → Create new [E2E Bug] issue
     │
     ▼
  ┌─────────────────────────────────────┐
  │  Bug Issue (genuine failures only)  │
  │  - Classification summary           │
  │  - Related stories (from @MetaData) │
  │  - Link to ExtentReport             │
  │  - Triage checklist                 │
  └─────────────────────────────────────┘



  REPORTING
  ─────────

  ┌─────────────────────────────────────────────────────────────────┐
  │                      3 Ways to View Results                     │
  │                                                                 │
  │  1. JOB SUMMARY (GitHub Actions run page)                       │
  │     - Pass/fail counts, pass rate                               │
  │     - Failure classification table                              │
  │     - Visible immediately on the Actions tab                    │
  │                                                                 │
  │  2. EXTENTREPORT (GitHub Pages — interactive HTML)              │
  │     - Full test steps with numbered actions                     │
  │     - Screenshots on failure                                    │
  │     - Execution timeline and duration                           │
  │     - URL: https://gauravmakkar29.github.io/                    │
  │            InventoryManagement/e2e-reports/                      │
  │                                                                 │
  │  3. DOWNLOADABLE ARTIFACT (ZIP)                                 │
  │     - ExtentReport HTML + screenshots + surefire XML            │
  │     - 30-day retention                                          │
  │     - Available on the Actions run page → Artifacts section     │
  └─────────────────────────────────────────────────────────────────┘
```

---

## How to Run Tests from GitHub (No Local Setup)

### Step-by-step

1. Go to: **[Actions → E2E Nightly Regression](https://github.com/gauravmakkar29/InventoryManagement/actions/workflows/e2e-nightly.yml)**
2. Click the **"Run workflow"** button (top right)
3. Select options:

| Input      | Options                                                                                     | When to use                       |
| ---------- | ------------------------------------------------------------------------------------------- | --------------------------------- |
| **Suite**  | `smoke`                                                                                     | Quick sanity check (~3 min)       |
|            | `regression`                                                                                | Full suite, all modules (~15 min) |
|            | `module`                                                                                    | Run a single module only          |
| **Module** | `auth`, `dashboard`, `inventory`, `deployment`, `compliance`, `accountservice`, `analytics` | Only when suite = `module`        |

4. Click **"Run workflow"**
5. Wait for the run to complete
6. View results:
   - **Quick:** Click the run → scroll to **Job Summary**
   - **Detailed:** Visit the [ExtentReport on GitHub Pages](https://gauravmakkar29.github.io/InventoryManagement/docs/e2e-reports/)
   - **Offline:** Download the `e2e-{suite}-report` artifact

### Automated Runs

| Schedule              | Suite           | Trigger                    |
| --------------------- | --------------- | -------------------------- |
| **Daily 2:00 AM UTC** | Full regression | Automatic (cron)           |
| **On demand**         | Any suite       | Manual (workflow_dispatch) |

---

## Test Framework Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        ims-tests                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │  Pages   │  │  Impls   │  │  Macros  │  │ Test Classes │   │
│  │ (locators)│  │ (actions)│  │ (flows)  │  │ (assertions) │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                       ims-core-ui                                │
│  NovusGuiTestBase, Click, Type, Enter, Waiting, Verify,         │
│  Retrieve, Perform, LocateBy, BrowserScope                      │
├─────────────────────────────────────────────────────────────────┤
│                       ims-core-api                               │
│  ApiCore, Get, Post, Put, Delete, JsonUtil                      │
├─────────────────────────────────────────────────────────────────┤
│                        ims-core                                  │
│  Actor, Performable, Waiter, @MetaData, Assertions,             │
│  NovusReportingService (ExtentReports), NovusSoftAssert          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Test Suites

| Suite          | File                   | Tests                      | Purpose                                                  |
| -------------- | ---------------------- | -------------------------- | -------------------------------------------------------- |
| **Smoke**      | `smoke-suite.xml`      | SmokeTests + AuthTests     | Quick sanity — app loads, login works, sidebar navigates |
| **Regression** | `regression-suite.xml` | All 8 test classes         | Full coverage — all modules, all stories                 |
| **Module**     | `module-suite.xml`     | Dynamic (by `-DtestGroup`) | Targeted — run one module at a time                      |

---

## Module Coverage

| Module          | Prefix | Test IDs           | Test Count |
| --------------- | ------ | ------------------ | ---------- |
| Auth            | AUTH   | IMS-AUTH-001 → 017 | 17         |
| Dashboard       | DASH   | IMS-DASH-001 → 004 | 4          |
| Inventory       | INV    | IMS-INV-001 → 004  | 4          |
| Deployment      | DEP    | IMS-DEP-001 → 004  | 4          |
| Compliance      | CMP    | IMS-CMP-001 → 004  | 4          |
| Account Service | ACC    | IMS-ACC-001 → 004  | 4          |
| Analytics       | ANL    | IMS-ANL-001 → 004  | 4          |
| Smoke           | SM     | IMS-SM-001 → 003   | 3          |
| **Total**       |        |                    | **44**     |

---

## QA Workflow Commands (Claude Code)

| Command                   | What it does                                                |
| ------------------------- | ----------------------------------------------------------- |
| `/test-plan story-N.M`    | Generate QA test plan from story ACs + live app exploration |
| `/generate-e2e story-N.M` | Generate Java E2E test code from approved test plan         |

### Workflow

```
/test-plan story-N.M  →  Review & Approve  →  /generate-e2e story-N.M  →  Push & Run on GitHub
     (plan)                  (human)                (code)                   (CI/CD)
```

---

## GitHub Project Board Status Flow

```
Story authored → Sprint Ready → In Development → In Review → In QA → Done
                                                                │
                                                     ┌──────────┴──────────┐
                                                     │  QA Plan sub-issue  │
                                                     │  In Development     │
                                                     │       ↓             │
                                                     │  Tests Written      │
                                                     │       ↓             │
                                                     │  QA Status: Passing │
                                                     │       ↓             │
                                                     │  Story → Done       │
                                                     └─────────────────────┘
```

---

## Key URLs

| Resource            | URL                                                                                                                         |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Run E2E Tests       | [Actions → E2E Nightly Regression](https://github.com/gauravmakkar29/InventoryManagement/actions/workflows/e2e-nightly.yml) |
| ExtentReport (live) | [GitHub Pages — E2E Reports](https://gauravmakkar29.github.io/InventoryManagement/docs/e2e-reports/)                        |
| Project Board       | [IMS Gen2 HLM Platform](https://github.com/users/gauravmakkar29/projects/1)                                                 |
| E2E Framework Code  | [e2e/ims-e2e/](https://github.com/gauravmakkar29/InventoryManagement/tree/main/e2e/ims-e2e)                                 |
| Test Plans          | [Docs/epics/epic-{N}/test-plans/](https://github.com/gauravmakkar29/InventoryManagement/tree/main/Docs/epics)               |

---

## One-Time Setup (Required)

### Enable GitHub Pages (for ExtentReport hosting)

1. Go to **Settings → Pages**
2. Source: **Deploy from a branch**
3. Branch: **`gh-pages`** / folder: `/ (root)`
4. Save

After the first workflow run, reports will be live at the GitHub Pages URL above.
