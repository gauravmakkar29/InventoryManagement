# IMS Gen 2 -- Enterprise React Template

> **Production-ready, cloud-agnostic enterprise application template** with pluggable providers, NIST 800-53 security controls, and infrastructure-as-code. Fork it, set 3 env vars, deploy to any cloud.

![Build](https://img.shields.io/badge/build-passing-brightgreen) ![Coverage](https://img.shields.io/badge/coverage-85%25+-blue) ![License](https://img.shields.io/badge/license-MIT-green) ![Node](https://img.shields.io/badge/node-20+-purple) ![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue) ![React](https://img.shields.io/badge/React-18-61dafb)

---

## Why This Template?

Most enterprise React starters give you a login page and a dashboard. This gives you **everything between "git clone" and "production deployment"**:

| What You Get                     | What You Skip Building                |
| -------------------------------- | ------------------------------------- |
| 8 pluggable provider interfaces  | Months designing an abstraction layer |
| 5 cloud adapter implementations  | Vendor lock-in debates                |
| 37 NIST 800-53 security controls | Security audit remediation cycles     |
| 16 Terraform modules             | Infrastructure from scratch           |
| 12 feature modules with full UI  | Boilerplate page scaffolding          |
| 530+ unit tests + E2E framework  | Test infrastructure setup             |
| Role-based access (5 roles)      | RBAC design and implementation        |
| CI/CD pipelines                  | DevOps configuration                  |

**Zero cloud dependency in development.** The app runs entirely in mock mode -- no AWS account, no API keys, no database. When you're ready, flip `VITE_PLATFORM` to connect to real services.

---

## Quick Start

```bash
git clone https://github.com/gauravmakkar29/InventoryManagement.git
cd InventoryManagement && npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Login with any mock credential below.

| Email                 | Password           | Role          |
| --------------------- | ------------------ | ------------- |
| `admin@company.com`   | `Admin@12345678`   | Admin         |
| `manager@company.com` | `Manager@12345678` | Manager       |
| `tech@company.com`    | `Tech@123456789`   | Technician    |
| `viewer@company.com`  | `Viewer@12345678`  | Viewer        |
| `customer@tenant.com` | `Customer@123456`  | CustomerAdmin |

---

## What's Pluggable (Template Architecture)

The app never imports a cloud SDK directly. Every external dependency flows through a **provider interface**. Swap implementations without touching a single component.

```
  React Components / Hooks
          |
    useApiProvider()  useAuth()  useArtifactProvider()  useCRMProvider()
          |
   ProviderRegistry  (platform.config.ts)
          |
  +-------+-------+-------+-------+-------+-------+-------+-------+
  |       |       |       |       |       |       |       |       |
  Auth    API   Storage Artifact  CRM   Scanner   CDC    DNS   Realtime
  |       |       |       |       |       |       |       |       |
  Mock   Mock   Local   Mock    Mock    Mock    Mock   Mock    Mock
  Cognito Amplify  --    S3     SvcNow  Ignite   --    Azure   WebSocket
  AzureAD Terraform --   JFrog    --      --     --    Route53  SSE
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

### How to Add Your Own Provider

```bash
# 1. Create your adapter directory
mkdir src/lib/providers/your-platform/

# 2. Implement the interfaces you need (minimum: Auth + API)
#    Reference: src/lib/providers/mock/ for patterns

# 3. Register in platform.config.ts
#    Add a case for your platform ID

# 4. Set the env var
VITE_PLATFORM=your-platform npm run dev
```

That's it. Every component, hook, and page works with your new backend automatically.

---

## What's Included (12 Feature Modules)

Each module is a complete, production-styled feature -- not a placeholder.

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

## Security (NIST 800-53 Built-In)

Not bolted on -- **baked in from day one**. 37 controls across 6 NIST families.

| Family                     | Controls                                                | What It Covers                                            |
| -------------------------- | ------------------------------------------------------- | --------------------------------------------------------- |
| **Access Control (AC)**    | AC-2, AC-3, AC-5, AC-6, AC-7, AC-8, AC-11, AC-12, AC-17 | RBAC, separation of duties, session timeout, login banner |
| **Audit (AU)**             | AU-2, AU-3, AU-4, AU-5, AU-6, AU-8, AU-12               | Audit trail, CDC capture, tamper-evident logs             |
| **Identification (IA)**    | IA-2, IA-2(1), IA-4, IA-5, IA-8                         | MFA (TOTP), password policy, credential management        |
| **Incident Response (IR)** | IR-4, IR-5, IR-6                                        | Playbooks, quarantine, escalation workflows               |
| **Integrity (SI)**         | SI-3, SI-10                                             | XSS prevention (CSP + DOMPurify), Zod input validation    |
| **Config Management (CM)** | CM-3, CM-8                                              | Change tracking, asset inventory                          |

### RBAC (Single-File Configuration)

```typescript
// src/lib/rbac.ts — add roles, pages, or actions in one place
const PERMISSIONS: Record<Role, RolePermissions> = {
  Admin: { pages: [...all], actions: ["create", "edit", "delete", "approve"] },
  Manager: { pages: [...most], actions: ["create", "edit", "approve"] },
  Technician: { pages: ["dashboard", "inventory", "account-service"], actions: ["create", "edit"] },
  Viewer: { pages: [...readonly], actions: [] },
  CustomerAdmin: { pages: [...limited], actions: ["create", "edit"], filterByCustomer: true },
};
```

Enforced at 3 levels: sidebar filtering, route guards (`ProtectedLayout`), and mutation handlers.

---

## Infrastructure as Code

### Terraform (16 AWS Modules)

Located at `infra/reference/aws-terraform/modules/`:

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

**Environment configs:** `dev.tfvars`, `staging.tfvars`, `prod.tfvars`

AWS CDK reference skeleton also available at `infra/reference/aws-cdk/`.

---

## How to Use as a Template

### Step 1: Fork & Configure

```bash
git clone https://github.com/gauravmakkar29/InventoryManagement.git my-app
cd my-app
cp .env.example .env
```

### Step 2: Choose Your Platform

| `VITE_PLATFORM`  | Backend                 | When to Use                  |
| ---------------- | ----------------------- | ---------------------------- |
| `mock` (default) | In-memory mock data     | Development, demos, testing  |
| `aws-amplify`    | Amplify Gen 2 + AppSync | Greenfield AWS projects      |
| `aws-terraform`  | Terraform-managed AWS   | Existing Terraform workflows |
| `aws-cdk`        | CDK constructs          | CDK-based teams              |

### Step 3: Customize Domain Types

Edit `src/lib/types.ts` to match your domain. The existing types (Device, Firmware, ServiceOrder, etc.) are examples -- replace with your own entities.

### Step 4: Implement Your API Adapter

Create `src/lib/providers/your-platform/your-api-provider.ts` implementing `IApiProvider`. Start by copying `mock-api-provider.ts` and replacing mock data with real API calls.

### Step 5: Deploy Infrastructure

```bash
cd infra/reference/aws-terraform
terraform init
terraform plan -var-file=environments/dev.tfvars
terraform apply -var-file=environments/dev.tfvars
```

### Step 6: Configure CI/CD

The GitHub Actions workflows at `.github/workflows/` are ready to use:

- `ci.yml` -- Lint, build, test on every PR
- `deploy.yml` -- Terraform + S3 deploy on merge to main
- `e2e-nightly.yml` -- Scheduled regression tests

---

## Testing

### Unit Tests (530+ tests)

```bash
npm test                   # Single run
npm run test:coverage      # With coverage report
```

Stack: Vitest + React Testing Library + vitest-axe (accessibility)

### E2E Tests

```bash
npm run test:e2e           # Full regression (Java/Maven/TestNG/Playwright)
npm run test:e2e:smoke     # Smoke suite
npm run test:e2e:headed    # Headed browser for debugging
```

Located at `e2e/ims-e2e/` with Page Object Model, test listeners, and HTML reporting.

---

## Tech Stack

| Layer      | Technology                        | Version |
| ---------- | --------------------------------- | ------- |
| Framework  | React                             | 18.3    |
| Build      | Vite                              | 6.3     |
| Language   | TypeScript (strict)               | 5.7     |
| Styling    | TailwindCSS 4 + shadcn/ui (Radix) | 4.1     |
| State      | Zustand + TanStack React Query    | 5.x     |
| Forms      | react-hook-form + Zod validation  | 7.x     |
| Routing    | React Router                      | 7.x     |
| Charts     | Recharts                          | 2.15    |
| Maps       | react-simple-maps                 | 3.x     |
| Animation  | Motion (Framer Motion)            | 12.x    |
| i18n       | react-i18next (2 locales)         | --      |
| Unit Tests | Vitest + RTL                      | 3.2     |
| E2E Tests  | Java 17 + Playwright              | --      |
| Linting    | ESLint 9 + Prettier + commitlint  | --      |
| Git Hooks  | Husky + lint-staged               | --      |
| IaC        | Terraform (16 modules)            | --      |
| CI/CD      | GitHub Actions (3 workflows)      | --      |

---

## Project Structure

```
src/
  app/components/             # 12 feature modules (page components + layouts)
  lib/
    providers/                # Provider abstraction layer
      mock/                   #   Mock adapters (dev/demo)
      aws-amplify/            #   Amplify + AppSync + S3
      aws-cdk/                #   CDK-based adapters
      aws-terraform/          #   Terraform-managed AWS
      cognito/                #   Direct Cognito integration
      jfrog/                  #   JFrog Artifactory
      servicenow/             #   ServiceNow CRM
      realtime/               #   WebSocket + SSE adapters
      types.ts                #   All provider interfaces
      platform.config.ts      #   Environment-based adapter wiring
    types.ts                  # Domain types (Device, Firmware, Customer, etc.)
    rbac.ts                   # Role-based access control (single file)
    query-keys.ts             # TanStack Query key factory
    schemas/                  # Zod validation schemas
  components/                 # 16 shared UI primitives (design system)
  locales/                    # i18n translations (en-US, es-ES)
  __tests__/                  # 530+ unit tests
e2e/ims-e2e/                  # E2E framework (Java/Maven/Playwright)
infra/reference/
  aws-terraform/              # 16 Terraform modules + env configs
  aws-cdk/                    # CDK reference skeleton
Docs/                         # Architecture decisions, epic specs
.github/workflows/            # CI/CD pipelines
SPEC/                         # SPEC Method rulebooks + workflows
```

---

## Development Workflow

1. Every feature starts with a **GitHub Issue** (story or bug template)
2. **Branch:** `feature/IMS-{issue#}-short-desc` or `fix/IMS-{issue#}-short-desc`
3. **Commits:** `feat(scope): description #{issue}` (enforced by commitlint)
4. **PR:** Title `[Story N.M] Description`, body `Closes #{issue}`
5. **CI gate:** Build + lint + unit tests + E2E + compliance must pass
6. **Pre-commit:** ESLint + Prettier + file-length check via Husky

---

## Documentation

| Document               | Path                                                    |
| ---------------------- | ------------------------------------------------------- |
| Demo Walkthrough       | `Docs/demo-walkthrough.md`                              |
| Master Project Brief   | `Docs/IMS-Gen2-Detailed-Project-Brief-For-Terraform.md` |
| App Modules Overview   | `Docs/app-modules-overview.md`                          |
| NIST Control Mapping   | `Docs/nist-800-53-control-mapping.md`                   |
| Architecture Decisions | `Docs/decisions/`                                       |
| Integration Contract   | `Docs/integration-contract.md`                          |
| Epic Stories + Specs   | `Docs/epics/epic-{1-18}/`                               |

---

## License

MIT
