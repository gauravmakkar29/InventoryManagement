import { useState, useEffect, useCallback, useRef } from "react";
import { usePolling } from "@/lib/hooks/use-polling";

/**
 * Story 16.2: Connectivity Monitoring & Service Health
 *
 * Monitors platform service health and network connectivity.
 * In production, this would ping real endpoints; here we simulate health checks.
 */

export type ServiceStatus = "Healthy" | "Degraded" | "Down";

export interface ServiceHealth {
  service: string;
  status: ServiceStatus;
  latencyMs: number;
  lastChecked: Date;
}

export type OverallStatus = "AllHealthy" | "SomeDegraded" | "CriticalDown";

export interface ConnectivityState {
  services: ServiceHealth[];
  overallStatus: OverallStatus;
  isOnline: boolean;
  lastCheckedAt: Date;
  recoveredService: string | null;
}

const SERVICES = ["AppSync", "DynamoDB", "Cognito", "OpenSearch"];

function simulateHealthCheck(): ServiceHealth[] {
  return SERVICES.map((service) => {
    // Simulate mostly healthy, occasional degraded
    const rand = Math.random();
    let status: ServiceStatus = "Healthy";
    let latencyMs = Math.floor(Math.random() * 120) + 10;

    if (rand > 0.95) {
      status = "Down";
      latencyMs = 0;
    } else if (rand > 0.85) {
      status = "Degraded";
      latencyMs = Math.floor(Math.random() * 800) + 500;
    }

    return {
      service,
      status,
      latencyMs,
      lastChecked: new Date(),
    };
  });
}

function computeOverall(services: ServiceHealth[]): OverallStatus {
  const hasDown = services.some((s) => s.status === "Down");
  if (hasDown) return "CriticalDown";
  const hasDegraded = services.some((s) => s.status === "Degraded");
  if (hasDegraded) return "SomeDegraded";
  return "AllHealthy";
}

export function useConnectivityMonitor(intervalMs = 30000): ConnectivityState {
  const [services, setServices] = useState<ServiceHealth[]>(() => simulateHealthCheck());
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [recoveredService, setRecoveredService] = useState<string | null>(null);
  const prevStatusRef = useRef<Map<string, ServiceStatus>>(new Map());

  const runChecks = useCallback(() => {
    const newServices = simulateHealthCheck();

    // Detect recovery
    for (const svc of newServices) {
      const prev = prevStatusRef.current.get(svc.service);
      if (prev && prev !== "Healthy" && svc.status === "Healthy") {
        setRecoveredService(svc.service);
        setTimeout(() => setRecoveredService(null), 5000);
      }
    }

    // Store current statuses for next comparison
    const statusMap = new Map<string, ServiceStatus>();
    for (const svc of newServices) {
      statusMap.set(svc.service, svc.status);
    }
    prevStatusRef.current = statusMap;

    setServices(newServices);
  }, []);

  usePolling(runChecks, intervalMs);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return {
    services,
    overallStatus: computeOverall(services),
    isOnline,
    lastCheckedAt: services[0]?.lastChecked ?? new Date(),
    recoveredService,
  };
}
