import type { HealthFactors } from "./digital-twin-types";

// ---------------------------------------------------------------------------
// Health Score Computation (Tech Spec Section 3)
// ---------------------------------------------------------------------------
export function computeHealthScore(factors: HealthFactors): number {
  const weights = {
    firmwareAge: 0.15,
    vulnerabilityExposure: 0.25,
    uptimeScore: 0.15,
    telemetryHealth: 0.2,
    complianceScore: 0.1,
    incidentHistory: 0.15,
  };
  return Math.round(
    Object.entries(weights).reduce(
      (sum, [key, weight]) => sum + factors[key as keyof HealthFactors] * weight,
      0,
    ),
  );
}

export function getHealthBucket(score: number): "critical" | "warning" | "healthy" {
  if (score <= 40) return "critical";
  if (score <= 70) return "warning";
  return "healthy";
}

export function getHealthColor(score: number): string {
  if (score <= 40) return "#ef4444";
  if (score <= 70) return "#f59e0b";
  return "#10b981";
}

export function getHealthLabel(score: number): string {
  if (score <= 40) return "Critical";
  if (score <= 70) return "Warning";
  return "Healthy";
}
