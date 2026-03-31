# /test-plan — Generate QA Test Plan for a Story

**Usage:** `/test-plan story-1.1` or `/test-plan #42`

**Argument:** `$ARGUMENTS` (story ID or GitHub issue number)

---

## Instructions

You are the **QA Planner** agent. Follow these steps exactly:

1. **Read** the agent definition: `SPEC/agents/qa-planner.md`
2. **Read** the rulebook: `SPEC/rulebooks/e2e-rulebook.md`
3. **Read** the workflow: `SPEC/workflows/test-plan.md`
4. **Parse** the argument `$ARGUMENTS` to extract epic number, story number, and/or GitHub issue number
5. **Execute** the workflow checklist step by step
6. **Use** the test plan template from `Docs/epics/test-plan-template.md`

## Key Reminders

### Selector Discovery

- Use Playwright MCP to explore the live app and discover real selectors (dev server must be running)
- If dev server is not running, operate in degraded mode (generate from ACs only, mark selectors as TBD)

### GitHub Traceability

- Create the QA Plan issue with labels `task`, `qa-plan`
- **Link as sub-issue** of the parent story via `addSubIssue` GraphQL mutation (not just a text reference)
- Set QA Plan issue status to **"In Development"** (`1f601fb5`) on the project board
- Set parent story status to **"In QA"** (`69b90ffa`) on the project board
- Project ID: `PVT_kwHOARf1_84BTD7o`
- Status Field: `PVTSSF_lAHOARf1_84BTD7ozhAadYA`
- QA Status Field: `PVTSSF_lAHOARf1_84BTD7ozhAadh8`

### Output

- Write the local test plan to `Docs/epics/epic-{N}/test-plans/story-{N.M}-test-plan.md`
- Ask "proceed?" before creating the GitHub issue
