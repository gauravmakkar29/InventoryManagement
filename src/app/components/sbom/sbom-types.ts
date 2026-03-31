// =============================================================================
// Types
// =============================================================================

export type Tab = "management" | "components" | "cve-dashboard" | "license-compliance";

export type SBOMFormat = "CycloneDX" | "SPDX";
export type SBOMStatus = "Processing" | "Complete" | "Error";
export type SeverityLevel = "Critical" | "High" | "Medium" | "Low";
export type RemediationStatus = "Open" | "In Progress" | "Mitigated" | "Resolved";
export type LicenseCompliance = "approved" | "restricted" | "unknown";
export type ComponentScope = "required" | "optional";

export interface SBOM {
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

export interface SBOMComponent {
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

export interface ComponentVulnerability {
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

export interface FirmwareOption {
  id: string;
  name: string;
  version: string;
}
