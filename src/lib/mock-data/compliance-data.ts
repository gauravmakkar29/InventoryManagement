export type ComplianceStatus =
  | "Approved"
  | "Pending"
  | "In Review"
  | "Deprecated"
  | "Non-Compliant";
export type CertificationType =
  | "NIST 800-53"
  | "IEC 62443"
  | "SOC 2"
  | "ISO 27001"
  | "NERC CIP"
  | "UL 1741";
export type VulnSeverity = "Critical" | "High" | "Medium" | "Low" | "Info";
export type RemediationStatus = "Open" | "In Progress" | "Resolved";
export type ReportType = "NIST 800-53" | "IEC 62443" | "SOC 2" | "ISO 27001";

export interface Vulnerability {
  id: string;
  cveId: string;
  title: string;
  severity: VulnSeverity;
  cvssScore: number;
  affectedDevices: number;
  patchAvailable: boolean;
  description: string;
  remediationStatus: RemediationStatus;
  resolvedDate: string | null;
}

export interface ComplianceItem {
  id: string;
  name: string;
  certType: CertificationType;
  status: ComplianceStatus;
  lastAudit: string;
  nextAudit: string;
  findings: number;
  assignedTo: string;
  vulnerabilities: Vulnerability[];
}

export const MOCK_VULNERABILITIES: Vulnerability[] = [
  {
    id: "v1",
    cveId: "CVE-2026-4821",
    title: "Remote code execution in firmware update handler",
    severity: "Critical",
    cvssScore: 9.8,
    affectedDevices: 623,
    patchAvailable: true,
    description: "Buffer overflow in OTA update parsing allows arbitrary code execution.",
    remediationStatus: "In Progress",
    resolvedDate: null,
  },
  {
    id: "v2",
    cveId: "CVE-2026-3917",
    title: "Authentication bypass in management API",
    severity: "Critical",
    cvssScore: 9.1,
    affectedDevices: 45,
    patchAvailable: false,
    description: "Missing auth check on admin endpoints allows unauthenticated access.",
    remediationStatus: "Open",
    resolvedDate: null,
  },
  {
    id: "v3",
    cveId: "CVE-2026-2205",
    title: "Privilege escalation via SNMP community string",
    severity: "High",
    cvssScore: 8.4,
    affectedDevices: 312,
    patchAvailable: true,
    description: "Default SNMP community strings allow privilege escalation.",
    remediationStatus: "Open",
    resolvedDate: null,
  },
  {
    id: "v4",
    cveId: "CVE-2026-1893",
    title: "TLS certificate validation bypass",
    severity: "High",
    cvssScore: 7.5,
    affectedDevices: 890,
    patchAvailable: true,
    description: "Improper certificate validation allows MITM attacks.",
    remediationStatus: "Resolved",
    resolvedDate: "2026-03-15",
  },
  {
    id: "v5",
    cveId: "CVE-2025-9981",
    title: "Information disclosure via debug endpoint",
    severity: "Medium",
    cvssScore: 5.3,
    affectedDevices: 1200,
    patchAvailable: true,
    description: "Debug endpoint leaks internal configuration data.",
    remediationStatus: "Resolved",
    resolvedDate: "2026-02-20",
  },
  {
    id: "v6",
    cveId: "CVE-2026-0447",
    title: "Cross-site scripting in device dashboard",
    severity: "Medium",
    cvssScore: 4.7,
    affectedDevices: 156,
    patchAvailable: false,
    description: "Reflected XSS via device name parameter.",
    remediationStatus: "Open",
    resolvedDate: null,
  },
  {
    id: "v7",
    cveId: "CVE-2025-8834",
    title: "Denial of service via malformed MQTT packet",
    severity: "Low",
    cvssScore: 3.1,
    affectedDevices: 78,
    patchAvailable: true,
    description: "Malformed MQTT packets cause service restart.",
    remediationStatus: "In Progress",
    resolvedDate: null,
  },
  {
    id: "v8",
    cveId: "CVE-2026-0112",
    title: "Verbose error messages expose stack traces",
    severity: "Info",
    cvssScore: 2.0,
    affectedDevices: 2400,
    patchAvailable: true,
    description: "Stack traces in error responses reveal internal paths.",
    remediationStatus: "Open",
    resolvedDate: null,
  },
];

function vuln(index: number): Vulnerability {
  return MOCK_VULNERABILITIES[index]!;
}

