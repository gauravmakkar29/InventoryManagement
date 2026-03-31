/**
 * IMS Gen 2 — Epic 14: Incident Timeline (Story 14.1 AC3-AC4)
 */
import {
  Plus,
  Lock,
  Unlock,
  Shield,
  BookOpen,
  User,
  CheckCircle2,
  Circle,
  ArrowRight,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { formatRelativeTime } from "../../../lib/utils";
import type { Incident } from "../../../lib/incident-types";

export function IncidentTimeline({ events }: { events: Incident["timelineEvents"] }) {
  const getEventIcon = (action: string) => {
    switch (action) {
      case "created":
        return <Plus className="h-3.5 w-3.5" />;
      case "status_changed":
        return <ArrowRight className="h-3.5 w-3.5" />;
      case "device_isolated":
        return <Lock className="h-3.5 w-3.5" />;
      case "device_released":
        return <Unlock className="h-3.5 w-3.5" />;
      case "quarantine_applied":
        return <Shield className="h-3.5 w-3.5" />;
      case "quarantine_lifted":
        return <Shield className="h-3.5 w-3.5" />;
      case "playbook_started":
        return <BookOpen className="h-3.5 w-3.5" />;
      case "playbook_completed":
        return <CheckCircle2 className="h-3.5 w-3.5" />;
      case "assigned":
        return <User className="h-3.5 w-3.5" />;
      case "note_added":
        return <Circle className="h-3.5 w-3.5" />;
      default:
        return <Circle className="h-3.5 w-3.5" />;
    }
  };

  const getEventColor = (action: string) => {
    switch (action) {
      case "device_isolated":
        return "bg-red-100 text-red-600";
      case "device_released":
        return "bg-emerald-100 text-emerald-600";
      case "quarantine_applied":
        return "bg-amber-100 text-amber-600";
      case "status_changed":
        return "bg-blue-100 text-blue-600";
      case "playbook_completed":
        return "bg-emerald-100 text-emerald-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getEventText = (event: Incident["timelineEvents"][0]) => {
    switch (event.action) {
      case "created":
        return "Incident created";
      case "status_changed":
        return `Status changed from ${event.fromStatus} to ${event.toStatus}`;
      case "device_isolated":
        return `Device ${event.deviceName ?? event.deviceId} isolated`;
      case "device_released":
        return `Device ${event.deviceName ?? event.deviceId} released`;
      case "quarantine_applied":
        return "Quarantine zone applied";
      case "quarantine_lifted":
        return "Quarantine zone lifted";
      case "playbook_started":
        return "Playbook execution started";
      case "playbook_completed":
        return "Playbook completed";
      case "assigned":
        return "Incident assigned";
      case "note_added":
        return "Note added";
      default:
        return event.action;
    }
  };

  const sorted = [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return (
    <div className="space-y-0">
      {sorted.map((event, i) => (
        <div key={i} className="relative flex gap-3 pb-4">
          {i < sorted.length - 1 && (
            <div className="absolute left-[15px] top-8 h-[calc(100%-16px)] w-px bg-gray-200" />
          )}
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
              getEventColor(event.action),
            )}
          >
            {getEventIcon(event.action)}
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-[13px] font-medium text-gray-900">{getEventText(event)}</p>
            {event.note && <p className="mt-0.5 text-[12px] text-gray-600">{event.note}</p>}
            <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-500">
              <span>{event.performedByName}</span>
              <span>&middot;</span>
              <span>{formatRelativeTime(event.timestamp)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
