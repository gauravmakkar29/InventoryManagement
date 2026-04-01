import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import type { ServiceOrder, Status } from "../mock-data/service-order-data";
import { INITIAL_ORDERS, STATUS_LABELS } from "../mock-data/service-order-data";

function generateNextId(orders: ServiceOrder[]): string {
  const maxNum = orders.reduce((max, o) => {
    const n = parseInt(o.id.replace("SO-", ""), 10);
    return n > max ? n : max;
  }, 0);
  return `SO-${maxNum + 1}`;
}

function exportToCsv(orders: ServiceOrder[]): void {
  const header =
    "ID,Title,Status,Priority,Technician,Location,Scheduled Date,Service Type,Customer";
  const rows = orders.map(
    (o) =>
      `"${o.id}","${o.title}","${STATUS_LABELS[o.status]}","${o.priority}","${o.technician}","${o.location}","${o.scheduledDate}","${o.serviceType}","${o.customer}"`,
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `service-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  toast.success("CSV exported successfully");
}

export function useServiceOrders() {
  const [orders, setOrders] = useState<ServiceOrder[]>(INITIAL_ORDERS);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (priorityFilter !== "all" && o.priority !== priorityFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match =
          o.id.toLowerCase().includes(q) ||
          o.title.toLowerCase().includes(q) ||
          o.technician.toLowerCase().includes(q) ||
          o.location.toLowerCase().includes(q) ||
          o.customer.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [orders, statusFilter, priorityFilter, searchQuery]);

  const ordersByStatus = useMemo(() => {
    const grouped: Record<Status, ServiceOrder[]> = {
      Scheduled: [],
      InProgress: [],
      Completed: [],
    };
    for (const o of filteredOrders) {
      grouped[o.status].push(o);
    }
    return grouped;
  }, [filteredOrders]);

  const handleMove = useCallback((id: string, newStatus: Status) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)));
    toast.success(`Order moved to ${STATUS_LABELS[newStatus]}`);
  }, []);

  const handleCreate = useCallback(
    (order: ServiceOrder) => {
      const newOrder: ServiceOrder = {
        ...order,
        id: generateNextId(orders),
      };
      setOrders((prev) => [...prev, newOrder]);
      toast.success(`Service order ${newOrder.id} created`);
      return newOrder;
    },
    [orders],
  );

  const handleClearFilters = useCallback(() => {
    setStatusFilter("all");
    setPriorityFilter("all");
    setSearchQuery("");
  }, []);

  const handleExport = useCallback(() => {
    exportToCsv(filteredOrders);
  }, [filteredOrders]);

  return {
    orders,
    filteredOrders,
    ordersByStatus,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    searchQuery,
    setSearchQuery,
    handleMove,
    handleCreate,
    handleClearFilters,
    handleExport,
  };
}
