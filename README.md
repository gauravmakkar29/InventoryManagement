# IMS Gen 2 -- Hardware Lifecycle Management Platform

Enterprise device inventory tracking, firmware deployment with multi-stage approval, compliance management, service order scheduling, and analytics -- built as a cloud-agnostic React template.

![Build](https://img.shields.io/badge/build-passing-brightgreen) ![Coverage](https://img.shields.io/badge/coverage-85%25+-blue) ![License](https://img.shields.io/badge/license-MIT-green) ![Node](https://img.shields.io/badge/node-20+-purple)

---

## Quick Start

**Prerequisites:** Node.js 20+, npm 10+, Java 17 (E2E tests only)

```bash
git clone https://github.com/gauravmakkar29/InventoryManagement.git
cd InventoryManagement && npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The app starts in **mock mode** by default -- no cloud services required.

### Default Login Credentials (Mock Mode)

| Email                 | Password           | Role          |
| --------------------- | ------------------ | ------------- |
| `admin@company.com`   | `Admin@12345678`   | Admin         |
| `manager@company.com` | `Manager@12345678` | Manager       |
| `tech@company.com`    | `Tech@123456789`   | Technician    |
| `viewer@company.com`  | `Viewer@12345678`  | Viewer        |
| `customer@tenant.com` | `Customer@123456`  | CustomerAdmin |

### Available Scripts

| Command                   | Description                              |
| ------------------------- | ---------------------------------------- |
| `npm run dev`             | Start dev server (localhost:5173)        |
| `npm run build`           | TypeScript check + Vite production build |
| `npm test`                | Run unit tests (Vitest)                  |
| `npm run test:coverage`   | Unit tests with coverage report          |
| `npm run lint`            | ESLint check                             |
| `npm run test:e2e`        | Full E2E regression (Java/Maven/TestNG)  |
| `npm run test:e2e:smoke`  | Smoke E2E suite                          |
| `npm run test:e2e:headed` | E2E in headed browser mode               |

---

## Using as a Template

This project is designed as a **cloud-agnostic enterprise starter**. Swap out the provider adapters to connect to any backend.

### Step-by-Step

1. **Fork or clone** this repository
2. **Set the platform** via the `VITE_PLATFORM` env var (see [Configuration](#configuration))
3. **Implement your auth adapter** -- create a class implementing [`IAuthAdapter`](src/lib/providers/auth-adapter.ts)
4. **Implement your API adapter** -- create a class implementing [`IApiProvider`](src/lib/providers/types.ts)
5. **Implement your storage adapter** -- or reuse the built-in localStorage adapter
6. **Register your platform** in [`platform.config.ts`](src/lib/providers/platform.config.ts) -- add a `case` for your platform ID
7. **Replace mock data** with real API calls in your adapter implementations

### Provider Architecture

```
                        +---------------------+
                        |    React App Layer   |
                        |  (components, hooks) |
                        +----------+----------+
                                   |
                          useAuth() / useApi()
                                   |
                        +----------v----------+
                        |   Platform Config    |
                        |  platform.config.ts  |
                        +----------+----------+
                                   |
              +--------------------+--------------------+
              |                    |                    |
     +--------v-------+  +--------v-------+  +--------v--------+
     |  IAuthAdapter   |  |  IApiProvider  |  | IStorageProvider |
     +--------+-------+  +--------+-------+  +--------+--------+
              |                    |                    |
     +--------v-------+  +--------v-------+  +--------v--------+
     |  Mock / Cognito |  |   Mock / Your  |  | localStorage /  |
     |  / Azure AD /   |  |   GraphQL /    |  | sessionStorage / |
     |  Auth0 / etc.   |  |   REST impl   |  | IndexedDB       |
     +----------------+  +----------------+  +-----------------+
```

The `VITE_PLATFORM` env var selects which adapter set is loaded. The app code never imports cloud SDKs directly -- only the adapter layer does.

---

## Architecture

### Project Structure

```
src/
  app/components/           # Feature-based page components + layouts
  lib/
    providers/              # Provider abstraction layer
      mock/                 #   Mock adapters (dev/demo mode)
      cognito/              #   AWS Cognito adapter (stub)
      auth-adapter.ts       #   IAuthAdapter interface
      types.ts              #   IApiProvider, IStorageProvider, PlatformConfig
      platform.config.ts    #   Platform detection + adapter wiring
    types.ts                # Domain types (Device, Firmware, etc.)
    hlm-api.ts              # API client (delegates to IApiProvider)
  __tests__/                # Unit tests (mirrors src/ structure)
e2e/ims-e2e/                # E2E framework (Java/Maven)
  ims-core/                 #   Actor/DSL engine, reporting, assertions
  ims-core-ui/              #   Browser actions (Click, Enter, Verify)
  ims-core-api/             #   API testing (REST/GraphQL)
  ims-tests/                #   Page objects, test implementations
infra/                      # Terraform (13 AWS modules)
  modules/                  #   dynamodb, cognito, appsync, s3, cloudfront,
                            #   lambda, iam, waf, dns, opensearch,
                            #   monitoring, alerting
  environments/             #   dev.tfvars, staging.tfvars, prod.tfvars
Docs/                       # Specs, epics, architecture decisions
.github/                    # CI workflows + issue templates
```

### Application Modules

| Module            | Description                                  |
| ----------------- | -------------------------------------------- |
| Dashboard         | Fleet overview and system health KPIs        |
| Inventory         | Device asset management with geo views       |
| Deployment        | Firmware lifecycle and multi-stage approvals |
| Compliance        | Regulatory certification tracking            |
| SBOM              | Software bill of materials                   |
| Service Orders    | Maintenance and field service scheduling     |
| Analytics         | Reporting and trend analysis                 |
| Telemetry         | Real-time device monitoring                  |
| Incidents         | Security response and quarantine             |
| Digital Twin      | Device simulation and drift detection        |
| Executive Summary | Stakeholder briefing dashboard               |
| User Management   | Accounts, roles, and permissions (RBAC)      |

---

## Provider Adapters

### Existing Adapters

| Adapter | Location                     | Status                      |
| ------- | ---------------------------- | --------------------------- |
| Mock    | `src/lib/providers/mock/`    | Complete                    |
| Cognito | `src/lib/providers/cognito/` | Stub (ready for activation) |

### Creating a New Adapter

1. Create a directory: `src/lib/providers/your-platform/`
2. Implement `IAuthAdapter` (see [`mock-auth-adapter.ts`](src/lib/providers/mock/mock-auth-adapter.ts) for reference)
3. Implement `IApiProvider` (see [`mock-api-provider.ts`](src/lib/providers/mock/mock-api-provider.ts) for reference)
4. Optionally implement `IStorageProvider` (or reuse the built-in localStorage version)
5. Add your platform ID to `PlatformId` in [`types.ts`](src/lib/providers/types.ts)
6. Add a `case` in [`platform.config.ts`](src/lib/providers/platform.config.ts) to wire up your adapters

### Interface Contracts

**IAuthAdapter** ([`src/lib/providers/auth-adapter.ts`](src/lib/providers/auth-adapter.ts))

| Method            | Signature                                    | Description                        |
| ----------------- | -------------------------------------------- | ---------------------------------- |
| `signIn`          | `(email, password) => Promise<SignInResult>` | Authenticate with credentials      |
| `signOut`         | `() => Promise<void>`                        | End current session                |
| `refreshToken`    | `(session) => Promise<AuthSession \| null>`  | Refresh access token               |
| `verifyMfa`       | `(code) => Promise<AuthSession>`             | Verify MFA during sign-in          |
| `setupMfa`        | `(email) => Promise<string>`                 | Start MFA setup (returns TOTP URI) |
| `confirmMfaSetup` | `(code, email) => Promise<void>`             | Confirm MFA enrollment             |
| `isMfaEnabled`    | `(email) => boolean`                         | Check MFA status                   |
| `loadSession`     | `() => AuthSession \| null`                  | Load persisted session             |
| `saveSession`     | `(session) => void`                          | Persist session                    |
| `clearSession`    | `() => void`                                 | Clear persisted session            |

**IApiProvider** ([`src/lib/providers/types.ts`](src/lib/providers/types.ts)) -- 30+ methods covering:

- **Queries:** `listDevices`, `getDevice`, `searchDevices`, `listFirmware`, `listServiceOrders`, `listCompliance`, `listVulnerabilities`, `listAuditLogs`, `getDashboardMetrics`, and more
- **Mutations:** `createServiceOrder`, `uploadFirmware`, `approveFirmware`, `submitComplianceReview`, and more
- **Telemetry:** `getDeviceTelemetry`, `getHeatmapAggregation`, `getBlastRadius`, `ingestTelemetry`
- **Search:** `searchGlobal`, `searchDevicesAdvanced`, `getAggregation`, geo queries

**IStorageProvider** ([`src/lib/providers/types.ts`](src/lib/providers/types.ts))

| Method       | Signature                 | Description         |
| ------------ | ------------------------- | ------------------- |
| `getItem`    | `(key) => string \| null` | Read a stored value |
| `setItem`    | `(key, value) => void`    | Write a value       |
| `removeItem` | `(key) => void`           | Delete a value      |

---

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

| Variable                    | Default          | Description                                                                  |
| --------------------------- | ---------------- | ---------------------------------------------------------------------------- |
| `VITE_PLATFORM`             | `mock`           | Platform adapter: `mock`, `aws-amplify`, `aws-cdk`, `aws-terraform`, `azure` |
| `VITE_SHOW_DEVTOOLS`        | --               | Set to `"true"` to show React Query DevTools                                 |
| `VITE_APPSYNC_ENDPOINT`     | --               | AWS AppSync GraphQL endpoint URL                                             |
| `VITE_COGNITO_USER_POOL_ID` | --               | Cognito User Pool ID                                                         |
| `VITE_COGNITO_CLIENT_ID`    | --               | Cognito App Client ID                                                        |
| `VITE_AWS_REGION`           | `ap-southeast-2` | AWS region                                                                   |

### Theming

- Dark/light mode via `next-themes` (system preference by default)
- Design tokens: Navy `#0f172a` + Blue `#2563eb`, no gradients
- All styling via Tailwind CSS 4 utility classes
- WCAG 2.1 AA compliant contrast ratios

---

## Testing

### Unit Tests

```bash
npm test                   # Single run
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage report
```

Stack: **Vitest** + **React Testing Library** + **vitest-axe** (accessibility). Target: 85%+ coverage on new code.

### E2E Tests

```bash
npm run test:e2e           # Full regression suite
npm run test:e2e:smoke     # Smoke suite
npm run test:e2e:headed    # Headed browser (local debugging)
```

Stack: **Java 17** + **Maven** + **TestNG** + **Playwright Java**. Located at `e2e/ims-e2e/`.

### Testing Custom Adapters

Write unit tests for your adapter by following the mock adapter test pattern:

1. Create tests in `src/__tests__/lib/providers/your-platform/`
2. Test each `IAuthAdapter` method (signIn, signOut, refreshToken, MFA flows)
3. Test each `IApiProvider` method against expected response shapes
4. Use `vitest-axe` for accessibility assertions on any custom UI

---

## Development Workflow

1. Every feature starts with a **GitHub Issue** (story or bug template)
2. **Branch:** `feature/IMS-{issue#}-short-desc` or `fix/IMS-{issue#}-short-desc`
3. **Commits:** `feat(scope): description #{issue}` (enforced by commitlint)
4. **PR title:** `[Story N.M] Description` | **PR body:** `Closes #{issue}`
5. CI must pass: build + lint + unit tests + E2E + compliance
6. Pre-commit hooks: ESLint + Prettier via `husky` + `lint-staged`

---

## Tech Stack

| Layer          | Technology                            | Version |
| -------------- | ------------------------------------- | ------- |
| Framework      | React                                 | 18.3    |
| Build          | Vite                                  | 6.3     |
| Language       | TypeScript                            | 5.7     |
| Styling        | TailwindCSS + shadcn/ui (Radix)       | 4.1     |
| State          | Zustand + TanStack React Query        | 5.x     |
| Forms          | react-hook-form + Zod                 | 7.x     |
| Routing        | React Router                          | 7.x     |
| Animation      | Motion (Framer Motion)                | 12.x    |
| Charts         | Recharts                              | 2.15    |
| Unit Tests     | Vitest + React Testing Library        | 3.2     |
| E2E Tests      | Java 17 + Maven + TestNG + Playwright | --      |
| Linting        | ESLint 9 + Prettier                   | 9.x     |
| Git Hooks      | Husky + lint-staged + commitlint      | --      |
| Infrastructure | Terraform on AWS (13 modules)         | --      |
| CI/CD          | GitHub Actions                        | --      |

---

## Documentation

| Document                  | Path                                                    |
| ------------------------- | ------------------------------------------------------- |
| Master Project Brief      | `Docs/IMS-Gen2-Detailed-Project-Brief-For-Terraform.md` |
| App Modules Overview      | `Docs/app-modules-overview.md`                          |
| Reporting/Traceability    | `Docs/reporting-traceability-strategy.md`               |
| E2E QA Process            | `Docs/e2e-qa-process.md`                                |
| Architecture Decisions    | `Docs/decisions/`                                       |
| Epic Stories + Tech Specs | `Docs/epics/epic-{1-18}/`                               |

---

## License

MIT
