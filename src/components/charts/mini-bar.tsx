import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// MiniBar — compact bar chart (vertical or horizontal)
// ---------------------------------------------------------------------------

export interface MiniBarDatum {
  value: number;
  label: string;
  color?: string;
}

export interface MiniBarProps {
  data: MiniBarDatum[];
  /** Chart width in px. @default 200 */
  width?: number;
  /** Chart height in px. @default 120 */
  height?: number;
  /** Bar orientation. @default "vertical" */
  direction?: "vertical" | "horizontal";
  /** Default bar color when datum.color is not set. @default "#2563eb" */
  defaultColor?: string;
  /** Accessible label. */
  "aria-label"?: string;
  className?: string;
}

export function MiniBar({
  data,
  width = 200,
  height = 120,
  direction = "vertical",
  defaultColor = "#2563eb",
  "aria-label": ariaLabel,
  className,
}: MiniBarProps) {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  if (direction === "horizontal") {
    return (
      <HorizontalBars
        data={data}
        width={width}
        maxValue={maxValue}
        defaultColor={defaultColor}
        ariaLabel={ariaLabel}
        className={className}
      />
    );
  }

  return (
    <VerticalBars
      data={data}
      width={width}
      height={height}
      maxValue={maxValue}
      defaultColor={defaultColor}
      ariaLabel={ariaLabel}
      className={className}
    />
  );
}

// ---------------------------------------------------------------------------
// Vertical bars (SVG)
// ---------------------------------------------------------------------------

function VerticalBars({
  data,
  width,
  height,
  maxValue,
  defaultColor,
  ariaLabel,
  className,
}: {
  data: MiniBarDatum[];
  width: number;
  height: number;
  maxValue: number;
  defaultColor: string;
  ariaLabel: string | undefined;
  className: string | undefined;
}) {
  const paddingBottom = 20;
  const paddingTop = 18;
  const barAreaH = height - paddingTop - paddingBottom;
  const barGap = 6;
  const barWidth = Math.max(4, (width - barGap * (data.length - 1)) / data.length);

  return (
    <div role="img" aria-label={ariaLabel ?? "Bar chart"} className={cn("inline-flex", className)}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        {data.map((d, i) => {
          const barH = (d.value / maxValue) * barAreaH;
          const x = i * (barWidth + barGap);
          const y = paddingTop + barAreaH - barH;
          const fill = d.color ?? defaultColor;

          return (
            <g key={d.label}>
              <rect x={x} y={y} width={barWidth} height={barH} rx={3} fill={fill} opacity={0.85} />
              {/* Value above bar */}
              <text
                x={x + barWidth / 2}
                y={y - 4}
                textAnchor="middle"
                className="fill-foreground text-[11px] font-semibold"
              >
                {d.value}
              </text>
              {/* Label below bar */}
              <text
                x={x + barWidth / 2}
                y={height - 4}
                textAnchor="middle"
                className="fill-muted-foreground text-[10px]"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Horizontal bars (div-based for flexible layout)
// ---------------------------------------------------------------------------

function HorizontalBars({
  data,
  width,
  maxValue,
  defaultColor,
  ariaLabel,
  className,
}: {
  data: MiniBarDatum[];
  width: number;
  maxValue: number;
  defaultColor: string;
  ariaLabel: string | undefined;
  className: string | undefined;
}) {
  return (
    <div
      role="img"
      aria-label={ariaLabel ?? "Horizontal bar chart"}
      className={cn("flex flex-col gap-2", className)}
      style={{ width }}
    >
      {data.map((d) => {
        const pct = (d.value / maxValue) * 100;
        const fill = d.color ?? defaultColor;
        return (
          <div key={d.label} className="flex items-center gap-2">
            <span className="w-16 truncate text-[12px] text-muted-foreground">{d.label}</span>
            <div className="flex-1 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, backgroundColor: fill }}
              />
            </div>
            <span className="w-8 text-right text-[12px] font-semibold tabular-nums text-foreground">
              {d.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}
