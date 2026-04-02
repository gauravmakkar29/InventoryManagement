import { useState, useCallback } from "react";
import {
  ArrowDown,
  ArrowUp,
  AlertTriangle,
  CheckCircle,
  Cpu,
  Save,
  SkipBack,
  X,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import type { DigitalTwin, FirmwareSimulationResult } from "./digital-twin-types";
import { AVAILABLE_FIRMWARES } from "./digital-twin-mock-data";

// Story 15.3 — Firmware Simulation Dialog
export function FirmwareSimulationDialog({
  twin,
  onClose,
}: {
  twin: DigitalTwin;
  onClose: () => void;
}) {
  const [targetVersion, setTargetVersion] = useState("");
  const [result, setResult] = useState<FirmwareSimulationResult | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [savedSimulations, setSavedSimulations] = useState<FirmwareSimulationResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const compatibleFirmwares = AVAILABLE_FIRMWARES.filter(
    (fw) => fw.model === twin.deviceModel && fw.version !== twin.currentFirmwareVersion,
  );

  const runSimulation = useCallback(() => {
    if (!targetVersion) return;
    setSimulating(true);
    // Simulate async
    setTimeout(() => {
      const isIncompatible = !compatibleFirmwares.some((fw) => fw.version === targetVersion);
      const sim: FirmwareSimulationResult = isIncompatible
        ? {
            id: `FWSIM-${Date.now()}`,
            deviceId: twin.deviceId,
            currentFirmwareVersion: twin.currentFirmwareVersion,
            targetFirmwareVersion: targetVersion,
            compatibilityStatus: "Incompatible",
            warnings: ["Device model mismatch — target firmware not supported"],
            predictedHealthScoreChange: 0,
            predictedDowntimeMinutes: 0,
            rollbackRisk: "High",
            newVulnerabilities: [],
            resolvedVulnerabilities: [],
            simulatedAt: new Date().toISOString(),
          }
        : {
            id: `FWSIM-${Date.now()}`,
            deviceId: twin.deviceId,
            currentFirmwareVersion: twin.currentFirmwareVersion,
            targetFirmwareVersion: targetVersion,
            compatibilityStatus: Math.random() > 0.3 ? "Compatible" : "CompatibleWithWarnings",
            warnings:
              Math.random() > 0.5
                ? ["Config key network.dns.primary deprecated in target version"]
                : [],
            predictedHealthScoreChange: Math.floor(Math.random() * 20 - 3),
            predictedDowntimeMinutes: Math.floor(Math.random() * 15 + 3),
            rollbackRisk: Math.random() > 0.6 ? "Low" : Math.random() > 0.3 ? "Medium" : "High",
            newVulnerabilities:
              Math.random() > 0.6
                ? [{ cveId: "CVE-2026-4521", severity: "Medium", component: "openssl" }]
                : [],
            resolvedVulnerabilities: [
              { cveId: "CVE-2026-1234", severity: "Critical", component: "kernel" },
              { cveId: "CVE-2026-2891", severity: "High", component: "busybox" },
            ],
            simulatedAt: new Date().toISOString(),
          };
      setResult(sim);
      setSimulating(false);
    }, 1200);
  }, [targetVersion, twin, compatibleFirmwares]);

  const saveSimulation = useCallback(() => {
    if (result) {
      setSavedSimulations((prev) => [result, ...prev]);
    }
  }, [result]);

  const compatBadge = (status: FirmwareSimulationResult["compatibilityStatus"]) => {
    if (status === "Compatible") return "bg-emerald-50 text-emerald-700";
    if (status === "CompatibleWithWarnings") return "bg-amber-50 text-amber-700";
    return "bg-red-50 text-red-700";
  };

  const riskBadge = (risk: string) => {
    if (risk === "Low") return "bg-emerald-50 text-emerald-700";
    if (risk === "Medium") return "bg-amber-50 text-amber-700";
    return "bg-red-50 text-red-700";
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-[680px] max-h-[85vh] overflow-y-auto rounded-xl bg-card shadow-xl border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <div>
            <h3 className="text-[16px] font-semibold text-foreground">
              Firmware Upgrade Simulation
            </h3>
            <p className="text-[14px] text-muted-foreground mt-0.5">{twin.deviceName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-muted-foreground cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!result ? (
          <div className="p-6 space-y-5">
            {/* Current firmware */}
            <div className="rounded-lg border border-border bg-muted p-4">
              <p className="text-[12px] font-semibold uppercase text-muted-foreground mb-2">
                Current Firmware
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-card border border-border">
                  <Cpu className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-foreground">
                    {twin.currentFirmwareVersion}
                  </p>
                  <p className="text-[13px] text-muted-foreground">{twin.deviceModel}</p>
                </div>
              </div>
            </div>

            {/* Target selector */}
            <div>
              <label
                htmlFor="dt-target-firmware"
                className="text-[14px] font-medium text-foreground/80 mb-1.5 block"
              >
                Target Firmware
              </label>
              <select
                id="dt-target-firmware"
                value={targetVersion}
                onChange={(e) => setTargetVersion(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-[14px] text-foreground/80 focus:border-accent-text focus:ring-1 focus:ring-ring focus:outline-none"
              >
                <option value="">Select target version...</option>
                {compatibleFirmwares.map((fw) => (
                  <option key={fw.version} value={fw.version}>
                    {fw.version} ({fw.releaseDate})
                  </option>
                ))}
              </select>
              {compatibleFirmwares.length === 0 && (
                <p className="mt-1.5 text-[13px] text-amber-600">
                  No compatible firmware versions available for this model.
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="text-[14px] font-medium text-accent-text hover:underline cursor-pointer"
              >
                {showHistory ? "Hide" : "View"} Simulation History ({savedSimulations.length})
              </button>
              <button
                onClick={runSimulation}
                disabled={!targetVersion || simulating}
                className={cn(
                  "rounded-lg px-5 py-2.5 text-[14px] font-semibold text-white cursor-pointer",
                  targetVersion ? "bg-accent hover:bg-accent-hover" : "bg-muted cursor-not-allowed",
                )}
              >
                {simulating ? "Simulating..." : "Run Simulation"}
              </button>
            </div>

            {/* Simulation History */}
            {showHistory && savedSimulations.length > 0 && (
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-[14px]">
                  <caption className="sr-only">Digital twin simulation history</caption>
                  <thead>
                    <tr className="bg-table-header border-b-2 border-border">
                      <th
                        scope="col"
                        className="px-3 py-2 text-left font-bold uppercase text-[12px] text-muted-foreground"
                      >
                        Date
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2 text-left font-bold uppercase text-[12px] text-muted-foreground"
                      >
                        Target FW
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2 text-left font-bold uppercase text-[12px] text-muted-foreground"
                      >
                        Compat.
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2 text-right font-bold uppercase text-[12px] text-muted-foreground"
                      >
                        Health Delta
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {savedSimulations.map((sim) => (
                      <tr key={sim.id} className="border-b border-border/60">
                        <td className="px-3 py-2 text-muted-foreground">
                          {new Date(sim.simulatedAt).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-2 font-medium text-foreground/80">
                          {sim.targetFirmwareVersion}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[12px] font-medium",
                              compatBadge(sim.compatibilityStatus),
                            )}
                          >
                            {sim.compatibilityStatus === "CompatibleWithWarnings"
                              ? "Warnings"
                              : sim.compatibilityStatus}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right font-semibold tabular-nums">
                          <span
                            className={
                              sim.predictedHealthScoreChange >= 0
                                ? "text-emerald-600"
                                : "text-red-600"
                            }
                          >
                            {sim.predictedHealthScoreChange >= 0 ? "+" : ""}
                            {sim.predictedHealthScoreChange}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Results */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setResult(null)}
                className="text-[14px] font-medium text-muted-foreground hover:text-foreground/80 cursor-pointer flex items-center gap-1"
              >
                <SkipBack className="h-3 w-3" /> Back
              </button>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-[13px] font-semibold",
                  compatBadge(result.compatibilityStatus),
                )}
              >
                {result.compatibilityStatus === "CompatibleWithWarnings"
                  ? "Compatible with Warnings"
                  : result.compatibilityStatus}
              </span>
            </div>

            {/* Health Delta large display */}
            <div className="flex items-center justify-center gap-4 py-4">
              <div className="text-center">
                <p className="text-[13px] text-muted-foreground mb-1">Health Score Change</p>
                <div className="flex items-center gap-2">
                  {result.predictedHealthScoreChange >= 0 ? (
                    <ArrowUp className="h-6 w-6 text-emerald-500" />
                  ) : (
                    <ArrowDown className="h-6 w-6 text-red-500" />
                  )}
                  <span
                    className={cn(
                      "text-[32px] font-bold tabular-nums",
                      result.predictedHealthScoreChange >= 0 ? "text-emerald-600" : "text-red-600",
                    )}
                  >
                    {result.predictedHealthScoreChange >= 0 ? "+" : ""}
                    {result.predictedHealthScoreChange}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-border/60 bg-muted px-3 py-2.5 text-center">
                <p className="text-[15px] font-bold text-foreground tabular-nums">
                  {result.predictedDowntimeMinutes}m
                </p>
                <p className="text-[12px] text-muted-foreground">Est. Downtime</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted px-3 py-2.5 text-center">
                <span
                  className={cn(
                    "text-[14px] font-bold",
                    riskBadge(result.rollbackRisk).includes("emerald")
                      ? "text-emerald-700"
                      : riskBadge(result.rollbackRisk).includes("amber")
                        ? "text-amber-700"
                        : "text-red-700",
                  )}
                >
                  {result.rollbackRisk}
                </span>
                <p className="text-[12px] text-muted-foreground">Rollback Risk</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted px-3 py-2.5 text-center">
                <p className="text-[15px] font-bold text-foreground">
                  {result.targetFirmwareVersion}
                </p>
                <p className="text-[12px] text-muted-foreground">Target FW</p>
              </div>
            </div>

            {/* Warnings */}
            {result.warnings.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-1.5">
                <p className="text-[13px] font-semibold text-amber-800 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> Warnings
                </p>
                {result.warnings.map((w, i) => (
                  <p key={i} className="text-[14px] text-amber-700 pl-5">
                    {w}
                  </p>
                ))}
              </div>
            )}

            {/* Vulnerabilities */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-[13px] font-semibold text-emerald-800 mb-2 flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" /> Resolved (
                  {result.resolvedVulnerabilities.length})
                </p>
                {result.resolvedVulnerabilities.map((v) => (
                  <div
                    key={v.cveId}
                    className="flex items-center justify-between text-[13px] py-0.5"
                  >
                    <span className="font-mono text-emerald-700">{v.cveId}</span>
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[12px] font-semibold",
                        v.severity === "Critical"
                          ? "bg-red-100 text-red-700"
                          : v.severity === "High"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-yellow-100 text-yellow-700",
                      )}
                    >
                      {v.severity}
                    </span>
                  </div>
                ))}
                {result.resolvedVulnerabilities.length === 0 && (
                  <p className="text-[13px] text-emerald-600">None</p>
                )}
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-[13px] font-semibold text-red-800 mb-2 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> Introduced (
                  {result.newVulnerabilities.length})
                </p>
                {result.newVulnerabilities.map((v) => (
                  <div
                    key={v.cveId}
                    className="flex items-center justify-between text-[13px] py-0.5"
                  >
                    <span className="font-mono text-red-700">{v.cveId}</span>
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[12px] font-semibold",
                        v.severity === "Critical"
                          ? "bg-red-100 text-red-700"
                          : v.severity === "High"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-yellow-100 text-yellow-700",
                      )}
                    >
                      {v.severity}
                    </span>
                  </div>
                ))}
                {result.newVulnerabilities.length === 0 && (
                  <p className="text-[13px] text-red-600">None</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={saveSimulation}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-[14px] font-medium text-foreground/80 hover:bg-muted cursor-pointer"
              >
                <Save className="h-3.5 w-3.5" /> Save Simulation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
