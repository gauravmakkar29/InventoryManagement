# Architectural Decision: Microsoft Azure Enterprise Stack

> **Status:** DECIDED
> **Date:** April 2026
> **Decision Maker:** Architecture Team
> **Scope:** IMS Gen2 template — Microsoft/Azure rapid enterprise deployment

---

## The Decision

**React + Azure Static Web Apps + Azure Functions + Cosmos DB + Entra ID + Bicep.**

No alternatives. No "it depends." This is the stack. Below is why, how, and what it costs.

---

## Why This Exact Combination

### Principle: Every Layer Must Be Serverless-First

Enterprise apps fail when infrastructure overhead consumes the team. The stack below has **zero servers to manage**, auto-scales to zero when idle, and costs under $200/mo for development.

### Principle: One Command to Deploy

`azd up` provisions everything — auth, API, database, CDN, monitoring — from a single `azure.yaml` file. No clicking through Azure Portal. No 50-page runbooks.

### Principle: Keep React, Replace Only What Touches the Cloud

Our template's provider abstraction means the frontend is **100% untouched**. We implement 2 adapter files, set one env var, and the app runs on Azure.

---

## The Stack (Every Layer Decided)

### Frontend — No Change

| Decision       | Technology                | Why                                                    |
| -------------- | ------------------------- | ------------------------------------------------------ |
| **Framework**  | React 18 + TypeScript 5.7 | Already built, provider-abstracted, 130+ tests         |
| **Build**      | Vite 6                    | Fast, tree-shakes, produces optimized SPA              |
| **Components** | shadcn/ui (Radix)         | Lighter than Fluent UI, fully customizable, accessible |
| **Styling**    | TailwindCSS 4             | Already integrated, design token system in place       |
| **State**      | Zustand + TanStack Query  | Already integrated, server/client state separated      |
| **Forms**      | react-hook-form + Zod     | Already integrated with form engine                    |

> **Why NOT Fluent UI?** Fluent UI v9 is 3x heavier than shadcn/ui, forces Microsoft's design language, and limits white-labeling. shadcn/ui gives us enterprise look without vendor branding. If the app embeds inside Microsoft Teams, add `@fluentui/react-components` for just those surfaces.

> **Why NOT Blazor?** Rewriting 50+ React components in C# takes 4-6 months, loses the React ecosystem (shadcn/ui, TanStack, react-hook-form, 200K+ npm packages), and doesn't add business value. Blazor makes sense for greenfield C# shops. We're not one.

> **Why NOT Next.js?** SSR adds complexity (server deployment, hydration bugs, larger infra). Our app is a dashboard SPA — users log in and stay. SSR's SEO benefits are irrelevant for an authenticated enterprise app.

---

### Hosting — Azure Static Web Apps

| Decision    | Details                                                                                |
| ----------- | -------------------------------------------------------------------------------------- |
| **Service** | Azure Static Web Apps (Standard tier)                                                  |
| **Why**     | SPA hosting + API backend + auth middleware + custom domain + SSL — all in ONE service |
| **Deploy**  | Git push to main → auto-builds and deploys (GitHub Actions built in)                   |
| **Auth**    | Built-in Entra ID integration (no MSAL config needed for basic flows)                  |
| **API**     | Linked Azure Functions backend (same deployment unit)                                  |
| **Cost**    | Free tier for dev/staging. Standard: **$9/mo** for production                          |

> **Why NOT Azure App Service?** Over-provisioned for an SPA. App Service is for server-rendered apps. Static Web Apps is purpose-built for React SPAs with serverless APIs.

> **Why NOT S3 + CloudFront equivalent (Blob + CDN)?** More pieces to wire. Static Web Apps gives CDN + auth + API routing + deployment in one. Less infra = faster.

**Config:**

```json
// staticwebapp.config.json
{
  "auth": {
    "identityProviders": {
      "azureActiveDirectory": {
        "registration": {
          "openIdIssuer": "https://login.microsoftonline.com/{TENANT_ID}/v2.0",
          "clientIdSettingName": "AZURE_CLIENT_ID",
          "clientSecretSettingName": "AZURE_CLIENT_SECRET"
        }
      }
    }
  },
  "routes": [
    { "route": "/api/*", "allowedRoles": ["authenticated"] },
    { "route": "/*", "rewrite": "/index.html" }
  ],
  "navigationFallback": { "rewrite": "/index.html" }
}
```

---

### Authentication — Microsoft Entra ID (Azure AD)

