# Claude Code Guardrails, Rules & Skills — Complete Guide

> **Purpose:** Understand every guardrail, rulebook, skill, agent, hook, and workflow configured in this project — what each does, why it exists, and how to use it.
>
> **Audience:** Project owner, contributors, and future maintainers.
>
> **Last updated:** 2026-04-04

---

## Table of Contents

1. [How It All Fits Together](#1-how-it-all-fits-together)
2. [Rulebooks — Enforceable Standards](#2-rulebooks--enforceable-standards)
3. [Skills — On-Demand Audit Commands](#3-skills--on-demand-audit-commands)
4. [Agents — Specialized AI Personas](#4-agents--specialized-ai-personas)
5. [Workflows — Step-by-Step Processes](#5-workflows--step-by-step-processes)
6. [Hooks — Automated Guardrails](#6-hooks--automated-guardrails)
7. [Git Hooks — Pre-Commit Quality Gates](#7-git-hooks--pre-commit-quality-gates)
8. [Configuration Files — Where Settings Live](#8-configuration-files--where-settings-live)
9. [How to Add New Guardrails](#9-how-to-add-new-guardrails)
10. [Quick Reference Cheat Sheet](#10-quick-reference-cheat-sheet)

---

## 1. How It All Fits Together

Think of the quality system as layers, each catching different types of issues at different times:

```
┌─────────────────────────────────────────────────────────┐
│                    YOU (Developer)                        │
│                                                          │
│  Type a command ──▶ /review-security                     │
│                    /review-architecture                   │
│                    /review-full                           │
│                                                          │
│  These are SKILLS — on-demand audits you invoke.         │
└────────────────────────┬────────────────────────────────┘
                         │ reads
┌────────────────────────▼────────────────────────────────┐
│                    RULEBOOKS                              │
│                                                          │
│  The rules each skill checks against.                    │
│  Also read by Claude during implementation.              │
│                                                          │
│  security-nist / architecture / api-data-layer /         │
│  performance / code-quality / e2e                        │
└────────────────────────┬────────────────────────────────┘
                         │ enforced by
┌────────────────────────▼────────────────────────────────┐
│                    HOOKS (Automated)                      │
│                                                          │
│  Fire automatically when you edit code.                  │
│  No command needed — they run in the background.         │
│                                                          │
│  NIST security check ──▶ on Edit of auth files           │
│  Architecture check  ──▶ on Write of new src/ files      │
└────────────────────────┬────────────────────────────────┘
                         │ at commit time
┌────────────────────────▼────────────────────────────────┐
│                    GIT HOOKS                              │
│                                                          │
│  Run before every commit. Block bad code from entering.  │
│                                                          │
│  lint-staged  ──▶ ESLint + Prettier on staged files      │
│  commitlint   ──▶ Enforces conventional commit messages  │
└─────────────────────────────────────────────────────────┘
```

### When Each Layer Activates

| Layer                    | When                                 | Automatic?              | Can Block?               |
| ------------------------ | ------------------------------------ | ----------------------- | ------------------------ |
| **Skills** (`/review-*`) | When you invoke them                 | No — you run manually   | No — advisory report     |
| **Rulebooks**            | During implementation and review     | Yes — Claude reads them | No — guides behavior     |
| **Hooks**                | Every time Claude edits/writes files | Yes — fully automatic   | Yes — injects warnings   |
| **Git Hooks**            | Every `git commit`                   | Yes — fully automatic   | Yes — blocks bad commits |

---

## 2. Rulebooks — Enforceable Standards

**Location:** `SPEC/rulebooks/`

Rulebooks are the single source of truth for how code should be written. Claude reads them during implementation, and skills reference them during audits.

### 2.1 Security / NIST 800-53 (`security-nist-rulebook.md`)

**Why it exists:** This is a NIST 800-53 governed project. Security rules can't live only as prose in CLAUDE.md — they need to be structured, checkable, and enforceable. We discussed NIST controls many times but had no dedicated rulebook until now.

**What it covers:**

| NIST Control                    | Rule                                          | Example Check                                            |
| ------------------------------- | --------------------------------------------- | -------------------------------------------------------- |
| **AC-3** (Access Enforcement)   | Every page/mutation must go through `rbac.ts` | `grep "user.role ===" src/` must return 0                |
| **AC-5** (Separation of Duties) | Firmware: uploader ≠ tester ≠ approver        | No same-user multi-stage approval in mutations           |
| **AC-6** (Least Privilege)      | Each role gets minimum permissions            | New role permissions require PR justification            |
| **AC-11** (Session Lock)        | 15-min idle timeout with re-auth prompt       | Timeout must be configurable, not hardcoded              |
| **AC-12** (Session Termination) | Logout clears ALL tokens and state            | No tokens left in localStorage after logout              |
| **AU-2/3** (Audit Records)      | Every mutation creates an audit trail         | Required fields: timestamp, action, userId, before/after |
| **IA-2** (User ID)              | MFA required for Admin/Manager                | No shared accounts, 12-char password minimum             |
| **SI-3** (Malicious Code)       | No `dangerouslySetInnerHTML`                  | `grep "dangerouslySetInnerHTML" src/` must return 0      |
| **SI-10** (Input Validation)    | Zod schema on every form                      | Count of `<form>` tags must match `zodResolver` count    |
| **SC-8** (Transmission)         | HTTPS only, TLS 1.2+                          | `grep "http://" src/` must return 0 (except localhost)   |
| **SC-12** (Key Management)      | KMS-managed keys, no hardcoded secrets        | No API keys, tokens, or passwords in source code         |

**When Claude reads it:**

- Before implementing any auth, RBAC, session, or security feature
- When the NIST security hook fires (editing security-sensitive files)
- When you run `/review-security`

---

### 2.2 Architecture (`architecture-rulebook.md`)

**Why it exists:** Without explicit module boundaries, features bleed into each other. The firmware folder imports from devices, components grow to 1000+ lines, and the provider abstraction gets bypassed. This rulebook prevents architectural rot.

**What it covers:**

| Area                     | Key Rules                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------ |
| **Folder Structure**     | Feature-based: one feature = one folder under `components/`. No nesting.                   |
| **Dependency Flow**      | Strict layers: Components → Hooks → Providers → Types. No upward imports.                  |
| **No Cross-Imports**     | `devices/` cannot import from `firmware/`. Shared code goes to `shared/` or `lib/`.        |
| **God Components**       | Max 10 `useState` calls, max 400 lines. More than 3 responsibilities = split.              |
| **Provider Abstraction** | Frontend NEVER imports cloud SDKs directly. Always through `IAuthAdapter`/`IApiProvider`.  |
| **State Management**     | Server state = TanStack Query. Client state = Zustand. Forms = react-hook-form. No mixing. |
| **Error Handling**       | 3 layers: ErrorBoundary (render crashes), try/catch (API), Zod (form validation).          |

**The dependency diagram to remember:**

```
components/ ──▶ lib/hooks/ ──▶ lib/providers/ ──▶ lib/types
     │                                               ▲
     └──────── lib/utils/ ───────────────────────────┘
```

---

### 2.3 API & Data Layer (`api-data-layer-rulebook.md`)

**Why it exists:** The API layer is the bridge between UI and backend. Without rules, you get scattered `fetch()` calls, inconsistent error handling, no caching, and DTO leaking into components. This rulebook ensures clean data flow.

**What it covers:**

| Area                     | Key Rules                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------ |
| **Single Entry Point**   | All API calls: Component → Hook → IApiProvider → Adapter. Never call `fetch()` from components.        |
| **3 Model Layers**       | DTO (wire format) → Domain (app types) → View (display format). Transform at each boundary.            |
| **Caching**              | TanStack Query with `staleTime` set on every query. Dashboard: 30s. Lists: 30s. Reference data: 30min. |
| **Error Classification** | 400 = inline errors, 401 = redirect, 403 = toast, 429 = auto-retry, 500 = toast + retry button.        |
| **Input Validation**     | Zod at every boundary: form submit, API request, URL params, file uploads.                             |
| **Pagination**           | Cursor-based (not offset). Default 25 items. Use `useInfiniteQuery` for infinite scroll.               |

**The data flow to remember:**

```
Component ──▶ Custom Hook ──▶ API Provider ──▶ Backend
  (View)      (TanStack Q)    (Adapter)       (AppSync/Functions)
```

---

### 2.4 Performance (`performance-rulebook.md`)

**Why it exists:** Enterprise apps with 10K+ devices, large tables, and real-time updates will crawl without performance discipline. This rulebook sets measurable budgets and rules.

**What it covers:**

| Area                | Budget/Rule                                                                            |
| ------------------- | -------------------------------------------------------------------------------------- |
| **LCP**             | < 2.5 seconds                                                                          |
| **Initial JS**      | < 150 KB gzipped                                                                       |
| **Per-route chunk** | < 80 KB gzipped                                                                        |
| **React.memo**      | Only on pure display components with stable props. Must have a comment explaining why. |
| **Virtualization**  | Required for tables with 200+ rows (`@tanstack/react-virtual`).                        |
| **Debouncing**      | Search: 300ms. Filter: 150ms. Never fire API on every keystroke.                       |
| **Code Splitting**  | Every route lazy-loaded. Heavy libs (charts, maps, PDF) loaded on demand.              |
| **Animations**      | Only `transform` and `opacity`. 150-200ms duration. Respect `prefers-reduced-motion`.  |

---

### 2.5 Code Quality (`code-quality-rulebook.md`)

**Why it exists:** Pre-existing rulebook that sets baseline code standards. Works with ESLint and pre-commit hooks to block violations.

**Key rules:** 400-line warning / 600-line block, no `any` type, no `console.log`, WCAG 2.1 AA accessibility, no barrel exports, import ordering.

---

### 2.6 E2E Testing (`e2e-rulebook.md`)

**Why it exists:** The E2E framework (Java/Maven/TestNG/Playwright) has specific conventions. This rulebook is the source of truth for test plan generation and E2E code generation.

**Key rules:** Every AC needs a P1 test, selectors discovered from live app via Playwright MCP (never guessed), test plan format, naming conventions, GitHub traceability.

---

## 3. Skills — On-Demand Audit Commands

**Location:** `.claude/commands/`

Skills are slash commands you type in Claude Code to run structured audits. Each skill reads the relevant rulebook, scans the codebase, and produces a structured report.

### 3.1 `/review-security`

**Why it was created:** NIST 800-53 compliance was only in CLAUDE.md as prose. No way to systematically audit the codebase against specific controls. This skill runs a full NIST audit.

**What it does:**

1. Reads `security-nist-rulebook.md` + `nist-800-53-control-mapping.md`
2. Audits auth & session management (AC-11, AC-12, IA-2)
3. Audits RBAC & authorization (AC-3, AC-5, AC-6)
4. Audits input validation & XSS (SI-3, SI-10)
5. Audits transmission & data security (SC-8, SC-12)
6. Audits audit trail (AU-2, AU-3)
7. Outputs a NIST Compliance Scorecard with pass/warn/fail per control

**Usage:**

```
/review-security                          # Audit entire src/
/review-security src/lib/auth-context.tsx  # Audit specific file
```

---

### 3.2 `/review-architecture`

**Why it was created:** Architecture drift happens gradually — one cross-import, one God component, one bypassed abstraction. This skill catches drift before it compounds.

**What it does:**

1. Reads `architecture-rulebook.md` + `code-quality-rulebook.md`
2. Checks folder structure (feature-based layout)
3. Checks dependency flow (no circular imports, no cross-imports)
4. Finds God components (>400 lines, >10 useState)
5. Validates provider abstraction (no direct cloud SDK imports)
6. Checks state management patterns
7. Outputs A-D scorecard per area

**Usage:**

```
/review-architecture                                    # Full audit
/review-architecture src/app/components/devices/        # Audit one module
```

---

### 3.3 `/review-performance`

**Why it was created:** Performance bottlenecks are invisible until users complain. This skill proactively finds re-render issues, bundle bloat, and missing optimizations.

**What it does:**

1. Reads `performance-rulebook.md`
2. Finds inline objects/arrays in JSX (re-render triggers)
3. Checks memoization usage
4. Checks code splitting and lazy loading
5. Checks debouncing on search/filter
6. Checks memory leak patterns (missing useEffect cleanup)
7. Outputs A-D scorecard per area

**Usage:**

```
/review-performance                                    # Full audit
/review-performance src/app/components/dashboard/      # Audit one module
```

---

### 3.4 `/review-full`

**Why it was created:** Your "Review AI" document had 11 audit prompts. Instead of running them one by one, this skill runs all 11 sequentially and produces an executive summary.

**The 11 audit areas:**

| #   | Area                  | Source Prompt        |
| --- | --------------------- | -------------------- |
| 1   | Architecture & Design | Review AI prompt #1  |
| 2   | State Management      | Review AI prompt #2  |
| 3   | Data & API Layer      | Review AI prompt #3  |
| 4   | Component Design      | Review AI prompt #4  |
| 5   | Performance           | Review AI prompt #5  |
| 6   | Auth & Session        | Review AI prompt #6  |
| 7   | Security (NIST)       | Review AI prompt #7  |
| 8   | Testing               | Review AI prompt #8  |
| 9   | Code Quality          | Review AI prompt #9  |
| 10  | DevOps & CI/CD        | Review AI prompt #10 |
| 11  | Scalability           | Review AI prompt #11 |

**Output includes:**

- Per-area findings (Critical / Improvements / Good Practices)
- Overall A-D grade
- Top 10 priority actions
- Technical debt summary

**Usage:**

```
/review-full                              # Full 11-point audit
/review-full src/app/components/          # Scoped audit
```

---

### 3.5 `/test-plan` and `/generate-e2e`

**Pre-existing skills** for QA workflow:

- `/test-plan story-1.1` — generates QA test plan from story ACs
- `/generate-e2e story-1.1` — generates Java/Playwright E2E test code from approved test plan

---

## 4. Agents — Specialized AI Personas

**Location:** `SPEC/agents/`

Agents are role definitions that skills and workflows load to adopt a specific expertise persona.

| Agent             | File               | Role                                                                  | Used By               |
| ----------------- | ------------------ | --------------------------------------------------------------------- | --------------------- |
| **QA Planner**    | `qa-planner.md`    | Reads stories, explores live app via Playwright, generates test plans | `/test-plan` skill    |
| **E2E Generator** | `e2e-generator.md` | Reads approved test plans, generates Java/Playwright test code        | `/generate-e2e` skill |
| **E2E Triage**    | `e2e-triage.md`    | Runs tests, analyzes failures, files bug reports                      | `run-e2e` workflow    |

**Why agents exist separately from skills:** An agent defines the expertise and mindset. A skill defines the specific task. Multiple skills could use the same agent. For example, both `/test-plan` and a future `/review-tests` skill could use the QA Planner agent.

---

## 5. Workflows — Step-by-Step Processes

**Location:** `SPEC/workflows/`

Workflows are detailed checklists for multi-step processes. They define the exact sequence of actions.

| Workflow         | File              | Steps                                                                                     |
| ---------------- | ----------------- | ----------------------------------------------------------------------------------------- |
| **Test Plan**    | `test-plan.md`    | Read story → explore app → discover selectors → generate test cases → create GitHub issue |
| **Generate E2E** | `generate-e2e.md` | Read test plan → generate Java test class → validate selectors → create PR                |
| **Run E2E**      | `run-e2e.md`      | Run Maven tests → collect results → triage failures → file bugs                           |

**Why workflows exist separately from skills:** A skill is the entry point (the command you type). A workflow is the detailed procedure. The skill loads the workflow and follows it. This separation means you can update the procedure without changing the command.

---

## 6. Hooks — Automated Guardrails

**Location:** `.claude/settings.json`

Hooks are commands that run automatically when Claude Code performs certain actions. They require NO manual invocation — they fire in the background.

### 6.1 NIST Security Hook

**Type:** PreToolUse (runs BEFORE Claude edits a file)

**Why it was created:** Security-sensitive files (`rbac.ts`, `security.ts`, `auth-context.tsx`, `sign-in.tsx`, `*-auth-adapter.ts`) are load-bearing NIST compliance code. Editing them without awareness of the NIST controls they enforce can break compliance. This hook automatically reminds Claude which controls apply.

**How it works:**

```
Claude about to edit rbac.ts
        │
        ▼
Hook reads the file path from stdin (JSON)
        │
        ▼
Checks if filename ends with a security-sensitive pattern
        │
    ┌───┴───┐
    │  YES  │  NO → does nothing (silent)
    │       │
    ▼       │
Injects NIST reminder into Claude's context:
"You are editing a security-sensitive file.
 Follow security-nist-rulebook.md.
 Controls: AC-3, AC-5, AC-11/12, SI-3, SI-10."
```

**Trigger files:**

- `rbac.ts` — RBAC enforcement (AC-3)
- `security.ts` — Sanitization, CSP (SI-3)
- `auth-context.tsx` — Session management (AC-11, AC-12)
- `sign-in.tsx` — Authentication flow (IA-2)
- `*-auth-adapter.ts` — Provider-specific auth (IA-2, AC-12)

**What you see:** A brief "Checking NIST security guardrails..." spinner, then Claude proceeds with the NIST context injected.

---

### 6.2 Architecture Structure Hook

**Type:** PostToolUse (runs AFTER Claude creates a new file)

**Why it was created:** The architecture rulebook defines where files should live (`src/app/components/{feature}/`, `src/lib/`, `src/__tests__/`). Without enforcement, new files get created in ad-hoc locations — `src/utils/`, `src/helpers/`, `src/services/` — breaking the architecture.

**How it works:**

```
Claude just created a new file via Write tool
        │
        ▼
Hook reads the file path
        │
        ▼
Is the file in src/?
    │
    ├── NO → does nothing (non-src files like docs, config are fine)
    │
    ├── YES → is it in a valid location?
    │         Valid: /src/app/components/*, /src/lib/*, /src/__tests__/*,
    │                App.tsx, main.tsx, index.css, vite-env.d.ts
    │
    ├── VALID → does nothing (silent)
    │
    └── INVALID → injects warning:
        "File created outside standard structure.
         Valid locations: src/app/components/{feature}/, src/lib/, src/__tests__/.
         See architecture-rulebook.md."
```

**What you see:** A brief "Checking architecture structure..." spinner. If the file is in a bad location, Claude receives the warning and should move it.

---

### Why These Two Hooks (and Not Others)?

We chose these two because they guard the highest-risk areas:

1. **Security files** — breaking NIST compliance has legal/audit consequences. The cost of a mistake is high. Automated reminders prevent "I forgot this file enforces AC-3."

2. **Architecture structure** — once files exist in wrong locations, they accumulate imports and become hard to move. Catching it at creation time is 10x cheaper than refactoring later.

**Hooks we considered but didn't add (yet):**

- Auto-format on Write/Edit (prettier) — already handled by lint-staged on commit
- Auto-run tests on Write — too slow for every edit, better as a manual step
- Block `console.log` on Edit — already caught by ESLint in pre-commit

---

## 7. Git Hooks — Pre-Commit Quality Gates

**Location:** `.husky/`

These are traditional git hooks that run on every `git commit`. They are the last line of defense.

| Hook           | File                | What It Runs            | What It Catches                                                |
| -------------- | ------------------- | ----------------------- | -------------------------------------------------------------- |
| **pre-commit** | `.husky/pre-commit` | `npx lint-staged`       | ESLint errors, Prettier formatting, `any` types, `console.log` |
| **commit-msg** | `.husky/commit-msg` | `npx commitlint --edit` | Bad commit message format (must be `feat(scope): description`) |

**lint-staged** runs ESLint + Prettier only on staged files (fast), not the whole codebase.

**commitlint** enforces conventional commits:

```
✅ feat(devices): add search filter #123
✅ fix(auth): handle token refresh race condition #456
❌ updated stuff
❌ WIP
```

---

## 8. Configuration Files — Where Settings Live

| File                          | Scope    | Git Committed?  | Purpose                                                                           |
| ----------------------------- | -------- | --------------- | --------------------------------------------------------------------------------- |
| `.claude/claude.md`           | Project  | Yes             | Master instructions — skills table, rulebook references, hooks docs, core rules   |
| `.claude/settings.json`       | Project  | Yes             | Hooks configuration (NIST + architecture guardrails). Shared with team.           |
| `.claude/settings.local.json` | Personal | No (.gitignore) | Your personal permissions (which tools Claude can run without asking)             |
| `CLAUDE.md` (root)            | Project  | Yes             | Tech stack, coding standards, NIST controls, development workflow, what-not-to-do |
| `.commitlintrc`               | Project  | Yes             | Commit message format rules                                                       |
| `.husky/*`                    | Project  | Yes             | Git hooks (pre-commit, commit-msg)                                                |

**Settings load order:** User (`~/.claude/settings.json`) → Project (`.claude/settings.json`) → Local (`.claude/settings.local.json`). Later overrides earlier.

---

## 9. How to Add New Guardrails

### Add a New Rulebook

1. Create `SPEC/rulebooks/{name}-rulebook.md`
2. Follow the format: title, rules with code examples, violation checks
3. Add it to the table in `.claude/claude.md` under "Rulebooks"
4. Reference it from relevant skills

### Add a New Skill

1. Create `.claude/commands/{skill-name}.md`
2. Follow the format: usage line, instructions, audit checklist, output format
3. Reference the relevant rulebooks
4. Add it to the skills table in `.claude/claude.md`
5. Claude Code auto-discovers it — no restart needed

### Add a New Hook

1. Edit `.claude/settings.json`
2. Add to `PreToolUse` (before action) or `PostToolUse` (after action)
3. Set the `matcher` to the tool name (`Edit`, `Write`, `Bash`, etc.)
4. Write the command using `node -e` (since `jq` isn't available on Windows)
5. Return JSON with `hookSpecificOutput.additionalContext` to inject messages
6. Pipe-test the command before deploying
7. Open `/hooks` in Claude Code or restart to reload

### Add a New Agent

1. Create `SPEC/agents/{agent-name}.md`
2. Define: Role, Responsibilities, Tools, Output format
3. Reference it from the workflow/skill that uses it

---

## 10. Quick Reference Cheat Sheet

### Skills (type these in Claude Code)

```
/review-security                    # NIST 800-53 compliance audit
/review-architecture                # Architecture health check
/review-performance                 # Performance audit
/review-full                        # All 11 audits combined
/test-plan story-1.1                # Generate QA test plan
/generate-e2e story-1.1             # Generate E2E test code
```

### What Fires Automatically

| When You...                          | What Happens                              |
| ------------------------------------ | ----------------------------------------- |
| Edit `rbac.ts`                       | NIST hook injects AC-3/AC-5/AC-6 reminder |
| Edit `security.ts`                   | NIST hook injects SI-3/SI-10 reminder     |
| Edit `auth-context.tsx`              | NIST hook injects AC-11/AC-12 reminder    |
| Edit `sign-in.tsx`                   | NIST hook injects IA-2 reminder           |
| Edit `*-auth-adapter.ts`             | NIST hook injects auth control reminder   |
| Create file in wrong `src/` location | Architecture hook warns about structure   |
| Run `git commit`                     | lint-staged runs ESLint + Prettier        |
| Run `git commit`                     | commitlint validates message format       |

### File Inventory

```
SPEC/
├── rulebooks/          # 6 rulebooks (security, architecture, API, performance, code-quality, e2e)
├── agents/             # 3 agents (qa-planner, e2e-generator, e2e-triage)
└── workflows/          # 3 workflows (test-plan, generate-e2e, run-e2e)

.claude/
├── commands/           # 6 skills (/review-security, /review-architecture, /review-performance,
│                       #           /review-full, /test-plan, /generate-e2e)
├── claude.md           # Master SPEC Method instructions
├── settings.json       # 2 hooks (NIST security, architecture structure)
└── settings.local.json # Personal permissions (not committed)

.husky/
├── pre-commit          # lint-staged (ESLint + Prettier)
└── commit-msg          # commitlint (conventional commits)
```

### Total: 24 files forming the quality system

| Category     | Count | Purpose                           |
| ------------ | ----- | --------------------------------- |
| Rulebooks    | 6     | Define the rules                  |
| Skills       | 6     | Run audits on demand              |
| Agents       | 3     | AI personas for specialized tasks |
| Workflows    | 3     | Step-by-step processes            |
| Hooks        | 2     | Automated Claude Code guardrails  |
| Git Hooks    | 2     | Pre-commit quality gates          |
| Config Files | 3     | Settings and instructions         |
