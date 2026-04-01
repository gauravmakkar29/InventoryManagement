import { useState, useCallback } from "react";
import { toast } from "sonner";
import type {
  SBOMFormat,
  SBOMStatus,
  SBOM,
  RemediationStatus,
  ComponentVulnerability,
} from "../../app/components/sbom/sbom-types";
import {
  MOCK_SBOMS,
  MOCK_FIRMWARE,
  MOCK_VULNERABILITIES,
} from "../../app/components/sbom/sbom-constants";

export function useSBOMData() {
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

  return {
    sboms,
    vulnerabilities,
    sbomFilter,
    setSbomFilter,
    handleUpload,
    handleUpdateVulnStatus,
  };
}
