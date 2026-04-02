# IMS Gen 2 — Integration Contract

> **Version:** 1.0
> **Date:** April 2026
> **Purpose:** Defines the env vars, API shape, and auth token format the IMS Gen 2 template expects from any infrastructure provider.

---

## Overview

The IMS Gen 2 template is **infrastructure-agnostic**. It runs on AWS (CDK, Amplify, Terraform), Azure (Bicep), or any backend that satisfies this contract. The frontend never calls cloud services directly — it uses adapter interfaces that read configuration from environment variables.

```
React App → IAuthAdapter / IApiProvider / IStorageProvider
                ↓
        ENV VAR CONTRACT (this document)
                ↓
    CDK / Terraform / Bicep / Pulumi / Manual Setup
```

---

## 1. Environment Variables

### Required

| Variable        | Description                                                               | Example                                                    |
| --------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `VITE_PLATFORM` | Which adapter to load. Determines auth, API, and storage implementations. | `mock`, `aws-cdk`, `aws-amplify`, `aws-terraform`, `azure` |

### Required for Cloud Platforms (not needed for `mock`)

| Variable                 | Description                                                  | Example                                                                 |
| ------------------------ | ------------------------------------------------------------ | ----------------------------------------------------------------------- |
| `VITE_AUTH_PROVIDER_URL` | Auth issuer URL (Cognito, Entra ID, Auth0)                   | `https://cognito-idp.ap-southeast-2.amazonaws.com/ap-southeast-2_xxxxx` |
| `VITE_AUTH_CLIENT_ID`    | OAuth 2.0 client ID for the SPA app registration             | `3abc4def5ghi6jkl7mno8pqr`                                              |
| `VITE_API_ENDPOINT`      | Backend API base URL (AppSync, API Gateway, Azure Functions) | `https://xxxx.appsync-api.ap-southeast-2.amazonaws.com/graphql`         |
| `VITE_API_TYPE`          | API protocol. Determines how the adapter formats requests.   | `graphql` or `rest`                                                     |

### Optional (enable as features are deployed)

| Variable                 | Description                                              | Default             | Example                                                 |
| ------------------------ | -------------------------------------------------------- | ------------------- | ------------------------------------------------------- |
| `VITE_AUTH_REGION`       | AWS region for Cognito (AWS platforms only)              | `ap-southeast-2`    | `us-east-1`                                             |
| `VITE_AUTH_TENANT_ID`    | Azure AD tenant ID (Azure platform only)                 | —                   | `12345-abcde-...`                                       |
| `VITE_STORAGE_ENDPOINT`  | Presigned URL endpoint for file uploads (firmware, docs) | —                   | `https://api.example.com/storage`                       |
| `VITE_SEARCH_ENDPOINT`   | OpenSearch / Azure AI Search endpoint                    | —                   | `https://search-ims.ap-southeast-2.es.amazonaws.com`    |
| `VITE_REALTIME_ENDPOINT` | WebSocket / SignalR endpoint for live updates            | —                   | `wss://xxxx.appsync-realtime-api.amazonaws.com/graphql` |
| `VITE_APP_VERSION`       | Override build-injected version (normally auto-detected) | From `package.json` | `1.2.0+abc1234`                                         |

### How Infrastructure Should Output These

Your IaC (CDK, Terraform, Bicep) should output these values as stack outputs. Example for CDK:

```typescript
new CfnOutput(this, "ViteAuthProviderUrl", {
  value: userPool.userPoolProviderUrl,
  description: "VITE_AUTH_PROVIDER_URL for IMS template",
});
```

Then populate `.env` from outputs:

```bash
# After CDK deploy
aws cloudformation describe-stacks --stack-name ims-prod \
  --query "Stacks[0].Outputs" | jq -r '.[] | "VITE_\(.OutputKey)=\(.OutputValue)"' > .env
```

---

## 2. Auth Token Contract

The template expects JWT tokens with the following claims, regardless of IdP:

### Required Claims

| Claim   | Type   | Description                       |
| ------- | ------ | --------------------------------- |
| `sub`   | string | Unique user identifier            |
| `email` | string | User's email address              |
| `exp`   | number | Token expiration (Unix timestamp) |

### Role Claims (at least one)

| Claim            | Type     | Description                           |
| ---------------- | -------- | ------------------------------------- |
| `cognito:groups` | string[] | Cognito user pool groups (AWS)        |
| `roles`          | string[] | Entra ID app roles (Azure)            |
| `custom:groups`  | string   | Comma-separated groups (generic OIDC) |

The `IAuthAdapter.signIn()` method maps IdP-specific claims to the `AuthSession` type:

```typescript
interface AuthSession {
  user: User; // { id, email, name, role, ... }
  groups: string[]; // ["Admin"] | ["Technician", "Viewer"]
  customerId: string | null;
  accessTokenExpiresAt: number;
  refreshTokenExpiresAt: number;
}
```

### Supported Roles

The RBAC system (`src/lib/rbac.ts`) recognizes these roles:

| Role            | Access Level                                      |
| --------------- | ------------------------------------------------- |
| `Admin`         | Full access to all features                       |
| `Manager`       | Device management, deployments, compliance, users |
| `Technician`    | Device inventory, service orders, deployments     |
| `Viewer`        | Read-only access to all pages                     |
| `CustomerAdmin` | Customer-scoped access (multi-tenant)             |

---

## 3. API Shape Contract

