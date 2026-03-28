# IMS Gen 2 — Hardware Lifecycle Management Platform

## Project Overview

Enterprise device inventory tracking, firmware deployment with multi-stage approval, compliance/vulnerability management, service order scheduling, and analytics — governed by NIST 800-53 security controls.

## Tech Stack

- **Frontend:** React 18 + Vite 6 + TypeScript 5.7 + TailwindCSS 4 + shadcn/ui (Radix)
- **Infrastructure:** Terraform on AWS (DynamoDB, Cognito, AppSync, S3, CloudFront, Lambda, WAF, Route53, OpenSearch)
- **E2E Testing:** Java 17 + Maven + TestNG + Playwright Java (at `e2e/ims-e2e/`)
- **Unit Testing:** Vitest + React Testing Library
- **CI/CD:** GitHub Actions

## Commands

- `npm run dev` — Start dev server (localhost:5173)
- `npm run build` — TypeScript check + Vite production build
- `npm test` — Run unit tests (Vitest)
- `npm run test:e2e` — Run full E2E regression (Maven/TestNG)
- `npm run test:e2e:smoke` — Run smoke E2E suite
- `npm run lint` — ESLint check
- `cd infra && terraform init -backend=false && terraform validate` — Validate Terraform

## Project Structure

```
src/                    # React frontend (TypeScript)
├── app/components/     # Page components + layouts
├── lib/                # Shared libs (types, auth, API client, utils)
└── __tests__/          # Unit tests (Vitest)
e2e/ims-e2e/            # E2E test framework (Java/Maven)
├── ims-core/           # Actor/DSL engine, reporting, assertions
├── ims-core-ui/        # Browser actions (Click, Enter, Verify)
├── ims-core-api/       # API testing (REST/GraphQL)
└── ims-tests/          # IMS page objects, impls, macros, tests
infra/                  # Terraform (13 AWS modules)
├── modules/            # dynamodb, cognito, appsync, s3, cloudfront, lambda, iam, waf, dns, opensearch, monitoring, alerting
└── environments/       # dev.tfvars, staging.tfvars, prod.tfvars
Docs/epics/             # 18 epics with functional stories + tech specs
.github/                # CI workflows + issue templates (story, bug)
```

## Development Workflow (MANDATORY)

1. Every feature starts with a **GitHub Issue** (story or bug)
2. Branch naming: `feature/IMS-{issue#}-short-desc`
3. Commits: `feat(scope): description #{issue}`
4. PR title: `[Story N.M] Description`, body: `Closes #{issue}`
5. CI must pass before merge (build + unit + E2E + compliance)
6. Stories are FUNCTIONAL (persona-driven ACs), tech details in `tech-spec.md`

## Spec Documents

- **Master Brief:** `Docs/IMS-Gen2-Detailed-Project-Brief-For-Terraform.md`
- **Traceability Strategy:** `Docs/reporting-traceability-strategy.md`
- **Epic Stories:** `Docs/epics/epic-{1-18}/story-*.md`
- **Tech Specs:** `Docs/epics/epic-{1-18}/tech-spec.md`

## Design Principles (Section 10.7)

- Enterprise authority (reference: Sungrow Power), NOT generic SaaS
- Navy #0f172a + blue #2563eb, NO gradients
- Data-first layouts, compact tables, 150-200ms transitions
- WCAG 2.1 AA accessibility
- No decorative elements, no bouncy animations, no AI sparkle icons

## Coding Standards

### Architecture Patterns

- Feature-based folder structure under `src/app/components/`
- Shared code in `src/lib/` — no circular imports
- 3-layer separation: types → API client → components
- All API calls through `src/lib/hlm-api.ts` — never call AppSync directly from components
- Auth through `useAuth()` hook — never access context directly

### Error Handling

- React Error Boundaries at layout level for crash resilience
- API calls: try/catch with toast notifications via Sonner
- Form validation: react-hook-form with Zod schemas
- Never swallow errors silently — always log or notify

### Naming Conventions

- Files: kebab-case (`account-service.tsx`)
- Components: PascalCase (`AccountService`)
- Hooks: camelCase with `use` prefix (`useAuth`)
- Types: PascalCase (`DeviceStatus`)
- Constants: UPPER_SNAKE_CASE (`API_ENDPOINT`)
- CSS: Tailwind utility classes only — no custom CSS except in `index.css`

### Git Workflow

- Branch: `feature/IMS-{issue#}-short-desc` or `fix/IMS-{issue#}-short-desc`
- Commits: `feat(scope): description #issue` (enforced by commitlint)
- PR: `[Story N.M] Description` with `Closes #{issue}` in body
- Never push directly to main — always PR with CI passing

### Testing Requirements

- Unit tests: Vitest, >=85% coverage on new code
- E2E tests: IMS E2E framework (Java/TestNG/Playwright) for every story
- Test file co-located: `src/__tests__/` mirrors `src/` structure

### What NOT to Do

- No `any` type — use `unknown` and narrow
- No `console.log` in production code — use structured logging
- No inline styles — Tailwind only
- No direct DOM manipulation — React refs if needed
- No barrel exports (index.ts re-exports) — import directly
- No relative imports crossing module boundaries — use `@/` alias
