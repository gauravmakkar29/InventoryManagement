# IMS Gen 2 — Detailed Project Brief

> **Purpose:** Complete functional specification for the Hardware Lifecycle Management (HLM) platform, to be implemented with Terraform on AWS.
> **Generated:** 2026-03-09

---

## 1. EXECUTIVE SUMMARY

**IMS Gen 2** (Inventory Management System, Generation 2) is a **Hardware Lifecycle Management (HLM)** platform for enterprise device inventory tracking, firmware deployment with multi-stage approval, compliance/vulnerability management, service order scheduling, and analytics — all governed by NIST 800-53 security controls.

### Business Goals

- Centralized hardware asset tracking across locations and customers
- Firmware lifecycle management with separation-of-duties approval workflow
- NIST 800-53 compliance tracking and reporting
- Service order scheduling and technician dispatch management
- Real-time analytics and executive dashboards
- Geo-location visualization of device fleet

### Infrastructure Approach — Terraform on AWS

All infrastructure is provisioned and managed via **Terraform**, providing:

- **Full infrastructure control** — every AWS resource explicitly defined
- **WAF/Shield** protection on AppSync + CloudFront
- **Custom domain** via Route53 + ACM certificate management
- **CloudWatch dashboards & SNS alerting** with granular metric control
- **Budget alerts** and cost governance
- **Multi-environment promotion** (dev → staging → prod) with Terraform state isolation
- **Fine-grained IAM policies** with least-privilege access

---

## 2. TECHNOLOGY STACK

| Layer | Technology | Version / Notes |
|-------|-----------|-----------------|
| **Frontend Framework** | React | 18.3.1 |
| **Build Tool** | Vite | 6.3.5 |
| **Language** | TypeScript | 5.7.3 |
| **Styling** | TailwindCSS | 4.1.12 |
| **UI Components** | Radix UI (shadcn/ui) | 25+ packages |
| **Charts** | Recharts | 2.15.2 |
| **Maps** | react-simple-maps | 3.0.0 |
| **Drag & Drop** | react-dnd + HTML5 Backend | 16.0.1 (Kanban board) |
| **Animations** | Motion (Framer Motion) | 12.23.24 |
| **Forms** | react-hook-form | 7.55.0 |
| **Toasts** | Sonner | 2.0.3 |
| **Carousel** | embla-carousel-react | 8.6.0 |
| **Icons** | Lucide React | 0.487.0 |
| **Routing** | React Router | 7.13.0 |
| **GraphQL API** | AWS AppSync | Terraform-managed |
| **Database** | Amazon DynamoDB | Single-table design |
| **Auth** | Amazon Cognito | User Pools + RBAC |
| **Storage** | Amazon S3 | WORM (Object Lock) for firmware |
| **Serverless Compute** | AWS Lambda | Node.js 20.x |
| **CDN / Hosting** | CloudFront + S3 | Static SPA hosting |
| **DNS** | Route53 + ACM | Custom domain + TLS |
| **Security** | WAF v2 | Managed rules + rate limiting |
| **Monitoring** | CloudWatch Dashboards | DynamoDB, Lambda, AppSync metrics |
| **Alerting** | SNS | Threshold-based alerts |
| **IaC** | Terraform | S3 + DynamoDB state backend |
| **Search & Aggregations** | OpenSearch Serverless | Serverless collection + OSIS pipeline |
| **Testing** | Vitest + RTL | 3.2.4 |
| **CI/CD** | GitHub Actions | Plan on PR, Apply on merge |

---

## 2A. USER PERSONAS & JOURNEYS

### 2A.1 Personas

| Persona | Role | Goals | Daily Workflow |
|---------|------|-------|---------------|
| **Sarah** (Platform Admin) | Admin | Full system oversight, user management, firmware approval, compliance enforcement | Reviews pending approvals → checks compliance dashboard → manages users → approves firmware → reviews audit logs |
| **Raj** (Operations Manager) | Manager | Team coordination, deployment scheduling, sprint-level visibility, client reporting | Checks dashboard KPIs → assigns service orders → monitors deployment pipeline → reviews analytics → generates reports for clients |
| **Mike** (Field Technician) | Technician | Execute service orders, update device status, view assigned work | Opens Account/Service → views assigned orders on Kanban → updates order status → logs device maintenance notes |
| **Lisa** (Compliance Auditor) | Viewer | Read-only access to compliance status, audit logs, vulnerability reports | Opens Compliance page → filters by certification → reviews vulnerability panel → exports regulatory readiness report (CSV/JSON) |
| **Chen** (Customer Admin) | CustomerAdmin | View own organization's devices, service orders, compliance status | Logs in → sees only own tenant's data → monitors device fleet health → tracks open service orders |

### 2A.2 Key User Journeys

#### Journey 1: Firmware Deployment (Admin — Sarah)

```
Login → Dashboard (see "3 Pending Approvals" badge)
  → Click "Pending Approvals" quick action
  → Deployment page → Firmware tab
  → Review firmware card (version, model, checksum, uploaded by)
  → Click "Advance to Testing" (SoD: uploader ≠ tester)
  → Testing complete → Click "Approve" (SoD: tester ≠ approver)
  → Approval Stage Indicator shows ✅ Uploaded → ✅ Testing → ✅ Approved
  → Audit Log tab shows complete approval chain
  → 🔔 Notification: "FW v3.2.1 approved for SG-3600"
```

#### Journey 2: Device Inventory Search (Manager — Raj)

```
Login → Inventory page → Hardware Inventory tab
  → Type "SG-3600" in search bar (current: exact match)
  → [With OpenSearch]: Type "sungr" → autocomplete suggests "Sungrow SG-3600", "Sungrow SG-5000"
  → Apply filters: Status=Online, Location=Sydney
  → View 23 results in compact data table (6/page, paginated)
  → Click "Geo Location" tab → see devices on interactive world map
  → Click device pin → tooltip shows name, status, health score, firmware version
  → Export filtered results to CSV
```

#### Journey 3: Service Order Lifecycle (Technician — Mike)

```
Login → Account & Service page
  → Kanban view: 3 columns (Scheduled | In Progress | Completed)
  → See assigned order card in "Scheduled" column
  → Drag card to "In Progress"
  → Toggle to Calendar view → see today's orders on monthly calendar
  → Complete work → drag card to "Completed"
  → 🔔 Notification sent to Manager: "SO-4521 completed by Mike"
```

#### Journey 4: Compliance Audit (Viewer — Lisa)

```
Login → Compliance page
  → Filter by certification: "IEC 62109"
  → See compliance items with status badges (Approved/Pending/Deprecated)
  → Click item → Vulnerability Panel expands
  → View CVEs: severity (Critical/High/Medium/Low), affected component, remediation status
  → Click "Generate Regulatory Report"
  → Regulatory Report Dialog → select format (CSV/JSON) → download
  → [With OpenSearch]: searchVulnerabilities("OpenSSL") → find all CVEs across all firmware
```

#### Journey 5: Executive Dashboard Review (Manager — Raj, for client meeting)

```
Login → Dashboard
  → 4 KPI cards: 1,247 Total Devices | 8 Active Deployments | 3 Pending Approvals | 94.2 Health Score
  → Quick Actions: click counts show pending items per module
  → Recent Alerts: last 24hr audit entries
  → System Status: 4 green indicators (Deployment ✅, Compliance ✅, Asset DB ✅, Analytics ✅)
  → Navigate to Analytics → select 30-day range
  → [With OpenSearch]: Charts powered by server-side aggregations (no client-side computation)
  → Export charts/data for client presentation
```

### 2A.3 Persona-to-Feature Matrix

| Feature | Admin | Manager | Technician | Viewer | CustomerAdmin |
|---------|:-----:|:-------:|:----------:|:------:|:-------------:|
| Dashboard KPIs | ✅ | ✅ | ✅ | ✅ | ✅ (own data) |
| Device CRUD | ✅ Create/Edit/Delete | ✅ Create/Edit | ❌ | ❌ | ❌ |
| Device Search & Filters | ✅ | ✅ | ✅ | ✅ | ✅ (own devices) |
| Geo Location Map | ✅ | ✅ | ✅ | ✅ | ✅ (own devices) |
| Global Search (OpenSearch) | ✅ All entities | ✅ All entities | ✅ Devices + Orders | ✅ Read-only | ✅ Own tenant |
| Firmware Upload | ✅ | ✅ | ❌ | ❌ | ❌ |
| Firmware Approve | ✅ (SoD enforced) | ❌ | ❌ | ❌ | ❌ |
| Advance Firmware Stage | ✅ (SoD enforced) | ✅ (SoD enforced) | ❌ | ❌ | ❌ |
| Service Orders (Kanban) | ✅ | ✅ Create/Assign | ✅ Own orders | ❌ | ❌ |
| Service Orders (Calendar) | ✅ | ✅ | ✅ Own schedule | ❌ | ❌ |
| Compliance Management | ✅ Approve/Deprecate | ✅ Submit for review | ❌ | ✅ Read-only | ❌ |
| Vulnerability Panel | ✅ Update status | ✅ Update status | ❌ | ✅ Read-only | ❌ |
| Audit Logs | ✅ Full access | ✅ Full access | ❌ | ❌ | ❌ |
| Analytics & Charts | ✅ | ✅ | ❌ | ✅ | ✅ (own data) |
| Regulatory Reports | ✅ Generate + Export | ✅ Generate + Export | ❌ | ✅ Export only | ❌ |
| User Management | ✅ | ❌ | ❌ | ❌ | ❌ |
| Notifications | ✅ All | ✅ All | ✅ Own orders | ✅ Compliance alerts | ✅ Own tenant |

---

## 3. APPLICATION ARCHITECTURE

### 3.1 System Overview

```
┌──────────────────────────────────────────────────────┐
│                    FRONTEND (SPA)                     │
│  React 18 + Vite + TailwindCSS + Radix UI            │
│  6 Pages: Dashboard, Inventory, Deployment,          │
│  Compliance, Account/Service, Analytics              │
├──────────────────────────────────────────────────────┤
│                  SECURITY LAYER                       │
│  WAF v2 (AWS Managed Rules + Rate Limiting)          │
│  CloudFront + ACM (TLS termination)                  │
├──────────────────────────────────────────────────────┤
│                    API LAYER                          │
│  AWS AppSync (GraphQL)                               │
│  24 Queries + 9 Mutations                            │
│  15 JavaScript Resolvers (11 DynamoDB + 4 OpenSearch)│
├──────────────────────────────────────────────────────┤
│                  DATA LAYER                           │
│  DynamoDB (Single-Table) ──► 4 GSIs                  │
│  8 Entity Types │ Streams → Lambda → Audit           │
├──────────────────────────────────────────────────────┤
│                  AUTH LAYER                           │
│  Cognito User Pool │ 5 RBAC Groups │ MFA (TOTP)     │
├──────────────────────────────────────────────────────┤
│                  STORAGE LAYER                        │
│  S3 Firmware Bucket │ WORM │ KMS │ Glacier Archive   │
├──────────────────────────────────────────────────────┤
│                  SEARCH LAYER                        │
│  OpenSearch Serverless │ OSIS Pipeline │ AppSync HTTP│
│  Full-text search │ Aggregations │ Geo queries       │
├──────────────────────────────────────────────────────┤
│                  OBSERVABILITY                        │
│  CloudWatch Dashboards │ SNS Alerting │ Budget Alarms│
└──────────────────────────────────────────────────────┘
```

### 3.2 Data Flow