| Decision               | Details                                                                      |
| ---------------------- | ---------------------------------------------------------------------------- |
| **Service**            | Microsoft Entra ID (formerly Azure AD)                                       |
| **SDK**                | MSAL React (`@azure/msal-react` + `@azure/msal-browser`)                     |
| **MFA**                | Built-in — Authenticator app, SMS, FIDO2 keys, passkeys                      |
| **SSO**                | SAML 2.0 + OIDC — works with every enterprise IdP                            |
| **RBAC**               | App Roles defined in Entra → returned in JWT token → maps to our RBAC system |
| **B2C**                | Azure AD B2C for external customer/tenant users (CustomerAdmin role)         |
| **Conditional Access** | Block by location, device compliance, risk level — zero code                 |
| **Cost**               | **FREE** with any M365 license. P1 features included in M365 E3              |

> **Why NOT Auth0/Okta?** Extra vendor, extra cost ($2-5/user/month), and most enterprise customers already have Entra ID via M365. Why add a third-party when the customer's identity system IS Entra?

> **Why NOT roll our own?** The Cognito adapter we built works, but Cognito lacks Conditional Access, device compliance, and native M365 integration. Entra ID is where enterprise identity lives.

**How roles work with Entra:**

```
Entra App Registration → App Roles:
  - Admin
  - Manager
  - Technician
  - Viewer
  - CustomerAdmin

User/Group assigned to App Role in Entra Portal
  ↓
JWT token includes: "roles": ["Admin"]
  ↓
Our IAuthAdapter reads token.roles → maps to User.groups
  ↓
rbac.ts handles the rest (zero changes to existing RBAC)
```

**Azure adapter implementation:**

```typescript
// src/lib/providers/azure/azure-auth-adapter.ts
import { PublicClientApplication, InteractionRequiredAuthError } from "@azure/msal-browser";

const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID}`,
    redirectUri: window.location.origin,
  },
};

const msalInstance = new PublicClientApplication(msalConfig);

