# Epic 6: Compliance & Vulnerability Tracking — Technical Specification

**Epic:** Epic 6 — Compliance & Vulnerability Tracking
**Brief Reference:** FR-4, Section 10.2 Compliance (compliance items, vulnerability panel, regulatory reports)

---

## 1. Overview

This epic implements the Compliance page with compliance item management, vulnerability tracking panel, regulatory report generation, and compliance status workflows. It supports NIST 800-53 compliance tracking and audit-ready report exports.

---

## 2. Data Models

### 2.1 Compliance Entity

```typescript
{
  PK: "COMP#<uuid>",
  SK: "COMP#<uuid>",
  entityType: "Compliance",
  firmwareVersion: string,
  deviceModel: string,
  certification: string,         // e.g., "IEC 62109", "UL 1741"
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

### 2.2 Vulnerability Entity

```typescript
{
  PK: "VULN#<uuid>",
  SK: "VULN#<uuid>",
  entityType: "Vulnerability",
  vulnCveId: string,              // e.g., "CVE-2026-1234"
  vulnSeverity: "Critical" | "High" | "Medium" | "Low",
  vulnAffectedComponent: string,
  vulnRemediationStatus: "Open" | "In Progress" | "Resolved",
  vulnResolvedDate: string,       // ISO8601, set when resolved
  GSI4PK: "COMP#<complianceId>",
  GSI4SK: "VULN#<uuid>"
}
```

### 2.3 GSI Access Patterns

| GSI | Query | Purpose |
|-----|-------|---------|
| GSI1 | `listComplianceByStatus(status)` | Compliance items filtered by status |
| GSI3 | `getComplianceByCertification(certification)` | Items by certification type |
| GSI4 | `listVulnerabilitiesByCompliance(complianceId)` | Vulnerabilities linked to a compliance item |

---

## 3. API Contracts

### 3.1 Queries

| Query | Arguments | Returns | Auth |
|-------|-----------|---------|------|
| `listComplianceByStatus(status)` | Status string | `Compliance[]` | All roles (read) |
| `getCompliance(id)` | Compliance ID | `Compliance` | All roles |
| `getComplianceByCertification(certification)` | Certification string | `Compliance[]` | All roles |
| `listVulnerabilitiesByCompliance(complianceId)` | Compliance ID | `Vulnerability[]` | All roles |

### 3.2 Mutations

| Mutation | Arguments | Returns | Auth |
|----------|-----------|---------|------|
| `createCompliance(input)` | Compliance fields | `Compliance` | Admin, Manager |
| `updateEntityStatus("Compliance", id, newStatus)` | ID, new status | `Compliance` | Admin (Approve/Deprecate), Manager (Submit) |
| `createVulnerability(input)` | Vulnerability fields | `Vulnerability` | Admin, Manager |
| `updateVulnerabilityStatus(vulnerabilityId, remediationStatus)` | ID, new status | `Vulnerability` | Admin, Manager |

---

## 4. Component Hierarchy

```
src/app/components/
├── compliance.tsx                    # Main page
│   ├── StatusFilterTabs (Approved / Pending / Deprecated)
│   ├── FilterBar
│   │   ├── CertificationFilter (dropdown)
│   │   ├── DeviceModelFilter (dropdown)
│   │   └── VulnerabilityThresholdFilter (number input)
│   ├── ComplianceItemList
│   │   └── ComplianceItem (repeated)
│   │       ├── FirmwareVersion + DeviceModel
│   │       ├── CertificationBadge
│   │       ├── StatusBadge (Approved/Pending/Deprecated)
│   │       ├── VulnerabilityCount
│   │       └── ActionButtons (Approve / Deprecate / View Vulnerabilities)
│   ├── VulnerabilityPanel (expandable)
│   │   └── VulnerabilityRow (repeated)
│   │       ├── CVE ID
│   │       ├── SeverityBadge (Critical/High/Medium/Low)
│   │       ├── AffectedComponent
│   │       ├── RemediationStatus (Open/In Progress/Resolved)
│   │       └── UpdateStatusButton
│   ├── SubmitForReviewModal (Dialog)
│   │   └── Form (firmware version, device model, certifications)
│   └── RegulatoryReportDialog
│       └── FormatSelector (CSV / JSON) + DownloadButton
```

---

## 5. Compliance Item List

### 5.1 Status Filter Tabs

Three tabs at the top of the compliance list:
- **Approved** — items with status "Approved"
- **Pending** — items awaiting review
- **Deprecated** — retired compliance items

Tab counts show the number of items in each status.

### 5.2 Additional Filters

- **Certification:** Dropdown populated from available certifications (e.g., IEC 62109, UL 1741, IEEE 1547)
- **Device Model:** Dropdown populated from device models
- **Vulnerability Threshold:** Number input — show items with vulnerability count above N

### 5.3 Status Badges

| Status | Color | Icon |
|--------|-------|------|
| Approved | Green (#10b981) | Checkmark |
| Pending | Amber (#f59e0b) | Clock |
| Deprecated | Gray (#6b7280) | Archive |

---

## 6. Vulnerability Panel

Expandable panel that shows when clicking a compliance item or the "View Vulnerabilities" button.

### 6.1 Vulnerability Table

| Column | Field |
|--------|-------|
| CVE ID | `vulnCveId` |
| Severity | `vulnSeverity` (color-coded badge) |
| Affected Component | `vulnAffectedComponent` |
| Remediation Status | `vulnRemediationStatus` |
| Resolved Date | `vulnResolvedDate` (if resolved) |

### 6.2 Severity Colors

| Severity | Color |
|----------|-------|
| Critical | Red (#ef4444) |
| High | Orange (#f97316) |
| Medium | Amber (#f59e0b) |
| Low | Blue (#3b82f6) |

### 6.3 Remediation Status Update

Admin and Manager users can change vulnerability remediation status via a dropdown:
- Open -> In Progress
- In Progress -> Resolved (auto-sets `vulnResolvedDate`)
- Viewer users see status as read-only text

---

## 7. Regulatory Report Dialog

### 7.1 Flow

1. User clicks "Generate Regulatory Report" button
2. Dialog opens with format selection: CSV or JSON
3. User selects format and clicks "Download"
4. Report is generated client-side using `report-generator.ts`
5. File downloads automatically

### 7.2 Report Contents

- All compliance items matching the current filters
- Associated vulnerability data for each item
- Generated timestamp and platform version
- Suitable for external auditor consumption

### 7.3 Export Format

- **CSV:** Flat table with compliance + vulnerability columns
- **JSON:** Structured format with compliance items containing nested vulnerability arrays

---

## 8. Role-Based Behavior

| Action | Admin | Manager | Viewer | Others |
|--------|-------|---------|--------|--------|
| View compliance items | Yes | Yes | Yes (read-only) | No |
| View vulnerabilities | Yes | Yes | Yes (read-only) | No |
| Approve compliance item | Yes | No | No | No |
| Deprecate compliance item | Yes | No | No | No |
| Submit for review | Yes | Yes | No | No |
| Update vulnerability status | Yes | Yes | No | No |
| Generate report | Yes | Yes | Yes (export only) | No |
