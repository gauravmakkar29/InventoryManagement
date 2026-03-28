import { useState } from "react";
import { FileText, Send, Filter, ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

type StatusFilter = "all" | "approved" | "pending" | "deprecated";

const PLACEHOLDER_ITEMS = [
  {
    id: "CMP-001",
    name: "NIST 800-53 Rev5 — Access Control",
    certType: "NIST 800-53",
    status: "approved" as const,
    lastAudit: "Feb 15, 2026",
    nextAudit: "Aug 15, 2026",
    findings: 0,
    critical: 0,
  },
  {
    id: "CMP-002",
    name: "IEC 62443 — Network Segmentation",
    certType: "IEC 62443",
    status: "pending" as const,
    lastAudit: "Jan 20, 2026",
    nextAudit: "Jul 20, 2026",
    findings: 3,
    critical: 1,
  },
  {
    id: "CMP-003",
    name: "NERC CIP-007 — System Security Management",
    certType: "NERC CIP",
    status: "approved" as const,
    lastAudit: "Mar 01, 2026",
    nextAudit: "Sep 01, 2026",
    findings: 1,
    critical: 0,
  },
  {
    id: "CMP-004",
    name: "SOC 2 Type II — Data Protection",
    certType: "SOC 2",
    status: "deprecated" as const,
    lastAudit: "Nov 10, 2025",
    nextAudit: "N/A",
    findings: 5,
    critical: 2,
  },
];

const PLACEHOLDER_VULNS = [
  { cve: "CVE-2026-1234", severity: "critical", title: "Remote code execution in firmware v3.2.1", affected: 623, patched: true },
  { cve: "CVE-2026-0892", severity: "high", title: "Authentication bypass in management API", affected: 45, patched: false },
  { cve: "CVE-2025-9981", severity: "medium", title: "Information disclosure via debug endpoint", affected: 1200, patched: true },
];

const STATUS_STYLES: Record<string, string> = {
  approved: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
  deprecated: "bg-danger/10 text-danger",
};

const SEVERITY_STYLES: Record<string, string> = {
  critical: "bg-danger/10 text-danger",
  high: "bg-warning/10 text-warning",
  medium: "bg-accent/10 text-accent",
  low: "bg-muted text-muted-foreground",
};

export function CompliancePage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filteredItems =
    statusFilter === "all"
      ? PLACEHOLDER_ITEMS
      : PLACEHOLDER_ITEMS.filter((item) => item.status === statusFilter);

  return (
    <div className="space-y-4">
      {/* Header + actions */}
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-bold text-foreground">Compliance & Vulnerability</h1>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1 rounded-sm border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:border-accent/50 hover:text-foreground">
            <Send className="h-3 w-3" />
            Submit for Review
          </button>
          <button className="flex items-center gap-1 rounded-sm bg-accent px-2.5 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent/90">
            <FileText className="h-3 w-3" />
            Generate Report
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2">
        <div className="flex rounded-sm border border-border">
          {(["all", "approved", "pending", "deprecated"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-2.5 py-1 text-[10px] font-medium capitalize",
                statusFilter === s
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <button className="flex items-center gap-1 rounded-sm border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:border-accent/50 hover:text-foreground">
          <Filter className="h-3 w-3" />
          Certification Type
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>

      {/* Compliance items */}
      <div className="overflow-auto rounded-sm border border-border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">ID</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Name</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Type</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Last Audit</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Next Audit</th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">Findings</th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">Critical</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr
                key={item.id}
                className="border-b border-border last:border-0 hover:bg-muted/30"
              >
                <td className="px-3 py-2 font-mono text-muted-foreground">{item.id}</td>
                <td className="px-3 py-2 font-medium text-foreground">{item.name}</td>
                <td className="px-3 py-2">
                  <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {item.certType}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span
                    className={cn(
                      "inline-flex rounded-sm px-1.5 py-0.5 text-[10px] font-medium capitalize",
                      STATUS_STYLES[item.status]
                    )}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-muted-foreground">{item.lastAudit}</td>
                <td className="px-3 py-2 text-muted-foreground">{item.nextAudit}</td>
                <td className="px-3 py-2 text-right tabular-nums text-foreground">{item.findings}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  <span className={item.critical > 0 ? "font-medium text-danger" : "text-muted-foreground"}>
                    {item.critical}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vulnerability panel */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Vulnerability Tracking
        </h2>
        <div className="overflow-auto rounded-sm border border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">CVE</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Severity</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Title</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">Affected</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Patch</th>
              </tr>
            </thead>
            <tbody>
              {PLACEHOLDER_VULNS.map((v, i) => (
                <tr
                  key={i}
                  className="border-b border-border last:border-0 hover:bg-muted/30"
                >
                  <td className="px-3 py-2 font-mono text-foreground">{v.cve}</td>
                  <td className="px-3 py-2">
                    <span
                      className={cn(
                        "inline-flex rounded-sm px-1.5 py-0.5 text-[10px] font-medium capitalize",
                        SEVERITY_STYLES[v.severity]
                      )}
                    >
                      {v.severity}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-foreground">{v.title}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-foreground">{v.affected.toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <span
                      className={cn(
                        "text-[10px] font-medium",
                        v.patched ? "text-success" : "text-danger"
                      )}
                    >
                      {v.patched ? "Available" : "Pending"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
