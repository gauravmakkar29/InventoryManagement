import { useState, useMemo } from "react";
import {
  Upload,
  Filter,
  ChevronDown,
  ChevronRight,
  FileBox,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import type { SBOM, SBOMFormat } from "./sbom-types";
import type { Role } from "@/lib/rbac";
import { UploadSBOMModal } from "./upload-sbom-modal";

// =============================================================================
// Tab: SBOM Management (Story 12.6 + 12.1)
// =============================================================================

export function SBOMManagementTab({
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
            <Filter className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <select
              value={modelFilter}
              onChange={(e) => setModelFilter(e.target.value)}
              className="h-9 appearance-none rounded-lg border border-border bg-card pl-9 pr-8 text-[14px] text-foreground/80 focus:border-accent-text focus:ring-1 focus:ring-ring outline-none cursor-pointer"
            >
              <option value="all">All Firmware Models</option>
              {firmwareModels.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        {canUpload && (
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-[14px] font-medium text-white hover:bg-[#e66e00] cursor-pointer"
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
          <FileBox className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-[15px] font-medium text-muted-foreground">No SBOMs found</p>
          <p className="text-[14px] text-muted-foreground">Upload an SBOM to get started</p>
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
          <h3 className="text-[15px] font-semibold text-foreground">
            {sbom.firmwareName}{" "}
            <span className="font-normal text-muted-foreground">v{sbom.firmwareVersion}</span>
          </h3>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Uploaded {formatDate(sbom.uploadedDate)} by {sbom.uploadedBy}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Format badge */}
          <span
            className={cn(
              "rounded-md px-2 py-0.5 text-[13px] font-medium",
              sbom.format === "CycloneDX"
                ? "bg-blue-50 text-blue-700"
                : "bg-purple-50 text-purple-700",
            )}
          >
            {sbom.format}
          </span>
          {/* Status badge */}
          {sbom.status === "Complete" && (
            <span className="rounded-md bg-green-50 px-2 py-0.5 text-[13px] font-medium text-green-700">
              Complete
            </span>
          )}
          {sbom.status === "Processing" && (
            <span className="flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[13px] font-medium text-blue-700">
              <Loader2 className="h-3 w-3 animate-spin" />
              Processing
            </span>
          )}
          {sbom.status === "Error" && (
            <span
              className="rounded-md bg-red-50 px-2 py-0.5 text-[13px] font-medium text-red-700 cursor-help"
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
            <div className="rounded-lg bg-muted px-3 py-2">
              <div className="text-[13px] text-muted-foreground">Components</div>
              <div className="text-[16px] font-semibold text-foreground">{sbom.componentCount}</div>
            </div>
            <div className="rounded-lg bg-muted px-3 py-2">
              <div className="text-[13px] text-muted-foreground">Vulnerabilities</div>
              <div
                className={cn(
                  "text-[16px] font-semibold",
                  sbom.vulnerabilityCount > 0 ? "text-red-600" : "text-foreground",
                )}
              >
                {sbom.vulnerabilityCount}
              </div>
            </div>
            <div className="rounded-lg bg-muted px-3 py-2">
              <div className="text-[13px] text-muted-foreground">Licenses</div>
              <div className="text-[16px] font-semibold text-foreground">{sbom.licenseCount}</div>
            </div>
          </div>

          {/* Severity bar */}
          {totalVulns > 0 && (
            <div className="mb-3">
              <div className="flex h-2 overflow-hidden rounded-full bg-muted">
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
              <div className="mt-1 flex gap-3 text-[12px] text-muted-foreground">
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
        <div className="flex items-center justify-center py-6 text-[14px] text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Parsing SBOM file...
        </div>
      )}

      {sbom.status === "Error" && (
        <div className="mb-3 rounded-lg bg-red-50 p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <p className="text-[14px] text-red-700">{sbom.errorMessage}</p>
          </div>
        </div>
      )}

      {sbom.status === "Complete" && (
        <div className="flex justify-end">
          <button
            onClick={onViewDetails}
            className="flex items-center gap-1 text-[14px] font-medium text-accent-text hover:text-[#e66e00] cursor-pointer"
          >
            View Details
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
