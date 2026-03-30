import { useState, useMemo, useCallback, type FormEvent } from "react";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Search,
  Download,
  X,
  Calendar,
  LayoutGrid,
  MapPin,
  Clock,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../lib/utils";
import { useAuth } from "../../lib/use-auth";
import { getPrimaryRole, canPerformAction } from "../../lib/rbac";

/* ─── Types ───────────────────────────────────────────────────────── */

type ViewMode = "kanban" | "calendar";
type Status = "Scheduled" | "InProgress" | "Completed";
type Priority = "High" | "Medium" | "Low";
type ServiceType = "Internal" | "3rd Party";

interface ServiceOrder {
  id: string;
  title: string;
  description: string;
  technician: string;
  scheduledDate: string; // ISO date string YYYY-MM-DD
  priority: Priority;
  serviceType: ServiceType;
  status: Status;
  location: string;
  customer: string;
}

/* ─── Mock Data (12 orders) ───────────────────────────────────────── */

const INITIAL_ORDERS: ServiceOrder[] = [
  {
    id: "SO-1001",
    title: "Quarterly inverter inspection",
    description: "Routine quarterly inspection of inverter rack A-14.",
    technician: "J. Martinez",
    scheduledDate: "2026-03-30",
    priority: "High",
    serviceType: "Internal",
    status: "Scheduled",
    location: "Denver",
    customer: "SolarEdge Corp",
  },
  {
    id: "SO-1002",
    title: "Firmware patch deployment",
    description: "Deploy firmware v3.8.1 to field controllers.",
    technician: "A. Chen",
    scheduledDate: "2026-04-01",
    priority: "Medium",
    serviceType: "Internal",
    status: "Scheduled",
    location: "Houston",
    customer: "GridSync LLC",
  },
  {
    id: "SO-1003",
    title: "Battery module replacement",
    description: "Replace degraded lithium-ion module in rack B-7.",
    technician: "S. Kumar",
    scheduledDate: "2026-04-03",
    priority: "High",
    serviceType: "3rd Party",
    status: "Scheduled",
    location: "Chicago",
    customer: "PowerVault Inc",
  },
  {
    id: "SO-1004",
    title: "Network switch reconfiguration",
    description: "Reconfigure VLAN settings on monitoring switches.",
    technician: "M. Johnson",
    scheduledDate: "2026-04-05",
    priority: "Low",
    serviceType: "Internal",
    status: "Scheduled",
    location: "Dallas",
    customer: "SolarEdge Corp",
  },
  {
    id: "SO-1005",
    title: "Emergency transformer repair",
    description: "Urgent repair of step-up transformer unit T-3.",
    technician: "J. Martinez",
    scheduledDate: "2026-03-27",
    priority: "High",
    serviceType: "3rd Party",
    status: "InProgress",
    location: "New York",
    customer: "ConEdison Solar",
  },
  {
    id: "SO-1006",
    title: "Sensor calibration — Site B",
    description: "Calibrate irradiance and temperature sensors.",
    technician: "R. Davis",
    scheduledDate: "2026-03-28",
    priority: "Medium",
    serviceType: "Internal",
    status: "InProgress",
    location: "Phoenix",
    customer: "ArizonaSun Energy",
  },
  {
    id: "SO-1007",
    title: "HVAC controller update",
    description: "Update HVAC controllers to latest protocol.",
    technician: "A. Chen",
    scheduledDate: "2026-03-25",
    priority: "Low",
    serviceType: "Internal",
    status: "InProgress",
    location: "Denver",
    customer: "SolarEdge Corp",
  },
  {
    id: "SO-1008",
    title: "Panel cleaning — Zone 4",
    description: "Scheduled cleaning of solar panels in Zone 4.",
    technician: "S. Kumar",
    scheduledDate: "2026-03-26",
    priority: "Medium",
    serviceType: "3rd Party",
    status: "InProgress",
    location: "Houston",
    customer: "GridSync LLC",
  },
  {
    id: "SO-1009",
    title: "Annual compliance audit",
    description: "Full compliance audit per NIST 800-53 controls.",
    technician: "M. Johnson",
    scheduledDate: "2026-03-20",
    priority: "High",
    serviceType: "Internal",
    status: "Completed",
    location: "Chicago",
    customer: "PowerVault Inc",
  },
  {
    id: "SO-1010",
    title: "Grounding system test",
    description: "Test grounding resistance at all junction boxes.",
    technician: "R. Davis",
    scheduledDate: "2026-03-18",
    priority: "Low",
    serviceType: "Internal",
    status: "Completed",
    location: "Dallas",
    customer: "SolarEdge Corp",
  },
  {
    id: "SO-1011",
    title: "Inverter firmware rollback",
    description: "Rollback inverter firmware due to field issue.",
    technician: "J. Martinez",
    scheduledDate: "2026-03-22",
    priority: "Medium",
    serviceType: "3rd Party",
    status: "Completed",
    location: "New York",
    customer: "ConEdison Solar",
  },
  {
    id: "SO-1012",
    title: "Thermal imaging survey",
    description: "Conduct IR thermal imaging survey of panel arrays.",
    technician: "A. Chen",
    scheduledDate: "2026-04-08",
    priority: "Low",
    serviceType: "Internal",
    status: "Scheduled",
    location: "Phoenix",
    customer: "ArizonaSun Energy",
  },
];

