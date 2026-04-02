import { Filter, ChevronDown } from "lucide-react";
import { cn } from "../../../lib/utils";
import { AVAILABLE_MODELS } from "./deployment-constants";
import type { FirmwareEntry, FirmwareStatus } from "./deployment-types";

interface FirmwareFiltersProps {
  firmware: FirmwareEntry[];
  fwStatusFilter: FirmwareStatus | "All";
  setFwStatusFilter: (value: FirmwareStatus | "All") => void;
  fwModelFilter: string;
  setFwModelFilter: (value: string) => void;
}

export function FirmwareFilters({
  firmware,
  fwStatusFilter,
  setFwStatusFilter,
  fwModelFilter,
  setFwModelFilter,
}: FirmwareFiltersProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Status filter pills */}
      <div className="flex items-center gap-1.5">
        {(["All", "Active", "Pending", "Deprecated"] as const).map((s) => {
          const count =
            s === "All" ? firmware.length : firmware.filter((fw) => fw.status === s).length;
          return (
            <button
              key={s}
              onClick={() => {
                setFwStatusFilter(s);
              }}
              className={cn(
                "rounded-full px-2.5 py-1 text-[12px] font-medium transition-colors duration-150",
                fwStatusFilter === s
                  ? "bg-accent text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}
            >
              {s} ({count})
            </button>
          );
        })}
      </div>

      {/* Model filter dropdown */}
      <div className="relative">
        <Filter className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <select
          value={fwModelFilter}
          onChange={(e) => setFwModelFilter(e.target.value)}
          className="appearance-none rounded-sm border border-border bg-background py-1 pl-6 pr-7 text-[12px] font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="All">All Models</option>
          {AVAILABLE_MODELS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
      </div>
    </div>
  );
}
