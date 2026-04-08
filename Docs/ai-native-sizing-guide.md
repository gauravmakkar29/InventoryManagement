# AI-Native T-Shirt Sizing & Story Pointing Guide

> **Purpose:** Estimation framework for AI-assisted development where Claude Code is the primary builder. AI accelerates coding, but discussion, infrastructure, QA, review, and release ceremonies still take real human time. This guide sizes based on **total delivery effort**, not just coding speed.
>
> **Context:** IMS Gen2 — 18 epics, 107 stories, React + Amplify Gen2/CDK + NIST 800-53 compliance.
>
> **Last updated:** 2026-04-08

---

## The Problem with Traditional Sizing

Traditional T-shirt sizing and story points measure **human effort**:

- "This is a 5-pointer because it'll take a developer 2-3 days"
- "This is an XL because it's complex and needs 3 sprints"

With Claude as the builder, **coding speed is no longer the bottleneck**. What used to be a 5-point story (3 days of coding) can be built in 30 minutes. But it still might take 2 days to deliver because of:

- Review cycles (human reviews AI output)
- Integration testing (E2E, manual QA)
- Approval gates (NIST compliance, SoD)
- Dependency waiting (backend API, design, infra)
- Context complexity (how much Claude needs to understand before it can build correctly)

**The new sizing doesn't measure effort — it measures delivery friction.**

---

## What AI Speeds Up vs What It Doesn't

This is the most important section. AI makes coding 10x faster but does not eliminate the rest of the SDLC. Sizing must account for **all** delivery activities, not just code generation.

### The Full Delivery Breakdown

```
Story Delivery = Discussion + Design + AI Build + Review + QA + Infra + Release
                 ─────────── human ───────────   ── AI ──  ────── human ──────
```

### Activity-by-Activity Reality

| Activity                          | AI Impact                | Typical Time            | Why It Doesn't Shrink                                          |
| --------------------------------- | ------------------------ | ----------------------- | -------------------------------------------------------------- |
| **Requirements discussion**       | None                     | 30 min - 2 hours        | Stakeholders need alignment. AI can't attend meetings.         |
| **Design/architecture decisions** | Helps explore options    | 1-4 hours               | Humans must decide trade-offs and commit to a direction.       |
| **AI coding**                     | 10x faster               | 15-60 min               | This is what AI accelerates.                                   |
| **Code review**                   | Minor (AI can pre-check) | 30 min - 2 hours per PR | Humans must verify correctness, security, and intent.          |
| **Unit testing**                  | AI writes tests          | 15-30 min               | AI writes them, but humans verify coverage and edge cases.     |
| **E2E testing**                   | AI generates scripts     | 1-2 hours               | Running, debugging flaky selectors, and manual walkthrough.    |
| **Manual QA**                     | None                     | 30 min - 1 hour         | Someone must click through and verify the feature works.       |
| **Infrastructure setup**          | AI writes IaC            | 2 hours - 1 week        | Terraform plan/apply/validate cycles are sequential and slow.  |
| **Security review (NIST)**        | AI flags issues          | 1-2 hours               | Compliance sign-off requires human judgment.                   |
| **Sprint ceremonies**             | None                     | 2-4 hours per sprint    | Planning, standup, review, retro — pure human time.            |
| **Release process**               | None                     | 2-4 hours               | Tag, deploy to QA, test, promote to pre-prod, promote to prod. |
| **Bug triage and fix**            | AI fixes fast            | 30 min - 2 hours        | Diagnosing the root cause is human; the fix is AI.             |

### The Honest Math

```
Traditional 5-point story:
  Discussion:     1 hour
  Design:         1 hour
  Coding:         8 hours    ← AI reduces this to 30 min
  Code review:    1 hour
  Testing:        2 hours
  Total:          13 hours → ~2 days

AI-native 5-point story:
  Discussion:     1 hour     (same)
  Design:         1 hour     (same)
  AI coding:      30 min     (10x faster)
  Code review:    1 hour     (same — reviewing AI output still takes time)
  Testing:        2 hours    (same — E2E + manual QA don't shrink)
  Total:          5.5 hours → ~1 day

Speedup: ~2x on total delivery, NOT 10x
```

