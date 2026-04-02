/**
 * IMS Gen 2 — Epic 14: Network Topology Graph (Story 14.3) + Lateral Movement Panel
 */
import { useState, useMemo, useCallback } from "react";
import { Network, X } from "lucide-react";
import { cn } from "../../../lib/utils";
import type { LateralMovementDevice } from "../../../lib/incident-types";
import { MOCK_TOPOLOGY } from "../../../lib/incident-mock-data";

// ---------------------------------------------------------------------------
// Network Topology Graph (Story 14.3) — SVG force-directed
// ---------------------------------------------------------------------------
export function NetworkTopologyGraph({
  graph,
  onShowLateral,
}: {
  graph: typeof MOCK_TOPOLOGY;
  onShowLateral: (deviceId: string) => void;
}) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const [lateralDeviceId, setLateralDeviceId] = useState<string | null>(null);

  // Simple force layout positions (pre-calculated for mock data)
  const nodePositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    const cx = 400;
    const cy = 250;
    const nodes = graph.nodes;
    nodes.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
      const radius = node.isOrigin ? 0 : 120 + (node.riskScore > 60 ? 40 : 80);
      positions[node.id] = {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
      };
    });
    return positions;
  }, [graph.nodes]);

  const statusColors: Record<string, string> = {
    Online: "#10b981",
    Offline: "#6b7280",
    Maintenance: "#f59e0b",
    Isolated: "#f97316",
  };

  const edgeTypeColors: Record<string, string> = {
    same_location: "#3b82f6",
    same_firmware: "#ef4444",
    same_customer: "#8b5cf6",
    geographic_proximity: "#6b7280",
  };

  const edgeTypeLabels: Record<string, string> = {
    same_location: "Same Location",
    same_firmware: "Same Firmware",
    same_customer: "Same Customer",
    geographic_proximity: "Geographic Proximity",
  };

  const handleShowLateral = useCallback(
    (deviceId: string) => {
      setLateralDeviceId(deviceId);
      onShowLateral(deviceId);
    },
    [onShowLateral],
  );

  return (
    <div className="relative">
      <svg
        viewBox="0 0 800 500"
        className="w-full rounded-lg border border-border bg-muted"
        style={{ minHeight: 400 }}
      >
        {/* Edges */}
        {graph.edges.map((edge, i) => {
          const s = nodePositions[edge.source];
          const t = nodePositions[edge.target];
          if (!s || !t) return null;
          const edgeKey = `${edge.source}-${edge.target}-${i}`;
          const isLateral =
            lateralDeviceId && (edge.source === lateralDeviceId || edge.target === lateralDeviceId);
          return (
            <g key={edgeKey}>
              <line
                x1={s.x}
                y1={s.y}
                x2={t.x}
                y2={t.y}
                stroke={
                  isLateral ? "#ef4444" : (edgeTypeColors[edge.relationshipType] ?? "#d1d5db")
                }
                strokeWidth={isLateral ? 3 : Math.max(1, edge.weight * 3)}
                strokeOpacity={lateralDeviceId && !isLateral ? 0.15 : 0.5}
                strokeDasharray={
                  edge.relationshipType === "geographic_proximity" ? "4 4" : undefined
                }
                onMouseEnter={() => setHoveredEdge(edgeKey)}
                onMouseLeave={() => setHoveredEdge(null)}
                className="cursor-pointer"
              />
              {isLateral && (
                <line
                  x1={s.x}
                  y1={s.y}
                  x2={t.x}
                  y2={t.y}
                  stroke="#ef4444"
                  strokeWidth={6}
                  strokeOpacity={0.15}
                  className="animate-pulse"
                />
              )}
              {hoveredEdge === edgeKey && (
                <g>
                  <rect
                    x={(s.x + t.x) / 2 - 60}
                    y={(s.y + t.y) / 2 - 28}
                    width={120}
                    height={36}
                    rx={6}
                    fill="var(--color-card)"
                    stroke="var(--color-border)"
                    strokeWidth={1}
                  />
                  <text
                    x={(s.x + t.x) / 2}
                    y={(s.y + t.y) / 2 - 12}
                    textAnchor="middle"
                    className="text-[12px] fill-foreground/80 font-medium"
                  >
                    {edgeTypeLabels[edge.relationshipType]}
                  </text>
                  <text
                    x={(s.x + t.x) / 2}
                    y={(s.y + t.y) / 2 + 2}
                    textAnchor="middle"
                    className="text-[12px] fill-muted-foreground/70"
                  >
                    Strength: {Math.round(edge.weight * 100)}%
                  </text>
                </g>
              )}
            </g>
          );
        })}
        {/* Nodes */}
        {graph.nodes.map((node) => {
          const pos = nodePositions[node.id];
          if (!pos) return null;
          const r = 12 + (node.riskScore / 100) * 12;
          const isHovered = hoveredNode === node.id;
          const isDimmed =
            lateralDeviceId &&
            lateralDeviceId !== node.id &&
            !graph.edges.some(
              (e) =>
                (e.source === lateralDeviceId && e.target === node.id) ||
                (e.target === lateralDeviceId && e.source === node.id),
            );
          return (
            <g
              key={node.id}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={() => handleShowLateral(node.id)}
              className="cursor-pointer"
              opacity={isDimmed ? 0.2 : 1}
            >
              {node.isOrigin && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={r + 6}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  className="animate-pulse"
                />
              )}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={r}
                fill={statusColors[node.status] ?? "#6b7280"}
                stroke="white"
                strokeWidth={2.5}
              />
              {node.isIsolated && (
                <g transform={`translate(${pos.x + r * 0.5}, ${pos.y - r * 0.5})`}>
                  <circle cx={0} cy={0} r={8} fill="#ef4444" stroke="white" strokeWidth={1.5} />
                  <text
                    x={0}
                    y={1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-[10px] fill-white font-bold"
                  >
                    L
                  </text>
                </g>
              )}
              <text
                x={pos.x}
                y={pos.y + r + 14}
                textAnchor="middle"
                className="text-[12px] fill-muted-foreground font-medium"
              >
                {node.deviceName}
              </text>
              {/* Tooltip */}
              {isHovered && (
                <g>
                  <rect
                    x={pos.x + r + 8}
                    y={pos.y - 44}
                    width={180}
                    height={80}
                    rx={8}
                    fill="var(--color-card)"
                    stroke="var(--color-border)"
                    strokeWidth={1}
                    filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
                  />
                  <text
                    x={pos.x + r + 18}
                    y={pos.y - 26}
                    className="text-[13px] fill-foreground font-semibold"
                  >
                    {node.deviceName}
                  </text>
                  <text
                    x={pos.x + r + 18}
                    y={pos.y - 12}
                    className="text-[12px] fill-muted-foreground"
                  >
                    Status: {node.status}
                  </text>
                  <text
                    x={pos.x + r + 18}
                    y={pos.y + 2}
                    className="text-[12px] fill-muted-foreground"
                  >
                    Risk: {node.riskScore}% | {node.firmwareVersion}
                  </text>
                  <text
                    x={pos.x + r + 18}
                    y={pos.y + 16}
                    className="text-[12px] fill-muted-foreground"
                  >
                    Location: {node.location}
                  </text>
                  <text
                    x={pos.x + r + 18}
                    y={pos.y + 30}
                    className="text-[12px] fill-blue-500 font-medium"
                  >
                    Click to show lateral paths
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-4 text-[13px] text-muted-foreground">
        <span className="font-semibold text-foreground/80">Legend:</span>
        {Object.entries(statusColors).map(([status, color]) => (
          <span key={status} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
            {status}
          </span>
        ))}
        <span className="mx-1 text-muted-foreground">|</span>
        {Object.entries(edgeTypeLabels).map(([type, label]) => (
          <span key={type} className="flex items-center gap-1.5">
            <span className="h-0.5 w-4" style={{ backgroundColor: edgeTypeColors[type] }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lateral Movement Panel (Story 14.3 AC5-AC6)
// ---------------------------------------------------------------------------
export function LateralMovementPanel({
  devices,
  open,
  onClose,
}: {
  devices: LateralMovementDevice[];
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed right-0 top-0 z-40 flex h-full w-[360px] flex-col border-l border-border bg-card shadow-xl">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-red-500" />
          <h3 className="text-base font-semibold text-foreground">Lateral Movement Risk</h3>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <p className="mb-4 text-[14px] text-muted-foreground">
          Devices ranked by lateral movement probability from the selected origin device.
        </p>
        <div className="space-y-2">
          {devices.map((dev, i) => (
            <div key={dev.deviceId} className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded text-[12px] font-bold text-muted-foreground bg-muted">
                    {i + 1}
                  </span>
                  <span className="text-[14px] font-medium text-foreground">{dev.deviceName}</span>
                </div>
                <span
                  className={cn(
                    "text-[14px] font-bold tabular-nums",
                    dev.probability >= 70
                      ? "text-red-600"
                      : dev.probability >= 40
                        ? "text-amber-600"
                        : "text-muted-foreground",
                  )}
                >
                  {dev.probability}%
                </span>
              </div>
              <div className="mt-1.5">
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${dev.probability}%`,
                      backgroundColor:
                        dev.probability >= 70
                          ? "#ef4444"
                          : dev.probability >= 40
                            ? "#f59e0b"
                            : "#6b7280",
                    }}
                  />
                </div>
              </div>
              <p className="mt-1.5 text-[13px] text-muted-foreground">{dev.primaryRiskFactor}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
