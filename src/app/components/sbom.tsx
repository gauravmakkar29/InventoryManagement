import { useState, useMemo, useCallback } from "react";
import {
  Search,
  Upload,
  FileBox,
  Package,
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Download,
  ChevronDown,
  ChevronRight,
  X,
  Filter,
  Loader2,
  Check,
  FileText,
  Scale,
  Bug,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { toast } from "sonner";
import { cn, formatDate, formatDateTime } from "../../lib/utils";
import { useAuth } from "../../lib/use-auth";
import { getPrimaryRole } from "../../lib/rbac";
import { generateCSV } from "../../lib/report-generator";
import type { Role } from "../../lib/rbac";

// =============================================================================
// Types
// =============================================================================

type Tab = "management" | "components" | "cve-dashboard" | "license-compliance";

type SBOMFormat = "CycloneDX" | "SPDX";
type SBOMStatus = "Processing" | "Complete" | "Error";
type SeverityLevel = "Critical" | "High" | "Medium" | "Low";
type RemediationStatus = "Open" | "In Progress" | "Mitigated" | "Resolved";
type LicenseCompliance = "approved" | "restricted" | "unknown";
type ComponentScope = "required" | "optional";

interface SBOM {
  id: string;
  firmwareId: string;
  firmwareName: string;
  firmwareVersion: string;
  format: SBOMFormat;
  specVersion: string;
  componentCount: number;
  vulnerabilityCount: number;
  licenseCount: number;
  criticalVulnCount: number;
  highVulnCount: number;
  mediumVulnCount: number;
  lowVulnCount: number;
  uploadedBy: string;
  uploadedDate: string;
  status: SBOMStatus;
  errorMessage?: string;
}

interface SBOMComponent {
  id: string;
  sbomId: string;
  name: string;
  version: string;
  purl: string;
  supplier: string;
  license: string;
  licenseCompliance: LicenseCompliance;
  vulnerabilityCount: number;
  highestSeverity: SeverityLevel | null;
  scope: ComponentScope;
}

interface ComponentVulnerability {
  id: string;
  componentId: string;
  componentName: string;
  componentVersion: string;
  sbomId: string;
  cveId: string;
  severity: SeverityLevel;
  cvssScore: number;
  description: string;
  publishedDate: string;
  remediationStatus: RemediationStatus;
  remediationNotes: string;
  resolvedDate: string | null;
  affectedVersionRange: string;
  fixedVersion: string | null;
}

interface FirmwareOption {
  id: string;
  name: string;
  version: string;
}

// =============================================================================
// License Policy
// =============================================================================

const APPROVED_LICENSES = ["Apache-2.0", "MIT", "BSD-2-Clause", "BSD-3-Clause", "ISC", "MPL-2.0"];
const RESTRICTED_LICENSES = ["GPL-2.0-only", "GPL-3.0-only", "AGPL-3.0-only"];

function getLicenseCompliance(license: string): LicenseCompliance {
  if (APPROVED_LICENSES.includes(license)) return "approved";
  if (RESTRICTED_LICENSES.includes(license)) return "restricted";
  return "unknown";
}

// =============================================================================
// Mock Data
// =============================================================================

const MOCK_FIRMWARE: FirmwareOption[] = [
  { id: "fw-001", name: "SG-INV-5000", version: "2.4.1" },
  { id: "fw-002", name: "SG-INV-5000", version: "2.5.0-rc1" },
  { id: "fw-003", name: "SG-STR-3000", version: "1.8.3" },
  { id: "fw-004", name: "SG-MON-2000", version: "3.1.0" },
  { id: "fw-005", name: "SG-CTL-1000", version: "4.0.2" },
];

const MOCK_SBOMS: SBOM[] = [
  {
    id: "sbom-001",
    firmwareId: "fw-001",
    firmwareName: "SG-INV-5000",
    firmwareVersion: "2.4.1",
    format: "CycloneDX",
    specVersion: "1.5",
    componentCount: 142,
    vulnerabilityCount: 8,
    licenseCount: 12,
    criticalVulnCount: 2,
    highVulnCount: 3,
    mediumVulnCount: 2,
    lowVulnCount: 1,
    uploadedBy: "Sarah Chen",
    uploadedDate: "2026-03-25T10:30:00Z",
    status: "Complete",
  },
  {
    id: "sbom-002",
    firmwareId: "fw-002",
    firmwareName: "SG-INV-5000",
    firmwareVersion: "2.5.0-rc1",
    format: "SPDX",
    specVersion: "2.3",
    componentCount: 156,
    vulnerabilityCount: 5,
    licenseCount: 14,
    criticalVulnCount: 1,
    highVulnCount: 2,
    mediumVulnCount: 1,
    lowVulnCount: 1,
    uploadedBy: "Sarah Chen",
    uploadedDate: "2026-03-27T14:15:00Z",
    status: "Complete",
  },
  {
    id: "sbom-003",
    firmwareId: "fw-003",
    firmwareName: "SG-STR-3000",
    firmwareVersion: "1.8.3",
    format: "CycloneDX",
    specVersion: "1.5",
    componentCount: 89,
    vulnerabilityCount: 3,
    licenseCount: 8,
    criticalVulnCount: 0,
    highVulnCount: 1,
    mediumVulnCount: 1,
    lowVulnCount: 1,
    uploadedBy: "Mike Rodriguez",
    uploadedDate: "2026-03-20T09:00:00Z",
    status: "Complete",
  },
  {
    id: "sbom-004",
    firmwareId: "fw-004",
    firmwareName: "SG-MON-2000",
    firmwareVersion: "3.1.0",
    format: "CycloneDX",
    specVersion: "1.5",
    componentCount: 0,
    vulnerabilityCount: 0,
    licenseCount: 0,
    criticalVulnCount: 0,
    highVulnCount: 0,
    mediumVulnCount: 0,
    lowVulnCount: 0,
    uploadedBy: "Sarah Chen",
    uploadedDate: "2026-03-28T16:45:00Z",
    status: "Processing",
  },
  {
    id: "sbom-005",
    firmwareId: "fw-005",
    firmwareName: "SG-CTL-1000",
    firmwareVersion: "4.0.2",
    format: "SPDX",
    specVersion: "2.3",
    componentCount: 0,
    vulnerabilityCount: 0,
    licenseCount: 0,
    criticalVulnCount: 0,
    highVulnCount: 0,
    mediumVulnCount: 0,
    lowVulnCount: 0,
    uploadedBy: "Mike Rodriguez",
    uploadedDate: "2026-03-28T17:00:00Z",
    status: "Error",
    errorMessage: "Invalid CycloneDX format: missing required field 'bomFormat'",
  },
];

const MOCK_COMPONENTS: SBOMComponent[] = [
  {
    id: "comp-001",
    sbomId: "sbom-001",
    name: "openssl",
    version: "3.1.0",
    purl: "pkg:npm/openssl@3.1.0",
    supplier: "OpenSSL Foundation",
    license: "Apache-2.0",
    licenseCompliance: "approved",
    vulnerabilityCount: 2,
    highestSeverity: "Critical",
    scope: "required",
  },
  {
    id: "comp-002",
    sbomId: "sbom-001",
    name: "libcurl",
    version: "8.4.0",
    purl: "pkg:npm/libcurl@8.4.0",
    supplier: "curl Project",
    license: "MIT",
    licenseCompliance: "approved",
    vulnerabilityCount: 1,
    highestSeverity: "High",
    scope: "required",
  },
  {
    id: "comp-003",
    sbomId: "sbom-001",
    name: "zlib",
    version: "1.3.0",
    purl: "pkg:npm/zlib@1.3.0",
    supplier: "Jean-loup Gailly",
    license: "Zlib",
    licenseCompliance: "unknown",
    vulnerabilityCount: 0,
    highestSeverity: null,
    scope: "required",
  },
  {
    id: "comp-004",
    sbomId: "sbom-001",
    name: "busybox",
    version: "1.36.1",
    purl: "pkg:npm/busybox@1.36.1",
    supplier: "BusyBox Team",
    license: "GPL-2.0-only",
    licenseCompliance: "restricted",
    vulnerabilityCount: 1,
    highestSeverity: "Medium",
    scope: "required",
  },
  {
    id: "comp-005",
    sbomId: "sbom-001",
    name: "sqlite",
    version: "3.44.0",
    purl: "pkg:npm/sqlite@3.44.0",
    supplier: "SQLite Consortium",
    license: "blessing",
    licenseCompliance: "unknown",
    vulnerabilityCount: 0,
    highestSeverity: null,
    scope: "optional",
  },
  {
    id: "comp-006",
    sbomId: "sbom-001",
    name: "protobuf",
    version: "25.1.0",
    purl: "pkg:npm/protobuf@25.1.0",
    supplier: "Google LLC",
    license: "BSD-3-Clause",
    licenseCompliance: "approved",
    vulnerabilityCount: 1,
    highestSeverity: "Low",
    scope: "required",
  },
  {
    id: "comp-007",
    sbomId: "sbom-001",
    name: "mosquitto",
    version: "2.0.18",
    purl: "pkg:npm/mosquitto@2.0.18",
    supplier: "Eclipse Foundation",
    license: "EPL-2.0",
    licenseCompliance: "unknown",
    vulnerabilityCount: 0,
    highestSeverity: null,
    scope: "optional",
  },
  {
    id: "comp-008",
    sbomId: "sbom-002",
    name: "openssl",
    version: "3.2.0",
    purl: "pkg:npm/openssl@3.2.0",
    supplier: "OpenSSL Foundation",
    license: "Apache-2.0",
    licenseCompliance: "approved",
    vulnerabilityCount: 0,
    highestSeverity: null,
    scope: "required",
  },
  {
    id: "comp-009",
    sbomId: "sbom-002",
    name: "libcurl",
    version: "8.5.0",
    purl: "pkg:npm/libcurl@8.5.0",
    supplier: "curl Project",
    license: "MIT",
    licenseCompliance: "approved",
    vulnerabilityCount: 1,
    highestSeverity: "High",
    scope: "required",
  },
  {
    id: "comp-010",
    sbomId: "sbom-002",
    name: "libuv",
    version: "1.48.0",
    purl: "pkg:npm/libuv@1.48.0",
    supplier: "libuv contributors",
    license: "MIT",
    licenseCompliance: "approved",
    vulnerabilityCount: 0,
    highestSeverity: null,
    scope: "required",
  },
  {
    id: "comp-011",
    sbomId: "sbom-002",
    name: "jansson",
    version: "2.14",
    purl: "pkg:npm/jansson@2.14",
    supplier: "Petri Lehtinen",
    license: "MIT",
    licenseCompliance: "approved",
    vulnerabilityCount: 0,
    highestSeverity: null,
    scope: "optional",
  },
  {
    id: "comp-012",
    sbomId: "sbom-002",
    name: "linux-kernel",
    version: "6.1.67",
    purl: "pkg:npm/linux-kernel@6.1.67",
    supplier: "Linux Foundation",
    license: "GPL-2.0-only",
    licenseCompliance: "restricted",
    vulnerabilityCount: 2,
    highestSeverity: "Critical",
    scope: "required",
  },
  {
    id: "comp-013",
    sbomId: "sbom-003",
    name: "mbedtls",
    version: "3.5.1",
    purl: "pkg:npm/mbedtls@3.5.1",
    supplier: "Arm Limited",
    license: "Apache-2.0",
    licenseCompliance: "approved",
    vulnerabilityCount: 1,
    highestSeverity: "Medium",
    scope: "required",
  },
  {
    id: "comp-014",
    sbomId: "sbom-003",
    name: "freertos",
    version: "10.6.1",
    purl: "pkg:npm/freertos@10.6.1",
    supplier: "Amazon Web Services",
    license: "MIT",
    licenseCompliance: "approved",
    vulnerabilityCount: 0,
    highestSeverity: null,
    scope: "required",
  },
  {
    id: "comp-015",
    sbomId: "sbom-003",
    name: "lwip",
    version: "2.2.0",
    purl: "pkg:npm/lwip@2.2.0",
    supplier: "lwIP contributors",
    license: "BSD-3-Clause",
    licenseCompliance: "approved",
    vulnerabilityCount: 1,
    highestSeverity: "High",
    scope: "required",
  },
  {
    id: "comp-016",
    sbomId: "sbom-003",
    name: "cjson",
    version: "1.7.16",
    purl: "pkg:npm/cjson@1.7.16",
    supplier: "Dave Gamble",
    license: "MIT",
    licenseCompliance: "approved",
    vulnerabilityCount: 0,
    highestSeverity: null,
    scope: "optional",
  },
  {
    id: "comp-017",
    sbomId: "sbom-002",
    name: "glibc",
    version: "2.38",
    purl: "pkg:npm/glibc@2.38",
    supplier: "GNU Project",
    license: "LGPL-2.1-only",
    licenseCompliance: "unknown",
    vulnerabilityCount: 1,
    highestSeverity: "Medium",
    scope: "required",
  },
  {
    id: "comp-018",
    sbomId: "sbom-001",
    name: "nginx",
    version: "1.25.3",
    purl: "pkg:npm/nginx@1.25.3",
    supplier: "F5 Inc.",
    license: "BSD-2-Clause",
    licenseCompliance: "approved",
    vulnerabilityCount: 1,
    highestSeverity: "High",
    scope: "optional",
  },
];

const MOCK_VULNERABILITIES: ComponentVulnerability[] = [
  {
    id: "cvuln-001",
    componentId: "comp-001",
    componentName: "openssl",
    componentVersion: "3.1.0",
    sbomId: "sbom-001",
    cveId: "CVE-2026-0001",
    severity: "Critical",
    cvssScore: 9.8,
    description: "Remote code execution via buffer overflow in TLS handshake processing",
    publishedDate: "2026-03-10T00:00:00Z",
    remediationStatus: "In Progress",
    remediationNotes: "Patch scheduled for next firmware release",
    resolvedDate: null,
    affectedVersionRange: ">=3.0.0 <3.1.1",
    fixedVersion: "3.1.1",
  },
  {
    id: "cvuln-002",
    componentId: "comp-001",
    componentName: "openssl",
    componentVersion: "3.1.0",
    sbomId: "sbom-001",
    cveId: "CVE-2026-0045",
    severity: "High",
    cvssScore: 8.1,
    description: "Memory corruption in X.509 certificate verification allows denial of service",
    publishedDate: "2026-02-28T00:00:00Z",
    remediationStatus: "Open",
    remediationNotes: "",
    resolvedDate: null,
    affectedVersionRange: ">=3.0.0 <3.1.2",
    fixedVersion: "3.1.2",
  },
  {
    id: "cvuln-003",
    componentId: "comp-002",
    componentName: "libcurl",
    componentVersion: "8.4.0",
    sbomId: "sbom-001",
    cveId: "CVE-2026-0112",
    severity: "High",
    cvssScore: 7.5,
    description: "HSTS bypass via IDN hostname allows connection downgrade to HTTP",
    publishedDate: "2026-01-15T00:00:00Z",
    remediationStatus: "Open",
    remediationNotes: "",
    resolvedDate: null,
    affectedVersionRange: ">=8.0.0 <8.4.1",
    fixedVersion: "8.4.1",
  },
  {
    id: "cvuln-004",
    componentId: "comp-004",
    componentName: "busybox",
    componentVersion: "1.36.1",
    sbomId: "sbom-001",
    cveId: "CVE-2026-0198",
    severity: "Medium",
    cvssScore: 5.3,
    description: "Stack-based buffer overflow in awk pattern parsing",
    publishedDate: "2026-02-05T00:00:00Z",
    remediationStatus: "Mitigated",
    remediationNotes: "awk utility disabled in production builds; full patch pending upstream fix",
    resolvedDate: null,
    affectedVersionRange: ">=1.35.0 <1.36.2",
    fixedVersion: "1.36.2",
  },
  {
    id: "cvuln-005",
    componentId: "comp-006",
    componentName: "protobuf",
    componentVersion: "25.1.0",
    sbomId: "sbom-001",
    cveId: "CVE-2026-0267",
    severity: "Low",
    cvssScore: 3.1,
    description: "Denial of service via deeply nested message structure",
    publishedDate: "2026-03-01T00:00:00Z",
    remediationStatus: "Resolved",
    remediationNotes: "Updated protobuf max depth configuration",
    resolvedDate: "2026-03-20T14:30:00Z",
    affectedVersionRange: ">=25.0.0 <25.1.1",
    fixedVersion: "25.1.1",
  },
  {
    id: "cvuln-006",
    componentId: "comp-012",
    componentName: "linux-kernel",
    componentVersion: "6.1.67",
    sbomId: "sbom-002",
    cveId: "CVE-2026-0301",
    severity: "Critical",
    cvssScore: 9.1,
    description: "Use-after-free in netfilter subsystem allows local privilege escalation",
    publishedDate: "2026-03-15T00:00:00Z",
    remediationStatus: "Open",
    remediationNotes: "",
    resolvedDate: null,
    affectedVersionRange: ">=6.1.0 <6.1.70",
    fixedVersion: "6.1.70",
  },
  {
    id: "cvuln-007",
    componentId: "comp-012",
    componentName: "linux-kernel",
    componentVersion: "6.1.67",
    sbomId: "sbom-002",
    cveId: "CVE-2026-0315",
    severity: "High",
    cvssScore: 7.8,
    description: "Race condition in io_uring allows arbitrary write to kernel memory",
    publishedDate: "2026-03-18T00:00:00Z",
    remediationStatus: "Open",
    remediationNotes: "",
    resolvedDate: null,
    affectedVersionRange: ">=6.1.0 <6.1.69",
    fixedVersion: "6.1.69",
  },
  {
    id: "cvuln-008",
    componentId: "comp-009",
    componentName: "libcurl",
    componentVersion: "8.5.0",
    sbomId: "sbom-002",
    cveId: "CVE-2026-0389",
    severity: "High",
    cvssScore: 7.2,
    description: "Cookie injection via HTTP redirect allows session hijacking",
    publishedDate: "2026-03-20T00:00:00Z",
    remediationStatus: "In Progress",
    remediationNotes: "Upgrade to 8.5.1 included in next build",
    resolvedDate: null,
    affectedVersionRange: ">=8.5.0 <8.5.1",
    fixedVersion: "8.5.1",
  },
  {
    id: "cvuln-009",
    componentId: "comp-017",
    componentName: "glibc",
    componentVersion: "2.38",
    sbomId: "sbom-002",
    cveId: "CVE-2026-0421",
    severity: "Medium",
    cvssScore: 5.9,
    description: "Buffer overflow in iconv conversion for certain character sets",
    publishedDate: "2026-03-22T00:00:00Z",
    remediationStatus: "Open",
    remediationNotes: "",
    resolvedDate: null,
    affectedVersionRange: ">=2.37 <2.39",
    fixedVersion: "2.39",
  },
  {
    id: "cvuln-010",
    componentId: "comp-013",
    componentName: "mbedtls",
    componentVersion: "3.5.1",
    sbomId: "sbom-003",
    cveId: "CVE-2026-0455",
    severity: "Medium",
    cvssScore: 5.5,
    description: "Timing side-channel in RSA private key operations",
    publishedDate: "2026-03-08T00:00:00Z",
    remediationStatus: "In Progress",
    remediationNotes: "Applying constant-time implementation patch",
    resolvedDate: null,
    affectedVersionRange: ">=3.5.0 <3.5.2",
    fixedVersion: "3.5.2",
  },
  {
    id: "cvuln-011",
    componentId: "comp-015",
    componentName: "lwip",
    componentVersion: "2.2.0",
    sbomId: "sbom-003",
    cveId: "CVE-2026-0478",
    severity: "High",
    cvssScore: 7.4,
    description: "TCP sequence number prediction allows spoofed connection injection",
    publishedDate: "2026-03-12T00:00:00Z",
    remediationStatus: "Open",
    remediationNotes: "",
    resolvedDate: null,
    affectedVersionRange: ">=2.1.0 <2.2.1",
    fixedVersion: "2.2.1",
  },
  {
    id: "cvuln-012",
    componentId: "comp-018",
    componentName: "nginx",
    componentVersion: "1.25.3",
    sbomId: "sbom-001",
    cveId: "CVE-2026-0512",
    severity: "High",
    cvssScore: 7.0,
    description: "HTTP/2 rapid reset attack allows denial of service",
    publishedDate: "2026-03-05T00:00:00Z",
    remediationStatus: "Resolved",
    remediationNotes: "Upgraded to nginx 1.25.4 with rate limiting",
    resolvedDate: "2026-03-22T10:00:00Z",
    affectedVersionRange: ">=1.25.0 <1.25.4",
    fixedVersion: "1.25.4",
  },
];

// =============================================================================
// Severity helpers
// =============================================================================

const SEVERITY_CONFIG: Record<SeverityLevel, { color: string; bg: string; border: string }> = {
  Critical: { color: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
  High: { color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" },
  Medium: { color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  Low: { color: "text-green-700", bg: "bg-green-50", border: "border-green-200" },
};

const REMEDIATION_CONFIG: Record<RemediationStatus, { color: string; bg: string }> = {
  Open: { color: "text-red-700", bg: "bg-red-50" },
  "In Progress": { color: "text-amber-700", bg: "bg-amber-50" },
  Mitigated: { color: "text-blue-700", bg: "bg-blue-50" },
  Resolved: { color: "text-green-700", bg: "bg-green-50" },
};

const LICENSE_COMPLIANCE_CONFIG: Record<
  LicenseCompliance,
  { label: string; color: string; bg: string }
> = {
  approved: { label: "Approved", color: "text-green-700", bg: "bg-green-50" },
  restricted: { label: "Restricted", color: "text-red-700", bg: "bg-red-50" },
  unknown: { label: "Unknown", color: "text-gray-600", bg: "bg-gray-100" },
};

// =============================================================================
// Page Tabs
// =============================================================================

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "management", label: "SBOM Management", icon: FileBox },
  { id: "components", label: "Component Explorer", icon: Package },
  { id: "cve-dashboard", label: "CVE Dashboard", icon: Bug },
  { id: "license-compliance", label: "License Compliance", icon: Scale },
];

// =============================================================================
// Helper: pagination
// =============================================================================

const PAGE_SIZE = 25;

function usePagination<T>(items: T[]) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const pageItems = items.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const goToPage = useCallback(
    (page: number) => {
      setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    },
    [totalPages],
  );

  return { currentPage, totalPages, pageItems, goToPage, total: items.length };
}

// =============================================================================
// Sub-component: Upload SBOM Modal
// =============================================================================

function UploadSBOMModal({
  open,
  onClose,
  onUpload,
}: {
  open: boolean;
  onClose: () => void;
  onUpload: (firmwareId: string, format: SBOMFormat, fileName: string) => void;
}) {
  const [selectedFirmware, setSelectedFirmware] = useState("");
  const [format, setFormat] = useState<SBOMFormat>("CycloneDX");
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [firmwareSearch, setFirmwareSearch] = useState("");

  const filteredFirmware = useMemo(() => {
    if (!firmwareSearch) return MOCK_FIRMWARE;
    const q = firmwareSearch.toLowerCase();
    return MOCK_FIRMWARE.filter(
      (fw) => fw.name.toLowerCase().includes(q) || fw.version.toLowerCase().includes(q),
    );
  }, [firmwareSearch]);

  const handleSubmit = useCallback(() => {
    if (!selectedFirmware || !fileName) return;
    onUpload(selectedFirmware, format, fileName);
    setSelectedFirmware("");
    setFormat("CycloneDX");
    setFileName(null);
    setFirmwareSearch("");
    onClose();
  }, [selectedFirmware, format, fileName, onUpload, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg card-elevated p-0 mx-4">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-[15px] font-semibold text-gray-900">Upload SBOM</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          {/* Firmware selector */}
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-gray-500">
              Firmware
            </label>
            <input
              type="text"
              placeholder="Search firmware..."
              value={firmwareSearch}
              onChange={(e) => setFirmwareSearch(e.target.value)}
              className="mb-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] text-gray-900 placeholder:text-gray-400 focus:border-[#FF7900] focus:ring-1 focus:ring-[#FF7900] outline-none"
            />
            <div className="max-h-[120px] overflow-y-auto rounded-lg border border-gray-200">
              {filteredFirmware.map((fw) => (
                <button
                  key={fw.id}
                  onClick={() => setSelectedFirmware(fw.id)}
                  className={cn(
                    "flex w-full items-center justify-between px-3 py-2 text-left text-[13px] cursor-pointer",
                    selectedFirmware === fw.id
                      ? "bg-orange-50 text-[#FF7900] font-medium"
                      : "text-gray-700 hover:bg-gray-50",
                  )}
                >
                  <span>
                    {fw.name} v{fw.version}
                  </span>
                  {selectedFirmware === fw.id && <Check className="h-4 w-4" />}
                </button>
              ))}
              {filteredFirmware.length === 0 && (
                <div className="px-3 py-4 text-center text-[13px] text-gray-500">
                  No firmware found
                </div>
              )}
            </div>
          </div>

          {/* Format selector */}
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-gray-500">
              Format
            </label>
            <div className="flex gap-3">
              {(["CycloneDX", "SPDX"] as SBOMFormat[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-[13px] font-medium cursor-pointer",
                    format === f
                      ? "border-[#FF7900] bg-orange-50 text-[#FF7900]"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50",
                  )}
                >
                  <div
                    className={cn(
                      "h-3.5 w-3.5 rounded-full border-2",
                      format === f ? "border-[#FF7900] bg-[#FF7900]" : "border-gray-300",
                    )}
                  >
                    {format === f && (
                      <div className="h-full w-full rounded-full border-2 border-white" />
                    )}
                  </div>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* File upload zone */}
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-gray-500">
              SBOM File (.json)
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files[0];
                if (file && file.name.endsWith(".json")) {
                  setFileName(file.name);
                }
              }}
              className={cn(
                "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 cursor-pointer",
                dragOver
                  ? "border-[#FF7900] bg-orange-50"
                  : fileName
                    ? "border-green-300 bg-green-50"
                    : "border-gray-200 hover:border-gray-300",
              )}
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".json";
                input.onchange = () => {
                  const file = input.files?.[0];
                  if (file) setFileName(file.name);
                };
                input.click();
              }}
            >
              {fileName ? (
                <>
                  <FileText className="mb-2 h-8 w-8 text-green-500" />
                  <span className="text-[13px] font-medium text-green-700">{fileName}</span>
                  <span className="mt-1 text-[11px] text-gray-500">Click to change file</span>
                </>
              ) : (
                <>
                  <Upload className="mb-2 h-8 w-8 text-gray-500" />
                  <span className="text-[13px] text-gray-600">
                    Drop JSON file here or click to browse
                  </span>
                  <span className="mt-1 text-[11px] text-gray-500">
                    Supports CycloneDX and SPDX JSON formats
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-[13px] font-medium text-gray-600 hover:bg-gray-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedFirmware || !fileName}
            className={cn(
              "rounded-lg px-4 py-2 text-[13px] font-medium text-white cursor-pointer",
              selectedFirmware && fileName
                ? "bg-[#FF7900] hover:bg-[#e66e00]"
                : "bg-gray-300 cursor-not-allowed",
            )}
          >
            Upload SBOM
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Tab: SBOM Management (Story 12.6 + 12.1)
// =============================================================================

function SBOMManagementTab({
  sboms,
  role,
  onViewDetails,
  onUpload,
}: {
  sboms: SBOM[];
  role: Role;
  onViewDetails: (sbomId: string) => void;
  onUpload: (firmwareId: string, format: SBOMFormat, fileName: string) => void;
}) {
  const [showUpload, setShowUpload] = useState(false);
  const [modelFilter, setModelFilter] = useState("all");

  const canUpload = role === "Admin" || role === "Manager";

  const firmwareModels = useMemo(() => {
    const models = new Set(sboms.map((s) => s.firmwareName));
    return Array.from(models).sort();
  }, [sboms]);

  const filtered = useMemo(() => {
    let result = [...sboms];
    if (modelFilter !== "all") {
      result = result.filter((s) => s.firmwareName === modelFilter);
    }
    return result.sort(
      (a, b) => new Date(b.uploadedDate).getTime() - new Date(a.uploadedDate).getTime(),
    );
  }, [sboms, modelFilter]);

  return (
    <div>
      {/* Header controls */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
            <select
              value={modelFilter}
              onChange={(e) => setModelFilter(e.target.value)}
              className="h-9 appearance-none rounded-lg border border-gray-200 bg-white pl-9 pr-8 text-[13px] text-gray-700 focus:border-[#FF7900] focus:ring-1 focus:ring-[#FF7900] outline-none cursor-pointer"
            >
              <option value="all">All Firmware Models</option>
              {firmwareModels.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
          </div>
        </div>

        {canUpload && (
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 rounded-lg bg-[#FF7900] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#e66e00] cursor-pointer"
          >
            <Upload className="h-4 w-4" />
            Upload SBOM
          </button>
        )}
      </div>

      {/* SBOM Cards grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {filtered.map((sbom) => (
          <SBOMCard key={sbom.id} sbom={sbom} onViewDetails={() => onViewDetails(sbom.id)} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <FileBox className="mb-3 h-10 w-10 text-gray-300" />
          <p className="text-[14px] font-medium text-gray-500">No SBOMs found</p>
          <p className="text-[12px] text-gray-500">Upload an SBOM to get started</p>
        </div>
      )}

      <UploadSBOMModal open={showUpload} onClose={() => setShowUpload(false)} onUpload={onUpload} />
    </div>
  );
}

function SBOMCard({ sbom, onViewDetails }: { sbom: SBOM; onViewDetails: () => void }) {
  const totalVulns =
    sbom.criticalVulnCount + sbom.highVulnCount + sbom.mediumVulnCount + sbom.lowVulnCount;

  return (
    <div className="card-elevated p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-[14px] font-semibold text-gray-900">
            {sbom.firmwareName}{" "}
            <span className="font-normal text-gray-500">v{sbom.firmwareVersion}</span>
          </h3>
          <p className="mt-0.5 text-[11px] text-gray-500">
            Uploaded {formatDate(sbom.uploadedDate)} by {sbom.uploadedBy}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Format badge */}
          <span
            className={cn(
              "rounded-md px-2 py-0.5 text-[11px] font-medium",
              sbom.format === "CycloneDX"
                ? "bg-blue-50 text-blue-700"
                : "bg-purple-50 text-purple-700",
            )}
          >
            {sbom.format}
          </span>
          {/* Status badge */}
          {sbom.status === "Complete" && (
            <span className="rounded-md bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
              Complete
            </span>
          )}
          {sbom.status === "Processing" && (
            <span className="flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
              <Loader2 className="h-3 w-3 animate-spin" />
              Processing
            </span>
          )}
          {sbom.status === "Error" && (
            <span
              className="rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 cursor-help"
              title={sbom.errorMessage}
            >
              Error
            </span>
          )}
        </div>
      </div>

      {sbom.status === "Complete" && (
        <>
          {/* Stats */}
          <div className="mb-3 grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-gray-50 px-3 py-2">
              <div className="text-[11px] text-gray-500">Components</div>
              <div className="text-[16px] font-semibold text-gray-900">{sbom.componentCount}</div>
            </div>
            <div className="rounded-lg bg-gray-50 px-3 py-2">
              <div className="text-[11px] text-gray-500">Vulnerabilities</div>
              <div
                className={cn(
                  "text-[16px] font-semibold",
                  sbom.vulnerabilityCount > 0 ? "text-red-600" : "text-gray-900",
                )}
              >
                {sbom.vulnerabilityCount}
              </div>
            </div>
            <div className="rounded-lg bg-gray-50 px-3 py-2">
              <div className="text-[11px] text-gray-500">Licenses</div>
              <div className="text-[16px] font-semibold text-gray-900">{sbom.licenseCount}</div>
            </div>
          </div>

          {/* Severity bar */}
          {totalVulns > 0 && (
            <div className="mb-3">
              <div className="flex h-2 overflow-hidden rounded-full bg-gray-100">
                {sbom.criticalVulnCount > 0 && (
                  <div
                    className="bg-red-500"
                    style={{ width: `${(sbom.criticalVulnCount / totalVulns) * 100}%` }}
                    title={`Critical: ${sbom.criticalVulnCount}`}
                  />
                )}
                {sbom.highVulnCount > 0 && (
                  <div
                    className="bg-orange-500"
                    style={{ width: `${(sbom.highVulnCount / totalVulns) * 100}%` }}
                    title={`High: ${sbom.highVulnCount}`}
                  />
                )}
                {sbom.mediumVulnCount > 0 && (
                  <div
                    className="bg-amber-500"
                    style={{ width: `${(sbom.mediumVulnCount / totalVulns) * 100}%` }}
                    title={`Medium: ${sbom.mediumVulnCount}`}
                  />
                )}
                {sbom.lowVulnCount > 0 && (
                  <div
                    className="bg-green-500"
                    style={{ width: `${(sbom.lowVulnCount / totalVulns) * 100}%` }}
                    title={`Low: ${sbom.lowVulnCount}`}
                  />
                )}
              </div>
              <div className="mt-1 flex gap-3 text-[10px] text-gray-500">
                {sbom.criticalVulnCount > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500" />
                    {sbom.criticalVulnCount} Critical
                  </span>
                )}
                {sbom.highVulnCount > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-orange-500" />
                    {sbom.highVulnCount} High
                  </span>
                )}
                {sbom.mediumVulnCount > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
                    {sbom.mediumVulnCount} Medium
                  </span>
                )}
                {sbom.lowVulnCount > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
                    {sbom.lowVulnCount} Low
                  </span>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {sbom.status === "Processing" && (
        <div className="flex items-center justify-center py-6 text-[13px] text-gray-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Parsing SBOM file...
        </div>
      )}

      {sbom.status === "Error" && (
        <div className="mb-3 rounded-lg bg-red-50 p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <p className="text-[12px] text-red-700">{sbom.errorMessage}</p>
          </div>
        </div>
      )}

      {sbom.status === "Complete" && (
        <div className="flex justify-end">
          <button
            onClick={onViewDetails}
            className="flex items-center gap-1 text-[12px] font-medium text-[#FF7900] hover:text-[#e66e00] cursor-pointer"
          >
            View Details
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Tab: Component Explorer (Story 12.2)
// =============================================================================

function ComponentExplorerTab({
  components,
  sbomFilter,
}: {
  components: SBOMComponent[];
  sbomFilter: string | null;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [licenseFilter, setLicenseFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = [...components];
    if (sbomFilter) {
      result = result.filter((c) => c.sbomId === sbomFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) => c.name.toLowerCase().includes(q) || c.version.toLowerCase().includes(q),
      );
    }
    if (licenseFilter !== "all") {
      if (licenseFilter === "Unknown") {
        result = result.filter((c) => c.licenseCompliance === "unknown");
      } else if (licenseFilter === "GPL") {
        result = result.filter(
          (c) =>
            c.license.startsWith("GPL") ||
            c.license.startsWith("AGPL") ||
            c.license.startsWith("LGPL"),
        );
      } else {
        result = result.filter((c) => c.license === licenseFilter);
      }
    }
    return result;
  }, [components, sbomFilter, searchQuery, licenseFilter]);

  const pagination = usePagination(filtered);

  const licenseFilters = ["all", "Apache-2.0", "MIT", "GPL", "Unknown"];

  return (
    <div>
      {/* Search and filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 text-[13px] text-gray-900 placeholder:text-gray-400 focus:border-[#FF7900] focus:ring-1 focus:ring-[#FF7900] outline-none"
          />
        </div>
        <div className="flex gap-1.5">
          {licenseFilters.map((f) => (
            <button
              key={f}
              onClick={() => setLicenseFilter(f)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[12px] font-medium cursor-pointer",
                licenseFilter === f
                  ? "bg-[#FF7900] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              )}
            >
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>
      </div>

      {sbomFilter && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-[12px] text-blue-700">
          <Filter className="h-3.5 w-3.5" />
          Filtered to SBOM: {sbomFilter}
          <button
            onClick={() => {
              /* Parent would clear this */
            }}
            className="ml-auto text-blue-500 hover:text-blue-700 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Component table */}
      <div className="card-elevated overflow-hidden">
        <table className="w-full">
          <caption className="sr-only">SBOM component inventory</caption>
          <thead>
            <tr className="table-header-row">
              <th scope="col" className="table-header-cell w-8" />
              <th scope="col" className="table-header-cell">
                Component
              </th>
              <th scope="col" className="table-header-cell">
                Version
              </th>
              <th scope="col" className="table-header-cell">
                License
              </th>
              <th scope="col" className="table-header-cell">
                Supplier
              </th>
              <th scope="col" className="table-header-cell">
                Vulnerabilities
              </th>
              <th scope="col" className="table-header-cell">
                Scope
              </th>
            </tr>
          </thead>
          <tbody>
            {pagination.pageItems.map((comp) => {
              const isExpanded = expandedId === comp.id;
              const compVulns = MOCK_VULNERABILITIES.filter((v) => v.componentId === comp.id);
              const complianceCfg = LICENSE_COMPLIANCE_CONFIG[comp.licenseCompliance];

              return (
                <ComponentRow
                  key={comp.id}
                  comp={comp}
                  isExpanded={isExpanded}
                  compVulns={compVulns}
                  complianceCfg={complianceCfg}
                  onToggle={() => setExpandedId(isExpanded ? null : comp.id)}
                />
              );
            })}
          </tbody>
        </table>

        {pagination.total === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <Package className="mb-2 h-8 w-8 text-gray-300" />
            <p className="text-[13px] text-gray-500">No components found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && <PaginationControls pagination={pagination} />}
    </div>
  );
}

function ComponentRow({
  comp,
  isExpanded,
  compVulns,
  complianceCfg,
  onToggle,
}: {
  comp: SBOMComponent;
  isExpanded: boolean;
  compVulns: ComponentVulnerability[];
  complianceCfg: { label: string; color: string; bg: string };
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className={cn(
          "border-b border-gray-100 cursor-pointer hover:bg-gray-50",
          isExpanded && "bg-gray-50",
        )}
      >
        <td className="px-4 py-3">
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
          )}
        </td>
        <td className="px-4 py-3 text-[13px] font-medium text-gray-900">{comp.name}</td>
        <td className="px-4 py-3 text-[13px] text-gray-600 font-mono">{comp.version}</td>
        <td className="px-4 py-3">
          <span
            className={cn(
              "rounded-md px-2 py-0.5 text-[11px] font-medium",
              complianceCfg.bg,
              complianceCfg.color,
            )}
          >
            {comp.license}
          </span>
        </td>
        <td className="px-4 py-3 text-[13px] text-gray-600">{comp.supplier}</td>
        <td className="px-4 py-3">
          {comp.vulnerabilityCount > 0 ? (
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-[11px] font-medium",
                comp.highestSeverity ? SEVERITY_CONFIG[comp.highestSeverity].bg : "bg-gray-100",
                comp.highestSeverity
                  ? SEVERITY_CONFIG[comp.highestSeverity].color
                  : "text-gray-600",
              )}
            >
              {comp.vulnerabilityCount}
            </span>
          ) : (
            <span className="text-[12px] text-gray-500">0</span>
          )}
        </td>
        <td className="px-4 py-3 text-[12px] text-gray-500">{comp.scope}</td>
      </tr>
      {isExpanded && (
        <tr className="border-b border-gray-100">
          <td colSpan={7} className="bg-gray-50 px-6 py-4">
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4 text-[12px]">
                <div>
                  <span className="font-semibold text-gray-500">Package URL</span>
                  <p className="mt-0.5 font-mono text-gray-700 break-all">{comp.purl}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-500">License Status</span>
                  <p className={cn("mt-0.5 font-medium", complianceCfg.color)}>
                    {complianceCfg.label}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-gray-500">SBOM</span>
                  <p className="mt-0.5 text-gray-700">{comp.sbomId}</p>
                </div>
              </div>
              {compVulns.length > 0 && (
                <div>
                  <h4 className="mb-2 text-[12px] font-semibold text-gray-600">
                    Known Vulnerabilities
                  </h4>
                  <div className="space-y-1.5">
                    {compVulns.map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center gap-3 rounded-lg bg-white p-2.5 border border-gray-200"
                      >
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                            SEVERITY_CONFIG[v.severity].bg,
                            SEVERITY_CONFIG[v.severity].color,
                          )}
                        >
                          {v.severity}
                        </span>
                        <a
                          href={`https://nvd.nist.gov/vuln/detail/${v.cveId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[12px] font-medium text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {v.cveId}
                        </a>
                        <span className="flex-1 truncate text-[12px] text-gray-600">
                          {v.description}
                        </span>
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[10px] font-medium",
                            REMEDIATION_CONFIG[v.remediationStatus].bg,
                            REMEDIATION_CONFIG[v.remediationStatus].color,
                          )}
                        >
                          {v.remediationStatus}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {compVulns.length === 0 && (
                <div className="flex items-center gap-2 text-[12px] text-green-600">
                  <ShieldCheck className="h-4 w-4" />
                  No known vulnerabilities
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
// Tab: CVE Dashboard (Story 12.3 + 12.4)
// =============================================================================

function CVEDashboardTab({
  vulnerabilities,
  role,
  onUpdateStatus,
}: {
  vulnerabilities: ComponentVulnerability[];
  role: Role;
  onUpdateStatus: (id: string, status: RemediationStatus, notes: string) => void;
}) {
  const [severityFilter, setSeverityFilter] = useState<SeverityLevel | "all">("all");
  const [statusFilter, setStatusFilter] = useState<RemediationStatus | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const canEdit = role === "Admin" || role === "Manager";

  const counts = useMemo(() => {
    return {
      Critical: vulnerabilities.filter((v) => v.severity === "Critical").length,
      High: vulnerabilities.filter((v) => v.severity === "High").length,
      Medium: vulnerabilities.filter((v) => v.severity === "Medium").length,
      Low: vulnerabilities.filter((v) => v.severity === "Low").length,
    };
  }, [vulnerabilities]);

  const filtered = useMemo(() => {
    let result = [...vulnerabilities];
    if (severityFilter !== "all") {
      result = result.filter((v) => v.severity === severityFilter);
    }
    if (statusFilter !== "all") {
      result = result.filter((v) => v.remediationStatus === statusFilter);
    }
    // Sort: Critical first, then by CVSS descending
    const sevOrder: Record<SeverityLevel, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    result.sort((a, b) => {
      const sevDiff = sevOrder[a.severity] - sevOrder[b.severity];
      if (sevDiff !== 0) return sevDiff;
      return b.cvssScore - a.cvssScore;
    });
    return result;
  }, [vulnerabilities, severityFilter, statusFilter]);

  const pagination = usePagination(filtered);

  const totalVulns = vulnerabilities.length;

  if (totalVulns === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <ShieldCheck className="mb-3 h-12 w-12 text-green-400" />
        <p className="text-[16px] font-semibold text-green-700">
          No known vulnerabilities detected
        </p>
        <p className="mt-1 text-[13px] text-gray-500">All SBOM components passed CVE matching</p>
      </div>
    );
  }

  return (
    <div>
      {/* Severity summary cards */}
      <div className="mb-5 grid grid-cols-4 gap-4">
        {(["Critical", "High", "Medium", "Low"] as SeverityLevel[]).map((sev) => {
          const cfg = SEVERITY_CONFIG[sev];
          return (
            <button
              key={sev}
              onClick={() => setSeverityFilter(severityFilter === sev ? "all" : sev)}
              className={cn(
                "card-elevated p-4 text-left cursor-pointer",
                severityFilter === sev && "ring-2 ring-[#FF7900]",
              )}
            >
              <div className={cn("text-[11px] font-semibold uppercase tracking-wide", cfg.color)}>
                {sev}
              </div>
              <div className={cn("mt-1 text-[28px] font-bold leading-tight", cfg.color)}>
                {counts[sev]}
              </div>
              <div className="mt-0.5 text-[11px] text-gray-500">
                {counts[sev] === 1 ? "vulnerability" : "vulnerabilities"}
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5">
          <span className="self-center text-[11px] font-semibold uppercase text-gray-500 mr-1">
            Severity:
          </span>
          {(["all", "Critical", "High", "Medium", "Low"] as (SeverityLevel | "all")[]).map((f) => (
            <button
              key={f}
              onClick={() => setSeverityFilter(f)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-[12px] font-medium cursor-pointer",
                severityFilter === f
                  ? "bg-[#FF7900] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              )}
            >
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>
        <div className="h-5 w-px bg-gray-200" />
        <div className="flex gap-1.5">
          <span className="self-center text-[11px] font-semibold uppercase text-gray-500 mr-1">
            Status:
          </span>
          {(
            ["all", "Open", "In Progress", "Mitigated", "Resolved"] as (RemediationStatus | "all")[]
          ).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-[12px] font-medium cursor-pointer",
                statusFilter === f
                  ? "bg-[#FF7900] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              )}
            >
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>
      </div>

      {/* CVE table */}
      <div className="card-elevated overflow-hidden">
        <table className="w-full">
          <caption className="sr-only">Known vulnerabilities (CVE list)</caption>
          <thead>
            <tr className="table-header-row">
              <th scope="col" className="table-header-cell w-8" />
              <th scope="col" className="table-header-cell">
                CVE ID
              </th>
              <th scope="col" className="table-header-cell">
                Severity
              </th>
              <th scope="col" className="table-header-cell">
                CVSS
              </th>
              <th scope="col" className="table-header-cell">
                Affected Component
              </th>
              <th scope="col" className="table-header-cell">
                Fixed Version
              </th>
              <th scope="col" className="table-header-cell">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {pagination.pageItems.map((vuln) => (
              <CVERow
                key={vuln.id}
                vuln={vuln}
                isExpanded={expandedId === vuln.id}
                canEdit={canEdit}
                onToggle={() => setExpandedId(expandedId === vuln.id ? null : vuln.id)}
                onUpdateStatus={onUpdateStatus}
              />
            ))}
          </tbody>
        </table>

        {pagination.total === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <Shield className="mb-2 h-8 w-8 text-gray-300" />
            <p className="text-[13px] text-gray-500">
              No vulnerabilities match the current filters
            </p>
          </div>
        )}
      </div>

      {pagination.totalPages > 1 && <PaginationControls pagination={pagination} />}
    </div>
  );
}

function CVERow({
  vuln,
  isExpanded,
  canEdit,
  onToggle,
  onUpdateStatus,
}: {
  vuln: ComponentVulnerability;
  isExpanded: boolean;
  canEdit: boolean;
  onToggle: () => void;
  onUpdateStatus: (id: string, status: RemediationStatus, notes: string) => void;
}) {
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState(vuln.remediationNotes);

  const sevCfg = SEVERITY_CONFIG[vuln.severity];
  const remCfg = REMEDIATION_CONFIG[vuln.remediationStatus];

  const handleStatusChange = useCallback(
    (newStatus: RemediationStatus) => {
      if (newStatus === "Mitigated") {
        setEditingNotes(true);
      } else {
        onUpdateStatus(vuln.id, newStatus, vuln.remediationNotes);
      }
    },
    [vuln.id, vuln.remediationNotes, onUpdateStatus],
  );

  const handleNotesSubmit = useCallback(() => {
    onUpdateStatus(vuln.id, "Mitigated", notesText);
    setEditingNotes(false);
  }, [vuln.id, notesText, onUpdateStatus]);

  return (
    <>
      <tr
        onClick={onToggle}
        className={cn(
          "border-b border-gray-100 cursor-pointer hover:bg-gray-50",
          isExpanded && "bg-gray-50",
        )}
      >
        <td className="px-4 py-3">
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
          )}
        </td>
        <td className="px-4 py-3">
          <a
            href={`https://nvd.nist.gov/vuln/detail/${vuln.cveId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] font-medium text-blue-600 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {vuln.cveId}
            <ExternalLink className="ml-1 inline h-3 w-3" />
          </a>
        </td>
        <td className="px-4 py-3">
          <span
            className={cn(
              "rounded-md px-2 py-0.5 text-[11px] font-semibold",
              sevCfg.bg,
              sevCfg.color,
            )}
          >
            {vuln.severity}
          </span>
        </td>
        <td className="px-4 py-3 text-[13px] font-mono font-medium text-gray-700">
          {vuln.cvssScore.toFixed(1)}
        </td>
        <td className="px-4 py-3 text-[13px] text-gray-700">
          {vuln.componentName}{" "}
          <span className="font-mono text-gray-500">{vuln.componentVersion}</span>
        </td>
        <td className="px-4 py-3 text-[13px] text-gray-600">
          {vuln.fixedVersion ?? <span className="text-gray-500 italic">No fix available</span>}
        </td>
        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
          {canEdit ? (
            <select
              value={vuln.remediationStatus}
              onChange={(e) => handleStatusChange(e.target.value as RemediationStatus)}
              className={cn(
                "h-7 appearance-none rounded-md border-0 px-2 text-[11px] font-medium cursor-pointer outline-none",
                remCfg.bg,
                remCfg.color,
              )}
            >
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Mitigated">Mitigated</option>
              <option value="Resolved">Resolved</option>
            </select>
          ) : (
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-[11px] font-medium",
                remCfg.bg,
                remCfg.color,
              )}
            >
              {vuln.remediationStatus}
            </span>
          )}
        </td>
      </tr>

      {/* Mitigation notes prompt */}
      {editingNotes && (
        <tr className="border-b border-gray-100">
          <td colSpan={7} className="bg-blue-50 px-6 py-3">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-[11px] font-semibold text-blue-700">
                  Remediation notes (required for Mitigated status)
                </label>
                <textarea
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-[13px] text-gray-900 outline-none focus:ring-1 focus:ring-[#FF7900]"
                  placeholder="Describe the mitigation applied..."
                />
              </div>
              <div className="flex gap-2 pb-0.5">
                <button
                  onClick={() => setEditingNotes(false)}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-[12px] text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleNotesSubmit}
                  disabled={!notesText.trim()}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-[12px] font-medium text-white cursor-pointer",
                    notesText.trim()
                      ? "bg-[#FF7900] hover:bg-[#e66e00]"
                      : "bg-gray-300 cursor-not-allowed",
                  )}
                >
                  Save
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}

      {/* Expanded detail */}
      {isExpanded && !editingNotes && (
        <tr className="border-b border-gray-100">
          <td colSpan={7} className="bg-gray-50 px-6 py-4">
            <div className="grid grid-cols-2 gap-4 text-[12px]">
              <div>
                <span className="font-semibold text-gray-500">Description</span>
                <p className="mt-0.5 text-gray-700">{vuln.description}</p>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="font-semibold text-gray-500">Affected Version Range</span>
                  <p className="mt-0.5 font-mono text-gray-700">{vuln.affectedVersionRange}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-500">Published</span>
                  <p className="mt-0.5 text-gray-700">{formatDate(vuln.publishedDate)}</p>
                </div>
                {vuln.remediationNotes && (
                  <div>
                    <span className="font-semibold text-gray-500">Remediation Notes</span>
                    <p className="mt-0.5 text-gray-700">{vuln.remediationNotes}</p>
                  </div>
                )}
                {vuln.resolvedDate && (
                  <div>
                    <span className="font-semibold text-gray-500">Resolved Date</span>
                    <p className="mt-0.5 text-gray-700">{formatDateTime(vuln.resolvedDate)}</p>
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// =============================================================================
// Tab: License Compliance (Story 12.5)
// =============================================================================

const PIE_COLORS = ["#2563eb", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#6b7280"];

function LicenseComplianceTab({ components }: { components: SBOMComponent[] }) {
  const stats = useMemo(() => {
    const approved = components.filter((c) => c.licenseCompliance === "approved").length;
    const restricted = components.filter((c) => c.licenseCompliance === "restricted").length;
    const unknown = components.filter((c) => c.licenseCompliance === "unknown").length;
    return { approved, restricted, unknown };
  }, [components]);

  const licenseDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of components) {
      counts[c.license] = (counts[c.license] ?? 0) + 1;
    }
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [components]);

  const nonCompliant = useMemo(() => {
    return components.filter((c) => c.licenseCompliance === "restricted");
  }, [components]);

  const allCompliant = stats.restricted === 0;

  const handleExport = useCallback(() => {
    const rows = components.map((c) => ({
      component: c.name,
      version: c.version,
      license: c.license,
      compliance: c.licenseCompliance,
      supplier: c.supplier,
      sbomId: c.sbomId,
    }));
    const csv = generateCSV(
      rows,
      ["component", "version", "license", "compliance", "supplier", "sbomId"],
      ["Component", "Version", "License", "Compliance", "Supplier", "SBOM ID"],
    );
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `license-compliance-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("License compliance report exported");
  }, [components]);

  return (
    <div>
      {/* Policy status card */}
      <div className="card-elevated mb-5 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              {allCompliant ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
                  <ShieldCheck className="h-5 w-5 text-green-600" />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                  <ShieldAlert className="h-5 w-5 text-red-600" />
                </div>
              )}
              <div>
                <h3 className="text-[14px] font-semibold text-gray-900">License Policy Status</h3>
                {allCompliant ? (
                  <p className="text-[12px] text-green-600 font-medium">All Compliant</p>
                ) : (
                  <p className="text-[12px] text-red-600 font-medium">
                    {stats.restricted} non-compliant{" "}
                    {stats.restricted === 1 ? "component" : "components"} detected
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-6 border-l border-gray-200 pl-6">
              <div className="text-center">
                <div className="text-[20px] font-bold text-green-600">{stats.approved}</div>
                <div className="text-[11px] text-gray-500">Approved</div>
              </div>
              <div className="text-center">
                <div className="text-[20px] font-bold text-red-600">{stats.restricted}</div>
                <div className="text-[11px] text-gray-500">Restricted</div>
              </div>
              <div className="text-center">
                <div className="text-[20px] font-bold text-gray-500">{stats.unknown}</div>
                <div className="text-[11px] text-gray-500">Unknown</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* License distribution pie chart */}
      <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="card-elevated p-5">
          <h3 className="mb-4 text-[13px] font-semibold text-gray-900">License Distribution</h3>
          {licenseDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={licenseDistribution}
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={90}
                  dataKey="value"
                  nameKey="name"
                  paddingAngle={2}
                  label={({ name, percent }: { name: string; percent: number }) =>
                    `${name} (${(percent * 100).toFixed(0)}%)`
                  }
                  labelLine={{ strokeWidth: 1 }}
                >
                  {licenseDistribution.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`${value} components`, "Count"]}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value: string) => (
                    <span className="text-[11px] text-gray-600">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[280px] items-center justify-center text-[13px] text-gray-500">
              No license data available
            </div>
          )}
        </div>

        {/* License Legend / Stats */}
        <div className="card-elevated p-5">
          <h3 className="mb-4 text-[13px] font-semibold text-gray-900">License Breakdown</h3>
          <div className="space-y-2">
            {licenseDistribution.map((item, idx) => {
              const compliance = getLicenseCompliance(item.name);
              const cfg = LICENSE_COMPLIANCE_CONFIG[compliance];
              return (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-sm"
                      style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                    />
                    <span className="text-[13px] text-gray-700">{item.name}</span>
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-medium",
                        cfg.bg,
                        cfg.color,
                      )}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <span className="text-[13px] font-medium text-gray-900">{item.value}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Non-compliant components list */}
      {nonCompliant.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-gray-900">Non-Compliant Components</h3>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-[12px] font-medium text-gray-600 hover:bg-gray-50 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
          </div>
          <div className="card-elevated overflow-hidden">
            <table className="w-full">
              <caption className="sr-only">Non-compliant components requiring action</caption>
              <thead>
                <tr className="table-header-row">
                  <th scope="col" className="table-header-cell">
                    Component
                  </th>
                  <th scope="col" className="table-header-cell">
                    Version
                  </th>
                  <th scope="col" className="table-header-cell">
                    License
                  </th>
                  <th scope="col" className="table-header-cell">
                    SBOM
                  </th>
                  <th scope="col" className="table-header-cell">
                    Recommended Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {nonCompliant.map((comp) => (
                  <tr
                    key={comp.id}
                    className="border-b border-gray-100 border-l-4 border-l-red-400"
                  >
                    <td className="px-4 py-3 text-[13px] font-medium text-gray-900">{comp.name}</td>
                    <td className="px-4 py-3 text-[13px] font-mono text-gray-600">
                      {comp.version}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
                        {comp.license}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-gray-600">{comp.sbomId}</td>
                    <td className="px-4 py-3 text-[12px] text-amber-700">
                      {comp.license.startsWith("GPL") || comp.license.startsWith("AGPL")
                        ? "Replace with permissive-licensed alternative or obtain commercial license"
                        : "Review license terms and obtain legal approval"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {nonCompliant.length === 0 && (
        <div className="card-elevated flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-green-600">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-[14px] font-medium">No non-compliant components detected</span>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Pagination Controls
// =============================================================================

function PaginationControls({
  pagination,
}: {
  pagination: {
    currentPage: number;
    totalPages: number;
    total: number;
    goToPage: (p: number) => void;
  };
}) {
  return (
    <div className="mt-4 flex items-center justify-between text-[12px] text-gray-500">
      <span>
        Showing {(pagination.currentPage - 1) * PAGE_SIZE + 1} -{" "}
        {Math.min(pagination.currentPage * PAGE_SIZE, pagination.total)} of {pagination.total}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => pagination.goToPage(pagination.currentPage - 1)}
          disabled={pagination.currentPage === 1}
          className={cn(
            "rounded-lg px-2.5 py-1 cursor-pointer",
            pagination.currentPage === 1
              ? "text-gray-300 cursor-not-allowed"
              : "text-gray-600 hover:bg-gray-100",
          )}
        >
          Previous
        </button>
        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => pagination.goToPage(page)}
            className={cn(
              "h-7 w-7 rounded-lg text-center cursor-pointer",
              page === pagination.currentPage
                ? "bg-[#FF7900] text-white font-medium"
                : "text-gray-600 hover:bg-gray-100",
            )}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => pagination.goToPage(pagination.currentPage + 1)}
          disabled={pagination.currentPage === pagination.totalPages}
          className={cn(
            "rounded-lg px-2.5 py-1 cursor-pointer",
            pagination.currentPage === pagination.totalPages
              ? "text-gray-300 cursor-not-allowed"
              : "text-gray-600 hover:bg-gray-100",
          )}
        >
          Next
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// Main Page Component
// =============================================================================

export function SBOMPage() {
  const { groups } = useAuth();
  const role = getPrimaryRole(groups);
  const [activeTab, setActiveTab] = useState<Tab>("management");
  const [sboms, setSboms] = useState<SBOM[]>(MOCK_SBOMS);
  const [vulnerabilities, setVulnerabilities] =
    useState<ComponentVulnerability[]>(MOCK_VULNERABILITIES);
  const [sbomFilter, setSbomFilter] = useState<string | null>(null);

  const handleUpload = useCallback((firmwareId: string, format: SBOMFormat, fileName: string) => {
    const fw = MOCK_FIRMWARE.find((f) => f.id === firmwareId);
    if (!fw) return;

    const newSbom: SBOM = {
      id: `sbom-${Date.now()}`,
      firmwareId,
      firmwareName: fw.name,
      firmwareVersion: fw.version,
      format,
      specVersion: format === "CycloneDX" ? "1.5" : "2.3",
      componentCount: 0,
      vulnerabilityCount: 0,
      licenseCount: 0,
      criticalVulnCount: 0,
      highVulnCount: 0,
      mediumVulnCount: 0,
      lowVulnCount: 0,
      uploadedBy: "Current User",
      uploadedDate: new Date().toISOString(),
      status: "Processing",
    };

    setSboms((prev) => [newSbom, ...prev]);
    toast.success(`SBOM uploaded for ${fw.name} v${fw.version}`, {
      description: `${fileName} is being processed...`,
    });

    // Simulate processing completion after 3s
    setTimeout(() => {
      setSboms((prev) =>
        prev.map((s) =>
          s.id === newSbom.id
            ? {
                ...s,
                status: "Complete" as SBOMStatus,
                componentCount: Math.floor(Math.random() * 100) + 50,
                vulnerabilityCount: Math.floor(Math.random() * 8),
                licenseCount: Math.floor(Math.random() * 10) + 3,
                criticalVulnCount: Math.floor(Math.random() * 2),
                highVulnCount: Math.floor(Math.random() * 3),
                mediumVulnCount: Math.floor(Math.random() * 3),
                lowVulnCount: Math.floor(Math.random() * 2),
              }
            : s,
        ),
      );
      toast.success("SBOM processing complete", {
        description: `${fw.name} v${fw.version} SBOM has been parsed successfully`,
      });
    }, 3000);
  }, []);

  const handleViewDetails = useCallback((sbomId: string) => {
    setSbomFilter(sbomId);
    setActiveTab("components");
  }, []);

  const handleUpdateVulnStatus = useCallback(
    (vulnId: string, newStatus: RemediationStatus, notes: string) => {
      setVulnerabilities((prev) =>
        prev.map((v) =>
          v.id === vulnId
            ? {
                ...v,
                remediationStatus: newStatus,
                remediationNotes: notes,
                resolvedDate: newStatus === "Resolved" ? new Date().toISOString() : v.resolvedDate,
              }
            : v,
        ),
      );
      toast.success(`Vulnerability status updated to ${newStatus}`);
    },
    [],
  );

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF7900]/10">
            <FileBox className="h-5 w-5 text-[#FF7900]" />
          </div>
          <div>
            <h1 className="text-[18px] font-bold text-gray-900">SBOM Management</h1>
            <p className="text-[13px] text-gray-500">
              Software Bill of Materials &mdash; supply chain security and license compliance
            </p>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="mb-5 flex gap-1 border-b border-gray-200">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id !== "components") setSbomFilter(null);
              }}
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-2.5 text-[13px] font-medium cursor-pointer -mb-px",
                isActive
                  ? "border-[#FF7900] text-[#FF7900]"
                  : "border-transparent text-gray-500 hover:text-gray-700",
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "management" && (
        <SBOMManagementTab
          sboms={sboms}
          role={role}
          onViewDetails={handleViewDetails}
          onUpload={handleUpload}
        />
      )}
      {activeTab === "components" && (
        <ComponentExplorerTab components={MOCK_COMPONENTS} sbomFilter={sbomFilter} />
      )}
      {activeTab === "cve-dashboard" && (
        <CVEDashboardTab
          vulnerabilities={vulnerabilities}
          role={role}
          onUpdateStatus={handleUpdateVulnStatus}
        />
      )}
      {activeTab === "license-compliance" && <LicenseComplianceTab components={MOCK_COMPONENTS} />}
    </div>
  );
}