AI gives a **2-3x speedup on total delivery** — significant, but not the 10x that coding-only metrics suggest. The rest of the SDLC is the bottleneck.

### The NFR Check

Before finalizing any size, check for Non-Functional Requirements that add human overhead:

| NFR                                                           | If High → Impact                             |
| ------------------------------------------------------------- | -------------------------------------------- |
| **Performance** (load testing, benchmarks)                    | +1 size level — testing cycles are slow      |
| **Security** (auth, PII, NIST controls)                       | +1 size level — compliance review is human   |
| **Infra changes** (new Terraform/CDK resources)               | +1 size level — deploy cycles are sequential |
| **Cross-team dependency** (waiting on design, API, decisions) | +1 size level — calendar time, not effort    |

---

## AI-Native T-Shirt Sizing (Release Level)

Use this to size **releases/milestones** — groups of epics that ship together.

### Size Definitions

| Size   | Calendar Time     | What It Contains                                                                           | Constraint                                                    |
| ------ | ----------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| **XS** | 1-2 days          | 1-2 epics, all UI-only, no infra, no new auth patterns                                     | Zero external dependencies                                    |
| **S**  | 3-5 days (1 week) | 2-3 epics, mostly UI + mock data, simple RBAC extensions                                   | Minimal review cycles                                         |
| **M**  | 1-2 weeks         | 3-5 epics, includes API integration, new infra resources, moderate RBAC                    | Some infra/API dependencies                                   |
| **L**  | 2-4 weeks         | 5-8 epics, cross-cutting concerns (auth changes, schema migration, multi-tenant), full E2E | Significant review + testing                                  |
| **XL** | 4-6 weeks         | 8+ epics, new platform capabilities (Amplify Gen2, CDK stacks, OpenSearch), NIST audit     | Architecture decisions, infra provisioning, compliance review |

### What Determines Release Size (Not Code Volume)

| Factor                           | Weight     | Why                                                                                            |
| -------------------------------- | ---------- | ---------------------------------------------------------------------------------------------- |
| **Number of review cycles**      | High       | Every PR needs human review. More PRs = more calendar time.                                    |
| **Infra provisioning**           | High       | Terraform/CDK/Amplify changes need plan → apply → test → rollback plan. Can't be parallelized. |
| **NIST compliance touchpoints**  | High       | Changes to auth/RBAC/audit require extra scrutiny, documentation, and approval.                |
| **API schema changes**           | Medium     | GraphQL schema changes propagate to resolvers → types → UI. Each layer needs testing.          |
| **Number of new pages/modules**  | Medium     | Each new page = new route, RBAC entry, E2E test suite.                                         |
| **Dependency on external teams** | Medium     | Waiting for design, backend API, or infra team decisions.                                      |
| **Risk of rework**               | Low-Medium | Unclear requirements → Claude builds the wrong thing → human reviews → rework.                 |
| **Raw code volume**              | Low        | Claude writes 500 lines as fast as 50. Volume is NOT a sizing factor anymore.                  |

---

## AI-Native Story Pointing (Story Level)

Use this to size **individual stories** within an epic.

### The New Point Scale

We keep Fibonacci (1, 2, 3, 5, 8, 13) but redefine what the numbers mean:

| Points | Delivery Time                    | AI Build Time | Review + QA Time | Example                                                                      |
| ------ | -------------------------------- | ------------- | ---------------- | ---------------------------------------------------------------------------- |
| **1**  | 1-2 hours                        | 10-15 min     | 30-60 min        | Add a new KPI card to existing dashboard                                     |
| **2**  | 2-4 hours                        | 15-30 min     | 1-2 hours        | Add filter/sort to existing table                                            |
| **3**  | 4-8 hours (half day to full day) | 30-60 min     | 2-4 hours        | New page with table, filters, RBAC. No new patterns.                         |
| **5**  | 1-2 days                         | 1-2 hours     | 4-8 hours        | New feature with form + validation + API integration + E2E tests             |
| **8**  | 2-3 days                         | 2-4 hours     | 1-2 days         | Cross-cutting: new auth flow, schema change, or multi-step workflow          |
| **13** | 3-5 days                         | 4-8 hours     | 2-3 days         | New architectural pattern (provider adapter, CDK stack, OpenSearch pipeline) |

