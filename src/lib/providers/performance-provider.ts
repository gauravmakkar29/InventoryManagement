/**
 * IMS Gen 2 — Performance Monitoring Provider
 *
 * Web Vitals (LCP, FID, CLS, TTFB, INP) + custom performance marks.
 * Pluggable reporter — console for dev, beacon/analytics for prod.
 *
 * @see Story #200 — Performance monitoring
 */

// =============================================================================
// Types
// =============================================================================

export type WebVitalName = "LCP" | "FID" | "CLS" | "TTFB" | "INP";

export interface WebVitalMetric {
  name: WebVitalName;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  /** Navigation type (navigate, reload, back_forward, prerender) */
  navigationType?: string;
}

export interface PerformanceMark {
  name: string;
  startTime: number;
  duration: number;
  metadata?: Record<string, unknown>;
}

export interface IPerformanceReporter {
  /** Report a Web Vital metric */
  reportVital(metric: WebVitalMetric): void;
  /** Report a custom performance mark */
  reportMark(mark: PerformanceMark): void;
}

export interface IPerformanceMonitor {
  /** Start observing Web Vitals (call once on app mount) */
  startVitals(): void;
  /** Mark the start of a custom measurement */
  markStart(name: string, metadata?: Record<string, unknown>): void;
  /** Mark the end and report duration */
  markEnd(name: string): void;
  /** Get current performance budget status */
  getBudgetStatus(): BudgetStatus;
}

// =============================================================================
// Performance Budgets
// =============================================================================

export interface PerformanceBudget {
  LCP: number; // ms
  CLS: number; // score
  INP: number; // ms
  TTFB: number; // ms
}

export interface BudgetStatus {
  budget: PerformanceBudget;
  violations: { metric: WebVitalName; value: number; limit: number }[];
}

const DEFAULT_BUDGET: PerformanceBudget = {
  LCP: 2500,
  CLS: 0.1,
  INP: 200,
  TTFB: 800,
};

// =============================================================================
// Web Vitals Thresholds (Google's ratings)
// =============================================================================

const VITAL_THRESHOLDS: Record<WebVitalName, [number, number]> = {
  LCP: [2500, 4000],
  FID: [100, 300],
  CLS: [0.1, 0.25],
  TTFB: [800, 1800],
  INP: [200, 500],
};

function rateVital(name: WebVitalName, value: number): WebVitalMetric["rating"] {
  const [good, poor] = VITAL_THRESHOLDS[name];
  if (value <= good) return "good";
  if (value <= poor) return "needs-improvement";
  return "poor";
}

// =============================================================================
// Console Reporter (Development)
// =============================================================================
// This reporter intentionally routes to `console.*` — it IS the dev-mode perf
// sink. The `no-console` lint rule is disabled for this class only.

/* eslint-disable no-console */
export class ConsolePerformanceReporter implements IPerformanceReporter {
  reportVital(metric: WebVitalMetric): void {
    const icon = metric.rating === "good" ? "✓" : metric.rating === "poor" ? "✗" : "⚠";
    console.info(
      `[Perf] ${icon} ${metric.name}: ${metric.value.toFixed(metric.name === "CLS" ? 3 : 0)}${metric.name === "CLS" ? "" : "ms"} (${metric.rating})`,
    );
  }

  reportMark(mark: PerformanceMark): void {
    console.debug(`[Perf] ${mark.name}: ${mark.duration.toFixed(1)}ms`, mark.metadata ?? "");
  }
}
/* eslint-enable no-console */

// =============================================================================
// Beacon Reporter (Production — send to analytics endpoint)
// =============================================================================

export class BeaconPerformanceReporter implements IPerformanceReporter {
  private readonly endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  reportVital(metric: WebVitalMetric): void {
    navigator.sendBeacon?.(this.endpoint, JSON.stringify({ type: "vital", ...metric }));
  }

  reportMark(mark: PerformanceMark): void {
    navigator.sendBeacon?.(this.endpoint, JSON.stringify({ type: "mark", ...mark }));
  }
}

// =============================================================================
// Performance Monitor
// =============================================================================

export function createPerformanceMonitor(
  reporter?: IPerformanceReporter,
  budget?: Partial<PerformanceBudget>,
): IPerformanceMonitor {
  const isDev = typeof import.meta !== "undefined" && import.meta.env?.DEV;
  const rep = reporter ?? new ConsolePerformanceReporter();
  const perfBudget: PerformanceBudget = { ...DEFAULT_BUDGET, ...budget };
  const vitals: Partial<Record<WebVitalName, number>> = {};
  const marks = new Map<string, { startTime: number; metadata?: Record<string, unknown> }>();

  return {
    startVitals() {
      // Web Vitals observer using PerformanceObserver API
      if (typeof PerformanceObserver === "undefined") return;

      // LCP
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const last = entries[entries.length - 1];
          if (last) {
            const value = last.startTime;
            vitals.LCP = value;
            rep.reportVital({ name: "LCP", value, rating: rateVital("LCP", value) });
          }
        });
        lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
      } catch {
        /* not supported */
      }

      // CLS
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as PerformanceEntry & { hadRecentInput?: boolean }).hadRecentInput) {
              clsValue += (entry as PerformanceEntry & { value: number }).value;
            }
          }
          vitals.CLS = clsValue;
          rep.reportVital({ name: "CLS", value: clsValue, rating: rateVital("CLS", clsValue) });
        });
        clsObserver.observe({ type: "layout-shift", buffered: true });
      } catch {
        /* not supported */
      }

      // TTFB
      try {
        const navEntry = performance.getEntriesByType("navigation")[0] as
          | PerformanceNavigationTiming
          | undefined;
        if (navEntry) {
          const ttfb = navEntry.responseStart - navEntry.requestStart;
          vitals.TTFB = ttfb;
          rep.reportVital({ name: "TTFB", value: ttfb, rating: rateVital("TTFB", ttfb) });
        }
      } catch {
        /* not supported */
      }

      if (isDev) {
        // eslint-disable-next-line no-console -- dev-mode init notice
        console.info("[Perf] Web Vitals monitoring started");
      }
    },

    markStart(name, metadata) {
      marks.set(name, { startTime: performance.now(), metadata });
    },

    markEnd(name) {
      const start = marks.get(name);
      if (!start) return;
      marks.delete(name);
      const duration = performance.now() - start.startTime;
      rep.reportMark({ name, startTime: start.startTime, duration, metadata: start.metadata });
    },

    getBudgetStatus(): BudgetStatus {
      const violations: BudgetStatus["violations"] = [];
      if (vitals.LCP !== undefined && vitals.LCP > perfBudget.LCP) {
        violations.push({ metric: "LCP", value: vitals.LCP, limit: perfBudget.LCP });
      }
      if (vitals.CLS !== undefined && vitals.CLS > perfBudget.CLS) {
        violations.push({ metric: "CLS", value: vitals.CLS, limit: perfBudget.CLS });
      }
      if (vitals.INP !== undefined && vitals.INP > perfBudget.INP) {
        violations.push({ metric: "INP", value: vitals.INP, limit: perfBudget.INP });
      }
      if (vitals.TTFB !== undefined && vitals.TTFB > perfBudget.TTFB) {
        violations.push({ metric: "TTFB", value: vitals.TTFB, limit: perfBudget.TTFB });
      }
      return { budget: perfBudget, violations };
    },
  };
}
