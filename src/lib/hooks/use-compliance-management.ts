import { useState, useMemo, useCallback } from "react";
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

const isMock = !import.meta.env.VITE_PLATFORM || import.meta.env.VITE_PLATFORM === "mock";

export function useComplianceManagement() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ComplianceStatus | "All">("All");
  const [certFilter, setCertFilter] = useState<CertificationType | "All">("All");
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>(
    isMock ? MOCK_COMPLIANCE : [],
  );
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>(
    isMock ? MOCK_VULNERABILITIES : [],
  );

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

  const handleSubmitForReview = useCallback((itemId: string) => {
    try {
      setComplianceItems((prev) =>
        prev.map((item) =>
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
  }, []);

  const handleApprove = useCallback((itemId: string) => {
    try {
      setComplianceItems((prev) =>
        prev.map((item) =>
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
  }, []);

  const handleDeprecate = useCallback((itemId: string) => {
    try {
      setComplianceItems((prev) =>
        prev.map((item) =>
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
  }, []);

  const handleRemediationChange = useCallback((vulnId: string, newStatus: RemediationStatus) => {
    const resolvedDate: string | null =
      newStatus === "Resolved" ? (new Date().toISOString().split("T")[0] ?? null) : null;
    const patch = { remediationStatus: newStatus, resolvedDate };
    setVulnerabilities((prev) =>
      prev.map((v): Vulnerability => (v.id === vulnId ? { ...v, ...patch } : v)),
    );
    setComplianceItems((prev) =>
      prev.map(
        (item): ComplianceItem => ({
          ...item,
          vulnerabilities: item.vulnerabilities.map(
            (v): Vulnerability => (v.id === vulnId ? { ...v, ...patch } : v),
          ),
        }),
      ),
    );
    toast.success(`Vulnerability status updated to ${newStatus}`);
  }, []);

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

  const addComplianceItem = useCallback((item: ComplianceItem) => {
    setComplianceItems((prev) => [item, ...prev]);
  }, []);

  const addVulnerability = useCallback((vuln: Vulnerability) => {
    setVulnerabilities((prev) => [vuln, ...prev]);
  }, []);

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
  };
}