### What Determines Story Points

| Factor                                 | +1 Point Each | Why                                                                |
| -------------------------------------- | ------------- | ------------------------------------------------------------------ |
| **New page/route**                     | +1            | Needs route setup, RBAC entry, lazy loading, layout                |
| **New form with validation**           | +1            | Zod schema, react-hook-form, error states, accessibility           |
| **API integration (not mock)**         | +2            | Provider adapter, DTO mapping, error handling, caching strategy    |
| **New infra resource**                 | +2            | CDK/Amplify/Terraform change, deployment, validation               |
| **NIST-sensitive** (auth, RBAC, audit) | +2            | Extra review scrutiny, compliance documentation                    |
| **Multi-step workflow**                | +2            | State machine, SoD enforcement, approval gates                     |
| **New E2E test suite**                 | +1            | Java/TestNG test class, page objects, selectors, test data         |
| **Schema migration**                   | +3            | DynamoDB/Cosmos DB schema change, data migration, rollback plan    |
| **New architectural pattern**          | +3            | First-time pattern (e.g., first CDK stack, first OpenSearch query) |

### The Critical Insight: AI Build Time vs Total Delivery Time

```
Story 1.1: User Login (5 points)
├── AI Build Time:     ~45 min (Claude writes sign-in component, auth context, mock provider)
├── Human Review:      ~1 hour (review code, check NIST compliance, test manually)
├── E2E Test:          ~2 hours (write test plan, generate E2E code, run, fix flakes)
├── QA Sign-off:       ~1 hour (manual walkthrough of all ACs)
└── Total Delivery:    ~5 hours ≈ 1 day

Story 7.1: Analytics KPI Cards (3 points)
├── AI Build Time:     ~20 min (Claude writes 6 KPI cards with mock data)
├── Human Review:      ~30 min (quick review, mostly UI)
├── E2E Test:          ~1 hour (simple assertions on card values)
├── QA Sign-off:       ~30 min
└── Total Delivery:    ~2.5 hours ≈ half day
```

**AI build time is 10-15% of total delivery time.** The rest is review, testing, and process.

---

## Epic-Level Sizing for IMS Gen2

Based on our 18 epics, here's how they size in the AI-native model:

### Sizing by Complexity Category

#### Category A: UI-Heavy, Pattern-Established (S-M per epic)

These follow existing patterns — Claude builds fast, review is straightforward.

| Epic                        | Stories | Total Points | T-Shirt | Constraint                                    |
| --------------------------- | ------- | ------------ | ------- | --------------------------------------------- |
| Epic 1: Auth & User Mgmt    | 7       | ~30          | M       | NIST-sensitive (AC-3, IA-2) — extra review    |
| Epic 2: Dashboard           | 6       | ~18          | S       | Mostly UI, existing component patterns        |
| Epic 3: Inventory           | 6       | ~22          | S-M     | Table + search + filters, established pattern |
| Epic 4: Deployment Pipeline | 5       | ~25          | M       | Multi-step workflow (SoD), firmware lifecycle |
| Epic 5: Compliance          | 5       | ~20          | S-M     | CRUD + vulnerability panel, NIST audit trail  |
| Epic 6: Account & Service   | 6       | ~22          | M       | Kanban board, calendar view, drag-and-drop    |
| Epic 7: Analytics           | 6       | ~20          | S-M     | Charts (Recharts), KPIs, export               |
| Epic 8: Notifications       | 5       | ~15          | S       | Real-time updates, toast system               |

