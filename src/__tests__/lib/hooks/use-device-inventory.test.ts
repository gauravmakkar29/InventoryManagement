import { describe, it, expect, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { useDeviceInventory } from "@/lib/hooks/use-device-inventory";
import { DeviceStatus } from "@/lib/types";

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

describe("useDeviceInventory", () => {
  it("initializes with default state", () => {
    const { result } = renderHook(() => useDeviceInventory(), { wrapper: createWrapper() });

    expect(result.current.devices.length).toBeGreaterThan(0);
    expect(result.current.search).toBe("");
    expect(result.current.sortField).toBe("name");
    expect(result.current.sortDir).toBe("asc");
    expect(result.current.page).toBe(1);
  });

  // ===========================================================================
  // Search / filtering
  // ===========================================================================

  describe("search", () => {
    it("filters devices by name", () => {
      const { result } = renderHook(() => useDeviceInventory(), { wrapper: createWrapper() });
      const totalBefore = result.current.filteredDevices.length;

      act(() => {
        result.current.setSearch("INV-3200A");
      });

      expect(result.current.filteredDevices.length).toBeLessThanOrEqual(totalBefore);
      expect(result.current.filteredDevices.every((d) => d.name.includes("INV-3200A"))).toBe(true);
    });

    it("filters devices by serial number", () => {
      const { result } = renderHook(() => useDeviceInventory(), { wrapper: createWrapper() });

      act(() => {
        result.current.setSearch("SN-4821");
      });

      expect(
        result.current.filteredDevices.every((d) => d.serial.toLowerCase().includes("sn-4821")),
      ).toBe(true);
    });

    it("filters by location", () => {
      const { result } = renderHook(() => useDeviceInventory(), { wrapper: createWrapper() });

      act(() => {
        result.current.setSearch("Denver");
      });

      expect(
        result.current.filteredDevices.every((d) => d.location.toLowerCase().includes("denver")),
      ).toBe(true);
    });

    it("returns all devices for empty search", () => {
      const { result } = renderHook(() => useDeviceInventory(), { wrapper: createWrapper() });
      const allCount = result.current.filteredDevices.length;

      act(() => {
        result.current.setSearch("nonexistent-device-xyz");
      });
      expect(result.current.filteredDevices.length).toBe(0);

      act(() => {
        result.current.setSearch("");
      });
      expect(result.current.filteredDevices.length).toBe(allCount);
    });
  });

  // ===========================================================================
  // Advanced filters
  // ===========================================================================

  describe("advanced filters", () => {
    it("filters by status", () => {
      const { result } = renderHook(() => useDeviceInventory(), { wrapper: createWrapper() });

      act(() => {
        result.current.setAdvancedFilters({ status: DeviceStatus.Online });
      });

      expect(result.current.filteredDevices.every((d) => d.status === DeviceStatus.Online)).toBe(
        true,
      );
    });

    it("filters by health score range", () => {
      const { result } = renderHook(() => useDeviceInventory(), { wrapper: createWrapper() });

      act(() => {
        result.current.setAdvancedFilters({ healthScoreMin: 90, healthScoreMax: 100 });
      });

      for (const d of result.current.filteredDevices) {
        expect(d.health).toBeGreaterThanOrEqual(90);
        expect(d.health).toBeLessThanOrEqual(100);
      }
    });
  });

  // ===========================================================================
  // Sorting
  // ===========================================================================

  describe("sorting", () => {
    it("toggles sort direction on same field", () => {
      const { result } = renderHook(() => useDeviceInventory(), { wrapper: createWrapper() });

      expect(result.current.sortDir).toBe("asc");

      act(() => {
        result.current.handleSort("name");
      });
      expect(result.current.sortDir).toBe("desc");

      act(() => {
        result.current.handleSort("name");
      });
      expect(result.current.sortDir).toBe("asc");
    });

    it("resets to asc when changing sort field", () => {
      const { result } = renderHook(() => useDeviceInventory(), { wrapper: createWrapper() });

      act(() => {
        result.current.handleSort("name"); // toggle to desc
      });
      expect(result.current.sortDir).toBe("desc");

      act(() => {
        result.current.handleSort("health"); // new field → asc
      });
      expect(result.current.sortField).toBe("health");
      expect(result.current.sortDir).toBe("asc");
    });

    it("sorts by health numerically", () => {
      const { result } = renderHook(() => useDeviceInventory(), { wrapper: createWrapper() });

      act(() => {
        result.current.handleSort("health");
      });

      // In ascending order — set to health field, should be asc initially
      // But handleSort toggles since default is "name", so first call sets field to "health" and dir to "asc"
      const healthValues = result.current.filteredDevices.map((d) => d.health);
      for (let i = 1; i < healthValues.length; i++) {
        expect(healthValues[i]!).toBeGreaterThanOrEqual(healthValues[i - 1]!);
      }
    });
  });

  // ===========================================================================
  // Pagination
  // ===========================================================================

  describe("pagination", () => {
    it("paginates devices (page size = 6)", () => {
      const { result } = renderHook(() => useDeviceInventory(), { wrapper: createWrapper() });

      expect(result.current.paginatedDevices.length).toBeLessThanOrEqual(6);
      expect(result.current.totalPages).toBeGreaterThanOrEqual(1);
    });

    it("changes page correctly", () => {
      const { result } = renderHook(() => useDeviceInventory(), { wrapper: createWrapper() });

      if (result.current.totalPages > 1) {
        act(() => {
          result.current.setPage(2);
        });
        expect(result.current.page).toBe(2);
      }
    });

    it("clamps page to totalPages", () => {
      const { result } = renderHook(() => useDeviceInventory(), { wrapper: createWrapper() });

      act(() => {
        result.current.setPage(999);
      });
      expect(result.current.page).toBeLessThanOrEqual(result.current.totalPages);
    });
  });

  // ===========================================================================
  // Status change
  // ===========================================================================

  describe("handleStatusChange", () => {
    it("updates device status", async () => {
      const { result } = renderHook(() => useDeviceInventory(), { wrapper: createWrapper() });
      const firstDevice = result.current.devices[0]!;

      act(() => {
        result.current.handleStatusChange(firstDevice.id, DeviceStatus.Maintenance);
      });

      await waitFor(() => {
        const updated = result.current.devices.find((d) => d.id === firstDevice.id);
        expect(updated?.status).toBe(DeviceStatus.Maintenance);
      });
    });

    it("sets health to 0 when going offline", async () => {
      const { result } = renderHook(() => useDeviceInventory(), { wrapper: createWrapper() });
      const device = result.current.devices.find((d) => d.status === DeviceStatus.Online);
      if (!device) return;

      act(() => {
        result.current.handleStatusChange(device.id, DeviceStatus.Offline);
      });

      await waitFor(() => {
        const updated = result.current.devices.find((d) => d.id === device.id);
        expect(updated?.health).toBe(0);
      });
    });
  });

  // ===========================================================================
  // Create device
  // ===========================================================================

  describe("handleCreateDevice", () => {
    it("adds a new device to the list", async () => {
      const { result } = renderHook(() => useDeviceInventory(), { wrapper: createWrapper() });
      const countBefore = result.current.devices.length;

      act(() => {
        result.current.handleCreateDevice({
          name: "Test Device",
          serial: "SN-TEST",
          model: "TEST-100",
          firmware: "v1.0.0",
          status: DeviceStatus.Online,
          location: "Test Location",
        });
      });

      await waitFor(() => {
        expect(result.current.devices.length).toBe(countBefore + 1);
      });
      expect(result.current.devices[0]?.name).toBe("Test Device");
    });

    it("assigns health 100 for online devices", async () => {
      const { result } = renderHook(() => useDeviceInventory(), { wrapper: createWrapper() });

      act(() => {
        result.current.handleCreateDevice({
          name: "Online Device",
          serial: "SN-ONLINE",
          model: "TEST-100",
          firmware: "v1.0.0",
          status: DeviceStatus.Online,
          location: "Test",
        });
      });

      await waitFor(() => {
        expect(result.current.devices[0]?.health).toBe(100);
      });
    });

    it("assigns health 0 for offline devices", async () => {
      const { result } = renderHook(() => useDeviceInventory(), { wrapper: createWrapper() });

      act(() => {
        result.current.handleCreateDevice({
          name: "Offline Device",
          serial: "SN-OFFLINE",
          model: "TEST-100",
          firmware: "v1.0.0",
          status: DeviceStatus.Offline,
          location: "Test",
        });
      });

      await waitFor(() => {
        expect(result.current.devices[0]?.health).toBe(0);
      });
    });
  });
});
