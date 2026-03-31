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

### Skills Available

Claude Code skills are pre-configured for SPEC Method workflows:

| Skill        | Command                                  | Description                                    |
| ------------ | ---------------------------------------- | ---------------------------------------------- |
| implement    | `/implement story-1.1`                   | Execute story implementation with TDD          |
|              | `/implement next story`                  | Implement next story in sequence               |
| test-plan    | `test-plan story-1.1` or `test-plan #42` | Generate QA test plan for a story              |
| generate-e2e | `generate-e2e story-1.1`                 | Generate E2E Java test code from approved plan |

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

### Configuration Files

| Type              | Location           |
| ----------------- | ------------------ |
| Agent Definitions | `SPEC/agents/`     |
| Rulebooks         | `SPEC/rulebooks/`  |
| Workflows         | `SPEC/workflows/`  |
| Reference Docs    | `SPEC/references/` |

---

## Core Rules

1. **Reference First** - Check SPEC/references/ before any design task
2. **Zero Assumptions** - Ask clarifying questions when uncertain
3. **Evidence-Based** - Paste actual test output as proof
4. **Tests with Code** - Never postpone tests (≥85% coverage)
5. **User Approval** - Ask "proceed?" before major actions

---

_Built with SPEC Method_