#### Category B: Integration-Heavy (M-L per epic)

These require API integration, new infra, or cross-cutting changes.

| Epic                        | Stories | Total Points | T-Shirt | Constraint                                   |
| --------------------------- | ------- | ------------ | ------- | -------------------------------------------- |
| Epic 9: Global Search       | 5       | ~28          | M-L     | OpenSearch integration, new query patterns   |
| Epic 10: Geo Location       | 6       | ~25          | M       | Map library, geo clustering, new viz pattern |
| Epic 11: Telemetry          | 7       | ~35          | L       | Real-time data pipeline, heatmaps, new infra |
| Epic 12: Advanced Analytics | 6       | ~30          | M-L     | OpenSearch aggregations, chart customization |

#### Category C: Infrastructure & Platform (L-XL per epic)

These introduce new architectural patterns or platform capabilities.

| Epic                          | Stories | Total Points | T-Shirt | Constraint                                       |
| ----------------------------- | ------- | ------------ | ------- | ------------------------------------------------ |
| Epic 13: Terraform Infra      | 6       | ~40          | L       | 13 AWS modules, state management, environments   |
| Epic 14: CI/CD Pipeline       | 6       | ~30          | L       | GitHub Actions, deployment strategy, rollback    |
| Epic 15: Performance          | 5       | ~25          | M-L     | Optimization, virtualization, code splitting     |
| Epic 16: Accessibility        | 6       | ~20          | M       | WCAG 2.1 AA audit, keyboard nav, screen readers  |
| Epic 17: Multi-Tenant         | 8       | ~40          | L-XL    | Data isolation, tenant scoping, CustomerAdmin    |
| Epic 18: Provider Abstraction | 6       | ~35          | L       | CDK/Amplify/Azure adapters, integration contract |

---

## Release Planning with AI-Native Sizing

### How to Plan a Release

1. **Group epics by dependency chain** (not by team, since Claude is the team)
2. **Size the release** using the T-shirt table above
3. **Identify the constraint** (what will actually slow delivery — review, infra, compliance?)
4. **Set a realistic calendar target** based on the constraint, not the code volume

### Example: Release 1.0 (MVP)

```
Epics: 1 (Auth) + 2 (Dashboard) + 3 (Inventory) + 4 (Deployment) + 5 (Compliance)
Stories: 29
Total Points: ~115
T-Shirt: L (2-4 weeks)

Constraint: NIST compliance on Epic 1 (auth) + Epic 4 (SoD workflow)
  → Extra review cycles on auth stories
  → Compliance documentation needed before merge

AI build time: ~20 hours (all 29 stories)
Review + QA time: ~60-80 hours
Infra setup: ~10 hours

Calendar time: ~3 weeks (accounting for review bottleneck)
```

### Example: Release 2.0 (Full Platform)

```
Epics: 6-12 (remaining features) + 15 (performance)
Stories: 41
Total Points: ~195
T-Shirt: XL (4-6 weeks)

Constraint: OpenSearch integration (Epic 9, 11, 12) requires infra first
  → CDK stack must be deployed before search stories
  → Pipeline depends on data being in OpenSearch

Calendar time: ~5 weeks (infra-gated)
```

---

## The Sizing Conversation: How to Run It

### Step 1: Requirements Intake

BA hands Claude the requirement document. Claude breaks it into epics and stories using the existing SPEC Method workflow.

```
/review-full                    # Audit existing codebase state
brownfield-inspect              # Understand current architecture
```

### Step 2: AI-Assisted Sizing

For each epic/story, ask Claude to size it using this guide:

```
Prompt: "Read Docs/ai-native-sizing-guide.md. Now size Epic 9 (Global Search)
considering our existing architecture, OpenSearch integration complexity,
and the 5 stories. Give me T-shirt size for the epic and story points
for each story with justification."
```

Claude knows:

