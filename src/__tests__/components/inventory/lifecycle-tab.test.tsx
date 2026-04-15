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
}));

vi.mock("sonner", () => ({
  toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() },
}));

// Import AFTER mocks
import { LifecycleTab } from "@/app/components/inventory/lifecycle-tab";

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
    vi.clearAllMocks();
  });

  it("shows the loading skeleton while the hook is loading", () => {
    hookState.result = { events: [], isLoading: true, unavailableSources: [] };
    render(<LifecycleTab deviceId="dev-001" />);
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

    render(<LifecycleTab deviceId="dev-001" />);

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

    render(<LifecycleTab deviceId="dev-001" />);

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
    render(<LifecycleTab deviceId="dev-001" />);

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
    render(<LifecycleTab deviceId="dev-001" />);
    expect(screen.getByRole("alert")).toHaveTextContent(/audit history/i);
  });

  it("shows the empty state when no events match the current filter", () => {
    hookState.result = { events: [], isLoading: false, unavailableSources: [] };
    render(<LifecycleTab deviceId="dev-001" />);
    expect(screen.getByText(/no lifecycle events in this window/i)).toBeInTheDocument();
  });

  it("disables the Export CSV button when there are no visible events", () => {
    hookState.result = { events: [], isLoading: false, unavailableSources: [] };
    render(<LifecycleTab deviceId="dev-001" />);
    expect(screen.getByRole("button", { name: /export csv/i })).toBeDisabled();
  });
});
