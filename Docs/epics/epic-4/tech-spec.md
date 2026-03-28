# Epic 4: Deployment & Firmware Lifecycle — Technical Specification

**Epic:** Epic 4 — Deployment & Firmware Lifecycle
**Brief Reference:** FR-2, Section 10.2 Deployment (firmware upload, multi-stage approval SoD, audit logs)

---

## 1. Overview

This epic implements the Deployment page with two tabs: Firmware (upload, stage management, approval workflow with Separation of Duties) and Audit Logs (30-day searchable audit trail). The firmware approval pipeline enforces NIST AC-5 SoD at the resolver level.

---

## 2. Data Models

### 2.1 Firmware Entity

```typescript
{
  PK: "FW#<uuid>",
  SK: "FW#<uuid>",
  entityType: "Firmware",
  name: string,
  version: string,
  deviceModel: string,
  releaseDate: string,          // ISO8601
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

### 2.2 AuditLog Entity

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
  timestamp: string,           // ISO8601
  status: "Success",
  ttl: number,                 // 90-day auto-expiry
  GSI1PK: "AUDIT_LOG",
  GSI1SK: "Success#<timestamp>",
  GSI2PK: "AUDIT_LOG",
  GSI2SK: "<timestamp>",
  GSI4PK: "USER#<userId>",
  GSI4SK: "AUDIT#<uuid>"
}
```

### 2.3 GSI Access Patterns

| GSI | Query | Purpose |
|-----|-------|---------|
| GSI1 | `listFirmware(status?)` | List firmware by status |
| GSI3 | `getFirmwareByModel(deviceModel)` | Firmware for a device model |
| GSI2 | `listAuditLogs(startDate, endDate)` | Audit logs in date range |
| GSI4 | `getAuditLogsByUser(userId)` | Audit trail for a specific user |

---

## 3. Separation of Duties (NIST AC-5)

### 3.1 Stage Advancement Rules

| Transition | Enforced Constraint | Resolver |
|-----------|---------------------|----------|
| Uploaded -> Testing | `uploadedBy !== performedBy` (uploader cannot test) | `advanceFirmwareStage.js` |
| Testing -> Approved | `testedBy !== performedBy` (tester cannot approve) AND current stage must be "Testing" | `advanceFirmwareStage.js` |
| Direct Approval | `uploadedBy !== approvedBy` (uploader cannot approve own firmware) | `approveFirmware.js` |

### 3.2 Resolver Enforcement

```javascript
// advanceFirmwareStage.js — conditional checks
if (targetStage === "Testing" && firmware.uploadedBy === performedBy) {
  util.error("SoD violation: uploader cannot advance to Testing", "SeparationOfDutiesError");
}
if (targetStage === "Approved" && firmware.testedBy === performedBy) {
  util.error("SoD violation: tester cannot approve", "SeparationOfDutiesError");
}
if (targetStage === "Approved" && firmware.approvalStage !== "Testing") {
  util.error("Cannot approve: firmware must be in Testing stage", "InvalidStateError");
}
```

---

## 4. API Contracts

### 4.1 Queries

| Query | Arguments | Returns | Auth |
|-------|-----------|---------|------|
| `listFirmware(status?, limit?, nextToken?)` | Optional status filter | `{ items: Firmware[], nextToken? }` | All roles |
| `getFirmware(id)` | Firmware ID | `Firmware` | All roles |
| `getFirmwareByModel(deviceModel)` | Device model string | `Firmware[]` | All roles |
| `listAuditLogs(startDate, endDate, limit?, nextToken?)` | Date range, pagination | `{ items: AuditLog[], nextToken? }` | Admin, Manager |
| `getAuditLogsByUser(userId)` | User ID | `AuditLog[]` | Admin, Manager |

### 4.2 Mutations

| Mutation | Arguments | Returns | Auth |
|----------|-----------|---------|------|
| `createFirmware(input)` | Firmware fields | `Firmware` (auto-sets `approvalStage: "Uploaded"`) | Admin, Manager |
| `advanceFirmwareStage(firmwareId, targetStage, performedBy)` | ID, target stage, user | `Firmware` | Admin, Manager (SoD enforced) |
| `approveFirmware(firmwareId, approvedBy)` | ID, approver | `Firmware` | Admin only (SoD enforced) |
| `updateEntityStatus("Firmware", id, newStatus)` | ID, new status | `Firmware` | Admin, Manager |

---

## 5. S3 Firmware Storage

| Setting | Value |
|---------|-------|
| Bucket | `FirmwareBucket` |
| Encryption | KMS-managed |
| Object Lock | WORM (compliance mode in prod) |
| Upload | Pre-signed URL from Lambda |
| Max file size | Configurable (default 500MB) |

---

## 6. Component Hierarchy

```
src/app/components/
├── deployment.tsx                   # Main page with tab container
│   ├── Tabs (shadcn)
│   │   ├── FirmwareTab
│   │   │   ├── UploadFirmwareButton
│   │   │   │   └── UploadFirmwareModal (Dialog)
│   │   │   │       └── Form (name, version, model, file)
│   │   │   ├── FirmwareCardGrid
│   │   │   │   └── FirmwareCard (repeated)
│   │   │   │       ├── Name, Version, Model, Checksum
│   │   │   │       ├── ApprovalStageIndicator
│   │   │   │       │   └── 3 steps: Uploaded → Testing → Approved
│   │   │   │       └── ActionButtons (Advance / Approve / Deprecate)
│   │   └── AuditLogTab
│   │       ├── SearchFilter (text search)
│   │       ├── AuditLogTable
│   │       │   └── Columns: User, Action, Resource, Timestamp, IP, Status
│   │       ├── Pagination
│   │       └── ExportCSVButton
```

### 6.1 ApprovalStageIndicator Component

Visual 3-step indicator showing the firmware approval pipeline:
- Step 1: **Uploaded** — who uploaded, when
- Step 2: **Testing** — who tested, when (or "Pending")
- Step 3: **Approved** — who approved, when (or "Pending")

Completed steps show a green checkmark; the current step is highlighted; future steps are grayed.

---

## 7. Audit Log Tab

### 7.1 Table Columns

| Column | Field | Sortable |
|--------|-------|----------|
| User | `userId` (resolved to name) | Yes |
| Action | `action` | Yes |
| Resource | `resourceType` + `resourceId` | No |
| Timestamp | `timestamp` | Yes (default: newest first) |
| IP Address | `ipAddress` | No |
| Status | `status` | No |

### 7.2 Date Range

Default: Last 30 days. Date range picker allows custom range selection.

### 7.3 Export

CSV export of filtered/visible audit log entries.

---

## 8. Audit Log Generation

Audit logs are generated automatically by the Lambda audit stream processor:
1. DynamoDB Streams captures all writes (INSERT, MODIFY, DELETE)
2. Lambda function generates `AUDIT#<uuid>` records
3. Records written back to the same table
4. 90-day TTL auto-expiry (NIST AU-12)

No manual audit log creation is needed from the frontend.