/* ─── Constants ───────────────────────────────────────────────────── */

const PRIORITY_BG: Record<Priority, string> = {
  High: "bg-red-600 text-white",
  Medium: "bg-amber-500 text-white",
  Low: "bg-green-600 text-white",
};

const STATUS_LABELS: Record<Status, string> = {
  Scheduled: "Scheduled",
  InProgress: "In Progress",
  Completed: "Completed",
};

const COLUMN_ORDER: Status[] = ["Scheduled", "InProgress", "Completed"];

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const TECHNICIANS = ["J. Martinez", "A. Chen", "S. Kumar", "M. Johnson", "R. Davis"];

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

function isSameDay(iso: string, year: number, month: number, day: number): boolean {
  const d = new Date(iso + "T00:00:00");
  return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
}

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

/* ─── Calendar Utilities ──────────────────────────────────────────── */

function getCalendarDays(
  year: number,
  month: number,
): Array<{ day: number; inMonth: boolean; date: Date }> {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  // Monday = 0, Sunday = 6 (ISO week)
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const days: Array<{ day: number; inMonth: boolean; date: Date }> = [];

  // Previous month padding
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDow - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i;
    days.push({ day: d, inMonth: false, date: new Date(year, month - 1, d) });
  }

  // Current month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push({ day: d, inMonth: true, date: new Date(year, month, d) });
  }

  // Next month padding to fill grid (6 rows)
  const totalCells = Math.ceil(days.length / 7) * 7;
  let nextDay = 1;
  while (days.length < totalCells) {
    days.push({ day: nextDay, inMonth: false, date: new Date(year, month + 1, nextDay) });
    nextDay++;
  }

  return days;
}

/* ─── Sub-components ──────────────────────────────────────────────── */

function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none",
        PRIORITY_BG[priority],
      )}
    >
      {priority}
    </span>
  );
}

function ServiceTypeBadge({ type }: { type: ServiceType }) {
  return (
    <span className="inline-flex items-center rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground leading-none">
      {type}
    </span>
  );
}

