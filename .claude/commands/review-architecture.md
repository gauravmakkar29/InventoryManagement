# /review-architecture — Architecture Health Check

**Usage:** `/review-architecture` or `/review-architecture src/app/components/devices/`

**Argument:** `$ARGUMENTS` (optional — specific module to audit. Defaults to full `src/`)

---

## Instructions

You are a **Principal Frontend Architect** reviewing the IMS Gen2 enterprise React application.

1. **Read** the rulebook: `SPEC/rulebooks/architecture-rulebook.md`
2. **Read** the code quality rulebook: `SPEC/rulebooks/code-quality-rulebook.md`
3. **Scope** the audit to `$ARGUMENTS` if provided, otherwise audit the full architecture

---

## Audit Checklist

### 1. Folder Structure

- Is the project organized by feature (not by type)?
- Does each feature folder contain only its own components, hooks, and types?
- Are shared components in `components/shared/`?
- Are there any misplaced files (e.g., a firmware component in the devices folder)?

### 2. Dependency Flow

Verify the strict layering:

```
components/ → lib/hooks/ → lib/providers/ → lib/types
```

Run these checks:

```bash
# Check for circular imports
npx madge --circular src/ 2>/dev/null || echo "Install madge for circular import detection"

# Check for feature cross-imports (violations)
grep -rn "from.*components/devices" src/app/components/firmware/
grep -rn "from.*components/firmware" src/app/components/devices/
grep -rn "from.*components/compliance" src/app/components/service-orders/
# Repeat for all feature folder pairs
```

### 3. Component Responsibility

For each component file:

- Count `useState` calls — flag if > 10
- Count lines — flag if > 400 (600 = block)
- Check for mixed concerns (data fetching + rendering + form handling in one file)
- Identify "God components" that do too much

```bash
# Find large files
find src/ -name "*.tsx" -exec wc -l {} + | sort -rn | head -20

# Find excessive useState usage
grep -c "useState" src/app/components/**/*.tsx | grep -v ":0$" | sort -t: -k2 -rn
```

### 4. Provider Abstraction Integrity

- Does any component import cloud SDKs directly (`@aws-amplify`, `@azure`, `aws-sdk`)?
- Does `platform.config.ts` remain the single adapter selection point?
- Do all adapters implement the full `IApiProvider` / `IAuthAdapter` / `IStorageProvider` interface?

```bash
grep -rn "@aws-amplify\|@azure/\|aws-sdk" src/app/
```

### 5. State Management

- Is server state managed by TanStack Query (not useState/Zustand)?
- Is client state in Zustand (not prop drilling)?
- Are there derived states stored in useState that should be useMemo?
- Is form state managed by react-hook-form (not useState)?

### 6. Error Handling

- Is there an ErrorBoundary at the App root?
- Do pages have their own ErrorBoundary wrappers?
- Do API calls in hooks have try/catch with toast notifications?
- Are there any empty catch blocks?

```bash
grep -rn "catch.*{}" src/ --include="*.ts" --include="*.tsx"
grep -rn "ErrorBoundary" src/
```

### 7. Scalability Assessment

- Are routes lazy-loaded with `React.lazy`?
- Is the app multi-tenant ready (tenantId scoping)?
- Are there i18n-ready patterns (Intl APIs, no hardcoded strings)?
- Is the design system consistent (shared components reused, not duplicated)?

---

## Output Format

### 🔴 Critical Issues (Architectural Violations)

Must fix before merge. Include file:line and the specific rule violated.

### 🟠 Improvements (Technical Debt)

Should fix soon. Describe impact on maintainability/scalability.

### 🟢 Good Practices (Well-Architected)

What's working well — reinforce these patterns.

### 🚀 Architecture Scorecard

| Area                 | Score   | Notes |
| -------------------- | ------- | ----- |
| Folder Structure     | A/B/C/D |       |
| Dependency Flow      | A/B/C/D |       |
| Component Design     | A/B/C/D |       |
| Provider Abstraction | A/B/C/D |       |
| State Management     | A/B/C/D |       |
| Error Handling       | A/B/C/D |       |
| Code Splitting       | A/B/C/D |       |
| Scalability          | A/B/C/D |       |

### 📐 Suggested Target Architecture

If structural changes are needed, provide the target folder structure with migration steps.
