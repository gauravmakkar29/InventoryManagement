import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { useAnalyticsData } from "@/lib/hooks/use-analytics-data";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock URL.createObjectURL and URL.revokeObjectURL for export tests
globalThis.URL.createObjectURL = vi.fn(() => "blob:mock-url");
globalThis.URL.revokeObjectURL = vi.fn();

describe("useAnalyticsData", () => {
  it("initializes with default range of 30d", () => {
    const { result } = renderHook(() => useAnalyticsData(), { wrapper: createWrapper() });
    expect(result.current.range).toBe("30d");
    expect(result.current.rangeLabel).toBe("Last 30 Days");
  });

  it("starts on page 1 with empty search", () => {
    const { result } = renderHook(() => useAnalyticsData(), { wrapper: createWrapper() });
    expect(result.current.currentPage).toBe(1);
    expect(result.current.searchQuery).toBe("");
  });

  it("has audit log data available", () => {
    const { result } = renderHook(() => useAnalyticsData(), { wrapper: createWrapper() });
    expect(result.current.filteredAuditLogs.length).toBeGreaterThan(0);
  });

  // ===========================================================================
  // Time range
  // ===========================================================================

  describe("time range", () => {
    it("changes range and resets page", () => {
      const { result } = renderHook(() => useAnalyticsData(), { wrapper: createWrapper() });

      act(() => {
        result.current.setCurrentPage(2);
      });

      act(() => {
        result.current.handleRangeChange("7d");
      });

      expect(result.current.range).toBe("7d");
      expect(result.current.currentPage).toBe(1);
    });

    it("updates range label", () => {
      const { result } = renderHook(() => useAnalyticsData(), { wrapper: createWrapper() });

      act(() => {
        result.current.handleRangeChange("90d");
      });

      expect(result.current.rangeLabel).toBe("Last 90 Days");
    });

    it("handles ytd range", () => {
      const { result } = renderHook(() => useAnalyticsData(), { wrapper: createWrapper() });

      act(() => {
        result.current.handleRangeChange("ytd");
      });

      expect(result.current.range).toBe("ytd");
      expect(result.current.rangeLabel).toBe("Year to Date");
    });
  });

  // ===========================================================================
  // Search / filtering
  // ===========================================================================

  describe("search", () => {
    it("filters audit logs by search query", () => {
      const { result } = renderHook(() => useAnalyticsData(), { wrapper: createWrapper() });
      const totalBefore = result.current.filteredAuditLogs.length;

      act(() => {
        result.current.handleSearchChange("Created");
      });

      expect(result.current.filteredAuditLogs.length).toBeLessThanOrEqual(totalBefore);
      expect(
        result.current.filteredAuditLogs.every(
          (entry) =>
            entry.user.toLowerCase().includes("created") ||
            entry.action.toLowerCase().includes("created") ||
            entry.entity.toLowerCase().includes("created") ||
            entry.details.toLowerCase().includes("created"),
        ),
      ).toBe(true);
    });

    it("resets page to 1 when searching", () => {
      const { result } = renderHook(() => useAnalyticsData(), { wrapper: createWrapper() });

      act(() => {
        result.current.setCurrentPage(2);
      });

      act(() => {
        result.current.handleSearchChange("test");
      });

      expect(result.current.currentPage).toBe(1);
    });

    it("returns all logs for empty search", () => {
      const { result } = renderHook(() => useAnalyticsData(), { wrapper: createWrapper() });
      const allCount = result.current.filteredAuditLogs.length;

      act(() => {
        result.current.handleSearchChange("nonexistent-query-xyz");
      });

      act(() => {
        result.current.handleSearchChange("");
      });

      expect(result.current.filteredAuditLogs.length).toBe(allCount);
    });
  });

  // ===========================================================================
  // Pagination
  // ===========================================================================

  describe("pagination", () => {
    it("paginates logs (page size = 6)", () => {
      const { result } = renderHook(() => useAnalyticsData(), { wrapper: createWrapper() });
      expect(result.current.pageSize).toBe(6);
      expect(result.current.paginatedLogs.length).toBeLessThanOrEqual(6);
    });

    it("calculates total pages correctly", () => {
      const { result } = renderHook(() => useAnalyticsData(), { wrapper: createWrapper() });
      const expectedPages = Math.max(
        1,
        Math.ceil(result.current.filteredAuditLogs.length / result.current.pageSize),
      );
      expect(result.current.totalPages).toBe(expectedPages);
    });

    it("navigates to different pages", () => {
      const { result } = renderHook(() => useAnalyticsData(), { wrapper: createWrapper() });

      if (result.current.totalPages > 1) {
        act(() => {
          result.current.setCurrentPage(2);
        });
        expect(result.current.currentPage).toBe(2);
      }
    });
  });
});
