# GitHub Projects V2 — Complete Guide (Zero to Hero)

> A practical, step-by-step guide for managing a full project board on GitHub Projects V2.
> Written for teams migrating from JIRA or starting project management from scratch.

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Creating a Project](#2-creating-a-project)
3. [Setting Up Labels](#3-setting-up-labels)
4. [Creating Milestones](#4-creating-milestones)
5. [Issue Templates](#5-issue-templates)
6. [Creating Issues (Stories, Bugs, Tasks)](#6-creating-issues-stories-bugs-tasks)
7. [Project Board Views](#7-project-board-views)
8. [Custom Fields](#8-custom-fields)
9. [Workflows and Automation](#9-workflows-and-automation)
10. [Charts and Insights](#10-charts-and-insights)
11. [Sprint Planning Workflow](#11-sprint-planning-workflow)
12. [Best Practices](#12-best-practices)
13. [CLI (gh) Commands Reference](#13-cli-gh-commands-reference)
14. [IMS Gen2 Project Setup (Real Example)](#14-ims-gen2-project-setup-real-example)

---

## 1. Introduction

### What Is GitHub Projects V2?

GitHub Projects V2 is GitHub's built-in project management tool, released in 2022 as a replacement for the legacy "Projects (Classic)" boards. It provides spreadsheet-like tables, Kanban boards, roadmap timelines, custom fields, automation, and charting — all natively integrated with GitHub Issues and Pull Requests.

Unlike external tools, Projects V2 lives where your code lives. Every issue, PR, branch, and commit is automatically linked. There is no sync lag, no webhook plumbing, and no separate login.

### How It Compares to JIRA

If you are coming from JIRA, here is how the concepts map:

| JIRA Concept        | GitHub Equivalent                       | Notes                                                                  |
| ------------------- | --------------------------------------- | ---------------------------------------------------------------------- |
| Project             | GitHub Project (V2)                     | Organization-level or repository-level                                 |
| Epic                | Label (`epic:1`, `epic:2`) or Milestone | GitHub has no native "Epic" type; labels or custom fields fill the gap |
| Sprint              | Iteration (custom field) or Milestone   | Iteration fields have start/end dates and auto-rotation                |
| Story               | Issue (with `story` label)              | Use issue templates for structured story fields                        |
| Bug                 | Issue (with `bug` label)                | Use bug report template for severity, repro steps                      |
| Task / Sub-task     | Issue or Task List within an issue      | Task lists create trackable sub-issues                                 |
| Story Points        | Custom number field ("Story Points")    | Added as a project-level custom field                                  |
| Board               | Board view on the project               | Columns mapped to Status field values                                  |
| Backlog             | Status column "Backlog" on the board    | Just another status value in your Status field                         |
| Swimlanes           | Group By in Board view                  | Group by assignee, priority, epic, etc.                                |
| Filters / JQL       | Filter bar with field:value syntax      | e.g., `status:In Development assignee:@me label:story`                 |
| Automation Rules    | Built-in Workflows + GitHub Actions     | Auto-set status on PR open, merge, close                               |
| Dashboard / Reports | Insights tab with configurable charts   | Burn-up, status distribution, custom groupings                         |
| Release             | Milestone with due date                 | Track % completion toward a release target                             |
| Component           | Label (e.g., `component:frontend`)      | No native component concept; labels work well                          |

### Project Planning Templates

When you create a new project, GitHub offers four built-in templates (plus a blank option). Each comes pre-configured with views and fields suited to a specific workflow.

#### Team Planning

- **Best for:** Scrum/agile teams running sprints with multiple workstreams.
- **Pre-built views:** Backlog table, Current Sprint board, My Items (filtered to `@me`).
- **Pre-built fields:** Status (Todo, In Progress, Done), Priority, Size, Iteration.
- **When to use:** You have a team of 3+ people, run sprints, and want backlog grooming, sprint boards, and personal task lists out of the box.

#### Kanban

- **Best for:** Continuous-flow teams (no fixed sprints), support teams, DevOps.
- **Pre-built views:** Board view with columns (Todo, In Progress, Done).
- **Pre-built fields:** Status, Priority.
- **When to use:** You want a simple drag-and-drop board without iteration/sprint complexity. Work flows continuously rather than in time-boxed sprints.

#### Feature Release

- **Best for:** Product teams tracking features toward a release milestone.
- **Pre-built views:** Table grouped by milestone/release, Roadmap timeline view.
- **Pre-built fields:** Status, Priority, Milestone, Target Date.
- **When to use:** You are shipping versioned releases (v1.0, v2.0) and need to track which features land in which release.

#### Bug Tracker

- **Best for:** QA teams, open-source maintainers triaging incoming bugs.
- **Pre-built views:** Table sorted by severity, Board with triage columns.
- **Pre-built fields:** Status (New, Triaged, In Progress, Fixed), Severity, Source.
- **When to use:** You need a dedicated view for bug triage separate from feature work.

#### Blank

- **Best for:** Teams that want full control from the start.
- **Pre-built views:** Empty table.
- **When to use:** You know exactly what fields and views you want. You will configure everything manually.

**Recommendation for most teams:** Start with **Team Planning**. It gives you the most structure out of the box, and you can always remove fields or views you do not need. It is easier to simplify than to build from scratch.

---

## 2. Creating a Project

### Step-by-Step Instructions

#### Option A: Organization-Level Project (Recommended)

Organization-level projects can pull issues from multiple repositories, which is ideal for teams with a monorepo or multiple related repos.

1. Navigate to your GitHub organization page (e.g., `github.com/your-org`).
2. Click the **Projects** tab in the top navigation bar.
3. Click the green **New project** button in the top-right corner.
4. A modal appears showing the template options: Team Planning, Kanban, Feature Release, Bug Tracker, and Blank.
5. Select your preferred template (see Section 1 for guidance).
6. Enter a **Project name** (e.g., "IMS Gen2 — Hardware Lifecycle Management").
7. Click **Create project**.

#### Option B: Repository-Level Project

Repository-level projects are scoped to a single repo. They work the same way but only pull issues from that repository.

1. Navigate to your repository (e.g., `github.com/your-org/your-repo`).
2. Click the **Projects** tab.
3. Click **Link a project** dropdown, then **New project**.
4. Follow steps 4-7 from Option A above.

#### Option C: From the CLI

```bash
# Create an organization-level project
gh project create --owner "your-org" --title "IMS Gen2 — Hardware Lifecycle Management"

# Create a user-level project
gh project create --owner "@me" --title "IMS Gen2 — Hardware Lifecycle Management"
```

### Configuring Project Settings

After creating the project:

1. Click the **three-dot menu** (top-right of the project) and select **Settings**.
2. You will see:
   - **Project name:** Change it here if needed.
   - **Short description:** A one-liner shown under the project title (e.g., "Enterprise device inventory, firmware deployment, and compliance management").
   - **README:** A full Markdown document visible on the project's main page. Use this for onboarding instructions, sprint ceremonies schedule, or links to key docs.
   - **Visibility:**
     - **Private:** Only organization members (or collaborators) can see it.
     - **Public:** Anyone on the internet can view it (they still cannot edit without permissions).
   - **Close project:** Archives the project. It can be reopened later.

### Writing a Project README

The project README is your team's landing page. Click **Settings** then fill in the README field. Example:

```markdown
# IMS Gen2 Project Board

## Quick Links

- [Project Brief](../Docs/IMS-Gen2-Detailed-Project-Brief-For-Terraform.md)
- [E2E QA Process](../Docs/e2e-qa-process.md)
- [Epic Stories](../Docs/epics/)

## Sprint Ceremonies

- **Planning:** Monday 10:00 AM
- **Daily Standup:** Every day 9:15 AM
- **Review/Demo:** Friday 3:00 PM
- **Retro:** Friday 4:00 PM

## Status Workflow

Backlog → Sprint Ready → In Development → In Review → In QA → Done
```

---

## 3. Setting Up Labels

### Why Labels Matter

Labels are the most versatile organizational tool in GitHub. They serve multiple purposes:

- **Categorization:** Is this a story, bug, or tech-debt item?
- **Filtering:** Show me all P0-critical bugs in Epic 3.
- **Automation:** GitHub Actions can trigger on label events (e.g., when `qa-plan` is added, notify the QA channel).
- **Reporting:** Charts in the Insights tab can group by label.

Labels are defined at the **repository** level, not the project level. Every issue in the repo can use them, and they carry over into any project the issue is added to.

### How to Create Labels

1. Navigate to your repository.
2. Click the **Issues** tab.
3. Click **Labels** (button next to Milestones, above the issue list).
4. Click **New label**.
5. Enter:
   - **Label name:** e.g., `story`
   - **Description:** e.g., "User story with acceptance criteria"
   - **Color:** Click the color swatch or enter a hex code.
6. Click **Create label**.

### Recommended Label System

Below is a production-ready label system with hex colors. You can create these one by one in the UI or use the CLI commands at the bottom of this section.

#### Type Labels

| Label           | Color     | Description                             |
| --------------- | --------- | --------------------------------------- |
| `story`         | `#1D76DB` | User story with acceptance criteria     |
| `bug`           | `#D73A4A` | Something is broken                     |
| `enhancement`   | `#A2EEEF` | Improvement to existing feature         |
| `tech-debt`     | `#F9D0C4` | Refactoring or code quality improvement |
| `infra`         | `#BFD4F2` | Infrastructure / Terraform / DevOps     |
| `task`          | `#E4E669` | General task or chore                   |
| `documentation` | `#0075CA` | Documentation only changes              |

#### Priority Labels

| Label         | Color     | Description                      |
| ------------- | --------- | -------------------------------- |
| `P0-critical` | `#B60205` | Drop everything, fix immediately |
| `P1-high`     | `#D93F0B` | Must fix this sprint             |
| `P2-medium`   | `#FBCA04` | Plan for next sprint             |
| `P3-low`      | `#0E8A16` | Nice to have, backlog            |

#### Epic Labels

| Label    | Color     | Description                            |
| -------- | --------- | -------------------------------------- |
| `epic:1` | `#6F42C1` | Epic 1 - Project Bootstrap and Auth    |
| `epic:2` | `#6F42C1` | Epic 2 - Core Inventory CRUD           |
| `epic:3` | `#6F42C1` | Epic 3 - Location and Hierarchy        |
| `epic:4` | `#6F42C1` | Epic 4 - Work Order System             |
| `epic:5` | `#6F42C1` | Epic 5 - Firmware Management           |
| ...      | `#6F42C1` | Continue for all epics in your project |

#### Status / Process Labels

| Label          | Color     | Description                    |
| -------------- | --------- | ------------------------------ |
| `qa-plan`      | `#C5DEF5` | QA test plan approved          |
| `e2e-coverage` | `#C5DEF5` | E2E tests written and passing  |
| `needs-review` | `#FBCA04` | Waiting for code review        |
| `blocked`      | `#B60205` | Blocked by external dependency |
| `wontfix`      | `#FFFFFF` | Will not be addressed          |
| `duplicate`    | `#CFD3D7` | Duplicate of another issue     |

#### Size Labels (Story Points Equivalent)

| Label | Color     | Description                                     |
| ----- | --------- | ----------------------------------------------- |
| `XS`  | `#C2E0C6` | Trivial (1 point) - config change, typo fix     |
| `S`   | `#C2E0C6` | Small (2 points) - simple feature or fix        |
| `M`   | `#FEF2C0` | Medium (3-5 points) - standard story            |
| `L`   | `#F9D0C4` | Large (8 points) - complex feature              |
| `XL`  | `#E99695` | Extra Large (13 points) - should be broken down |

### Bulk-Create Labels via CLI

Save time by creating all labels with a script:

```bash
#!/bin/bash
# create-labels.sh — Run from the root of your repository

REPO="your-org/your-repo"

# Type labels
gh label create "story"         --color "1D76DB" --description "User story with acceptance criteria" --repo "$REPO"
gh label create "bug"           --color "D73A4A" --description "Something is broken" --repo "$REPO"
gh label create "enhancement"   --color "A2EEEF" --description "Improvement to existing feature" --repo "$REPO"
gh label create "tech-debt"     --color "F9D0C4" --description "Refactoring or code quality improvement" --repo "$REPO"
gh label create "infra"         --color "BFD4F2" --description "Infrastructure / Terraform / DevOps" --repo "$REPO"
gh label create "task"          --color "E4E669" --description "General task or chore" --repo "$REPO"
gh label create "documentation" --color "0075CA" --description "Documentation only changes" --repo "$REPO"

# Priority labels
gh label create "P0-critical"   --color "B60205" --description "Drop everything, fix immediately" --repo "$REPO"
gh label create "P1-high"       --color "D93F0B" --description "Must fix this sprint" --repo "$REPO"
gh label create "P2-medium"     --color "FBCA04" --description "Plan for next sprint" --repo "$REPO"
gh label create "P3-low"        --color "0E8A16" --description "Nice to have, backlog" --repo "$REPO"

# Epic labels
for i in $(seq 1 18); do
  gh label create "epic:$i" --color "6F42C1" --description "Epic $i" --repo "$REPO"
done

# Status labels
gh label create "qa-plan"       --color "C5DEF5" --description "QA test plan approved" --repo "$REPO"
gh label create "e2e-coverage"  --color "C5DEF5" --description "E2E tests written and passing" --repo "$REPO"
gh label create "needs-review"  --color "FBCA04" --description "Waiting for code review" --repo "$REPO"
gh label create "blocked"       --color "B60205" --description "Blocked by external dependency" --repo "$REPO"

# Size labels
gh label create "XS" --color "C2E0C6" --description "Trivial (1 point)" --repo "$REPO"
gh label create "S"  --color "C2E0C6" --description "Small (2 points)" --repo "$REPO"
gh label create "M"  --color "FEF2C0" --description "Medium (3-5 points)" --repo "$REPO"
gh label create "L"  --color "F9D0C4" --description "Large (8 points)" --repo "$REPO"
gh label create "XL" --color "E99695" --description "Extra Large (13 points)" --repo "$REPO"
```

Run it:

```bash
chmod +x create-labels.sh
./create-labels.sh
```

### Deleting Default Labels You Do Not Need

GitHub repos come with default labels like `good first issue`, `help wanted`, `invalid`, etc. If you want a clean slate:

```bash
REPO="your-org/your-repo"
gh label delete "good first issue" --repo "$REPO" --yes
gh label delete "help wanted" --repo "$REPO" --yes
gh label delete "invalid" --repo "$REPO" --yes
gh label delete "question" --repo "$REPO" --yes
```

---

## 4. Creating Milestones

### What Are Milestones?

Milestones are containers for issues that share a deadline. They serve two common roles:

1. **Sprint containers:** "Sprint 12 (Apr 1-14)" groups all work planned for that two-week period.
2. **Release containers:** "v1.0.0 — MVP Launch" groups all issues required for a release.

Milestones live at the **repository** level (like labels). Each issue can belong to exactly **one** milestone.

### How to Create a Milestone

1. Navigate to your repository.
2. Click the **Issues** tab.
3. Click the **Milestones** button (next to Labels, above the issue list).
4. Click **New milestone**.
5. Fill in:
   - **Title:** e.g., `Sprint 12 (Apr 1 - Apr 14)` or `v1.0.0 — MVP`
   - **Due date:** Select the end date (optional but recommended).
   - **Description:** Sprint goal, key deliverables, or release notes draft.
6. Click **Create milestone**.

### Via CLI

```bash
# Create a milestone
gh api repos/your-org/your-repo/milestones \
  --method POST \
  --field title="Sprint 12 (Apr 1 - Apr 14)" \
  --field due_on="2026-04-14T23:59:59Z" \
  --field description="Goal: Complete Epic 2 stories S-2.1 through S-2.4"
```

### Tracking Milestone Progress

Once issues are assigned to a milestone, GitHub automatically calculates a progress bar:

- **Open issues / Total issues = % remaining**
- **Closed issues / Total issues = % complete**

View progress at: `Repository → Issues → Milestones`

Each milestone shows:

- A progress bar (green = closed, gray = open).
- The number of open and closed issues.
- The due date and how many days remain (or how overdue it is).

### Sprint-Based vs Release-Based Milestones

**Sprint-based milestones:**

- Short timeboxes (1-2 weeks).
- Named with dates: `Sprint 12 (Apr 1 - Apr 14)`.
- Contain the stories/bugs committed to that sprint.
- At sprint end, any incomplete issues move to the next sprint's milestone.

**Release-based milestones:**

- Longer timelines aligned with product releases.
- Named with versions: `v1.0.0 — MVP Launch`.
- Contain all issues required for that release, across multiple sprints.
- An issue can belong to a release milestone AND be tracked in a sprint via the project's Iteration field (see Section 8).

**You can use both simultaneously.** Milestones for releases, and the Iteration custom field on the project for sprints. This is the recommended approach for teams that ship releases.

---

## 5. Issue Templates

### Why Templates Matter

Without templates, every issue looks different. One person writes a one-liner, another writes a novel with no structure, and a third forgets to mention which browser the bug occurs in. Templates enforce consistency and ensure every issue has the information the team needs to act on it.

### Where Templates Live

Issue templates are YAML files stored in `.github/ISSUE_TEMPLATE/` in your repository. When someone clicks "New Issue," GitHub presents a chooser showing all available templates.

You can also add a `config.yml` file to control the template chooser (e.g., add external links or disable blank issues).

### Story Template

Create the file `.github/ISSUE_TEMPLATE/story.yml`:

```yaml
name: Story
description: Create a new user story
labels: ["story"]
body:
  - type: dropdown
    id: epic
    attributes:
      label: Epic
      description: Which epic does this story belong to?
      options:
        - "Epic 1 — Project Bootstrap & Auth Foundation"
        - "Epic 2 — Core Inventory CRUD"
        - "Epic 3 — Location & Hierarchy Management"
        - "Epic 4 — Work Order System"
        - "Epic 5 — Firmware Management"
        - "Epic 6 — Audit Trail & History"
        - "Epic 7 — Dashboard & KPIs"
        - "Epic 8 — Bulk Operations"
        - "Epic 9 — Multi-Tenant Isolation"
        - "Epic 10 — Notifications & Alerts"
        - "Epic 11 — Compliance Framework (NIST/ISO)"
        - "Epic 12 — SBOM & Vulnerability Tracking"
        - "Epic 13 — Geolocation & Map View"
        - "Epic 14 — Reporting & Export"
        - "Epic 15 — Customer Portal"
        - "Epic 16 — Advanced Analytics"
        - "Epic 17 — Terraform Infrastructure"
        - "Epic 18 — OpenSearch Integration"
    validations:
      required: true

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
        - [ ] Unit tests passing
        - [ ] E2E tests passing
        - [ ] No lint errors
        - [ ] Accessibility checked
        - [ ] Documentation updated (if applicable)
    validations:
      required: false
```

### Bug Report Template

Create the file `.github/ISSUE_TEMPLATE/bug.yml`:

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

### Task Template

Create the file `.github/ISSUE_TEMPLATE/task.yml`:

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

### Template Chooser Configuration

Create `.github/ISSUE_TEMPLATE/config.yml` to customize the "New Issue" page:

```yaml
blank_issues_enabled: false
contact_links:
  - name: Project Board
    url: https://github.com/orgs/your-org/projects/1
    about: View the project board for current sprint status
  - name: Documentation
    url: https://github.com/your-org/your-repo/tree/main/Docs
    about: Browse project documentation and specs
```

Setting `blank_issues_enabled: false` forces everyone to use a template. No more unstructured one-liner issues.

---

## 6. Creating Issues (Stories, Bugs, Tasks)

### Step-by-Step Issue Creation (Web UI)

1. Navigate to your repository.
2. Click the **Issues** tab.
3. Click **New issue**.
4. The template chooser appears. Select the appropriate template (Story, Bug Report, or Task).
5. Fill in all required fields in the form.
6. In the right sidebar, set:
   - **Assignees:** Click the gear icon and select one or more team members.
   - **Labels:** Add relevant labels (e.g., `story`, `epic:2`, `P1-high`, `M`).
   - **Milestone:** Select the current sprint or release milestone.
   - **Projects:** Click the gear and add the issue to your project board.
7. Click **Submit new issue**.

### Via CLI

```bash
# Create a story
gh issue create \
  --title "[S-2.1] Device CRUD — Create New Device" \
  --label "story,epic:2,P1-high,M" \
  --milestone "Sprint 12 (Apr 1 - Apr 14)" \
  --assignee "your-username" \
  --project "IMS Gen2" \
  --body "$(cat <<'EOF'
## User Story
As an inventory manager, I want to create a new device record so that I can track it in the system.

## Acceptance Criteria
- [ ] Form displays fields: serial number, model, manufacturer, location, status
- [ ] Serial number is validated for uniqueness
- [ ] Success toast appears on save
- [ ] Device appears in the inventory table immediately
- [ ] Form resets after successful submission

## E2E Test Coverage
- Create device with all required fields
- Attempt duplicate serial number (expect error)
- Verify device appears in table after creation

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage)
- [ ] E2E tests passing
- [ ] No lint errors
- [ ] Accessibility checked
EOF
)"
```

### Writing Good Acceptance Criteria

Acceptance criteria should be **testable, specific, and complete**. Each criterion should be independently verifiable.

**Bad:**

- [ ] The form works correctly
- [ ] It looks good
- [ ] Errors are handled

**Good:**

- [ ] Form displays required fields: Serial Number (text), Model (dropdown), Status (dropdown with values: Active, Inactive, Maintenance, Retired)
- [ ] Clicking "Save" with an empty Serial Number shows inline validation error "Serial number is required"
- [ ] After successful save, a toast notification appears: "Device created successfully"
- [ ] The new device appears as the first row in the inventory table within 2 seconds
- [ ] Submitting a duplicate serial number returns error: "A device with this serial number already exists"

### Linking Issues

GitHub supports several ways to link issues together:

#### Reference Without Closing

Mention another issue in the body or a comment:

```
See also #42
Related to #55
Depends on #30
```

This creates a visible cross-reference on both issues but does NOT close anything.

#### Auto-Close on PR Merge

Use closing keywords in a PR body (not the issue body):

```
Closes #42
Fixes #42
Resolves #42
```

When the PR merges into the default branch, issue #42 automatically closes. You can close multiple issues:

```
Closes #42, closes #43, closes #44
```

#### Task Lists (Sub-Issues)

Inside an issue body, use task list syntax to create trackable sub-items:

```markdown
## Tasks

- [ ] Design the form layout
- [ ] Implement form validation with Zod schema
- [ ] Write unit tests for validation logic
- [ ] Add E2E test for happy path
- [ ] Add E2E test for error cases
```

These checkboxes:

- Show progress on the issue card in the project board.
- Can be checked off as work progresses.
- Starting in 2024, you can convert task list items into full sub-issues with the "Convert to issue" option.

#### Tracked-By / Tracks Relationships

GitHub supports parent-child relationships between issues. In a parent issue, add:

```markdown
- [ ] #101
- [ ] #102
- [ ] #103
```

The parent issue now "tracks" the child issues, and the children show "Tracked by #100" in their sidebar.

---

## 7. Project Board Views

### Overview

A single project can have multiple views, each showing the same data in a different layout. Think of views like saved queries in a database — same data, different perspectives.

GitHub Projects V2 supports three view types:

1. **Table** — Spreadsheet-like rows and columns.
2. **Board** — Kanban columns (cards you drag between columns).
3. **Roadmap** — Timeline bars on a calendar.

### Table View

The default view. Every issue/PR is a row. Custom fields are columns.

**Key capabilities:**

- **Sort:** Click any column header to sort ascending/descending. Multi-sort by holding Shift.
- **Filter:** Use the filter bar at the top. Syntax: `field:value`. Examples:
  ```
  status:"In Development"
  assignee:gauravmakkar29
  label:story
  label:epic:2
  milestone:"Sprint 12"
  is:open
  no:assignee
  ```
- **Group By:** Click the "Group" dropdown to group rows by any single-select field (Status, Priority, Epic, Assignee).
- **Hide/Show columns:** Click the "+" at the end of the column headers to add fields, or right-click a column header to hide it.
- **Slice By:** Use the "Slice" option to create a sidebar showing items grouped by a field, letting you quickly filter.

### Board View

A Kanban board where columns represent values of a single-select field (usually Status).

**Creating a Board view:**

1. Click the **"+"** tab at the top of the project (next to existing view tabs).
2. Select **Board**.
3. Name the view (e.g., "Sprint Board").
4. By default, columns map to the Status field values. You can change the "Column by" field.

**Key capabilities:**

- **Drag and drop:** Move cards between columns to change their status.
- **Column limits:** Set WIP (Work In Progress) limits on columns (e.g., "In Review" max 3 items). Go to column settings via the three-dot menu on the column header.
- **Filter:** Same syntax as Table view. A filtered board only shows matching cards.
- **Group By:** Add swimlanes. Group by assignee to see each person's cards in separate rows.
- **Card fields:** Configure which fields appear on each card. Click the board's view menu (top-right) and select "Fields" to choose what shows on cards (e.g., show labels, assignee avatar, story points).

### Roadmap View

A timeline view showing issues as horizontal bars on a calendar.

**Creating a Roadmap view:**

1. Click the **"+"** tab and select **Roadmap**.
2. Name it (e.g., "Release Roadmap").
3. Configure:
   - **Date fields:** Choose which fields define the start and end of each bar. You need at least a "Target date" or "Iteration" field. If using Iteration fields, each iteration's start/end dates define the bars.
   - **Zoom level:** Toggle between Day, Week, Month, Quarter views using the zoom controls.
   - **Group By:** Group by milestone, epic, or assignee to see separate swimlanes.

**When to use:** Sprint-over-sprint planning, release planning, or showing stakeholders a timeline of upcoming work.

### Creating Custom Views

Custom views let you save specific filter + sort + group combinations for quick access.

**Example custom views for a team:**

| View Name        | Type  | Filter                                | Group By | Purpose                      |
| ---------------- | ----- | ------------------------------------- | -------- | ---------------------------- |
| Current Sprint   | Board | `iteration:@current`                  | None     | Daily standup board          |
| My Work          | Table | `assignee:@me is:open`                | Status   | Personal task list           |
| By Epic          | Table | `is:open`                             | Epic     | See all work grouped by epic |
| Blocked Items    | Table | `label:blocked`                       | None     | Triage blocked work          |
| P0/P1 Bugs       | Table | `label:bug label:P0-critical,P1-high` | Status   | Critical bug triage          |
| QA Queue         | Board | `status:"In QA"`                      | None     | QA team's testing queue      |
| Done This Sprint | Table | `iteration:@current status:Done`      | None     | Sprint review preparation    |

**To create a view:**

1. Click the **"+"** tab.
2. Choose layout type (Table, Board, or Roadmap).
3. Name the view (click the tab name to rename).
4. Apply your filters, sorts, and groupings.
5. The view auto-saves. You can reorder view tabs by dragging them.

### Saving Filters

Filters applied in any view persist when you switch away and come back. Each view independently remembers its own filter, sort, and group settings.

To quickly apply a saved filter, just click the view tab. No need for a separate "saved filter" feature — each view IS a saved filter.

---

## 8. Custom Fields

Custom fields are the backbone of GitHub Projects V2. They define the data you can track, filter, sort, and chart on. Fields are defined at the **project** level (not the repository).

### How to Add Custom Fields

1. Open your project.
2. In Table view, click the **"+"** at the end of the column headers.
3. Select **New field**.
4. Choose the field type and configure it.

Or go to: **Project → Settings → Custom Fields → New Field**

### Field Types

| Type          | Description                                | Example                          |
| ------------- | ------------------------------------------ | -------------------------------- |
| Text          | Free-form text                             | Notes, links                     |
| Number        | Numeric value                              | Story Points (1, 2, 3, 5, 8, 13) |
| Date          | Calendar date picker                       | Due Date, Start Date             |
| Single select | Dropdown with predefined options           | Status, Priority, Epic           |
| Iteration     | Time-boxed period with start/end dates     | Sprint 12, Sprint 13             |
| Tracks        | Shows sub-issue progress (auto-calculated) | 3 of 5 complete                  |

### Recommended Fields Setup

#### Status (Single Select) — REQUIRED

This is the most important field. It defines your workflow columns on the Board view.

**Recommended values:**

| Status Value   | Color  | Description                               |
| -------------- | ------ | ----------------------------------------- |
| Backlog        | Gray   | Not yet planned for a sprint              |
| Sprint Ready   | Blue   | Groomed, estimated, ready to be picked up |
| In Development | Yellow | Currently being coded                     |
| In Review      | Orange | PR opened, waiting for code review        |
| In QA          | Purple | Code merged to dev, being tested          |
| Done           | Green  | Accepted, all criteria met, deployed      |
| Blocked        | Red    | Cannot proceed due to external dependency |

**To customize the Status field:**

1. Go to Project **Settings** (three-dot menu, top-right).
2. Click the **Status** field in the left sidebar.
3. Add, remove, rename, or recolor options.
4. Drag to reorder (the order determines column order in Board view).

#### Priority (Single Select)

| Option      | Color  |
| ----------- | ------ |
| P0-Critical | Red    |
| P1-High     | Orange |
| P2-Medium   | Yellow |
| P3-Low      | Green  |

#### Story Points (Number)

- **Field name:** Story Points
- **Type:** Number
- Use Fibonacci-like values: 1, 2, 3, 5, 8, 13

The sum of Story Points is shown at the bottom of each column in Board view and in table Group By footers. This gives you sprint capacity tracking.

#### Sprint / Iteration (Iteration)

Iteration fields are special. They represent time-boxed periods.

**To configure:**

1. Create a new field of type **Iteration**.
2. Name it "Sprint" (or "Iteration").
3. Set the **duration** (e.g., 2 weeks).
4. Set the **start date** of your first iteration.
5. GitHub auto-generates sequential iterations: Sprint 1 (Apr 1-14), Sprint 2 (Apr 15-28), etc.
6. You can rename individual iterations and adjust dates.

**Special filter values:**

- `iteration:@current` — Items in the current sprint (based on today's date).
- `iteration:@previous` — Items from the last sprint.
- `iteration:@next` — Items in the upcoming sprint.

#### Epic (Single Select)

If your project has defined epics, create a single-select field:

| Option                              |
| ----------------------------------- |
| Epic 1 — Project Bootstrap and Auth |
| Epic 2 — Core Inventory CRUD        |
| Epic 3 — Location and Hierarchy     |
| Epic 4 — Work Order System          |
| Epic 5 — Firmware Management        |
| ...                                 |

Alternatively, you can use labels (`epic:1`, `epic:2`) instead of a custom field. The trade-off:

- **Labels:** Available on the repository issue itself, visible everywhere, can trigger automation.
- **Custom field:** Only visible on the project board, supports better charting in Insights, cleaner grouping.

**Recommendation:** Use both. Labels for filtering in the Issues tab and automation triggers. Custom field for project-level charting and grouping.

#### Due Date (Date)

A simple date field for tracking deadlines on individual items. Different from Iteration (which is a time range for sprints) and different from Milestone due dates (which are release-level deadlines).

---

## 9. Workflows and Automation

### Built-In Workflows

GitHub Projects V2 includes several built-in automation workflows that require zero configuration beyond toggling them on.

**To access:** Project → Three-dot menu → **Settings** → **Workflows** (in left sidebar).

#### Available Built-In Workflows

| Workflow               | Trigger                           | Action                                              |
| ---------------------- | --------------------------------- | --------------------------------------------------- |
| Item added to project  | Any issue/PR added to the project | Set Status to a chosen value (e.g., "Backlog")      |
| Item reopened          | A closed issue is reopened        | Set Status to a chosen value (e.g., "Sprint Ready") |
| Item closed            | An issue is closed                | Set Status to "Done"                                |
| Pull request merged    | A linked PR is merged             | Set Status to "Done"                                |
| Code changes requested | A reviewer requests changes on PR | Set Status to "In Development"                      |
| Code review approved   | A reviewer approves the PR        | Set Status to "In Review" or "In QA"                |
| Auto-add to project    | Issue/PR matches a filter         | Automatically add to the project                    |

### Enabling a Workflow

1. Go to **Settings → Workflows**.
2. Find the workflow you want (e.g., "Pull request merged").
3. Toggle it **On**.
4. Configure the action (e.g., set Status to "Done").
5. Click **Save**.

### Auto-Add Items to the Project

This is the most powerful built-in workflow. It automatically adds issues/PRs to your project based on filters.

**Configuration:**

1. Go to **Settings → Workflows → Auto-add to project**.
2. Click **Add workflow** (you can have multiple).
3. Set the filter:
   - **Repository:** Select which repo(s) to monitor.
   - **Label filter:** e.g., `label:story,bug` (add any issue with story or bug label).
   - **Assignee filter:** e.g., only issues assigned to team members.
4. Toggle **On**.

**Example:** Auto-add every issue with label `story` or `bug` from the `ims-gen2` repo to the project, with initial Status set to "Backlog."

### Closing Issues via PR Keywords

This is not a project workflow but a core GitHub feature that works seamlessly with projects:

In your PR body, include:

```
Closes #42
```

When the PR is merged:

1. Issue #42 is automatically closed.
2. If the "Item closed" workflow is enabled on the project, the issue's Status is set to "Done."

**Supported keywords:** `Closes`, `Fixes`, `Resolves` (case-insensitive). Each can be followed by an issue reference (`#42`) or a full URL (`https://github.com/org/repo/issues/42`).

### GitHub Actions Integration

For more advanced automation, use GitHub Actions to update project fields based on CI events.

#### Example: Auto-Set Status to "In Review" When PR Opens

```yaml
# .github/workflows/project-automation.yml
name: Project Automation

on:
  pull_request:
    types: [opened, ready_for_review]

jobs:
  update-project:
    runs-on: ubuntu-latest
    steps:
      - name: Move to In Review
        uses: actions/github-script@v7
        with:
          github-token: ${{ secrets.PROJECT_TOKEN }}
          script: |
            const pr = context.payload.pull_request;
            const body = pr.body || '';

            // Extract issue numbers from "Closes #N" patterns
            const issuePattern = /(?:closes|fixes|resolves)\s+#(\d+)/gi;
            let match;
            while ((match = issuePattern.exec(body)) !== null) {
              const issueNumber = parseInt(match[1]);
              console.log(`Found linked issue #${issueNumber}`);
              // Use GraphQL to update the project item status
              // (See GitHub's documentation for the full GraphQL mutation)
            }
```

#### Example: Add CI Status as a Comment

```yaml
# .github/workflows/ci-status-comment.yml
name: CI Status Update

on:
  workflow_run:
    workflows: ["CI"]
    types: [completed]

jobs:
  comment:
    runs-on: ubuntu-latest
    if: github.event.workflow_run.event == 'pull_request'
    steps:
      - name: Comment CI Result
        uses: actions/github-script@v7
        with:
          script: |
            const result = context.payload.workflow_run.conclusion;
            const emoji = result === 'success' ? '✅' : '❌';
            // Find associated PR and add comment
            console.log(`CI ${result} ${emoji}`);
```

### Recommended Workflow Configuration for a Sprint Team

| Workflow               | Enabled | Action                                                          |
| ---------------------- | ------- | --------------------------------------------------------------- |
| Auto-add to project    | Yes     | Add issues with `story` or `bug` label, set Status to "Backlog" |
| Item closed            | Yes     | Set Status to "Done"                                            |
| Item reopened          | Yes     | Set Status to "Sprint Ready"                                    |
| Pull request merged    | Yes     | Set Status to "Done"                                            |
| Code review approved   | Yes     | Set Status to "In QA"                                           |
| Code changes requested | Yes     | Set Status to "In Development"                                  |

---

## 10. Charts and Insights

### Accessing Insights

1. Open your project.
2. Click the **Insights** tab (next to the project views tabs, look for the bar-chart icon).

### Built-In Chart Types

GitHub Projects offers two chart types:

#### Bar / Column Chart (Default)

Shows counts or sums grouped by a field.

**Example configurations:**

| Chart Name           | X-Axis (Group By) | Y-Axis (Aggregate)  | Filter                                |
| -------------------- | ----------------- | ------------------- | ------------------------------------- |
| Status Distribution  | Status            | Count of items      | (none)                                |
| Story Points by Epic | Epic              | Sum of Story Points | `label:story`                         |
| Work by Assignee     | Assignee          | Count of items      | `status:"In Development","In Review"` |
| Bugs by Priority     | Priority          | Count of items      | `label:bug`                           |
| Sprint Velocity      | Iteration         | Sum of Story Points | `status:Done`                         |

#### Historical / Burn-Up Chart

Shows progress over time. This is the equivalent of a JIRA burn-down chart (inverted — it shows work completed going UP rather than remaining going DOWN).

**Configuration:**

1. Click **New chart** in the Insights tab.
2. Select **Historical** chart type.
3. Configure:
   - **X-axis:** Time (automatic — shows dates).
   - **Y-axis:** Count of items or Sum of a number field (e.g., Story Points).
   - **Group by:** Status (to see stacked areas for each status over time).
   - **Filter:** Scope to a milestone or iteration.

**Reading a burn-up chart:**

- The top line represents total scope (all items in the filtered set).
- Colored areas below show items in each status.
- The green "Done" area growing toward the total line means you are making progress.
- If the total line keeps rising, scope is being added (scope creep).

### Creating a Custom Chart

1. Click **New chart** in the Insights tab.
2. Choose **Current** (snapshot) or **Historical** (over time).
3. Configure the layout:
   - **X-Axis:** The field to group by (Status, Assignee, Priority, Epic, Iteration, Label, Milestone, Repository).
   - **Y-Axis:** What to measure — Count (number of items) or Sum of a number field (Story Points).
   - **Group By (stacked):** Optionally add a second dimension. E.g., X=Status, Group=Priority shows a stacked bar where each status column is broken down by priority.
4. Apply a **filter** to scope the chart (e.g., `iteration:@current` for current sprint only).
5. Name the chart and **Save**.

### Recommended Charts for Sprint Teams

| Chart Name      | Type       | X-Axis    | Y-Axis            | Group By | Filter               |
| --------------- | ---------- | --------- | ----------------- | -------- | -------------------- |
| Sprint Burn-Up  | Historical | Time      | Count of items    | Status   | `iteration:@current` |
| Velocity Trend  | Current    | Iteration | Sum: Story Points | (none)   | `status:Done`        |
| Status Overview | Current    | Status    | Count of items    | (none)   | (none)               |
| Bug Trend       | Historical | Time      | Count of items    | Priority | `label:bug`          |
| Epic Progress   | Current    | Epic      | Count of items    | Status   | (none)               |
| Team Workload   | Current    | Assignee  | Count of items    | Status   | `is:open`            |

### Sprint Velocity Tracking

Sprint velocity measures how many story points the team completes per sprint.

**Setup:**

1. Create a **Current** chart.
2. X-Axis: **Iteration** (Sprint).
3. Y-Axis: **Sum of Story Points**.
4. Filter: `status:Done`.

This shows a bar for each sprint, with the height representing completed story points. Over time, you can see your team's velocity stabilize, which helps with capacity planning.

---

## 11. Sprint Planning Workflow

This section walks through a complete sprint workflow using GitHub Projects, from planning through retrospective.

### Prerequisites

Before your first sprint, ensure you have:

- A project created (Section 2).
- Labels configured (Section 3).
- Status field with values: Backlog, Sprint Ready, In Development, In Review, In QA, Done, Blocked (Section 8).
- Iteration field configured with 2-week sprints (Section 8).
- Story Points number field (Section 8).
- Board view filtered to `iteration:@current` (Section 7).

### Week 0: Backlog Grooming

**Goal:** Ensure the backlog has enough groomed items for the next sprint.

1. **Open the Table view**, filter to `status:Backlog`, sort by Priority descending.
2. **Review each item:**
   - Does it have clear acceptance criteria? If not, update the issue.
   - Does it have a story point estimate? If not, discuss with the team and set the Story Points field.
   - Does it have the correct labels (epic, priority, type)?
   - Is it small enough for one sprint? If an item is XL (13 points), break it into smaller issues.
3. **Move groomed items** to `status:Sprint Ready` by changing their Status field.

### Day 1: Sprint Planning

**Goal:** Select items for the sprint and assign them to team members.

1. **Open the Table view**, filter to `status:"Sprint Ready"`, sort by Priority.
2. **Determine capacity:** If the team averages 40 story points per sprint (velocity from Insights), aim for 35-40 points.
3. **Select items:** Change the **Iteration** field to the current sprint for each selected item. Also move Status to "Sprint Ready" if not already there.
4. **Assign owners:** Set the Assignee field for each item.
5. **Verify the sprint scope:**
   - Switch to the Board view filtered to `iteration:@current`.
   - All selected items should appear in the "Sprint Ready" column.
   - Check the total Story Points at the bottom of the column. Does it match your capacity?

**CLI shortcut for assigning iteration:**

```bash
# List all Sprint Ready items
gh project item-list PROJECT_NUMBER --owner "your-org" \
  --format json | jq '.items[] | select(.status == "Sprint Ready")'
```

### Days 2-10: Daily Standups

**Goal:** Track progress, identify blockers.

**Standup view setup:** Create a Board view named "Daily Standup" with:

- Filter: `iteration:@current`
- Group By: Assignee

Each person can see their cards and their current status. During standup:

1. Each person drags their card(s) to reflect current status.
2. Blockers: Move the card to "Blocked" column and add a comment explaining the blocker.
3. New items: If urgent work comes in mid-sprint, add it to the project and discuss the trade-off (what gets bumped?).

**Developer daily workflow:**

1. Pick a card from "Sprint Ready."
2. Move it to "In Development."
3. Create a branch: `git checkout -b feature/IMS-{issue#}-short-desc`
4. Code and commit: `git commit -m "feat(scope): description #{issue}"`
5. Open a PR with `Closes #{issue}` in the body.
6. The PR automatically links to the issue. If you have the "Code review" workflow enabled, the issue moves to "In Review" when the PR is opened.
7. After review approval, the issue moves to "In QA" (if that workflow is configured).
8. After merge, the issue auto-closes and moves to "Done."

### Day 10: Sprint Review / Demo

**Goal:** Show completed work, measure progress.

1. **Open the Board view** filtered to `iteration:@current`. The "Done" column shows everything completed.
2. **Check the milestone** progress bar for a quick % complete.
3. **Open Insights → Sprint Burn-Up chart** to show the team's progress curve over the sprint.
4. **Calculate velocity:** Open the Velocity chart (see Section 10). Note the Story Points completed.
5. **Demo:** Walk through each "Done" item and demonstrate the feature or fix.

### Day 10: Sprint Retrospective

**Goal:** Identify what went well, what to improve.

Data to review from the project:

1. **Velocity chart:** Did we hit our target? Above or below the trend line?
2. **Blocked items:** How many items were blocked, and for how long? (Check the "Blocked" column history.)
3. **Carry-over:** How many items from the sprint are NOT in "Done"? These roll to the next sprint.
4. **Scope changes:** Did the burn-up chart's total line move? That indicates scope was added mid-sprint.

**After retro:**

1. Move incomplete items: Change their Iteration to the next sprint (or move them back to Backlog if de-prioritized).
2. Close the sprint milestone (if using milestone-per-sprint approach).
3. Create the next sprint's milestone.

---

## 12. Best Practices

### Issue Naming Conventions

Use a consistent format for issue titles so they are scannable in lists and boards.

**Stories:**

```
[S-2.1] Device CRUD — Create New Device
[S-5.3] Firmware Deploy — Multi-Stage Approval
```

Format: `[S-{epic}.{story}] {Feature Area} — {Short Description}`

**Bugs:**

```
[BUG] Device table crashes when filtering by retired status
[BUG] Firmware upload fails for files over 50MB
```

**Tasks:**

```
[TASK] Upgrade React to 18.3
[TASK] Add ESLint rule for no-console
[INFRA] Configure CloudFront cache invalidation
```

### Branch Naming Convention

```
feature/IMS-{issue#}-short-desc    # For stories and enhancements
fix/IMS-{issue#}-short-desc        # For bug fixes
```

Examples:

```
feature/IMS-42-device-crud-create
fix/IMS-67-firmware-upload-timeout
```

### Commit Conventions

Follow Conventional Commits format:

```
feat(scope): description #{issue}
fix(scope): description #{issue}
refactor(scope): description #{issue}
test(scope): description #{issue}
docs(scope): description #{issue}
chore(scope): description #{issue}
```

Examples:

```
feat(inventory): add device creation form #42
fix(firmware): handle upload timeout for large files #67
test(inventory): add E2E tests for device CRUD #42
refactor(auth): extract token refresh logic to hook #88
```

The `#{issue}` at the end creates a cross-reference from the commit to the issue.

### Pull Request Conventions

**Title format:**

```
[Story 2.1] Device CRUD — Create New Device
```

**Body format:**

```markdown
## Summary

Implements the device creation form with validation, toast notifications,
and table refresh.

## Changes

- Add `CreateDeviceForm` component with Zod validation
- Add `useCreateDevice` mutation hook
- Add success/error toast notifications
- Add unit tests (92% coverage)

## E2E Coverage

- [x] Create device with all required fields
- [x] Duplicate serial number validation
- [x] Form reset after submission

Closes #42
```

### Labels vs Milestones vs Custom Fields — When to Use Which

| Mechanism     | Scope      | Best For                                | Limitations                           |
| ------------- | ---------- | --------------------------------------- | ------------------------------------- |
| Labels        | Repository | Categorization (type, priority, epic)   | No dates, no ordering, flat structure |
| Milestones    | Repository | Release targets with due dates          | One per issue, no hierarchy           |
| Custom Fields | Project    | Sprint tracking, story points, workflow | Only visible on project board         |
| Iterations    | Project    | Time-boxed sprints                      | Only available as custom field        |

**Use labels when:** You want to filter issues in the repo's Issues tab (outside the project), trigger GitHub Actions, or categorize across projects.

**Use milestones when:** You want a container with a due date and progress bar, typically for releases.

**Use custom fields when:** You need project-level tracking that does not make sense as a label (numeric values, dates, iterations).

### Handling Blocked Items

1. Change the issue's Status to "Blocked."
2. Add a comment explaining what is blocking it and who/what can unblock it.
3. Add the `blocked` label (so it is visible even outside the project board).
4. If another issue is the blocker, reference it: "Blocked by #55."
5. Create a "Blocked Items" view (Table, filter: `status:Blocked`) and review it daily.
6. When unblocked, move the status back to the appropriate column and remove the `blocked` label.

### Cross-Repo Project Tracking

Organization-level projects can track issues from multiple repositories. This is useful when your project spans several repos (e.g., frontend, backend, infrastructure).

**Setup:**

1. Create the project at the organization level (not repository level).
2. In the "Auto-add" workflow, add each repository.
3. Issues from all repositories appear in the same project board.
4. Use the "Repository" field (built-in) to filter or group by repo.

---

## 13. CLI (gh) Commands Reference

The GitHub CLI (`gh`) lets you manage projects, issues, and PRs entirely from the terminal. This is especially useful for automation scripts and for developers who prefer the command line.

### Installation

```bash
# macOS
brew install gh

# Windows (winget)
winget install --id GitHub.cli

# Linux (Debian/Ubuntu)
sudo apt install gh

# Authenticate
gh auth login
```

### Project Commands

```bash
# List all projects for an organization
gh project list --owner "your-org"

# List all projects for your user
gh project list --owner "@me"

# View a specific project (by number)
gh project view 1 --owner "your-org"

# View project in the browser
gh project view 1 --owner "your-org" --web

# List all items in a project
gh project item-list 1 --owner "your-org"

# List items with JSON output (for scripting)
gh project item-list 1 --owner "your-org" --format json

# Add an issue to a project
gh project item-add 1 --owner "your-org" --url "https://github.com/your-org/your-repo/issues/42"

# Delete an item from a project
gh project item-delete 1 --owner "your-org" --id "ITEM_ID"

# Edit a project item's field (e.g., change Status)
gh project item-edit \
  --project-id "PROJECT_ID" \
  --id "ITEM_ID" \
  --field-id "STATUS_FIELD_ID" \
  --single-select-option-id "OPTION_ID"

# Get field IDs (needed for item-edit)
gh project field-list 1 --owner "your-org" --format json
```

### Issue Commands

```bash
# Create a new issue
gh issue create --title "Title" --body "Body" --label "story" --repo "your-org/your-repo"

# Create issue interactively (opens prompts)
gh issue create --repo "your-org/your-repo"

# List issues
gh issue list --repo "your-org/your-repo"

# List issues with specific label
gh issue list --label "story" --repo "your-org/your-repo"

# List issues with multiple label filters
gh issue list --label "story" --label "epic:2" --repo "your-org/your-repo"

# List issues assigned to you
gh issue list --assignee "@me" --repo "your-org/your-repo"

# List issues in a milestone
gh issue list --milestone "Sprint 12 (Apr 1 - Apr 14)" --repo "your-org/your-repo"

# List open bugs sorted by created date
gh issue list --label "bug" --state open --repo "your-org/your-repo"

# View a specific issue
gh issue view 42 --repo "your-org/your-repo"

# View issue in browser
gh issue view 42 --web --repo "your-org/your-repo"

# Close an issue
gh issue close 42 --repo "your-org/your-repo"

# Reopen an issue
gh issue reopen 42 --repo "your-org/your-repo"

# Add a comment to an issue
gh issue comment 42 --body "Working on this now" --repo "your-org/your-repo"

# Edit an issue (change title, body, labels, etc.)
gh issue edit 42 --title "New Title" --add-label "P1-high" --remove-label "P2-medium" --repo "your-org/your-repo"

# Assign an issue
gh issue edit 42 --add-assignee "username" --repo "your-org/your-repo"

# Transfer an issue to another repo
gh issue transfer 42 "your-org/other-repo" --repo "your-org/your-repo"
```

### Pull Request Commands

```bash
# Create a PR
gh pr create --title "[Story 2.1] Device CRUD" --body "Closes #42" --repo "your-org/your-repo"

# List open PRs
gh pr list --repo "your-org/your-repo"

# View a PR
gh pr view 10 --repo "your-org/your-repo"

# Check PR status (CI checks)
gh pr checks 10 --repo "your-org/your-repo"

# Merge a PR
gh pr merge 10 --squash --repo "your-org/your-repo"

# Review a PR
gh pr review 10 --approve --repo "your-org/your-repo"
gh pr review 10 --request-changes --body "Please fix X" --repo "your-org/your-repo"
```

### Bulk Operations with Shell Scripts

#### Bulk-Add Labels to Multiple Issues

```bash
#!/bin/bash
# Add "epic:2" label to issues 42 through 48
REPO="your-org/your-repo"
for i in $(seq 42 48); do
  gh issue edit "$i" --add-label "epic:2" --repo "$REPO"
  echo "Updated issue #$i"
done
```

#### Move All "In Review" Items to "In QA"

```bash
#!/bin/bash
# Requires knowing the project ID and field/option IDs
PROJECT_ID="PVT_XXXXX"
STATUS_FIELD_ID="PVTSSF_XXXXX"
IN_QA_OPTION_ID="OPTION_XXXXX"

# Get all items with "In Review" status
gh project item-list 1 --owner "your-org" --format json | \
  jq -r '.items[] | select(.status == "In Review") | .id' | \
  while read -r item_id; do
    gh project item-edit \
      --project-id "$PROJECT_ID" \
      --id "$item_id" \
      --field-id "$STATUS_FIELD_ID" \
      --single-select-option-id "$IN_QA_OPTION_ID"
    echo "Moved item $item_id to In QA"
  done
```

#### Export Project Data to CSV

```bash
#!/bin/bash
# Export all project items to CSV for external reporting
gh project item-list 1 --owner "your-org" --format json | \
  jq -r '["Title","Status","Assignee","Story Points","Sprint"],
         (.items[] | [.title, .status, (.assignees[0] // "unassigned"), (.storyPoints // 0), (.iteration // "none")]) | @csv' \
  > sprint-report.csv
echo "Exported to sprint-report.csv"
```

#### Create Sprint Milestones in Bulk

```bash
#!/bin/bash
# Create milestones for sprints 1-12
REPO="your-org/your-repo"
START_DATE="2026-04-01"

for i in $(seq 1 12); do
  # Calculate dates (2-week sprints)
  DAYS_OFFSET=$(( (i - 1) * 14 ))
  SPRINT_START=$(date -d "$START_DATE + $DAYS_OFFSET days" +%Y-%m-%d)
  SPRINT_END=$(date -d "$START_DATE + $DAYS_OFFSET days + 13 days" +%Y-%m-%d)

  gh api repos/$REPO/milestones \
    --method POST \
    --field title="Sprint $i ($SPRINT_START - $SPRINT_END)" \
    --field due_on="${SPRINT_END}T23:59:59Z" \
    --field description="Sprint $i"

  echo "Created Sprint $i: $SPRINT_START to $SPRINT_END"
done
```

---

## 14. IMS Gen2 Project Setup (Real Example)

This section documents how the IMS Gen2 — Hardware Lifecycle Management project is configured using GitHub Projects V2.

### Project Overview

- **Project Name:** IMS Gen2 — Hardware Lifecycle Management
- **Template:** Team Planning
- **Visibility:** Private (organization members only)
- **Repositories:** Single monorepo containing frontend, infrastructure, E2E tests, and documentation

### Epic Structure

The project is organized into 18 epics, each containing multiple stories:

| Epic | Name                            | Stories               |
| ---- | ------------------------------- | --------------------- |
| 1    | Project Bootstrap and Auth      | S-1.1 through S-1.N   |
| 2    | Core Inventory CRUD             | S-2.1 through S-2.N   |
| 3    | Location and Hierarchy          | S-3.1 through S-3.N   |
| 4    | Work Order System               | S-4.1 through S-4.N   |
| 5    | Firmware Management             | S-5.1 through S-5.N   |
| 6    | Audit Trail and History         | S-6.1 through S-6.N   |
| 7    | Dashboard and KPIs              | S-7.1 through S-7.N   |
| 8    | Bulk Operations                 | S-8.1 through S-8.N   |
| 9    | Multi-Tenant Isolation          | S-9.1 through S-9.N   |
| 10   | Notifications and Alerts        | S-10.1 through S-10.N |
| 11   | Compliance Framework (NIST/ISO) | S-11.1 through S-11.N |
| 12   | SBOM and Vulnerability Tracking | S-12.1 through S-12.N |
| 13   | Geolocation and Map View        | S-13.1 through S-13.N |
| 14   | Reporting and Export            | S-14.1 through S-14.N |
| 15   | Customer Portal                 | S-15.1 through S-15.N |
| 16   | Advanced Analytics              | S-16.1 through S-16.N |
| 17   | Terraform Infrastructure        | S-17.1 through S-17.N |
| 18   | OpenSearch Integration          | S-18.1 through S-18.N |

### Issue Templates

The project uses two YAML-based issue templates:

- **Story template** (`.github/ISSUE_TEMPLATE/story.yml`): Includes epic dropdown (all 18 epics), story ID, story points, user story, acceptance criteria, E2E coverage, and definition of done.
- **Bug template** (`.github/ISSUE_TEMPLATE/bug.yml`): Includes parent story reference, severity dropdown, browser selection, description, steps to reproduce, evidence, and environment.

Both templates auto-apply their respective labels (`story` or `bug`) on creation.

### Label System

The project uses the label system described in Section 3, with all 18 epic labels (`epic:1` through `epic:18`) configured.

### Status Workflow

```
Backlog → Sprint Ready → In Development → In Review → In QA → Done
                                                               ↑
                                               Blocked --------┘
```

- **Backlog:** Issue created but not yet planned for a sprint.
- **Sprint Ready:** Groomed (has acceptance criteria, story points, labels) and selected for a sprint.
- **In Development:** Developer has started coding. Branch created as `feature/IMS-{issue#}-short-desc`.
- **In Review:** PR opened with `Closes #{issue}` in the body. Code review in progress.
- **In QA:** PR approved. E2E tests being verified.
- **Done:** PR merged, issue auto-closed, all acceptance criteria met.
- **Blocked:** Cannot proceed. Blocker documented in a comment.

### Custom Fields

| Field        | Type          | Values / Config                                                        |
| ------------ | ------------- | ---------------------------------------------------------------------- |
| Status       | Single select | Backlog, Sprint Ready, In Development, In Review, In QA, Done, Blocked |
| Priority     | Single select | P0-Critical, P1-High, P2-Medium, P3-Low                                |
| Story Points | Number        | Fibonacci: 1, 2, 3, 5, 8, 13                                           |
| Sprint       | Iteration     | 2-week cadence starting from project kickoff                           |
| Epic         | Single select | Epic 1 through Epic 18                                                 |

### Project Views

| View Name       | Type    | Filter / Config                         | Purpose                           |
| --------------- | ------- | --------------------------------------- | --------------------------------- |
| Backlog         | Table   | `status:Backlog`, sorted by Priority    | Backlog grooming                  |
| Current Sprint  | Board   | `iteration:@current`                    | Daily standup and sprint tracking |
| My Work         | Table   | `assignee:@me is:open`                  | Personal task list                |
| By Epic         | Table   | Group by Epic field                     | Cross-epic visibility             |
| Bug Triage      | Table   | `label:bug is:open`, sorted by Priority | Bug management                    |
| Release Roadmap | Roadmap | Group by Milestone                      | Stakeholder timeline              |

### Automation Workflows

| Workflow             | Status  | Action                                                   |
| -------------------- | ------- | -------------------------------------------------------- |
| Auto-add to project  | Enabled | Add issues with `story` or `bug` label, set to "Backlog" |
| Item closed          | Enabled | Set Status to "Done"                                     |
| Item reopened        | Enabled | Set Status to "Sprint Ready"                             |
| Pull request merged  | Enabled | Set Status to "Done"                                     |
| Code review approved | Enabled | Set Status to "In QA"                                    |

### CI Integration

The project's GitHub Actions workflow (`.github/workflows/`) runs on every PR:

1. **TypeScript build check:** `npm run build`
2. **Unit tests:** `npm test` with coverage threshold >= 85%
3. **ESLint:** `npm run lint`
4. **Terraform validation:** `terraform validate` (for infra changes)
5. **E2E smoke tests:** `npm run test:e2e:smoke` (for UI changes)

All checks must pass before a PR can be merged. The branch protection rule on `main` enforces this.

### Developer Workflow Summary

```
1. Pick a story from "Sprint Ready" on the board
2. Move it to "In Development"
3. Create branch:
   git checkout -b feature/IMS-42-device-crud-create

4. Develop with TDD:
   - Write failing test
   - Implement feature
   - Verify tests pass: npm test
   - Check lint: npm run lint
   - Check build: npm run build

5. Commit with conventional format:
   git commit -m "feat(inventory): add device creation form #42"

6. Push and create PR:
   git push -u origin feature/IMS-42-device-crud-create
   gh pr create \
     --title "[Story 2.1] Device CRUD — Create New Device" \
     --body "Closes #42"

7. PR triggers CI — all checks must pass
8. Code review (issue auto-moves to "In Review")
9. Review approved (issue auto-moves to "In QA")
10. QA verified, PR merged (issue auto-closes, moves to "Done")
```

---

## Appendix A: Quick Reference Card

### Keyboard Shortcuts (GitHub Web UI)

| Shortcut | Action                             |
| -------- | ---------------------------------- |
| `c`      | Create new issue (from Issues tab) |
| `l`      | Open label picker on an issue      |
| `a`      | Open assignee picker on an issue   |
| `m`      | Open milestone picker on an issue  |
| `/`      | Focus the search/filter bar        |
| `g i`    | Go to Issues tab                   |
| `g p`    | Go to Pull Requests tab            |
| `?`      | Show all keyboard shortcuts        |

### Filter Syntax Quick Reference

| Filter                    | Meaning                          |
| ------------------------- | -------------------------------- |
| `status:"In Development"` | Items with specific status       |
| `assignee:username`       | Items assigned to a user         |
| `assignee:@me`            | Items assigned to you            |
| `label:story`             | Items with a specific label      |
| `label:story,bug`         | Items with story OR bug label    |
| `milestone:"Sprint 12"`   | Items in a specific milestone    |
| `iteration:@current`      | Items in the current iteration   |
| `iteration:@next`         | Items in the next iteration      |
| `iteration:@previous`     | Items in the previous iteration  |
| `is:open`                 | Open items only                  |
| `is:closed`               | Closed items only                |
| `no:assignee`             | Unassigned items                 |
| `no:milestone`            | Items without a milestone        |
| `no:label`                | Items without any labels         |
| `-status:Done`            | Exclude items with "Done" status |
| `reason:completed`        | Items closed as completed        |
| `reason:"not planned"`    | Items closed as not planned      |

### Closing Keywords (for PR Body)

All of these close the referenced issue when the PR merges:

```
Closes #42
closes #42
Fixes #42
fixes #42
Resolves #42
resolves #42
Close #42
Fix #42
Resolve #42
```

Multiple issues: `Closes #42, closes #43, closes #44`

Cross-repo: `Closes your-org/other-repo#42`

---

## Appendix B: Troubleshooting

### Issue Not Appearing on Project Board

**Problem:** You created an issue but it does not show up on the project.

**Solutions:**

1. Check that the issue was added to the project. Go to the issue, look at the right sidebar for "Projects," and click the gear to add it.
2. Check your view's filter. The issue might exist but be filtered out. Clear all filters temporarily.
3. If using "Auto-add" workflow, verify the issue matches the workflow's filter criteria (correct label, correct repo).

### Status Not Updating Automatically

**Problem:** You merged a PR but the linked issue's status did not change.

**Solutions:**

1. Verify the PR body contains a closing keyword (`Closes #42`, not just `#42`).
2. Check that the "Pull request merged" workflow is enabled in Project Settings.
3. Verify the PR was merged into the default branch (usually `main`). Merging into a feature branch does not trigger auto-close.

### Custom Field Not Showing in Table

**Problem:** You added a custom field but it does not appear as a column.

**Solution:** In Table view, click the "+" at the end of the column headers and select the field. Fields exist on the project but are not automatically displayed in every view.

### Iteration Dates Are Wrong

**Problem:** Sprint dates do not align with your team's schedule.

**Solution:** Go to Project Settings, click the Iteration field, and manually adjust start dates. You can also change the duration (e.g., from 2 weeks to 1 week) and rename individual iterations.

### gh CLI Cannot Find Project

**Problem:** `gh project list` returns empty or errors.

**Solutions:**

1. Ensure you are authenticated: `gh auth status`
2. Specify the correct owner: `gh project list --owner "your-org"` (not the repo name).
3. If the project is organization-level, you need org membership.
4. Update gh CLI: `gh extension upgrade --all` and `gh upgrade`.

---

_This guide covers GitHub Projects V2 as of early 2026. GitHub frequently ships updates, so some UI elements or features may have changed. Check [GitHub's official documentation](https://docs.github.com/en/issues/planning-and-tracking-with-projects) for the latest information._
