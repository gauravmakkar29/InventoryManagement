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
infra/                  # Infrastructure reference implementations
├── reference/
│   ├── aws-terraform/  # Terraform (13 AWS modules) + environments
│   └── aws-cdk/        # CDK reference skeleton (TypeScript)
└── migrations/         # Schema versioning (future)
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

## Coding Standards & Rulebooks

All technical standards are enforced through dedicated rulebooks in `SPEC/rulebooks/`. **Read the relevant rulebook before implementing or reviewing code.**

| Rulebook                     | Covers                                                                                                                                |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `code-quality-rulebook.md`   | File size limits, naming, SRP, DRY, accessibility, testing (>=85%), no `any`, no `console.log`                                        |
| `architecture-rulebook.md`   | Folder structure, dependency flow, state management, provider abstraction, error handling layers                                      |
| `security-nist-rulebook.md`  | NIST 800-53: RBAC (AC-3), SoD (AC-5), sessions (AC-11/12), XSS (SI-3), input validation (SI-10), audit (AU-2/3), encryption (SC-8/12) |
| `api-data-layer-rulebook.md` | API client patterns, DTO/domain mapping, TanStack Query caching, error classification, pagination                                     |
| `performance-rulebook.md`    | Bundle budgets, memoization, code splitting, virtualization, animations                                                               |
| `e2e-rulebook.md`            | E2E test plans, framework patterns, selectors, naming                                                                                 |

### Git Workflow

- Branch: `feature/IMS-{issue#}-short-desc` or `fix/IMS-{issue#}-short-desc`
- Commits: `feat(scope): description #issue` (enforced by commitlint)
- PR: `[Story N.M] Description` with `Closes #{issue}` in body
- Never push directly to main — always PR with CI passing

### NIST Reference Documents

- **Rulebook (enforced):** `SPEC/rulebooks/security-nist-rulebook.md`
- **Control mapping:** `Docs/nist-800-53-control-mapping.md`
- **Integration contract:** `Docs/integration-contract.md`
- **Security model ADR:** `Docs/decisions/007-security-model.md`
