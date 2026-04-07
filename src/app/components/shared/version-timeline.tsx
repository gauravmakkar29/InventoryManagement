// =============================================================================
// VersionTimeline — Shared vertical stepper for state-transition events
// Used by: Firmware version history (#388), Site deployment history (#389)
// =============================================================================

import { useMemo } from "react";
import { Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TimelineEventColor = "green" | "red" | "blue" | "gray";

export interface TimelineEvent {
  id: string;
  type: string;
  label: string;
  actor: string;
  timestamp: string; // ISO 8601
  description: string;
  color: TimelineEventColor;
  metadata?: Record<string, string>;
}

interface VersionTimelineProps {
  events: TimelineEvent[];
  loading?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
}

// ---------------------------------------------------------------------------
// Color mapping → semantic design tokens
// ---------------------------------------------------------------------------

const DOT_COLORS: Record<TimelineEventColor, string> = {
  green: "bg-success",
  red: "bg-danger",
  blue: "bg-info",
  gray: "bg-muted-foreground",
};

const LABEL_COLORS: Record<TimelineEventColor, string> = {
  green: "bg-success-bg text-success-text",
  red: "bg-danger-bg text-danger-text",
  blue: "bg-info-bg text-info-text",
  gray: "bg-muted text-muted-foreground",
};

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------

function TimelineSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading timeline">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="h-3 w-3 animate-pulse rounded-full bg-muted" />
            {i < 3 && <div className="mt-1 w-0.5 flex-1 animate-pulse bg-muted" />}
          </div>
          <div className="flex-1 space-y-2 pb-6">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-3 w-48 animate-pulse rounded bg-muted" />
            <div className="h-3 w-36 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Timeline entry
// ---------------------------------------------------------------------------

function TimelineEntry({ event, isLast }: { event: TimelineEvent; isLast: boolean }) {
  const formattedDate = useMemo(() => {
    const d = new Date(event.timestamp);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [event.timestamp]);

  return (
    <div className="flex gap-4" role="listitem">
      {/* Dot + connector line */}
      <div className="flex flex-col items-center pt-1">
        <div
          className={cn("h-3 w-3 shrink-0 rounded-full", DOT_COLORS[event.color])}
          aria-hidden="true"
        />
        {!isLast && <div className="mt-1 w-0.5 flex-1 bg-border" aria-hidden="true" />}
      </div>

      {/* Content card */}
      <div className="flex-1 pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center rounded-md px-2 py-0.5 text-[12px] font-semibold",
              LABEL_COLORS[event.color],
            )}
          >
            {event.label}
          </span>
          <span className="text-[12px] text-muted-foreground">{event.type}</span>
        </div>

        <p className="mt-1 text-[14px] text-foreground">{event.description}</p>

        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[12px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <User className="h-3 w-3" aria-hidden="true" />
            {event.actor}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" aria-hidden="true" />
            <time dateTime={event.timestamp}>{formattedDate}</time>
          </span>
        </div>

        {/* Optional metadata badges */}
        {event.metadata && Object.keys(event.metadata).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {Object.entries(event.metadata).map(([key, value]) => (
              <span
                key={key}
                className="inline-flex items-center rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[11px] text-muted-foreground"
              >
                <span className="font-medium">{key}:</span>&nbsp;{value}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function VersionTimeline({
  events,
  loading = false,
  emptyMessage = "No events",
  emptyDescription = "No timeline events have been recorded yet.",
}: VersionTimelineProps) {
  if (loading) {
    return <TimelineSkeleton />;
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Clock className="mb-3 h-8 w-8 text-muted-foreground/50" />
        <p className="text-[14px] font-medium text-foreground">{emptyMessage}</p>
        <p className="mt-1 text-[13px] text-muted-foreground">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div role="list" aria-label="Version timeline">
      {events.map((event, index) => (
        <TimelineEntry key={event.id} event={event} isLast={index === events.length - 1} />
      ))}
    </div>
  );
}