// signIn → msalInstance.loginPopup({ scopes: ["User.Read"] })
// signOut → msalInstance.logoutPopup()
// refreshToken → msalInstance.acquireTokenSilent(request)
// getSession → msalInstance.getActiveAccount() → map to AuthSession
// roles → account.idTokenClaims.roles → maps to our groups
```

---

### API — Azure Functions (Isolated Worker, Node.js/TypeScript)

| Decision           | Details                                                                          |
| ------------------ | -------------------------------------------------------------------------------- |
| **Service**        | Azure Functions v4 (Node.js 20, TypeScript)                                      |
| **Model**          | Isolated worker (not in-process) — better isolation, faster cold starts          |
| **Hosting**        | Consumption plan (dev) → Premium EP1 (prod)                                      |
| **API Gateway**    | Azure API Management (optional, add when >10 APIs)                               |
| **Why TypeScript** | Same language as frontend. One team writes both. Shared types.                   |
| **Cost**           | Consumption: first **1M executions FREE**, then $0.20/million. Premium: ~$150/mo |

> **Why NOT .NET Azure Functions?** TypeScript keeps one language across the full stack. The team already writes TypeScript. Shared type definitions between frontend and API eliminate an entire class of bugs.

> **Why NOT Azure App Service (Express.js)?** Functions are cheaper (pay-per-execution vs always-on), auto-scale better, and Static Web Apps has native Functions integration.

> **Why NOT GraphQL (like AppSync)?** REST is simpler for CRUD operations. Azure Functions + HTTP triggers are faster to build than configuring a GraphQL schema + resolvers. If needed later, add Apollo Server as a Function.

**Function structure:**

```
api/
├── src/
│   ├── functions/
│   │   ├── devices.ts          # GET/POST/PATCH /api/devices
│   │   ├── firmware.ts         # GET/POST /api/firmware
│   │   ├── service-orders.ts   # GET/POST/PATCH /api/service-orders
│   │   ├── compliance.ts       # GET/POST /api/compliance
│   │   ├── dashboard.ts        # GET /api/dashboard/metrics
│   │   └── audit-logs.ts       # GET /api/audit-logs
│   ├── middleware/
│   │   ├── auth.ts             # Validate JWT from Entra ID
│   │   ├── rbac.ts             # Check App Roles from token
│   │   └── validation.ts       # Zod schemas (shared with frontend)
│   ├── services/
│   │   ├── cosmos-client.ts    # Cosmos DB connection
│   │   └── search-client.ts    # Azure AI Search connection
│   └── shared/
│       └── types.ts            # Shared types (import from frontend)
├── host.json
├── package.json
└── tsconfig.json
```

---

### Database — Azure Cosmos DB (NoSQL)

| Decision         | Details                                                                                |
| ---------------- | -------------------------------------------------------------------------------------- |
| **Service**      | Azure Cosmos DB for NoSQL                                                              |
| **Model**        | Document store (same as DynamoDB single-table, but more flexible)                      |
| **Consistency**  | Session consistency (default — strong per user, eventual across users)                 |
| **Partitioning** | Partition key: `/tenantId` for multi-tenant, `/deviceId` for device-heavy queries      |
| **Change Feed**  | Enables real-time events → trigger Functions → push via SignalR                        |
| **Local Dev**    | Cosmos DB Emulator (runs locally, same API, zero cloud cost for dev)                   |
| **Cost**         | Serverless: **~$0.25 per million RUs** (dev). Provisioned 1000 RU/s: **$58/mo** (prod) |

> **Why NOT Azure SQL?** Our data model is document-shaped (devices, firmware, service orders — each a JSON document with nested properties). SQL requires 15+ tables with joins. Cosmos DB stores it as-is with single-digit ms reads.

> **Why NOT Azure Table Storage?** No secondary indexes, no rich queries, no change feed. Table Storage is for simple key-value. We need filters, aggregations, and real-time events.

> **Why NOT PostgreSQL Flexible Server?** Good option if the team prefers SQL. But Cosmos DB's serverless tier is cheaper for bursty workloads, and the change feed enables real-time features without polling.

**Data model (maps directly from our DynamoDB design):**

```json
// Container: ims-data (partition key: /pk)
{
  "id": "dev-001",
  "pk": "DEVICE",
  "sk": "dev-001",
  "name": "Inverter A-101",
  "serialNumber": "SN-INV-A101",
  "status": "online",
  "firmwareVersion": "2.1.0",
  "location": "Building A",
  "healthScore": 92,
  "tenantId": "tenant-001",
  "lastSeen": "2026-04-01T10:30:00Z",
  "_ts": 1743504600
}
```

---

### Search — Azure AI Search

| Decision    | Details                                                           |
| ----------- | ----------------------------------------------------------------- |
| **Service** | Azure AI Search (formerly Cognitive Search)                       |
| **Why**     | Full-text search + faceted navigation + vector search (future AI) |
| **Sync**    | Cosmos DB indexer (automatic, near real-time, zero code)          |
| **Cost**    | Basic: **$75/mo** (15GB, 3 indexes). Free tier available for dev  |

> **Why NOT Elasticsearch/OpenSearch?** Managed service overhead. Azure AI Search is fully serverless, auto-indexes from Cosmos DB, and includes semantic ranking + vector search for future AI features — no separate cluster to manage.

**Cosmos DB → AI Search sync (zero code):**
Azure AI Search has a built-in Cosmos DB indexer. Configure it once → data stays in sync automatically. No Lambda/Function needed for the pipeline.

---

### Real-Time — Azure SignalR Service

| Decision      | Details                                                                       |
| ------------- | ----------------------------------------------------------------------------- |
| **Service**   | Azure SignalR Service (Serverless mode)                                       |
| **Pattern**   | Cosmos DB Change Feed → Azure Function → SignalR → Browser                    |
| **Use Cases** | Device status changes, new alerts, firmware approval notifications            |
| **Cost**      | Free tier: 20 concurrent, 20K msg/day. Standard: **$49/mo** for 1K concurrent |

> **Why NOT polling?** 10K devices × 30s polling = 330 requests/sec hitting the API. SignalR pushes only when data changes. Cheaper, faster, less load.

> **Why NOT Azure Web PubSub?** SignalR has better React SDK, broader documentation, and the same pricing. Web PubSub is for raw WebSocket — SignalR is higher-level with automatic reconnection, groups, and user targeting.

---

### File Storage — Azure Blob Storage

| Decision      | Details                                                               |
| ------------- | --------------------------------------------------------------------- |
| **Service**   | Azure Blob Storage (Hot tier)                                         |
| **Use Cases** | Firmware packages, compliance documents, export files                 |
| **Upload**    | SAS tokens (time-limited, scoped) — same pattern as S3 presigned URLs |
| **Cost**      | Hot: **$0.018/GB/mo**. Cool: $0.01/GB. Archive: $0.002/GB             |

---

### CDN + Security — Azure Front Door

| Decision     | Details                                                       |
| ------------ | ------------------------------------------------------------- |
| **Service**  | Azure Front Door (Standard tier)                              |
| **Includes** | Global CDN + WAF + DDoS protection + SSL + custom domains     |
| **Why**      | One service replaces CloudFront + WAF + Route53. Less config. |
| **Cost**     | Standard: **~$35/mo** + $0.08/GB transfer                     |

> If using Static Web Apps, the built-in CDN may be enough. Add Front Door only when you need WAF rules or multi-region failover.

---

### Infrastructure as Code — Bicep

| Decision               | Details                                                                                                                                                                             |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tool**               | Bicep (Azure-native IaC)                                                                                                                                                            |
| **Why NOT Terraform?** | Bicep is 50% less verbose for Azure, first-class support, no state file management, and `azd` uses it natively. Terraform is still supported (story #207) but Bicep is the primary. |
| **Deploy**             | `azd up` reads `azure.yaml` + `infra/main.bicep` → provisions everything                                                                                                            |

**Complete infrastructure in one file:**

```bicep
// infra/main.bicep
targetScope = 'resourceGroup'

