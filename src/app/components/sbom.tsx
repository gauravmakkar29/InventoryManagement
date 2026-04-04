import { useState, useCallback } from "react";
import { FileBox } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/use-auth";
import { getPrimaryRole, canPerformAction } from "@/lib/rbac";
import { useSBOMData } from "@/lib/hooks/use-sbom-data";
import type { Tab } from "./sbom/sbom-types";
import { TABS, MOCK_COMPONENTS } from "./sbom/sbom-constants";
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
  const {
    sboms,
    vulnerabilities,
    sbomFilter,
    setSbomFilter,
    handleUpload: hookUpload,
    handleUpdateVulnStatus: hookUpdateVulnStatus,
  } = useSBOMData();

  const handleUpload = useCallback(
    (...args: Parameters<typeof hookUpload>) => {
      if (!canPerformAction(role, "create")) {
        toast.error("Access denied — insufficient permissions");
        return;
      }
      hookUpload(...args);
    },
    [role, hookUpload],
  );

  const handleUpdateVulnStatus = useCallback(
    (...args: Parameters<typeof hookUpdateVulnStatus>) => {
      if (!canPerformAction(role, "edit")) {
        toast.error("Access denied — insufficient permissions");
        return;
      }
      hookUpdateVulnStatus(...args);
    },
    [role, hookUpdateVulnStatus],
  );

  const handleViewDetails = (sbomId: string) => {
    setSbomFilter(sbomId);
    setActiveTab("components");
  };

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
            <FileBox className="h-5 w-5 text-accent-text" />
          </div>
          <div>
            <h1 className="text-[18px] font-bold text-foreground">SBOM Management</h1>
            <p className="text-[14px] text-muted-foreground">
              Software Bill of Materials &mdash; supply chain security and license compliance
            </p>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="mb-5 flex gap-1 border-b border-border">
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
                "flex items-center gap-2 border-b-2 px-4 py-2.5 text-[14px] font-medium cursor-pointer -mb-px",
                isActive
                  ? "border-accent-text text-accent-text"
                  : "border-transparent text-muted-foreground hover:text-foreground/80",
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
