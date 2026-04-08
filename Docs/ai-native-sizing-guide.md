# AI-Native Sizing Guide

> Sizing framework for AI-assisted development. AI accelerates every phase — sizing is based on **total delivery effort across the full build cycle**, not coding speed alone.

---

## The Sizing Hierarchy

```
Build/Release  →  T-shirt size (calculated from epic count + complexity)
  └── Epic     →  T-shirt size (calculated from story count + total points)
      └── Story →  Story points (set per story)
```

- **Stories** are the atomic unit — sized in story points
- **Epics** roll up automatically — T-shirt from total story points
- **Builds** roll up automatically — T-shirt from epic count and complexity

---

## Story Points

| Points | What It Means    | AI Build | Total Delivery | Example                            |
| ------ | ---------------- | -------- | -------------- | ---------------------------------- |
| **1**  | Trivial change   | 10 min   | 1-2 hours      | Add field to existing form         |
| **2**  | Small feature    | 15 min   | 2-4 hours      | Add filter to table                |
| **3**  | Standard feature | 30 min   | 4-8 hours      | New page with table + RBAC         |
| **5**  | Complex feature  | 1 hour   | 1-2 days       | Form + API + validation + E2E      |
| **8**  | Cross-cutting    | 2 hours  | 2-3 days       | Auth flow, schema change, workflow |
| **13** | New pattern      | 4 hours  | 3-5 days       | New provider adapter, CDK stack    |

### Point Modifiers

| Factor                               | Impact |
| ------------------------------------ | ------ |
| New page/route                       | +1     |
| New form with Zod validation         | +1     |
| API integration (not mock)           | +2     |
| New infra resource (Terraform/CDK)   | +2     |
| NIST-sensitive (auth, RBAC, audit)   | +2     |
| Multi-step workflow (SoD, approvals) | +2     |
| Schema migration                     | +3     |
| First-time architectural pattern     | +3     |

---

## Epic T-Shirt Sizing

Calculated from total story points in the epic:

| Total Points | T-Shirt | Example                                    |
| ------------ | ------- | ------------------------------------------ |
| 1-10         | **XS**  | Small utility epic, 2-3 simple stories     |
| 11-18        | **S**   | Standard CRUD epic, 4-6 stories            |
| 19-28        | **M**   | Moderate complexity, API + infra involved  |
| 29-40        | **L**   | Cross-cutting, auth/security, many stories |
| 41+          | **XL**  | Platform-level, decompose if possible      |

---

## Build/Release T-Shirt Sizing

Calculated from epic count and total complexity:

| Total Points | T-Shirt | Typical Duration | Example                               |
| ------------ | ------- | ---------------- | ------------------------------------- |
| 1-30         | **S**   | 3-5 days         | Docs + testing + backlog cleanup      |
| 31-60        | **M**   | 1-2 weeks        | 2-3 epics, moderate integration       |
| 61-100       | **L**   | 2-4 weeks        | 5+ epics, cross-cutting concerns      |
| 101+         | **XL**  | 4-6 weeks        | 7+ epics, infra + security + platform |

---

## How AI Assists Each Phase

| Phase              | AI Role                          | Human Role                | Traditional | AI-Native    |
| ------------------ | -------------------------------- | ------------------------- | ----------- | ------------ |
| **Requirements**   | Drafts stories, generates ACs    | Scope decisions, priority | 2-3 days    | 4-8 hours    |
| **Architecture**   | Explores options, generates ADRs | Decides trade-offs        | 1-2 days    | 2-4 hours    |
| **Implementation** | Writes code + tests              | Reviews, validates intent | 2-4 weeks   | 2-3 days     |
| **Code Review**    | Pre-reviews (security, arch)     | Final approval            | 1-2 hrs/PR  | 30-60 min/PR |
| **Testing**        | Generates E2E, triages failures  | Validates coverage        | 1-2 weeks   | 2-3 days     |
| **Infrastructure** | Writes IaC                       | Apply/validate cycles     | 1-2 weeks   | 3-5 days     |
| **Security**       | Runs NIST audit, flags issues    | Compliance sign-off       | 1 week      | 1-2 days     |
| **Release**        | Changelog, branch promotion      | Smoke test, go/no-go      | 1-2 days    | 4-8 hours    |

**Result: 3-4x compression on the full build cycle.**

---

## Build Cycle Phases

Every release goes through these. AI assists each, none can be skipped.

| Phase             | AI + Human                                          | Duration  |
| ----------------- | --------------------------------------------------- | --------- |
| **Scope & Plan**  | AI drafts breakdown, human decides cut-line         | 1-2 days  |
| **Build**         | AI writes code + tests, human reviews PRs           | 2-5 days  |
| **Integrate**     | AI writes adapters + IaC, human validates           | 1-3 days  |
| **QA Gate**       | AI runs E2E + triages, human approves quality       | 1-2 days  |
| **Security Gate** | AI audits NIST, human signs off                     | 1 day     |
| **Release**       | AI manages PRs + notes, human promotes environments | 4-8 hours |

---

## Guardrails

**Reviewer Fatigue** — AI outputs code 10x faster but review speed only improves ~1.2x. Size based on reviewer capacity: 1 reviewer handles 3-4 PRs/day with quality attention.

**Speed Illusion** — Fast code generation does not mean small task. If review + QA + compliance takes hours, the story is not small.

**XL = Stop** — Never start an XL story. Decompose to L or smaller first.

**Context Trap** — Keep stories XS-M so AI stays within effective context window. Larger stories cause inconsistent output.

---

## Post-Sprint Calibration

| Metric                      | Action                                        |
| --------------------------- | --------------------------------------------- |
| Estimated vs actual points  | Adjust sizing factors if consistently off     |
| AI build time vs total time | If AI is >20% of total, stories are too small |
| Review queue                | Add reviewers if queue exceeds 1 day          |
| Bug escape rate             | Improve test coverage or review rigor         |

---

## IMS Gen2 Actuals

| Build                           | Epics | Stories | Points | T-Shirt | Status  |
| ------------------------------- | ----- | ------- | ------ | ------- | ------- |
| Build 1 — Core Platform         | 7     | 42      | 188    | XL      | Done    |
| Build 2 — Advanced Features     | 10    | 58      | 205    | XL      | Done    |
| Build 3 — Enterprise Hardening  | 6     | 58      | 206    | XL      | Done    |
| Build 4 — External Integrations | 2     | 21      | 89     | L       | Done    |
| Build 5 — Quality & Docs        | —     | —       | —      | S       | Done    |
| Build 6 — Production Ready      | —     | —       | —      | L       | Planned |
