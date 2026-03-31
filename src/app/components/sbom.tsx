import { useState, useCallback } from "react";
import { FileBox } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../lib/utils";
import { useAuth } from "../../lib/use-auth";
import { getPrimaryRole } from "../../lib/rbac";
import type {
  Tab,
  SBOMFormat,
  SBOMStatus,
  SBOM,
  RemediationStatus,
  ComponentVulnerability,
} from "./sbom/sbom-types";
import {
  TABS,
  MOCK_SBOMS,
  MOCK_FIRMWARE,
  MOCK_COMPONENTS,
  MOCK_VULNERABILITIES,
} from "./sbom/sbom-constants";
import { SBOMManagementTab } from "./sbom/sbom-management-tab";
import { ComponentExplorerTab } from "./sbom/component-explorer-tab";
import { CVEDashboardTab } from "./sbom/cve-dashboard-tab";
import { LicenseComplianceTab } from "./sbom/license-compliance-tab";

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
