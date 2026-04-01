import { WifiOff, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "../../../lib/utils";
import type { ConnectivityState } from "./use-connectivity-monitor";

/**
 * Story 16.2: Connectivity Status Bar
 *
 * Shows a compact bar below the header when services are degraded/down,
 * or an offline banner when the user's network is disconnected.
 * Uses ARIA live region for screen reader announcements (Story 16.6).
 */

interface ConnectivityStatusBarProps {
  connectivity: ConnectivityState;
}

export function ConnectivityStatusBar({ connectivity }: ConnectivityStatusBarProps) {
  const { services, overallStatus, isOnline, recoveredService } = connectivity;

  const degradedServices = services.filter((s) => s.status !== "Healthy");

  return (
    <div aria-live="polite" aria-atomic="true" role="status">
      {/* Offline banner — persistent red bar */}
      {!isOnline && (
        <div className="flex h-8 items-center justify-center gap-2 bg-destructive px-4">
          <WifiOff className="h-3.5 w-3.5 text-white" />
          <span className="text-[14px] font-medium text-white">
            You are offline. Some features may be unavailable.
          </span>
        </div>
      )}

      {/* Degraded services bar */}
      {isOnline && overallStatus !== "AllHealthy" && (
        <div className="flex h-8 items-center justify-center gap-2 bg-warning/20 border-b border-warning/30 px-4">
          <AlertTriangle className="h-3.5 w-3.5 text-warning" />
          <span className="text-[14px] font-medium text-foreground">
            {degradedServices.map((s) => `${s.service}: ${s.status}`).join(" | ")}
          </span>
        </div>
      )}

      {/* Service recovered notification */}
      {recoveredService && (
        <div
          className={cn(
            "flex h-8 items-center justify-center gap-2 bg-success/10 border-b border-success/20 px-4",
          )}
        >
          <CheckCircle className="h-3.5 w-3.5 text-success" />
          <span className="text-[14px] font-medium text-success">{recoveredService} recovered</span>
        </div>
      )}
    </div>
  );
}
