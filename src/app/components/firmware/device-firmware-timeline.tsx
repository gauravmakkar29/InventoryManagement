/**
 * Device Firmware History Timeline — Story 26.11 (#364)
 *
 * Vertical timeline showing firmware assignment history for a single device.
 * Newest entries at top, with method badges, recall warnings, and current indicator.
 *
 * @see Story 26.9 (#362) — FirmwareAssignment entity
 */

import { useMemo } from "react";
import { Clock, Download, Wrench, Wifi, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/empty-state";
import type { FirmwareAssignment } from "@/lib/types";
import {
  MOCK_FIRMWARE_ASSIGNMENTS,
  RECALLED_FIRMWARE_IDS,
} from "@/lib/mock-data/firmware-assignment-data";

// ---------------------------------------------------------------------------
// Assignment method display config
// ---------------------------------------------------------------------------

interface MethodConfig {
  label: string;
  className: string;
  icon: typeof Download;
}

const METHOD_CONFIG: Record<FirmwareAssignment["assignmentMethod"], MethodConfig> = {
  DOWNLOAD_TOKEN: {
    label: "Download Token",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    icon: Download,
  },
  MANUAL: {
    label: "Manual",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    icon: Wrench,
  },
  OTA: {
    label: "OTA",
    className: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    icon: Wifi,
  },
};

// ---------------------------------------------------------------------------
// Date formatting
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Timeline entry
// ---------------------------------------------------------------------------

interface TimelineEntryProps {
  assignment: FirmwareAssignment;
  isCurrent: boolean;
  isRecalled: boolean;
  isLast: boolean;
}

function TimelineEntry({ assignment, isCurrent, isRecalled, isLast }: TimelineEntryProps) {
  const method = METHOD_CONFIG[assignment.assignmentMethod];
  const MethodIcon = method.icon;

  return (
    <div className="relative flex gap-4">
      {/* Vertical line + dot */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "z-10 flex h-3 w-3 shrink-0 rounded-full border-2",
            isCurrent
              ? "border-blue-600 bg-blue-600"
              : isRecalled
                ? "border-red-500 bg-red-500"
                : "border-slate-400 bg-slate-400 dark:border-slate-500 dark:bg-slate-500",
          )}
        />
        {!isLast && <div className="w-px flex-1 bg-slate-200 dark:bg-slate-700" />}
      </div>

      {/* Content card */}
      <div
        className={cn(
          "mb-6 flex-1 rounded-lg border p-4",
          isCurrent
            ? "border-blue-300 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30"
            : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900",
        )}
      >
        {/* Header row: version + badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[15px] font-semibold text-foreground">
            {assignment.firmwareVersion}
          </span>
          <span className="text-[13px] text-muted-foreground">{assignment.firmwareName}</span>

          {isCurrent && (
            <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-medium text-white">
              Current
            </span>
          )}

          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
              method.className,
            )}
          >
            <MethodIcon className="h-3 w-3" />
            {method.label}
          </span>
        </div>

        {/* Date + assigned by */}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {formatDate(assignment.assignedAt)}
          </span>
          <span>by {assignment.assignedByEmail}</span>
        </div>

        {/* Previous version */}
        {assignment.previousFirmwareVersion && (
          <p className="mt-1.5 text-[12px] text-muted-foreground">
            Upgraded from {assignment.previousFirmwareVersion}
          </p>
        )}

        {/* Recall warning */}
        {isRecalled && (
          <div className="mt-2 flex items-center gap-1.5 rounded-md bg-red-50 px-2.5 py-1.5 text-[12px] font-medium text-red-700 dark:bg-red-950/40 dark:text-red-400">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            This version was later recalled
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main timeline component
// ---------------------------------------------------------------------------

interface DeviceFirmwareTimelineProps {
  assignments: FirmwareAssignment[];
  currentFirmwareVersion?: string;
  /** Set of firmware IDs that have been recalled — defaults to mock data */
  recalledFirmwareIds?: Set<string>;
}

export function DeviceFirmwareTimeline({
  assignments,
  currentFirmwareVersion,
  recalledFirmwareIds = RECALLED_FIRMWARE_IDS,
}: DeviceFirmwareTimelineProps) {
  // Sort newest first
  const sorted = useMemo(
    () =>
      [...assignments].sort(
        (a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime(),
      ),
    [assignments],
  );

  if (sorted.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="No firmware history recorded"
        description="Firmware assignments will appear here once a version is deployed to this device."
      />
    );
  }

  return (
    <div className="py-2 pl-1">
      {sorted.map((assignment, idx) => (
        <TimelineEntry
          key={assignment.id}
          assignment={assignment}
          isCurrent={
            currentFirmwareVersion != null &&
            assignment.firmwareVersion === currentFirmwareVersion &&
            idx === sorted.findIndex((a) => a.firmwareVersion === currentFirmwareVersion)
          }
          isRecalled={recalledFirmwareIds.has(assignment.firmwareId)}
          isLast={idx === sorted.length - 1}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Demo wrapper — renders the timeline with mock data for dev/testing
// ---------------------------------------------------------------------------

/** Demo page showing firmware history for device dev-001. */
export function DeviceFirmwareTimelineDemo() {
  const deviceId = "dev-001";
  const deviceAssignments = MOCK_FIRMWARE_ASSIGNMENTS.filter((a) => a.deviceId === deviceId);

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Firmware History — SG-3600-INV-001
        </h2>
        <p className="text-[13px] text-muted-foreground">
          Assignment timeline for device {deviceId}
        </p>
      </div>
      <DeviceFirmwareTimeline assignments={deviceAssignments} currentFirmwareVersion="v4.1.0" />

      {/* Also show device dev-002 which has a recalled version */}
      <div className="border-t pt-6">
        <h2 className="text-lg font-semibold text-foreground">
          Firmware History — SG-5000-COM-012
        </h2>
        <p className="text-[13px] text-muted-foreground">
          Timeline includes a recalled version warning
        </p>
      </div>
      <DeviceFirmwareTimeline
        assignments={MOCK_FIRMWARE_ASSIGNMENTS.filter((a) => a.deviceId === "dev-002")}
        currentFirmwareVersion="v3.8.2"
      />

      {/* Empty state demo */}
      <div className="border-t pt-6">
        <h2 className="text-lg font-semibold text-foreground">Empty State Demo</h2>
      </div>
      <DeviceFirmwareTimeline assignments={[]} />
    </div>
  );
}
