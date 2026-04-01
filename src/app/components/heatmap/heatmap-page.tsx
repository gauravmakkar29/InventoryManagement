import { useState, useMemo, useCallback } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import {
  MapPin,
  ZoomIn,
  ZoomOut,
  Layers,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import type { HeatmapCell } from "../../../lib/types";
import { Skeleton } from "../../../components/skeleton";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

/** Risk Score -> Color mapping (from tech-spec.md Section 6) */
function getRiskColor(avgRiskScore: number): string {
  if (avgRiskScore <= 30) return "#ef4444"; // Critical
  if (avgRiskScore <= 50) return "#f97316"; // High Risk
  if (avgRiskScore <= 70) return "#f59e0b"; // Moderate
  if (avgRiskScore <= 85) return "#84cc16"; // Low Risk
  return "#10b981"; // Healthy
}

function getRiskLabel(avgRiskScore: number): string {
  if (avgRiskScore <= 30) return "Critical";
  if (avgRiskScore <= 50) return "High Risk";
  if (avgRiskScore <= 70) return "Moderate";
  if (avgRiskScore <= 85) return "Low Risk";
  return "Healthy";
}

/** Opacity varies by device density */
function getDensityOpacity(deviceCount: number, maxCount: number): number {
  if (maxCount === 0) return 0.3;
  return 0.3 + (deviceCount / maxCount) * 0.6;
}

// ---------------------------------------------------------------------------
// Mock Heatmap Data
// ---------------------------------------------------------------------------
const MOCK_HEATMAP_CELLS: HeatmapCell[] = [
  {
    geohash: "9q8y",
    centerLat: 37.77,
    centerLng: -122.42,
    deviceCount: 45,
    avgRiskScore: 82,
    maxRiskScore: 95,
    criticalCount: 2,
    regionName: "San Francisco",
  },
  {
    geohash: "9xj6",
    centerLat: 39.74,
    centerLng: -104.99,
    deviceCount: 38,
    avgRiskScore: 68,
    maxRiskScore: 88,
    criticalCount: 5,
    regionName: "Denver",
  },
  {
    geohash: "dr5r",
    centerLat: 40.71,
    centerLng: -74.01,
    deviceCount: 62,
    avgRiskScore: 75,
    maxRiskScore: 92,
    criticalCount: 3,
    regionName: "New York",
  },
  {
    geohash: "u33d",
    centerLat: 48.86,
    centerLng: 2.35,
    deviceCount: 28,
    avgRiskScore: 88,
    maxRiskScore: 96,
    criticalCount: 1,
    regionName: "Paris",
  },
  {
    geohash: "u173",
    centerLat: 51.51,
    centerLng: -0.13,
    deviceCount: 55,
    avgRiskScore: 45,
    maxRiskScore: 72,
    criticalCount: 12,
    regionName: "London",
  },
  {
    geohash: "wt3s",
    centerLat: 31.23,
    centerLng: 121.47,
    deviceCount: 85,
    avgRiskScore: 71,
    maxRiskScore: 89,
    criticalCount: 8,
    regionName: "Shanghai",
  },
  {
    geohash: "w21z",
    centerLat: 1.35,
    centerLng: 103.82,
    deviceCount: 42,
    avgRiskScore: 91,
    maxRiskScore: 98,
    criticalCount: 0,
    regionName: "Singapore",
  },
  {
    geohash: "r3gx",
    centerLat: -33.87,
    centerLng: 151.21,
    deviceCount: 31,
    avgRiskScore: 55,
    maxRiskScore: 78,
    criticalCount: 6,
    regionName: "Sydney",
  },
  {
    geohash: "u33q",
    centerLat: 48.14,
    centerLng: 11.58,
    deviceCount: 34,
    avgRiskScore: 79,
    maxRiskScore: 93,
    criticalCount: 2,
    regionName: "Munich",
  },
  {
    geohash: "7h2w",
    centerLat: -23.55,
    centerLng: -46.63,
    deviceCount: 24,
    avgRiskScore: 38,
    maxRiskScore: 65,
    criticalCount: 9,
    regionName: "Sao Paulo",
  },
  {
    geohash: "xn7h",
    centerLat: 35.68,
    centerLng: 139.69,
    deviceCount: 48,
    avgRiskScore: 84,
    maxRiskScore: 96,
    criticalCount: 1,
    regionName: "Tokyo",
  },
  {
    geohash: "ttnf",
    centerLat: 25.2,
    centerLng: 55.27,
    deviceCount: 19,
    avgRiskScore: 62,
    maxRiskScore: 81,
    criticalCount: 4,
    regionName: "Dubai",
  },
];

// ---------------------------------------------------------------------------
// ViewMode type
// ---------------------------------------------------------------------------
type ViewMode = "pins" | "heatmap";

// ---------------------------------------------------------------------------
// HeatmapTooltip
// ---------------------------------------------------------------------------
function HeatmapTooltip({
  cell,
  position,
}: {
  cell: HeatmapCell;
  position: { x: number; y: number };
}) {
  return (
    <div
      className="pointer-events-none absolute z-50 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-lg"
      style={{ left: position.x + 12, top: position.y - 20 }}
    >
      <p className="text-[14px] font-semibold text-gray-900">{cell.regionName}</p>
      <div className="mt-2 space-y-1.5">
        <div className="flex items-center justify-between gap-6">
          <span className="text-[13px] text-gray-600">Devices</span>
          <span className="text-[14px] font-bold tabular-nums text-gray-900">
            {cell.deviceCount}
          </span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-[13px] text-gray-600">Avg Risk Score</span>
          <span
            className="text-[14px] font-bold tabular-nums"
            style={{ color: getRiskColor(cell.avgRiskScore) }}
          >
            {cell.avgRiskScore.toFixed(0)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-[13px] text-gray-600">Critical</span>
          <span
            className={cn(
              "text-[14px] font-bold tabular-nums",
              cell.criticalCount > 0 ? "text-red-600" : "text-gray-900",
            )}
          >
            {cell.criticalCount}
          </span>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: getRiskColor(cell.avgRiskScore) }}
        />
        <span
          className="text-[12px] font-medium"
          style={{ color: getRiskColor(cell.avgRiskScore) }}
        >
          {getRiskLabel(cell.avgRiskScore)}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// HeatmapLegend
// ---------------------------------------------------------------------------
function HeatmapLegend() {
  const scale = [
    { score: "0-30", color: "#ef4444", label: "Critical" },
    { score: "31-50", color: "#f97316", label: "High" },
    { score: "51-70", color: "#f59e0b", label: "Moderate" },
    { score: "71-85", color: "#84cc16", label: "Low" },
    { score: "86-100", color: "#10b981", label: "Healthy" },
  ];

  return (
    <div className="absolute bottom-4 left-4 z-20 rounded-xl border border-gray-200 bg-white/95 px-3 py-2.5 shadow-md backdrop-blur-sm">
      <p className="mb-2 text-[12px] font-bold uppercase tracking-wider text-gray-600">
        Risk Scale
      </p>
      <div className="flex items-center gap-0.5">
        {scale.map((s) => (
          <div key={s.label} className="flex flex-col items-center">
            <div className="h-3 w-8 rounded-sm" style={{ backgroundColor: s.color }} />
            <span className="mt-1 text-[11px] text-gray-600">{s.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// HeatmapControls
// ---------------------------------------------------------------------------
function HeatmapControls({
  riskThreshold,
  onRiskThresholdChange,
  expanded,
  onToggle,
}: {
  riskThreshold: number;
  onRiskThresholdChange: (v: number) => void;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="absolute top-16 right-4 z-20">
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[13px] font-medium text-gray-700 shadow-md hover:bg-gray-50 cursor-pointer"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Controls
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {expanded && (
        <div className="mt-2 rounded-xl border border-gray-200 bg-white p-4 shadow-lg w-[220px]">
          <label className="block text-[13px] font-semibold text-gray-700 mb-2">
            Risk Threshold
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={riskThreshold}
            onChange={(e) => onRiskThresholdChange(Number(e.target.value))}
            className="w-full accent-[#FF7900]"
          />
          <div className="flex items-center justify-between mt-1">
            <span className="text-[12px] text-gray-600">0</span>
            <span className="text-[14px] font-bold tabular-nums text-[#FF7900]">
              {riskThreshold}
            </span>
            <span className="text-[12px] text-gray-600">100</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// HeatmapPage — Story 13.3
// ---------------------------------------------------------------------------
interface HeatmapPageProps {
  onSelectDevice?: (lat: number, lng: number, deviceName: string) => void;
}

export function HeatmapPage({ onSelectDevice }: HeatmapPageProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("heatmap");
  const [riskThreshold, setRiskThreshold] = useState(100);
  const [controlsExpanded, setControlsExpanded] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([0, 20]);
  const [loading] = useState(false);

  const filteredCells = useMemo(
    () => MOCK_HEATMAP_CELLS.filter((c) => c.avgRiskScore <= riskThreshold),
    [riskThreshold],
  );

  const maxDeviceCount = useMemo(
    () => Math.max(...filteredCells.map((c) => c.deviceCount), 1),
    [filteredCells],
  );

  const totalDevices = useMemo(
    () => filteredCells.reduce((sum, c) => sum + c.deviceCount, 0),
    [filteredCells],
  );

  const handleCellHover = useCallback((cell: HeatmapCell, event: React.MouseEvent) => {
    setHoveredCell(cell);
    setTooltipPos({ x: event.clientX, y: event.clientY });
  }, []);

  const handleCellLeave = useCallback(() => {
    setHoveredCell(null);
  }, []);

  const handleZoomIn = () => setZoom((z) => Math.min(z * 1.5, 8));
  const handleZoomOut = () => setZoom((z) => Math.max(z / 1.5, 1));

  if (loading) {
    return (
      <div
        className="relative h-[600px] rounded-xl border border-gray-200 overflow-hidden"
        aria-busy="true"
      >
        <span className="sr-only" aria-live="polite">
          Loading heatmap...
        </span>
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[16px] font-semibold text-gray-900">Environmental Heatmap</h3>
          <p className="text-[14px] text-gray-600">
            {totalDevices} devices across {filteredCells.length} regions
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-0.5">
          <button
            onClick={() => setViewMode("pins")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium cursor-pointer",
              viewMode === "pins"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-700",
            )}
          >
            <MapPin className="h-3 w-3" />
            Pins
          </button>
          <button
            onClick={() => setViewMode("heatmap")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium cursor-pointer",
              viewMode === "heatmap"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-700",
            )}
          >
            <Layers className="h-3 w-3" />
            Heatmap
          </button>
        </div>
      </div>

      {/* Map container */}
      <div className="relative h-[600px] rounded-xl border border-gray-200 bg-[#f8fafc] overflow-hidden">
        {/* Zoom controls */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-1">
          <button
            onClick={handleZoomIn}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-md hover:bg-gray-50 cursor-pointer"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-md hover:bg-gray-50 cursor-pointer"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
        </div>

        {/* Heatmap controls */}
        {viewMode === "heatmap" && (
          <HeatmapControls
            riskThreshold={riskThreshold}
            onRiskThresholdChange={setRiskThreshold}
            expanded={controlsExpanded}
            onToggle={() => setControlsExpanded((e) => !e)}
          />
        )}

        {/* Map */}
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 140, center: [0, 20] }}
          className="w-full h-full"
        >
          <ZoomableGroup
            zoom={zoom}
            center={center}
            onMoveEnd={({ coordinates, zoom: z }) => {
              setCenter(coordinates);
              setZoom(z);
            }}
          >
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={(geo.rpiProperties?.NAME as string) ?? geo.id}
                    geography={geo}
                    fill="#e5e7eb"
                    stroke="#d1d5db"
                    strokeWidth={0.5}
                    style={{ outline: "none" }}
                  />
                ))
              }
            </Geographies>

            {/* Heatmap overlay */}
            {viewMode === "heatmap" &&
              filteredCells.map((cell) => {
                const color = getRiskColor(cell.avgRiskScore);
                const opacity = getDensityOpacity(cell.deviceCount, maxDeviceCount);
                // Calculate marker size based on device count
                const baseSize = 8 + (cell.deviceCount / maxDeviceCount) * 20;

                return (
                  <g key={cell.geohash}>
                    {/* Heatmap blob */}
                    <circle
                      cx={0}
                      cy={0}
                      r={baseSize}
                      fill={color}
                      opacity={opacity}
                      transform={`translate(${cell.centerLng}, ${cell.centerLat})`}
                      style={{ filter: "url(#blur)" }}
                      onMouseEnter={(e) => handleCellHover(cell, e as unknown as React.MouseEvent)}
                      onMouseLeave={handleCellLeave}
                      onClick={() =>
                        onSelectDevice?.(cell.centerLat, cell.centerLng, cell.regionName)
                      }
                      className="cursor-pointer"
                    />
                    {/* Inner glow */}
                    <circle
                      cx={0}
                      cy={0}
                      r={baseSize * 0.4}
                      fill={color}
                      opacity={opacity * 1.2}
                      transform={`translate(${cell.centerLng}, ${cell.centerLat})`}
                      onMouseEnter={(e) => handleCellHover(cell, e as unknown as React.MouseEvent)}
                      onMouseLeave={handleCellLeave}
                      onClick={() =>
                        onSelectDevice?.(cell.centerLat, cell.centerLng, cell.regionName)
                      }
                      className="cursor-pointer"
                    />
                  </g>
                );
              })}

            {/* Pin view */}
            {viewMode === "pins" &&
              MOCK_HEATMAP_CELLS.map((cell) => (
                <circle
                  key={cell.geohash}
                  cx={0}
                  cy={0}
                  r={4}
                  fill={getRiskColor(cell.avgRiskScore)}
                  stroke="#fff"
                  strokeWidth={1.5}
                  transform={`translate(${cell.centerLng}, ${cell.centerLat})`}
                  onMouseEnter={(e) => handleCellHover(cell, e as unknown as React.MouseEvent)}
                  onMouseLeave={handleCellLeave}
                  className="cursor-pointer"
                />
              ))}
          </ZoomableGroup>
        </ComposableMap>

        {/* Legend */}
        {viewMode === "heatmap" && <HeatmapLegend />}

        {/* Tooltip */}
        {hoveredCell && <HeatmapTooltip cell={hoveredCell} position={tooltipPos} />}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Total Regions",
            value: filteredCells.length.toString(),
            color: "text-gray-900",
          },
          { label: "Total Devices", value: totalDevices.toString(), color: "text-blue-600" },
          {
            label: "Critical Regions",
            value: filteredCells.filter((c) => c.avgRiskScore <= 30).length.toString(),
            color: "text-red-600",
          },
          {
            label: "Healthy Regions",
            value: filteredCells.filter((c) => c.avgRiskScore > 85).length.toString(),
            color: "text-emerald-600",
          },
        ].map((stat) => (
          <div key={stat.label} className="card-elevated px-4 py-3 text-center">
            <p className={cn("text-[18px] font-bold tabular-nums", stat.color)}>{stat.value}</p>
            <p className="mt-0.5 text-[13px] text-gray-600">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
