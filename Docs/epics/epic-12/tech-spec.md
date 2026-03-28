# Epic 12: SBOM & Supply Chain Security — Technical Specification

**Epic:** Epic 12 — SBOM & Supply Chain Security
**Brief Reference:** Section 12 Planned Epics
**Status:** POC — Fresh Build

---

## 1. Overview

This epic introduces Software Bill of Materials (SBOM) management to the platform. Users can upload SBOM files in CycloneDX or SPDX format, the system parses them to extract software components, matches components against known CVE databases, provides a component explorer for browsing dependencies, and enforces license compliance policies. This is a critical supply chain security capability.

---

## 2. Data Model

### 2.1 New Entity: SBOM

```typescript
{
  PK: "SBOM#<uuid>",
  SK: "SBOM#<uuid>",
  entityType: "SBOM",
  firmwareId: string,                // FW#<id> — which firmware this SBOM belongs to
  format: "CycloneDX" | "SPDX",
  specVersion: string,               // e.g., "1.5" (CycloneDX) or "2.3" (SPDX)
  componentCount: number,            // Total number of components extracted
  vulnerabilityCount: number,        // Total known CVEs matched
  licenseCount: number,              // Distinct licenses found
  criticalVulnCount: number,         // Critical severity CVEs
  highVulnCount: number,             // High severity CVEs
  uploadedBy: string,                // USER#<id>
  uploadedDate: string,              // ISO8601
  s3Key: string,                     // S3 location of raw SBOM file
  status: "Processing" | "Complete" | "Error",
  createdAt: string,                 // ISO8601

  // GSI Keys
  GSI1PK: "SBOM",
  GSI1SK: "<status>#<timestamp>",
  GSI4PK: "FW#<firmwareId>",          // Links SBOM to firmware
  GSI4SK: "SBOM#<uuid>"
}
```

### 2.2 New Entity: SBOMComponent

```typescript
{
  PK: "SCOMP#<uuid>",
  SK: "SCOMP#<uuid>",
  entityType: "SBOMComponent",
  sbomId: string,                     // SBOM#<id> — parent SBOM
  name: string,                       // e.g., "openssl"
  version: string,                    // e.g., "3.1.0"
  purl: string,                       // Package URL: "pkg:npm/openssl@3.1.0"
  supplier: string,                   // Organization or author
  license: string,                    // SPDX license identifier: "Apache-2.0"
  licenseCompliant: boolean,          // true if license is in approved list
  vulnerabilityCount: number,         // Known CVEs for this component+version
  scope: "required" | "optional" | "excluded",

  // GSI Keys
  GSI1PK: "SBOM_COMPONENT",
  GSI1SK: "<license>#<name>",         // List by license type
  GSI4PK: "SBOM#<sbomId>",            // Links component to SBOM
  GSI4SK: "SCOMP#<uuid>"
}
```

### 2.3 New Entity: ComponentVulnerability

```typescript
{
  PK: "CVULN#<uuid>",
  SK: "CVULN#<uuid>",
  entityType: "ComponentVulnerability",
  componentId: string,                // SCOMP#<id>
  sbomId: string,                     // SBOM#<id>
  cveId: string,                      // "CVE-2026-1234"
  severity: "Critical" | "High" | "Medium" | "Low",
  cvssScore: number,                  // 0.0 - 10.0
  description: string,               // CVE description
  publishedDate: string,              // ISO8601
  remediationStatus: "Open" | "In Progress" | "Mitigated" | "Resolved",
  remediationNotes: string,
  affectedVersionRange: string,       // e.g., ">=3.0.0 <3.1.1"
  fixedVersion: string,               // e.g., "3.1.1"

  // GSI Keys
  GSI1PK: "COMP_VULN",
  GSI1SK: "<severity>#<cveId>",        // List by severity
  GSI4PK: "SCOMP#<componentId>",       // Vulns for a component
  GSI4SK: "CVULN#<uuid>"
}
```

### 2.4 License Policy (Configuration — stored in DynamoDB or static config)

```typescript
{
  PK: "CONFIG#LICENSE_POLICY",
  SK: "CONFIG#LICENSE_POLICY",
  entityType: "Config",
  approvedLicenses: [
    "Apache-2.0", "MIT", "BSD-2-Clause", "BSD-3-Clause", "ISC", "MPL-2.0"
  ],
  restrictedLicenses: [
    "GPL-2.0-only", "GPL-3.0-only", "AGPL-3.0-only"
  ],
  unknownLicensePolicy: "flag",  // "flag" | "block" | "allow"
}
```

---

## 3. API Contracts

### 3.1 Mutations

```graphql
# Upload and parse an SBOM file
mutation uploadSBOM(
  $firmwareId: String!,
  $format: String!,          # "CycloneDX" or "SPDX"
  $s3Key: String!,
  $uploadedBy: String!
): SBOM!

# Trigger CVE matching for an SBOM (async — Lambda)
mutation triggerCVEMatching($sbomId: String!): SBOM!

# Update component vulnerability remediation status
mutation updateComponentVulnStatus(
  $cvulnId: String!,
  $remediationStatus: String!,
  $remediationNotes: String
): ComponentVulnerability!
```

