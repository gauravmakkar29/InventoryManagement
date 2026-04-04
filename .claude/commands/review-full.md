# /review-full — Complete 11-Point Application Audit

**Usage:** `/review-full` or `/review-full src/app/components/`

**Argument:** `$ARGUMENTS` (optional — scope to a folder. Defaults to full `src/`)

---

## Instructions

You are a **Principal Engineer** conducting a comprehensive audit of the IMS Gen2 platform. Execute all 11 audit areas sequentially. For each area, read the relevant rulebook before auditing.

**Scope:** `$ARGUMENTS` if provided, otherwise `src/`.

---

## Pre-Audit Setup

1. **Read** all rulebooks:
   - `SPEC/rulebooks/architecture-rulebook.md`
   - `SPEC/rulebooks/code-quality-rulebook.md`
   - `SPEC/rulebooks/security-nist-rulebook.md`
   - `SPEC/rulebooks/api-data-layer-rulebook.md`
   - `SPEC/rulebooks/performance-rulebook.md`
   - `SPEC/rulebooks/e2e-rulebook.md`

2. **Read** project docs:
   - `Docs/nist-800-53-control-mapping.md`
   - `Docs/integration-contract.md`

3. **Scan** the codebase:

```bash
# File count and sizes
find src/ -name "*.tsx" -o -name "*.ts" | wc -l
find src/ -name "*.tsx" -exec wc -l {} + | sort -rn | head -20
```

---

## Audit Areas

### 1. Architecture & Design

- Folder structure (feature-based vs type-based)
- Separation of concerns (UI, business logic, API)
- Module coupling and dependency flow
- God components identification
- Provider abstraction integrity

### 2. State Management

- Global vs local vs server state separation
- TanStack Query for server state, Zustand for client state
- Prop drilling beyond 2 levels
- Derived state duplication
- Side effects handling (useEffect misuse)

### 3. Data & API Layer

- API abstraction (all calls through IApiProvider)
- DTO ↔ Domain model transformation
- Error handling (global + local)
- Caching strategy (TanStack Query staleTime/gcTime)
- Pagination pattern (cursor-based)

### 4. Component Design

- Component size and single responsibility
- Reusability (shared components used consistently)
- Props design (no boolean overload, clear interfaces)
- Naming conventions (kebab-case files, PascalCase components)
- Design system consistency

### 5. Performance

- Re-render patterns (memoization correctness)
- Bundle size (route-level code splitting)
- List virtualization (50+ rows)
- Debouncing on search/filter inputs
- Animation performance (transform/opacity only)

### 6. Auth & Session Management

- Auth mechanism and token storage
- Token refresh flow
- Session timeout and lock
- Protected routes
- RBAC enforcement via rbac.ts

### 7. Security (NIST 800-53)

- XSS prevention (no dangerouslySetInnerHTML)
- Input sanitization (Zod on all forms)
- CSRF protection
- Secrets exposure check
- Transmission security (HTTPS only)

### 8. Testing

- Unit test coverage (≥85% on new code)
- Test quality (behavior-based, not implementation)
- E2E test coverage per story
- Missing test scenarios

### 9. Code Quality

- TypeScript strictness (no `any`)
- Naming conventions adherence
- Dead code identification
- Code duplication
- ESLint/Prettier compliance

### 10. DevOps & CI/CD

- Build pipeline completeness
- Environment configuration
- Deployment strategy
- Secrets management in CI

### 11. Scalability & Future Readiness

- Multi-tenant readiness (tenantId scoping)
- i18n readiness (Intl APIs)
- Code splitting for scale
- Design system scalability

---

## Output Format

For EACH of the 11 areas, produce:

### Area N: {Name}

**🔴 Critical Issues:** (must fix)

- Issue description, file:line, rule violated, suggested fix

**🟠 Improvements:** (should fix)

- Improvement description, impact, effort estimate

**🟢 Good Practices:** (keep doing)

- What's working well

---

## Executive Summary (at the end)

### Overall Health Scorecard

| #   | Area             | Score | Critical | Improvements | Good  |
| --- | ---------------- | ----- | -------- | ------------ | ----- |
| 1   | Architecture     | A-D   | count    | count        | count |
| 2   | State Management | A-D   | count    | count        | count |
| 3   | Data & API       | A-D   | count    | count        | count |
| 4   | Component Design | A-D   | count    | count        | count |
| 5   | Performance      | A-D   | count    | count        | count |
| 6   | Auth & Session   | A-D   | count    | count        | count |
| 7   | Security (NIST)  | A-D   | count    | count        | count |
| 8   | Testing          | A-D   | count    | count        | count |
| 9   | Code Quality     | A-D   | count    | count        | count |
| 10  | DevOps & CI/CD   | A-D   | count    | count        | count |
| 11  | Scalability      | A-D   | count    | count        | count |

### 🎯 Overall Grade: {A/B/C/D}

### 🚀 Top 10 Actions (Priority Order)

1. Most critical fix first
2. ...
3. Lowest priority

### 📈 Strengths to Maintain

- Top 3 things the codebase does well

### ⚠️ Technical Debt Summary

- Estimated total debt items, grouped by severity