The template expects the backend to implement the operations defined in `IApiProvider` (`src/lib/providers/types.ts`). The adapter translates these into the appropriate protocol (GraphQL mutations/queries or REST endpoints).

### Core Queries

| Operation               | Parameters                           | Returns                            | Description                                    |
| ----------------------- | ------------------------------------ | ---------------------------------- | ---------------------------------------------- |
| `listDevices`           | page, pageSize, filters              | `PaginatedResponse<Device>`        | Paginated device listing with optional filters |
| `getDevice`             | id                                   | `Device \| null`                   | Single device by ID                            |
| `searchDevices`         | query                                | `SearchResult<Device>`             | Full-text device search                        |
| `listFirmware`          | page, pageSize                       | `PaginatedResponse<Firmware>`      | Firmware packages listing                      |
| `getFirmware`           | id                                   | `Firmware \| null`                 | Single firmware by ID                          |
| `listServiceOrders`     | page, pageSize, status               | `PaginatedResponse<ServiceOrder>`  | Service orders with status filter              |
| `listCompliance`        | status, certType                     | `PaginatedResponse<Compliance>`    | Compliance records                             |
| `listVulnerabilities`   | severity                             | `PaginatedResponse<Vulnerability>` | CVE/vulnerability listing                      |
| `listAuditLogs`         | startDate, endDate, limit, nextToken | `PaginatedResponse<AuditLog>`      | Time-range audit log query                     |
| `getAuditLogsByUser`    | userId                               | `AuditLog[]`                       | Audit logs for a specific user                 |
| `getCustomer`           | id                                   | `Customer \| null`                 | Customer/tenant details                        |
| `listNotifications`     | —                                    | `Notification[]`                   | User notifications                             |
| `getDeviceAggregations` | —                                    | `AggregationResult[]`              | Device status aggregation                      |
| `getDashboardMetrics`   | —                                    | `DashboardMetrics`                 | Dashboard summary metrics                      |

### Core Mutations

| Operation                 | Parameters | Returns                | Description                       |
| ------------------------- | ---------- | ---------------------- | --------------------------------- |
| `createServiceOrder`      | input      | `ServiceOrder \| null` | Create a new service order        |
| `updateServiceOrder`      | id, input  | `ServiceOrder \| null` | Update service order              |
| `uploadFirmware`          | input      | `Firmware \| null`     | Upload firmware package metadata  |
| `approveFirmware`         | id, stage  | `Firmware \| null`     | Approve firmware at a given stage |
| `submitComplianceReview`  | id         | `Compliance \| null`   | Submit compliance for review      |
| `acknowledgeNotification` | id         | `boolean`              | Mark notification as read         |

### Telemetry Operations

| Operation                    | Parameters                         | Returns                     |
| ---------------------------- | ---------------------------------- | --------------------------- |
| `getDeviceTelemetry`         | deviceId, startDate, endDate       | `TelemetryReading[]`        |
| `getHeatmapAggregation`      | bounds, precision, riskThreshold   | `HeatmapAggregation`        |
| `getBlastRadius`             | lat, lng, radiusKm, includeOffline | `BlastRadiusResult \| null` |
| `ingestTelemetry`            | deviceId, metrics                  | `TelemetryReading \| null`  |
| `getTelemetryPipelineStatus` | —                                  | `TelemetryPipelineStatus`   |

### Search Operations (requires VITE_SEARCH_ENDPOINT)

| Operation               | Parameters                | Returns                       |
| ----------------------- | ------------------------- | ----------------------------- |
| `searchGlobal`          | query, entityTypes, limit | `GlobalSearchResponse`        |
| `searchDevicesAdvanced` | query, filters            | `SearchResult<Device>`        |
| `searchVulnerabilities` | query, severity           | `SearchResult<Vulnerability>` |
| `getAggregation`        | metric, timeRange         | `AggregationResponse`         |
| `searchDevicesByBounds` | bounds, status            | `GeoDeviceResult[]`           |
| `getDeviceGeoClusters`  | bounds, precision         | `GeoCluster[]`                |

### Pagination Format

All paginated responses must match:

```typescript
interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  nextToken?: string;
}
```

---

## 4. Boot-Time Validation

The template validates env vars at startup (`platform.config.ts`). If required variables are missing, the app fails fast with an actionable error message rather than failing silently at runtime.

**Validation rules:**

- `VITE_PLATFORM` must be one of: `mock`, `aws-amplify`, `aws-cdk`, `aws-terraform`, `azure`
- For non-mock platforms: `VITE_AUTH_PROVIDER_URL`, `VITE_AUTH_CLIENT_ID`, and `VITE_API_ENDPOINT` are required
- Missing optional vars log a warning but don't block startup

---

## 5. For Infrastructure Teams

### Minimum Viable Setup

To get the template running against your infrastructure:

1. Deploy auth (Cognito / Entra ID) with an SPA app registration
2. Deploy API (AppSync / API Gateway / Azure Functions) implementing the core queries/mutations
3. Set the 4 required env vars
4. Run `npm run dev` — the adapter handles the rest

### What You Don't Need

- No specific database — use DynamoDB, Cosmos DB, PostgreSQL, or anything behind the API
- No specific IaC — CDK, Terraform, Bicep, Pulumi, or click-ops
- No specific CI/CD — GitHub Actions, Azure DevOps, or anything that can set env vars
- No specific hosting — Static Web Apps, S3+CloudFront, Vercel, Netlify, or any static host

The template is a React SPA. It needs a URL to authenticate and a URL to call APIs. Everything else is your choice.