export const MOCK_COMPLIANCE: ComplianceItem[] = [
  {
    id: "CMP-001",
    name: "NIST 800-53 Rev5 — Access Control",
    certType: "NIST 800-53",
    status: "Approved",
    lastAudit: "Feb 15, 2026",
    nextAudit: "Aug 15, 2026",
    findings: 0,
    assignedTo: "Lisa Chen",
    vulnerabilities: [vuln(4)],
  },
  {
    id: "CMP-002",
    name: "IEC 62443 — Network Segmentation",
    certType: "IEC 62443",
    status: "Pending",
    lastAudit: "Jan 20, 2026",
    nextAudit: "Jul 20, 2026",
    findings: 3,
    assignedTo: "Raj Patel",
    vulnerabilities: [vuln(2), vuln(5)],
  },
  {
    id: "CMP-003",
    name: "NERC CIP-007 — System Security Management",
    certType: "NERC CIP",
    status: "Approved",
    lastAudit: "Mar 01, 2026",
    nextAudit: "Sep 01, 2026",
    findings: 1,
    assignedTo: "Sarah Kim",
    vulnerabilities: [vuln(6)],
  },
  {
    id: "CMP-004",
    name: "SOC 2 Type II — Data Protection",
    certType: "SOC 2",
    status: "Deprecated",
    lastAudit: "Nov 10, 2025",
    nextAudit: "N/A",
    findings: 5,
    assignedTo: "Mike Torres",
    vulnerabilities: [vuln(0), vuln(1)],
  },
  {
    id: "CMP-005",
    name: "ISO 27001 — Information Security Management",
    certType: "ISO 27001",
    status: "Approved",
    lastAudit: "Dec 05, 2025",
    nextAudit: "Jun 05, 2026",
    findings: 2,
    assignedTo: "Lisa Chen",
    vulnerabilities: [vuln(3)],
  },
  {
    id: "CMP-006",
    name: "UL 1741 — Inverter Safety Certification",
    certType: "UL 1741",
    status: "Pending",
    lastAudit: "Mar 10, 2026",
    nextAudit: "Sep 10, 2026",
    findings: 0,
    assignedTo: "Raj Patel",
    vulnerabilities: [],
  },
  {
    id: "CMP-007",
    name: "NIST 800-53 Rev5 — Audit & Accountability",
    certType: "NIST 800-53",
    status: "Non-Compliant",
    lastAudit: "Feb 28, 2026",
    nextAudit: "May 28, 2026",
    findings: 7,
    assignedTo: "Sarah Kim",
    vulnerabilities: [vuln(0), vuln(2), vuln(5)],
  },
  {
    id: "CMP-008",
    name: "IEC 62443 — Component Security",
    certType: "IEC 62443",
    status: "In Review",
    lastAudit: "Mar 15, 2026",
    nextAudit: "Sep 15, 2026",
    findings: 1,
    assignedTo: "Mike Torres",
    vulnerabilities: [vuln(7)],
  },
  {
    id: "CMP-009",
    name: "SOC 2 Type II — Availability Controls",
    certType: "SOC 2",
    status: "Approved",
    lastAudit: "Jan 05, 2026",
    nextAudit: "Jul 05, 2026",
    findings: 0,
    assignedTo: "Lisa Chen",
    vulnerabilities: [],
  },
  {
    id: "CMP-010",
    name: "NERC CIP-013 — Supply Chain Risk Management",
    certType: "NERC CIP",
    status: "Pending",
    lastAudit: "Mar 20, 2026",
    nextAudit: "Sep 20, 2026",
    findings: 4,
    assignedTo: "Raj Patel",
    vulnerabilities: [vuln(1), vuln(3)],
  },
];

export const CERT_TYPES: CertificationType[] = [
  "NIST 800-53",
  "IEC 62443",
  "SOC 2",
  "ISO 27001",
  "NERC CIP",
  "UL 1741",
];

export const REPORT_TYPES: ReportType[] = ["NIST 800-53", "IEC 62443", "SOC 2", "ISO 27001"];

// =============================================================================
// Report Generation Utilities
// =============================================================================

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateCSV(items: ComplianceItem[]): string {
  const headers = [
    "ID",
    "Name",
    "Certification Type",
    "Status",
    "Last Audit",
    "Next Audit",
    "Findings",
    "Assigned To",
    "CVE ID",
    "Vulnerability Title",
    "Severity",
    "CVSS Score",
    "Affected Devices",
    "Patch Available",
    "Remediation Status",
  ];
  const rows: string[] = [headers.join(",")];

  for (const item of items) {
    if (item.vulnerabilities.length === 0) {
      rows.push(
        [
          item.id,
          `"${item.name}"`,
          item.certType,
          item.status,
          item.lastAudit,
          item.nextAudit,
          String(item.findings),
          item.assignedTo,
          "",
          "",
          "",
          "",
          "",
          "",
          "",
        ].join(","),
      );
    } else {
      for (const v of item.vulnerabilities) {
        rows.push(
          [
            item.id,
            `"${item.name}"`,
            item.certType,
            item.status,
            item.lastAudit,
            item.nextAudit,
            String(item.findings),
            item.assignedTo,
            v.cveId,
            `"${v.title}"`,
            v.severity,
            String(v.cvssScore),
            String(v.affectedDevices),
            v.patchAvailable ? "Yes" : "No",
            v.remediationStatus,
          ].join(","),
        );
      }
    }
  }

  return rows.join("\n");
}

export function generateJSON(items: ComplianceItem[]): string {
  const report = {
    generatedAt: new Date().toISOString(),
    platform: "IMS Gen2",
    totalComplianceItems: items.length,
    totalVulnerabilities: items.reduce((acc, i) => acc + i.vulnerabilities.length, 0),
    complianceItems: items.map((item) => ({
      id: item.id,
      name: item.name,
      certificationType: item.certType,
      status: item.status,
      lastAudit: item.lastAudit,
      nextAudit: item.nextAudit,
      findings: item.findings,
      assignedTo: item.assignedTo,
      vulnerabilities: item.vulnerabilities.map((v) => ({
        cveId: v.cveId,
        title: v.title,
        severity: v.severity,
        cvssScore: v.cvssScore,
        affectedDevices: v.affectedDevices,
        patchAvailable: v.patchAvailable,
        remediationStatus: v.remediationStatus,
        resolvedDate: v.resolvedDate,
      })),
    })),
  };
  return JSON.stringify(report, null, 2);
}
