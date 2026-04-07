// =============================================================================
// FirmwareDeployedSitesTab — Story #388 AC8 / #389 cross-link
// Shows all sites running a specific firmware version
// =============================================================================

import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { MapPin, Building2, Calendar, CheckCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApiProvider } from "@/lib/providers/registry";
import { queryKeys } from "@/lib/query-keys";
import type { Site } from "@/lib/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FirmwareDeployedSitesTabProps {
  firmwareVersionId: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const STATUS_STYLES: Record<Site["status"], { className: string; icon: typeof CheckCircle }> = {
  active: { className: "bg-success-bg text-success-text", icon: CheckCircle },
  maintenance: { className: "bg-warning-bg text-warning-text", icon: AlertTriangle },
  decommissioned: { className: "bg-muted text-muted-foreground", icon: AlertTriangle },
};

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function TableSkeleton() {
  return (
    <div className="space-y-3" role="status" aria-label="Loading sites">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4 rounded-lg border border-border p-4">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-4 w-28 animate-pulse rounded bg-muted" />
          <div className="h-4 w-20 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function FirmwareDeployedSitesTab({ firmwareVersionId }: FirmwareDeployedSitesTabProps) {
  const api = useApiProvider();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.sites.byFirmwareVersion(firmwareVersionId),
    queryFn: () => api.listSitesByFirmwareVersion(firmwareVersionId),
    enabled: !!firmwareVersionId,
  });

  const sites = data?.items ?? [];

  if (isLoading) return <TableSkeleton />;

  if (sites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <MapPin className="mb-3 h-10 w-10 text-muted-foreground/50" />
        <p className="text-[14px] font-medium text-foreground">No sites deployed</p>
        <p className="mt-1 text-[13px] text-muted-foreground">
          This firmware version is not currently deployed to any site.
        </p>
      </div>
    );
  }

  return (
    <div className="card-elevated overflow-hidden rounded-xl">
      <div className="px-5 py-4">
        <h3 className="text-[16px] font-semibold text-foreground">
          Deployed Sites ({sites.length})
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left" role="table">
          <thead>
            <tr className="border-t border-border bg-muted/30">
              <th className="px-5 py-3 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                Site
              </th>
              <th className="px-5 py-3 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                Customer
              </th>
              <th className="px-5 py-3 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                Location
              </th>
              <th className="px-5 py-3 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                Last Deployed
              </th>
              <th className="px-5 py-3 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {sites.map((site) => {
              const statusConfig = STATUS_STYLES[site.status];
              const StatusIcon = statusConfig.icon;
              return (
                <tr
                  key={site.id}
                  className="border-t border-border transition-colors hover:bg-muted/20"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Building2
                        className="h-4 w-4 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <span className="text-[14px] font-medium text-foreground">{site.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <Link
                      to={`/customers/${site.customerId}`}
                      className="text-[14px] text-primary hover:underline"
                    >
                      {site.customerId}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1 text-[14px] text-muted-foreground">
                      <MapPin className="h-3 w-3" aria-hidden="true" />
                      {site.location}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1 text-[14px] text-muted-foreground">
                      <Calendar className="h-3 w-3" aria-hidden="true" />
                      {formatDate(site.lastDeploymentAt)}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-semibold",
                        statusConfig.className,
                      )}
                    >
                      <StatusIcon className="h-3 w-3" aria-hidden="true" />
                      {site.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
