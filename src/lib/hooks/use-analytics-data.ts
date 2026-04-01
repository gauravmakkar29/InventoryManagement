import { useState, useMemo } from "react";
import { toast } from "sonner";
import type { TimeRange, KpiCard, AnalyticsAuditEntry } from "../mock-data/analytics-data";
import { TIME_RANGE_OPTIONS, KPI_DATA, AUDIT_LOG_DATA } from "../mock-data/analytics-data";

// ---------------------------------------------------------------------------
// Export Helpers
// ---------------------------------------------------------------------------
function generateCSV(entries: AnalyticsAuditEntry[], timeRange: TimeRange): void {
  const headers = ["Timestamp", "User", "Action", "Entity", "Details"];
  const rows = entries.map((e) => [
    new Date(e.timestamp).toLocaleString("en-US"),
    e.user,
    e.action,
    e.entity,
    `"${e.details.replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const dateStr = new Date().toISOString().split("T")[0];
  link.href = url;
  link.download = `audit-log-${timeRange}-${dateStr}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  toast.success("Audit log exported successfully");
}

function generateJSON(entries: AnalyticsAuditEntry[], kpis: KpiCard[], timeRange: TimeRange): void {
  const payload = {
    exportDate: new Date().toISOString(),
    timeRange,
    kpis: kpis.map((k) => ({ label: k.label, value: k.value, trend: k.trend })),
    auditLog: entries.map((e) => ({
      timestamp: e.timestamp,
      user: e.user,
      action: e.action,
      entity: e.entity,
      details: e.details,
    })),
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const dateStr = new Date().toISOString().split("T")[0];
  link.href = url;
  link.download = `analytics-export-${timeRange}-${dateStr}.json`;
  link.click();
  URL.revokeObjectURL(url);
  toast.success("Analytics data exported successfully");
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
const PAGE_SIZE = 6;

export function useAnalyticsData() {
  const [range, setRange] = useState<TimeRange>("30d");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredAuditLogs = useMemo(() => {
    if (!searchQuery.trim()) return AUDIT_LOG_DATA;
    const q = searchQuery.toLowerCase();
    return AUDIT_LOG_DATA.filter(
      (entry) =>
        entry.user.toLowerCase().includes(q) ||
        entry.action.toLowerCase().includes(q) ||
        entry.entity.toLowerCase().includes(q) ||
        entry.details.toLowerCase().includes(q) ||
        new Date(entry.timestamp).toLocaleString("en-US").toLowerCase().includes(q),
    );
  }, [searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredAuditLogs.length / PAGE_SIZE));
  const paginatedLogs = filteredAuditLogs.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const rangeLabel = TIME_RANGE_OPTIONS.find((o) => o.value === range)?.label ?? range;

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleRangeChange = (newRange: TimeRange) => {
    setRange(newRange);
    setCurrentPage(1);
  };

  const handleExportCSV = () => {
    generateCSV(filteredAuditLogs, range);
  };

  const handleExportJSON = () => {
    generateJSON(filteredAuditLogs, KPI_DATA, range);
  };

  return {
    range,
    rangeLabel,
    searchQuery,
    currentPage,
    setCurrentPage,
    totalPages,
    filteredAuditLogs,
    paginatedLogs,
    pageSize: PAGE_SIZE,
    handleSearchChange,
    handleRangeChange,
    handleExportCSV,
    handleExportJSON,
  };
}
