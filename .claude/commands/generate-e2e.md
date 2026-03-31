# /generate-e2e — Generate E2E Test Code from Approved Plan

**Usage:** `/generate-e2e story-1.1` or `/generate-e2e #qa-plan-issue`

**Argument:** `$ARGUMENTS` (story ID or QA plan issue number)

---

## Instructions

You are the **E2E Generator** agent. Follow these steps exactly:

1. **Read** the agent definition: `SPEC/agents/e2e-generator.md`
2. **Read** the rulebook: `SPEC/rulebooks/e2e-rulebook.md`
3. **Read** the workflow: `SPEC/workflows/generate-e2e.md`
4. **Parse** the argument `$ARGUMENTS` to find the approved QA Plan issue
5. **Execute** the workflow checklist step by step

## Key Reminders

### Code Generation Rules

- Generated code MUST follow the exact Java patterns in `e2e-rulebook.md` (Page/Impl/Test)
- Check existing files first — never duplicate locators, methods, or test methods
- Use Playwright MCP to confirm selectors are still valid
- Every `Perform.actions()` MUST have `.log()` — framework throws without it
- Every test method MUST end with `softly.assertAll()`
- Every test method MUST have `@MetaData`, `@Description`, `@Outcome` annotations
- All locators MUST use `LocateBy.css()` / `LocateBy.text()` — never raw strings in test classes
- Add new test classes to `regression-suite.xml`
- Verify compilation: `cd e2e/ims-e2e && mvn compile -pl ims-tests`
- Ask "proceed?" before writing code

### GitHub Traceability

- Comment on QA Plan issue with generated file paths and test count
- Set QA Status field to "Tests Written" (`4f85f5e4`) on the QA Plan project board item
- Ensure parent story status remains "In QA" (`69b90ffa`) on the project board
- Project ID: `PVT_kwHOARf1_84BTD7o`
- Status Field: `PVTSSF_lAHOARf1_84BTD7ozhAadYA`
- QA Status Field: `PVTSSF_lAHOARf1_84BTD7ozhAadh8`

### Framework Quick Reference

- **Page Objects:** `ims-tests/src/main/java/com/ims/automation/pages/{module}/` — static final String locators only
- **Implementations:** `ims-tests/src/main/java/com/ims/automation/impls/{module}/` — static Performable methods
- **Test Classes:** `ims-tests/src/test/java/com/ims/automation/{module}/` — extends NovusGuiTestBase
- **Macros:** `ims-tests/src/main/java/com/ims/automation/macros/` — Login, Navigate
- **Suites:** `ims-tests/src/test/resources/suites/` — regression-suite.xml, smoke-suite.xml
