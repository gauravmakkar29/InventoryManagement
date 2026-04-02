import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useServiceOrders } from "../../../lib/hooks/use-service-orders";

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  },
}));

describe("useServiceOrders", () => {
  it("initializes with orders from INITIAL_ORDERS", () => {
    const { result } = renderHook(() => useServiceOrders());
    expect(result.current.orders.length).toBeGreaterThan(0);
  });

  it("starts with 'all' filters", () => {
    const { result } = renderHook(() => useServiceOrders());
    expect(result.current.statusFilter).toBe("all");
    expect(result.current.priorityFilter).toBe("all");
    expect(result.current.searchQuery).toBe("");
  });

  // ===========================================================================
  // Filtering
  // ===========================================================================

  describe("filtering", () => {
    it("filters by status", () => {
      const { result } = renderHook(() => useServiceOrders());

      act(() => {
        result.current.setStatusFilter("Scheduled");
      });

      expect(result.current.filteredOrders.every((o) => o.status === "Scheduled")).toBe(true);
    });

    it("filters by priority", () => {
      const { result } = renderHook(() => useServiceOrders());

      act(() => {
        result.current.setPriorityFilter("High");
      });

      expect(result.current.filteredOrders.every((o) => o.priority === "High")).toBe(true);
    });

    it("filters by search query", () => {
      const { result } = renderHook(() => useServiceOrders());
      const firstOrder = result.current.orders[0]!;

      act(() => {
        result.current.setSearchQuery(firstOrder.id);
      });

      expect(result.current.filteredOrders.some((o) => o.id === firstOrder.id)).toBe(true);
    });

    it("search matches technician name", () => {
      const { result } = renderHook(() => useServiceOrders());

      act(() => {
        result.current.setSearchQuery("Martinez");
      });

      expect(
        result.current.filteredOrders.every((o) => o.technician.toLowerCase().includes("martinez")),
      ).toBe(true);
    });

    it("can combine status and priority filters", () => {
      const { result } = renderHook(() => useServiceOrders());

      act(() => {
        result.current.setStatusFilter("Scheduled");
        result.current.setPriorityFilter("High");
      });

      for (const order of result.current.filteredOrders) {
        expect(order.status).toBe("Scheduled");
        expect(order.priority).toBe("High");
      }
    });

    it("clears all filters", () => {
      const { result } = renderHook(() => useServiceOrders());
      const totalCount = result.current.orders.length;

      act(() => {
        result.current.setStatusFilter("Scheduled");
        result.current.setPriorityFilter("High");
        result.current.setSearchQuery("test");
      });

      act(() => {
        result.current.handleClearFilters();
      });

      expect(result.current.statusFilter).toBe("all");
      expect(result.current.priorityFilter).toBe("all");
      expect(result.current.searchQuery).toBe("");
      expect(result.current.filteredOrders.length).toBe(totalCount);
    });
  });

  // ===========================================================================
  // Grouping by status
  // ===========================================================================

  describe("ordersByStatus", () => {
    it("groups orders by status", () => {
      const { result } = renderHook(() => useServiceOrders());

      const grouped = result.current.ordersByStatus;
      expect(grouped).toHaveProperty("Scheduled");
      expect(grouped).toHaveProperty("InProgress");
      expect(grouped).toHaveProperty("Completed");

      const total = grouped.Scheduled.length + grouped.InProgress.length + grouped.Completed.length;
      expect(total).toBe(result.current.filteredOrders.length);
    });
  });

  // ===========================================================================
  // Status transitions
  // ===========================================================================

  describe("handleMove", () => {
    it("moves an order to a new status", () => {
      const { result } = renderHook(() => useServiceOrders());
      const scheduledOrder = result.current.orders.find((o) => o.status === "Scheduled");
      if (!scheduledOrder) return;

      act(() => {
        result.current.handleMove(scheduledOrder.id, "InProgress");
      });

      const updated = result.current.orders.find((o) => o.id === scheduledOrder.id);
      expect(updated?.status).toBe("InProgress");
    });

    it("moves to Completed status", () => {
      const { result } = renderHook(() => useServiceOrders());
      const order = result.current.orders[0]!;

      act(() => {
        result.current.handleMove(order.id, "Completed");
      });

      const updated = result.current.orders.find((o) => o.id === order.id);
      expect(updated?.status).toBe("Completed");
    });
  });

  // ===========================================================================
  // Create order
  // ===========================================================================

  describe("handleCreate", () => {
    it("creates a new order with auto-generated ID", () => {
      const { result } = renderHook(() => useServiceOrders());
      const countBefore = result.current.orders.length;

      act(() => {
        result.current.handleCreate({
          id: "", // will be overridden
          title: "New Test Order",
          description: "Test description",
          technician: "J. Martinez",
          scheduledDate: "2026-04-10",
          priority: "Medium",
          serviceType: "Internal",
          status: "Scheduled",
          location: "Denver",
          customer: "Test Customer",
        });
      });

      expect(result.current.orders.length).toBe(countBefore + 1);
      const newOrder = result.current.orders.find((o) => o.title === "New Test Order");
      expect(newOrder).toBeDefined();
      expect(newOrder!.id).toMatch(/^SO-\d+$/);
    });
  });
});
