# Epic 11: Aegis Phase 1 (Firmware Security) — Technical Specification

**Epic:** Epic 11 — Aegis Phase 1 (Firmware Security)
**Brief Reference:** Section 12 Planned Epics
**Status:** POC — Fresh Build

---

## 1. Overview

Aegis Phase 1 enhances the firmware lifecycle with a formal multi-stage approval workflow (Uploaded -> Testing -> Approved), vulnerability tracking per firmware version, regulatory compliance reports, and Separation of Duties (SoD) enforcement. This builds on the existing Firmware entity and approval fields defined in the master spec, adding the UI workflow, enforcement logic, and reporting capabilities.

---

## 2. Data Model

### 2.1 Firmware Entity — Approval Fields (Already Defined)

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

  // SoD tracking fields
  uploadedBy: string,           // USER#<id> — who uploaded
  testedBy: string,             // USER#<id> — who advanced to Testing
  testedDate: string,           // ISO8601
  approvedBy: string,           // USER#<id> — who approved
  approvedDate: string,         // ISO8601
  securityReviewedBy: string,   // USER#<id> — who did security review
  securityReviewedDate: string, // ISO8601

  downloads: number,
  GSI1PK: "FIRMWARE",
  GSI1SK: "<status>#<timestamp>",
  GSI3PK: "<deviceModel>",
  GSI3SK: "FW#<uuid>"
}
```

### 2.2 Vulnerability Entity (Already Defined)

```typescript
{
  PK: "VULN#<uuid>",
  SK: "VULN#<uuid>",
  entityType: "Vulnerability",
  vulnCveId: string,                    // e.g., "CVE-2026-1234"
  vulnSeverity: "Critical" | "High" | "Medium" | "Low",
  vulnAffectedComponent: string,        // e.g., "OpenSSL 3.1.0"
  vulnRemediationStatus: "Open" | "In Progress" | "Resolved",
  vulnResolvedDate: string,             // ISO8601, set when status = "Resolved"
  GSI4PK: "COMP#<complianceId>",        // Links to compliance record
  GSI4SK: "VULN#<uuid>"
}
```

### 2.3 New: FirmwareVulnerability Relationship (GSI4)

To link vulnerabilities directly to firmware (not just compliance), we use GSI4:

```typescript
// Additional GSI4 pattern for firmware-vulnerability relationship
{
  // On Vulnerability entity, optionally:
  GSI4PK: "FW#<firmwareId>",    // Parent firmware
  GSI4SK: "VULN#<uuid>"         // This vulnerability
}
```

This allows the query: "List all vulnerabilities for firmware FW#abc123."

---

## 3. API Contracts

### 3.1 Existing Mutations (Used by Aegis)

```graphql
# Upload new firmware (sets approvalStage = "Uploaded" automatically)
mutation createFirmware(
  $name: String!,
  $version: String!,
  $deviceModel: String!,
  $fileSize: String!,
  $checksum: String!,
  $s3Key: String!,
  $uploadedBy: String!
): Firmware!

# Advance firmware through approval stages with SoD enforcement
mutation advanceFirmwareStage(
  $firmwareId: String!,
  $targetStage: String!,   # "Testing" or "Approved"
  $performedBy: String!
): Firmware!

# Direct approval (Admin only, SoD: uploader != approver)
mutation approveFirmware(
  $firmwareId: String!,
  $approvedBy: String!
): Firmware!

# Create vulnerability record linked to firmware
mutation createVulnerability(
  $vulnCveId: String!,
  $vulnSeverity: String!,
  $vulnAffectedComponent: String!,
  $firmwareId: String!
): Vulnerability!

# Update vulnerability remediation status
mutation updateVulnerabilityStatus(
  $vulnerabilityId: String!,
  $remediationStatus: String!
): Vulnerability!
```

### 3.2 Existing Queries

```graphql
query getFirmware($id: String!): Firmware
query listFirmware($status: String, $limit: Int): [Firmware]
query getFirmwareByModel($deviceModel: String!): [Firmware]
query listVulnerabilitiesByCompliance($complianceId: String!): [Vulnerability]
```

### 3.3 New Query (for firmware-vulnerability link)

```graphql
query listVulnerabilitiesByFirmware($firmwareId: String!): [Vulnerability]
# Uses GSI4: GSI4PK = "FW#<firmwareId>", begins_with(GSI4SK, "VULN#")
```

---

## 4. Separation of Duties (SoD) Enforcement

### 4.1 Rules (NIST AC-5)

| Transition | Rule | Resolver Check |
|---|---|---|
| Upload -> Testing | Uploader cannot be tester | `performedBy !== firmware.uploadedBy` |
| Testing -> Approved | Tester cannot be approver | `performedBy !== firmware.testedBy` |
| Upload -> Approved (direct) | Uploader cannot be approver | `approvedBy !== firmware.uploadedBy` |

### 4.2 Resolver Logic: advanceFirmwareStage.js

```javascript
export function request(ctx) {
  const { firmwareId, targetStage, performedBy } = ctx.args;

  // First: get current firmware state
  return {
    operation: "GetItem",
    key: { PK: { S: `FW#${firmwareId}` }, SK: { S: `FW#${firmwareId}` } },
  };
}

