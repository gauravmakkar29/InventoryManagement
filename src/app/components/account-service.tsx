import { useState } from "react";
import { Plus, Calendar, LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useAuth } from "@/lib/use-auth";
import { getPrimaryRole, canPerformAction } from "@/lib/rbac";
import { useServiceOrders } from "@/lib/hooks/use-service-orders";
import type { ServiceOrder } from "@/lib/mock-data/service-order-data";
import { KanbanColumn, COLUMN_ORDER } from "./service-orders/service-order-kanban";
import { CalendarView } from "./service-orders/service-order-calendar";
import { CreateOrderModal } from "./service-orders/create-order-modal";
import { FilterBar } from "./service-orders/service-order-filter-bar";

type ViewMode = "kanban" | "calendar";

/* ─── Main Component ──────────────────────────────────────────────── */

export function AccountService() {
  const [view, setView] = useState<ViewMode>("kanban");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Auth — RBAC for create button
  const { groups } = useAuth();
  const role = getPrimaryRole(groups);
  const canCreate = canPerformAction(role, "create");

  // Data hook
  const {
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
    handleCreate: hookCreate,
    handleClearFilters,
  } = useServiceOrders();

  const handleCreate = (order: ServiceOrder) => {
    if (!canPerformAction(role, "create")) {
      toast.error("Access denied — insufficient permissions");
      return;
    }
    try {
      hookCreate(order);
      setShowCreateModal(false);
    } catch (error: unknown) {
      // Modal stays open — form input is preserved so the user can retry.
      // hookCreate already shows a toast on API errors; only add a fallback
      // for truly unexpected failures.
      if (error instanceof Error && !error.message.includes("failed")) {
        toast.error("Failed to create service order. Please try again.");
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-foreground">Service Orders</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage field service operations and work orders
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle — segmented control */}
          <div className="flex rounded border border-border overflow-hidden">
            <button
              onClick={() => setView("kanban")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold transition-colors duration-150",
                view === "kanban"
                  ? "bg-accent text-white"
                  : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Kanban
            </button>
            <button
              onClick={() => setView("calendar")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold transition-colors duration-150",
                view === "calendar"
                  ? "bg-accent text-white"
                  : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              <Calendar className="h-3.5 w-3.5" />
              Calendar
            </button>
          </div>

          {/* Create Order — Admin/Manager only */}
          {canCreate && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 rounded bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent-hover transition-colors duration-150"
            >
              <Plus className="h-3.5 w-3.5" />
              Create Order
            </button>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <FilterBar
        statusFilter={statusFilter}
        priorityFilter={priorityFilter}
        searchQuery={searchQuery}
        onStatusChange={setStatusFilter}
        onPriorityChange={setPriorityFilter}
        onSearchChange={setSearchQuery}
        onClearAll={handleClearFilters}
        filteredOrders={filteredOrders}
        filteredCount={filteredOrders.length}
        totalCount={orders.length}
      />

      {/* Content */}
      {view === "kanban" ? (
        <DndProvider backend={HTML5Backend}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {COLUMN_ORDER.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                orders={ordersByStatus[status]}
                onMove={handleMove}
              />
            ))}
          </div>
        </DndProvider>
      ) : (
        <CalendarView orders={filteredOrders} />
      )}

      {/* Create modal */}
      {showCreateModal && (
        <CreateOrderModal onClose={() => setShowCreateModal(false)} onCreate={handleCreate} />
      )}
    </div>
  );
}
