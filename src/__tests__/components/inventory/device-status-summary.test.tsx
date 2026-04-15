/**
 * Tests for DeviceStatusSummary — Story 27.5 (#421).
 *
 * Pure-UI assertions. The availability math + flapping detection are
 * exhaustively covered at the mapper level (device-status.mapper.test.ts);
 * these tests only verify that the component surfaces the right summary
 * in each state.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DeviceStatusSummary } from "@/app/components/inventory/device-status-summary";
import type { DeviceLifecycleEvent } from "@/lib/types";

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

const DEVICE_CREATED_AT = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();

function statusEvent(
  hoursAgo: number,
  from: string,
  to: string,
  id = `evt-${Math.random()}`,
): DeviceLifecycleEvent {
  return {
    id: `AuditLog:${id}:ts`,
    deviceId: "dev-001",
    category: "Status",
    action: "status.changed",
    actor: { userId: "user-1", displayName: "user.one@example.com" },
    timestamp: new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString(),
    summary: `Status changed to ${to}`,
    sourceEntityType: "AuditLog",
    sourceEntityId: id,
    metadata: {
      oldValue: { status: from },
      newValue: { status: to },
      cdcAction: "update",
    },
  };
}

function renderSummary(currentStatus: string, lifecycleEvents: DeviceLifecycleEvent[] = []) {
  return render(
    <DeviceStatusSummary
      deviceId="dev-001"
      currentStatus={currentStatus}
      deviceCreatedAt={DEVICE_CREATED_AT}
      lifecycleEvents={lifecycleEvents}
      timeRange="30d"
    />,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("DeviceStatusSummary", () => {
  it("renders the current status badge and a 'for {duration}' caption", () => {
    renderSummary("online");
    // StatusBadge renders the status text
    expect(screen.getByText("online")).toBeInTheDocument();
    expect(screen.getByText(/for/)).toBeInTheDocument();
  });

  it("renders an availability percentage for non-decommissioned devices", () => {
    renderSummary("online");
    // With no status changes, device has been online since creation → 100%
    expect(screen.getByText(/\d+(\.\d+)?%/)).toBeInTheDocument();
    expect(screen.queryByText(/N\/A/)).not.toBeInTheDocument();
  });

  it("renders 'N/A' and a decommissioned note when the device is decommissioned", () => {
    renderSummary("decommissioned");
    expect(screen.getByText("N/A")).toBeInTheDocument();
    expect(screen.getByRole("note")).toHaveTextContent(/decommissioned/i);
  });

  it("renders the flapping indicator when >5 status changes occurred in the last 24h", () => {
    // 6 changes all within the last 24 hours
    const events: DeviceLifecycleEvent[] = [
      statusEvent(1, "online", "offline", "a"),
      statusEvent(3, "offline", "online", "b"),
      statusEvent(5, "online", "offline", "c"),
      statusEvent(8, "offline", "online", "d"),
      statusEvent(11, "online", "offline", "e"),
      statusEvent(15, "offline", "online", "f"),
    ];
    renderSummary("online", events);
    expect(screen.getByRole("status")).toHaveTextContent(/flapping/i);
    expect(screen.getByRole("status")).toHaveTextContent(/6/);
  });

  it("does NOT render the flapping indicator when changes are below threshold", () => {
    const events: DeviceLifecycleEvent[] = [
      statusEvent(1, "online", "offline", "a"),
      statusEvent(3, "offline", "online", "b"),
    ];
    renderSummary("online", events);
    expect(screen.queryByText(/flapping/i)).not.toBeInTheDocument();
  });
});
