/**
 * Tests for OwnershipTab — Story 27.3 (#419).
 *
 * Derivation math is exhaustively covered by device-ownership.mapper.test.ts.
 * These tests verify UI surface: chain rendering, empty state, expandable
 * reasons, RBAC scoping for CustomerAdmin, and CSV export gating.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { DeviceOwnershipRecord } from "@/lib/types";
import type { Role } from "@/lib/rbac";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const hookState: {
  records: DeviceOwnershipRecord[];
  isLoading: boolean;
  lastOptions: unknown;
} = {
  records: [],
  isLoading: false,
  lastOptions: undefined,
};

vi.mock("@/lib/hooks/use-device-ownership-chain", () => ({
  useDeviceOwnershipChain: (_deviceId: string, opts: unknown) => {
    hookState.lastOptions = opts;
    return { records: hookState.records, isLoading: hookState.isLoading, isError: false };
  },
}));

const authState: { role: Role } = { role: "Admin" };

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

vi.mock("sonner", () => ({
  toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() },
}));

import { OwnershipTab } from "@/app/components/inventory/ownership-tab";

// ---------------------------------------------------------------------------
// Fixture builder
// ---------------------------------------------------------------------------

function record(overrides: Partial<DeviceOwnershipRecord>): DeviceOwnershipRecord {
  return {
    customerId: "cust-A",
    customerName: "Customer A",
    startAt: "2024-01-01T00:00:00Z",
    endAt: "2024-06-15T00:00:00Z",
    durationDays: 166,
    transferredBy: { userId: "u-admin", displayName: "admin@example.com" },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("OwnershipTab", () => {
  beforeEach(() => {
    hookState.records = [];
    hookState.isLoading = false;
    authState.role = "Admin";
    vi.clearAllMocks();
  });

  it("renders skeleton loaders while the hook is loading", () => {
    hookState.isLoading = true;
    render(<OwnershipTab deviceId="dev-001" currentCustomerId="cust-A" />);
    expect(screen.getByRole("status", { name: /loading ownership chain/i })).toBeInTheDocument();
  });

  it("renders an empty-state message when only the initial seed record is present", () => {
    hookState.records = [
      record({ startAt: "2024-01-01T00:00:00Z", endAt: null, durationDays: 820 }),
    ];
    render(<OwnershipTab deviceId="dev-001" currentCustomerId="cust-A" />);
    expect(screen.getByText(/no ownership changes recorded/i)).toBeInTheDocument();
  });

  it("renders every record in the chain with the 'Current' badge on the open record", () => {
    hookState.records = [
      record({
        customerId: "cust-A",
        customerName: "Shanghai Power Systems",
        endAt: "2024-06-15T00:00:00Z",
      }),
      record({
        customerId: "cust-B",
        customerName: "Sydney Solar Farms",
        startAt: "2024-06-15T00:00:00Z",
        endAt: null,
        durationDays: 650,
      }),
    ];
    render(<OwnershipTab deviceId="dev-001" currentCustomerId="cust-B" />);

    expect(screen.getByText("Shanghai Power Systems")).toBeInTheDocument();
    expect(screen.getByText("Sydney Solar Farms")).toBeInTheDocument();
    // "Current" appears twice — as the badge AND as the italic end-date for
    // the open record. Assert both renderings are present without pinning
    // to an exact count.
    expect(screen.getAllByText("Current").length).toBeGreaterThanOrEqual(2);
  });

  it("hides the transfer reason behind an expand toggle when present", async () => {
    const user = userEvent.setup();
    hookState.records = [
      record({
        customerId: "cust-A",
        customerName: "Shanghai Power Systems",
        endAt: "2024-06-15T00:00:00Z",
      }),
      record({
        customerId: "cust-B",
        customerName: "Sydney Solar Farms",
        startAt: "2024-06-15T00:00:00Z",
        endAt: null,
        durationDays: 650,
        transferReason: "warranty replacement",
      }),
    ];
    render(<OwnershipTab deviceId="dev-001" currentCustomerId="cust-B" />);

    // Collapsed by default
    expect(screen.queryByText("warranty replacement")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /expand transfer reason/i }));

    expect(screen.getByText("warranty replacement")).toBeInTheDocument();
  });

  it("Export CSV button is disabled when the chain is empty", () => {
    hookState.records = [];
    render(<OwnershipTab deviceId="dev-001" currentCustomerId="cust-A" />);
    expect(screen.getByRole("button", { name: /export csv/i })).toBeDisabled();
  });

  it("passes role + scopedCustomerId to the hook for CustomerAdmin", () => {
    authState.role = "CustomerAdmin";
    render(<OwnershipTab deviceId="dev-001" currentCustomerId="cust-A" />);
    expect(hookState.lastOptions).toMatchObject({
      role: "CustomerAdmin",
      scopedCustomerId: "cust-A",
    });
  });

  it("does NOT pass scopedCustomerId for Admin or Manager", () => {
    authState.role = "Admin";
    render(<OwnershipTab deviceId="dev-001" currentCustomerId="cust-A" />);
    expect(hookState.lastOptions).toMatchObject({ scopedCustomerId: undefined });
  });
});