1. **User** → React SPA (served from CloudFront + S3)
2. **CloudFront** → WAF v2 (rate limiting, managed rules)
3. **SPA** → Cognito (login, MFA, token refresh)
4. **SPA** → AppSync GraphQL (queries/mutations with JWT)
5. **AppSync** → DynamoDB (via JS resolvers, direct table access)
6. **AppSync** → OpenSearch Serverless (via HTTP data source, IAM-signed `aoss`)
7. **DynamoDB Streams** → Lambda (audit log generation)
8. **DynamoDB Streams** → OSIS Pipeline → OpenSearch Serverless (search index sync)
9. **Lambda** → DynamoDB (writes AUDIT# records back)
10. **Firmware uploads** → S3 (WORM bucket with Object Lock)
11. **CloudWatch** → SNS (threshold alerts to operators)

---

## 4. DATABASE DESIGN — DynamoDB Single-Table

### 4.1 Entity Types & Key Patterns

| Entity | PK Format | SK Format | Discriminator |
|--------|-----------|-----------|---------------|
| Device | `DEV#<id>` | `DEV#<id>` | `entityType: "Device"` |
| Firmware | `FW#<id>` | `FW#<id>` | `entityType: "Firmware"` |
| ServiceOrder | `SO#<id>` | `SO#<id>` | `entityType: "ServiceOrder"` |
| Compliance | `COMP#<id>` | `COMP#<id>` | `entityType: "Compliance"` |
| Vulnerability | `VULN#<id>` | `VULN#<id>` | `entityType: "Vulnerability"` |
| AuditLog | `AUDIT#<id>` | `AUDIT#<id>` | `entityType: "AuditLog"` |
| Customer | `CUST#<id>` | `CUST#<id>` | `entityType: "Customer"` |
| User | `USER#<id>` | `USER#<id>` | `entityType: "User"` |

### 4.2 Global Secondary Indexes (GSIs)

| GSI | PK (GSI*PK) | SK (GSI*SK) | Access Patterns |
|-----|-------------|-------------|-----------------|
| **GSI1** | Entity type (e.g., `"DEVICE"`, `"FIRMWARE"`) | `<status>#<timestamp>` | List by status: `listDevices`, `listFirmware`, `listComplianceByStatus`, `listUsersByRole` |
| **GSI2** | Entity type (e.g., `"AUDIT_LOG"`) | ISO8601 timestamp | Time-range queries: `listAuditLogs`, `listServiceOrdersByDate` |
| **GSI3** | Lookup attribute (location, model, technician, certification, email) | PK of entity | Attribute lookups: `getDevicesByLocation`, `getFirmwareByModel`, `getUserByEmail` |
| **GSI4** | Parent PK (e.g., `USER#<id>`, `COMP#<id>`, `FW#<id>`) | Child PK | Relationship traversal: `getAuditLogsByUser`, `listVulnerabilitiesByCompliance` |

### 4.3 Table Configuration

| Setting | Value | NIST Control |
|---------|-------|-------------|
| Billing Mode | PAY_PER_REQUEST | — |
| Point-in-Time Recovery | **Enabled** | CP-9 |
| DynamoDB Streams | **NEW_AND_OLD_IMAGES** | AU-12 |
| TTL Attribute | `ttl` (on AuditLog, 90-day expiry) | — |
| Encryption | **KMS-managed** (aws/dynamodb) | SC-28 |

### 4.4 Entity Field Definitions

#### Device

```typescript
{
  PK: "DEV#<uuid>",
  SK: "DEV#<uuid>",
  entityType: "Device",
  deviceName: string,
  serialNumber: string,
  deviceModel: string,
  firmwareVersion: string,
  status: "Online" | "Offline" | "Maintenance",
  location: string,
  lat: number,
  lng: number,
  customerId: string,
  healthScore: number,
  lastSeen: string,    // ISO8601
  GSI1PK: "DEVICE",
  GSI1SK: "<status>#<timestamp>",
  GSI3PK: "<location>",
  GSI3SK: "DEV#<uuid>",
  GSI4PK: "FW#<firmwareId>",
  GSI4SK: "DEV#<uuid>"
}
```

#### Firmware

```typescript
{
  PK: "FW#<uuid>",
  SK: "FW#<uuid>",
  entityType: "Firmware",
  name: string,
  version: string,
  deviceModel: string,
  releaseDate: string,
  fileSize: string,
  checksum: string,
  s3Key: string,
  s3Bucket: string,
  status: "Active" | "Deprecated" | "Pending",
  approvalStage: "Uploaded" | "Testing" | "Approved",
  uploadedBy: string,
  approvedBy: string,
  approvedDate: string,
  testedBy: string,
  testedDate: string,
  securityReviewedBy: string,
  securityReviewedDate: string,
  downloads: number,
  GSI1PK: "FIRMWARE",
  GSI1SK: "<status>#<timestamp>",
  GSI3PK: "<deviceModel>",
  GSI3SK: "FW#<uuid>"
}
```

#### ServiceOrder

```typescript
{
  PK: "SO#<uuid>",
  SK: "SO#<uuid>",
  entityType: "ServiceOrder",
  title: string,
  technicianId: string,
  serviceType: "Internal" | "3rd Party",
  location: string,
  scheduledDate: string,
  scheduledTime: string,
  priority: "High" | "Medium" | "Low",
  status: "Scheduled" | "In Progress" | "Completed",
  customerId: string,
  GSI1PK: "SERVICE_ORDER",
  GSI1SK: "<status>#<timestamp>",
  GSI2PK: "SERVICE_ORDER",
  GSI2SK: "<scheduledDate>",
  GSI3PK: "<technicianId>",
  GSI3SK: "SO#<uuid>",
  GSI4PK: "CUST#<customerId>",
  GSI4SK: "SO#<uuid>"
}
```

#### Compliance

```typescript
{
  PK: "COMP#<uuid>",
  SK: "COMP#<uuid>",
  entityType: "Compliance",
  firmwareVersion: string,
  deviceModel: string,
  certification: string,
  status: "Approved" | "Pending" | "Deprecated",
  vulnerabilityCount: number,
  GSI1PK: "COMPLIANCE",
  GSI1SK: "<status>#<timestamp>",
  GSI3PK: "<certification>",
  GSI3SK: "COMP#<uuid>",
  GSI4PK: "FW#<firmwareId>",
  GSI4SK: "COMP#<uuid>"
}
```

#### Vulnerability

```typescript
{
  PK: "VULN#<uuid>",
  SK: "VULN#<uuid>",
  entityType: "Vulnerability",
  vulnCveId: string,
  vulnSeverity: "Critical" | "High" | "Medium" | "Low",
  vulnAffectedComponent: string,
  vulnRemediationStatus: "Open" | "In Progress" | "Resolved",
  vulnResolvedDate: string,
  GSI4PK: "COMP#<complianceId>",
  GSI4SK: "VULN#<uuid>"
}
```

#### AuditLog

```typescript
{
  PK: "AUDIT#<uuid>",
  SK: "AUDIT#<uuid>",
  entityType: "AuditLog",
  action: "Created" | "Modified" | "Deleted",
  resourceType: string,
  resourceId: string,
  userId: string,
  ipAddress: string,
  timestamp: string,   // ISO8601
  status: "Success",
  ttl: number,         // Unix epoch for 90-day auto-expiry
  GSI1PK: "AUDIT_LOG",
  GSI1SK: "Success#<timestamp>",
  GSI2PK: "AUDIT_LOG",
  GSI2SK: "<timestamp>",
  GSI4PK: "USER#<userId>",
  GSI4SK: "AUDIT#<uuid>"
}
```

#### Customer

```typescript
{
  PK: "CUST#<uuid>",
  SK: "CUST#<uuid>",
  entityType: "Customer",
  name: string,
  subscriptionTier: string,
  GSI1PK: "CUSTOMER",
  GSI1SK: "<status>#<timestamp>"
}
```

#### User

```typescript
{
  PK: "USER#<uuid>",
  SK: "USER#<uuid>",
  entityType: "User",
  email: string,
  givenName: string,
  familyName: string,
  role: "Admin" | "Manager" | "Technician" | "Viewer" | "CustomerAdmin",
  department: string,
  customerId: string,
  preferences: { theme: string, language: string, timezone: string },
  GSI1PK: "USER",
  GSI1SK: "<role>#<timestamp>",
  GSI3PK: "<email>",
  GSI3SK: "USER#<uuid>"
}
```

---

## 5. AUTHENTICATION & AUTHORIZATION

### 5.1 Cognito User Pool Configuration

| Setting | Value | NIST Control |
|---------|-------|-------------|
| Password Min Length | 12 characters | IA-5 |
| Require Uppercase | Yes | IA-5 |
| Require Lowercase | Yes | IA-5 |
| Require Numbers | Yes | IA-5 |
| Require Symbols | Yes | IA-5 |
| MFA | Optional TOTP | IA-2 |
| Access Token Expiry | 15 minutes | AC-11 |
| ID Token Expiry | 15 minutes | AC-11 |
| Refresh Token Expiry | 7 days | AC-12 |
| Account Recovery | EMAIL_ONLY | — |

### 5.2 Custom User Attributes

- `custom:role` — RBAC role
- `custom:department` — organizational unit
- `custom:customerId` — tenant scoping

### 5.3 RBAC Groups & Permissions

| Group | Create | Read | Update | Delete | Approve Firmware | Advance Stages |
|-------|--------|------|--------|--------|-----------------|----------------|
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Manager** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Technician** | ❌ | ✅ | Own items | ❌ | ❌ | ❌ |
| **Viewer** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **CustomerAdmin** | ❌ | Own data | ❌ | ❌ | ❌ | ❌ |

### 5.4 Separation of Duties (NIST AC-5)

Enforced at the resolver level:
- **Firmware upload → Testing**: Uploader cannot be tester
- **Testing → Approved**: Tester cannot be approver
- **Direct approval**: Uploader cannot approve own firmware

---

## 6. API LAYER — AppSync GraphQL

### 6.1 Queries (24)

| Query | GSI / Index | Description |
|-------|-------------|-------------|
| `getDevice(id)` | Primary | Get device by ID |
| `listDevices(status?, limit?, nextToken?)` | GSI1 | List devices, optional status filter |
| `getDevicesByCustomer(customerId)` | Primary | Devices for a customer |
| `getDevicesByLocation(location)` | GSI3 | Devices at a location |
| `getFirmware(id)` | Primary | Get firmware by ID |
| `listFirmware(status?, limit?, nextToken?)` | GSI1 | List firmware packages |
| `getFirmwareByModel(deviceModel)` | GSI3 | Firmware for a device model |
| `getFirmwareWithRelations(id)` | Primary | Firmware + related entities |
| `getServiceOrder(id)` | Primary | Get service order by ID |
| `listServiceOrdersByStatus(status)` | GSI1 | Service orders by status |
| `listServiceOrdersByDate(startDate, endDate)` | GSI2 | Service orders in date range |
| `getServiceOrdersByTechnician(technicianId)` | GSI3 | Orders for a technician |
| `getCompliance(id)` | Primary | Get compliance record |
| `listComplianceByStatus(status)` | GSI1 | Compliance items by status |
| `getComplianceByCertification(certification)` | GSI3 | Items by certification type |
| `listAuditLogs(startDate, endDate, limit?, nextToken?)` | GSI2 | Audit logs in date range (Admin/Manager only) |
| `getAuditLogsByUser(userId)` | GSI4 | Audit trail for a user (Admin/Manager only) |
| `getUserByEmail(email)` | GSI3 | User lookup by email |
| `listUsersByRole(role)` | GSI1 | Users filtered by role (Admin/Manager only) |
| `getCustomerWithRelations(customerId)` | Primary | Customer + child entities |
| `listVulnerabilitiesByCompliance(complianceId)` | GSI4 | Vulnerabilities for a compliance item |
| `searchGlobal(query, entityTypes?, limit?)` | OpenSearch | Full-text search across all entity types |
| `searchDevices(query, filters?)` | OpenSearch | Advanced device search with fuzzy matching |
| `searchVulnerabilities(query, severity?)` | OpenSearch | CVE search across descriptions and components |
| `getAggregations(metric, timeRange?)` | OpenSearch | Server-side aggregations for analytics |

### 6.2 Mutations (9)

| Mutation | Description | Authorization |
|----------|-------------|---------------|
| `createDevice(...)` | Create device with auto-computed GSI keys | Admin, Manager |
| `createFirmware(...)` | Create firmware (auto-sets approvalStage="Uploaded") | Admin, Manager |
| `createServiceOrder(...)` | Create service order | Admin, Manager |
| `createCompliance(...)` | Create compliance record | Admin, Manager |
| `createVulnerability(...)` | Create vulnerability record | Admin, Manager |
| `updateEntityStatus(entityType, id, newStatus)` | Generic status update (recomputes GSI1SK) | Admin, Manager |
| `approveFirmware(firmwareId, approvedBy)` | Approve firmware with SoD enforcement | Admin only |
| `advanceFirmwareStage(firmwareId, targetStage, performedBy)` | Multi-stage approval (Testing/Approved) with SoD | Admin, Manager |
| `updateVulnerabilityStatus(vulnerabilityId, remediationStatus)` | Update vulnerability remediation status | Admin, Manager |

### 6.3 Resolver Logic (15 JavaScript Resolvers)

| Resolver | Type | Logic |
|----------|------|-------|
| `getEntity.js` | Query | Maps field name to PK prefix (e.g., getDevice → DEV#), strips prefix from returned ID |
| `listByGSI1.js` | Query | Queries GSI1PK = entity type, optional `begins_with(GSI1SK, "<status>#")`, paginated (default 25) |
| `queryByGSI2.js` | Query | Queries GSI2PK = entity type, `GSI2SK BETWEEN startDate AND endDate` |
| `queryByGSI3.js` | Query | Maps field name to lookup prefix (location, model, technician, certification, email) |
| `queryByGSI4.js` | Query | Maps field name to parent PK format (USER#, COMP#), filters by SK prefix |
| `queryByPK.js` | Query | Queries main table PK with optional SK prefix filter |
| `createEntity.js` | Mutation | Polymorphic factory: generates ID, sets entityType discriminator, computes all GSI keys based on entity type |
| `updateStatus.js` | Mutation | Updates `status` field, recomputes `GSI1SK` as `<newStatus>#<now>`, optional `updatedBy` |
| `approveFirmware.js` | Mutation | Sets status="Approved", records approvedBy/Date, **conditional check**: uploader ≠ approver |
| `advanceFirmwareStage.js` | Mutation | Two valid targets: "Testing" (uploader ≠ tester) and "Approved" (tester ≠ approver AND must be in Testing stage) |
| `updateVulnerabilityStatus.js` | Mutation | Updates vulnRemediationStatus, auto-sets vulnResolvedDate if status="Resolved" |
| `searchGlobal.js` | Query (OpenSearch) | Multi-match full-text search across all entity types via HTTP data source |
| `searchDevices.js` | Query (OpenSearch) | Device-scoped search with fuzzy matching and optional filters |
| `searchVulnerabilities.js` | Query (OpenSearch) | Vulnerability search on CVE IDs, descriptions, components |
| `getAggregations.js` | Query (OpenSearch) | Returns server-side aggregations (terms, date_histogram, histogram) for analytics |

---

## 7. S3 FIRMWARE STORAGE

| Setting | Value | NIST Control |
|---------|-------|-------------|
| Bucket Name | `FirmwareBucket` | — |
| Encryption | KMS-managed | SC-28 |
| Versioning | Enabled | — |
| Public Access | Block ALL | SC-7 |
| SSL Enforcement | Yes (bucket policy) | SC-7 |
| Object Lock | Enabled (WORM) | SI-7 |
| Lifecycle | Archive to Glacier after 365 days | — |
| Deletion Policy | RETAIN (prevent accidental deletion) | — |

---

## 8. LAMBDA — AUDIT STREAM PROCESSOR

### Function Specification

| Setting | Value |
|---------|-------|
| Trigger | DynamoDB Streams (DataTable) |
| Runtime | Node.js 20.x |
| Batch Size | 25 records |
| Retry Attempts | 3 |
| Starting Position | TRIM_HORIZON |
| Log Retention | 90 days (NIST AU-12) |

### Processing Logic

On each DynamoDB Stream event (INSERT, MODIFY, DELETE):
1. Extract entity type and ID from event keys
2. Generate `AUDIT#<uuid>` record with:
   - `action`: "Created" | "Modified" | "Deleted"
   - `resourceType` + `resourceId` (from event PK)
   - `timestamp`: ISO8601 now
   - `GSI1PK`: "AUDIT_LOG", `GSI1SK`: "Success#\<timestamp>"
   - `GSI2PK`: "AUDIT_LOG", `GSI2SK`: "\<timestamp>"
3. Write audit record back to DataTable (PutItem)

---

## 9. OPENSEARCH SERVERLESS — SEARCH & AGGREGATIONS

### 9.1 Purpose

DynamoDB GSI queries support structured lookups (by status, date range, attribute) but cannot provide:
- **Full-text search** across multiple fields simultaneously (fuzzy, partial, typeahead)
- **Cross-entity search** — find everything related to a keyword across all 8 entity types
- **Server-side aggregations** — counts, averages, histograms, date distributions without client-side computation
- **Geospatial queries** — find devices within a radius, aggregate by geographic region

OpenSearch Serverless provides these capabilities with a pay-per-use model that aligns with the platform's PAY_PER_REQUEST DynamoDB billing.

### 9.2 Architecture

```
DynamoDB (DataTable)
    │
    ├── Streams (NEW_AND_OLD_IMAGES — already enabled)
    │
    ▼
OpenSearch Ingestion Pipeline (OSIS)
    │  ├── Initial load: DynamoDB Export → S3 → OSIS
    │  └── Ongoing sync: DynamoDB Streams → OSIS
    ▼
OpenSearch Serverless Collection ("ims-gen2-search")
    │  ├── Encryption policy (aws/opensearchserverless)
    │  ├── Network policy (public or VPC endpoint)
    │  └── Data access policy (AppSync role + OSIS pipeline role)
    ▼
AppSync HTTP DataSource (IAM-signed, service: "aoss")
    │
    ▼
Custom Search Resolvers → React Frontend
```

### 9.3 Why Serverless Over Managed Domain

| Factor | Managed Domain | Serverless |
|--------|---------------|------------|
| Cluster management | Required (instance types, nodes, storage) | None — fully managed |
| Scaling | Manual or auto-scaling policies | Automatic (OCU-based) |
| Cost model | Instance-hours (always running) | Pay-per-use (OCUs) |
| Minimum cost | ~$27/mo (t3.small.search) | ~$350/mo (2 OCU minimum when active) |
| Dev/staging recommendation | Use managed t3.small.search for cost savings | Use for production |
| Alignment with IMS-Gen2 | — | Matches PAY_PER_REQUEST philosophy |

**Recommendation:** Use managed domain (t3.small.search) for dev/staging environments and OpenSearch Serverless for production via Terraform `tfvars` per environment.

### 9.4 Single-Table Advantage

Since IMS-Gen2 uses a **single DynamoDB table** with all 8 entity types, only **one OSIS pipeline** is needed (OSIS supports one table per pipeline). All entity types are automatically indexed, and the `entityType` discriminator field enables filtered search per type.

### 9.5 Index Mapping

All 8 entity types are indexed into a single OpenSearch index (`ims-data`) with dynamic mapping. Key field configurations:

| Field | OpenSearch Type | Purpose |
|-------|----------------|---------|
| `entityType` | `keyword` | Filter results by entity type |
| `deviceName`, `name`, `title` | `text` + `keyword` subfield | Full-text search + exact match |
| `serialNumber`, `vulnCveId` | `keyword` | Exact match lookups |
| `description`, `vulnAffectedComponent` | `text` | Full-text search |
| `status`, `vulnSeverity`, `approvalStage` | `keyword` | Faceted filtering |
| `location` | `text` + `keyword` subfield | Full-text + exact match |
| `lat`, `lng` | `geo_point` (combined) | Geospatial queries |
| `createdAt`, `timestamp`, `scheduledDate` | `date` | Date range queries + date_histogram aggregations |
| `healthScore`, `vulnerabilityCount` | `float` / `integer` | Range queries + numeric aggregations |

### 9.6 AppSync Search Queries (4 New Queries)

| Query | Arguments | Returns | Use Case |
|-------|-----------|---------|----------|
| `searchGlobal(query, entityTypes?, limit?)` | Free-text query, optional entity type filter | `[SearchResult]` | Global search bar — search across all entity types |
| `searchDevices(query, filters?)` | Free-text + optional status/location/model filters | `[Device]` | Advanced device search with fuzzy matching |
| `searchVulnerabilities(query, severity?)` | Free-text + optional severity filter | `[Vulnerability]` | CVE search across descriptions and components |
| `getAggregations(metric, timeRange?)` | Metric name (e.g., "devicesByStatus"), time range | `AggregationResult` | Server-side analytics for charts and KPIs |

### 9.7 Search Resolver Pattern

Resolvers use AppSync HTTP data source with IAM signing for `aoss` service:

```javascript
// searchGlobalResolver.js
import { util } from "@aws-appsync/utils";

export function request(ctx) {
  const { query, entityTypes, limit } = ctx.args;
  const body = {
    from: 0,
    size: limit || 25,
    query: {
      bool: {
        must: [{ multi_match: { query, fields: ["deviceName", "name", "title", "serialNumber", "vulnCveId", "location", "email", "*"], fuzziness: "AUTO" } }],
        ...(entityTypes && { filter: [{ terms: { "entityType.keyword": entityTypes } }] })
      }
    },
    highlight: { fields: { "*": {} } }
  };

  return {
    version: "2018-05-29",
    method: "POST",
    params: {
      headers: { "Content-Type": "application/json" },
      body
    },
    resourcePath: "/ims-data/_search"
  };
}

export function response(ctx) {
  if (ctx.result.statusCode === 200) {
    return JSON.parse(ctx.result.body).hits.hits.map((hit) => ({
      ...hit._source,
      _score: hit._score,
      _highlights: hit.highlight
    }));
  }
  util.error("Search failed", "OpenSearchError");
}
```

### 9.8 Aggregation Resolver Pattern

```javascript
// getAggregationsResolver.js
import { util } from "@aws-appsync/utils";

export function request(ctx) {
  const { metric, timeRange } = ctx.args;

  const aggregations = {
    devicesByStatus: {
      filter: { term: { "entityType.keyword": "Device" } },
      aggs: { statuses: { terms: { field: "status.keyword" } } }
    },
    complianceByStatus: {
      filter: { term: { "entityType.keyword": "Compliance" } },
      aggs: { statuses: { terms: { field: "status.keyword" } } }
    },
    deploymentTrend: {
      filter: { term: { "entityType.keyword": "Firmware" } },
      aggs: { trend: { date_histogram: { field: "releaseDate", calendar_interval: "week" } } }
    },
    topVulnerabilities: {
      filter: { term: { "entityType.keyword": "Vulnerability" } },
      aggs: { severity: { terms: { field: "vulnSeverity.keyword", size: 10 } } }
    },
    healthScoreDistribution: {
      filter: { term: { "entityType.keyword": "Device" } },
      aggs: { scores: { histogram: { field: "healthScore", interval: 10 } } }
    }
  };

  return {
    version: "2018-05-29",
    method: "POST",
    params: {
      headers: { "Content-Type": "application/json" },
      body: { size: 0, aggs: { [metric]: aggregations[metric] } }
    },
    resourcePath: "/ims-data/_search"
  };
}

export function response(ctx) {
  if (ctx.result.statusCode === 200) {
    return JSON.parse(ctx.result.body).aggregations;
  }
  util.error("Aggregation failed", "OpenSearchError");
}
```

### 9.9 Geospatial Query Support (Epic 13 Enabler)

OpenSearch indexes `lat` and `lng` as a `geo_point`, enabling:

| Query Type | Use Case |
|------------|----------|
| `geo_distance` | Find devices within N km of a point (blast radius) |
| `geo_bounding_box` | Devices within a map viewport |
| `geohash_grid` aggregation | Aggregate device counts by geographic tile (heatmaps) |
| `geo_centroid` aggregation | Find center point of device clusters |

### 9.10 Feature Applicability by Epic

| Epic | OpenSearch Feature Used |
|------|----------------------|
| **Current (Global Search)** | Full-text `multi_match` across all entity types |
| **Epic 10 (Location Service)** | `geo_distance`, `geo_bounding_box` queries |
| **Epic 12 (SBOM)** | Full-text search on CVE descriptions, component names, license text |
| **Epic 13 (Heatmaps)** | `geohash_grid` + `geo_centroid` aggregations |
| **Epic 14 (Incidents)** | `geo_distance` for lateral movement radius, affected device queries |
| **Epic 15 (Digital Twin)** | Aggregations for health scoring, historical state queries |
| **Epic 16 (KPI Dashboards)** | `terms`, `date_histogram`, `avg`, `sum` aggregations replace client-side computation |

---

## 10. FRONTEND APPLICATION

### 10.1 Routing Structure

| Route | Component | Auth Required | Description |
|-------|-----------|---------------|-------------|
| `/login` | `sign-in.tsx` | No | Cognito authentication (email/password + MFA) |
| `/` | `dashboard.tsx` | Yes | Executive overview with KPIs |
| `/inventory` | `inventory.tsx` | Yes | Device management + Geo Location |
| `/account-service` | `account-service.tsx` | Yes | Service orders (Kanban + Calendar) |
| `/deployment` | `deployment.tsx` | Yes | Firmware management + Audit logs |
| `/compliance` | `compliance.tsx` | Yes | Compliance + Vulnerability tracking |
| `/analytics` | `analytics.tsx` | Yes | Charts, reports, analytics |

All authenticated routes are wrapped in `ProtectedLayout` (redirects to `/login` if not authenticated).

### 10.2 Feature Modules

#### Global Search Bar (Header — all pages)
- Persistent in header, triggered by click or `Cmd+K` / `Ctrl+K` keyboard shortcut
- Opens Command Palette dialog (shadcn Command component)
- Powered by OpenSearch `searchGlobal` query
- Input: free-text with 300ms debounce
- Results grouped by entity type: Devices | Firmware | Service Orders | Compliance | Vulnerabilities
- Each result: icon + title + subtitle + entity badge
- Click result → navigate to entity detail
- Empty state: "No results found" with search suggestions
- Recent searches: stored in localStorage (last 5)

#### Dashboard
- 4 KPI cards (compact): Total Devices, Active Deployments, Pending Approvals, Health Score
- 6 Quick Action links with badge counts for pending items
- Recent alerts panel (last 24hr audit logs, links to source entities)
- System status indicators (4 services: Deployment, Compliance, Asset DB, Analytics)
- Parallel data fetching on mount with refresh button
- **Notification bell** in header with unread count badge → slide-out panel (see Section 10.8)

#### Inventory & Assets (3 tabs)
- **Hardware Inventory Tab:** Searchable table (device name, serial, customer), multi-filter (status, location, model, customer), pagination (6 items/page), CSV export
- **Firmware Status Tab:** Grid view of devices with firmware version and color-coded health score bars
- **Geo Location Tab:** Interactive world map with device markers, status filter pills, coordinates from device lat/lng

#### Account & Service
- **Kanban View:** 3-column drag-and-drop board (react-dnd + HTML5 backend)
  - Columns: `Scheduled` → `In Progress` → `Completed`
  - Cards show: title, technician name, date, priority badge (color-coded), service type tag
  - Drag card between columns → triggers `updateEntityStatus` mutation (optimistic UI update)
  - Empty column placeholder: "No orders in this stage"
- **Calendar View:** Monthly calendar grid
  - Service order events rendered as colored dots/blocks on scheduled dates
  - Click date → shows orders for that day in popover
  - Navigation: previous/next month arrows + today button
  - Priority color coding: High=red, Medium=amber, Low=green
- **View Toggle:** Switch between Kanban and Calendar via segmented control
- **Create Service Order modal:** title, technician (dropdown), service type (Internal/3rd Party), location, date picker, time picker, priority (High/Medium/Low)
- **Filters:** Status, priority, technician, date range
- **CSV export** of filtered results

#### Deployment / Firmware
- **Firmware Tab:** Cards with approval stage indicator (Uploaded → Testing → Approved), approve/deprecate action buttons, upload firmware modal with form validation
- **Audit Log Tab:** 30-day audit trail, columns (User, Action, Firmware, Timestamp, IP, Status), search filter, CSV export

#### Compliance
- Compliance items list with 3 status filters (Approved/Pending/Deprecated)
- Filter by certification type, device model, vulnerability threshold
- Submit for review modal (firmware version, device model, certifications)
- Vulnerability panel: CVE list with severity, affected components, remediation status
- Regulatory readiness report dialog: generates exportable CSV/JSON compliance reports
- Approve/deprecate compliance items

#### Analytics
- 5 KPI cards (total devices, online, active deployments, pending approvals, health score)
- Pie charts: device status distribution, compliance status
- Line/bar charts: weekly deployment trend, top vulnerabilities
- Time range filter (7d, 30d, 90d)
- Audit log table with export

### 10.3 Client-Side Architecture

#### State Management

| Layer | Pattern | Implementation |
|-------|---------|---------------|
| **Authentication** | React Context (`AuthProvider`) | Manages `user`, `email`, `groups[]`, `isAuthenticated`, `isLoading`, `customerId` |
| **Page data** | Local `useState` + `useEffect` per page | No centralized store — each page fetches on mount |
| **Data fetching** | `Promise.all()` parallel queries | Dashboard fetches 4 queries in parallel on mount |
| **Caching** | None currently | Future: React Query or SWR for stale-while-revalidate |
| **Notifications** | Context + WebSocket subscription | Real-time unread count in header badge |
| **Theme** | `next-themes` with localStorage | Persisted light/dark preference |
| **Sidebar** | localStorage | Persisted collapsed/expanded state |

#### Library Modules (`src/lib/`)

| Module | Purpose | Key Exports |
|--------|---------|-------------|
| `auth-context.tsx` | React Context provider for Cognito auth | `AuthProvider`, `AuthContext` |
| `auth-context-instance.ts` | Singleton to avoid circular imports | `authContextInstance` |
| `use-auth.ts` | Custom hook | `useAuth()` → `{ user, email, groups, isAuthenticated, isLoading, signOut }` |
| `hlm-api.ts` | AppSync GraphQL client | 13 query wrappers, 6 mutation wrappers, 5 entity mappers, `parseItems()` |
| `location-coords.ts` | Geo-coordinate resolution | Client-side fallback when device `lat`/`lng` not provided — resolves from location string |
| `report-generator.ts` | Report export utilities | `generateCSV()`, `generateJSON()`, `generateRegulatoryReport()` |
| `utils.ts` | Shared utilities | `cn()` (classname merger for Tailwind), date formatters |

#### Frontend API Client (`hlm-api.ts`) — Detailed

```
AppSync GraphQL Endpoint (Cognito JWT)
    │
    ▼
hlm-api.ts
    ├── Interfaces: Device, Firmware, ServiceOrder, Compliance,
    │   Vulnerability, AuditLog, Customer, User
    │
    ├── Query Wrappers (13):
    │   ├── getDevice(id) → Device
    │   ├── listDevices(status?, limit?) → Device[]
    │   ├── getDevicesByLocation(location) → Device[]
    │   ├── listFirmware(status?) → Firmware[]
    │   ├── listServiceOrders(status?) → ServiceOrder[]
    │   ├── listServiceOrdersByDate(start, end) → ServiceOrder[]
    │   ├── listComplianceByStatus(status) → Compliance[]
    │   ├── listAuditLogs(start, end) → AuditLog[]
    │   ├── getUserByEmail(email) → User
    │   ├── searchGlobal(query, entityTypes?) → SearchResult[]      [OpenSearch]
    │   ├── searchDevices(query, filters?) → Device[]               [OpenSearch]
    │   ├── searchVulnerabilities(query, severity?) → Vulnerability[] [OpenSearch]
    │   └── getAggregations(metric, timeRange?) → AggregationResult  [OpenSearch]
    │
    ├── Mutation Wrappers (6):
    │   ├── createDevice(input) → Device
    │   ├── createFirmware(input) → Firmware
    │   ├── createServiceOrder(input) → ServiceOrder
    │   ├── createCompliance(input) → Compliance
    │   ├── updateEntityStatus(entityType, id, status) → Entity
    │   └── advanceFirmwareStage(id, stage, performedBy) → Firmware
    │
    └── Mappers (5):
        ├── mapDevice(item) — strips PK/SK prefixes, computes derived fields
        ├── mapFirmware(item)
        ├── mapServiceOrder(item)
        ├── mapCompliance(item)
        └── mapAuditLog(item)
```

#### Data Fetching Patterns

```typescript
// Pattern: Parallel fetch on page mount
useEffect(() => {
  const loadData = async () => {
    setLoading(true);
    try {
      const [devices, firmware, compliance] = await Promise.all([
        listDevices(),
        listFirmware(),
        listComplianceByStatus("Approved")
      ]);
      setDevices(devices);
      setFirmware(firmware);
      setCompliance(compliance);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  loadData();
}, []);

// Pattern: Refresh on user action
const handleRefresh = () => loadData();

// Pattern: Optimistic update (Kanban drag)
const handleDragEnd = (orderId, newStatus) => {
  setOrders(prev => prev.map(o => o.id === orderId ? {...o, status: newStatus} : o));
  updateEntityStatus("ServiceOrder", orderId, newStatus); // fire and forget
};
```

### 10.4 Error Handling & Resilience

#### Frontend Error Boundaries

| Layer | Pattern | User Experience |
|-------|---------|----------------|
| **Route-level** | React Error Boundary wraps each page | "Something went wrong" with retry button; other pages remain functional |
| **Component-level** | Error boundary on Geo Map, Charts, Kanban | Fallback: "Unable to load [component]. Retry?" — page still usable |
| **API errors** | try/catch in data fetching hooks | Toast notification (Sonner) with error message + retry option |
| **Auth errors** | Token refresh failure → redirect to `/login` | "Session expired. Please sign in again." |
| **Network offline** | `navigator.onLine` detection | Banner: "You are offline. Some features may be unavailable." |

#### API Error Handling Strategy

| Error Type | HTTP/GraphQL | Handler | User Feedback |
|-----------|-------------|---------|---------------|
| **Validation** | 400 / GraphQL errors | Show field-level errors | Red border + message under input |
| **Unauthorized** | 401 | Redirect to login, clear auth context | "Session expired" toast |
| **Forbidden** | 403 / AppSync auth error | Show "Access Denied" message | "You don't have permission for this action" |
| **Not Found** | Item null | Show empty state | "No [entity] found" with suggestion |
| **Throttled** | 429 / DynamoDB throttle | Exponential backoff retry (3 attempts) | Transparent to user; loading spinner persists |
| **Server Error** | 500 | Log to console, show error toast | "Something went wrong. Please try again." |
| **Network Error** | No response | Retry with backoff; after 3 failures, show offline banner | "Unable to connect. Check your network." |

#### Graceful Degradation

| Feature | Degraded Behavior |
|---------|------------------|
| **OpenSearch down** | Fall back to DynamoDB GSI queries (less fuzzy, but functional) |
| **Geo map fails to load** | Show device list table instead of map |
| **WebSocket disconnects** | Notification bell falls back to 60s polling |
| **Chart library error** | Show raw data table instead of visualization |
| **CSV export fails** | Show copy-to-clipboard option as fallback |

### 10.5 UI Component Library

- **Base:** 45+ shadcn/ui components (Radix primitives) — dialogs, forms, tables, cards, badges, dropdowns, etc.
- **Custom:**
  - `ApprovalStageIndicator` — visual firmware approval workflow indicator
  - `VulnerabilityPanel` — CVE listing with severity and remediation management
  - `RegulatoryReportDialog` — compliance report generation (CSV/JSON)
  - `GeoLocationMap` — world map with device markers
  - `GlobalSearchBar` — full-text search across all entity types with typeahead and result grouping

### 10.6 Theming

- **Light Mode:** Background #f8f9fb, Primary #0f172a (deep navy), Accent #2563eb (blue)
- **Dark Mode:** Background #0f172a, Foreground #f1f5f9, Card #1e293b
- **Status Colors:** Success #10b981, Warning #f59e0b, Danger #ef4444
- **Toggle:** Sun/Moon icon in header (persisted via next-themes)
- **Responsive:** Mobile hamburger menu, stacked grids on small screens

### 10.7 Enterprise UI/UX Design Direction

**Reference:** [Sungrow Power](https://www.sungrowpower.com/en) — the platform must project enterprise authority, not a generic SaaS/AI aesthetic.

#### Design Principles

| # | Principle | Implementation |
|---|-----------|---------------|
| 1 | **Color restraint** | Single accent color (navy #0f172a + blue #2563eb), neutral backgrounds, NO gradients or multi-color splashes |
| 2 | **Space-efficient layout** | Compact data tables, dense but readable. No oversized hero cards or excessive padding. Maximize information density per viewport. |
| 3 | **Collapsible sidebar navigation** | Hide/show toggle, icon-only collapsed state, full labels on expand. Persisted preference via localStorage. |
| 4 | **Notification panel** | Bell icon in header with unread badge count, slide-out panel showing alerts/audit events, mark-as-read, link to source entity. |
| 5 | **Professional typography** | Clean sans-serif (Inter), measured hierarchy, no playful or rounded fonts |
| 6 | **Data-first design** | Tables and status badges are primary. Cards only where they add value (KPI summary, firmware stage), kept compact. |
| 7 | **Subtle interactions** | No bouncy animations, no confetti, no AI sparkle icons. Smooth 150-200ms transitions, purposeful hover states. |
| 8 | **Authority signals** | Device count statistics, NIST compliance badges, approval workflow indicators displayed prominently. |
| 9 | **Enterprise navigation** | Breadcrumbs on all sub-pages, contextual tabs, keyboard shortcuts, command palette (Cmd+K). |
| 10 | **Zero decoration** | No stock illustrations, gradient blobs, or decorative SVGs. Every pixel serves an information purpose. |

#### Navigation Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ [≡] Logo          Global Search [🔍]     [🔔 3] [👤] [☀/🌙] │  ← Fixed header
├──────┬──────────────────────────────────────────────────────┤
│ [📊] │                                                      │
│ [📦] │  Breadcrumb: Dashboard > Inventory > Geo Location    │
│ [🚀] │                                                      │
│ [🔒] │  ┌─────────────────────────────────────────────────┐ │
│ [📋] │  │              PAGE CONTENT                        │ │
│ [📈] │  │  Data tables, charts, forms, maps               │ │
│ [⚙️] │  │  Maximum use of horizontal + vertical space     │ │
│      │  └─────────────────────────────────────────────────┘ │
│ [◀]  │                                                      │  ← Collapse toggle
└──────┴──────────────────────────────────────────────────────┘
```

- **Collapsed sidebar** (default): 56px wide, icon-only, tooltip on hover
- **Expanded sidebar**: 240px wide, icon + label, section grouping
- **Header**: Fixed, 48px height, contains: logo, global search bar, notification bell with badge, user avatar dropdown, theme toggle
- **Notification panel**: Slide-out from right on bell click, 360px wide, shows recent alerts/audit events with severity badges

#### What NOT to Do

| Anti-pattern | Why it fails for enterprise |
|-------------|---------------------------|
| Large hero cards with icons | Wastes viewport; users need data density, not decoration |
| Gradient backgrounds | Reads as consumer/SaaS, not industrial |
| Rounded bubbly components | Feels playful, not authoritative |
| AI sparkle/magic wand icons | IMS is a compliance platform, not a chatbot |
| Full-width sidebar always visible | Wastes 20% of screen; enterprise users want max content area |
| Excessive whitespace between sections | Sungrow uses 60-120px; SaaS apps often use 200px+ which kills density |
| Decorative illustrations | Replace with real data visualizations or remove entirely |

### 10.8 Notification System

#### Architecture

```
DynamoDB Streams (all entity changes)
    │
    ▼
Lambda Audit Processor (existing)
    │
    ├── Writes AUDIT# record to DynamoDB (existing)
    └── Writes NOTIFICATION# record to DynamoDB (NEW)
            │
            ▼
AppSync Subscription (real-time) → Frontend WebSocket
            │
            ▼
Notification Bell → Badge Count → Slide-out Panel
```

#### Notification Entity

```typescript
{
  PK: "NOTIF#<uuid>",
  SK: "NOTIF#<uuid>",
  entityType: "Notification",
  recipientId: string,        // USER#<id> — who receives this
  type: "firmware_approved" | "firmware_stage_advanced" | "service_order_assigned" |
        "service_order_completed" | "vulnerability_critical" | "compliance_status_changed" |
        "device_offline" | "system_alert",
  title: string,              // "Firmware v3.2.1 Approved"
  message: string,            // "SG-3600 firmware approved by Sarah Chen"
  severity: "info" | "warning" | "critical",
  sourceEntityType: string,   // "Firmware", "ServiceOrder", etc.
  sourceEntityId: string,     // PK of source entity for deep linking
  read: boolean,              // false by default
  readAt: string,             // ISO8601, set when user marks as read
  createdAt: string,          // ISO8601
  ttl: number,                // 30-day auto-expiry
  GSI1PK: "NOTIFICATION",
  GSI1SK: "<read|unread>#<timestamp>",
  GSI4PK: "USER#<recipientId>",
  GSI4SK: "NOTIF#<uuid>"
}
```

#### Notification Types & Recipients

| Event | Notification Type | Recipients | Severity |
|-------|------------------|-----------|----------|
| Firmware approved | `firmware_approved` | All Managers + uploading Technician | info |
| Firmware stage advanced | `firmware_stage_advanced` | Admin + Managers | info |
| Service order assigned | `service_order_assigned` | Assigned Technician | info |
| Service order completed | `service_order_completed` | Assigning Manager | info |
| Critical vulnerability found | `vulnerability_critical` | Admin + Managers | critical |
| Compliance status changed | `compliance_status_changed` | Admin + Managers | warning |
| Device goes offline | `device_offline` | Admin + Managers + CustomerAdmin (own devices) | warning |
| Nightly E2E failure | `system_alert` | Admin | critical |

#### UI Specification

```
┌──────────────────────────────────────────────────────────┐
│ [≡] Logo      Search [🔍]          [🔔 3] [👤 Gaurav] [☀] │
└──────────────────────────────────┬───────────────────────┘
                                   │ Click 🔔
                                   ▼
                    ┌─────────────────────────┐
                    │ Notifications        ✓ All │
                    │─────────────────────────│
                    │ 🔴 CRITICAL              │
                    │ CVE-2026-1234 found      │
                    │ Affects OpenSSL 3.1       │
                    │ 2 min ago                 │
                    │─────────────────────────│
                    │ 🟡 WARNING               │
                    │ Device SG-3600-042        │
                    │ went offline              │
                    │ 15 min ago                │
                    │─────────────────────────│
                    │ 🔵 INFO                  │
                    │ FW v3.2.1 approved        │
                    │ by Sarah Chen             │
                    │ 1 hr ago                  │
                    │─────────────────────────│
                    │       View All →          │
                    └─────────────────────────┘
```

- **Panel width:** 360px, slide-out from right (Sheet component)
- **Badge:** Red circle with unread count (max "99+"), hidden when 0
- **Items:** Severity icon + title + message + relative timestamp
- **Click item:** Navigate to source entity (deep link via `sourceEntityType` + `sourceEntityId`)
- **Mark as read:** Click item or "Mark all as read" button
- **Polling:** AppSync subscription for real-time; fallback to 60s polling if WebSocket disconnects
- **Persistence:** Unread state persisted in DynamoDB, not localStorage

#### API Additions

| Operation | Type | Description |
|-----------|------|-------------|
| `listNotifications(userId, unreadOnly?, limit?)` | Query (GSI4) | Get notifications for a user |
| `markNotificationRead(notificationId)` | Mutation | Set `read: true`, `readAt: now` |
| `markAllNotificationsRead(userId)` | Mutation | Bulk update all unread for user |
| `getUnreadCount(userId)` | Query (GSI4 + filter) | Count for badge display |
| `onNotificationCreated(recipientId)` | Subscription | Real-time push via WebSocket |

---

## 11. COMPLIANCE & SECURITY CONTROLS

### 11.1 NIST 800-53 Controls

| Control | Description | Implementation |
|---------|------------|----------------|
| **AC-3** | Access Enforcement | Cognito RBAC groups on AppSync operations |
| **AC-5** | Separation of Duties | Firmware approval: uploader ≠ tester ≠ approver (enforced in resolvers) |
| **AC-11** | Session Lock | 15-minute access/ID token expiry |
| **AC-12** | Session Termination | Auto-expire via token refresh lifecycle |
| **AU-12** | Audit Generation | DynamoDB Streams → Lambda → AuditLog records (automatic) |
| **CP-9** | System Backup | DynamoDB Point-in-Time Recovery enabled |
| **IA-2** | MFA | Optional TOTP via Cognito |
| **IA-5** | Authenticator Management | 12-char password, upper/lower/number/symbol |
| **SC-7** | Boundary Protection | S3 public access blocked, SSL enforced, WAF on AppSync + CloudFront |
| **SC-28** | Protection at Rest | KMS encryption on DynamoDB + S3 |
| **SI-7** | Software Integrity | S3 Object Lock (WORM) for firmware binaries |

### 11.2 Compliance Validation Pipeline

- 7 automated validators: AppSync, CloudWatch, Cognito, DynamoDB, IAM, Lambda, S3
- Outputs: SARIF (for GitHub Code Scanning integration) + JSON artifacts
- Run via: `npm run compliance:validate`
- CI: GitHub Actions runs on every push/PR with 90-day artifact retention

---

## 11A. NON-FUNCTIONAL REQUIREMENTS

### 11A.1 Performance Budgets

| Metric | Target | Measurement |
|--------|--------|-------------|
| **First Contentful Paint (FCP)** | < 1.5s | Lighthouse on 4G throttled |
| **Largest Contentful Paint (LCP)** | < 2.5s | Lighthouse on 4G throttled |
| **Time to Interactive (TTI)** | < 3.5s | Lighthouse on 4G throttled |
| **Cumulative Layout Shift (CLS)** | < 0.1 | Lighthouse |
| **Bundle size (gzipped)** | < 500KB initial, < 200KB per route chunk | Vite build output |
| **API response (AppSync → DynamoDB)** | < 200ms p95 | CloudWatch AppSync latency metric |
| **API response (AppSync → OpenSearch)** | < 300ms p95 | CloudWatch custom metric |
| **Search autocomplete** | < 150ms perceived | Client-side debounce (300ms) + API response |
| **Page navigation** | < 100ms (client-side routing) | React Router SPA transition |
| **Data table render** | < 500ms for 100 rows | React profiler |
| **Map render (Geo Location)** | < 2s with 1,000 markers | react-simple-maps + marker clustering |

### 11A.2 Availability & Reliability

| Metric | Target | How Achieved |
|--------|--------|-------------|
| **Uptime** | 99.9% (8.7 hrs/year downtime) | AWS managed services (AppSync, DynamoDB, Cognito, CloudFront) |
| **RTO (Recovery Time Objective)** | < 1 hour | DynamoDB PITR + Terraform redeploy |
| **RPO (Recovery Point Objective)** | < 5 minutes | DynamoDB continuous backups (PITR) |
| **DynamoDB read capacity** | On-demand (auto-scaling) | PAY_PER_REQUEST billing mode |
| **DynamoDB write capacity** | On-demand (auto-scaling) | PAY_PER_REQUEST billing mode |
| **CloudFront cache hit ratio** | > 90% for static assets | Cache-Control headers, SPA routing |
| **Lambda cold start** | < 500ms | Node.js 20.x, minimal dependencies |

### 11A.3 Scalability Targets

| Dimension | Current (POC) | Target (Production) |
|-----------|--------------|-------------------|
| **Concurrent users** | 5-10 | 500 |
| **Total devices** | ~100 (seed data) | 50,000 |
| **Firmware packages** | ~10 | 500 |
| **Audit log records** | ~1,000 | 10M+ (90-day rolling) |
| **Service orders/month** | ~50 | 5,000 |
| **OpenSearch index size** | < 1GB | < 50GB |
| **API requests/second** | < 10 | 500 (AppSync default burst) |

### 11A.4 Browser Support Matrix

| Browser | Minimum Version | Priority |
|---------|----------------|----------|
| Chrome / Edge (Chromium) | Last 2 major versions | Primary |
| Firefox | Last 2 major versions | Primary |
| Safari / WebKit | Last 2 major versions | Secondary |
| Mobile Chrome (Android) | Last 2 versions | Secondary |
| Mobile Safari (iOS) | Last 2 versions | Secondary |
| Internet Explorer | Not supported | — |

### 11A.5 Accessibility (WCAG 2.1 Level AA)

| Requirement | Implementation |
|-------------|---------------|
| **Keyboard navigation** | All interactive elements focusable, logical tab order, skip-to-content link |
| **Screen reader support** | Semantic HTML, ARIA labels on custom components (Radix primitives have built-in ARIA) |
| **Color contrast** | Minimum 4.5:1 for text, 3:1 for large text — verified against both light and dark themes |
| **Focus indicators** | Visible focus ring on all interactive elements (2px solid accent color) |
| **Form labels** | All inputs have associated `<label>` elements or `aria-label` |
| **Error identification** | Form validation errors announced to screen readers, associated with input via `aria-describedby` |
| **Responsive text** | Supports 200% browser zoom without horizontal scroll |
| **Motion sensitivity** | Respect `prefers-reduced-motion` — disable transitions and animations |
| **Data tables** | Proper `<th>` scope, sortable column announcements, pagination status |

### 11A.6 Internationalization Readiness

| Aspect | Current State | Architecture Decision |
|--------|--------------|---------------------|
| **UI language** | English only | All user-facing strings extracted to constants (not hardcoded in JSX) |
| **Date/time format** | ISO 8601 in DB, locale-aware in UI | Use `Intl.DateTimeFormat` for display |
| **Number format** | Standard | Use `Intl.NumberFormat` for display |
| **RTL support** | Not required | Tailwind CSS logical properties ready (`ps-`, `pe-` instead of `pl-`, `pr-`) |
| **Currency** | Not applicable | — |
| **Timezone** | UTC in DB, user timezone in UI | User `preferences.timezone` field exists in User entity |

### 11A.7 Security Requirements (Beyond NIST 800-53)

| Requirement | Implementation |
|-------------|---------------|
| **Content Security Policy (CSP)** | Strict CSP headers via CloudFront response headers policy |
| **CORS** | AppSync configured to accept requests only from CloudFront domain |
| **XSS prevention** | React JSX auto-escaping + CSP + no `dangerouslySetInnerHTML` |
| **CSRF protection** | Not applicable (JWT-based auth, no cookies for API calls) |
| **Rate limiting** | WAF v2 rate-based rule: 2,000 requests/5 minutes per IP |
| **Input validation** | AppSync schema validates types; resolver-level validation for business rules |
| **Dependency scanning** | `npm audit` in CI pipeline; Dependabot alerts enabled |
| **Secret management** | No secrets in code; environment variables via GitHub Secrets → Terraform variables |
| **Audit immutability** | Audit logs in DynamoDB with no delete resolver; TTL handles expiry |

---

## 12. FEATURE EPICS ROADMAP

### Completed (Epics 1–9)

| Epic | Title | Status |
|------|-------|--------|
| 1–8 | Core Platform (Inventory, Deployment, Compliance, Account Service, Dashboard, Analytics, Auth) | ✅ Complete |
| 9 | Geo-Location Formalization (device lat/lng, world map) | ✅ Complete |

### Planned (Epics 10–18)

| Epic | Title | Status | Key Deliverables |
|------|-------|--------|------------------|
| **10** | Amazon Location Service | Approved | MapLibre GL JS maps, Places API geocoding, geofencing, device tracking |
| **11** | Aegis Phase 1 (Firmware Security) | Awaiting Approval | Multi-stage approval (Uploaded→Testing→Approved), vulnerability tracking, regulatory reports |
| **12** | SBOM & Supply Chain Security | Awaiting Approval | SBOM parsing (CycloneDX/SPDX), CVE matching, component explorer, license compliance |
| **13** | Environmental Heatmaps & Blast Radius | Awaiting Approval | Telemetry ingestion, heatmap visualization, blast radius engine, risk simulation |
| **14** | Incident Isolation & Lateral Movement | Awaiting Approval | Incident lifecycle, device isolation, network topology graph, quarantine zones, playbooks |
| **15** | Digital Twin | Awaiting Approval | Twin data model, health scoring, firmware simulation, config analysis, state replay |
| **16** | Dual-Theme UI, Connectivity & KPI | Awaiting Approval | Light/dark theme, connectivity monitoring, KPI dashboards, executive summary |
| **17** | Platform Infrastructure (Terraform) | Draft | WAF, Route53+ACM, CloudWatch dashboards, SNS alerts, budget alarms, CI pipeline |
| **18** | OpenSearch & Global Search | Draft | OpenSearch Serverless, OSIS pipeline, full-text search, aggregations, geo queries, GlobalSearchBar |

### Epic Dependencies

```
Epic 9 (Geo) ──► Epic 10 (Location Service) ──► Epic 13 (Heatmaps)
                                                      ▲
Epic 11 (Firmware Security) ──► Epic 12 (SBOM) ───────┤
        │                            │                 │
        ▼                            ▼                 ▼
   Epic 14 (Incidents) ────► Epic 15 (Digital Twin)
                                    │
                                    ▼
                              Epic 16 (Theme/KPI)

Epic 17 (Terraform) ← Independent, can start anytime

Epic 18 (OpenSearch) ← Depends on Epic 17 (Terraform provisions the collection)
                     ← Enables: Epic 12 (SBOM search), Epic 13 (geo queries),
                        Epic 16 (server-side aggregations for KPI dashboards)
```

---

## 13. TERRAFORM INFRASTRUCTURE SPECIFICATION

### 13.1 AWS Resources Required

| # | AWS Resource | Terraform Resource | Notes |
|---|-------------|--------------------|-------|
| 1 | DynamoDB Table (`DataTable`) | `aws_dynamodb_table` | Single-table with 4 GSIs, Streams, PITR, KMS |
| 2 | Cognito User Pool | `aws_cognito_user_pool` | Password policy, MFA, custom attributes |
| 3 | Cognito User Pool Client | `aws_cognito_user_pool_client` | Token expiry settings |
| 4 | 5× Cognito User Groups | `aws_cognito_user_group` × 5 | Admin, Manager, Technician, Viewer, CustomerAdmin |
| 5 | AppSync GraphQL API | `aws_appsync_graphql_api` | Cognito auth, schema SDL |
| 6 | AppSync Data Source | `aws_appsync_datasource` | DynamoDB table connection |
| 7 | 11× AppSync JS Resolvers | `aws_appsync_resolver` × 11 | JS runtime (not VTL) |
| 8 | S3 Firmware Bucket | `aws_s3_bucket` + policies | WORM, KMS, Glacier lifecycle |
| 9 | S3 Frontend Bucket | `aws_s3_bucket` | Static SPA hosting |
| 10 | CloudFront Distribution | `aws_cloudfront_distribution` | TLS via ACM, S3 origin |
| 11 | Lambda (Audit Processor) | `aws_lambda_function` | Node.js 20.x, DynamoDB stream trigger |
| 12 | DynamoDB Stream → Lambda | `aws_lambda_event_source_mapping` | Batch 25, retry 3, TRIM_HORIZON |
| 13 | IAM Roles & Policies | `aws_iam_role` + `aws_iam_policy` | Least-privilege per service |
| 14 | WAF v2 WebACL | `aws_wafv2_web_acl` | AWS Managed Rules + rate limiting |
| 15 | Route53 Hosted Zone | `aws_route53_zone` | Custom domain |
| 16 | ACM Certificate | `aws_acm_certificate` | TLS for CloudFront + AppSync |
| 17 | CloudWatch Dashboard | `aws_cloudwatch_dashboard` | DynamoDB, Lambda, AppSync, Cognito metrics |
| 18 | SNS Topics + Subscriptions | `aws_sns_topic` | Threshold-based alerts |
| 19 | CloudWatch Alarms | `aws_cloudwatch_metric_alarm` | Error rate, throttling, latency |
| 20 | Budget Alerts | `aws_budgets_budget` | Monthly cost governance |
| 21 | Terraform State Backend | `aws_s3_bucket` + `aws_dynamodb_table` | Remote state + locking |
| 22 | OpenSearch Serverless Collection | `aws_opensearchserverless_collection` | Search index for all entity types |
| 23 | OpenSearch Encryption Policy | `aws_opensearchserverless_security_policy` | Encryption at rest (type: "encryption") |
| 24 | OpenSearch Network Policy | `aws_opensearchserverless_security_policy` | Network access control (type: "network") |
| 25 | OpenSearch Data Access Policy | `aws_opensearchserverless_access_policy` | IAM grants for OSIS pipeline + AppSync |
| 26 | OpenSearch Ingestion Pipeline | `aws_osis_pipeline` | DynamoDB Streams → OpenSearch sync |
| 27 | S3 Export Bucket | `aws_s3_bucket` | Temporary bucket for initial DynamoDB export |
| 28 | OSIS Pipeline IAM Role | `aws_iam_role` + `aws_iam_policy` | DynamoDB, S3, and OpenSearch permissions |
| 29 | AppSync HTTP DataSource (OpenSearch) | `aws_appsync_datasource` | IAM-signed HTTP source (service: `aoss`) |
| 30 | 4× AppSync Search Resolvers | `aws_appsync_resolver` × 4 | searchGlobal, searchDevices, searchVulnerabilities, getAggregations |

### 13.2 Recommended Module Structure

```
infra/
├── main.tf                    # Root module — composes all modules
├── variables.tf               # Global input variables
├── outputs.tf                 # Output values (endpoints, IDs)
├── providers.tf               # AWS provider config + version constraints
├── backend.tf                 # S3 + DynamoDB state backend config
├── environments/
│   ├── dev.tfvars             # Dev environment variables
│   ├── staging.tfvars         # Staging environment variables
│   └── prod.tfvars            # Production environment variables
└── modules/
    ├── dynamodb/              # DataTable + 4 GSIs + Streams + PITR + KMS
    ├── cognito/               # User Pool + Client + 5 Groups + MFA + Password Policy
    ├── appsync/               # GraphQL API + Schema + Data Source + 11 Resolvers
    ├── s3-firmware/           # WORM bucket: Object Lock + KMS + Glacier lifecycle
    ├── s3-frontend/           # Static website hosting bucket
    ├── cloudfront/            # CDN distribution + ACM cert + OAI
    ├── lambda-audit/          # Audit stream processor + event source mapping
    ├── iam/                   # Service roles + policies (least-privilege)
    ├── waf/                   # WAF v2 WebACL rules
    ├── dns/                   # Route53 hosted zone + ACM certificate
    ├── opensearch/            # Serverless collection + OSIS pipeline + policies
    ├── monitoring/            # CloudWatch dashboards (4 service panels)
    └── alerting/              # SNS topics + CloudWatch alarms + budget alerts
```

### 13.3 Environment Strategy

| Aspect | Dev | Staging | Production |
|--------|-----|---------|-----------|
| **Terraform state** | `s3://ims-tfstate-dev/` | `s3://ims-tfstate-staging/` | `s3://ims-tfstate-prod/` |
| **DynamoDB billing** | PAY_PER_REQUEST | PAY_PER_REQUEST | PAY_PER_REQUEST |
| **DynamoDB PITR** | Disabled (cost) | Enabled | Enabled |
| **Cognito MFA** | Optional | Optional | Required (TOTP) |
| **Token expiry** | 60 min (relaxed for dev) | 15 min | 15 min |
| **WAF** | Disabled | Enabled (count mode) | Enabled (block mode) |
| **CloudFront** | No custom domain | Staging subdomain | Production domain |
| **OpenSearch** | Managed domain (t3.small.search, ~$27/mo) | Managed domain (t3.medium.search) | Serverless (auto-scaling OCUs) |
| **Lambda log retention** | 7 days | 30 days | 90 days (NIST AU-12) |
| **S3 firmware Object Lock** | Disabled | Enabled (governance mode) | Enabled (compliance mode — immutable) |
| **Budget alert** | $50/month | $200/month | $1,000/month |
| **Deploy trigger** | PR merge to `dev` branch | PR merge to `staging` branch | Tag push (`v*`) to `main` |
| **Data** | Seed data (100 devices) | Snapshot from prod (anonymized) | Live data |

**Branch → Environment mapping:**
```
feature/* → PR → dev branch → Dev environment (auto-deploy)
dev → PR → staging branch → Staging environment (auto-deploy)
staging → PR → main → Tag v1.x.x → Production (manual approve)
```

### 13.4 CI/CD Pipeline (GitHub Actions)

```yaml
# On Pull Request:
- terraform fmt -check
- terraform validate
- terraform plan → comment on PR
- npm test → test results
- npm run compliance:validate → SARIF upload to GitHub Code Scanning

# On merge to main:
- terraform apply -auto-approve → deploy infrastructure
- npm run build → build frontend SPA
- aws s3 sync dist/ s3://<frontend-bucket> → deploy frontend
- aws cloudfront create-invalidation → cache bust
```

---

## 14. TESTING INVENTORY

| Category | Count | Pattern |
|----------|-------|---------|
| Resolver unit tests | 8 | `src/__tests__/resolvers/*.test.js` |
| Component tests | 14 | `src/__tests__/components/*.test.tsx` |
| Compliance validator tests | 7 | `src/__tests__/compliance/validators/*.test.ts` |
| Compliance engine tests | 3 | `src/__tests__/compliance/engine/*.test.ts` |
| Library tests | 5 | `src/__tests__/lib/*.test.ts` |
| Module tests | 5 | `src/__tests__/modules/*.test.ts` |
| Integration tests | 1 | `src/__tests__/integration/*.test.ts` |
| **Total** | **43** | |

**Framework:** Vitest 3.2.4 + React Testing Library 16.3.2
**Coverage target:** ≥85% on new code
**Run:** `npm test` (single run) / `npm run test:coverage` (with coverage)

---

## 14A. DEVELOPMENT WORKFLOW & TRACEABILITY

> **Reference:** Full strategy details in [`docs/plans/reporting-traceability-strategy.md`](plans/reporting-traceability-strategy.md)

This section defines the **mandatory workflow** that ALL developers and AI agents (Claude, BMAD agents) MUST follow during implementation. It ensures end-to-end traceability from requirement to deployed code.

### 14A.1 Project Management: GitHub Projects (NOT Jira)

| Setting | Value |
|---------|-------|
| **Tool** | GitHub Projects V2 (free, GitHub-native) |
| **Project name** | `IMS Gen2 HLM Platform` |
| **Board columns** | `Backlog` → `Sprint Ready` → `In Development` → `In Review` → `In QA` → `Done` → `Blocked` |
| **Sprint field** | Iteration (2-week cycles) |
| **Epic tracking** | GitHub Milestones (one per Epic: 8-18) |
| **Story tracking** | GitHub Issues with `label:story` + milestone assignment |
| **Bug tracking** | GitHub Issues with `label:bug` + linked parent story |

### 14A.2 Naming Conventions (MANDATORY — All Agents Must Follow)

| Artifact | Convention | Example |
|----------|-----------|---------|
| **Epic** | GitHub Milestone: `Epic N: Title` | `Epic 10: Amazon Location Service` |
| **Story Issue** | `[Story N.M] Title` | `[Story 10.5] Replace Static Map with Interactive Map` |
| **Bug Issue** | `[Bug] Title` + `label:bug` | `[Bug] Map pins not rendering on Firefox` |
| **Branch** | `feature/IMS-{issue#}-short-desc` | `feature/IMS-123-interactive-map` |
| **Commit message** | `type(scope): description #issue` | `feat(inventory): add map component #123` |
| **PR title** | `[Story N.M] Description` | `[Story 10.5] Replace static map with Amazon Location` |
| **PR body** | Must include `Closes #issue` | `Closes #123` (auto-closes issue on merge) |
| **E2E test file** | `e2e/specs/{module}/{feature}.spec.ts` | `e2e/specs/inventory/interactive-map.spec.ts` |
| **Test annotation** | `@story-N.M` tag in test | `@story-10.5` — links test to story for report filtering |

**Commit types:** `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `ci`
**Scopes:** `inventory`, `deployment`, `compliance`, `account-service`, `dashboard`, `analytics`, `search`, `auth`, `infra`

### 14A.3 Label Taxonomy

| Category | Labels |
|----------|--------|
| **Type** | `story`, `bug`, `task`, `spike` |
| **Priority** | `priority:critical`, `priority:high`, `priority:medium`, `priority:low` |
| **Epic** | `epic:8` through `epic:18` |
| **Module** | `module:dashboard`, `module:inventory`, `module:deployment`, `module:compliance`, `module:account-service`, `module:analytics`, `module:search` |
| **CI** | `nightly-failure` |

### 14A.4 Developer Workflow (Step-by-Step)

This is the workflow every developer and AI agent MUST follow for every story:

```
1. PICK STORY
   └── From GitHub Projects board → "Sprint Ready" column
   └── Note the GitHub Issue number (e.g., #123)

2. CREATE BRANCH
   └── git checkout -b feature/IMS-123-short-desc

3. MOVE ISSUE → "In Development"
   └── GitHub Projects board: drag to "In Development"
   └── Or via CLI: gh project item-edit --status "In Development"

4. IMPLEMENT (TDD)
   └── Write unit tests FIRST (src/__tests__/)
   └── Implement feature code (src/app/components/, src/lib/)
   └── Write E2E tests (e2e/specs/{module}/{feature}.spec.ts)
   └── Run: npm test && npm run test:e2e
   └── Verify ≥85% coverage on new code

5. COMMIT (Conventional Commits + Issue Link)
   └── git commit -m "feat(inventory): add interactive map #123"
   └── Every commit references the issue number with #

6. OPEN PR
   └── Title: "[Story 10.5] Replace static map with interactive map"
   └── Body: "Closes #123" + AC checklist + test summary
   └── GitHub auto-moves issue → "In Review"

7. CI PIPELINE (Automatic — GitHub Actions)
   └── Build & Lint ✅
   └── Unit Tests (Vitest) ✅
   └── E2E Tests (Playwright, Chromium) ✅
   └── Compliance Validation (NIST 800-53) ✅
   └── PR Comment Bot posts results summary

8. CODE REVIEW
   └── Reviewer approves PR
   └── All status checks must be green

9. MERGE
   └── Squash merge to main
   └── GitHub auto-closes Issue #123
   └── GitHub auto-moves issue → "Done"

10. BUG FOUND? (during QA or nightly)
    └── Create bug issue: "[Bug] description"
    └── Labels: bug, priority:{level}, module:{module}, epic:{N}
    └── Body: "Parent: #123" (link to parent story)
    └── Fix branch: bugfix/IMS-456-fix-desc
    └── PR: "Closes #456"
```

### 14A.5 AI Agent (Claude/BMAD) Workflow Rules

When a BMAD dev agent or Claude implements a story, it MUST:

| Step | Rule | How |
|------|------|-----|
| **Before coding** | Check if GitHub Issue exists for the story | `gh issue list --label story --search "[Story N.M]"` |
| **If no issue** | Create one | `gh issue create --title "[Story N.M] Title" --label "story,epic:N" --milestone "Epic N: Title"` |
| **Branch naming** | Always include issue number | `feature/IMS-{issue#}-short-desc` |
| **Commits** | Always reference issue | `feat(scope): description #{issue}` |
| **PR creation** | Always link to issue | Body must contain `Closes #{issue}` |
| **Test files** | Always tag with story | `// @story-N.M` annotation in test file |
| **On completion** | Move issue to Done | Issue auto-closes on PR merge (via `Closes #`) |
| **On bug found** | Create bug issue linked to story | `gh issue create --label "bug,priority:high" --body "Parent: #{story_issue}"` |
| **Never** | Push directly to main | Always via feature branch + PR |
| **Never** | Skip CI checks | Branch protection enforces required status checks |
| **Never** | Create a PR without issue link | Every PR must reference a GitHub Issue |

### 14A.6 Traceability Chain

Every implemented feature must have this complete audit trail:

```
Epic (Milestone)
  └── Story (GitHub Issue #123)
       ├── Branch: feature/IMS-123-desc
       ├── Commits: feat(scope): ... #123
       ├── PR #456 (Closes #123)
       │    ├── Unit Tests: src/__tests__/...test.ts
       │    ├── E2E Tests: e2e/specs/.../...spec.ts (@story-N.M)
       │    ├── CI: Build ✅ Unit ✅ E2E ✅ Compliance ✅
       │    └── Review: Approved
       ├── Merge → main
       └── Issue #123 → Done (auto-closed)

If bug found:
  └── Bug Issue #789 (label:bug, linked to Story #123)
       ├── Branch: bugfix/IMS-789-fix-desc
       ├── PR #790 (Closes #789)
       └── Fix verified by CI → Bug closed
```

### 14A.7 GitHub Projects Automations

| Trigger | Action |
|---------|--------|
| Issue added to project | Set status → `Backlog` |
| PR opened referencing issue | Move issue → `In Review` |
| PR merged | Move issue → `Done` |
| Issue closed | Move to `Done`, set sprint to current |
| Issue labeled `bug` | Auto-add to "Bugs" board view |
| Nightly E2E failure | Auto-create bug issue with `nightly-failure` label |

### 14A.8 CI/CD Pipeline Requirements

Every PR to `main` MUST pass these checks (enforced by branch protection):

| Check | Tool | Threshold | Blocks Merge? |
|-------|------|-----------|:------------:|
| **Build & Lint** | Vite + ESLint | Zero errors | ✅ Yes |
| **Unit Tests** | Vitest | 100% pass, ≥85% coverage on new code | ✅ Yes |
| **E2E Tests** | Playwright (Chromium) | 100% pass | ✅ Yes |
| **Compliance** | Custom validators (NIST 800-53) | 11/11 controls pass | ✅ Yes |
| **PR Review** | Human or AI reviewer | At least 1 approval | ✅ Yes |

**Nightly regression** (2 AM UTC): Full E2E suite across Chromium + Firefox + WebKit. Failures auto-create bug issues.

### 14A.9 Mono-Repo Structure (Dev + QA Unified)

```
ims-gen2/
├── src/                          # Application source code
│   ├── app/components/           # React page components
│   ├── lib/                      # Shared libraries (hlm-api, auth, utils)
│   └── __tests__/                # Unit + integration tests (Vitest)
│
├── e2e/                          # End-to-end tests (Playwright)
│   ├── fixtures/                 # Test data, seed scripts
│   ├── pages/                    # Page Object Models
│   ├── specs/                    # Test specifications by module
│   │   ├── dashboard/
│   │   ├── inventory/
│   │   ├── deployment/
│   │   ├── compliance/
│   │   ├── search/               # OpenSearch integration tests
│   │   └── smoke/                # Smoke tests (@smoke tag)
│   └── playwright.config.ts
│
├── amplify/                      # Amplify Gen 2 backend (current)
├── infra/                        # Terraform infrastructure (target)
│
├── .github/
│   ├── ISSUE_TEMPLATE/           # Story, Bug, Spike templates
│   └── workflows/
│       ├── ci.yml                # PR pipeline: build + unit + e2e + compliance
│       ├── e2e-nightly.yml       # Nightly regression (3 browsers)
│       └── compliance-check.yml  # Existing compliance validation
│
├── docs/                         # Project documentation
│   └── plans/                    # Epic plans, sprint plans, strategies
│
└── scripts/                      # Build/utility scripts
```

### 14A.10 Claude-Orchestrated SDLC Workflow (End-to-End)

This section defines the **complete software development lifecycle** orchestrated by Claude via MCP servers. Every phase — from epic planning to bug resolution — is Claude-driven with human approval gates.

#### MCP Server Stack

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}" }
    },
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

| MCP Server | Purpose |
|-----------|---------|
| **GitHub MCP** (`@modelcontextprotocol/server-github`) | Issues, PRs, Projects, Milestones, Actions, Releases |
| **Playwright MCP** (`@playwright/mcp`) | Browser automation, screenshots, accessibility snapshots, DOM exploration |

#### Phase 1: Epic & Story Creation (PM + Claude)

**Who:** PM (or Claude via PM agent)
**Input:** Project brief functional requirements (FR-1 through FR-11)
**Output:** GitHub Milestones (Epics) + GitHub Issues (Stories) with **functional** acceptance criteria

**CRITICAL: Stories must be FUNCTIONAL, not technical.** QA needs to understand what the user does, not how the code works.

```
❌ WRONG (Technical):
  "Create a DynamoDB resolver that queries GSI1 with begins_with
   on GSI1SK for status filtering with pagination via nextToken"

✅ RIGHT (Functional):
  "As an Operations Manager, I can filter the device list by status
   (Online/Offline/Maintenance) and see paginated results (6 per page)
   so that I can quickly find devices that need attention"
```

**Story Issue Template (Functional):**

```markdown
## User Story
As a [persona], I want [action], so that [benefit].

## Acceptance Criteria (Functional — QA will test these)
- [ ] AC1: When I navigate to /inventory, I see a table of devices
- [ ] AC2: When I select "Offline" from the status filter, only offline devices appear
- [ ] AC3: When I click "Next Page", the next 6 devices load
- [ ] AC4: When I click "Export CSV", a CSV file downloads with the filtered results
- [ ] AC5: When no devices match the filter, I see "No devices found" message

## UI Behavior
- Filter dropdown appears above the table
- Table shows columns: Name, Serial, Status, Location, Health Score
- Pagination shows "Showing 1-6 of 43" with prev/next buttons
- CSV export button is disabled when no data

## Out of Scope
- (list what this story does NOT include)

## Personas
- Primary: Raj (Manager), Sarah (Admin)
- Secondary: Mike (Technician) — read-only view
```

**Claude creates stories via GitHub MCP:**

```
User: "Create stories for Epic 10 from the brief section FR-1"

Claude:
1. Reads FR-1 from brief
2. Breaks into stories with functional ACs
3. For each story:
   → gh issue create --title "[Story 10.1] ..." --label "story,epic:10"
     --milestone "Epic 10: Amazon Location Service"
     --body "<functional ACs + UI behavior>"
4. Reports: "Created 6 stories for Epic 10, assigned to Sprint 14"
```

#### Phase 2: QA Test Planning (QA + Claude + Playwright MCP)

**Who:** QA (or Claude via QA flow)
**Input:** Functional story from GitHub Issues
**Output:** Test plan as a GitHub Task attached to the story

**Flow:**

```
Step 1: QA tells Claude → "Create test plan for Story #123"

Step 2: Claude reads the story's functional ACs from GitHub

Step 3: Claude uses Playwright MCP to EXPLORE the live app:
  → browser_navigate("/inventory")
  → browser_snapshot() → gets accessibility tree
  → browser_screenshot() → sees actual UI layout
  → Identifies real selectors, element states, page structure

Step 4: Claude generates a TEST PLAN (not code yet):

  ┌─────────────────────────────────────────────────┐
  │ TEST PLAN: Story 10.5 — Interactive Map          │
  │─────────────────────────────────────────────────│
  │                                                  │
  │ TC-1: Map renders on Geo Location tab            │
  │   Pre: User logged in, on /inventory             │
  │   Steps: Click "Geo Location" tab                │
  │   Expected: Map container visible with markers   │
  │   Priority: P1                                   │
  │                                                  │
  │ TC-2: Device pins show correct count             │
  │   Pre: 5 devices with lat/lng in seed data       │
  │   Steps: Count visible map markers               │
  │   Expected: 5 pins on map                        │
  │   Priority: P1                                   │
  │                                                  │
  │ TC-3: Pin click shows device tooltip             │
  │   Steps: Click any device pin                    │
  │   Expected: Tooltip with name, status, health    │
  │   Priority: P1                                   │
  │                                                  │
  │ TC-4: Status filter updates pins                 │
  │   Steps: Select "Offline" filter pill            │
  │   Expected: Only offline device pins visible     │
  │   Priority: P2                                   │
  │                                                  │
  │ TC-5: Empty state when no devices match          │
  │   Steps: Select filter with no matching devices  │
  │   Expected: "No devices in this area" message    │
  │   Priority: P3                                   │
  │                                                  │
  │ Edge Cases:                                      │
  │ TC-6: Device without lat/lng not shown on map    │
  │ TC-7: Map handles 1000+ markers (performance)    │
  │ TC-8: Map works on mobile viewport               │
  └─────────────────────────────────────────────────┘

Step 5: Claude attaches test plan as a TASK to the story in GitHub:
  → gh issue create --title "[QA Plan] Story 10.5 Test Plan"
    --label "task,qa-plan" --body "<test plan>"
  → Links to parent story: "Parent: #123"
  → Appears on GitHub Projects board

Step 6: QA reviews and approves the test plan
```

#### Phase 3: Test Script Generation (QA + Claude + Playwright MCP)

**Who:** QA approves, Claude generates
**Input:** Approved test plan + live app exploration via Playwright MCP
**Output:** Playwright `.spec.ts` files in `e2e/specs/{module}/`

**Flow:**

```
Step 1: QA tells Claude → "Generate test scripts from the approved plan for Story #123"

Step 2: Claude reads the test plan task from GitHub

Step 3: Claude uses Playwright MCP to explore the REAL app:
  → browser_navigate("/inventory")
  → browser_click("Geo Location" tab)
  → browser_snapshot() → discovers actual selectors:
      - Map container: [data-testid="geo-map"]
      - Device pins: role="img" name="device-marker"
      - Filter pills: role="button" name="Online"
  → browser_screenshot() → visually confirms layout

Step 4: Claude reads existing page objects (e2e/pages/inventory.page.ts)

Step 5: Claude generates the test script:

  // e2e/specs/inventory/interactive-map.spec.ts
  // @story-10.5

  import { test, expect } from '@playwright/test';
  import { InventoryPage } from '../../pages/inventory.page';

  test.describe('Story 10.5: Interactive Map @story-10.5', () => {

    test('TC-1: Map renders on Geo Location tab', async ({ page }) => {
      const inventory = new InventoryPage(page);
      await inventory.goto();
      await inventory.openGeoLocation();
      await expect(page.getByTestId('geo-map')).toBeVisible();
    });

    test('TC-2: Device pins show correct count', async ({ page }) => {
      // ... generated from real selectors discovered via MCP
    });

    // ... TC-3 through TC-8
  });

Step 6: Claude updates the GitHub task:
  → Adds comment: "Test scripts generated: e2e/specs/inventory/interactive-map.spec.ts (8 tests)"
  → Sets QA Status field → "Tests Written"

Step 7: Claude runs the tests:
  → npx playwright test e2e/specs/inventory/interactive-map.spec.ts
  → Reports results to QA
```

#### Phase 4: Test Execution & Bug Filing (Claude-Automated)

**Who:** Claude (automated via CI or manual trigger)
**Input:** Test scripts
**Output:** Pass/Fail results + auto-filed bug issues

**Flow:**

```
Step 1: Tests run (CI pipeline or manual)
  → npx playwright test --reporter=json,html

Step 2: Claude reads results

  IF ALL PASS:
    → Claude comments on story issue: "✅ All 8 E2E tests passing"
    → Updates QA Status → "Passing"
    → Story ready to move to "Done"

  IF ANY FAIL:
    → Claude analyzes the failure:
      - Reads error message + stack trace
      - Takes screenshot of failure state via Playwright MCP
      - Captures browser console errors
      - Reads the Playwright trace file

    → Claude creates a BUG ISSUE:

      gh issue create \
        --title "[Bug] Device tooltip shows 'undefined' on map pin click" \
        --label "bug,priority:high,module:inventory,epic:10" \
        --body "
          ## Parent Story: #123

          ## Failed Test
          TC-3: Pin click shows device tooltip
          File: e2e/specs/inventory/interactive-map.spec.ts:24

          ## Steps to Reproduce
          1. Navigate to /inventory
          2. Click 'Geo Location' tab
          3. Click any device pin on the map

          ## Expected
          Tooltip shows device name, status, and health score

          ## Actual
          Tooltip shows 'undefined' for device name

          ## Evidence
          - Screenshot: [attached]
          - Console error: TypeError: device.name is undefined
          - Playwright trace: [link to artifact]

          ## Environment
          - Branch: feature/IMS-123-interactive-map
          - Commit: abc1234
          - Browser: Chromium 120
        "

    → Bug auto-appears on GitHub Projects "Bugs" view
    → Claude links bug to parent story
    → Updates QA Status → "Failing"
```

#### Phase 5: Test Healing (Claude + Playwright MCP)

When UI changes cause test selectors to break (not functional bugs — just stale selectors):

**Flow:**

```
Step 1: Test fails with selector error:
  "Error: locator.click: No element matches selector '[data-testid=geo-map]'"

Step 2: Claude detects this is a SELECTOR issue (not a functional bug):
  → Error type is "element not found", not "assertion failed"

Step 3: Claude uses Playwright MCP to diagnose:
  → browser_navigate("/inventory")
  → browser_click("Geo Location" tab)
  → browser_snapshot() → gets current accessibility tree
  → Discovers: testid changed from "geo-map" to "geo-location-map"
    OR: element moved to a different DOM position
    OR: element now has a different role/label

Step 4: Claude updates the test file:
  → Replaces stale selector with correct one
  → Updates page object model if selector is shared

Step 5: Claude re-runs the test to verify:
  → npx playwright test e2e/specs/inventory/interactive-map.spec.ts
  → ✅ Pass → Claude commits the fix:
    "fix(e2e): update map selector after UI refactor #123"

Step 6: Claude DOES NOT file a bug (this was a test maintenance issue, not a product defect)
```

**Decision tree — Bug vs Heal:**

```
Test Failed
  ├── Selector not found → HEAL (update selector)
  ├── Element found but wrong text/state → BUG (functional regression)
  ├── Timeout waiting for element → INVESTIGATE
  │   ├── Element eventually appears (slow) → HEAL (increase timeout)
  │   └── Element never appears → BUG (feature broken)
  └── Assertion failed (expected ≠ actual) → BUG (always)
```

#### Phase 6: Sprint Reporting (Claude + GitHub MCP + OpenSearch)

**Who:** PM/Manager asks Claude
**Output:** Combined project + product health report

```
User: "Sprint 14 status with QA metrics"

Claude generates:
  ┌─────────────────────────────────────────────────┐
  │ SPRINT 14 STATUS REPORT                          │
  │─────────────────────────────────────────────────│
  │                                                  │
  │ STORIES: 6/8 completed (75%)                     │
  │   ✅ Done: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6  │
  │   🔄 In QA: 11.1 (tests written, 3/5 passing)   │
  │   📋 In Dev: 11.2                                │
  │                                                  │
  │ QA METRICS:                                      │
  │   Test Plans Created: 8                          │
  │   Test Scripts Generated: 47 tests               │
  │   Pass Rate: 91% (43/47)                         │
  │   Healed (selector fixes): 3                     │
  │   Bugs Filed: 4 (1 critical, 2 high, 1 medium)  │
  │   Bugs Fixed: 3                                  │
  │   Bugs Open: 1 (critical — tooltip undefined)    │
  │                                                  │
  │ CI HEALTH:                                       │
  │   PR builds: 12/14 passed (85.7%)                │
  │   Nightly E2E: 44/47 passing                     │
  │   Compliance: 11/11 NIST controls ✅             │
  │                                                  │
  │ PRODUCT HEALTH (OpenSearch):                     │
  │   Devices: 1,247 online / 43 offline             │
  │   Compliance: 94% approved                       │
  │   Vulnerabilities: 2 critical open               │
  └─────────────────────────────────────────────────┘
```

#### Complete Lifecycle Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CLAUDE-ORCHESTRATED SDLC                              │
│─────────────────────────────────────────────────────────────────────────│
│                                                                          │
│  PHASE 1: PLAN                    PHASE 2: QA PLAN                      │
│  ┌──────────────┐                 ┌──────────────┐                      │
│  │ Claude reads  │                 │ Claude reads  │                      │
│  │ brief FRs     │──── Creates ───►│ story ACs     │──── Creates ───►    │
│  │               │  GitHub Issues  │               │  Test Plan Task     │
│  │ (GitHub MCP)  │  (functional)   │ (Playwright   │  (GitHub MCP)       │
│  └──────────────┘                 │  MCP explores) │                      │
│        │                          └──────────────┘                      │
│        │                                 │                               │
│        ▼                                 ▼                               │
│  PHASE 3: DEVELOP                 PHASE 4: GENERATE TESTS               │
│  ┌──────────────┐                 ┌──────────────┐                      │
│  │ Claude writes │                 │ Claude writes  │                      │
│  │ code + unit   │                 │ Playwright     │                      │
│  │ tests (TDD)   │                 │ .spec.ts files │                      │
│  │               │                 │ (real selectors │                      │
│  │ Opens PR      │                 │  from MCP)     │                      │
│  └──────┬───────┘                 └──────┬───────┘                      │
│         │                                │                               │
│         ▼                                ▼                               │
│  PHASE 5: CI PIPELINE             PHASE 6: RESULTS                      │
│  ┌──────────────┐                 ┌──────────────┐                      │
│  │ Build ✅      │                 │ All Pass? ────►  Story → Done       │
│  │ Unit Tests ✅ │                 │              │                      │
│  │ E2E Tests  ──►│─── Results ───►│ Fail?        │                      │
│  │ Compliance ✅  │                 │  ├── Selector ► HEAL (auto-fix)     │
│  └──────────────┘                 │  └── Functional► FILE BUG            │
│                                    └──────┬───────┘                      │
│                                           │                               │
│                                           ▼                               │
│                                    PHASE 7: BUG LOOP                     │
│                                    ┌──────────────┐                      │
│                                    │ Bug Issue     │                      │
│                                    │ linked to     │◄── Nightly failures  │
│                                    │ parent story  │    also auto-filed   │
│                                    │ (GitHub MCP)  │                      │
│                                    └──────┬───────┘                      │
│                                           │                               │
│                                           └──── Fix ──► Back to Phase 5  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### GitHub Projects Board View (During This Workflow)

```
Sprint Board:
┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│ Backlog  │ Sprint   │ In Dev   │ In Review│ In QA    │ Done     │
│          │ Ready    │          │          │          │          │
│ Story    │ Story    │ Story    │ Story    │ Story    │ Story    │
│ 11.3     │ 11.2     │          │          │ 11.1     │ 10.1     │
│ Story    │          │          │          │  ├─ QA   │ 10.2     │
│ 11.4     │          │          │          │  │ Plan  │ 10.3     │
│          │          │          │          │  ├─ 5    │ 10.4     │
│          │          │          │          │  │ tests │ 10.5     │
│          │          │          │          │  └─ Bug  │ 10.6     │
│          │          │          │          │    #789  │          │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘

Bugs View:
┌──────────────────────────────────────────────────────────────────┐
│ Open (1)                    │ Fixed (3)                          │
│ 🔴 #789 Tooltip undefined   │ ✅ #785 Map crash on Firefox       │
│    Parent: Story 10.5 #123  │ ✅ #786 Slow load on mobile        │
│    Priority: Critical        │ ✅ #788 Filter not clearing        │
└──────────────────────────────────────────────────────────────────┘
```

#### Natural Language Commands (What You Say to Claude)

| Phase | What You Say | What Claude Does |
|-------|-------------|-----------------|
| **Plan** | "Create stories for Epic 11 from the brief" | Reads FRs → creates GitHub Issues with functional ACs → assigns to milestone |
| **Sprint** | "Set up Sprint 14 with stories 11.1-11.4" | Creates iteration → assigns stories → moves to Sprint Ready |
| **QA Plan** | "Create test plan for Story #123" | Reads ACs → explores app via Playwright MCP → creates test plan task → attaches to story |
| **Generate Tests** | "Generate E2E scripts for Story #123" | Reads test plan → explores app for selectors → generates .spec.ts → commits |
| **Run Tests** | "Run E2E tests for Story #123" | `npx playwright test` → reports results → updates QA Status |
| **File Bug** | "File that failure as a bug against Story #123" | Creates bug issue with evidence → links to story → adds to Bugs view |
| **Heal Test** | "Fix the broken selector in map.spec.ts" | MCP explores app → finds new selector → updates test → re-runs → commits |
| **Status** | "Sprint 14 status with QA metrics" | Queries GitHub Projects + OpenSearch → generates combined report |
| **Release** | "Create release v1.4.0" | Tags commit → generates changelog from merged PRs → creates GitHub Release |

### 14A.11 Reference Documents

| Document | Location | Purpose |
|----------|----------|---------|
| **This Brief** | `docs/IMS-Gen2-Detailed-Project-Brief-For-Terraform.md` | Single source of truth for all specifications |
| **Reporting & Traceability Strategy** | `docs/plans/reporting-traceability-strategy.md` | Full GitHub Projects setup, MCP integration, Claude workflow templates |
| **PRD** | `SPEC/references/PRD.md` | Product requirements (to be updated from this brief) |
| **Architecture** | `SPEC/references/amplify-gen2-architecture.md` | System architecture (to be updated from this brief) |
| **API Contracts** | `docs/api-contracts-main.md` | GraphQL query/mutation signatures |
| **Data Models** | `docs/data-models-main.md` | DynamoDB schema details |

---

## 15. FUNCTIONAL REQUIREMENTS SUMMARY

### FR-1: Device Inventory Management
- CRUD operations for hardware devices
- Search by name, serial number, customer
- Filter by status (Online/Offline/Maintenance), location, model, customer
- Paginated table view (6 items/page) with CSV export
- Firmware status grid with health scores
- Geo-location map with device markers

### FR-2: Firmware Lifecycle Management
- Upload firmware packages with metadata (name, version, model, checksum)
- Store firmware binaries in immutable (WORM) storage
- Multi-stage approval workflow: Uploaded → Testing → Approved
- Separation of duties: uploader ≠ tester ≠ approver
- Deprecate firmware with status tracking
- Approval stage visual indicator

### FR-3: Service Order Management
- Create service orders (title, technician, type, location, date, time, priority)
- Kanban board with drag-drop (Scheduled → In Progress → Completed)
- Calendar view (monthly) with service events
- Filter by status, export to CSV

### FR-4: Compliance & Vulnerability Tracking
- Track compliance certifications per firmware/device model
- Submit for review, approve, or deprecate compliance items
- Vulnerability management (CVE ID, severity, affected component, remediation status)
- Regulatory readiness report generation (CSV/JSON)
- Filter by certification type, device model, vulnerability threshold

### FR-5: Audit Trail
- Automatic audit log generation for all data changes (create, update, delete)
- Query by date range or user
- 90-day retention with auto-expiry (TTL)
- Admin/Manager access only
- Searchable, exportable (CSV)

### FR-6: Analytics & Reporting
- KPI dashboard: total devices, online count, active deployments, pending approvals, health score
- Device status distribution (pie chart)
- Compliance status distribution (pie chart)
- Deployment trends over time (line/bar chart)
- Top vulnerabilities (bar chart)
- Time range filtering (7d, 30d, 90d)

### FR-7: Authentication & Access Control
- Email/password login with Cognito
- Optional TOTP MFA
- 5 RBAC roles with granular permissions
- 15-minute session timeout with 7-day refresh
- New password flow on first login
- Multi-tenant data isolation via customerId

### FR-8: Executive Dashboard
- 4 top-level KPIs
- Quick action links with pending item counts
- Recent alerts (24hr)
- System health status (4 services)

### FR-9: Search & Aggregations (OpenSearch)
- Global search bar — full-text search across all 8 entity types with fuzzy matching and highlighting
- Advanced device search with partial matching on name, serial number, customer, location
- Vulnerability search across CVE IDs, descriptions, affected components
- Server-side aggregations for analytics charts (device status distribution, compliance status, deployment trends, top vulnerabilities, health score distribution)
- Autocomplete / typeahead on search inputs
- Geospatial queries: find devices within radius, aggregate by geographic region (enables Epics 10, 13, 14)

### FR-10: Notification System
- Real-time notification delivery via AppSync subscriptions (WebSocket)
- Notification types: firmware approval, service order assignment/completion, critical vulnerability, device offline, compliance changes
- Bell icon with unread badge count in header (all pages)
- Slide-out notification panel (360px, from right)
- Click notification → deep link to source entity
- Mark as read (individual + bulk)
- 30-day auto-expiry via DynamoDB TTL
- Role-based routing: notifications delivered only to relevant personas per event type

### FR-11: Enterprise Navigation & UX
- Collapsible sidebar navigation (icon-only ↔ icon + label), persisted preference
- Global search bar with `Cmd+K` / `Ctrl+K` keyboard shortcut (Command Palette)
- Breadcrumb navigation on all sub-pages
- Compact data-first layouts — maximize information density per viewport
- Enterprise design language: single accent color, no gradients, subtle animations
- Accessibility: WCAG 2.1 AA compliance (keyboard navigation, screen reader support, 4.5:1 contrast)
- Responsive: mobile hamburger menu, stacked grids on small screens, touch-friendly hit targets (44px minimum)

---

*This document is the single source of truth for implementation. Every data model, API contract, auth rule, UI feature, security control, and non-functional requirement must be implemented to achieve feature parity. This brief feeds directly into the Architecture Document and PRD.*
