<div align="center">

# IMS Gen 2

### Enterprise Hardware Lifecycle Management Platform

_Production-ready, cloud-agnostic enterprise application template with pluggable providers, NIST 800-53 security controls, and multi-IaC infrastructure._

**Fork it. Set 3 env vars. Deploy to any cloud.**

<br />

[![Build](https://img.shields.io/badge/build-passing-10B981?style=flat-square)](https://github.com/gauravmakkar29/InventoryManagement/actions)
[![Coverage](https://img.shields.io/badge/coverage-85%25+-2563EB?style=flat-square)](#testing)
[![Tests](https://img.shields.io/badge/tests-530%2B_unit_%2B_E2E-059669?style=flat-square)](#testing)
[![License](https://img.shields.io/badge/license-MIT-475569?style=flat-square)](LICENSE)

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=black)](#tech-stack)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white)](#tech-stack)
[![Vite](https://img.shields.io/badge/Vite-6.3-646CFF?style=flat-square&logo=vite&logoColor=white)](#tech-stack)
[![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](#tech-stack)
[![Node](https://img.shields.io/badge/Node-20+-339933?style=flat-square&logo=node.js&logoColor=white)](#quick-start)

[![NIST 800-53](https://img.shields.io/badge/NIST_800--53-37_controls-DC2626?style=flat-square)](Docs/nist-800-53-control-mapping.md)
[![RBAC](https://img.shields.io/badge/RBAC-5_roles-7C3AED?style=flat-square)](#security-nist-800-53-built-in)
[![WCAG](https://img.shields.io/badge/WCAG-2.1_AA-0F766E?style=flat-square)](#design-system)
[![Multi-IaC](https://img.shields.io/badge/Multi--IaC-Terraform_%7C_CDK_%7C_Amplify-F59E0B?style=flat-square)](#infrastructure-as-code-multi-iac)

<br />

<sub><strong>QUICK NAV</strong> · <a href="#quick-start">Quick Start</a> · <a href="#system-architecture">Architecture</a> · <a href="#testing">Testing</a> · <a href="#how-to-use-as-a-template">Use as Template</a> · <a href="#documentation">Docs</a></sub>

</div>

---

## Table of Contents

- [Application Preview](#application-preview)
- [Why This Template?](#why-this-template)
- [Quick Start](#quick-start)
- [System Architecture](#system-architecture)
- [Provider Architecture](#provider-architecture-pluggable)
- [Security (NIST 800-53)](#security-nist-800-53-built-in)
- [Infrastructure as Code](#infrastructure-as-code-multi-iac)
- [How to Use as a Template](#how-to-use-as-a-template)
- [Configuration](#configuration)
- [Feature Modules](#feature-modules-12)
- [Design System](#design-system)
- [Testing](#testing)
- [Operational Excellence](#operational-excellence)
- [AI-Powered Development](#ai-powered-development)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Documentation](#documentation)

---

## Application Preview

|                    Dashboard                    |                    Analytics                    |
| :---------------------------------------------: | :---------------------------------------------: |
| ![Dashboard](Docs/screenshots/02-dashboard.png) | ![Analytics](Docs/screenshots/05-analytics.png) |

|                    Inventory                    |                    Deployment                     |
| :---------------------------------------------: | :-----------------------------------------------: |
| ![Inventory](Docs/screenshots/03-inventory.png) | ![Deployment](Docs/screenshots/04-deployment.png) |

<details>
<summary>Login Page</summary>

![Login](Docs/screenshots/01-login.png)

</details>

---

## Why This Template?

Most enterprise React starters give you a login page and a dashboard. This gives you **everything between "git clone" and "production deployment"**:

| What You Get                              | What You Skip                                        |
| ----------------------------------------- | ---------------------------------------------------- |
| 8 pluggable provider interfaces           | 6-8 weeks of architecture and abstraction design     |
| 5 cloud adapter implementations           | Vendor lock-in and multi-cloud portability debates   |
| 37 NIST 800-53 security controls          | 3-4 months of security audit and remediation cycles  |
| 3 IaC options (Terraform + CDK + Amplify) | 4-6 weeks of infrastructure scaffolding from scratch |
| 12 feature modules with full UI           | 200+ hours of boilerplate page scaffolding           |
| 530+ unit tests + E2E framework           | 2-3 sprints building test infrastructure             |
| Role-based access (5 roles)               | Custom RBAC design, implementation, and QA           |
| CI/CD pipelines (3 workflows)             | DevOps toolchain configuration and tuning            |

**Zero cloud dependency in development.** The app runs entirely in mock mode -- no AWS account, no API keys, no database. When you're ready, flip `VITE_PLATFORM` to connect to real services.

---

## Quick Start

### Prerequisites

| Dependency | Version | Required For                   |
| ---------- | ------- | ------------------------------ |
| Node.js    | 20+     | Build and dev server           |
| npm        | 10+     | Package management             |
| Java       | 17+     | E2E tests only                 |
| Maven      | 3.9+    | E2E tests only                 |
| Terraform  | 1.5+    | Infrastructure deployment only |

### Local Development

```bash
git clone https://github.com/gauravmakkar29/InventoryManagement.git
cd InventoryManagement && npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Login with any mock credential:

| Email                 | Password           | Role          |
| --------------------- | ------------------ | ------------- |
| `admin@company.com`   | `Admin@12345678`   | Admin         |
| `manager@company.com` | `Manager@12345678` | Manager       |
| `tech@company.com`    | `Tech@123456789`   | Technician    |
| `viewer@company.com`  | `Viewer@12345678`  | Viewer        |
| `customer@tenant.com` | `Customer@123456`  | CustomerAdmin |

---

## System Architecture

```mermaid
flowchart TD
    subgraph Layer1["  BROWSER  ·  React 18 + TypeScript  "]
        direction LR
        M["12 Feature\nModules"]
        DS["Design System\n16 Primitives"]
        H["React Hooks\nuseAuth · useApi\nuseArtifact · useCRM"]
    end

    subgraph Layer2["  PROVIDER REGISTRY  ·  platform.config.ts  "]
        direction LR
        Auth["IAuth\nAdapter"]
        Api["IApi\nProvider"]
        Art["IArtifact\nProvider"]
        More["ICRMProvider\nIScanner · ICDC\nIDNS · Realtime"]
    end

    subgraph Layer3["  CLOUD ADAPTERS  ·  swappable via VITE_PLATFORM  "]
        direction LR
        Mock["Mock\ndev · demo"]
        Amp["AWS Amplify\nGen 2"]
        TF["AWS Terraform\n16 modules"]
        Ext["JFrog\nServiceNow\nIgnite"]
    end

    subgraph Layer4["  AWS SERVICES  "]
        direction LR
        Cog["Cognito"]
        AS["AppSync\nGraphQL"]
        DB["DynamoDB\n+ S3"]
        CF["CloudFront\n+ WAF"]
        OS["OpenSearch"]
    end

    Layer1 ==> Layer2
    Layer2 ==> Layer3
    Layer3 ==> Layer4

    style Layer1 fill:#1e40af,stroke:#3b82f6,color:#e0e7ff
    style Layer2 fill:#6d28d9,stroke:#8b5cf6,color:#ede9fe
    style Layer3 fill:#0f766e,stroke:#14b8a6,color:#ccfbf1
    style Layer4 fill:#92400e,stroke:#f59e0b,color:#fef3c7
```

---

## Provider Architecture (Pluggable)

The app **never imports a cloud SDK directly**. Every external dependency flows through a provider interface. Swap implementations without touching a single component.

```mermaid
flowchart LR
    ENV["VITE_PLATFORM\n= aws-amplify"]
    ENV --> Config["platform.config.ts"]

    subgraph created["Adapters Created"]
        AuthA["Auth Adapter"]
        ApiA["API Provider"]
        ArtA["Artifact Provider"]
    end

    Config --> created
    created --> Registry["Provider\nRegistry"]
    Registry --> App["React App\nuseAuth() / useApi()"]

    style ENV fill:#f59e0b,stroke:#b45309,color:#000
    style created fill:#0d9488,stroke:#14b8a6,color:#fff
    style Registry fill:#7c3aed,stroke:#8b5cf6,color:#fff
    style App fill:#1e40af,stroke:#3b82f6,color:#fff
```

### 8 Provider Interfaces

| Interface                    | Purpose                                       | Implementations               |
| ---------------------------- | --------------------------------------------- | ----------------------------- |
| `IAuthAdapter`               | Sign-in, MFA, token refresh, session          | Mock, Cognito (3 variants)    |
| `IApiProvider`               | 40+ data operations (CRUD, search, telemetry) | Mock, Amplify, CDK, Terraform |
| `IStorageProvider`           | Key-value persistence                         | localStorage (built-in)       |
| `IArtifactProvider`          | Binary file upload/download/versioning        | Mock, S3/Amplify, JFrog       |
| `ICRMProvider`               | Customer & ticket management                  | Mock, ServiceNow              |
| `IComplianceScannerProvider` | Vulnerability scanning & reports              | Mock, Ignite                  |
| `ICDCProvider`               | Change Data Capture / audit streams           | Mock                          |
| `IDNSProvider`               | DNS record management                         | Mock, Azure DNS, Route 53     |

Plus **3 real-time adapters**: WebSocket (auto-reconnect), SSE, and Mock.

---

## Security (NIST 800-53 Built-In)

Not bolted on -- **baked in from day one**. 37 controls across 6 NIST families.

```mermaid
flowchart LR
    A["User\nRequest"] --> B["Route Guard\ncanAccessPage()"]
    B -->|pass| C["Component Guard\nRequireRole"]
    C -->|pass| D["Mutation Guard\ncanPerformAction()"]
    D -->|pass| E["Infra Layer\nCSP + CSRF + Zod + Audit"]

    style A fill:#6b7280,stroke:#9ca3af,color:#fff
    style B fill:#dc2626,stroke:#ef4444,color:#fff
    style C fill:#ea580c,stroke:#f97316,color:#fff
    style D fill:#d97706,stroke:#f59e0b,color:#fff
    style E fill:#059669,stroke:#10b981,color:#fff
```

| Family                     | Controls                                                | What It Covers                                            |
| -------------------------- | ------------------------------------------------------- | --------------------------------------------------------- |
| **Access Control (AC)**    | AC-2, AC-3, AC-5, AC-6, AC-7, AC-8, AC-11, AC-12, AC-17 | RBAC, separation of duties, session timeout, login banner |
| **Audit (AU)**             | AU-2, AU-3, AU-4, AU-5, AU-6, AU-8, AU-12               | Audit trail, CDC capture, tamper-evident logs             |
| **Identification (IA)**    | IA-2, IA-2(1), IA-4, IA-5, IA-8                         | MFA (TOTP), password policy, credential management        |
| **Incident Response (IR)** | IR-4, IR-5, IR-6                                        | Playbooks, quarantine, escalation workflows               |
| **Integrity (SI)**         | SI-3, SI-10                                             | XSS prevention (CSP + DOMPurify), Zod input validation    |
| **Config Management (CM)** | CM-3, CM-8                                              | Change tracking, asset inventory                          |

---

## Infrastructure as Code (Multi-IaC)

```mermaid
flowchart TD
    subgraph IaC["  CHOOSE YOUR IaC  "]
        direction LR
        TF["Terraform\n16 modules\nproduction-ready"]
        CDK["AWS CDK\nTypeScript\nconstructs"]
        AMP["Amplify Gen 2\nzero-config\nauto-provisions"]
    end

    subgraph Account1["  AWS ACCOUNT 1  "]
        direction LR
        Dev["Dev"]
        QA["QA"]
    end

    subgraph Account2["  AWS ACCOUNT 2  "]
        direction LR
        PreProd["Pre-Prod"]
        Prod["Prod"]
    end

    subgraph Services["  MANAGED SERVICES PER ENVIRONMENT  "]
        direction LR
        S1["Cognito\nAuth"]
        S2["AppSync\nGraphQL"]
        S3["DynamoDB\nData"]
        S4["S3 + CloudFront\nHosting + CDN"]
        S5["OpenSearch\nSearch"]
    end

    IaC ==> Account1
    Account1 ==> Account2
    Account2 ==> Services

    style IaC fill:#6d28d9,stroke:#8b5cf6,color:#ede9fe
    style Account1 fill:#1e40af,stroke:#3b82f6,color:#e0e7ff
    style Account2 fill:#047857,stroke:#10b981,color:#d1fae5
    style Services fill:#92400e,stroke:#f59e0b,color:#fef3c7
```

| IaC Option            | Location                         | Status                       | Best For                                |
| --------------------- | -------------------------------- | ---------------------------- | --------------------------------------- |
| **Terraform**         | `infra/reference/aws-terraform/` | 16 modules, production-ready | Teams with existing Terraform workflows |
| **AWS CDK**           | `infra/reference/aws-cdk/`       | Reference skeleton           | TypeScript-native infrastructure teams  |
| **AWS Amplify Gen 2** | Built into `aws-amplify` adapter | Integrated                   | Greenfield projects wanting zero-config |

<details>
<summary>Terraform Modules (16)</summary>

| Module             | AWS Service                                         |
| ------------------ | --------------------------------------------------- |
| `dynamodb`         | NoSQL tables with streams + PITR                    |
| `cognito`          | User pool + auth groups                             |
| `appsync`          | GraphQL API + resolvers                             |
| `lambda-audit`     | CDC event processor                                 |
| `s3-firmware`      | Artifact bucket (versioned, encrypted, Object Lock) |
| `s3-frontend`      | Static hosting                                      |
| `cloudfront`       | CDN + WAF integration                               |
| `waf`              | Web Application Firewall rules                      |
| `opensearch`       | Full-text + geo search                              |
| `location-service` | Maps, geocoding, geofencing                         |
| `iam`              | Roles + cross-account policies                      |
| `dns`              | Route 53 zones                                      |
| `monitoring`       | CloudWatch + X-Ray                                  |
| `alerting`         | Alarms + SNS notifications                          |
| `cloudtrail`       | API audit logging                                   |

</details>

---

## How to Use as a Template

```mermaid
flowchart LR
    A["Fork\nRepo"] --> B["Set\nVITE_PLATFORM"] --> C["Replace\nDomain Types"] --> D["Implement\nAdapters"] --> E["Deploy\nInfra"] --> F["Ship"]

    style A fill:#6b7280,stroke:#9ca3af,color:#fff
    style B fill:#7c3aed,stroke:#8b5cf6,color:#fff
    style C fill:#1e40af,stroke:#3b82f6,color:#fff
    style D fill:#0d9488,stroke:#14b8a6,color:#fff
    style E fill:#b45309,stroke:#f59e0b,color:#fff
    style F fill:#059669,stroke:#10b981,color:#fff
```

**Step 1:** Fork & clone, `cp .env.example .env`

**Step 2:** Set `VITE_PLATFORM` (`mock` | `aws-amplify` | `aws-terraform` | `aws-cdk`)

**Step 3:** Edit `src/lib/types.ts` -- replace Device/Firmware with your domain entities

**Step 4:** Implement `IApiProvider` + `IAuthAdapter` in `src/lib/providers/your-platform/`

**Step 5:** Deploy infra: `terraform apply`, `cdk deploy`, or Amplify auto-provisions

**Step 6:** CI/CD pipelines at `.github/workflows/` are ready to use

---

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure as needed. The app runs with defaults (mock mode) out of the box.

| Variable                    | Description                              | Default          | Required                   |
| --------------------------- | ---------------------------------------- | ---------------- | -------------------------- |
| `VITE_PLATFORM`             | Platform adapter selection               | `mock`           | Yes                        |
| `VITE_APPSYNC_ENDPOINT`     | AWS AppSync GraphQL endpoint URL         | --               | Only for `aws-amplify`     |
| `VITE_COGNITO_USER_POOL_ID` | Cognito User Pool ID                     | --               | Only for `aws-*` platforms |
| `VITE_COGNITO_CLIENT_ID`    | Cognito App Client ID                    | --               | Only for `aws-*` platforms |
| `VITE_AWS_REGION`           | AWS region for all services              | `ap-southeast-2` | Only for `aws-*` platforms |
| `VITE_STORAGE_ENDPOINT`     | S3/artifact storage endpoint             | --               | No (falls back to mock)    |
| `VITE_SEARCH_ENDPOINT`      | OpenSearch endpoint URL                  | --               | No (falls back to mock)    |
| `VITE_REALTIME_ENDPOINT`    | WebSocket/SSE endpoint for notifications | --               | No (falls back to mock)    |
| `VITE_SHOW_DEVTOOLS`        | Show React Query DevTools                | --               | No                         |

### Available Scripts

| Command                   | Description                              |
| ------------------------- | ---------------------------------------- |
| `npm run dev`             | Start dev server (localhost:5173)        |
| `npm run build`           | TypeScript check + Vite production build |
| `npm test`                | Run unit tests (Vitest)                  |
| `npm run test:coverage`   | Unit tests with Istanbul coverage report |
| `npm run lint`            | ESLint check                             |
| `npm run test:e2e`        | Full E2E regression (Java/Maven/TestNG)  |
| `npm run test:e2e:smoke`  | Smoke E2E suite                          |
| `npm run test:e2e:headed` | E2E in headed browser mode               |

---

## Feature Modules (12)

| Module              | Key Features                                                       |
| ------------------- | ------------------------------------------------------------------ |
| **Dashboard**       | Fleet KPIs, health score gauge, activity feed, quick actions       |
| **Inventory**       | Device table with advanced search, geo map view, bulk operations   |
| **Deployment**      | Firmware lifecycle, multi-stage approval workflow, version history |
| **Compliance**      | Regulatory certification tracking, NIST control mapping            |
| **SBOM**            | Software bill of materials management                              |
| **Service Orders**  | Maintenance scheduling with priority + status workflow             |
| **Analytics**       | Time-series charts, audit logs, CSV/JSON export                    |
| **Telemetry**       | Heatmaps, blast radius simulation, risk scoring                    |
| **Incidents**       | Response playbooks, network topology, device quarantine            |
| **Digital Twin**    | State replay, config drift detection, health trending              |
| **Customers**       | Customer/site management with firmware deployment tracking         |
| **User Management** | Account creation, role assignment, session management              |

---

## Design System

Built on **shadcn/ui (Radix)** with semantic design tokens. Dark/light mode. WCAG 2.1 AA.

16 shared primitives: `dialog-base`, `data-table`, `form-field`, `status-badge`, `confirm-dialog`, `loading-skeleton`, `empty-state`, `stat-card`, `toast`, `dropdown-menu`, `tabs`, `tooltip`, `sidebar-nav`, `command-palette`, `search-input`, `page-header`

All located in `src/components/` -- Radix primitive + Tailwind + `class-variance-authority` + semantic tokens.

---

## Testing

**Multi-layer test automation** -- 530+ unit tests, full E2E framework, visual regression, accessibility assertions, Storybook, and CI integration. All part of the template -- no separate setup.

### Test Layers

| Layer                       | Stack                                          | Scope                                       | Command                   |
| --------------------------- | ---------------------------------------------- | ------------------------------------------- | ------------------------- |
| **Unit (530+)**             | Vitest 3 + React Testing Library + vitest-axe  | Components, hooks, utils, providers         | `npm test`                |
| **Coverage Gate**           | Istanbul (V8)                                  | >= 85% per `code-quality-rulebook`          | `npm run test:coverage`   |
| **Accessibility (Unit)**    | vitest-axe + `jsx-a11y` ESLint                 | WCAG 2.1 AA assertions inside unit tests    | `npm test` (integrated)   |
| **E2E Regression**          | Java 17 + Maven + TestNG + Playwright + Spring | Full UI + API regression suite              | `npm run test:e2e`        |
| **E2E Smoke**               | Same                                           | Critical-path (login, CRUD, deploy)         | `npm run test:e2e:smoke`  |
| **E2E Module**              | Same                                           | Single-module targeted run                  | `npm run test:e2e:module` |
| **E2E Headed (debug)**      | Same + headed Chromium                         | Local debug with visible browser            | `npm run test:e2e:headed` |
| **Visual Regression**       | Playwright `toHaveScreenshot()`                | Pixel-diff snapshots, `0.003` max ratio     | `npm run test:visual`     |
| **Component Visualization** | Storybook 8 + `@storybook/addon-a11y`          | Interactive playground + per-component a11y | `npm run storybook`       |
| **Type Safety**             | TypeScript 5.7 strict, no `any`                | Build-time type check                       | `npm run build`           |
| **Lint**                    | ESLint 9 + commitlint (`config-conventional`)  | Code quality + commit message format        | `npm run lint`            |

### E2E Framework Architecture (`e2e/ims-e2e/`)

Java/Maven multi-module framework using the **Actor / DSL pattern** -- tests read like plain English:

```java
actor.attemptsTo(Click.on(LOGIN_BUTTON));
actor.attemptsTo(Enter.textInto(USERNAME_FIELD).value("admin@company.com"));
actor.should(See.that(DASHBOARD_HEADER).isVisible());
```

| Module         | Responsibility                                                                         |
| -------------- | -------------------------------------------------------------------------------------- |
| `ims-core`     | Actor pattern, DSL actions, annotations, assertions, ExtentReports HTML reporting      |
| `ims-core-ui`  | Playwright browser management, UI page actions (Click, Type, Select, Verify), locators |
| `ims-core-api` | REST/GraphQL API client, HTTP wrappers, JSON utilities                                 |
| `ims-tests`    | IMS-specific page objects, action implementations, macros, TestNG suites               |

**3-layer page objects**: Pages (locators) -> Impls (action compositions) -> Macros (high-level flows).

**Spring profiles**: `application-web.properties` (browser config), `application-test.properties` (environment), `application-local.properties` (local debug overrides, git-ignored).

### Visual Regression (`e2e/visual/`)

Playwright Node-based snapshot diffing -- separate from the Java E2E framework.

```bash
# Terminal 1 -- build & serve production bundle
npm run build && npm run preview           # http://localhost:4173

# Terminal 2 -- run visual tests
npm run test:visual                        # compare against committed snapshots
npm run test:visual:update                 # regenerate baselines after intentional UI change
```

| Concept         | Detail                                     |
| --------------- | ------------------------------------------ |
| Config          | `e2e/visual/playwright.config.ts`          |
| Test files      | `e2e/visual/tests/*.visual.ts`             |
| Baseline images | `e2e/visual/snapshots/` (committed to git) |
| Diff results    | `e2e/visual/test-results/` (git-ignored)   |
| Tolerance       | `maxDiffPixelRatio: 0.003`, single worker  |

### Code Generation

Schema-first contracts with CI-checked generation:

| Generator     | Source                        | Output                                | Command                   |
| ------------- | ----------------------------- | ------------------------------------- | ------------------------- |
| GraphQL types | `codegen.ts`                  | `src/lib/graphql/generated/`          | `npm run codegen`         |
| OpenAPI types | `src/lib/schema/openapi.yaml` | `src/lib/schema/generated/openapi.ts` | `npm run codegen:openapi` |

### CI Integration (`.github/workflows/`)

| Workflow          | Trigger                    | Runs                                        |
| ----------------- | -------------------------- | ------------------------------------------- |
| `ci.yml`          | PR + push                  | Build + lint + unit + coverage gate (>=85%) |
| `e2e-nightly.yml` | Scheduled nightly + manual | Full E2E regression suite                   |
| `deploy.yml`      | Push to main               | Build + deploy to environment               |

### Testing Rulebooks

Enforced standards live in `SPEC/rulebooks/`:

- `code-quality-rulebook.md` -- file size limits, naming, SRP, DRY, >= 85% coverage, no `any`, no `console.log`
- `e2e-rulebook.md` -- test plan rules, framework architecture, naming, selectors
- `git-workflow-rulebook.md` -- commit format, branch naming, PR process, story-to-code traceability

---

## Operational Excellence

### Logging

Application logging follows a structured approach:

| Layer              | Mechanism                             | Details                                                              |
| ------------------ | ------------------------------------- | -------------------------------------------------------------------- |
| **Client-side**    | `console.warn` / `console.error` only | `no-console` ESLint rule blocks `console.log` in production code     |
| **Audit trail**    | CDC (Change Data Capture) provider    | Every mutation logged with actor, timestamp, and payload (AU-2/AU-3) |
| **Infrastructure** | CloudTrail + CloudWatch               | API-level audit logging via Terraform `cloudtrail` module            |
| **Error tracking** | `IErrorTrackingProvider`              | Pluggable provider for Sentry/Datadog integration                    |

### Monitoring

| Component       | Tool                    | Location                                            |
| --------------- | ----------------------- | --------------------------------------------------- |
| API latency     | CloudWatch Dashboards   | `infra/reference/aws-terraform/modules/monitoring/` |
| Error rates     | CloudWatch Alarms + SNS | `infra/reference/aws-terraform/modules/alerting/`   |
| Search health   | OpenSearch Dashboards   | `infra/reference/aws-terraform/modules/opensearch/` |
| CDN performance | CloudFront metrics      | `infra/reference/aws-terraform/modules/cloudfront/` |
| Uptime          | X-Ray tracing           | `infra/reference/aws-terraform/modules/monitoring/` |

### Health Checks

The dashboard displays real-time system status for 4 services (Deployment Pipeline, Compliance Engine, Asset Database, Analytics Service) with last-heartbeat timestamps. The OSIS Pipeline widget shows records synced, current lag, and a manual reindex trigger.

### Error Handling

- **API errors** classified by `ApiMutationError` with typed error codes and user-facing messages
- **Route errors** caught by per-route `RouteErrorBoundary` with recovery actions
- **Global errors** caught by top-level `ErrorBoundary` with crash report
- **Network** offline detection via `useConnectivityMonitor` with degraded-mode banner

---

## AI-Powered Development

This project uses **Claude Code** (Anthropic CLI) for AI-native SDLC using the **SPEC Method** framework.

| Capability     | How It Works                                                             |
| -------------- | ------------------------------------------------------------------------ |
| Story creation | Claude drafts stories from epics with ACs, preconditions, and test hints |
| Implementation | TDD-driven coding with automatic rulebook enforcement                    |
| Code review    | Security (NIST), architecture, and performance audits on demand          |
| PR management  | Branch creation, commit formatting, and PR submission with traceability  |
| Backlog audit  | Gap analysis across 18 epics with prioritized recommendations            |

Workflows: `SPEC/workflows/` -- Rulebooks: `SPEC/rulebooks/` -- Hooks: `.claude/settings.json`

---

## Tech Stack

| Layer      | Technology                        | Version |
| ---------- | --------------------------------- | ------- |
| Framework  | React                             | 18.3    |
| Build      | Vite                              | 6.3     |
| Language   | TypeScript (strict)               | 5.7     |
| Styling    | TailwindCSS 4 + shadcn/ui (Radix) | 4.1     |
| State      | Zustand + TanStack React Query    | 5.x     |
| Forms      | react-hook-form + Zod             | 7.x     |
| Charts     | Recharts                          | 2.15    |
| Maps       | react-simple-maps                 | 3.x     |
| i18n       | react-i18next (2 locales)         | --      |
| Unit Tests | Vitest + RTL                      | 3.2     |
| E2E Tests  | Java 17 + Playwright              | --      |
| IaC        | Terraform + CDK + Amplify         | --      |
| CI/CD      | GitHub Actions (3 workflows)      | --      |

---

## Project Structure

```
src/
  app/components/             # 12 feature modules
  lib/providers/              # Provider abstraction layer
    mock/                     #   Mock adapters (dev/demo)
    aws-amplify/              #   Amplify + AppSync + S3
    aws-cdk/                  #   CDK-based adapters
    aws-terraform/            #   Terraform-managed AWS
    jfrog/                    #   JFrog Artifactory
    servicenow/               #   ServiceNow CRM
    realtime/                 #   WebSocket + SSE
  components/                 # 16 shared UI primitives
  locales/                    # i18n (en-US, es-ES)
  __tests__/                  # 530+ unit tests
e2e/ims-e2e/                  # E2E framework (Java/Maven/Playwright)
infra/reference/
  aws-terraform/              # 16 Terraform modules (production-ready)
  aws-cdk/                    # CDK reference skeleton
Docs/                         # Architecture decisions, epic specs
.github/workflows/            # CI/CD pipelines
SPEC/                         # SPEC Method rulebooks + workflows
```

---

## Documentation

| Document               | Path                                                    |
| ---------------------- | ------------------------------------------------------- |
| Demo Walkthrough       | `Docs/demo-walkthrough.md`                              |
| Master Project Brief   | `Docs/IMS-Gen2-Detailed-Project-Brief-For-Terraform.md` |
| App Modules Overview   | `Docs/app-modules-overview.md`                          |
| NIST Control Mapping   | `Docs/nist-800-53-control-mapping.md`                   |
| GitHub Projects Guide  | `Docs/github-projects-guide.md`                         |
| Architecture Decisions | `Docs/decisions/`                                       |
| Integration Contract   | `Docs/integration-contract.md`                          |
| Epic Stories + Specs   | `Docs/epics/epic-{1-18}/`                               |

---

## License

MIT
