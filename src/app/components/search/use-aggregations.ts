import { useState, useEffect, useCallback } from "react";
import type {
  AggregationMetric,
  AggregationResponse,
  TimeRange,
  AggregationBucketEntry,
} from "@/lib/opensearch-types";

// =============================================================================
// Story 18.5 — useAggregations Hook
// Fetches server-side aggregations from OpenSearch for analytics charts.
// Each chart independently loads its data; failures are isolated per chart.
// =============================================================================

/** Mock aggregation data for development */
const MOCK_DATA: Record<AggregationMetric, unknown> = {
  devicesByStatus: {
    statuses: {
      buckets: [
        { key: "online", doc_count: 1842 },
        { key: "offline", doc_count: 312 },
        { key: "maintenance", doc_count: 198 },
        { key: "decommissioned", doc_count: 95 },
      ],
    },
  },
  deviceCount: { count: { value: 2447 } },
  activeDeployments: { doc_count: 23 },
  pendingApprovals: { doc_count: 7 },
  avgHealthScore: { avg_health: { value: 84.6 } },
  complianceByStatus: {
    statuses: {
      buckets: [
        { key: "Approved", doc_count: 45 },
        { key: "Pending", doc_count: 12 },
        { key: "Deprecated", doc_count: 8 },
        { key: "Non-Compliant", doc_count: 3 },
      ],
    },
  },
  deploymentTrend: {
    trend: {
      buckets: [
        { key_as_string: "2026-01-06", doc_count: 3 },
        { key_as_string: "2026-01-13", doc_count: 5 },
        { key_as_string: "2026-01-20", doc_count: 2 },
        { key_as_string: "2026-01-27", doc_count: 7 },
        { key_as_string: "2026-02-03", doc_count: 4 },
        { key_as_string: "2026-02-10", doc_count: 6 },
        { key_as_string: "2026-02-17", doc_count: 3 },
        { key_as_string: "2026-02-24", doc_count: 8 },
        { key_as_string: "2026-03-03", doc_count: 5 },
        { key_as_string: "2026-03-10", doc_count: 4 },
        { key_as_string: "2026-03-17", doc_count: 6 },
        { key_as_string: "2026-03-24", doc_count: 9 },
      ],
    },
  },
  topVulnerabilities: {
    severity: {
      buckets: [
        { key: "Critical", doc_count: 12 },
        { key: "High", doc_count: 28 },
        { key: "Medium", doc_count: 45 },
        { key: "Low", doc_count: 31 },
      ],
    },
  },
  healthScoreDistribution: {
    scores: {
      buckets: [
        { key: 0, doc_count: 95 },
        { key: 10, doc_count: 23 },
        { key: 20, doc_count: 15 },
        { key: 30, doc_count: 28 },
        { key: 40, doc_count: 42 },
        { key: 50, doc_count: 67 },
        { key: 60, doc_count: 124 },
        { key: 70, doc_count: 298 },
        { key: 80, doc_count: 456 },
        { key: 90, doc_count: 1299 },
      ],
    },
  },
};

export interface AggregationState {
  data: AggregationResponse | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to fetch a single aggregation metric.
 * Returns loading, error, and data states independently per chart.
 */
export function useAggregation(
  metric: AggregationMetric,
  timeRange?: TimeRange,
): AggregationState & { retry: () => void } {
  const [state, setState] = useState<AggregationState>({
    data: null,
    isLoading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      // Mock implementation — in production, call getAggregation() from hlm-api
      await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 300));
      const mockData = MOCK_DATA[metric];
      if (!mockData) throw new Error(`Unknown metric: ${metric}`);
      setState({
        data: { metric, data: mockData as Record<string, unknown> },
        isLoading: false,
        error: null,
      });
    } catch (err) {
      setState({
        data: null,
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to load aggregation",
      });
    }
  }, [metric, timeRange?.start, timeRange?.end]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, retry: fetchData };
}

/**
 * Hook to fetch multiple aggregation metrics in parallel.
 * Each metric loads independently; chart-level error isolation per AC7.
 */
export function useMultipleAggregations(
  metrics: AggregationMetric[],
  timeRange?: TimeRange,
): Record<AggregationMetric, AggregationState & { retry: () => void }> {
  // This is a convenience wrapper — in production each chart
  // would use useAggregation individually for isolation.
  // For mock development, we return the same pattern.
  const results = {} as Record<AggregationMetric, AggregationState & { retry: () => void }>;

  for (const metric of metrics) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    results[metric] = useAggregation(metric, timeRange);
  }

  return results;
}

/** Helper to extract buckets from an aggregation response */
export function extractBuckets(
  data: AggregationResponse | null,
  path: string,
): AggregationBucketEntry[] {
  if (!data?.data) return [];
  const segments = path.split(".");
  let current: unknown = data.data;
  for (const segment of segments) {
    if (current && typeof current === "object" && segment in current) {
      current = (current as Record<string, unknown>)[segment];
    } else {
      return [];
    }
  }
  if (Array.isArray(current)) {
    return current as AggregationBucketEntry[];
  }
  return [];
}