### 3.2 Queries

```graphql
# List all SBOMs for a firmware
query listSBOMsByFirmware($firmwareId: String!): [SBOM]
# Uses GSI4: GSI4PK = "FW#<firmwareId>", begins_with(GSI4SK, "SBOM#")

# Get SBOM with full details
query getSBOM($id: String!): SBOM

# List components in an SBOM
query listSBOMComponents($sbomId: String!): [SBOMComponent]
# Uses GSI4: GSI4PK = "SBOM#<sbomId>", begins_with(GSI4SK, "SCOMP#")

# List vulnerabilities for a component
query listComponentVulnerabilities($componentId: String!): [ComponentVulnerability]
# Uses GSI4: GSI4PK = "SCOMP#<componentId>", begins_with(GSI4SK, "CVULN#")

# List all component vulnerabilities by severity
query listVulnsBySeverity($severity: String!): [ComponentVulnerability]
# Uses GSI1: GSI1PK = "COMP_VULN", begins_with(GSI1SK, "<severity>#")

# Search components (future: OpenSearch)
query searchComponents($query: String!): [SBOMComponent]
```

---

## 4. SBOM Parsing (Lambda)

### 4.1 Lambda: SBOM Parser

| Setting | Value |
|---|---|
| Function Name | `ims-gen2-sbom-parser` |
| Runtime | Node.js 20.x |
| Memory | 512 MB |
| Timeout | 120 seconds |
| Trigger | Invoked by `uploadSBOM` mutation (async invoke) |

### 4.2 CycloneDX Parsing

```typescript
// CycloneDX JSON format (1.5)
interface CycloneDXBom {
  bomFormat: "CycloneDX";
  specVersion: string;
  components: Array<{
    type: "library" | "framework" | "application";
    name: string;
    version: string;
    purl?: string;
    licenses?: Array<{ license: { id?: string; name?: string } }>;
    supplier?: { name: string };
  }>;
  vulnerabilities?: Array<{
    id: string;
    source?: { name: string };
    ratings?: Array<{ severity: string; score: number }>;
    affects?: Array<{ ref: string }>;
    description?: string;
  }>;
}

function parseCycloneDX(raw: string): ParsedSBOM {
  const bom: CycloneDXBom = JSON.parse(raw);
  return {
    format: "CycloneDX",
    specVersion: bom.specVersion,
    components: bom.components.map(c => ({
      name: c.name,
      version: c.version,
      purl: c.purl || `pkg:generic/${c.name}@${c.version}`,
      license: c.licenses?.[0]?.license?.id || "UNKNOWN",
      supplier: c.supplier?.name || "Unknown",
    })),
    vulnerabilities: bom.vulnerabilities || [],
  };
}
```

### 4.3 SPDX Parsing

```typescript
// SPDX JSON format (2.3)
interface SPDXDocument {
  spdxVersion: string;
  packages: Array<{
    name: string;
    versionInfo: string;
    downloadLocation: string;
    licenseConcluded: string;
    supplier?: string;
    externalRefs?: Array<{
      referenceCategory: string;
      referenceType: string;
      referenceLocator: string;  // purl
    }>;
  }>;
}

function parseSPDX(raw: string): ParsedSBOM {
  const doc: SPDXDocument = JSON.parse(raw);
  return {
    format: "SPDX",
    specVersion: doc.spdxVersion.replace("SPDX-", ""),
    components: doc.packages.map(p => ({
      name: p.name,
      version: p.versionInfo,
      purl: p.externalRefs?.find(r => r.referenceType === "purl")?.referenceLocator
            || `pkg:generic/${p.name}@${p.versionInfo}`,
      license: p.licenseConcluded,
      supplier: p.supplier || "Unknown",
    })),
    vulnerabilities: [],
  };
}
```

### 4.4 CVE Matching Strategy

For the POC, CVE matching is done via a static/seed CVE database stored in DynamoDB or a JSON file:

```typescript
// Seed CVE database (expandable)
const CVE_DATABASE: CVEEntry[] = [
  {
    cveId: "CVE-2026-0001",
    affectedPackage: "openssl",
    affectedVersionRange: ">=3.0.0 <3.1.1",
    fixedVersion: "3.1.1",
    severity: "Critical",
    cvssScore: 9.8,
    description: "Remote code execution via buffer overflow in TLS handshake",
  },
  // ... more entries
];

function matchCVEs(component: ParsedComponent): CVEEntry[] {
  return CVE_DATABASE.filter(cve =>
    cve.affectedPackage === component.name &&
    semver.satisfies(component.version, cve.affectedVersionRange)
  );
}
```

Future: Integrate with NVD API or OSV.dev for real-time CVE data.

---

## 5. Component Hierarchy

