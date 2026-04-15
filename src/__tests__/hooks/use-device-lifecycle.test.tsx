/**
 * Tests for `useDeviceLifecycle` — Story 27.1 (#417).
 *
 * Focuses on the behaviors that can only be observed at the hook level
 * (partial-failure reporting, empty deviceId, loading propagation). The
 * underlying projection + merge logic is covered exhaustively by
 * `device-lifecycle.mapper.test.ts` and is not re-verified here.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { ICDCProvider } from "@/lib/providers/cdc-provider.types";

// ---------------------------------------------------------------------------
// CDC provider mock — swappable per-test
// ---------------------------------------------------------------------------

let mockCDC: ICDCProvider | null = null;

vi.mock("@/lib/providers/registry", () => ({
  useCDCProvider: () => mockCDC,
}));

// Import AFTER the mock so it wires up.
import { useDeviceLifecycle } from "@/lib/hooks/use-device-lifecycle";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

function cdcMock(overrides: Partial<ICDCProvider> = {}): ICDCProvider {
  return {
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    getChangeHistory: vi.fn().mockResolvedValue([]),
    listRecentChanges: vi.fn(),
    getChangeStats: vi.fn(),
    ...overrides,
  } as unknown as ICDCProvider;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useDeviceLifecycle", () => {
  beforeEach(() => {
    mockCDC = null;
    vi.clearAllMocks();
  });

  it("returns an empty, non-loading result when deviceId is undefined", () => {
    mockCDC = cdcMock();
    const { result } = renderHook(() => useDeviceLifecycle(undefined), { wrapper: makeWrapper() });
    expect(result.current.events).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.unavailableSources).toEqual([]);
  });

  it("aggregates events from firmware assignments (mock data) + CDC history", async () => {
    mockCDC = cdcMock({
      getChangeHistory: vi.fn().mockResolvedValue([
        {
          id: "cdc-status-1",
          entityType: "device",
          entityId: "dev-001",
          action: "update",
          oldValue: { status: "online" },
          newValue: { status: "offline" },
          changedBy: "sys",
          timestamp: "2026-03-20T12:00:00Z",
        },
      ]),
    });

    const { result } = renderHook(() => useDeviceLifecycle("dev-001", { timeRange: "all" }), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // At minimum we expect one Firmware event (from mock firmware assignments
    // seeded for dev-001 in firmware-assignment-data.ts) AND one Status
    // event from the CDC mock above.
    expect(result.current.events.length).toBeGreaterThan(0);
    const categories = new Set(result.current.events.map((e) => e.category));
    expect(categories.has("Firmware")).toBe(true);
    expect(categories.has("Status")).toBe(true);
    expect(result.current.unavailableSources).toEqual([]);
  });

  it("reports the Audit source as unavailable when CDC fails, but still renders firmware events", async () => {
    mockCDC = cdcMock({
      getChangeHistory: vi.fn().mockRejectedValue(new Error("CDC down")),
    });

    const { result } = renderHook(() => useDeviceLifecycle("dev-001", { timeRange: "all" }), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.unavailableSources).toContain("Audit");
    // Firmware source is a local mock and always succeeds — timeline is
    // still populated.
    const firmwareEvents = result.current.events.filter((e) => e.category === "Firmware");
    expect(firmwareEvents.length).toBeGreaterThan(0);
  });

  it("returns no Audit events when the CDC provider is not registered", async () => {
    mockCDC = null; // provider explicitly unavailable
    const { result } = renderHook(() => useDeviceLifecycle("dev-001", { timeRange: "all" }), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Fetcher short-circuits to [] rather than throwing, so the source is
    // treated as "empty" not "unavailable".
    expect(result.current.unavailableSources).toEqual([]);
    const auditEvents = result.current.events.filter((e) => e.category === "Audit");
    expect(auditEvents).toHaveLength(0);
  });
});
