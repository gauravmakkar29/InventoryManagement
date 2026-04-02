import { cn } from "../../../lib/utils";
import type { TwinStateSnapshot } from "./digital-twin-types";

// Story 15.2 — State Replay Timeline
export function StateReplayTimeline({
  snapshots,
  selectedIds,
  activeId,
  onSelect,
}: {
  snapshots: TwinStateSnapshot[];
  selectedIds: string[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="relative px-4 py-3">
      {/* Timeline bar */}
      <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-border -translate-y-1/2" />
      <div className="flex justify-between relative z-10">
        {snapshots.map((snap) => {
          const isActive = activeId === snap.id;
          const isSelected = selectedIds.includes(snap.id);
          return (
            <button
              key={snap.id}
              onClick={() => onSelect(snap.id)}
              className={cn(
                "flex flex-col items-center gap-1 cursor-pointer group",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
              title={new Date(snap.timestamp).toLocaleString()}
            >
              <div
                className={cn(
                  "rounded-full border-2 transition-all",
                  isActive
                    ? "h-4 w-4 border-accent-text bg-accent"
                    : isSelected
                      ? "h-3.5 w-3.5 border-accent-text bg-orange-100"
                      : "h-3 w-3 border-border bg-card group-hover:border-accent-text",
                )}
              />
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {new Date(snap.timestamp).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
