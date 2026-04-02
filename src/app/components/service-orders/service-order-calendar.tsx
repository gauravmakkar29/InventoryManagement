import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ServiceOrder } from "@/lib/mock-data/service-order-data";
import { STATUS_LABELS } from "@/lib/mock-data/service-order-data";
import { PriorityBadge, ServiceTypeBadge } from "./service-order-kanban";

/* ─── Constants ───────────────────────────────────────────────────── */

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* ─── Helpers ─────────────────────────────────────────────────────── */

function isSameDay(iso: string, year: number, month: number, day: number): boolean {
  const d = new Date(iso + "T00:00:00");
  return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
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

/* ─── Calendar View ───────────────────────────────────────────────── */

export function CalendarView({ orders }: { orders: ServiceOrder[] }) {
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
      <div className="rounded border border-border bg-card p-4 space-y-3">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={goToPrev}
              className="rounded p-1.5 text-muted-foreground hover:bg-muted transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={goToNext}
              className="rounded p-1.5 text-muted-foreground hover:bg-muted transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <h3 className="text-sm font-bold text-foreground">{monthLabel}</h3>
          <button
            onClick={goToToday}
            className="rounded border border-border px-2.5 py-1 text-[13px] font-medium text-foreground hover:bg-muted transition-colors"
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
                  className="py-2 text-center text-[12px] font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-px bg-border/60 rounded overflow-hidden">
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
                      "min-h-[70px] bg-card p-1.5 text-left transition-colors",
                      !cell.inMonth && "bg-muted opacity-40",
                      cell.inMonth && dayOrders.length > 0 && "cursor-pointer hover:bg-orange-50",
                      isTodayCell && "ring-2 ring-inset ring-ring",
                      isSelected && "bg-orange-50",
                    )}
                  >
                    <span
                      className={cn(
                        "text-[13px] font-medium",
                        cell.inMonth ? "text-foreground" : "text-muted-foreground",
                        isTodayCell && "font-bold text-accent-text",
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
        <div className="rounded border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-foreground">
              Orders for{" "}
              {new Intl.DateTimeFormat("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              }).format(new Date(viewYear, viewMonth, selectedDay))}
            </h4>
            <button
              onClick={() => setSelectedDay(null)}
              className="rounded p-1 text-muted-foreground hover:bg-muted"
              aria-label="Close day detail"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="space-y-2">
            {ordersForSelectedDay.map((o) => (
              <div
                key={o.id}
                className="flex items-center gap-3 rounded border border-border bg-muted p-2.5"
              >
                <PriorityBadge priority={o.priority} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{o.title}</p>
                  <p className="text-[12px] text-muted-foreground">
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
