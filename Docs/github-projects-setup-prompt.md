# GitHub Projects V2 — Automated Setup Prompt

> **Audience:** Any PDM, tech lead, or developer bootstrapping a new project.
>
> **How it works:** Copy the prompt from Section 2, fill in your config, paste into any
> AI IDE (Claude Code, Cursor, GitHub Copilot Chat). The AI executes all CLI commands.
> Then follow the Manual Steps guide (Section 3) for the 5 things GitHub has no API for.

---

## Jira ↔ GitHub Terminology Alignment

If you are migrating from Jira, use this mapping to translate concepts. Everything in
this guide uses the **GitHub** column — mentally swap in your Jira term as you read.

> **Working demo links below point at this repository** — `gauravmakkar29/InventoryManagement` + [Project #1](https://github.com/users/gauravmakkar29/projects/1). If you use this prompt to bootstrap a new project, the **Section 2 automation prompt** still uses `ORG` / `REPO` / `N` placeholders — that's intentional.

| Jira term          | GitHub equivalent                                          | Where to see it (demo link)                                                                                                                                                                                                                                     | Notes                                                                                                      |
| ------------------ | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Story / Task / Bug | **Issue** (with label)                                     | [Issues list](https://github.com/gauravmakkar29/InventoryManagement/issues) · [New Issue chooser](https://github.com/gauravmakkar29/InventoryManagement/issues/new/choose)                                                                                      | One issue type in GitHub; differentiate via `story` / `bug` / `task` labels                                |
| Epic               | **Milestone** (one per epic)                               | [Milestones](https://github.com/gauravmakkar29/InventoryManagement/milestones)                                                                                                                                                                                  | STEP 3 creates one milestone per `EPICS` entry. No `epic:N` labels (redundant with milestones).            |
| Sprint             | **Iteration** (Project field)                              | [Project board](https://github.com/users/gauravmakkar29/projects/1) · [Project Settings](https://github.com/users/gauravmakkar29/projects/1/settings) (Sprint field configured here)                                                                            | Configured on the project's Sprint field (Manual Step 1)                                                   |
| Release / Version  | **`Release` project field** (Build Cycle)                  | [Build Cycles view](https://github.com/users/gauravmakkar29/projects/1/views/5) · [Project Settings](https://github.com/users/gauravmakkar29/projects/1/settings) → Release field                                                                               | STEP 8a creates this single-select field with options `Build 1 — …` … `Build N — …`. Group any view by it. |
| Story Points       | **Story Points** (Number field)                            | [Insights (Velocity chart)](https://github.com/users/gauravmakkar29/projects/1/insights)                                                                                                                                                                        | Custom project field (Step 8b)                                                                             |
| Priority           | **Priority** (Single Select)                               | [Project board — group by Priority](https://github.com/users/gauravmakkar29/projects/1) · [Labels](https://github.com/gauravmakkar29/InventoryManagement/labels)                                                                                                | Custom project field + `P0`–`P3` labels (Step 8a)                                                          |
| Status / Workflow  | **Status** (Single Select)                                 | [Project board](https://github.com/users/gauravmakkar29/projects/1) · [Project Workflows](https://github.com/users/gauravmakkar29/projects/1/workflows)                                                                                                         | Backlog → Sprint Ready → In Development → In Review → In QA → Done → Blocked                               |
| Assignee           | **Assignee**                                               | [My open issues](https://github.com/issues/assigned) · [My assigned on this repo](https://github.com/gauravmakkar29/InventoryManagement/issues/assigned/gauravmakkar29)                                                                                         | Native on every issue                                                                                      |
| Components         | **Labels** (`infra`, `test`, …)                            | [Labels](https://github.com/gauravmakkar29/InventoryManagement/labels)                                                                                                                                                                                          | Use type/area labels to categorize                                                                         |
| Board              | **Project (V2) View**                                      | [Project home](https://github.com/users/gauravmakkar29/projects/1)                                                                                                                                                                                              | Board / Table / Roadmap layouts on the same project                                                        |
| JQL                | **Filter syntax** (`is:open label:bug iteration:@current`) | [Open bugs in this repo](https://github.com/gauravmakkar29/InventoryManagement/issues?q=is%3Aopen+label%3Abug) · [GitHub search syntax docs](https://docs.github.com/en/issues/tracking-your-work-with-issues/filtering-and-searching-issues-and-pull-requests) | Similar semantics, different grammar                                                                       |
| Parent link        | **Task list / Issue reference** (`#123`, `- [ ] #123`)     | [Issues list](https://github.com/gauravmakkar29/InventoryManagement/issues) · [Milestone 1 detail](https://github.com/gauravmakkar29/InventoryManagement/milestone/1)                                                                                           | Tracked via issue body checklists and milestone membership                                                 |
| Reports / Gadgets  | **Insights charts**                                        | [Project Insights](https://github.com/users/gauravmakkar29/projects/1/insights)                                                                                                                                                                                 | Sprint burn-up, velocity, bug trend, epic progress (Manual Step 4)                                         |
| Automation rules   | **Built-in Workflows**                                     | [Project Workflows](https://github.com/users/gauravmakkar29/projects/1/workflows)                                                                                                                                                                               | Auto-add to project, status on close/merge/review (Manual Step 3)                                          |
| Permission scheme  | **CODEOWNERS + Branch protection**                         | [Issue templates](https://github.com/gauravmakkar29/InventoryManagement/tree/main/.github/ISSUE_TEMPLATE) · [Branch rules](https://github.com/gauravmakkar29/InventoryManagement/settings/branches) _(admin-only)_                                              | Reviewer enforcement + merge gating                                                                        |

**Quick rule of thumb:** _Stories become Issues, Epics become Milestones, Sprints become
Iterations._ Everything else is a field, label, or native GitHub primitive.

### Demo walkthrough (open tabs in this order)

Mirrors a typical Jira walkthrough — Backlog → Create Story → Epics → Sprint Board → Reports → Automation.

1. [Issues list](https://github.com/gauravmakkar29/InventoryManagement/issues) — "this is our backlog"
2. [New Issue chooser](https://github.com/gauravmakkar29/InventoryManagement/issues/new/choose) — show story/bug/task templates
3. [Milestones](https://github.com/gauravmakkar29/InventoryManagement/milestones) — epics and releases with progress bars
4. [Project board #1](https://github.com/users/gauravmakkar29/projects/1) — sprint board, click through Board / Table / Roadmap tabs
5. [Project Insights](https://github.com/users/gauravmakkar29/projects/1/insights) — burn-up, velocity, bug trend
6. [Project Workflows](https://github.com/users/gauravmakkar29/projects/1/workflows) — automation rules
7. [Issue templates](https://github.com/gauravmakkar29/InventoryManagement/tree/main/.github/ISSUE_TEMPLATE) + [Branch protection](https://github.com/gauravmakkar29/InventoryManagement/settings/branches) — governance

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [The Automation Prompt](#2-the-automation-prompt)
3. [Manual Steps After Automation](#3-manual-steps-after-automation)
4. [Verification Checklist](#4-verification-checklist)
5. [Troubleshooting](#5-troubleshooting)

---

## 1. Prerequisites

Complete these **before** running the prompt.

### Required Tools

| Tool              | Install                                                     | Verify          |
| ----------------- | ----------------------------------------------------------- | --------------- |
| GitHub CLI (`gh`) | `winget install GitHub.cli` (Win) / `brew install gh` (Mac) | `gh --version`  |
| Git               | Should already be installed                                 | `git --version` |

`jq` is NOT required — the prompt avoids it.

### Authentication

```bash
gh auth login
# Choose: GitHub.com > HTTPS > Login with a web browser
# Verify:
gh auth status
```

**Required scopes:** `repo`, `project`, `read:org`. If missing:

```bash
gh auth refresh -s repo,project,read:org
```

### Permissions

You need these GitHub permissions:

- **Repo:** Write access (to create labels, milestones, push templates)
- **Org:** Member (to create org-level projects)
- **Project:** Admin on the project (automatic if you create it)

---

## 2. The Automation Prompt

Copy everything between the `---START---` and `---END---` markers below.
Edit the **CONFIGURATION** section, then paste the entire thing into your AI IDE.

---START---

````markdown
## Task: Bootstrap a complete GitHub Projects V2 setup

You are setting up a GitHub Projects V2 board for a software team. Execute every step
below using `gh` CLI commands and file writes. Run all commands yourself — do not ask
me to run anything manually.

**Rules:**

- If a command fails with "already exists" (HTTP 422 or "already exists" in stderr), skip it and continue.
- If `gh auth status` fails, tell me to run `gh auth login` and stop immediately.
- Quote all label names in commands (labels may contain spaces).
- Use `||true` after delete commands so failures don't halt the script.
- After all steps, print the summary and the manual-steps checklist.

---

### HIERARCHY THIS PROMPT CREATES (read first)

```
Release  (project field, single-select)  ──►  "Build 1 — Core Platform", "Build 2 — …"
    │
    └──►  Epic  (GitHub milestone, one per epic)  ──►  "Epic 1: Authentication", "Epic 2: …"
              │
              └──►  Story / Bug / Task  (GitHub issue, labelled + assigned to a milestone
                    + tagged with a Release value on the project board)
```

> **Why this shape:** `Release` groups multi-sprint "build cycles" (the outcome-driven waves of delivery). `Epic` milestones group issues within an epic and give you a built-in progress bar per epic. Stories and bugs are plain GitHub issues — they pick up their epic via their milestone and their build cycle via the `Release` field on the project board.

The four layers are the **selling point of this prompt**. Field names, option names, and labels below are sensible defaults — adapt them freely. **Do not change the four-layer hierarchy** (Release → Epic → Issue + field/milestone/label wiring) unless you want a different workflow.

### CONFIGURATION

Replace every placeholder below with your actual values.

```
ORG=your-org
REPO=your-org/your-repo
PROJECT_NAME=My Project Board
PROJECT_DESCRIPTION=One-line description of your project

# --- Layer 1: Build Cycles (become Release-field options on the project) ---
BUILD_CYCLES:
  1 = Core Platform              # foundational auth, CRUD, baseline workflows
  2 = Advanced Features          # analytics, search, richer integrations
  3 = Enterprise Hardening       # security, infra, observability
  4 = Template & Infrastructure  # extract template, external integrations
  5 = Quality & Resilience       # refactors, perf, reliability
  6 = Production Ready           # design-system polish, GA

# --- Layer 2: Epics (become GitHub milestones, one per entry) ---
EPICS:
  1 = Project Bootstrap & Auth
  2 = Core Inventory CRUD
  3 = Location & Hierarchy
  4 = Work Order System
  5 = Firmware Management

# --- Layer 3/4: Issues (stories + bugs + tasks) are created by humans after setup ---

# --- Optional: sprint cadence, tracked as a Date field on the project ---
SPRINT_START_DATE=2026-05-01
SPRINT_DURATION_WEEKS=2

TEAM:
  leads    = lead-username
  frontend = dev1, dev2
  infra    = devops1
  qa       = qa1
```

---

### STEP 0 — Pre-flight checks

Run both commands. If either fails, stop and tell me what went wrong.

```bash
gh auth status
```

```bash
gh repo view "REPO" --json name -q ".name"
```

---

### STEP 1 — Delete default labels

Remove GitHub's default labels that clutter the list. Run each as a separate command.
Failures are OK (label may not exist).

```bash
gh label delete "good first issue" --repo "REPO" --yes || true
gh label delete "help wanted" --repo "REPO" --yes || true
gh label delete "invalid" --repo "REPO" --yes || true
gh label delete "question" --repo "REPO" --yes || true
gh label delete "wontfix" --repo "REPO" --yes || true
```

---

### STEP 2 — Create all labels

Run each `gh label create` command below. Use `--force` flag on every command so it
updates the label if it already exists (makes this step idempotent).

Replace `REPO` with the actual repo value from config.

**Type labels:**

```bash
gh label create "story" --color "1D76DB" --description "User story with acceptance criteria" --repo "REPO" --force
gh label create "bug" --color "D73A4A" --description "Something is broken" --repo "REPO" --force
gh label create "enhancement" --color "A2EEEF" --description "Improvement to existing feature" --repo "REPO" --force
gh label create "tech-debt" --color "F9D0C4" --description "Refactoring or code quality improvement" --repo "REPO" --force
gh label create "infra" --color "BFD4F2" --description "Infrastructure / Terraform / DevOps" --repo "REPO" --force
gh label create "task" --color "E4E669" --description "General task or chore" --repo "REPO" --force
gh label create "documentation" --color "0075CA" --description "Documentation only changes" --repo "REPO" --force
gh label create "test" --color "C5DEF5" --description "Test-only change (unit, E2E, perf)" --repo "REPO" --force
```

**Priority labels:**

```bash
gh label create "P0-critical" --color "B60205" --description "Drop everything, fix immediately" --repo "REPO" --force
gh label create "P1-high" --color "D93F0B" --description "Must fix this sprint" --repo "REPO" --force
gh label create "P2-medium" --color "FBCA04" --description "Plan for next sprint" --repo "REPO" --force
gh label create "P3-low" --color "0E8A16" --description "Nice to have, backlog" --repo "REPO" --force
```

> **No `epic:N` labels.** In this hierarchy, an epic is a **milestone** (see STEP 3), not a label. An issue picks up its epic by assigning the milestone. That gives you free progress tracking, issue counts, and close/open stats per epic — you don't need a parallel label.

**Status / process labels:**

```bash
gh label create "qa-plan" --color "C5DEF5" --description "QA test plan approved" --repo "REPO" --force
gh label create "e2e-coverage" --color "C5DEF5" --description "E2E tests written and passing" --repo "REPO" --force
gh label create "needs-review" --color "FBCA04" --description "Waiting for code review" --repo "REPO" --force
gh label create "blocked" --color "B60205" --description "Blocked by external dependency" --repo "REPO" --force
gh label create "duplicate" --color "CFD3D7" --description "Duplicate of another issue" --repo "REPO" --force
```

**Size labels:**

```bash
gh label create "XS" --color "C2E0C6" --description "Trivial (1 point) — config change, typo fix" --repo "REPO" --force
gh label create "S" --color "C2E0C6" --description "Small (2 points) — simple feature or fix" --repo "REPO" --force
gh label create "M" --color "FEF2C0" --description "Medium (3-5 points) — standard story" --repo "REPO" --force
gh label create "L" --color "F9D0C4" --description "Large (8 points) — complex feature" --repo "REPO" --force
gh label create "XL" --color "E99695" --description "Extra Large (13 points) — should be broken down" --repo "REPO" --force
```

**E2E / CI labels:**

```bash
gh label create "nightly-failure" --color "D73A4A" --description "Failed in nightly E2E run" --repo "REPO" --force
gh label create "smoke-failure" --color "D93F0B" --description "Failed in smoke suite" --repo "REPO" --force
gh label create "regression-failure" --color "FBCA04" --description "Failed in regression suite" --repo "REPO" --force
```

**After running all commands, print:** "Created N labels on REPO."

---

### STEP 3 — Create Epic milestones

For **each entry in the `EPICS` config**, create one GitHub milestone. The milestone is how an issue declares "I belong to this epic" — GitHub gives you a free per-epic progress bar, open/closed count, and milestone detail page as a result.

Run one command per epic (replace `REPO`, titles, and descriptions with values from the `EPICS` config). Milestones do not require a due date; omit `due_on` if you don't have one, or populate it per epic.

```bash
gh api repos/REPO/milestones --method POST \
  --field title="Epic 1: Project Bootstrap & Auth" \
  --field description="Foundational authentication, user management, and app shell"
```

```bash
gh api repos/REPO/milestones --method POST \
  --field title="Epic 2: Core Inventory CRUD" \
  --field description="Core device inventory management — create, read, update, delete, search, filter"
```

```bash
gh api repos/REPO/milestones --method POST \
  --field title="Epic 3: Location & Hierarchy" \
  --field description="Geographic and organizational hierarchy — map view, filters, drill-down"
```

(Continue for every entry in the `EPICS` config. One command per epic.)

If a milestone already exists (HTTP 422), skip it and continue.

> **No sprint or release milestones here.** Sprint cadence is tracked on the project via the `Sprint Start` date field (STEP 8). Build cycles are the `Release` field (also STEP 8). Milestones are exclusively for epics — one milestone per epic, full stop.

**After running all commands, print:** "Created N epic milestones."

---

### STEP 4 — Create issue templates

Write these files to the repo. If the file already exists, **skip it** and print a
notice — do not overwrite existing templates.

**4a. Write `.github/ISSUE_TEMPLATE/story.yml`**

> No Epic dropdown in this template — the issue's **milestone** (set after creation) defines its epic. That avoids an always-outdated enum in two places.

```yaml
name: Story
description: Create a new user story
labels: ["story"]
body:
  - type: input
    id: story-id
    attributes:
      label: Story ID
      description: "Unique story identifier (e.g., S-1.1)"
      placeholder: "S-X.Y"
    validations:
      required: true

  - type: input
    id: story-points
    attributes:
      label: Story Points
      description: "Estimated effort (1, 2, 3, 5, 8, 13)"
      placeholder: "3"
    validations:
      required: true

  - type: textarea
    id: user-story
    attributes:
      label: User Story
      description: "As a [role], I want [capability] so that [benefit]."
      placeholder: "As a technician, I want to scan a device barcode so that I can quickly pull up its details."
    validations:
      required: true

  - type: textarea
    id: acceptance-criteria
    attributes:
      label: Acceptance Criteria
      description: "Checkboxes for each acceptance criterion"
      value: |
        - [ ] Criterion 1
        - [ ] Criterion 2
        - [ ] Criterion 3
    validations:
      required: true

  - type: textarea
    id: e2e-coverage
    attributes:
      label: E2E Test Coverage
      description: "List the E2E test scenarios that should cover this story"
      placeholder: |
        - e2e/specs/inventory/create-device.spec.ts
        - Verify form validation
        - Verify success notification
    validations:
      required: false

  - type: textarea
    id: definition-of-done
    attributes:
      label: Definition of Done
      description: "Checklist for completeness"
      value: |
        - [ ] Code reviewed and approved
        - [ ] Unit tests passing (>= 85% coverage)
        - [ ] E2E tests passing
        - [ ] No lint errors
        - [ ] Accessibility checked (WCAG 2.1 AA)
        - [ ] Documentation updated (if applicable)
    validations:
      required: false
```

**4b. Write `.github/ISSUE_TEMPLATE/bug.yml`**

```yaml
name: Bug Report
description: Report a bug or defect
labels: ["bug"]
body:
  - type: input
    id: parent-story
    attributes:
      label: Parent Story
      description: "Reference the related story issue (e.g., #42)"
      placeholder: "#"
    validations:
      required: false

  - type: dropdown
    id: severity
    attributes:
      label: Severity
      description: How severe is this bug?
      options:
        - "Critical — System unusable / data loss"
        - "High — Major feature broken, no workaround"
        - "Medium — Feature impaired, workaround exists"
        - "Low — Minor issue, cosmetic"
    validations:
      required: true

  - type: dropdown
    id: browser
    attributes:
      label: Browser
      description: Which browser(s) are affected?
      multiple: true
      options:
        - Chrome
        - Firefox
        - Safari / WebKit
        - Edge
        - All
    validations:
      required: true

  - type: textarea
    id: description
    attributes:
      label: Description
      description: "Clear description of the bug"
      placeholder: "When I click X, Y happens instead of Z."
    validations:
      required: true

  - type: textarea
    id: steps-to-reproduce
    attributes:
      label: Steps to Reproduce
      description: "Numbered steps to reproduce the bug"
      value: |
        1. Go to '...'
        2. Click on '...'
        3. Scroll down to '...'
        4. See error
    validations:
      required: true

  - type: textarea
    id: evidence
    attributes:
      label: Evidence
      description: "Screenshots, console errors, network traces, or E2E test output"
      placeholder: "Paste screenshots or error logs here"
    validations:
      required: false

  - type: dropdown
    id: environment
    attributes:
      label: Environment
      description: Which environment did this occur in?
      options:
        - Local development
        - Dev (AWS)
        - Staging (AWS)
        - Production (AWS)
    validations:
      required: true
```

**4c. Write `.github/ISSUE_TEMPLATE/task.yml`**

```yaml
name: Task
description: Technical task, chore, or tech debt item
labels: ["task"]
body:
  - type: dropdown
    id: category
    attributes:
      label: Category
      description: What kind of task is this?
      options:
        - "Tech Debt — Refactoring or cleanup"
        - "Infrastructure — CI/CD, Terraform, DevOps"
        - "Documentation — Docs, ADRs, guides"
        - "Testing — Test coverage, framework improvements"
        - "Dependency — Library updates, security patches"
    validations:
      required: true

  - type: textarea
    id: description
    attributes:
      label: Description
      description: "What needs to be done and why?"
    validations:
      required: true

  - type: textarea
    id: acceptance-criteria
    attributes:
      label: Done When
      description: "How do we know this is complete?"
      value: |
        - [ ] Criterion 1
        - [ ] Criterion 2
    validations:
      required: true
```

**4d. Write `.github/ISSUE_TEMPLATE/config.yml`**

Replace ORG and REPO with actual values:

```yaml
blank_issues_enabled: false
contact_links:
  - name: Project Board
    url: https://github.com/orgs/ORG/projects/1
    about: View the project board for current sprint status
  - name: Documentation
    url: https://github.com/REPO/tree/main/Docs
    about: Browse project documentation and specs
```

---

### STEP 5 — Create PR template

Write `.github/PULL_REQUEST_TEMPLATE.md`:

```markdown
## Summary

<!-- 1-3 sentences: what changed and why -->

## Changes

-
-
-

## Testing

- [ ] Unit tests passing (>= 85% coverage on changed files)
- [ ] E2E tests passing (if UI change)
- [ ] Manual smoke test completed
- [ ] No lint errors
- [ ] Build succeeds

## Accessibility

- [ ] Keyboard navigation works
- [ ] Screen reader tested (if new UI)
- [ ] Color contrast meets WCAG 2.1 AA

## Screenshots

<!-- Before/after screenshots for UI changes. Delete if not applicable. -->

## Related Issues

Closes #
```

---

### STEP 6 — Create CODEOWNERS

Write `.github/CODEOWNERS` using the TEAM config values. Replace placeholders with
actual GitHub usernames:

```
# Default — team leads review everything not covered below
*                           @lead-username

# Frontend
src/                        @dev1 @dev2

# Infrastructure
infra/                      @devops1
.github/workflows/          @devops1 @lead-username

# E2E tests
e2e/                        @qa1

# Documentation
Docs/                       @lead-username
```

---

### STEP 7 — Create the GitHub Project

```bash
gh project create --owner "ORG" --title "PROJECT_NAME"
```

After this command succeeds, retrieve the project number:

```bash
gh project list --owner "ORG" --format json
```

Find the project with the matching title in the JSON output and note its `number` field.
You will need this number for Step 8.

---

### STEP 8 — Create custom fields on the project

Use the project number from Step 7 in every command below. Replace `PROJECT_NUMBER`. The project's **node ID** (starts with `PVT_`) is needed for all GraphQL mutations — get it from `gh project list --owner "ORG" --format json` and use it as `PROJECT_ID` below.

> **Hierarchy reminder.** The two fields that carry the hierarchy are **`Release`** (Build Cycle — 8c below) and the **milestone** (Epic — already created in STEP 3). Every other field in this step is a refinement that teams can tune.

**8a. `Release` field (Single Select — THIS IS THE BUILD CYCLE FIELD)**

This is the most important field in the whole setup. Each option is a build cycle from `BUILD_CYCLES` config.

```bash
gh project field-create PROJECT_NUMBER --owner "ORG" --name "Release" --data-type "SINGLE_SELECT"
```

Retrieve the field ID (`gh project field-list PROJECT_NUMBER --owner "ORG" --format json`), then add the build-cycle options:

```bash
gh api graphql -f query='
mutation($projectId: ID!, $fieldId: ID!) {
  updateProjectV2Field(input: {
    projectId: $projectId
    fieldId: $fieldId
    singleSelectOptions: [
      {name: "Build 1 — Core Platform",             color: BLUE,   description: "Foundational auth + core CRUD"}
      {name: "Build 2 — Advanced Features",         color: GREEN,  description: "Analytics, search, integrations"}
      {name: "Build 3 — Enterprise Hardening",      color: PURPLE, description: "Security, infra, observability"}
      {name: "Build 4 — Template & Infrastructure", color: ORANGE, description: "Reusable template + provider plug-ins"}
      {name: "Build 5 — Quality & Resilience",      color: YELLOW, description: "Refactors, perf, reliability"}
      {name: "Build 6 — Production Ready",          color: GRAY,   description: "Design-system polish + GA"}
    ]
  }) {
    projectV2Field {
      ... on ProjectV2SingleSelectField { id name }
    }
  }
}' -f projectId="PROJECT_ID" -f fieldId="RELEASE_FIELD_ID"
```

Generate one option per `BUILD_CYCLES` config entry — do not skip this step.

**8b. `Priority` field (Single Select)**

```bash
gh project field-create PROJECT_NUMBER --owner "ORG" --name "Priority" --data-type "SINGLE_SELECT"
```

```bash
gh api graphql -f query='
mutation($projectId: ID!, $fieldId: ID!) {
  updateProjectV2Field(input: {
    projectId: $projectId
    fieldId: $fieldId
    singleSelectOptions: [
      {name: "Critical", color: RED,    description: "Drop everything"}
      {name: "High",     color: ORANGE, description: "Must fix this sprint"}
      {name: "Medium",   color: YELLOW, description: "Plan for next sprint"}
      {name: "Low",      color: GREEN,  description: "Nice to have"}
    ]
  }) {
    projectV2Field {
      ... on ProjectV2SingleSelectField { id name }
    }
  }
}' -f projectId="PROJECT_ID" -f fieldId="PRIORITY_FIELD_ID"
```

**8c. `Story Points` field (Number)**

```bash
gh project field-create PROJECT_NUMBER --owner "ORG" --name "Story Points" --data-type "NUMBER"
```

**8d. `Sprint Start` field (Date) — optional sprint cadence tracker**

Many teams prefer a Date field over GitHub's Iteration field because it's simpler and works identically across every view. Pick one or the other.

```bash
gh project field-create PROJECT_NUMBER --owner "ORG" --name "Sprint Start" --data-type "DATE"
```

> **If you prefer GitHub's built-in Iteration field instead** (sprints are predefined and auto-advance), create `--name "Sprint" --data-type "ITERATION"`. Iteration start-date and duration can only be set in the UI after creation (see Manual Steps).

**8e. `Status` field options (auto-created — just update the options)**

```bash
gh api graphql -f query='
mutation($projectId: ID!, $fieldId: ID!) {
  updateProjectV2Field(input: {
    projectId: $projectId
    fieldId: $fieldId
    singleSelectOptions: [
      {name: "Backlog",        color: GRAY,   description: "Not yet planned"}
      {name: "Sprint Ready",   color: BLUE,   description: "Groomed and estimated"}
      {name: "In Development", color: YELLOW, description: "Currently being coded"}
      {name: "In Review",      color: ORANGE, description: "PR open, awaiting review"}
      {name: "In QA",          color: PURPLE, description: "Merged, being tested"}
      {name: "Done",           color: GREEN,  description: "Accepted and deployed"}
      {name: "Blocked",        color: RED,    description: "Cannot proceed"}
    ]
  }) {
    projectV2Field {
      ... on ProjectV2SingleSelectField { id name }
    }
  }
}' -f projectId="PROJECT_ID" -f fieldId="STATUS_FIELD_ID"
```

**8f. `QA Status` field (Single Select — optional but recommended)**

Adds lightweight QA visibility alongside the main `Status` field, so PM can see test progress without opening every issue.

```bash
gh project field-create PROJECT_NUMBER --owner "ORG" --name "QA Status" --data-type "SINGLE_SELECT"
```

```bash
gh api graphql -f query='
mutation($projectId: ID!, $fieldId: ID!) {
  updateProjectV2Field(input: {
    projectId: $projectId
    fieldId: $fieldId
    singleSelectOptions: [
      {name: "Not Started",   color: GRAY,  description: "No tests written yet"}
      {name: "Tests Written", color: BLUE,  description: "Tests exist, not yet run"}
      {name: "Passing",       color: GREEN, description: "Tests green"}
      {name: "Failing",       color: RED,   description: "Tests red — blocker"}
    ]
  }) {
    projectV2Field {
      ... on ProjectV2SingleSelectField { id name }
    }
  }
}' -f projectId="PROJECT_ID" -f fieldId="QA_STATUS_FIELD_ID"
```

**8g. `T-Shirt Size` field (Single Select — optional, complements Story Points)**

```bash
gh project field-create PROJECT_NUMBER --owner "ORG" --name "T-Shirt Size" --data-type "SINGLE_SELECT"
```

```bash
gh api graphql -f query='
mutation($projectId: ID!, $fieldId: ID!) {
  updateProjectV2Field(input: {
    projectId: $projectId
    fieldId: $fieldId
    singleSelectOptions: [
      {name: "XS", color: GREEN,  description: "Trivial (~1 pt)"}
      {name: "S",  color: GREEN,  description: "Small (~2 pts)"}
      {name: "M",  color: YELLOW, description: "Medium (~3–5 pts)"}
      {name: "L",  color: ORANGE, description: "Large (~8 pts)"}
      {name: "XL", color: RED,    description: "Extra large (~13+ pts) — break down"}
    ]
  }) {
    projectV2Field {
      ... on ProjectV2SingleSelectField { id name }
    }
  }
}' -f projectId="PROJECT_ID" -f fieldId="TSHIRT_FIELD_ID"
```

> **No `Epic` field.** Epic is the issue's milestone (STEP 3) — adding a parallel single-select Epic field causes drift. Remove it if it already exists.

---

### STEP 9 — Set branch protection on main

```bash
gh api repos/REPO/branches/main/protection --method PUT \
  --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["build-and-test"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
```

If this fails with 403 (insufficient permissions), print:
"Branch protection requires admin access. See manual steps."

---

### STEP 10 — Commit and push all new files

Stage only the files created in this session:

```bash
git add .github/ISSUE_TEMPLATE/story.yml .github/ISSUE_TEMPLATE/bug.yml .github/ISSUE_TEMPLATE/task.yml .github/ISSUE_TEMPLATE/config.yml .github/PULL_REQUEST_TEMPLATE.md .github/CODEOWNERS
git commit -m "chore: bootstrap GitHub Projects setup — templates, labels, CODEOWNERS"
git push
```

---

### STEP 11 — Verify setup

Run these verification commands and print the results:

```bash
echo "=== Labels ==="
gh label list --repo "REPO" --limit 100

echo "=== Milestones ==="
gh api repos/REPO/milestones --jq '.[].title'

echo "=== Project ==="
gh project list --owner "ORG"

echo "=== Project Fields ==="
gh project field-list PROJECT_NUMBER --owner "ORG"
```

---

### STEP 12 — Print summary and manual steps

After ALL automated steps complete, print this exact output:

```
================================================================
  SETUP COMPLETE — Automated Steps
================================================================

  Hierarchy wired:    Release → Epic (milestone) → Issue
  Labels created:     ~25 (type, priority, status, size, E2E)
  Milestones created: N epic milestones (one per EPICS entry)
  Issue templates:    story.yml, bug.yml, task.yml, config.yml
  PR template:        PULL_REQUEST_TEMPLATE.md
  CODEOWNERS:         .github/CODEOWNERS
  Project:            PROJECT_NAME with fields:
                        - Status        (7 options)
                        - Release       (N Build Cycle options)
                        - Priority      (4 options)
                        - Story Points  (number)
                        - Sprint Start  (date)
                        - QA Status     (4 options)
                        - T-Shirt Size  (5 options)
  Branch protection:  main (require PR + review + status checks)

================================================================
  MANUAL STEPS REQUIRED — Complete in GitHub web UI
  (GitHub has no API for these — they must be done by hand)
================================================================

  See the "Manual Steps After Automation" section in:
  Docs/github-projects-setup-prompt.md (Section 3)

================================================================
```
````

---END---

---

## 3. Manual Steps After Automation

These tasks **cannot be automated** because GitHub provides no API for them.
Complete them in the GitHub web UI after running the prompt above.

**Estimated time:** 15-20 minutes total.

---

### Manual Step 1: (Optional) Configure Sprint Iteration (skip if using Sprint Start Date)

If you chose the **Date** variant in STEP 8d, skip this — there's nothing to configure.

If you chose the **Iteration** variant instead, iteration dates must be set in the UI:

1. Open your project: `https://github.com/users/ORG/projects/N`
2. Three-dot menu (top-right) → **Settings**
3. Sidebar → **Sprint** field → set **Duration** (e.g., 2 weeks) + **Start date** (matches `SPRINT_START_DATE` from config)
4. Click **Save changes**

**How to verify:** The Sprint field shows a dropdown with dated iterations; filter `iteration:@current` returns items in today's sprint.

---

### Manual Step 2: Create Project Views (5 min)

Create these views — **the `Build Cycles` view is the one that proves your hierarchy is wired correctly.**

For each view below:

1. Click the **"+"** tab at the top of the project board
2. Select the **Layout** type (Table, Board, or Roadmap)
3. Click the tab name to rename it
4. Apply the **Filter** using the filter bar at the top
5. Set **Group By** from the view menu (funnel icon)
6. The view auto-saves

| #   | View Name        | Layout  | Filter                                | Group By      | Purpose                                                     |
| --- | ---------------- | ------- | ------------------------------------- | ------------- | ----------------------------------------------------------- |
| 1   | **Build Cycles** | Table   | (all items)                           | **Release**   | **The hero view — proves the hierarchy.** One row per build |
| 2   | Current Sprint   | Board   | `"Sprint Start":@current`             | Status        | Daily standup board                                         |
| 3   | Backlog          | Table   | `status:Backlog`                      | **Milestone** | Backlog grooming by epic                                    |
| 4   | My Work          | Table   | `assignee:@me is:open`                | Status        | Personal task list                                          |
| 5   | By Epic          | Table   | `is:open`                             | **Milestone** | Cross-epic visibility (milestone = epic)                    |
| 6   | Bug Triage       | Table   | `label:bug is:open`                   | Priority      | Bug management                                              |
| 7   | Roadmap          | Roadmap | (all items)                           | Milestone     | Stakeholder timeline                                        |
| 8   | Done This Sprint | Table   | `"Sprint Start":@current status:Done` | (none)        | Sprint review prep                                          |

> **Grouping by Release (view #1)** is the single best demo-able artifact from this prompt. It proves Build Cycle → Epic (milestone) → Issue is visible end-to-end.

**How to verify:** Open view #1 — you should see one row/group per build cycle. Expand Build 1 → you see issues assigned there. Click an issue → it has a milestone (the epic) and a Release value (the build).

---

### Manual Step 3: Enable Built-In Workflows (3 min)

1. Open the project board
2. Click **three-dot menu** (top-right) > **Settings**
3. Click **Workflows** in the left sidebar
4. For each workflow below, click it, toggle **On**, configure the action, and click **Save**:

| #   | Workflow               | Toggle | Action                                                                    |
| --- | ---------------------- | ------ | ------------------------------------------------------------------------- |
| 1   | Auto-add to project    | **On** | Repository: your repo. Filter: `label:story,bug`. Set Status: **Backlog** |
| 2   | Item closed            | **On** | Set Status to **Done**                                                    |
| 3   | Item reopened          | **On** | Set Status to **Sprint Ready**                                            |
| 4   | Pull request merged    | **On** | Set Status to **Done**                                                    |
| 5   | Code review approved   | **On** | Set Status to **In QA**                                                   |
| 6   | Code changes requested | **On** | Set Status to **In Development**                                          |

**How to verify:** Create a test issue with the `story` label. It should automatically
appear on the project board in the "Backlog" column. Close it — it should move to "Done."

---

### Manual Step 4: Create Insights Charts (5 min)

1. Open the project board
2. Click the **Insights** tab (bar-chart icon, next to the view tabs)
3. For each chart below, click **New chart**, configure it, and click **Save**:

| #   | Chart Name         | Type       | X-Axis        | Y-Axis              | Group By | Filter                    |
| --- | ------------------ | ---------- | ------------- | ------------------- | -------- | ------------------------- |
| 1   | **Build Progress** | Current    | **Release**   | Count of items      | Status   | (none) — the hero chart   |
| 2   | Sprint Burn-Up     | Historical | Time          | Count of items      | Status   | `"Sprint Start":@current` |
| 3   | Velocity by Build  | Current    | **Release**   | Sum of Story Points | (none)   | `status:Done`             |
| 4   | Status Overview    | Current    | Status        | Count of items      | (none)   | (none)                    |
| 5   | Bug Trend          | Historical | Time          | Count of items      | Priority | `label:bug`               |
| 6   | Epic Progress      | Current    | **Milestone** | Count of items      | Status   | (none)                    |
| 7   | Team Workload      | Current    | Assignee      | Count of items      | Status   | `is:open`                 |

**How to verify:** Each chart should render. The Sprint Burn-Up will be empty until
issues are assigned to the current iteration.

---

### Manual Step 5: Verify Branch Protection (1 min)

If the automated branch protection command (Step 9) succeeded, verify it:

1. Go to: `Repo > Settings > Branches > Branch protection rules`
2. Click the rule for `main`
3. Confirm these are checked:
   - [x] Require a pull request before merging
   - [x] Require approvals (1)
   - [x] Require review from Code Owners
   - [x] Require status checks to pass (build-and-test)
   - [x] Do not allow force pushes
   - [x] Do not allow deletions

If the automated command failed (403), create the rule manually by checking the boxes above.

---

## 4. Verification Checklist

After completing both automated AND manual steps, use this checklist to confirm
everything is set up correctly.

### Quick verification commands

```bash
# Count labels (expect ~25)
gh label list --repo "REPO" --limit 100 | wc -l

# Count milestones (expect N — one per epic)
gh api repos/REPO/milestones | python -c "import sys,json; print(len(json.load(sys.stdin)))"

# Verify project exists
gh project list --owner "ORG"

# Verify templates exist
ls .github/ISSUE_TEMPLATE/
# Expected: story.yml  bug.yml  task.yml  config.yml
```

### Full checklist

| Category         | Item                                                                                     | Check |
| ---------------- | ---------------------------------------------------------------------------------------- | ----- |
| **Hierarchy**    | `Build Cycles` view groups issues by `Release` with 6 groups (one per Build)             | [ ]   |
| **Hierarchy**    | Each epic has a milestone (open `/milestones`)                                           | [ ]   |
| **Hierarchy**    | A test issue can be created, assigned to an epic milestone, and tagged with a Release    | [ ]   |
| **Labels**       | Type labels exist (story, bug, enhancement, tech-debt, …)                                | [ ]   |
| **Labels**       | Size labels exist (XS, S, M, L, XL)                                                      | [ ]   |
| **Labels**       | Status/process labels exist (qa-plan, blocked, needs-review, …)                          | [ ]   |
| **Labels**       | No `epic:N` labels (epics are milestones, not labels)                                    | [ ]   |
| **Milestones**   | One milestone per epic, named `Epic N: Title`                                            | [ ]   |
| **Templates**    | Story template renders in "New Issue" chooser (no Epic dropdown)                         | [ ]   |
| **Templates**    | Bug template renders in "New Issue" chooser                                              | [ ]   |
| **Templates**    | Task template renders in "New Issue" chooser                                             | [ ]   |
| **Templates**    | Blank issues disabled (config.yml)                                                       | [ ]   |
| **Templates**    | PR template renders on new PR creation                                                   | [ ]   |
| **CODEOWNERS**   | File exists and has correct team assignments                                             | [ ]   |
| **Project**      | Project visible at owner level                                                           | [ ]   |
| **Project**      | `Release` field with N Build Cycle options (matches `BUILD_CYCLES` config)               | [ ]   |
| **Project**      | `Status` field has 7 options (Backlog … Blocked)                                         | [ ]   |
| **Project**      | `Priority` field has 4 options (Critical / High / Medium / Low)                          | [ ]   |
| **Project**      | `Story Points` field exists (Number type)                                                | [ ]   |
| **Project**      | `Sprint Start` field exists (Date type) — OR Sprint (Iteration)                          | [ ]   |
| **Project**      | `QA Status` field has 4 options                                                          | [ ]   |
| **Project**      | `T-Shirt Size` field has 5 options                                                       | [ ]   |
| **Project**      | **No `Epic` single-select field** (epic is the milestone)                                | [ ]   |
| **Views**        | 8 views created — Build Cycles #1, Sprint, Backlog, My Work, By Epic, Bug, Roadmap, Done | [ ]   |
| **Workflows**    | 6 workflows enabled and configured                                                       | [ ]   |
| **Charts**       | 7 Insights charts created (Build Progress = the hero chart)                              | [ ]   |
| **Branch rules** | main branch requires PR + review + CI                                                    | [ ]   |

---

## 5. Troubleshooting

### "Resource not accessible by integration" (403)

Your `gh` token is missing scopes. Run:

```bash
gh auth refresh -s repo,project,read:org,admin:org
```

### "Validation Failed" (422) on milestone creation

The milestone already exists. This is safe to ignore — the prompt handles it.

### "Could not resolve to a ProjectV2" on field-create

The project number is wrong. Re-check with:

```bash
gh project list --owner "ORG"
```

Use the **number** column, not the ID.

### Labels not appearing on the project board

Labels are repo-level, not project-level. They appear on issues, not directly on the
board. Use `label:X` in the board's filter bar to see them.

### Sprint field shows no iterations

You need to complete Manual Step 1 (Configure Sprint Iterations). The API cannot set
iteration dates — only the UI can.

### CODEOWNERS not enforced on PRs

Branch protection must be configured with "Require review from Code Owners" checked.
See Manual Step 5.

### GraphQL mutation fails for field options

The `updateProjectV2Field` mutation requires the project's **node ID** (starts with
`PVT_`), not the project number. Get it from:

```bash
gh project list --owner "ORG" --format json
```

Look for the `id` field in the JSON output.
