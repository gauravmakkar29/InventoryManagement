/**
 * IMS Gen 2 — Epic 14: Metrics Dashboard Tab (Story 14.6)
 */
import { Lock, MapPin, CheckCircle2, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { IncidentMetrics } from "@/lib/incident-types";
import { SEVERITY_COLORS } from "@/lib/incident-types";

export function MetricsDashboardTab({ metrics }: { metrics: IncidentMetrics }) {
  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-elevated px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[14px] text-muted-foreground">Open Incidents</p>
              <p className="text-[28px] font-bold text-foreground tabular-nums">
                {metrics.openIncidents}
              </p>
            </div>
            {metrics.hasCritical && (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger-bg">
                <ShieldAlert className="h-5 w-5 text-danger-text animate-pulse" />
              </div>
            )}
            {!metrics.hasCritical && metrics.openIncidents === 0 && (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-bg">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
            )}
          </div>
          {metrics.openIncidents === 0 && (
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-success-bg px-2 py-0.5 text-[13px] font-semibold text-success-text">
              <CheckCircle2 className="h-3 w-3" /> All Clear
            </span>
          )}
          {metrics.hasCritical && (
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-danger-bg px-2 py-0.5 text-[13px] font-semibold text-danger-text">
              Critical incident active
            </span>
          )}
        </div>

        <div className="card-elevated px-5 py-4">
          <p className="text-[14px] text-muted-foreground">Isolated Devices</p>
          <p className="text-[28px] font-bold text-foreground tabular-nums">
            {metrics.isolatedDevices}
          </p>
          <span className="mt-2 inline-flex items-center gap-1 text-[13px] text-muted-foreground">
            <Lock className="h-3 w-3" /> Currently under isolation
          </span>
        </div>

        <div className="card-elevated px-5 py-4">
          <p className="text-[14px] text-muted-foreground">Active Quarantine Zones</p>
          <p className="text-[28px] font-bold text-foreground tabular-nums">
            {metrics.activeQuarantineZones}
          </p>
          <span className="mt-2 inline-flex items-center gap-1 text-[13px] text-muted-foreground">
            <MapPin className="h-3 w-3" /> Geographic zones
          </span>
        </div>
      </div>

      {/* MTTC / MTTR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card-elevated px-5 py-4">
          <p className="text-[14px] text-muted-foreground">Mean Time to Contain (MTTC)</p>
          <div className="mt-2 flex items-baseline gap-3">
            <p className="text-[32px] font-bold text-foreground tabular-nums">
              {metrics.meanTimeToContainHours}
            </p>
            <span className="text-[15px] text-muted-foreground">hours</span>
          </div>
          <div className="mt-2 flex items-center gap-1">
            <span
              className={cn(
                "text-[14px] font-medium",
                metrics.mttcTrend < 0 ? "text-success-text" : "text-danger-text",
              )}
            >
              {metrics.mttcTrend < 0 ? `${metrics.mttcTrend}%` : `+${metrics.mttcTrend}%`}
            </span>
            <span className="text-[13px] text-muted-foreground">vs last period</span>
            {metrics.mttcTrend < 0 && <span className="text-[12px] text-success">(improving)</span>}
          </div>
        </div>
        <div className="card-elevated px-5 py-4">
          <p className="text-[14px] text-muted-foreground">Mean Time to Resolve (MTTR)</p>
          <div className="mt-2 flex items-baseline gap-3">
            <p className="text-[32px] font-bold text-foreground tabular-nums">
              {metrics.meanTimeToResolveHours}
            </p>
            <span className="text-[15px] text-muted-foreground">hours</span>
          </div>
          <div className="mt-2 flex items-center gap-1">
            <span
              className={cn(
                "text-[14px] font-medium",
                metrics.mttrTrend < 0 ? "text-success-text" : "text-danger-text",
              )}
            >
              {metrics.mttrTrend < 0 ? `${metrics.mttrTrend}%` : `+${metrics.mttrTrend}%`}
            </span>
            <span className="text-[13px] text-muted-foreground">vs last period</span>
            {metrics.mttrTrend < 0 && <span className="text-[12px] text-success">(improving)</span>}
          </div>
        </div>
      </div>

      {/* Severity Pie Chart */}
      <div className="card-elevated px-5 py-4">
        <h3 className="text-[15px] font-semibold text-foreground mb-4">Incidents by Severity</h3>
        <div className="flex items-center gap-8">
          {/* SVG Pie Chart */}
          <div className="shrink-0">
            <svg width="160" height="160" viewBox="0 0 160 160">
              {(() => {
                const total = metrics.bySeverity.reduce((sum, s) => sum + s.count, 0);
                let cumAngle = -90;
                const slices = metrics.bySeverity.map((s) => {
                  const pct = total > 0 ? s.count / total : 0;
                  const angle = pct * 360;
                  const startAngle = cumAngle;
                  cumAngle += angle;
                  return { ...s, pct, startAngle, angle };
                });

                return slices.map((slice) => {
                  const startRad = (slice.startAngle * Math.PI) / 180;
                  const endRad = ((slice.startAngle + slice.angle) * Math.PI) / 180;
                  const x1 = 80 + 60 * Math.cos(startRad);
                  const y1 = 80 + 60 * Math.sin(startRad);
                  const x2 = 80 + 60 * Math.cos(endRad);
                  const y2 = 80 + 60 * Math.sin(endRad);
                  const largeArc = slice.angle > 180 ? 1 : 0;
                  const d = `M 80 80 L ${x1} ${y1} A 60 60 0 ${largeArc} 1 ${x2} ${y2} Z`;
                  return (
                    <path
                      key={slice.severity}
                      d={d}
                      fill={SEVERITY_COLORS[slice.severity]}
                      stroke="white"
                      strokeWidth={2}
                    />
                  );
                });
              })()}
              <circle cx="80" cy="80" r="30" fill="var(--color-card)" />
              <text
                x="80"
                y="76"
                textAnchor="middle"
                className="text-[16px] fill-foreground font-bold"
              >
                {metrics.bySeverity.reduce((sum, s) => sum + s.count, 0)}
              </text>
              <text
                x="80"
                y="92"
                textAnchor="middle"
                className="text-[12px] fill-muted-foreground/70"
              >
                Total
              </text>
            </svg>
          </div>
          {/* Legend */}
          <div className="flex-1 space-y-3">
            {metrics.bySeverity.map((s) => (
              <div key={s.severity} className="flex items-center gap-3">
                <span
                  className="h-3 w-3 shrink-0 rounded-sm"
                  style={{ backgroundColor: SEVERITY_COLORS[s.severity] }}
                />
                <span className="flex-1 text-[14px] font-medium text-foreground/80">
                  {s.severity}
                </span>
                <span className="text-[15px] font-bold tabular-nums text-foreground">
                  {s.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
