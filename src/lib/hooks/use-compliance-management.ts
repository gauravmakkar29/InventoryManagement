import { useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  ComplianceItem,
  ComplianceStatus,
  CertificationType,
  Vulnerability,
  RemediationStatus,
} from "../mock-data/compliance-data";
import {
  MOCK_COMPLIANCE,
  MOCK_VULNERABILITIES,
  downloadFile,
  generateCSV,
  generateJSON,
} from "../mock-data/compliance-data";
import { queryKeys } from "../query-keys";
import { mockQueryFn } from "./use-mock-query";

const complianceQueryKey = queryKeys.compliance.list();
const complianceVulnQueryKey = [...queryKeys.compliance.all, "vulnerabilities"] as const;

export function useComplianceManagement() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ComplianceStatus | "All">("All");
  const [certFilter, setCertFilter] = useState<CertificationType | "All">("All");

  const {
    data: complianceItems = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: complianceQueryKey,
    queryFn: mockQueryFn(MOCK_COMPLIANCE),
    initialData: MOCK_COMPLIANCE,
  });

  const { data: vulnerabilities = [] } = useQuery({
    queryKey: complianceVulnQueryKey,
    queryFn: mockQueryFn(MOCK_VULNERABILITIES),
    initialData: MOCK_VULNERABILITIES,
  });

  const filteredItems = useMemo(() => {
    let items = complianceItems;
    if (statusFilter !== "All") {
      items = items.filter((i) => i.status === statusFilter);
    }
    if (certFilter !== "All") {
      items = items.filter((i) => i.certType === certFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.id.toLowerCase().includes(q) ||
          i.assignedTo.toLowerCase().includes(q),
      );
    }
    return items;
  }, [complianceItems, statusFilter, certFilter, search]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { All: complianceItems.length };
    for (const item of complianceItems) {
      counts[item.status] = (counts[item.status] || 0) + 1;
    }
    return counts;
  }, [complianceItems]);

  const sortedVulnerabilities = useMemo(
    () => [...vulnerabilities].sort((a, b) => b.cvssScore - a.cvssScore),
    [vulnerabilities],
  );

  const handleSubmitForReview = useCallback(
    (itemId: string) => {
      try {
        queryClient.setQueryData<ComplianceItem[]>(complianceQueryKey, (old) =>
          (old ?? []).map((item) =>
            item.id === itemId && item.status === "Pending"
              ? { ...item, status: "In Review" as ComplianceStatus }
              : item,
          ),
        );
        toast.success("Compliance item submitted for review");
      } catch (err) {
        toast.error(
          `Failed to submit for review: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
      }
    },
    [queryClient],
  );

  const handleApprove = useCallback(
    (itemId: string) => {
      try {
        queryClient.setQueryData<ComplianceItem[]>(complianceQueryKey, (old) =>
          (old ?? []).map((item) =>
            item.id === itemId && item.status === "In Review"
              ? { ...item, status: "Approved" as ComplianceStatus }
              : item,
          ),
        );
        toast.success("Compliance item approved");
      } catch (err) {
        toast.error(
          `Failed to approve compliance item: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
      }
    },
    [queryClient],
  );

  const handleDeprecate = useCallback(
    (itemId: string) => {
      try {
        queryClient.setQueryData<ComplianceItem[]>(complianceQueryKey, (old) =>
          (old ?? []).map((item) =>
            item.id === itemId && (item.status === "Approved" || item.status === "Pending")
              ? { ...item, status: "Deprecated" as ComplianceStatus }
              : item,
          ),
        );
        toast.success("Compliance item deprecated");
      } catch (err) {
        toast.error(
          `Failed to deprecate compliance item: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
      }
    },
    [queryClient],
  );

  const handleRemediationChange = useCallback(
    (vulnId: string, newStatus: RemediationStatus) => {
      const resolvedDate: string | null =
        newStatus === "Resolved" ? (new Date().toISOString().split("T")[0] ?? null) : null;
      const patch = { remediationStatus: newStatus, resolvedDate };

      queryClient.setQueryData<Vulnerability[]>(complianceVulnQueryKey, (old) =>
        (old ?? []).map((v): Vulnerability => (v.id === vulnId ? { ...v, ...patch } : v)),
      );
      queryClient.setQueryData<ComplianceItem[]>(complianceQueryKey, (old) =>
        (old ?? []).map(
          (item): ComplianceItem => ({
            ...item,
            vulnerabilities: item.vulnerabilities.map(
              (v): Vulnerability => (v.id === vulnId ? { ...v, ...patch } : v),
            ),
          }),
        ),
      );
      toast.success(`Vulnerability status updated to ${newStatus}`);
    },
    [queryClient],
  );

  const handleExportCSV = useCallback(() => {
    const csv = generateCSV(filteredItems);
    downloadFile(
      csv,
      `compliance-report-${new Date().toISOString().split("T")[0]}.csv`,
      "text/csv;charset=utf-8;",
    );
    toast.success("Compliance report exported as CSV");
  }, [filteredItems]);

  const handleExportJSON = useCallback(() => {
    const json = generateJSON(filteredItems);
    downloadFile(
      json,
      `compliance-report-${new Date().toISOString().split("T")[0]}.json`,
      "application/json",
    );
    toast.success("Compliance report exported as JSON");
  }, [filteredItems]);

  const addComplianceItem = useCallback(
    (item: ComplianceItem) => {
      queryClient.setQueryData<ComplianceItem[]>(complianceQueryKey, (old) => [
        item,
        ...(old ?? []),
      ]);
    },
    [queryClient],
  );

  const addVulnerability = useCallback(
    (vuln: Vulnerability) => {
      queryClient.setQueryData<Vulnerability[]>(complianceVulnQueryKey, (old) => [
        vuln,
        ...(old ?? []),
      ]);
    },
    [queryClient],
  );

  return {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    certFilter,
    setCertFilter,
    complianceItems,
    vulnerabilities,
    filteredItems,
    statusCounts,
    sortedVulnerabilities,
    handleSubmitForReview,
    handleApprove,
    handleDeprecate,
    handleRemediationChange,
    handleExportCSV,
    handleExportJSON,
    addComplianceItem,
    addVulnerability,
    isLoading,
    error,
  };
}