```
DeploymentPage or dedicated SBOMPage (/deployment?tab=sbom or /sbom)
├── Tab: SBOM Management
│   ├── UploadSBOMModal
│   │   ├── FirmwareSelector (dropdown — select firmware to attach SBOM)
│   │   ├── FormatSelector (CycloneDX / SPDX)
│   │   ├── FileUpload (drag-and-drop zone for .json/.xml file)
│   │   └── UploadButton
│   ├── SBOMList
│   │   └── SBOMCard (per SBOM)
│   │       ├── FirmwareName + Version
│   │       ├── Format badge (CycloneDX / SPDX)
│   │       ├── Stats: X components, Y vulnerabilities
│   │       ├── Severity summary bar (Critical/High/Medium/Low stacked)
│   │       ├── Status badge (Processing/Complete/Error)
│   │       └── "View Details" button
│   └── SBOMFilters (firmware model, status)
├── Tab: Component Explorer
│   └── ComponentExplorerPanel
│       ├── SearchBar (filter components by name)
│       ├── ComponentTable
│       │   ├── Column: Component Name
│       │   ├── Column: Version
│       │   ├── Column: License (badge, red if non-compliant)
│       │   ├── Column: Supplier
│       │   ├── Column: Vulnerabilities (count badge with severity color)
│       │   └── Column: Scope (required/optional)
│       ├── ComponentDetailPanel (expandable row or side panel)
│       │   ├── Package URL (purl)
│       │   ├── License details + compliance status
│       │   └── VulnerabilityList for this component
│       └── LicenseFilterPills (All, Apache-2.0, MIT, GPL, Unknown)
├── Tab: CVE Dashboard
│   └── CVEDashboardPanel
│       ├── SeveritySummaryCards (Critical: X, High: Y, Medium: Z, Low: W)
│       ├── CVETable
│       │   ├── Column: CVE ID (link to NVD)
│       │   ├── Column: Severity (badge)
│       │   ├── Column: CVSS Score
│       │   ├── Column: Affected Component + Version
│       │   ├── Column: Fixed Version
│       │   ├── Column: Remediation Status
│       │   └── Column: Actions (Update Status)
│       └── CVEFilters (severity, remediation status)
└── Tab: License Compliance
    └── LicenseCompliancePanel
        ├── PolicyStatusCard (X approved, Y restricted, Z unknown)
        ├── LicenseDistributionPie (Recharts PieChart)
        ├── NonCompliantComponentsList
        │   └── Row: Component name, version, license, firmware, action needed
        └── ExportButton (compliance report CSV)
```

---

## 6. SBOM Upload Flow

```
1. User selects firmware from dropdown
2. User selects format (CycloneDX or SPDX)
3. User uploads SBOM JSON file
4. Frontend uploads file to S3 (presigned URL)
5. Frontend calls uploadSBOM mutation
6. Mutation creates SBOM record (status = "Processing")
7. Mutation invokes sbom-parser Lambda (async)
8. Lambda:
   a. Reads SBOM file from S3
   b. Parses components (CycloneDX or SPDX)
   c. Writes SBOMComponent records to DynamoDB
   d. Matches components against CVE database
   e. Writes ComponentVulnerability records to DynamoDB
   f. Checks license compliance against policy
   g. Updates SBOM record: componentCount, vulnerabilityCount, status = "Complete"
9. Frontend polls SBOM status or receives notification when processing completes
```

---

## 7. Access Control

| Role | Upload SBOM | View Components | View CVEs | Update Vuln Status | License Reports |
|---|---|---|---|---|---|
| Admin | Yes | Yes | Yes | Yes | Yes |
| Manager | Yes | Yes | Yes | Yes | Yes |
| Technician | No | No | No | No | No |
| Viewer | No | Yes (read-only) | Yes (read-only) | No | Export only |
| CustomerAdmin | No | No | No | No | No |

---

## 8. OpenSearch Integration (Future — Epic 18)

When OpenSearch is available:

```typescript
// Full-text search across component names, CVE descriptions, license text
searchComponents("openssl 3.1") → fuzzy match on SBOMComponent name + version
searchVulnerabilities("buffer overflow") → match on CVE descriptions
```

The `SBOMComponent` and `ComponentVulnerability` entities are automatically indexed via the OSIS pipeline (single-table design).

---

## 9. Terraform Resources

```hcl
# Lambda for SBOM parsing
resource "aws_lambda_function" "sbom_parser" {
  function_name = "ims-gen2-sbom-parser"
  runtime       = "nodejs20.x"
  handler       = "index.handler"
  memory_size   = 512
  timeout       = 120
  # ... role, environment variables
}

# S3 bucket path for SBOM files (reuse firmware bucket or separate)
# SBOM files stored at: s3://firmware-bucket/sbom/{firmwareId}/{sbomId}.json
```

---

## 10. Performance Considerations

| Concern | Mitigation |
|---|---|
| Large SBOM files (1000+ components) | Lambda async processing, status polling on frontend |
| CVE matching at scale | Seed database for POC; future: batch NVD API calls with caching |
| Component table rendering | Virtual scrolling for large component lists, pagination (25/page) |
| SBOM parsing timeout | 120s Lambda timeout; files >10MB rejected at upload |
