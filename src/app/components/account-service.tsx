import { useState } from "react";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";

type View = "kanban" | "calendar";

const PLACEHOLDER_ORDERS = {
  scheduled: [
    { id: "SO-1042", title: "Quarterly Inspection — Denver", priority: "medium", date: "Apr 3, 2026" },
    { id: "SO-1043", title: "Firmware update field support", priority: "high", date: "Apr 5, 2026" },
  ],
  inProgress: [
    { id: "SO-1039", title: "Replace faulty inverter — Houston", priority: "critical", date: "Mar 26, 2026" },
  ],
  completed: [
    { id: "SO-1035", title: "Annual compliance audit — Chicago", priority: "low", date: "Mar 20, 2026" },
    { id: "SO-1036", title: "Network reconfiguration — Dallas", priority: "medium", date: "Mar 22, 2026" },
  ],
};

const PRIORITY_STYLES: Record<string, string> = {
  critical: "text-danger",
  high: "text-warning",
  medium: "text-foreground",
  low: "text-muted-foreground",
};

function KanbanColumn({
  title,
  count,
  items,
}: {
  title: string;
  count: number;
  items: typeof PLACEHOLDER_ORDERS.scheduled;
}) {
  return (
    <div className="flex flex-col rounded-sm border border-border bg-muted/30">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <h3 className="text-xs font-semibold text-foreground">{title}</h3>
        <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          {count}
        </span>
      </div>
      <div className="flex-1 space-y-1.5 p-2">
        {items.map((order) => (
          <div
            key={order.id}
            className="rounded-sm border border-border bg-card p-2.5 space-y-1 hover:border-accent/30 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-muted-foreground">{order.id}</span>
              <span className={cn("text-[10px] font-medium capitalize", PRIORITY_STYLES[order.priority])}>
                {order.priority}
              </span>
            </div>
            <p className="text-xs font-medium text-foreground">{order.title}</p>
            <p className="text-[10px] text-muted-foreground">{order.date}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CalendarPlaceholder() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <button className="rounded-sm p-1 text-muted-foreground hover:bg-muted" aria-label="Previous month">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h3 className="text-xs font-semibold text-foreground">April 2026</h3>
        <button className="rounded-sm p-1 text-muted-foreground hover:bg-muted" aria-label="Next month">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-px rounded-sm border border-border bg-border overflow-hidden">
        {days.map((d) => (
          <div key={d} className="bg-muted/50 px-2 py-1.5 text-center text-[10px] font-medium text-muted-foreground">
            {d}
          </div>
        ))}
        {Array.from({ length: 35 }, (_, i) => {
          const day = i - 1; // offset for April starting on Wednesday
          const isValid = day >= 0 && day < 30;
          return (
            <div
              key={i}
              className={cn(
                "min-h-[60px] bg-card px-1.5 py-1 text-[10px]",
                !isValid && "bg-muted/20"
              )}
            >
              {isValid && (
                <span className="text-muted-foreground">{day + 1}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AccountService() {
  const [view, setView] = useState<View>("kanban");

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-bold text-foreground">Account & Service Orders</h1>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-sm border border-border">
            {(["kanban", "calendar"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "px-2.5 py-1 text-[10px] font-medium capitalize",
                  view === v
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {v}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1 rounded-sm bg-accent px-2.5 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent/90">
            <Plus className="h-3 w-3" />
            Create Order
          </button>
        </div>
      </div>

      {/* Content */}
      {view === "kanban" ? (
        <div className="grid grid-cols-3 gap-3">
          <KanbanColumn title="Scheduled" count={PLACEHOLDER_ORDERS.scheduled.length} items={PLACEHOLDER_ORDERS.scheduled} />
          <KanbanColumn title="In Progress" count={PLACEHOLDER_ORDERS.inProgress.length} items={PLACEHOLDER_ORDERS.inProgress} />
          <KanbanColumn title="Completed" count={PLACEHOLDER_ORDERS.completed.length} items={PLACEHOLDER_ORDERS.completed} />
        </div>
      ) : (
        <CalendarPlaceholder />
      )}
    </div>
  );
}
