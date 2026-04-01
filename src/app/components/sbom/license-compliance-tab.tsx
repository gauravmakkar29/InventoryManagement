import { useMemo, useCallback } from "react";
import { Download, ShieldCheck, ShieldAlert } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { toast } from "sonner";
import { cn } from "../../../lib/utils";
import { generateCSV } from "../../../lib/report-generator";
import type { SBOMComponent } from "./sbom-types";
import { getLicenseCompliance, LICENSE_COMPLIANCE_CONFIG, PIE_COLORS } from "./sbom-constants";

// =============================================================================
// Tab: License Compliance (Story 12.5)
// =============================================================================

export function LicenseComplianceTab({ components }: { components: SBOMComponent[] }) {
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
                <h3 className="text-[15px] font-semibold text-gray-900">License Policy Status</h3>
                {allCompliant ? (
                  <p className="text-[14px] text-green-600 font-medium">All Compliant</p>
                ) : (
                  <p className="text-[14px] text-red-600 font-medium">
                    {stats.restricted} non-compliant{" "}
                    {stats.restricted === 1 ? "component" : "components"} detected
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-6 border-l border-gray-300 pl-6">
              <div className="text-center">
                <div className="text-[20px] font-bold text-green-600">{stats.approved}</div>
                <div className="text-[13px] text-gray-600">Approved</div>
              </div>
              <div className="text-center">
                <div className="text-[20px] font-bold text-red-600">{stats.restricted}</div>
                <div className="text-[13px] text-gray-600">Restricted</div>
              </div>
              <div className="text-center">
                <div className="text-[20px] font-bold text-gray-600">{stats.unknown}</div>
                <div className="text-[13px] text-gray-600">Unknown</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* License distribution pie chart */}
      <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="card-elevated p-5">
          <h3 className="mb-4 text-[14px] font-semibold text-gray-900">License Distribution</h3>
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
                    <span className="text-[13px] text-gray-600">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[280px] items-center justify-center text-[14px] text-gray-600">
              No license data available
            </div>
          )}
        </div>

        {/* License Legend / Stats */}
        <div className="card-elevated p-5">
          <h3 className="mb-4 text-[14px] font-semibold text-gray-900">License Breakdown</h3>
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
                    <span className="text-[14px] text-gray-700">{item.name}</span>
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[12px] font-medium",
                        cfg.bg,
                        cfg.color,
                      )}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <span className="text-[14px] font-medium text-gray-900">{item.value}</span>
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
            <h3 className="text-[15px] font-semibold text-gray-900">Non-Compliant Components</h3>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-[14px] font-medium text-gray-600 hover:bg-gray-50 cursor-pointer"
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
                    className="border-b border-gray-200 border-l-4 border-l-red-400"
                  >
                    <td className="px-4 py-3 text-[14px] font-medium text-gray-900">{comp.name}</td>
                    <td className="px-4 py-3 text-[14px] font-mono text-gray-600">
                      {comp.version}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-red-50 px-2 py-0.5 text-[13px] font-medium text-red-700">
                        {comp.license}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[14px] text-gray-600">{comp.sbomId}</td>
                    <td className="px-4 py-3 text-[14px] text-amber-700">
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
            <span className="text-[15px] font-medium">No non-compliant components detected</span>
          </div>
        </div>
      )}
    </div>
  );
}
