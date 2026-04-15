/**
 * Tests for DeviceDetailPage — Story 3.7 (#429).
 *
 * Covers the Overview tab, loading skeleton, not-found fallback, breadcrumb,
 * and back navigation. Row-activation from the inventory table is covered by
 * the inventory page's own tests / smoke E2E; here we focus on the detail
 * page itself in isolation.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DeviceStatus } from "@/lib/types";
import type { MockDevice } from "@/lib/mock-data/inventory-data";

// ---------------------------------------------------------------------------
// Test doubles for the hook — keeps the page under test isolated from
// real mock data and from the TanStack Query plumbing.
// ---------------------------------------------------------------------------

const hookState = {
  devices: [] as MockDevice[],
  isLoading: false,
};

vi.mock("@/lib/hooks/use-device-inventory", () => ({
  useDeviceInventory: () => ({
    devices: hookState.devices,
    isLoading: hookState.isLoading,
  }),
}));

// Story 27.3 (#419) wiring: DeviceDetailPage now reads useAuth to role-gate
// the Ownership tab. Stub to Admin so all tabs render in these tests.
vi.mock("@/lib/use-auth", () => ({
  useAuth: () => ({ groups: ["Admin"] }),
}));

// Avoid needing a real CDC provider for the Ownership tab's hook.
vi.mock("@/lib/providers/registry", async () => {
  const actual = await vi.importActual<typeof import("@/lib/providers/registry")>(
    "@/lib/providers/registry",
  );
  return {
    ...actual,
    useCDCProvider: () => null,
  };
});

// Import AFTER mocks so the mocks are applied
import { DeviceDetailPage } from "@/app/components/inventory/device-detail-page";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TEST_DEVICE: MockDevice = {
  id: "d1",
  name: "INV-3200A",
  serial: "SN-4821",
  model: "INV-3200",
  status: DeviceStatus.Online,
  location: "Denver, CO",
  health: 98,
  firmware: "v4.0.0",
  lastSeen: "2m ago",
  lat: 39.7392,
  lng: -104.9903,
};

function renderAt(path: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/inventory/:deviceId" element={<DeviceDetailPage />} />
          <Route path="/inventory" element={<div data-testid="inventory-list">INVENTORY</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("DeviceDetailPage", () => {
  beforeEach(() => {
    hookState.devices = [];
    hookState.isLoading = false;
    vi.clearAllMocks();
  });

  describe("loaded state", () => {
    beforeEach(() => {
      hookState.devices = [TEST_DEVICE];
    });

    it("renders the breadcrumb and device name as the page heading", () => {
      renderAt("/inventory/d1");
      expect(screen.getByRole("navigation", { name: /breadcrumb/i })).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 1, name: TEST_DEVICE.name })).toBeInTheDocument();
      // Serial appears in both the header and the Overview field grid — both are
      // expected renderings; assert presence without over-constraining placement.
      expect(screen.getAllByText(TEST_DEVICE.serial).length).toBeGreaterThanOrEqual(1);
    });

    it("renders an Overview tab selected by default", () => {
      renderAt("/inventory/d1");
      const tab = screen.getByRole("tab", { name: /overview/i });
      expect(tab).toHaveAttribute("aria-selected", "true");
      expect(screen.getByRole("tabpanel")).toBeInTheDocument();
    });

    it("renders the Overview field grid with the core device fields", () => {
      renderAt("/inventory/d1");

      // A sample of fields — we assert on labels + values independently so
      // neither the label text nor the value formatting can silently drift.
      expect(screen.getByText("Model")).toBeInTheDocument();
      expect(screen.getByText(TEST_DEVICE.model)).toBeInTheDocument();

      expect(screen.getByText("Firmware Version")).toBeInTheDocument();
      expect(screen.getByText(TEST_DEVICE.firmware)).toBeInTheDocument();

      expect(screen.getByText("Location")).toBeInTheDocument();
      expect(screen.getByText(TEST_DEVICE.location)).toBeInTheDocument();

      expect(screen.getByText("Health Score")).toBeInTheDocument();
      expect(screen.getByText(`${TEST_DEVICE.health}%`)).toBeInTheDocument();
    });

    it("formats coordinates to 4 decimal places", () => {
      renderAt("/inventory/d1");
      expect(screen.getByText("39.7392, -104.9903")).toBeInTheDocument();
    });

    it("falls back to em dash when coordinates are missing", () => {
      hookState.devices = [{ ...TEST_DEVICE, lat: undefined, lng: undefined }];
      renderAt("/inventory/d1");
      const dashes = screen.getAllByText("—");
      // Coordinates row is one of them (location is populated, so it's not a dash)
      expect(dashes.length).toBeGreaterThanOrEqual(1);
    });

    it("navigates back to the inventory list when the back button is clicked", async () => {
      const user = userEvent.setup();
      renderAt("/inventory/d1");

      await user.click(screen.getByRole("button", { name: /back/i }));
      expect(screen.getByTestId("inventory-list")).toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("renders the skeleton and aria-live status while the hook is loading", () => {
      hookState.isLoading = true;
      renderAt("/inventory/d1");

      expect(screen.getByRole("status", { name: /loading device detail/i })).toBeInTheDocument();
      // Header / heading should NOT be rendered yet
      expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
    });
  });

  describe("not-found state", () => {
    it("shows the empty state when the deviceId is not in the list", () => {
      hookState.devices = [TEST_DEVICE]; // only d1 is loaded
      renderAt("/inventory/does-not-exist");

      expect(
        screen.getByRole("heading", { level: 2, name: /device not found/i }),
      ).toBeInTheDocument();
      expect(screen.getByText(/does-not-exist/)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /back to inventory/i })).toHaveAttribute(
        "href",
        "/inventory",
      );
    });

    it("renders a not-found-style screen when the deviceId param is empty", () => {
      hookState.devices = [TEST_DEVICE];
      // react-router will not match this route (missing :deviceId), so test
      // via a fully empty param by mounting at a route that intentionally
      // leaves the param undefined — here we assert the narrower behavior
      // of the component when mounted with deviceId = "" using the router.
      const qc = new QueryClient();
      render(
        <QueryClientProvider client={qc}>
          <MemoryRouter initialEntries={["/inventory/"]}>
            <Routes>
              <Route path="/inventory/:deviceId?" element={<DeviceDetailPage />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>,
      );

      expect(
        screen.getByRole("heading", { level: 2, name: /device not found/i }),
      ).toBeInTheDocument();
    });
  });
});