export function response(ctx) {
  const firmware = ctx.result;
  const { targetStage, performedBy } = ctx.args;

  // Stage transition validation
  if (targetStage === "Testing") {
    if (firmware.approvalStage !== "Uploaded") {
      util.error("Firmware must be in Uploaded stage to advance to Testing");
    }
    if (performedBy === firmware.uploadedBy) {
      util.error("SoD violation: Uploader cannot advance to Testing (NIST AC-5)");
    }
  }

  if (targetStage === "Approved") {
    if (firmware.approvalStage !== "Testing") {
      util.error("Firmware must be in Testing stage to advance to Approved");
    }
    if (performedBy === firmware.testedBy) {
      util.error("SoD violation: Tester cannot approve (NIST AC-5)");
    }
  }

  // Proceed with update...
}
```

---

## 5. Component Hierarchy

```
DeploymentPage (src/app/components/deployment.tsx)
├── Tab: Firmware
│   ├── FirmwareUploadModal
│   │   ├── Form: name, version, deviceModel, file upload
│   │   └── Checksum display (SHA-256 computed client-side)
│   ├── FirmwareCardGrid
│   │   └── FirmwareCard (per firmware)
│   │       ├── ApprovalStageIndicator
│   │       │   ├── Stage: Uploaded (circle, colored if current/past)
│   │       │   ├── Stage: Testing (circle)
│   │       │   └── Stage: Approved (circle)
│   │       ├── FirmwareDetails (name, version, model, size, date)
│   │       ├── SoDInfo (uploadedBy, testedBy, approvedBy with dates)
│   │       ├── VulnerabilityBadge (count with severity color)
│   │       └── ActionButtons
│   │           ├── "Advance to Testing" (visible if Uploaded, user != uploader)
│   │           ├── "Approve" (visible if Testing, user != tester)
│   │           └── "Deprecate" (visible if Active)
│   └── FirmwareFilters
│       ├── Status filter (Active/Deprecated/Pending)
│       └── Model filter (dropdown)
├── Tab: Vulnerabilities
│   └── VulnerabilityPanel
│       ├── VulnerabilityTable
│       │   ├── Column: CVE ID
│       │   ├── Column: Severity (badge: Critical=red, High=orange, Medium=amber, Low=green)
│       │   ├── Column: Affected Component
│       │   ├── Column: Remediation Status (Open/In Progress/Resolved)
│       │   ├── Column: Firmware Version
│       │   └── Column: Actions (Update Status dropdown)
│       ├── CreateVulnerabilityModal
│       └── SeverityFilterPills
├── Tab: Regulatory Reports
│   └── RegulatoryReportPanel
│       ├── ReportTypeSelector (Compliance Summary, Vulnerability Report, Approval Chain)
│       ├── ReportFilters (date range, device model, certification)
│       ├── ReportPreview (table view of report data)
│       └── ExportButtons (CSV, JSON)
└── Tab: Audit Log (from Epic 8)
```

---

## 6. ApprovalStageIndicator Component

```typescript
// Visual: three connected circles with labels
// ● ──── ● ──── ●
// Uploaded  Testing  Approved

interface ApprovalStageIndicatorProps {
  currentStage: "Uploaded" | "Testing" | "Approved";
  uploadedBy?: string;
  uploadedDate?: string;
  testedBy?: string;
  testedDate?: string;
  approvedBy?: string;
  approvedDate?: string;
}

// Colors:
// Completed stage: green (#10b981) fill
// Current stage: blue (#2563eb) fill with pulse animation
// Future stage: gray (#d1d5db) outline only
// Connector line: green if past, gray if future
```

---

## 7. Regulatory Report Generation

### 7.1 Report Types

| Report | Contents | Format |
|---|---|---|
| Compliance Summary | All compliance records with status, certification, firmware version | CSV, JSON |
| Vulnerability Report | All vulnerabilities with CVE, severity, remediation status, affected firmware | CSV, JSON |
| Approval Chain Audit | Firmware approval history: who uploaded, tested, approved with timestamps | CSV, JSON |

### 7.2 Report Generation (Client-side via report-generator.ts)

```typescript
function generateRegulatoryReport(
  type: "compliance" | "vulnerability" | "approval-chain",
  data: Record<string, unknown>[],
  format: "csv" | "json"
): void {
  const filename = `${type}-report-${new Date().toISOString().split('T')[0]}`;
  if (format === "csv") {
    generateCSV(data, `${filename}.csv`);
  } else {
    generateJSON(data, `${filename}.json`);
  }
}
```

---

## 8. Access Control

| Role | Upload Firmware | Advance Stages | Approve | View Vulnerabilities | Update Vuln Status | Generate Reports |
|---|---|---|---|---|---|---|
| Admin | Yes | Yes (SoD) | Yes (SoD) | Yes | Yes | Yes |
| Manager | Yes | Yes (SoD) | No | Yes | Yes | Yes |
| Technician | No | No | No | No | No | No |
| Viewer | No | No | No | Yes (read-only) | No | Export only |
| CustomerAdmin | No | No | No | No | No | No |

---

## 9. S3 Firmware Upload Flow

```
User clicks "Upload Firmware"
  → Form: name, version, model, file
  → Client computes SHA-256 checksum of file
  → createFirmware mutation (creates DynamoDB record, returns presigned URL)
  → Upload file to S3 firmware bucket via presigned PUT
  → S3 Object Lock (WORM) prevents deletion/modification
  → Firmware record: approvalStage = "Uploaded", uploadedBy = current user
```

---

## 10. Notifications Triggered

| Event | Notification | Recipients |
|---|---|---|
| Firmware uploaded | "New firmware {version} uploaded for {model}" | Admin, Managers |
| Advanced to Testing | "Firmware {version} moved to Testing by {user}" | Admin, Managers |
| Approved | "Firmware {version} approved by {user}" | Admin, Managers, uploading user |
| Critical vulnerability found | "Critical CVE {id} affects {component}" | Admin, Managers |
