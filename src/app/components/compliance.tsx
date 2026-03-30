import { useState, useMemo, useCallback } from "react";
import {
  Search,
  Shield,
  ShieldCheck,
  ShieldX,
  Clock,
  Archive,
  AlertTriangle,
  Bug,
  FileText,
  Download,
  Plus,
  Send,
  ChevronDown,
  ChevronRight,
  X,
  Filter,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../lib/utils";
import { useAuth } from "../../lib/use-auth";
import { getPrimaryRole } from "../../lib/rbac";
import type { Role } from "../../lib/rbac";

// =============================================================================
// Types
// =============================================================================

type Tab = "compliance" | "vulnerabilities" | "reports";

type ComplianceStatus = "Approved" | "Pending" | "In Review" | "Deprecated" | "Non-Compliant";
type CertificationType =
  | "NIST 800-53"
  | "IEC 62443"
  | "SOC 2"
  | "ISO 27001"
  | "NERC CIP"
  | "UL 1741";
type VulnSeverity = "Critical" | "High" | "Medium" | "Low" | "Info";
type RemediationStatus = "Open" | "In Progress" | "Resolved";
type ReportType = "NIST 800-53" | "IEC 62443" | "SOC 2" | "ISO 27001";

interface ComplianceItem {
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

interface Vulnerability {
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

// =============================================================================
// Mock Data
// =============================================================================

const MOCK_VULNERABILITIES: Vulnerability[] = [
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

// Helper to safely access mock vulns array
function vuln(index: number): Vulnerability {
  return MOCK_VULNERABILITIES[index]!;
}

const MOCK_COMPLIANCE: ComplianceItem[] = [
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

const CERT_TYPES: CertificationType[] = [
  "NIST 800-53",
  "IEC 62443",
  "SOC 2",
  "ISO 27001",
  "NERC CIP",
  "UL 1741",
];
const REPORT_TYPES: ReportType[] = ["NIST 800-53", "IEC 62443", "SOC 2", "ISO 27001"];

// =============================================================================
// Status + Severity Styling
// =============================================================================

const STATUS_CONFIG: Record<ComplianceStatus, { bg: string; text: string; icon: typeof Shield }> = {
  Approved: { bg: "bg-emerald-50", text: "text-emerald-700", icon: ShieldCheck },
  Pending: { bg: "bg-amber-50", text: "text-amber-700", icon: Clock },
  "In Review": { bg: "bg-blue-50", text: "text-blue-700", icon: Shield },
  Deprecated: { bg: "bg-gray-100", text: "text-gray-500", icon: Archive },
  "Non-Compliant": { bg: "bg-red-50", text: "text-red-700", icon: ShieldX },
};

const SEVERITY_CONFIG: Record<VulnSeverity, { bg: string; text: string; border: string }> = {
  Critical: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  High: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  Medium: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  Low: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  Info: { bg: "bg-gray-50", text: "text-gray-500", border: "border-gray-200" },
};

const REMEDIATION_STYLES: Record<RemediationStatus, string> = {
  Open: "bg-red-50 text-red-700",
  "In Progress": "bg-amber-50 text-amber-700",
  Resolved: "bg-emerald-50 text-emerald-700",
};

// =============================================================================
// Helper: Role Checks
// =============================================================================

function canSubmitForReview(role: Role): boolean {
  return role === "Admin" || role === "Manager";
}

function canApprove(role: Role): boolean {
  return role === "Admin";
}

function canDeprecate(role: Role): boolean {
  return role === "Admin" || role === "Manager";
}

function canCreateVulnerability(role: Role): boolean {
  return role === "Admin" || role === "Manager";
}

function canUpdateRemediation(role: Role): boolean {
  return role === "Admin" || role === "Manager";
}

// =============================================================================
// Helper: Report Generation
// =============================================================================

function downloadFile(content: string, filename: string, mimeType: string): void {
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

function generateCSV(items: ComplianceItem[]): string {
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
      for (const vuln of item.vulnerabilities) {
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
            vuln.cveId,
            `"${vuln.title}"`,
            vuln.severity,
            String(vuln.cvssScore),
            String(vuln.affectedDevices),
            vuln.patchAvailable ? "Yes" : "No",
            vuln.remediationStatus,
          ].join(","),
        );
      }
    }
  }

  return rows.join("\n");
}

function generateJSON(items: ComplianceItem[]): string {
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

// =============================================================================
// Main Component
// =============================================================================

export function CompliancePage() {
  const { groups } = useAuth();
  const role = getPrimaryRole(groups);

  // Tab state
  const [activeTab, setActiveTab] = useState<Tab>("compliance");

  // Compliance filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ComplianceStatus | "All">("All");
  const [certFilter, setCertFilter] = useState<CertificationType | "All">("All");

  // Compliance data (mutable for optimistic updates)
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>(MOCK_COMPLIANCE);
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>(MOCK_VULNERABILITIES);

  // Expanded vulnerability panel
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // Modals
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [vulnModalOpen, setVulnModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: "approve" | "deprecate";
    itemId: string;
  } | null>(null);

  // ---------------------------------------------------------------------------
  // Filtered compliance items
  // ---------------------------------------------------------------------------
  const filteredItems = useMemo(() => {
    let items = complianceItems;
    if (statusFilter !== "All") {
      items = items.filter((i) => i.status === statusFilter);
    }
    if (certFilter !== "All") {
      items = items.filter((i) => i.certType === certFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.id.toLowerCase().includes(q) ||
          i.assignedTo.toLowerCase().includes(q),
      );
    }
    return items;
  }, [complianceItems, statusFilter, certFilter, search]);

  // Status counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { All: complianceItems.length };
    for (const item of complianceItems) {
      counts[item.status] = (counts[item.status] || 0) + 1;
    }
    return counts;
  }, [complianceItems]);

  // Sorted vulnerabilities for the Vulnerabilities tab
  const sortedVulnerabilities = useMemo(
    () => [...vulnerabilities].sort((a, b) => b.cvssScore - a.cvssScore),
    [vulnerabilities],
  );

  // ---------------------------------------------------------------------------
  // Compliance actions
  // ---------------------------------------------------------------------------
  const handleSubmitForReview = useCallback((itemId: string) => {
    setComplianceItems((prev) =>
      prev.map((item) =>
        item.id === itemId && item.status === "Pending"
          ? { ...item, status: "In Review" as ComplianceStatus }
          : item,
      ),
    );
    toast.success("Compliance item submitted for review");
  }, []);

  const handleApprove = useCallback((itemId: string) => {
    setComplianceItems((prev) =>
      prev.map((item) =>
        item.id === itemId && item.status === "In Review"
          ? { ...item, status: "Approved" as ComplianceStatus }
          : item,
      ),
    );
    setConfirmAction(null);
    toast.success("Compliance item approved");
  }, []);

  const handleDeprecate = useCallback((itemId: string) => {
    setComplianceItems((prev) =>
      prev.map((item) =>
        item.id === itemId && (item.status === "Approved" || item.status === "Pending")
          ? { ...item, status: "Deprecated" as ComplianceStatus }
          : item,
      ),
    );
    setConfirmAction(null);
    toast.success("Compliance item deprecated");
  }, []);

  const handleRemediationChange = useCallback((vulnId: string, newStatus: RemediationStatus) => {
    const resolvedDate: string | null =
      newStatus === "Resolved" ? (new Date().toISOString().split("T")[0] ?? null) : null;
    const patch = { remediationStatus: newStatus, resolvedDate };
    setVulnerabilities((prev) =>
      prev.map((v): Vulnerability => (v.id === vulnId ? { ...v, ...patch } : v)),
    );
    // Also update within compliance items
    setComplianceItems((prev) =>
      prev.map(
        (item): ComplianceItem => ({
          ...item,
          vulnerabilities: item.vulnerabilities.map(
            (v): Vulnerability => (v.id === vulnId ? { ...v, ...patch } : v),
          ),
        }),
      ),
    );
    toast.success(`Vulnerability status updated to ${newStatus}`);
  }, []);

  // ---------------------------------------------------------------------------
  // Tabs
  // ---------------------------------------------------------------------------
  const TABS: { id: Tab; label: string; icon: typeof Shield }[] = [
    { id: "compliance", label: "Compliance Items", icon: ShieldCheck },
    { id: "vulnerabilities", label: "Vulnerabilities", icon: Bug },
    { id: "reports", label: "Reports", icon: BarChart3 },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[15px] font-bold text-gray-900">Compliance & Vulnerability</h1>
        <div className="flex items-center gap-2">
          {canSubmitForReview(role) && (
            <button
              onClick={() => setSubmitModalOpen(true)}
              className="flex items-center gap-1.5 rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-[#FF7900]/50 hover:text-gray-900 transition-colors duration-150"
            >
              <Send className="h-3.5 w-3.5" />
              Submit for Review
            </button>
          )}
          <button
            onClick={() => setReportModalOpen(true)}
            className="flex items-center gap-1.5 rounded bg-[#FF7900] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#e06d00] transition-colors duration-150"
          >
            <FileText className="h-3.5 w-3.5" />
            Generate Report
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium cursor-pointer transition-colors",
              activeTab === tab.id
                ? "border-b-2 border-[#FF7900] text-[#FF7900]"
                : "text-gray-500 hover:text-gray-700",
            )}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* === Compliance Items Tab === */}
      {activeTab === "compliance" && (
        <ComplianceTab
          items={filteredItems}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          certFilter={certFilter}
          setCertFilter={setCertFilter}
          search={search}
          setSearch={setSearch}
          statusCounts={statusCounts}
          expandedItemId={expandedItemId}
          setExpandedItemId={setExpandedItemId}
          role={role}
          onSubmitForReview={handleSubmitForReview}
          onApprove={(id) => setConfirmAction({ type: "approve", itemId: id })}
          onDeprecate={(id) => setConfirmAction({ type: "deprecate", itemId: id })}
          onRemediationChange={handleRemediationChange}
        />
      )}

      {/* === Vulnerabilities Tab === */}
      {activeTab === "vulnerabilities" && (
        <VulnerabilitiesTab
          vulnerabilities={sortedVulnerabilities}
          role={role}
          onCreateVuln={() => setVulnModalOpen(true)}
        />
      )}

      {/* === Reports Tab === */}
      {activeTab === "reports" && <ReportsTab items={filteredItems} allItems={complianceItems} />}

      {/* Modals */}
      {submitModalOpen && (
        <SubmitForReviewModal
          onClose={() => setSubmitModalOpen(false)}
          onSubmit={(data) => {
            const newItem: ComplianceItem = {
              id: `CMP-${String(complianceItems.length + 1).padStart(3, "0")}`,
              name: `${data.certification} — ${data.deviceModel}`,
              certType: data.certification as CertificationType,
              status: "Pending",
              lastAudit: new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "2-digit",
                year: "numeric",
              }),
              nextAudit: "TBD",
              findings: 0,
              assignedTo: "Unassigned",
              vulnerabilities: [],
            };
            setComplianceItems((prev) => [newItem, ...prev]);
            setSubmitModalOpen(false);
            toast.success("Compliance item submitted for review");
          }}
        />
      )}

      {vulnModalOpen && (
        <CreateVulnerabilityModal
          onClose={() => setVulnModalOpen(false)}
          onSubmit={(data) => {
            const newVuln: Vulnerability = {
              id: `v${vulnerabilities.length + 1}`,
              cveId: data.cveId,
              title: data.title,
              severity: data.severity,
              cvssScore: data.cvssScore,
              affectedDevices: data.affectedDevices,
              patchAvailable: data.patchAvailable,
              description: data.description,
              remediationStatus: "Open",
              resolvedDate: null,
            };
            setVulnerabilities((prev) => [newVuln, ...prev]);
            setVulnModalOpen(false);
            toast.success("Vulnerability record created");
          }}
        />
      )}

      {reportModalOpen && (
        <ReportModal items={complianceItems} onClose={() => setReportModalOpen(false)} />
      )}

      {confirmAction && (
        <ConfirmDialog
          title={
            confirmAction.type === "approve"
              ? "Approve Compliance Item"
              : "Deprecate Compliance Item"
          }
          message={
            confirmAction.type === "approve"
              ? "Approve this compliance item? It will be marked as compliant."
              : "Deprecate this compliance item? It will no longer be considered current."
          }
          confirmLabel={confirmAction.type === "approve" ? "Approve" : "Deprecate"}
          confirmClass={
            confirmAction.type === "approve"
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "bg-amber-600 hover:bg-amber-700"
          }
          onConfirm={() => {
            if (confirmAction.type === "approve") {
              handleApprove(confirmAction.itemId);
            } else {
              handleDeprecate(confirmAction.itemId);
            }
          }}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}

// =============================================================================
// Compliance Tab
// =============================================================================

interface ComplianceTabProps {
  items: ComplianceItem[];
  statusFilter: ComplianceStatus | "All";
  setStatusFilter: (s: ComplianceStatus | "All") => void;
  certFilter: CertificationType | "All";
  setCertFilter: (c: CertificationType | "All") => void;
  search: string;
  setSearch: (s: string) => void;
  statusCounts: Record<string, number>;
  expandedItemId: string | null;
  setExpandedItemId: (id: string | null) => void;
  role: Role;
  onSubmitForReview: (id: string) => void;
  onApprove: (id: string) => void;
  onDeprecate: (id: string) => void;
  onRemediationChange: (vulnId: string, status: RemediationStatus) => void;
}

function ComplianceTab({
  items,
  statusFilter,
  setStatusFilter,
  certFilter,
  setCertFilter,
  search,
  setSearch,
  statusCounts,
  expandedItemId,
  setExpandedItemId,
  role,
  onSubmitForReview,
  onApprove,
  onDeprecate,
  onRemediationChange,
}: ComplianceTabProps) {
  const STATUS_FILTERS: (ComplianceStatus | "All")[] = [
    "All",
    "Approved",
    "Pending",
    "In Review",
    "Deprecated",
    "Non-Compliant",
  ];

  return (
    <div className="space-y-3">
      {/* Status filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "rounded-full px-3 py-1 text-[11px] font-medium transition-colors duration-150",
              statusFilter === s
                ? "bg-[#FF7900] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200",
            )}
          >
            {s} ({statusCounts[s] || 0})
          </button>
        ))}
      </div>

      {/* Search + cert filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search compliance items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded border border-gray-300 bg-white py-1.5 pl-9 pr-3 text-xs text-gray-900 placeholder:text-gray-400 focus:border-[#FF7900] focus:outline-none focus:ring-2 focus:ring-[#FF7900]/20"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <select
            value={certFilter}
            onChange={(e) => setCertFilter(e.target.value as CertificationType | "All")}
            className="appearance-none rounded border border-gray-300 bg-white py-1.5 pl-8 pr-8 text-xs text-gray-700 focus:border-[#FF7900] focus:outline-none focus:ring-2 focus:ring-[#FF7900]/20"
          >
            <option value="All">All Certifications</option>
            {CERT_TYPES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Table */}
      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200 bg-[#f1f3f5]">
                <th className="px-3 py-2.5 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-3 py-2.5 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                  Certification
                </th>
                <th className="px-3 py-2.5 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 py-2.5 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                  Last Audit
                </th>
                <th className="px-3 py-2.5 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                  Next Audit
                </th>
                <th className="px-3 py-2.5 text-right text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                  Findings
                </th>
                <th className="px-3 py-2.5 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-3 py-2.5 text-right text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Shield className="h-8 w-8 text-gray-300" />
                      <p className="text-sm text-gray-500">No compliance items found</p>
                      <p className="text-xs text-gray-400">
                        Try adjusting your filters or search criteria
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <ComplianceRow
                    key={item.id}
                    item={item}
                    isExpanded={expandedItemId === item.id}
                    onToggle={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}
                    role={role}
                    onSubmitForReview={onSubmitForReview}
                    onApprove={onApprove}
                    onDeprecate={onDeprecate}
                    onRemediationChange={onRemediationChange}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Compliance Row + Expandable Vulnerability Panel
// =============================================================================

interface ComplianceRowProps {
  item: ComplianceItem;
  isExpanded: boolean;
  onToggle: () => void;
  role: Role;
  onSubmitForReview: (id: string) => void;
  onApprove: (id: string) => void;
  onDeprecate: (id: string) => void;
  onRemediationChange: (vulnId: string, status: RemediationStatus) => void;
}

function ComplianceRow({
  item,
  isExpanded,
  onToggle,
  role,
  onSubmitForReview,
  onApprove,
  onDeprecate,
  onRemediationChange,
}: ComplianceRowProps) {
  const statusCfg = STATUS_CONFIG[item.status];
  const StatusIcon = statusCfg.icon;

  return (
    <>
      <tr
        className={cn(
          "border-b border-gray-100 hover:bg-gray-50/50 cursor-pointer transition-colors duration-150",
          isExpanded && "bg-gray-50/80",
        )}
        onClick={onToggle}
      >
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-2">
            <ChevronRight
              className={cn(
                "h-3.5 w-3.5 text-gray-400 transition-transform duration-200",
                isExpanded && "rotate-90",
              )}
            />
            <div>
              <div className="text-xs font-medium text-gray-900">{item.name}</div>
              <div className="text-[10px] text-gray-400 font-mono">{item.id}</div>
            </div>
          </div>
        </td>
        <td className="px-3 py-2.5">
          <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
            {item.certType}
          </span>
        </td>
        <td className="px-3 py-2.5">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
              statusCfg.bg,
              statusCfg.text,
            )}
          >
            <StatusIcon className="h-3 w-3" />
            {item.status}
          </span>
        </td>
        <td className="px-3 py-2.5 text-xs text-gray-600">{item.lastAudit}</td>
        <td className="px-3 py-2.5 text-xs text-gray-600">{item.nextAudit}</td>
        <td className="px-3 py-2.5 text-right">
          <span
            className={cn(
              "text-xs tabular-nums font-medium",
              item.findings > 0 ? "text-red-600" : "text-gray-500",
            )}
          >
            {item.findings}
          </span>
        </td>
        <td className="px-3 py-2.5 text-xs text-gray-600">{item.assignedTo}</td>
        <td className="px-3 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-end gap-1">
            {canSubmitForReview(role) && item.status === "Pending" && (
              <button
                onClick={() => onSubmitForReview(item.id)}
                className="rounded px-2 py-1 text-[10px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                Submit
              </button>
            )}
            {canApprove(role) && item.status === "In Review" && (
              <button
                onClick={() => onApprove(item.id)}
                className="rounded px-2 py-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
              >
                Approve
              </button>
            )}
            {canDeprecate(role) && (item.status === "Approved" || item.status === "Pending") && (
              <button
                onClick={() => onDeprecate(item.id)}
                className="rounded px-2 py-1 text-[10px] font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
              >
                Deprecate
              </button>
            )}
          </div>
        </td>
      </tr>

      {/* Expandable vulnerability panel */}
      {isExpanded && (
        <tr>
          <td colSpan={8} className="p-0">
            <div className="border-t border-gray-200 bg-gray-50/50 px-6 py-3 animate-in slide-in-from-top-1 duration-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                  Vulnerabilities ({item.vulnerabilities.length})
                </h3>
              </div>
              {item.vulnerabilities.length === 0 ? (
                <p className="text-xs text-gray-400 py-3">No vulnerabilities recorded</p>
              ) : (
                <div className="space-y-2">
                  {item.vulnerabilities.map((vuln) => {
                    const sevCfg = SEVERITY_CONFIG[vuln.severity];
                    return (
                      <div
                        key={vuln.id}
                        className={cn(
                          "flex items-center justify-between rounded border p-2.5",
                          vuln.severity === "Critical"
                            ? "border-red-200 bg-red-50/50"
                            : "border-gray-200 bg-white",
                        )}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="font-mono text-[11px] text-gray-900 font-medium whitespace-nowrap">
                            {vuln.cveId}
                          </span>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              sevCfg.bg,
                              sevCfg.text,
                            )}
                          >
                            {vuln.severity}
                          </span>
                          <span className="text-xs text-gray-600 truncate">{vuln.title}</span>
                        </div>
                        <div className="flex items-center gap-3 ml-3">
                          {vuln.resolvedDate && (
                            <span className="text-[10px] text-gray-400">
                              Resolved: {vuln.resolvedDate}
                            </span>
                          )}
                          {canUpdateRemediation(role) ? (
                            <select
                              value={vuln.remediationStatus}
                              onChange={(e) =>
                                onRemediationChange(vuln.id, e.target.value as RemediationStatus)
                              }
                              onClick={(e) => e.stopPropagation()}
                              className={cn(
                                "rounded px-2 py-0.5 text-[10px] font-medium border-0 focus:outline-none focus:ring-2 focus:ring-[#FF7900]/30 cursor-pointer",
                                REMEDIATION_STYLES[vuln.remediationStatus],
                              )}
                            >
                              <option value="Open">Open</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Resolved">Resolved</option>
                            </select>
                          ) : (
                            <span
                              className={cn(
                                "rounded px-2 py-0.5 text-[10px] font-medium",
                                REMEDIATION_STYLES[vuln.remediationStatus],
                              )}
                            >
                              {vuln.remediationStatus}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// =============================================================================
// Vulnerabilities Tab (Card Grid)
// =============================================================================

interface VulnerabilitiesTabProps {
  vulnerabilities: Vulnerability[];
  role: Role;
  onCreateVuln: () => void;
}

function VulnerabilitiesTab({ vulnerabilities, role, onCreateVuln }: VulnerabilitiesTabProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          {vulnerabilities.length} vulnerabilities sorted by CVSS score (highest first)
        </p>
        {canCreateVulnerability(role) && (
          <button
            onClick={onCreateVuln}
            className="flex items-center gap-1.5 rounded bg-[#FF7900] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#e06d00] transition-colors duration-150"
          >
            <Plus className="h-3.5 w-3.5" />
            Report Vulnerability
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {vulnerabilities.map((vuln) => {
          const sevCfg = SEVERITY_CONFIG[vuln.severity];
          return (
            <div
              key={vuln.id}
              className={cn(
                "card-elevated rounded-lg border p-4 space-y-3 transition-all duration-150 hover:shadow-md",
                vuln.severity === "Critical" && "border-red-200 ring-1 ring-red-100",
                vuln.severity === "High" && "border-orange-200",
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <span className="font-mono text-[12px] font-semibold text-gray-900">
                  {vuln.cveId}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold",
                    sevCfg.bg,
                    sevCfg.text,
                  )}
                >
                  {vuln.severity}
                </span>
              </div>

              {/* Title */}
              <p className="text-xs text-gray-700 leading-relaxed line-clamp-2">{vuln.title}</p>

              {/* Stats */}
              <div className="flex items-center gap-3 text-[10px]">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-gray-900">CVSS</span>
                  <span
                    className={cn(
                      "font-bold tabular-nums",
                      vuln.cvssScore >= 7.0
                        ? "text-red-600"
                        : vuln.cvssScore >= 4.0
                          ? "text-amber-600"
                          : "text-gray-600",
                    )}
                  >
                    {vuln.cvssScore.toFixed(1)}
                  </span>
                </div>
                <div className="h-3 w-px bg-gray-200" />
                <div className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-gray-400" />
                  <span className="text-gray-600">
                    {vuln.affectedDevices.toLocaleString()} devices
                  </span>
                </div>
                <div className="h-3 w-px bg-gray-200" />
                <span
                  className={cn(
                    "font-medium",
                    vuln.patchAvailable ? "text-emerald-600" : "text-red-600",
                  )}
                >
                  {vuln.patchAvailable ? "Patch available" : "No patch"}
                </span>
              </div>

              {/* Remediation */}
              <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium",
                    REMEDIATION_STYLES[vuln.remediationStatus],
                  )}
                >
                  {vuln.remediationStatus}
                </span>
                {vuln.resolvedDate && (
                  <span className="text-[10px] text-gray-400">{vuln.resolvedDate}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// Reports Tab
// =============================================================================

interface ReportsTabProps {
  items: ComplianceItem[];
  allItems: ComplianceItem[];
}

function ReportsTab({ items: _items, allItems }: ReportsTabProps) {
  const stats = useMemo(() => {
    const approved = allItems.filter((i) => i.status === "Approved").length;
    const pending = allItems.filter((i) => i.status === "Pending").length;
    const inReview = allItems.filter((i) => i.status === "In Review").length;
    const deprecated = allItems.filter((i) => i.status === "Deprecated").length;
    const nonCompliant = allItems.filter((i) => i.status === "Non-Compliant").length;
    const totalVulns = allItems.reduce((acc, i) => acc + i.vulnerabilities.length, 0);
    const criticalVulns = allItems.reduce(
      (acc, i) => acc + i.vulnerabilities.filter((v) => v.severity === "Critical").length,
      0,
    );
    return {
      approved,
      pending,
      inReview,
      deprecated,
      nonCompliant,
      total: allItems.length,
      totalVulns,
      criticalVulns,
    };
  }, [allItems]);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Items" value={stats.total} icon={Shield} />
        <StatCard
          label="Approved"
          value={stats.approved}
          icon={ShieldCheck}
          valueClass="text-emerald-600"
        />
        <StatCard
          label="Pending / In Review"
          value={stats.pending + stats.inReview}
          icon={Clock}
          valueClass="text-amber-600"
        />
        <StatCard
          label="Non-Compliant"
          value={stats.nonCompliant}
          icon={ShieldX}
          valueClass="text-red-600"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Deprecated"
          value={stats.deprecated}
          icon={Archive}
          valueClass="text-gray-500"
        />
        <StatCard label="Total Vulnerabilities" value={stats.totalVulns} icon={Bug} />
        <StatCard
          label="Critical Vulns"
          value={stats.criticalVulns}
          icon={AlertTriangle}
          valueClass="text-red-600"
        />
        <StatCard
          label="Compliance Rate"
          value={`${stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}%`}
          icon={BarChart3}
          valueClass="text-[#FF7900]"
        />
      </div>

      {/* Report types */}
      <div className="space-y-2">
        <h3 className="text-[12px] font-semibold text-gray-700">Available Report Types</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {REPORT_TYPES.map((type) => {
            const itemCount = allItems.filter(
              (i) => i.certType === type || type === "SOC 2" || type === "ISO 27001",
            ).length;
            return (
              <div
                key={type}
                className="card-elevated rounded-lg border border-gray-200 p-4 space-y-2 hover:border-[#FF7900]/30 transition-colors duration-150"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#FF7900]" />
                  <span className="text-[13px] font-semibold text-gray-900">{type}</span>
                </div>
                <p className="text-[11px] text-gray-500">{itemCount} compliance items applicable</p>
                <button
                  onClick={() => {
                    const reportItems = allItems.filter((i) => i.certType === type);
                    if (reportItems.length === 0) {
                      toast.error("No data available for this report type");
                      return;
                    }
                    const json = generateJSON(reportItems);
                    const date = new Date().toISOString().split("T")[0];
                    downloadFile(
                      json,
                      `${type.toLowerCase().replace(/\s+/g, "-")}-report-${date}.json`,
                      "application/json",
                    );
                    toast.success("Report downloaded");
                  }}
                  className="flex items-center gap-1.5 rounded bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-200 transition-colors w-full justify-center"
                >
                  <Download className="h-3 w-3" />
                  Export JSON
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  valueClass,
}: {
  label: string;
  value: string | number;
  icon: typeof Shield;
  valueClass?: string;
}) {
  return (
    <div className="card-elevated rounded-lg border border-gray-200 p-3 space-y-1">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-gray-400" />
        <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className={cn("text-xl font-bold tabular-nums", valueClass || "text-gray-900")}>{value}</p>
    </div>
  );
}

// =============================================================================
// Submit for Review Modal
// =============================================================================

interface SubmitFormData {
  firmwareVersion: string;
  deviceModel: string;
  certification: string;
}

function SubmitForReviewModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (data: SubmitFormData) => void;
}) {
  const [firmware, setFirmware] = useState("");
  const [model, setModel] = useState("");
  const [cert, setCert] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};
    if (!firmware.trim()) newErrors.firmware = "Firmware version is required";
    if (!model.trim()) newErrors.model = "Device model is required";
    if (!cert.trim()) newErrors.certification = "Certification is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({ firmwareVersion: firmware, deviceModel: model, certification: cert });
  };

  const inputClass =
    "w-full rounded border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF7900]/50 focus:border-[#FF7900]";

  return (
    <ModalOverlay onClose={onClose}>
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl border border-gray-200">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <h2 className="text-[14px] font-semibold text-gray-900">
            Submit Compliance Item for Review
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-gray-700">
              Firmware Version <span className="text-red-500">*</span>
            </label>
            <select
              value={firmware}
              onChange={(e) => {
                setFirmware(e.target.value);
                setErrors((prev) => ({ ...prev, firmware: "" }));
              }}
              className={inputClass}
            >
              <option value="">Select firmware version</option>
              <option value="v4.0.0">v4.0.0</option>
              <option value="v3.2.1">v3.2.1</option>
              <option value="v3.1.0">v3.1.0</option>
              <option value="v2.8.5">v2.8.5</option>
            </select>
            {errors.firmware && (
              <p className="mt-0.5 text-[10px] text-red-600">{errors.firmware}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-gray-700">
              Device Model <span className="text-red-500">*</span>
            </label>
            <select
              value={model}
              onChange={(e) => {
                setModel(e.target.value);
                setErrors((prev) => ({ ...prev, model: "" }));
              }}
              className={inputClass}
            >
              <option value="">Select device model</option>
              <option value="INV-3200">INV-3200</option>
              <option value="INV-3100">INV-3100</option>
              <option value="INV-5000">INV-5000</option>
              <option value="STR-2500">STR-2500</option>
            </select>
            {errors.model && <p className="mt-0.5 text-[10px] text-red-600">{errors.model}</p>}
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-gray-700">
              Certification <span className="text-red-500">*</span>
            </label>
            <select
              value={cert}
              onChange={(e) => {
                setCert(e.target.value);
                setErrors((prev) => ({ ...prev, certification: "" }));
              }}
              className={inputClass}
            >
              <option value="">Select certification</option>
              {CERT_TYPES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors.certification && (
              <p className="mt-0.5 text-[10px] text-red-600">{errors.certification}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-5 py-3">
          <button
            onClick={onClose}
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="rounded bg-[#FF7900] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#e06d00] transition-colors"
          >
            Submit for Review
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// =============================================================================
// Create Vulnerability Modal
// =============================================================================

interface VulnFormData {
  cveId: string;
  title: string;
  description: string;
  severity: VulnSeverity;
  cvssScore: number;
  affectedDevices: number;
  patchAvailable: boolean;
}

function CreateVulnerabilityModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (data: VulnFormData) => void;
}) {
  const [cveId, setCveId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<VulnSeverity | "">("");
  const [cvssScore, setCvssScore] = useState("");
  const [affectedDevices, setAffectedDevices] = useState("");
  const [patchAvailable, setPatchAvailable] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};
    if (!cveId.trim()) newErrors.cveId = "CVE ID is required";
    if (!title.trim()) newErrors.title = "Title is required";
    if (!severity) newErrors.severity = "Severity is required";
    if (
      !cvssScore.trim() ||
      isNaN(Number(cvssScore)) ||
      Number(cvssScore) < 0 ||
      Number(cvssScore) > 10
    ) {
      newErrors.cvssScore = "CVSS score must be 0-10";
    }
    if (!affectedDevices.trim() || isNaN(Number(affectedDevices)) || Number(affectedDevices) < 0) {
      newErrors.affectedDevices = "Enter a valid device count";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      cveId,
      title,
      description,
      severity: severity as VulnSeverity,
      cvssScore: Number(cvssScore),
      affectedDevices: Number(affectedDevices),
      patchAvailable,
    });
  };

  const inputClass =
    "w-full rounded border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF7900]/50 focus:border-[#FF7900]";

  return (
    <ModalOverlay onClose={onClose}>
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl border border-gray-200">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <h2 className="text-[14px] font-semibold text-gray-900">Report Vulnerability</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 p-5">
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-gray-700">
              CVE ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="CVE-2026-XXXX"
              value={cveId}
              onChange={(e) => {
                setCveId(e.target.value);
                setErrors((prev) => ({ ...prev, cveId: "" }));
              }}
              className={inputClass}
            />
            {errors.cveId && <p className="mt-0.5 text-[10px] text-red-600">{errors.cveId}</p>}
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-gray-700">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Brief vulnerability title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setErrors((prev) => ({ ...prev, title: "" }));
              }}
              className={inputClass}
            />
            {errors.title && <p className="mt-0.5 text-[10px] text-red-600">{errors.title}</p>}
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-gray-700">
              Description
            </label>
            <textarea
              placeholder="Detailed description of the vulnerability..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-gray-700">
                Severity <span className="text-red-500">*</span>
              </label>
              <select
                value={severity}
                onChange={(e) => {
                  setSeverity(e.target.value as VulnSeverity);
                  setErrors((prev) => ({ ...prev, severity: "" }));
                }}
                className={inputClass}
              >
                <option value="">Select severity</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
                <option value="Info">Info</option>
              </select>
              {errors.severity && (
                <p className="mt-0.5 text-[10px] text-red-600">{errors.severity}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold text-gray-700">
                CVSS Score <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                placeholder="0.0 - 10.0"
                value={cvssScore}
                onChange={(e) => {
                  setCvssScore(e.target.value);
                  setErrors((prev) => ({ ...prev, cvssScore: "" }));
                }}
                className={inputClass}
              />
              {errors.cvssScore && (
                <p className="mt-0.5 text-[10px] text-red-600">{errors.cvssScore}</p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-gray-700">
              Affected Devices <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              placeholder="Number of affected devices"
              value={affectedDevices}
              onChange={(e) => {
                setAffectedDevices(e.target.value);
                setErrors((prev) => ({ ...prev, affectedDevices: "" }));
              }}
              className={inputClass}
            />
            {errors.affectedDevices && (
              <p className="mt-0.5 text-[10px] text-red-600">{errors.affectedDevices}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="patch-available"
              checked={patchAvailable}
              onChange={(e) => setPatchAvailable(e.target.checked)}
              className="accent-[#FF7900] h-3.5 w-3.5"
            />
            <label htmlFor="patch-available" className="text-[11px] font-medium text-gray-700">
              Patch available
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-5 py-3">
          <button
            onClick={onClose}
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="rounded bg-[#FF7900] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#e06d00] transition-colors"
          >
            Create Vulnerability
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// =============================================================================
// Report Generation Modal
// =============================================================================

function ReportModal({ items, onClose }: { items: ComplianceItem[]; onClose: () => void }) {
  const [format, setFormat] = useState<"csv" | "json">("csv");
  const totalVulns = items.reduce((acc, i) => acc + i.vulnerabilities.length, 0);

  const handleDownload = () => {
    if (items.length === 0) return;

    const date = new Date().toISOString().split("T")[0];
    if (format === "csv") {
      const csv = generateCSV(items);
      downloadFile(csv, `regulatory-report-${date}.csv`, "text/csv");
    } else {
      const json = generateJSON(items);
      downloadFile(json, `regulatory-report-${date}.json`, "application/json");
    }
    toast.success("Report downloaded");
    onClose();
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div className="w-full max-w-sm rounded-lg bg-white shadow-xl border border-gray-200">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <h2 className="text-[14px] font-semibold text-gray-900">Generate Regulatory Report</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {items.length === 0 ? (
            <p className="text-xs text-gray-500">No data available for report generation</p>
          ) : (
            <>
              <p className="text-xs text-gray-600">
                This report will include <span className="font-semibold">{items.length}</span>{" "}
                compliance items and <span className="font-semibold">{totalVulns}</span>{" "}
                vulnerabilities.
              </p>

              <div className="space-y-2">
                <label className="block text-[11px] font-semibold text-gray-700">
                  Export Format
                </label>
                <div className="flex gap-3">
                  {(["csv", "json"] as const).map((f) => (
                    <label key={f} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="format"
                        value={f}
                        checked={format === f}
                        onChange={() => setFormat(f)}
                        className="accent-[#FF7900]"
                      />
                      <span className="text-xs font-medium text-gray-700 uppercase">{f}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-5 py-3">
          <button
            onClick={onClose}
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={items.length === 0}
            className={cn(
              "flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold text-white transition-colors",
              items.length === 0
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-[#FF7900] hover:bg-[#e06d00]",
            )}
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// =============================================================================
// Confirm Dialog
// =============================================================================

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  confirmClass,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  confirmClass: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <ModalOverlay onClose={onCancel}>
      <div className="w-full max-w-sm rounded-lg bg-white shadow-xl border border-gray-200">
        <div className="p-5 space-y-3">
          <h2 className="text-[14px] font-semibold text-gray-900">{title}</h2>
          <p className="text-xs text-gray-600">{message}</p>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-5 py-3">
          <button
            onClick={onCancel}
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              "rounded px-3 py-1.5 text-xs font-semibold text-white transition-colors",
              confirmClass,
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// =============================================================================
// Modal Overlay
// =============================================================================

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 mx-4">{children}</div>
    </div>
  );
}
