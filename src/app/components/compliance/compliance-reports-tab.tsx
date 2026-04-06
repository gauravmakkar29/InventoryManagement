import { useMemo } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldX,
  Clock,
  Archive,
  AlertTriangle,
  Bug,
  FileText,
  Download,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../../lib/utils";
import type { ComplianceItem, Vulnerability } from "../../../lib/mock-data/compliance-data";
import { REPORT_TYPES, downloadFile, generateJSON } from "../../../lib/mock-data/compliance-data";

// =============================================================================
// Reports Tab
// =============================================================================

interface ReportsTabProps {
  items: ComplianceItem[];
  allItems: ComplianceItem[];
  vulnerabilities: Vulnerability[];
}

export function ReportsTab({ items: _items, allItems, vulnerabilities }: ReportsTabProps) {
  const stats = useMemo(() => {
    const vulnMap = new Map(vulnerabilities.map((v) => [v.id, v]));
    const approved = allItems.filter((i) => i.status === "Approved").length;
    const pending = allItems.filter((i) => i.status === "Pending").length;
    const inReview = allItems.filter((i) => i.status === "In Review").length;
    const deprecated = allItems.filter((i) => i.status === "Deprecated").length;
    const nonCompliant = allItems.filter((i) => i.status === "Non-Compliant").length;
    const totalVulns = allItems.reduce((acc, i) => acc + i.vulnerabilityIds.length, 0);
    const criticalVulns = allItems.reduce(
      (acc, i) =>
        acc + i.vulnerabilityIds.filter((id) => vulnMap.get(id)?.severity === "Critical").length,
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
          valueClass="text-muted-foreground"
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
          valueClass="text-accent-text"
        />
      </div>

      {/* Report types */}
      <div className="space-y-2">
        <h3 className="text-[14px] font-semibold text-foreground/80">Available Report Types</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {REPORT_TYPES.map((type) => {
            const itemCount = allItems.filter(
              (i) => i.certType === type || type === "SOC 2" || type === "ISO 27001",
            ).length;
            return (
              <div
                key={type}
                className="card-elevated rounded-lg border border-border p-4 space-y-2 hover:border-accent-text/30 transition-colors duration-150"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-accent-text" />
                  <span className="text-[14px] font-semibold text-foreground">{type}</span>
                </div>
                <p className="text-[13px] text-muted-foreground">
                  {itemCount} compliance items applicable
                </p>
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
                  className="flex items-center gap-1.5 rounded bg-muted px-2.5 py-1 text-[13px] font-medium text-foreground/80 hover:bg-muted transition-colors w-full justify-center"
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

// =============================================================================
// Stat Card
// =============================================================================

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
    <div className="card-elevated rounded-lg border border-border p-3 space-y-1">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className={cn("text-xl font-bold tabular-nums", valueClass || "text-foreground")}>
        {value}
      </p>
    </div>
  );
}
