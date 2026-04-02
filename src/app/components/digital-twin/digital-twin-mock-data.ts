import type {
  DigitalTwin,
  HealthFactors,
  ConfigDriftItem,
  TwinStateSnapshot,
} from "./digital-twin-types";
import { computeHealthScore } from "./digital-twin-health-utils";

// ---------------------------------------------------------------------------
// Mock Data (Story 15.1)
// ---------------------------------------------------------------------------
function generateMockTwins(): DigitalTwin[] {
  const models = ["SG-3600", "SG-5000", "SG-8000", "SG-2200", "SG-1100"];
  const locations = ["Shanghai HQ", "Denver DC", "Munich Office", "Singapore Lab", "Sao Paulo"];
  const firmwares = ["v4.1.2", "v4.0.8", "v3.9.5", "v4.2.0-rc1", "v3.8.2"];

  return Array.from({ length: 24 }, (_, i) => {
    const factors: HealthFactors = {
      firmwareAge: Math.floor(Math.random() * 40 + 60),
      vulnerabilityExposure: Math.floor(Math.random() * 50 + 50),
      uptimeScore: Math.floor(Math.random() * 30 + 70),
      telemetryHealth: Math.floor(Math.random() * 40 + 60),
      complianceScore: Math.floor(Math.random() * 50 + 50),
      incidentHistory: Math.floor(Math.random() * 40 + 60),
    };
    // Override some to create variety in health buckets
    if (i < 3) {
      factors.vulnerabilityExposure = Math.floor(Math.random() * 20 + 10);
      factors.telemetryHealth = Math.floor(Math.random() * 20 + 15);
      factors.incidentHistory = Math.floor(Math.random() * 20 + 10);
    } else if (i < 8) {
      factors.firmwareAge = Math.floor(Math.random() * 20 + 40);
      factors.complianceScore = Math.floor(Math.random() * 20 + 35);
    }

    const healthScore = computeHealthScore(factors);
    const driftItems: ConfigDriftItem[] =
      i % 3 === 0
        ? [
            {
              configKey: "network.dns.primary",
              expectedValue: "10.0.1.1",
              actualValue: "8.8.8.8",
              severity: "Warning",
              detectedAt: "2026-03-28T14:30:00Z",
            },
            {
              configKey: "security.tls.version",
              expectedValue: "1.3",
              actualValue: "1.2",
              severity: "Critical",
              detectedAt: "2026-03-27T09:15:00Z",
            },
          ]
        : [];

    return {
      deviceId: `DEV-${String(i + 1).padStart(4, "0")}`,
      deviceName: `${locations[i % locations.length]}-${models[i % models.length]}-${String(i + 1).padStart(3, "0")}`,
      deviceModel: models[i % models.length]!,
      currentFirmwareVersion: firmwares[i % firmwares.length]!,
      currentConfigHash: `sha256:${Math.random().toString(36).slice(2, 14)}`,
      healthScore,
      healthFactors: factors,
      uptimePercentage: parseFloat((95 + Math.random() * 5).toFixed(1)),
      configDriftStatus: driftItems.length > 0 ? "Drifted" : i % 5 === 4 ? "Unknown" : "InSync",
      configDriftDetails: driftItems,
      lastSyncedAt: new Date(Date.now() - Math.random() * 3600000 * 4).toISOString(),
      healthDelta: Math.floor(Math.random() * 20 - 5),
    };
  });
}

// Story 15.2 - Mock health trend data
export function generateHealthTrend(
  days: number,
): { date: string; score: number; event?: string }[] {
  const points: { date: string; score: number; event?: string }[] = [];
  let score = 72;
  const events = [
    "Firmware updated",
    "Incident created",
    "Config changed",
    "Compliance review",
    "Telemetry spike",
  ];
  for (let i = days; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400000);
    score = Math.max(15, Math.min(100, score + Math.floor(Math.random() * 12 - 5)));
    const event =
      Math.random() > 0.85 ? events[Math.floor(Math.random() * events.length)] : undefined;
    points.push({
      date: date.toISOString().split("T")[0]!,
      score,
      event,
    });
  }
  return points;
}

// Story 15.2 - Mock snapshots
export function generateSnapshots(): TwinStateSnapshot[] {
  const firmwares = ["v4.0.8", "v4.1.0", "v4.1.2"];
  return Array.from({ length: 8 }, (_, i) => {
    const factors: HealthFactors = {
      firmwareAge: 60 + i * 4,
      vulnerabilityExposure: 55 + i * 3,
      uptimeScore: 70 + i * 2,
      telemetryHealth: 65 + i * 3,
      complianceScore: 50 + i * 5,
      incidentHistory: 60 + i * 4,
    };
    return {
      id: `SNAP-${i + 1}`,
      timestamp: new Date(Date.now() - (7 - i) * 86400000 * 3).toISOString(),
      firmwareVersion: firmwares[Math.min(i, firmwares.length - 1)]!,
      configHash: `sha256:${Math.random().toString(36).slice(2, 14)}`,
      healthScore: computeHealthScore(factors),
      healthFactors: factors,
      status: i < 2 ? "degraded" : "operational",
      telemetrySummary: {
        avgTemperature: 42 + Math.random() * 15,
        avgCpuLoad: 30 + Math.random() * 40,
        avgErrorRate: Math.random() * 2,
      },
      triggeredBy: i % 3 === 0 ? "event" : i % 3 === 1 ? "manual" : "scheduled",
      event:
        i === 3 ? "Firmware updated to v4.1.2" : i === 5 ? "Incident INC-042 created" : undefined,
    };
  });
}

// Story 15.3 - Mock firmware versions
export const AVAILABLE_FIRMWARES = [
  { version: "v4.2.0", model: "SG-3600", releaseDate: "2026-03-15" },
  { version: "v4.1.3-hotfix", model: "SG-3600", releaseDate: "2026-03-10" },
  { version: "v4.2.0", model: "SG-5000", releaseDate: "2026-03-15" },
  { version: "v4.1.5", model: "SG-5000", releaseDate: "2026-03-01" },
  { version: "v4.2.0", model: "SG-8000", releaseDate: "2026-03-15" },
  { version: "v3.9.8-patch", model: "SG-2200", releaseDate: "2026-02-28" },
  { version: "v4.0.0", model: "SG-1100", releaseDate: "2026-03-20" },
];

export const MOCK_TWINS = generateMockTwins();
