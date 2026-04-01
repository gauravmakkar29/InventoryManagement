import { cn } from "../../../lib/utils";
import type { ServiceHealth, ConnectivityState } from "./use-connectivity-monitor";

/**
 * Story 16.2: Service Health Panel
 *
 * Expandable panel showing individual service statuses.
 * Admin users see full details (latency); non-admins see simplified status.
 */

interface ServiceHealthPanelProps {
  connectivity: ConnectivityState;
  isAdmin?: boolean;
  expanded: boolean;
  onToggle: () => void;
}

const STATUS_STYLES: Record<string, { dot: string; label: string }> = {
  Healthy: { dot: "bg-success", label: "Operational" },
  Degraded: { dot: "bg-warning", label: "Degraded" },
  Down: { dot: "bg-destructive", label: "Down" },
};

function ServiceCard({ service, showLatency }: { service: ServiceHealth; showLatency: boolean }) {
  const style = STATUS_STYLES[service.status] ?? STATUS_STYLES["Healthy"]!;
  return (
    <div
      className="flex items-center gap-2.5 rounded-lg bg-muted/50 px-3 py-2.5"
      title={`Last checked: ${service.lastChecked.toLocaleTimeString()}`}
    >
      <span className={cn("h-2 w-2 shrink-0 rounded-full", style.dot)} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium text-foreground">{service.service}</p>
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-muted-foreground">{style.label}</span>
          {showLatency && service.status !== "Down" && (
            <span className="text-[13px] text-muted-foreground tabular-nums">
              {service.latencyMs}ms
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function ServiceHealthPanel({
  connectivity,
  isAdmin = false,
  expanded,
  onToggle,
}: ServiceHealthPanelProps) {
  const { services, overallStatus } = connectivity;

  const overallLabel =
    overallStatus === "AllHealthy"
      ? "All Systems Operational"
      : overallStatus === "SomeDegraded"
        ? "Some Services Degraded"
        : "Critical Service Down";

  const overallDot =
    overallStatus === "AllHealthy"
      ? "bg-success"
      : overallStatus === "SomeDegraded"
        ? "bg-warning"
        : "bg-destructive";

  return (
    <div className="card-flat px-5 py-4">
      <button
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center justify-between"
        aria-expanded={expanded}
        aria-controls="service-health-details"
      >
        <h3 className="text-[15px] font-semibold text-foreground">System Status</h3>
        <div className="flex items-center gap-2">
          <span className={cn("h-2.5 w-2.5 rounded-full", overallDot)} aria-hidden="true" />
          <span className="text-[14px] font-medium text-muted-foreground">{overallLabel}</span>
        </div>
      </button>

      {expanded && (
        <div id="service-health-details" className="mt-3 grid grid-cols-2 gap-3">
          {services.map((svc) => (
            <ServiceCard key={svc.service} service={svc} showLatency={isAdmin} />
          ))}
        </div>
      )}
    </div>
  );
}