function TechnicianAvatar({ name }: { name: string }) {
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-[9px] font-bold text-white">
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
    <div className="rounded border border-border bg-white p-3 space-y-2 hover:border-[#FF7900]/40 transition-colors duration-150">
      {/* Top row: ID + Priority */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-muted-foreground">{order.id}</span>
        <PriorityBadge priority={order.priority} />
      </div>

      {/* Title */}
      <p className="text-xs font-semibold text-foreground leading-snug">{order.title}</p>

      {/* Technician + Date */}
      <div className="flex items-center gap-2">
        <TechnicianAvatar name={order.technician} />
        <span className="text-[11px] text-foreground">{order.technician}</span>
      </div>

      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
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
              className="flex items-center gap-0.5 rounded bg-blue-600 px-1.5 py-0.5 text-[9px] font-medium text-white hover:bg-blue-700 transition-colors"
              title="Move to In Progress"
            >
              <ArrowRight className="h-2.5 w-2.5" />
              Start
            </button>
          )}
          {order.status === "InProgress" && (
            <button
              onClick={() => onMove(order.id, "Completed")}
              className="flex items-center gap-0.5 rounded bg-green-600 px-1.5 py-0.5 text-[9px] font-medium text-white hover:bg-green-700 transition-colors"
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

function KanbanColumn({
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
    <div className="flex flex-col rounded border border-border bg-gray-50 min-h-[300px]">
      {/* Column header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <h3 className="text-xs font-bold text-foreground">{STATUS_LABELS[status]}</h3>
        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-slate-200 px-1.5 text-[10px] font-bold text-slate-700">
          {orders.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 space-y-2 p-2">
        {sorted.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-xs text-muted-foreground italic">
            No orders
          </div>
        ) : (
          sorted.map((order) => <KanbanCard key={order.id} order={order} onMove={onMove} />)
        )}
      </div>
    </div>
  );
}

/* ─── Calendar View ───────────────────────────────────────────────── */

function CalendarView({ orders }: { orders: ServiceOrder[] }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const calendarDays = useMemo(() => getCalendarDays(viewYear, viewMonth), [viewYear, viewMonth]);

  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(viewYear, viewMonth, 1));

  const goToPrev = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
    setSelectedDay(null);
  };

  const goToNext = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
    setSelectedDay(null);
  };

  const goToToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDay(null);
  };

  const ordersThisMonth = orders.filter((o) => {
    const d = new Date(o.scheduledDate + "T00:00:00");
    return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
  });

  const ordersForSelectedDay =
    selectedDay !== null
      ? orders.filter((o) => isSameDay(o.scheduledDate, viewYear, viewMonth, selectedDay))
      : [];

  const isToday = (day: number, inMonth: boolean) =>
    inMonth &&
    viewYear === today.getFullYear() &&
    viewMonth === today.getMonth() &&
    day === today.getDate();

  return (
    <div className="space-y-3">
      {/* Calendar card */}
      <div className="rounded border border-border bg-white p-4 space-y-3">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={goToPrev}
              className="rounded p-1.5 text-muted-foreground hover:bg-gray-100 transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={goToNext}
              className="rounded p-1.5 text-muted-foreground hover:bg-gray-100 transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <h3 className="text-sm font-bold text-foreground">{monthLabel}</h3>
          <button
            onClick={goToToday}
            className="rounded border border-border px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-gray-100 transition-colors"
          >
            Today
          </button>
        </div>

        {ordersThisMonth.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            No orders this month
          </div>
        ) : (
          <>
            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 border-b border-border">
              {DAYS_OF_WEEK.map((d) => (
                <div
                  key={d}
                  className="py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-px bg-gray-200 rounded overflow-hidden">
              {calendarDays.map((cell, idx) => {
                const dayOrders = orders.filter(
                  (o) =>
                    isSameDay(
                      o.scheduledDate,
                      cell.date.getFullYear(),
                      cell.date.getMonth(),
                      cell.day,
                    ) && cell.inMonth,
                );
                const isTodayCell = isToday(cell.day, cell.inMonth);
                const isSelected = cell.inMonth && selectedDay === cell.day;

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      if (cell.inMonth && dayOrders.length > 0) {
                        setSelectedDay(selectedDay === cell.day ? null : cell.day);
                      }
                    }}
                    className={cn(
                      "min-h-[70px] bg-white p-1.5 text-left transition-colors",
                      !cell.inMonth && "bg-gray-50 opacity-40",
                      cell.inMonth && dayOrders.length > 0 && "cursor-pointer hover:bg-orange-50",
                      isTodayCell && "ring-2 ring-inset ring-[#FF7900]",
                      isSelected && "bg-orange-50",
                    )}
                  >
                    <span
                      className={cn(
                        "text-[11px] font-medium",
                        cell.inMonth ? "text-foreground" : "text-muted-foreground",
                        isTodayCell && "font-bold text-[#FF7900]",
                      )}
                    >
                      {cell.day}
                    </span>
                    {/* Priority dots */}
                    {dayOrders.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-0.5">
                        {dayOrders.map((o) => (
                          <span
                            key={o.id}
                            className={cn(
                              "h-2 w-2 rounded-full",
                              o.priority === "High" && "bg-red-500",
                              o.priority === "Medium" && "bg-amber-500",
                              o.priority === "Low" && "bg-green-500",
                            )}
                            title={`${o.id}: ${o.title}`}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Selected day detail */}
      {selectedDay !== null && ordersForSelectedDay.length > 0 && (
        <div className="rounded border border-border bg-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-foreground">
              Orders for{" "}
              {new Intl.DateTimeFormat("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              }).format(new Date(viewYear, viewMonth, selectedDay))}
            </h4>
            <button
              onClick={() => setSelectedDay(null)}
              className="rounded p-1 text-muted-foreground hover:bg-gray-100"
              aria-label="Close day detail"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="space-y-2">
            {ordersForSelectedDay.map((o) => (
              <div
                key={o.id}
                className="flex items-center gap-3 rounded border border-border bg-gray-50 p-2.5"
              >
                <PriorityBadge priority={o.priority} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{o.title}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {o.technician} &middot; {o.location} &middot; {STATUS_LABELS[o.status]}
                  </p>
                </div>
                <ServiceTypeBadge type={o.serviceType} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Create Order Modal ──────────────────────────────────────────── */

function CreateOrderModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (order: ServiceOrder) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [technician, setTechnician] = useState(TECHNICIANS[0]);
  const [serviceType, setServiceType] = useState<ServiceType>("Internal");
  const [location, setLocation] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [customer, setCustomer] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !technician || !location.trim() || !scheduledDate || !customer.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    const order: ServiceOrder = {
      id: "", // will be set by parent
      title: title.trim(),
      description: description.trim(),
      technician,
      scheduledDate,
      priority,
      serviceType,
      status: "Scheduled",
      location: location.trim(),
      customer: customer.trim(),
    };

    onCreate(order);
  };

  const inputClasses =
    "w-full rounded border border-border bg-white px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FF7900]/50 focus:border-[#FF7900]";
  const labelClasses = "block text-[11px] font-semibold text-foreground mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg border border-border bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="text-sm font-bold text-foreground">Create Service Order</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 p-5">
          {/* Title */}
          <div>
            <label className={labelClasses}>
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Quarterly inverter inspection"
              className={inputClasses}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className={labelClasses}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details..."
              rows={2}
              className={cn(inputClasses, "resize-none")}
            />
          </div>

          {/* Two-column row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Technician */}
            <div>
              <label className={labelClasses}>
                Technician <span className="text-red-500">*</span>
              </label>
              <select
                value={technician}
                onChange={(e) => setTechnician(e.target.value)}
                className={inputClasses}
                required
              >
                {TECHNICIANS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className={labelClasses}>
                Priority <span className="text-red-500">*</span>
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className={inputClasses}
                required
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          {/* Service Type (radio) */}
          <div>
            <label className={labelClasses}>
              Service Type <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4 mt-1">
              {(["Internal", "3rd Party"] as const).map((t) => (
                <label key={t} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="serviceType"
                    value={t}
                    checked={serviceType === t}
                    onChange={() => setServiceType(t)}
                    className="accent-[#FF7900]"
                  />
                  <span className="text-xs text-foreground">{t}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Two-column row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Location */}
            <div>
              <label className={labelClasses}>
                Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Denver"
                className={inputClasses}
                required
              />
            </div>

            {/* Scheduled Date */}
            <div>
              <label className={labelClasses}>
                Scheduled Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className={inputClasses}
                required
              />
            </div>
          </div>

          {/* Customer */}
          <div>
            <label className={labelClasses}>
              Customer <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="e.g., SolarEdge Corp"
              className={inputClasses}
              required
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded bg-[#FF7900] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#e06d00] transition-colors"
            >
              Create Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Filter Bar ──────────────────────────────────────────────────── */

function FilterBar({
  statusFilter,
  priorityFilter,
  searchQuery,
  onStatusChange,
  onPriorityChange,
  onSearchChange,
  onClearAll,
  onExport,
  filteredCount,
  totalCount,
}: {
  statusFilter: string;
  priorityFilter: string;
  searchQuery: string;
  onStatusChange: (v: string) => void;
  onPriorityChange: (v: string) => void;
  onSearchChange: (v: string) => void;
  onClearAll: () => void;
  onExport: () => void;
  filteredCount: number;
  totalCount: number;
}) {
  const hasActiveFilters = statusFilter !== "all" || priorityFilter !== "all" || searchQuery !== "";

  const selectClasses =
    "rounded border border-border bg-white px-2 py-1.5 text-[11px] text-foreground focus:outline-none focus:ring-2 focus:ring-[#FF7900]/50";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search orders..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="rounded border border-border bg-white py-1.5 pl-7 pr-2.5 text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FF7900]/50 w-48"
        />
      </div>

      {/* Status filter */}
      <select
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value)}
        className={selectClasses}
      >
        <option value="all">All Statuses</option>
        <option value="Scheduled">Scheduled</option>
        <option value="InProgress">In Progress</option>
        <option value="Completed">Completed</option>
      </select>

      {/* Priority filter */}
      <select
        value={priorityFilter}
        onChange={(e) => onPriorityChange(e.target.value)}
        className={selectClasses}
      >
        <option value="all">All Priorities</option>
        <option value="High">High</option>
        <option value="Medium">Medium</option>
        <option value="Low">Low</option>
      </select>

      {/* Clear all */}
      {hasActiveFilters && (
        <button
          onClick={onClearAll}
          className="flex items-center gap-1 rounded border border-border px-2 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-gray-100 transition-colors"
        >
          <X className="h-3 w-3" />
          Clear all
        </button>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Count */}
      <span className="text-[10px] text-muted-foreground">
        {filteredCount} of {totalCount} orders
      </span>

      {/* CSV Export */}
      <button
        onClick={onExport}
        className="flex items-center gap-1 rounded border border-border px-2.5 py-1.5 text-[11px] font-medium text-foreground hover:bg-gray-100 transition-colors"
        title="Export filtered results as CSV"
      >
        <Download className="h-3.5 w-3.5" />
        Export CSV
      </button>
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────────────── */

export function AccountService() {
  const [view, setView] = useState<ViewMode>("kanban");
  const [orders, setOrders] = useState<ServiceOrder[]>(INITIAL_ORDERS);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Auth — RBAC for create button
  const { groups } = useAuth();
  const role = getPrimaryRole(groups);
  const canCreate = canPerformAction(role, "create");

  // Filtered orders
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

  // Move handler (optimistic)
  const handleMove = useCallback((id: string, newStatus: Status) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)));
    toast.success(`Order moved to ${STATUS_LABELS[newStatus]}`);
  }, []);

  // Create handler
  const handleCreate = useCallback(
    (order: ServiceOrder) => {
      const newOrder: ServiceOrder = {
        ...order,
        id: generateNextId(orders),
      };
      setOrders((prev) => [...prev, newOrder]);
      setShowCreateModal(false);
      toast.success(`Service order ${newOrder.id} created`);
    },
    [orders],
  );

  // Clear all filters
  const handleClearFilters = () => {
    setStatusFilter("all");
    setPriorityFilter("all");
    setSearchQuery("");
  };

  // CSV export
  const handleExport = () => {
    exportToCsv(filteredOrders);
  };

  // Group by status for Kanban
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

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-foreground">Service Orders</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage field service operations and work orders
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle — segmented control */}
          <div className="flex rounded border border-border overflow-hidden">
            <button
              onClick={() => setView("kanban")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold transition-colors duration-150",
                view === "kanban"
                  ? "bg-[#FF7900] text-white"
                  : "bg-white text-muted-foreground hover:text-foreground hover:bg-gray-50",
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Kanban
            </button>
            <button
              onClick={() => setView("calendar")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold transition-colors duration-150",
                view === "calendar"
                  ? "bg-[#FF7900] text-white"
                  : "bg-white text-muted-foreground hover:text-foreground hover:bg-gray-50",
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
              className="flex items-center gap-1.5 rounded bg-[#FF7900] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#e06d00] transition-colors duration-150"
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
        onExport={handleExport}
        filteredCount={filteredOrders.length}
        totalCount={orders.length}
      />

      {/* Content */}
      {view === "kanban" ? (
        <div className="grid grid-cols-3 gap-3">
          {COLUMN_ORDER.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              orders={ordersByStatus[status]}
              onMove={handleMove}
            />
          ))}
        </div>
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
