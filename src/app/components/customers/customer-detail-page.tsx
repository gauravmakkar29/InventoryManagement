// =============================================================================
// CustomerDetailPage — Story #389
// /customers/:customerId — info panel + site cards + deployment timeline
// =============================================================================

import { useState, useMemo, useCallback } from "react";
import { useParams, Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Mail,
  Phone,
  HardDrive,
  ShieldCheck,
  ChevronDown,
  Wrench,
  CheckCircle,
  AlertTriangle,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApiProvider } from "@/lib/providers/registry";
import { queryKeys } from "@/lib/query-keys";
import { VersionTimeline, type TimelineEvent } from "../shared/version-timeline";
import type { Site, SiteDeployment } from "@/lib/types";

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

const SITE_STATUS_CONFIG: Record<
  Site["status"],
  { label: string; className: string; icon: typeof CheckCircle }
> = {
  active: { label: "Active", className: "bg-success-bg text-success-text", icon: CheckCircle },
  maintenance: { label: "Maintenance", className: "bg-warning-bg text-warning-text", icon: Wrench },
  decommissioned: {
    label: "Decommissioned",
    className: "bg-muted text-muted-foreground",
    icon: AlertTriangle,
  },
};

function mapDeploymentToTimeline(deployment: SiteDeployment): TimelineEvent {
  const color =
    deployment.status === "SUCCESS" ? "green" : deployment.status === "FAILED" ? "red" : "blue";
  return {
    id: deployment.id,
    type: deployment.method,
    label: `${deployment.firmwareVersion} (${deployment.firmwareFamilyName})`,
    actor: deployment.deployedBy,
    timestamp: deployment.deployedAt,
    description:
      deployment.notes ??
      `Deployed via ${deployment.method}${deployment.previousFirmwareVersion ? ` (from ${deployment.previousFirmwareVersion})` : ""}`,
    color: color as TimelineEvent["color"],
    metadata: deployment.previousFirmwareVersion
      ? { "Previous Version": deployment.previousFirmwareVersion }
      : undefined,
  };
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Site card with expandable deployment history
// ---------------------------------------------------------------------------

function SiteCard({ site }: { site: Site }) {
  const [expanded, setExpanded] = useState(false);
  const api = useApiProvider();
  const statusConfig = SITE_STATUS_CONFIG[site.status];
  const StatusIcon = statusConfig.icon;

  const { data: deploymentsData, isLoading: deploymentsLoading } = useQuery({
    queryKey: queryKeys.sites.deployments(site.id),
    queryFn: () => api.listSiteDeployments(site.id),
    enabled: expanded,
  });

  const timelineEvents = useMemo(() => {
    const deployments = deploymentsData?.items ?? [];
    return deployments
      .sort((a, b) => new Date(b.deployedAt).getTime() - new Date(a.deployedAt).getTime())
      .map(mapDeploymentToTimeline);
  }, [deploymentsData]);

  const toggleExpand = useCallback(() => setExpanded((p) => !p), []);

  return (
    <div className="card-elevated overflow-hidden rounded-xl">
      {/* Card header */}
      <button
        type="button"
        onClick={toggleExpand}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleExpand();
          }
        }}
        className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-expanded={expanded}
      >
        <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-[14px] font-semibold text-foreground">{site.name}</h3>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                statusConfig.className,
              )}
            >
              <StatusIcon className="h-3 w-3" aria-hidden="true" />
              {statusConfig.label}
            </span>
          </div>
          <p className="mt-0.5 text-[13px] text-muted-foreground">{site.location}</p>

          {/* Stats row */}
          <div className="mt-2 flex flex-wrap gap-3 text-[12px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <HardDrive className="h-3 w-3" aria-hidden="true" />
              {site.deviceCount} devices
            </span>
            {site.currentFirmwareVersion && (
              <span className="inline-flex items-center gap-1 rounded border border-border bg-muted/50 px-1.5 py-0.5 font-medium">
                <Package className="h-3 w-3" aria-hidden="true" />
                {site.currentFirmwareVersion}
              </span>
            )}
            {site.lastDeploymentAt && (
              <span>Last deployed: {formatDate(site.lastDeploymentAt)}</span>
            )}
          </div>
        </div>

        <ChevronDown
          className={cn(
            "mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            expanded && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>

      {/* Expanded deployment history */}
      {expanded && (
        <div className="border-t border-border px-4 py-4">
          <h4 className="mb-3 text-[13px] font-semibold text-muted-foreground">
            Deployment History
          </h4>
          <VersionTimeline
            events={timelineEvents}
            loading={deploymentsLoading}
            emptyMessage="No deployments"
            emptyDescription="No firmware deployments have been recorded for this site."
          />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function CustomerDetailPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const api = useApiProvider();

  const { data: customer, isLoading: customerLoading } = useQuery({
    queryKey: queryKeys.customers.detail(customerId ?? ""),
    queryFn: () => api.getCustomer(customerId ?? ""),
    enabled: !!customerId,
  });

  const { data: sitesData, isLoading: sitesLoading } = useQuery({
    queryKey: queryKeys.sites.list(customerId ?? ""),
    queryFn: () => api.listSites(customerId ?? ""),
    enabled: !!customerId,
  });

  const sites = sitesData?.items ?? [];
  const isLoading = customerLoading || sitesLoading;

  if (!customerId) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">No customer specified.</p>
      </div>
    );
  }

  if (isLoading) return <PageSkeleton />;

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Building2 className="mb-3 h-10 w-10 text-muted-foreground/50" />
        <p className="text-[14px] font-medium text-foreground">Customer not found</p>
        <p className="mt-1 text-[13px] text-muted-foreground">
          The requested customer does not exist or has been removed.
        </p>
        <Link to="/customers" className="mt-4 text-[14px] text-primary hover:underline">
          Back to Customers
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb + header */}
      <div className="flex items-center gap-3">
        <Link
          to="/customers"
          className="inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Customers
        </Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="text-[20px] font-semibold text-foreground">{customer.name}</h1>
        <span className="rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[12px] font-mono text-foreground">
          {customer.code}
        </span>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <InfoCard icon={Mail} label="Contact" value={customer.contactEmail} />
        <InfoCard icon={Phone} label="Phone" value={customer.contactPhone} />
        <InfoCard icon={HardDrive} label="Devices" value={String(customer.deviceCount)} />
        <InfoCard
          icon={ShieldCheck}
          label="Compliance"
          value={`${customer.complianceScore}%`}
          valueClassName={
            customer.complianceScore >= 90
              ? "text-success-text"
              : customer.complianceScore >= 70
                ? "text-warning-text"
                : "text-danger-text"
          }
        />
      </div>

      {/* Address */}
      <div className="card-elevated rounded-xl px-5 py-3">
        <div className="flex items-center gap-2 text-[14px]">
          <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="text-muted-foreground">Address:</span>
          <span className="text-foreground">{customer.address}</span>
        </div>
      </div>

      {/* Sites section */}
      <div>
        <h2 className="mb-3 text-[16px] font-semibold text-foreground">Sites ({sites.length})</h2>
        {sites.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
            <MapPin className="mb-3 h-8 w-8 text-muted-foreground/50" />
            <p className="text-[14px] font-medium text-foreground">No sites</p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              No sites have been registered for this customer.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {sites.map((site) => (
              <SiteCard key={site.id} site={site} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small info card
// ---------------------------------------------------------------------------

function InfoCard({
  icon: Icon,
  label,
  value,
  valueClassName,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="card-elevated rounded-xl px-4 py-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="text-[12px] text-muted-foreground">{label}</span>
      </div>
      <p
        className={cn(
          "mt-1 truncate text-[14px] font-semibold",
          valueClassName ?? "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}
