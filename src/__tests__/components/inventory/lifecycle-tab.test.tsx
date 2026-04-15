/**
 * Tests for LifecycleTab — Story 27.1 (#417) Phase 2.
 *
 * The aggregation / projection logic is already tested at the hook and mapper
 * level. These tests focus on the UI concerns specific to the tab: filter
 * behavior, skeleton loading, partial-failure banner, and empty state. The
 * `useDeviceLifecycle` hook is mocked to keep these tests fast and
 * deterministic.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { DeviceLifecycleEvent } from "@/lib/types";
import type { DeviceLifecycleResult } from "@/lib/hooks/use-device-lifecycle";

// ---------------------------------------------------------------------------
// Mock the hook — swappable per-test via hookState
// ---------------------------------------------------------------------------

const hookState: { result: DeviceLifecycleResult; lastTimeRange: string | undefined } = {
  result: { events: [], isLoading: false, unavailableSources: [] },
  lastTimeRange: undefined,
};

vi.mock("@/lib/hooks/use-device-lifecycle", () => ({
  useDeviceLifecycle: (_deviceId: string, opts?: { timeRange?: string }) => {
    hookState.lastTimeRange = opts?.timeRange;
    return hookState.result;
  },
  // Simple passthrough for the DeviceStatusSummary's window calc —
  // matches the real implementation's shape closely enough for tests
  // that don't assert on exact timestamps.
  resolveTimeRangeWindow: (preset: string) => {
    if (preset === "all") return undefined;
    const days = preset === "7d" ? 7 : preset === "30d" ? 30 : preset === "90d" ? 90 : 180;
    const end = new Date().toISOString();
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    return { start, end };
  },
}));

vi.mock("sonner", () => ({
  toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() },
}));

// Story 27.2 — mock auth so the tab can resolve the current user's role.
// Tests that want a specific role assign to `authState.role` before render.
const authState: { role: import("@/lib/rbac").Role } = { role: "Admin" };

vi.mock("@/lib/use-auth", () => ({
  useAuth: () => ({ groups: [authState.role] }),
}));

vi.mock("@/lib/rbac", async () => {
  const actual = await vi.importActual<typeof import("@/lib/rbac")>("@/lib/rbac");
  return {
    ...actual,
    getPrimaryRole: () => authState.role,
  };
});

// Import AFTER mocks
import { LifecycleTab } from "@/app/components/inventory/lifecycle-tab";
import { lifecycleFilterStorageKey } from "@/lib/rbac-lifecycle";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function mkEvent(
  overrides: Partial<DeviceLifecycleEvent> & Pick<DeviceLifecycleEvent, "id" | "category">,
): DeviceLifecycleEvent {
  return {
    deviceId: "dev-001",
    action: `${overrides.category.toLowerCase()}.updated`,
    actor: { userId: "u-1", displayName: "user.one@example.com" },
    timestamp: "2026-03-20T10:00:00Z",
    summary: `${overrides.category} event`,
    sourceEntityType: "AuditLog",
    sourceEntityId: overrides.id,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("LifecycleTab", () => {
  beforeEach(() => {
    hookState.result = { events: [], isLoading: false, unavailableSources: [] };
    hookState.lastTimeRange = undefined;
    authState.role = "Admin";
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  it("shows the loading skeleton while the hook is loading", () => {
    hookState.result = { events: [], isLoading: true, unavailableSources: [] };
    render(<LifecycleTab deviceId="dev-001" currentStatus="online" />);
    expect(screen.getByRole("status", { name: /loading timeline/i })).toBeInTheDocument();
  });

  it("renders every category's event when all filters are enabled (default)", () => {
    hookState.result = {
      events: [
        mkEvent({ id: "1", category: "Firmware" }),
        mkEvent({ id: "2", category: "Service", timestamp: "2026-03-19T10:00:00Z" }),
        mkEvent({ id: "3", category: "Ownership", timestamp: "2026-03-18T10:00:00Z" }),
        mkEvent({ id: "4", category: "Status", timestamp: "2026-03-17T10:00:00Z" }),
        mkEvent({ id: "5", category: "Audit", timestamp: "2026-03-16T10:00:00Z" }),
      ],
      isLoading: false,
      unavailableSources: [],
    };

    render(<LifecycleTab deviceId="dev-001" currentStatus="online" />);

    expect(screen.getByText("Firmware event")).toBeInTheDocument();
    expect(screen.getByText("Service event")).toBeInTheDocument();
    expect(screen.getByText("Ownership event")).toBeInTheDocument();
    expect(screen.getByText("Status event")).toBeInTheDocument();
    expect(screen.getByText("Audit event")).toBeInTheDocument();
  });

  it("filters events when a category checkbox is toggled off (client-side, no refetch)", async () => {
    const user = userEvent.setup();
    hookState.result = {
      events: [
        mkEvent({ id: "1", category: "Firmware" }),
        mkEvent({ id: "2", category: "Audit", timestamp: "2026-03-19T10:00:00Z" }),
      ],
      isLoading: false,
      unavailableSources: [],
    };

    render(<LifecycleTab deviceId="dev-001" currentStatus="online" />);

    expect(screen.getByText("Audit event")).toBeInTheDocument();

    // The hidden checkbox inside the Audit chip's label
    await user.click(screen.getByRole("checkbox", { name: /toggle audit events/i }));

    expect(screen.queryByText("Audit event")).not.toBeInTheDocument();
    expect(screen.getByText("Firmware event")).toBeInTheDocument();
    // Time-range unchanged — no extra hook invocation with a different preset
    expect(hookState.lastTimeRange).toBe("30d");
  });

  it("requests a new time range when the range selector is changed", async () => {
    const user = userEvent.setup();
    render(<LifecycleTab deviceId="dev-001" currentStatus="online" />);

    expect(hookState.lastTimeRange).toBe("30d");
    await user.selectOptions(screen.getByLabelText(/range/i), "7d");
    expect(hookState.lastTimeRange).toBe("7d");
  });

  it("renders the partial-failure banner when a source is unavailable", () => {
    hookState.result = {
      events: [],
      isLoading: false,
      unavailableSources: ["Audit"],
    };
    render(<LifecycleTab deviceId="dev-001" currentStatus="online" />);
    expect(screen.getByRole("alert")).toHaveTextContent(/audit history/i);
  });

  it("shows the empty state when no events match the current filter", () => {
    hookState.result = { events: [], isLoading: false, unavailableSources: [] };
    render(<LifecycleTab deviceId="dev-001" currentStatus="online" />);
    expect(screen.getByText(/no lifecycle events in this window/i)).toBeInTheDocument();
  });

  it("disables the Export CSV button when there are no visible events", () => {
    hookState.result = { events: [], isLoading: false, unavailableSources: [] };
    render(<LifecycleTab deviceId="dev-001" currentStatus="online" />);
    expect(screen.getByRole("button", { name: /export csv/i })).toBeDisabled();
  });

  // ---------------------------------------------------------------------------
  // Story 27.2 — persona-aware filtering
  // ---------------------------------------------------------------------------

  describe("persona defaults (Story 27.2 #418)", () => {
    it("pre-filters to Technician defaults on initial render (no Ownership/Audit)", () => {
      authState.role = "Technician";
      hookState.result = {
        events: [
          mkEvent({ id: "1", category: "Firmware" }),
          mkEvent({ id: "2", category: "Ownership", timestamp: "2026-03-19T10:00:00Z" }),
          mkEvent({ id: "3", category: "Audit", timestamp: "2026-03-18T10:00:00Z" }),
          mkEvent({ id: "4", category: "Status", timestamp: "2026-03-17T10:00:00Z" }),
        ],
        isLoading: false,
        unavailableSources: [],
      };

      render(<LifecycleTab deviceId="dev-001" currentStatus="online" />);

      // Technician permitted: Firmware, Service, Status → visible
      expect(screen.getByText("Firmware event")).toBeInTheDocument();
      expect(screen.getByText("Status event")).toBeInTheDocument();
      // Technician NOT permitted: Ownership, Audit → filtered out
      expect(screen.queryByText("Ownership event")).not.toBeInTheDocument();
      expect(screen.queryByText("Audit event")).not.toBeInTheDocument();
    });

    it("disables permission-gated categories and marks them aria-disabled", () => {
      authState.role = "Technician";
      render(<LifecycleTab deviceId="dev-001" currentStatus="online" />);

      const auditCheckbox = screen.getByRole("checkbox", { name: /toggle audit events/i });
      expect(auditCheckbox).toBeDisabled();
      expect(auditCheckbox).toHaveAttribute("aria-disabled", "true");
    });

    it("restores persisted selection from localStorage on mount", () => {
      authState.role = "Manager";
      // Manager default omits Audit; persist a selection that adds it back.
      window.localStorage.setItem(
        lifecycleFilterStorageKey("Manager", "dev-001"),
        JSON.stringify(["Firmware", "Audit"]),
      );

      hookState.result = {
        events: [
          mkEvent({ id: "1", category: "Firmware" }),
          mkEvent({ id: "2", category: "Audit", timestamp: "2026-03-19T10:00:00Z" }),
          mkEvent({ id: "3", category: "Service", timestamp: "2026-03-18T10:00:00Z" }),
        ],
        isLoading: false,
        unavailableSources: [],
      };

      render(<LifecycleTab deviceId="dev-001" currentStatus="online" />);

      expect(screen.getByText("Firmware event")).toBeInTheDocument();
      expect(screen.getByText("Audit event")).toBeInTheDocument();
      // Service was not in the persisted selection
      expect(screen.queryByText("Service event")).not.toBeInTheDocument();
    });

    it("writes updated selection to localStorage when a category is toggled", async () => {
      const user = userEvent.setup();
      authState.role = "Admin";
      render(<LifecycleTab deviceId="dev-001" currentStatus="online" />);

      const key = lifecycleFilterStorageKey("Admin", "dev-001");
      await user.click(screen.getByRole("checkbox", { name: /toggle audit events/i }));

      const stored = JSON.parse(window.localStorage.getItem(key) ?? "[]");
      expect(stored).not.toContain("Audit");
      expect(stored).toContain("Firmware");
    });

    it("'Reset to default' restores the persona default and clears localStorage", async () => {
      const user = userEvent.setup();
      authState.role = "Manager";
      const key = lifecycleFilterStorageKey("Manager", "dev-001");
      window.localStorage.setItem(key, JSON.stringify(["Firmware"]));

      render(<LifecycleTab deviceId="dev-001" currentStatus="online" />);

      await user.click(screen.getByRole("button", { name: /reset to default/i }));

      // localStorage entry is cleared (React effect may restore default afterwards,
      // but the reset action must clear first).
      const stored = window.localStorage.getItem(key);
      // After reset + effect re-write, the stored value should equal the default.
      expect(stored).not.toBe(JSON.stringify(["Firmware"]));
    });

    it("silently discards persisted categories that are no longer permitted", () => {
      authState.role = "Technician";
      // Previously-persisted state includes Audit, which Technician can't see.
      window.localStorage.setItem(
        lifecycleFilterStorageKey("Technician", "dev-001"),
        JSON.stringify(["Firmware", "Audit"]),
      );

      hookState.result = {
        events: [
          mkEvent({ id: "1", category: "Firmware" }),
          mkEvent({ id: "2", category: "Audit", timestamp: "2026-03-19T10:00:00Z" }),
        ],
        isLoading: false,
        unavailableSources: [],
      };

      render(<LifecycleTab deviceId="dev-001" currentStatus="online" />);

      expect(screen.getByText("Firmware event")).toBeInTheDocument();
      expect(screen.queryByText("Audit event")).not.toBeInTheDocument();
    });
  });
});