param location string = resourceGroup().location
param appName string = 'ims-gen2'

// Static Web App (React SPA + Functions API)
resource staticWebApp 'Microsoft.Web/staticSites@2023-12-01' = {
  name: '${appName}-swa'
  location: location
  sku: { name: 'Standard', tier: 'Standard' }
  properties: { buildProperties: { appLocation: '/', apiLocation: 'api', outputLocation: 'dist' } }
}

// Cosmos DB (NoSQL, serverless)
resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2024-02-15-preview' = {
  name: '${appName}-cosmos'
  location: location
  properties: {
    databaseAccountOfferType: 'Standard'
    capabilities: [{ name: 'EnableServerless' }]
    locations: [{ locationName: location, failoverPriority: 0 }]
  }
}

resource cosmosDb 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2024-02-15-preview' = {
  parent: cosmosAccount
  name: 'ims-db'
  properties: { resource: { id: 'ims-db' } }
}

resource container 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/sqlContainers@2024-02-15-preview' = {
  parent: cosmosDb
  name: 'ims-data'
  properties: {
    resource: {
      id: 'ims-data'
      partitionKey: { paths: ['/pk'], kind: 'Hash' }
      indexingPolicy: { automatic: true, indexingMode: 'consistent' }
    }
  }
}

// SignalR (serverless mode)
resource signalr 'Microsoft.SignalRService/signalR@2024-03-01' = {
  name: '${appName}-signalr'
  location: location
  sku: { name: 'Free_F1', capacity: 1 }
  properties: { features: [{ flag: 'ServiceMode', value: 'Serverless' }] }
}

// Azure AI Search
resource search 'Microsoft.Search/searchServices@2024-03-01-preview' = {
  name: '${appName}-search'
  location: location
  sku: { name: 'basic' }
}

// Application Insights
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${appName}-insights'
  location: location
  kind: 'web'
  properties: { Application_Type: 'web' }
}

// Blob Storage
resource storage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: replace('${appName}store', '-', '')
  location: location
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
}

// Outputs for app config
output swaHostname string = staticWebApp.properties.defaultHostname
output cosmosEndpoint string = cosmosAccount.properties.documentEndpoint
output searchEndpoint string = 'https://${search.name}.search.windows.net'
output signalrEndpoint string = signalr.properties.hostName
output insightsKey string = appInsights.properties.InstrumentationKey
```

---

### Monitoring — Application Insights

| Decision     | Details                                                                                  |
| ------------ | ---------------------------------------------------------------------------------------- |
| **Service**  | Application Insights (part of Azure Monitor)                                             |
| **Frontend** | `@microsoft/applicationinsights-web` SDK — auto-tracks page views, exceptions, API calls |
| **Backend**  | Auto-instrumented in Azure Functions                                                     |
| **Features** | Live metrics, application map, failure analysis, smart detection, distributed tracing    |
| **Cost**     | First **5GB/mo FREE**, then $2.30/GB                                                     |

> **Why this over CloudWatch?** CloudWatch is metrics-focused. Application Insights is APM — it traces a single request from React → API → Cosmos DB → response, showing exactly where time is spent. Smart detection alerts you before users notice problems.

---

### CI/CD — GitHub Actions (No Change)

| Decision   | Details                                             |
| ---------- | --------------------------------------------------- |
| **Tool**   | GitHub Actions (same as current)                    |
| **Deploy** | `azure/static-web-apps-deploy@v1` action            |
| **Auth**   | `azure/login@v2` with OIDC (no stored secrets)      |
| **E2E**    | Same Java/Maven/Playwright framework, same workflow |

**Deployment workflow (add to existing ci.yml):**

```yaml
- name: Deploy to Azure
  uses: azure/static-web-apps-deploy@v1
  with:
    azure_static_web_apps_api_token: ${{ secrets.AZURE_SWA_TOKEN }}
    app_location: "/"
    api_location: "api"
    output_location: "dist"
