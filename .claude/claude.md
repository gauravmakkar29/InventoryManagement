# SPEC Method - Claude Code Instructions

> This project uses **SPEC Method** for structured AI-native software development.

---

## SPEC Method Workflows

### Available Workflows

When user says any of these commands, read the corresponding workflow file:

| Command                   | Workflow File                                 |
| ------------------------- | --------------------------------------------- |
| `brownfield-inspect`      | `SPEC/workflows/brownfield-inspect.toon`      |
| `brownfield-deep-dive`    | `SPEC/workflows/brownfield-deep-dive.toon`    |
| `brownfield-plan`         | `SPEC/workflows/brownfield-plan.toon`         |
| `greenfield-requirements` | `SPEC/workflows/greenfield-requirements.toon` |
| `greenfield-architecture` | `SPEC/workflows/greenfield-architecture.toon` |
| `greenfield-patterns`     | `SPEC/workflows/greenfield-patterns.toon`     |
| `greenfield-plan`         | `SPEC/workflows/greenfield-plan.toon`         |
| `architect-design`        | `SPEC/workflows/architect-design.toon`        |
| `project-kickoff`         | `SPEC/workflows/project-kickoff.toon`         |
| `dev-implement`           | `SPEC/workflows/dev-implement.toon`           |
| `review-code`             | `SPEC/workflows/review-code.toon`             |
| `unit-test-validate`      | `SPEC/workflows/unit-test-validate.toon`      |
| `test-plan`               | `SPEC/workflows/test-plan.md`                 |
| `generate-e2e`            | `SPEC/workflows/generate-e2e.md`              |
| `run-e2e`                 | `SPEC/workflows/run-e2e.md`                   |

### Skills Available

Claude Code skills are pre-configured for SPEC Method workflows:

| Skill               | Command                                                                      | Description                                            |
| ------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------ |
| implement           | `/implement story-1.1`                                                       | Execute story implementation with TDD                  |
|                     | `/implement next story`                                                      | Implement next story in sequence                       |
| test-plan           | `test-plan story-1.1` or `test-plan #42`                                     | Generate QA test plan for a story                      |
| generate-e2e        | `generate-e2e story-1.1`                                                     | Generate E2E Java test code from approved plan         |
| run-e2e             | `run-e2e smoke` or `run-e2e regression`                                      | Run E2E locally, triage failures, file bugs            |
| review-security     | `/review-security` or `/review-security src/lib/auth-context.tsx`            | NIST 800-53 security audit with compliance scorecard   |
| review-architecture | `/review-architecture` or `/review-architecture src/app/components/devices/` | Architecture health check (structure, coupling, state) |
| review-performance  | `/review-performance`                                                        | Performance audit (rendering, bundle, virtualization)  |
| review-full         | `/review-full`                                                               | Complete 11-point audit (all areas)                    |

**Note**: Skills automatically load relevant workflow files and follow SPEC Method process.

### Reference Documents (CRITICAL)

**ALWAYS check `SPEC/references/` first before any design or planning task.**

If reference documents exist (PRD, architecture, Figma designs, etc.):

- 🔴 **STRICTLY FOLLOW** the reference - do not suggest changes
- 🔴 **DO NOT MODIFY** existing feature definitions
- 🔴 **IMPLEMENT** exactly as specified

### Workflow Execution Protocol

1. **Check** `SPEC/references/` for existing documents
2. **Read** the workflow file from `SPEC/workflows/`
3. **Read** the agent definition from `SPEC/agents/`
4. **Read** the relevant rulebook from `SPEC/rulebooks/`
5. **Ask** "Type 'proceed' to start" and wait for confirmation
6. **Execute** following the checklist exactly
7. **Document** outputs in `docs/`

### Rulebooks (Enforced Standards)

All rulebooks are in `SPEC/rulebooks/`. Read the relevant rulebook before implementing or reviewing code.

| Rulebook               | File                         | Scope                                                                     |
| ---------------------- | ---------------------------- | ------------------------------------------------------------------------- |
| Security / NIST 800-53 | `security-nist-rulebook.md`  | Auth, RBAC, session, input validation, audit, encryption                  |
| Architecture           | `architecture-rulebook.md`   | Folder structure, dependency flow, provider abstraction, state management |
| API & Data Layer       | `api-data-layer-rulebook.md` | API client patterns, caching, validation, error handling, pagination      |
| Performance            | `performance-rulebook.md`    | Bundle budgets, memoization, code splitting, virtualization, animations   |
| Code Quality           | `code-quality-rulebook.md`   | File size limits, component patterns, accessibility, naming, testing      |
| E2E Testing            | `e2e-rulebook.md`            | Test plan rules, framework architecture, naming, selectors                |

### Hooks (Automated Guardrails)

Configured in `.claude/settings.json`. These run automatically:

| Hook                | Event       | Trigger                                                                                        | Action                                      |
| ------------------- | ----------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------- |
| NIST Security Check | PreToolUse  | Edit/Write on `rbac.ts`, `security.ts`, `auth-context.tsx`, `sign-in.tsx`, `*-auth-adapter.ts` | Injects NIST control reminder               |
| Architecture Check  | PostToolUse | Write new file in `src/`                                                                       | Warns if file is outside standard structure |

### Configuration Files

| Type              | Location                |
| ----------------- | ----------------------- |
| Agent Definitions | `SPEC/agents/`          |
| Rulebooks         | `SPEC/rulebooks/`       |
| Workflows         | `SPEC/workflows/`       |
| Reference Docs    | `SPEC/references/`      |
| Hooks & Settings  | `.claude/settings.json` |

---

## Core Rules

1. **Reference First** - Check SPEC/references/ before any design task
2. **Zero Assumptions** - Ask clarifying questions when uncertain
3. **Evidence-Based** - Paste actual test output as proof
4. **Tests with Code** - Never postpone tests (≥85% coverage)
5. **User Approval** - Ask "proceed?" before major actions

---

_Built with SPEC Method_
