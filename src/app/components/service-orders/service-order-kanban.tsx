import { Clock, MapPin, ArrowRight, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  ServiceOrder,
  Status,
  Priority,
  ServiceType,
} from "@/lib/mock-data/service-order-data";
import { STATUS_LABELS } from "@/lib/mock-data/service-order-data";

/* ─── Constants ───────────────────────────────────────────────────── */

export const PRIORITY_BG: Record<Priority, string> = {
  High: "bg-red-600 text-white",
  Medium: "bg-amber-500 text-white",
  Low: "bg-green-600 text-white",
};

export const COLUMN_ORDER: Status[] = ["Scheduled", "InProgress", "Completed"];

/* ─── Helpers ─────────────────────────────────────────────────────── */

function getInitials(name: string): string {
  return name
    .split(/[\s.]+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDisplayDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

/* ─── Sub-components ──────────────────────────────────────────────── */

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[12px] font-semibold leading-none",
        PRIORITY_BG[priority],
      )}
    >
      {priority}
    </span>
  );
}

export function ServiceTypeBadge({ type }: { type: ServiceType }) {
  return (
    <span className="inline-flex items-center rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[12px] font-medium text-muted-foreground leading-none">
      {type}
    </span>
  );
}

function TechnicianAvatar({ name }: { name: string }) {
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-[12px] font-bold text-white">
      {getInitials(name)}
    </span>
  );
}

/* ─── Kanban Card ─────────────────────────────────────────────────── */

function KanbanCard({
  order,
  onMove,
}: {
  order: ServiceOrder;
  onMove: (id: string, newStatus: Status) => void;
}) {
  return (
    <div className="rounded border border-border bg-card p-3 space-y-2 hover:border-accent-text/40 transition-colors duration-150">
      {/* Top row: ID + Priority */}
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-mono text-muted-foreground">{order.id}</span>
        <PriorityBadge priority={order.priority} />
      </div>

      {/* Title */}
      <p className="text-sm font-semibold text-foreground leading-snug">{order.title}</p>

      {/* Technician + Date */}
      <div className="flex items-center gap-2">
        <TechnicianAvatar name={order.technician} />
        <span className="text-[13px] text-foreground">{order.technician}</span>
      </div>

      <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatDisplayDate(order.scheduledDate)}
        </span>
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {order.location}
        </span>
      </div>

      {/* Service type tag */}
      <div className="flex items-center justify-between">
        <ServiceTypeBadge type={order.serviceType} />
        {/* Move actions */}
        <div className="flex gap-1">
          {order.status === "Scheduled" && (
            <button
              onClick={() => onMove(order.id, "InProgress")}
              className="flex items-center gap-0.5 rounded bg-blue-600 px-1.5 py-0.5 text-[12px] font-medium text-white hover:bg-blue-700 transition-colors"
              title="Move to In Progress"
            >
              <ArrowRight className="h-2.5 w-2.5" />
              Start
            </button>
          )}
          {order.status === "InProgress" && (
            <button
              onClick={() => onMove(order.id, "Completed")}
              className="flex items-center gap-0.5 rounded bg-green-600 px-1.5 py-0.5 text-[12px] font-medium text-white hover:bg-green-700 transition-colors"
              title="Mark as Completed"
            >
              <CheckCircle className="h-2.5 w-2.5" />
              Complete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Kanban Column ───────────────────────────────────────────────── */

export function KanbanColumn({
  status,
  orders,
  onMove,
}: {
  status: Status;
  orders: ServiceOrder[];
  onMove: (id: string, newStatus: Status) => void;
}) {
  const sorted = [...orders].sort(
    (a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime(),
  );

  return (
    <div className="flex flex-col rounded border border-border bg-muted min-h-[300px]">
      {/* Column header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <h3 className="text-sm font-bold text-foreground">{STATUS_LABELS[status]}</h3>
        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-slate-200 px-1.5 text-[12px] font-bold text-slate-700">
          {orders.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 space-y-2 p-2">
        {sorted.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground italic">
            No orders
          </div>
        ) : (
          sorted.map((order) => <KanbanCard key={order.id} order={order} onMove={onMove} />)
        )}
      </div>
    </div>
  );
}
