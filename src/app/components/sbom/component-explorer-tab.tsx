import { useState, useMemo } from "react";
import { Search, Package, Filter, X, ChevronDown, ChevronRight, ShieldCheck } from "lucide-react";
import { cn } from "../../../lib/utils";
import type { SBOMComponent, ComponentVulnerability } from "./sbom-types";
import {
  SEVERITY_CONFIG,
  REMEDIATION_CONFIG,
  LICENSE_COMPLIANCE_CONFIG,
  MOCK_VULNERABILITIES,
} from "./sbom-constants";
import { usePagination, PaginationControls } from "./sbom-utils";

// =============================================================================
// Tab: Component Explorer (Story 12.2)
// =============================================================================

export function ComponentExplorerTab({
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
            aria-label="Search components"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 text-[14px] text-gray-900 placeholder:text-gray-500 focus:border-[#FF7900] focus:ring-1 focus:ring-[#FF7900] outline-none"
          />
        </div>
        <div className="flex gap-1.5">
          {licenseFilters.map((f) => (
            <button
              key={f}
              onClick={() => setLicenseFilter(f)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[14px] font-medium cursor-pointer",
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
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-[14px] text-blue-700">
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
            <p className="text-[14px] text-gray-500">No components found</p>
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
        <td className="px-4 py-3 text-[14px] font-medium text-gray-900">{comp.name}</td>
        <td className="px-4 py-3 text-[14px] text-gray-600 font-mono">{comp.version}</td>
        <td className="px-4 py-3">
          <span
            className={cn(
              "rounded-md px-2 py-0.5 text-[13px] font-medium",
              complianceCfg.bg,
              complianceCfg.color,
            )}
          >
            {comp.license}
          </span>
        </td>
        <td className="px-4 py-3 text-[14px] text-gray-600">{comp.supplier}</td>
        <td className="px-4 py-3">
          {comp.vulnerabilityCount > 0 ? (
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-[13px] font-medium",
                comp.highestSeverity ? SEVERITY_CONFIG[comp.highestSeverity].bg : "bg-gray-100",
                comp.highestSeverity
                  ? SEVERITY_CONFIG[comp.highestSeverity].color
                  : "text-gray-600",
              )}
            >
              {comp.vulnerabilityCount}
            </span>
          ) : (
            <span className="text-[14px] text-gray-500">0</span>
          )}
        </td>
        <td className="px-4 py-3 text-[14px] text-gray-500">{comp.scope}</td>
      </tr>
      {isExpanded && (
        <tr className="border-b border-gray-100">
          <td colSpan={7} className="bg-gray-50 px-6 py-4">
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4 text-[14px]">
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
                  <h4 className="mb-2 text-[14px] font-semibold text-gray-600">
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
                            "rounded px-1.5 py-0.5 text-[12px] font-semibold",
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
                          className="text-[14px] font-medium text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {v.cveId}
                        </a>
                        <span className="flex-1 truncate text-[14px] text-gray-600">
                          {v.description}
                        </span>
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[12px] font-medium",
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
                <div className="flex items-center gap-2 text-[14px] text-green-600">
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
