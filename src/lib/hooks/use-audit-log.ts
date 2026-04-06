import { useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { generateCSV } from "../../lib/report-generator";
import type { AuditEntry, AuditAction, AuditSortField, SortDirection } from "../types/deployment";
import { INITIAL_AUDIT, AUDIT_PAGE_SIZE } from "../types/deployment-constants";
import { getDefaultDateRange } from "../types/deployment-utils";
import { useLocalPagination } from "./use-paginated-query";
import { queryKeys } from "../query-keys";
import { mockQueryFn } from "./use-mock-query";

const auditQueryKey = queryKeys.auditLogs.list();

export function useAuditLog(currentUser: string) {
  const queryClient = useQueryClient();

  const {
    data: auditLog = [],
    isLoading: queryLoading,
    error: queryError,
  } = useQuery({
    queryKey: auditQueryKey,
    queryFn: mockQueryFn(INITIAL_AUDIT),
    initialData: INITIAL_AUDIT,
  });

  const defaultRange = useMemo(() => getDefaultDateRange(), []);
  const [auditStartDate, setAuditStartDate] = useState(defaultRange.start);
  const [auditEndDate, setAuditEndDate] = useState(defaultRange.end);
  const [auditDateError, setAuditDateError] = useState("");
  const [auditUserFilter, setAuditUserFilter] = useState("");
  const [auditUserInput, setAuditUserInput] = useState("");
  const [auditSortField, setAuditSortField] = useState<AuditSortField>("timestamp");
  const [auditSortDir, setAuditSortDir] = useState<SortDirection>("desc");
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  // Combine query loading with local loading state for compatibility
  const isLoading = queryLoading || auditLoading;
  const error = queryError ? String(queryError) : auditError;

  const addAuditEntry = useCallback(
    (action: AuditAction, resourceType: string, resourceId: string) => {
      const entry: AuditEntry = {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: currentUser,
        action,
        resourceType,
        resourceId,
        ipAddress: "10.0.12.45",
        status: "Success",
      };
      queryClient.setQueryData<AuditEntry[]>(auditQueryKey, (old) => [entry, ...(old ?? [])]);
    },
    [currentUser, queryClient],
  );

  const filteredAudit = useMemo(() => {
    let entries = auditLog;
    if (auditStartDate && auditEndDate) {
      const startISO = new Date(auditStartDate + "T00:00:00Z").toISOString();
      const endISO = new Date(auditEndDate + "T23:59:59Z").toISOString();
      entries = entries.filter((e) => e.timestamp >= startISO && e.timestamp <= endISO);
    }
    if (auditUserFilter.trim()) {
      const q = auditUserFilter.toLowerCase();
      entries = entries.filter((e) => e.user.toLowerCase().includes(q));
    }
    return entries;
  }, [auditLog, auditStartDate, auditEndDate, auditUserFilter]);

  const sortedAudit = useMemo(() => {
    if (!auditSortField || !auditSortDir) return filteredAudit;
    return [...filteredAudit].sort((a, b) => {
      const aVal = a[auditSortField];
      const bVal = b[auditSortField];
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return auditSortDir === "asc" ? cmp : -cmp;
    });
  }, [filteredAudit, auditSortField, auditSortDir]);

  // Story 22.4: Standardized local pagination via useLocalPagination
  const auditPagination = useLocalPagination(sortedAudit, { pageSize: AUDIT_PAGE_SIZE });
  const {
    paginatedItems: paginatedAudit,
    page: auditPage,
    totalPages: totalAuditPages,
  } = auditPagination;
  const setAuditPage = useCallback(
    (value: number | ((prev: number) => number)) => {
      const next = typeof value === "function" ? value(auditPagination.page) : value;
      auditPagination.goToPage(next);
    },
    [auditPagination],
  );

  const handleApplyDateRange = useCallback(() => {
    if (auditStartDate && auditEndDate && auditEndDate < auditStartDate) {
      setAuditDateError("End date must be after start date");
      return;
    }
    setAuditDateError("");
    setAuditPage(1);
    setAuditLoading(true);
    setAuditError(null);
    setTimeout(() => setAuditLoading(false), 300);
  }, [auditStartDate, auditEndDate]);

  const handleApplyUserFilter = useCallback(() => {
    setAuditUserFilter(auditUserInput);
    setAuditPage(1);
  }, [auditUserInput]);

  const handleClearUserFilter = useCallback(() => {
    setAuditUserInput("");
    setAuditUserFilter("");
    setAuditPage(1);
  }, []);

  const handleSort = useCallback(
    (field: AuditSortField) => {
      setAuditSortField((prev) => {
        if (prev !== field) return field;
        return prev;
      });
      setAuditSortDir((prev) => {
        if (auditSortField !== field) return "asc";
        if (prev === "asc") return "desc";
        if (prev === "desc") return null;
        return "asc";
      });
    },
    [auditSortField],
  );

  const handleRetryAudit = useCallback(() => {
    setAuditError(null);
    setAuditLoading(true);
    setTimeout(() => setAuditLoading(false), 300);
  }, []);

  const exportAuditCsv = useCallback(() => {
    if (sortedAudit.length === 0) return;
    const data = sortedAudit.map((e) => ({
      User: e.user,
      Action: e.action,
      ResourceType: e.resourceType,
      ResourceId: e.resourceId,
      Timestamp: e.timestamp,
      IPAddress: e.ipAddress,
      Status: e.status,
    }));
    const csv = generateCSV(
      data,
      ["User", "Action", "ResourceType", "ResourceId", "Timestamp", "IPAddress", "Status"],
      ["User", "Action", "ResourceType", "ResourceId", "Timestamp", "IPAddress", "Status"],
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${auditStartDate}-to-${auditEndDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Audit log exported successfully");
  }, [sortedAudit, auditStartDate, auditEndDate]);

  return {
    auditLog,
    addAuditEntry,
    filteredAudit,
    sortedAudit,
    paginatedAudit,
    totalAuditPages,
    auditStartDate,
    setAuditStartDate,
    auditEndDate,
    setAuditEndDate,
    auditDateError,
    setAuditDateError,
    auditUserFilter,
    auditUserInput,
    setAuditUserInput,
    auditPage,
    setAuditPage,
    auditSortField,
    auditSortDir,
    auditLoading: isLoading,
    auditError: error,
    handleApplyDateRange,
    handleApplyUserFilter,
    handleClearUserFilter,
    handleSort,
    handleRetryAudit,
    exportAuditCsv,
  };
}
