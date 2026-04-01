import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "./query-keys";

export type FetchState = "loading" | "success" | "error";

export interface DashboardMetric {
  label: string;
  value: number;
  formattedValue: string;
  trend: string;
  trendUp: boolean;
  trendLabel: string;
  sparkData: number[];
}

export interface DashboardData {
  metrics: DashboardMetric[];
  fleetOnline: number;
  fleetOffline: number;
  fleetMaintenance: number;
  healthScore: number;
  lastUpdated: Date;
}

/** Simulated API delay — replaced by AppSync call in production. */
async function fetchDashboardData(): Promise<DashboardData> {
  await new Promise((resolve) => setTimeout(resolve, 1200));

  // Simulate occasional failure (10% of the time)
  if (Math.random() < 0.1) {
    throw new Error("Failed to fetch dashboard data");
  }

  return {
    metrics: [
      {
        label: "Total Devices",
        value: 1247,
        formattedValue: (1247).toLocaleString(),
        trend: "+12%",
        trendUp: true,
        trendLabel: "vs last week",
        sparkData: [820, 870, 910, 980, 1050, 1180, 1247],
      },
      {
        label: "Active Deployments",
        value: 18,
        formattedValue: (18).toLocaleString(),
        trend: "+3",
        trendUp: true,
        trendLabel: "this week",
        sparkData: [8, 12, 10, 14, 15, 16, 18],
      },
      {
        label: "Pending Approvals",
        value: 7,
        formattedValue: (7).toLocaleString(),
        trend: "-2",
        trendUp: false,
        trendLabel: "vs yesterday",
        sparkData: [12, 11, 9, 10, 8, 9, 7],
      },
      {
        label: "Fleet Health",
        value: 94.2,
        formattedValue: "94.2%",
        trend: "+0.8%",
        trendUp: true,
        trendLabel: "vs last month",
        sparkData: [91.2, 92.0, 92.8, 93.1, 93.5, 93.9, 94.2],
      },
    ],
    fleetOnline: 973,
    fleetOffline: 150,
    fleetMaintenance: 124,
    healthScore: 94.2,
    lastUpdated: new Date(),
  };
}

export function useDashboardData() {
  const { data, status, refetch } = useQuery({
    queryKey: queryKeys.dashboard.metrics(),
    queryFn: fetchDashboardData,
  });

  // Map TanStack Query status to FetchState for backward compatibility
  const state: FetchState =
    status === "pending" ? "loading" : status === "error" ? "error" : "success";

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return { data: data ?? null, state, refresh };
}
