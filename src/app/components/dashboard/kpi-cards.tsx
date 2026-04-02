import {
  Server,
  Cpu,
  ShieldCheck,
  HeartPulse,
  RefreshCw,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import type { FetchState } from "../../../lib/use-dashboard-data";

// ---------------------------------------------------------------------------
// Sparkline — micro inline chart
// ---------------------------------------------------------------------------
function Sparkline({ data, color = "#10b981" }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 40;
  const h = 16;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(" ");

  return (
    <svg width={w} height={h} className="overflow-visible shrink-0" aria-hidden="true">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Skeleton KPI Card
// ---------------------------------------------------------------------------
function KpiSkeleton() {
  return (
    <div className="card-elevated p-5 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="h-10 w-10 rounded-xl bg-muted" />
      </div>
      <div className="mt-4">
        <div className="h-8 w-24 rounded-md bg-muted" />
        <div className="mt-2 h-4 w-20 rounded-md bg-muted" />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div className="h-4 w-10 rounded-md bg-muted" />
        <div className="h-3 w-16 rounded-md bg-muted" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section Error State
// ---------------------------------------------------------------------------
function SectionError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="card-elevated flex flex-col items-center justify-center py-12 px-5">
      <RefreshCw className="h-8 w-8 text-muted-foreground mb-3" aria-hidden="true" />
      <p className="text-[15px] font-medium text-foreground/80">{message}</p>
      <button
        onClick={onRetry}
        className="mt-3 rounded-lg bg-accent px-4 py-2 text-[14px] font-medium text-white hover:bg-accent-hover cursor-pointer"
      >
        Retry
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const METRIC_CARDS = [
  {
    label: "Total Devices",
    value: "1,247",
    trend: "+12%",
    trendUp: true,
    trendLabel: "vs last week",
    spark: [820, 870, 910, 980, 1050, 1180, 1247],
    icon: Server,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    sparkColor: "#3b82f6",
  },
  {
    label: "Active Deployments",
    value: "18",
    trend: "+3",
    trendUp: true,
    trendLabel: "this week",
    spark: [8, 12, 10, 14, 15, 16, 18],
    icon: Cpu,
    iconBg: "bg-orange-50",
    iconColor: "text-accent-text",
    sparkColor: "#FF7900",
  },
  {
    label: "Pending Approvals",
    value: "7",
    trend: "-2",
    trendUp: false,
    trendLabel: "vs yesterday",
    spark: [12, 11, 9, 10, 8, 9, 7],
    icon: ShieldCheck,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    sparkColor: "#f59e0b",
  },
  {
    label: "Fleet Health",
    value: "94.2%",
    trend: "+0.8%",
    trendUp: true,
    trendLabel: "vs last month",
    spark: [91.2, 92.0, 92.8, 93.1, 93.5, 93.9, 94.2],
    icon: HeartPulse,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    sparkColor: "#10b981",
  },
];

// ---------------------------------------------------------------------------
// KpiCards — handles loading / error / success states
// ---------------------------------------------------------------------------
export function KpiCards({ state, onRetry }: { state: FetchState; onRetry: () => void }) {
  if (state === "loading") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5" aria-busy="true">
        <span className="sr-only" aria-live="polite">
          Loading dashboard metrics...
        </span>
        {Array.from({ length: 4 }).map((_, i) => (
          <KpiSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (state === "error") {
    return <SectionError message="Failed to load dashboard metrics" onRetry={onRetry} />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {METRIC_CARDS.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="card-elevated px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  card.iconBg,
                )}
              >
                <Icon className={cn("h-[18px] w-[18px]", card.iconColor)} aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] text-muted-foreground truncate">{card.label}</p>
                <p className="text-[22px] font-bold leading-snug text-foreground tabular-nums">
                  {card.value}
                </p>
              </div>
            </div>
            <div className="mt-2.5 flex items-center gap-2 pl-12">
              <Sparkline data={card.spark} color={card.sparkColor} />
              <div className="flex items-center gap-1">
                {card.trendUp ? (
                  <TrendingUp className="h-3 w-3 text-emerald-500" aria-hidden="true" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" aria-hidden="true" />
                )}
                <span
                  className={cn(
                    "text-[13px] font-medium",
                    card.trendUp ? "text-emerald-600" : "text-red-600",
                  )}
                >
                  {card.trend}
                </span>
                <span className="text-[12px] text-muted-foreground">{card.trendLabel}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