- The codebase structure (it built it)
- Which patterns exist vs need to be created
- Which files will be touched (and whether they're NIST-sensitive)
- The E2E test effort per story type

### Step 3: Constraint Identification

For each release, identify the **actual bottleneck**:

| Question                         | If Yes →                   | Impact                               |
| -------------------------------- | -------------------------- | ------------------------------------ |
| Does it touch auth/RBAC?         | NIST review overhead       | +30% calendar time                   |
| Does it need new infra?          | CDK/Terraform deploy cycle | +1 week minimum                      |
| Does it introduce a new pattern? | Architecture review        | +2-3 days for first story, then fast |
| Does it need OpenSearch?         | Data pipeline setup        | +1 week first time                   |
| Is design finalized?             | No rework risk             | Standard timeline                    |
| Is design NOT finalized?         | Rework likely              | +50% buffer                          |

### Step 4: Capacity Planning

In AI-native development, **throughput is limited by review bandwidth, not coding bandwidth.**

```
Traditional: 1 developer = 8-10 story points per sprint
AI-native:   1 developer + Claude = 30-40 story points per sprint
                                     (but limited by review throughput)

Bottleneck: How fast can the human review, test, and approve?
  → 1 person reviewing AI output: ~15-20 stories per sprint
  → 2 people reviewing: ~30-35 stories per sprint
```

### Step 5: Create the Skill (Optional)

You can create a `/size-epic` or `/size-release` skill that automates this:

```
# .claude/commands/size-epic.md
Read Docs/ai-native-sizing-guide.md.
Read the epic at Docs/epics/epic-{N}/.
For each story:
- Count new pages, forms, API integrations, NIST touchpoints
- Calculate story points using the factor table
- Justify each point value
Output: epic T-shirt size + story point breakdown + constraint analysis
```

---

## Key Takeaways

### What Changed in AI-Native Sizing

| Traditional                          | AI-Native                                                              |
| ------------------------------------ | ---------------------------------------------------------------------- |
| Estimate **coding effort**           | Estimate **delivery friction**                                         |
| Developer velocity is the constraint | **Review bandwidth** is the constraint                                 |
| Complex logic = more points          | Complex logic = same points (Claude handles it)                        |
| Large codebase changes = XL          | Large codebase changes = M (Claude writes it fast)                     |
| New pattern = risky = more points    | New pattern = +3 points (first time), then fast                        |
| Infra work = separate team           | Infra work = Claude writes CDK, but **deploy cycle is the constraint** |

### The 5 Real Constraints in AI-Native Development

1. **Review throughput** — How fast can humans review AI-generated code?
2. **Infrastructure deploy cycles** — CDK/Terraform plan → apply → validate → rollback test
3. **NIST compliance gates** — Security-sensitive changes need extra scrutiny and documentation
4. **Integration test cycles** — E2E tests take real time to run, debug, and stabilize
5. **Requirement clarity** — Unclear requirements cause rework. AI amplifies both good and bad requirements.

### The Formula

```
Delivery Time = AI Build Time + (Review Cycles × Review Duration) + Infra Deploy Time + QA Time + Buffer

Where:
  AI Build Time     ≈ 10-15% of total (fast, predictable)
  Review Cycles     = Number of PRs × avg review time per PR
  Infra Deploy Time = 0 (UI only) to 1 week (new CDK stack)
  QA Time           = Story points × 30 min (unit) + 1 hour (E2E per story)
  Buffer            = 20% (clear requirements) to 50% (unclear requirements)
```

---

## Appendix: IMS Gen2 Project Summary

| Metric                           | Value                             |
| -------------------------------- | --------------------------------- |
| Total Epics                      | 18                                |
| Total Stories                    | 107                               |
| Total Estimated Points           | ~450                              |
| Category A (UI-heavy)            | 8 epics, ~172 points              |
| Category B (Integration)         | 4 epics, ~118 points              |
| Category C (Infrastructure)      | 6 epics, ~190 points              |
| Estimated Full Build (AI)        | ~80 hours of Claude time          |
| Estimated Full Delivery          | 12-16 weeks (review-gated)        |
| Team Size for Optimal Throughput | 1 developer + Claude + 1 reviewer |

---

## Full SDLC Checklist Per Release

AI accelerates coding, but a release requires all of these activities. None can be skipped.

| Phase               | Activities                                                          | AI Helps?                | Typical Time     |
| ------------------- | ------------------------------------------------------------------- | ------------------------ | ---------------- |
| **Discovery**       | Requirements discussion, stakeholder alignment, scope agreement     | No                       | 1-3 days         |
| **Design**          | Architecture decisions, API contracts, UI wireframes, tech spec     | Partially                | 1-2 days         |
| **Sprint Planning** | Story breakdown, pointing, assignment, capacity check               | Partially                | 2-4 hours        |
| **Development**     | Coding, unit tests, component tests                                 | Yes (10x)                | 1-3 days         |
| **Code Review**     | PR review, feedback cycles, rework                                  | No                       | 1-2 hours per PR |
| **Integration**     | Wire to real APIs, environment config, secrets management           | Partially                | 1-2 days         |
| **Infrastructure**  | Terraform/CDK plan, apply, validate, rollback testing               | Partially (writes IaC)   | 1-5 days         |
| **QA - Automated**  | E2E test execution, flaky test fixes, report generation             | Partially (writes tests) | 1-2 days         |
| **QA - Manual**     | Walkthrough every AC, exploratory testing, edge cases               | No                       | 1-2 days         |
| **Security Review** | NIST compliance check, penetration testing, audit sign-off          | No                       | 1-2 days         |
| **Bug Fix Cycle**   | Triage bugs from QA, fix, re-test, verify                           | Yes (fixes fast)         | 1-3 days         |
| **Release**         | Tag, deploy to QA, promote to pre-prod, smoke test, promote to prod | No                       | 2-4 hours        |
| **Sprint Review**   | Demo to stakeholders, collect feedback                              | No                       | 1-2 hours        |
| **Retrospective**   | What went well, what to improve, action items                       | No                       | 1 hour           |

**Total for a typical release:** 3-6 weeks, of which AI coding is 2-3 days.

---

## Guardrails

### Reviewer Fatigue

AI increases code output by 10x but human review speed improves only ~1.2x. Size tasks based on the reviewer's capacity, not the AI's speed. A sprint with 40 AI-generated stories but only 1 reviewer will bottleneck at review, not coding.

**Rule of thumb:** 1 reviewer can handle 3-4 PRs per day with quality attention.

### The Speed Illusion

Fast code generation does not mean a small task. If discussion, testing, or compliance review takes hours, the story is not small — regardless of how fast Claude wrote the code.

**Size based on total delivery time, not AI build time.**

### XL Means Stop

Never start development on an XL story. It produces spaghetti code and prompt-looping. Always decompose to L or smaller before writing any code.

### The Context Trap

Keep stories XS-M sized so they fit within the AI's effective context window. Larger stories cause the AI to lose track of requirements and produce inconsistent output.

---

## Post-Sprint Calibration

After each sprint, capture these metrics to improve future estimates:

| Metric                      | What to Track                              | Action                                               |
| --------------------------- | ------------------------------------------ | ---------------------------------------------------- |
| Estimated vs Actual points  | Story-by-story comparison                  | Adjust sizing factors if consistently off            |
| AI Build Time vs Total Time | Ratio per story                            | If AI time is >20% of total, stories are too small   |
| Review Bottleneck           | Hours waiting for review per PR            | Add reviewers if queue exceeds 1 day                 |
| Bug Escape Rate             | Bugs found in QA vs prod                   | Improve test coverage or review rigor                |
| Discussion Time             | Hours spent in meetings per story          | If >2 hours, requirements are unclear — fix upstream |
| Infra Lead Time             | Days from IaC merge to working environment | Optimize pipeline or pre-provision                   |

**The goal:** Make future estimates more accurate by learning what actually consumed the time — was it discussion, review, QA, infra, or rework?
