import { Server, Cpu, ShieldCheck, HeartPulse, AlertTriangle, Wrench } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type TimeRange = "7d" | "30d" | "90d" | "ytd" | "custom";

export interface KpiCard {
  label: string;
  value: string;
  icon: typeof Server;
  iconBg: string;
  iconColor: string;
  trend: string;
  trendUp: boolean;
  trendLabel: string;
}

export interface RingSegment {
  label: string;
  value: number;
  color: string;
}

export interface AnalyticsAuditEntry {
  id: string;
  timestamp: string;
  user: string;
  action: "Created" | "Modified" | "Deleted";
  entity: string;
  details: string;
}

export interface MonthlyDeployment {
  month: string;
  count: number;
}

export interface VulnSeverity {
  severity: string;
  count: number;
  color: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
export const TIME_RANGE_OPTIONS: { label: string; value: TimeRange }[] = [
  { label: "Last 7 Days", value: "7d" },
  { label: "Last 30 Days", value: "30d" },
  { label: "Last 90 Days", value: "90d" },
  { label: "Year to Date", value: "ytd" },
  { label: "Custom", value: "custom" },
];

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------
export const KPI_DATA: KpiCard[] = [
  {
    label: "Total Devices",
    value: "2,847",
    icon: Server,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    trend: "+12%",
    trendUp: true,
    trendLabel: "vs last period",
  },
  {
    label: "Active Deployments",
    value: "18",
    icon: Cpu,
    iconBg: "bg-orange-50",
    iconColor: "text-[#c2410c]",
    trend: "+3",
    trendUp: true,
    trendLabel: "this period",
  },
  {
    label: "Compliance Score",
    value: "96.4%",
    icon: ShieldCheck,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    trend: "+1.2%",
    trendUp: true,
    trendLabel: "vs last period",
  },
  {
    label: "Open Vulnerabilities",
    value: "23",
    icon: AlertTriangle,
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
    trend: "-5",
    trendUp: false,
    trendLabel: "vs last period",
  },
  {
    label: "Service Orders (MTD)",
    value: "142",
    icon: Wrench,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
    trend: "+8%",
    trendUp: true,
    trendLabel: "vs last month",
  },
  {
    label: "Avg Device Health",
    value: "94.2%",
    icon: HeartPulse,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    trend: "+0.8%",
    trendUp: true,
    trendLabel: "vs last period",
  },
];

export const DEVICE_STATUS_SEGMENTS: RingSegment[] = [
  { label: "Online", value: 1973, color: "#10b981" },
  { label: "Offline", value: 412, color: "#ef4444" },
  { label: "Maintenance", value: 287, color: "#f59e0b" },
  { label: "Decommissioned", value: 175, color: "#6b7280" },
];

export const COMPLIANCE_SEGMENTS: RingSegment[] = [
  { label: "Approved", value: 2104, color: "#10b981" },
  { label: "Pending", value: 389, color: "#f59e0b" },
  { label: "Non-Compliant", value: 218, color: "#ef4444" },
  { label: "Deprecated", value: 136, color: "#6b7280" },
];

export const MONTHLY_DEPLOYMENTS: MonthlyDeployment[] = [
  { month: "Oct", count: 24 },
  { month: "Nov", count: 31 },
  { month: "Dec", count: 18 },
  { month: "Jan", count: 42 },
  { month: "Feb", count: 35 },
  { month: "Mar", count: 28 },
];

export const VULN_SEVERITY: VulnSeverity[] = [
  { severity: "Critical", count: 3, color: "#ef4444" },
  { severity: "High", count: 8, color: "#f97316" },
  { severity: "Medium", count: 15, color: "#f59e0b" },
  { severity: "Low", count: 22, color: "#10b981" },
  { severity: "Info", count: 47, color: "#6b7280" },
];

export const AUDIT_LOG_DATA: AnalyticsAuditEntry[] = [
  {
    id: "AUD-001",
    timestamp: "2026-03-29T14:32:00Z",
    user: "j.chen@hlm.com",
    action: "Created",
    entity: "Firmware v3.2.1",
    details: "Uploaded new firmware package for SG-INV cluster",
  },
  {
    id: "AUD-002",
    timestamp: "2026-03-29T11:15:00Z",
    user: "a.patel@hlm.com",
    action: "Modified",
    entity: "Deployment D-1842",
    details: "Approved firmware v4.0.0 for production rollout",
  },
  {
    id: "AUD-003",
    timestamp: "2026-03-28T16:48:00Z",
    user: "system",
    action: "Modified",
    entity: "Device SN-7821",
    details: "Deployment completed: firmware v3.1.0 applied",
  },
  {
    id: "AUD-004",
    timestamp: "2026-03-28T09:20:00Z",
    user: "j.chen@hlm.com",
    action: "Created",
    entity: "Firmware v4.1.0-rc1",
    details: "Submitted release candidate for testing",
  },
  {
    id: "AUD-005",
    timestamp: "2026-03-27T15:00:00Z",
    user: "system",
    action: "Modified",
    entity: "Vulnerability CVE-2026-1234",
    details: "Vulnerability scan completed on 1,247 devices",
  },
  {
    id: "AUD-006",
    timestamp: "2026-03-27T10:30:00Z",
    user: "m.rodriguez@hlm.com",
    action: "Created",
    entity: "Service Order SO-1043",
    details: "Created maintenance order for Denver DC",
  },
  {
    id: "AUD-007",
    timestamp: "2026-03-26T14:45:00Z",
    user: "s.kumar@hlm.com",
    action: "Modified",
    entity: "Compliance NIST-800-53",
    details: "Updated compliance status for Q1 audit",
  },
  {
    id: "AUD-008",
    timestamp: "2026-03-26T08:10:00Z",
    user: "a.patel@hlm.com",
    action: "Deleted",
    entity: "Firmware v2.9.0",
    details: "Deprecated firmware removed from active registry",
  },
  {
    id: "AUD-009",
    timestamp: "2026-03-25T17:22:00Z",
    user: "j.chen@hlm.com",
    action: "Created",
    entity: "Device SN-9102",
    details: "Registered new inverter at Shanghai HQ",
  },
  {
    id: "AUD-010",
    timestamp: "2026-03-25T13:05:00Z",
    user: "system",
    action: "Modified",
    entity: "Deployment D-1840",
    details: "Rollback triggered for firmware v3.0.2 on 42 devices",
  },
];