```

---

## Cost Breakdown

### Development / Staging (1-5 developers)

| Service         | Tier                  | Monthly Cost |
| --------------- | --------------------- | ------------ |
| Static Web Apps | Free                  | $0           |
| Azure Functions | Consumption (1M free) | $0           |
| Cosmos DB       | Serverless            | ~$5          |
| Entra ID        | Free (with M365)      | $0           |
| AI Search       | Free tier             | $0           |
| SignalR         | Free tier             | $0           |
| Blob Storage    | 10GB Hot              | $0.18        |
| App Insights    | 5GB free              | $0           |
| **Total**       |                       | **~$5/mo**   |

### Production (1,000 users, 10K devices)

| Service         | Tier                     | Monthly Cost |
| --------------- | ------------------------ | ------------ |
| Static Web Apps | Standard                 | $9           |
| Azure Functions | Premium EP1              | $150         |
| Cosmos DB       | Provisioned 1000 RU/s    | $58          |
| Entra ID        | P1 (included in M365 E3) | $0           |
| AI Search       | Basic                    | $75          |
| SignalR         | Standard (1K conn)       | $49          |
| Blob Storage    | 100GB Hot                | $1.80        |
| Front Door      | Standard                 | $35          |
| App Insights    | 20GB                     | $35          |
| **Total**       |                          | **~$413/mo** |

> **Compare:** AWS equivalent runs ~$1,200-1,500/mo for the same workload. Azure is **65-70% cheaper** because Entra ID is free with M365, Cosmos DB serverless is cheaper than DynamoDB on-demand, and Static Web Apps includes hosting + CDN + API.

---

## What We Build (Implementation Plan)

### Phase 1: Azure Adapter (Week 1-2)

Create 2 files:

```
src/lib/providers/azure/
  ├── azure-auth-adapter.ts      # MSAL React + Entra ID (implements IAuthAdapter)
  └── azure-api-provider.ts      # Azure Functions REST client (implements IApiProvider)
```

Update `platform.config.ts`:

```typescript
case "azure":
  return {
    api: createAzureApiProvider(),
    storage: createMockStorageProvider(), // localStorage works fine
    AuthProvider: createAuthProvider(createAzureAuthAdapter()),
  };
```

**That's it for the frontend.** Set `VITE_PLATFORM=azure` → app connects to Azure.

### Phase 2: Azure Functions API (Week 2-3)

Create the `api/` folder with TypeScript Functions matching `IApiProvider` methods:

```
6 Function files → covers all 30+ API methods
  devices.ts      → listDevices, getDevice, createDevice, updateDevice
  firmware.ts     → listFirmware, uploadFirmware, approveFirmware
  orders.ts       → listServiceOrders, createServiceOrder, updateServiceOrder
  compliance.ts   → listCompliance, submitReview, listVulnerabilities
  dashboard.ts    → getDashboardMetrics, getAggregations
  audit.ts        → listAuditLogs, getAuditLogsByUser
```

### Phase 3: Infrastructure (Week 3-4)

```bash
azd init --template ims-gen2-azure
azd up                              # Provisions everything from main.bicep
```

### Phase 4: Search + Real-Time (Week 4-5)

- Configure Cosmos DB indexer → Azure AI Search (zero code, portal config)
- Wire Cosmos DB Change Feed → Function → SignalR for live updates

### Phase 5: Monitoring + Security (Week 5-6)

- App Insights SDK in frontend + Functions
- Front Door WAF rules
- Entra ID Conditional Access policies

**Total: 6 weeks from zero to production on Azure.**

---

## Decision Summary

| Question            | Answer                                               |
| ------------------- | ---------------------------------------------------- |
| Frontend framework? | **React 18** (keep as-is)                            |
| Component library?  | **shadcn/ui** (keep as-is)                           |
| Hosting?            | **Azure Static Web Apps**                            |
| Auth?               | **Microsoft Entra ID + MSAL React**                  |
| API?                | **Azure Functions (TypeScript, isolated worker)**    |
| Database?           | **Azure Cosmos DB (NoSQL, serverless)**              |
| Search?             | **Azure AI Search**                                  |
| Real-time?          | **Azure SignalR (serverless)**                       |
| Files?              | **Azure Blob Storage**                               |
| CDN + WAF?          | **Azure Front Door** (prod) / SWA built-in (staging) |
| IaC?                | **Bicep** (primary) + Terraform (optional)           |
| CI/CD?              | **GitHub Actions** (no change)                       |
| Monitoring?         | **Application Insights**                             |
| Dev cost?           | **~$5/mo**                                           |
| Prod cost?          | **~$413/mo**                                         |
| Migration time?     | **6 weeks**                                          |

This is not a suggestion. This is the architecture.
