/**
 * IMS Gen 2 — Structured Logger (Story 22.5)
 *
 * Centralized client-side logging with structured breadcrumbs.
 * Captures events in NIST AU-2/AU-3/AU-12 compliant format:
 *   timestamp (ISO 8601 UTC), action, resourceType, resourceId,
 *   userId, level, duration, error context.
 *
 * In production, the log buffer can be flushed to a backend
 * endpoint for server-side persistence (90-day retention).
 *
 * @see NIST 800-53 AU-2 (auditable events), AU-3 (content), AU-12 (generation)
 */

// =============================================================================
// Types
// =============================================================================

export type LogLevel = "info" | "warn" | "error";

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
}

export interface LogContext {
  userId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  duration?: number;
  error?: {
    code: string;
    status?: number;
    stack?: string;
  };
  [key: string]: unknown;
}

export interface Breadcrumb {
  timestamp: string;
  category: string;
  message: string;
  level: LogLevel;
}

// =============================================================================
// Configuration
// =============================================================================

const MAX_BREADCRUMBS = 50;
const MAX_LOG_BUFFER = 200;

// =============================================================================
// Logger singleton
// =============================================================================

class StructuredLogger {
  private breadcrumbs: Breadcrumb[] = [];
  private logBuffer: LogEntry[] = [];
  private userId: string | null = null;

  /**
   * Set the current user ID for all subsequent log entries.
   * Call this after sign-in.
   */
  setUser(userId: string | null): void {
    this.userId = userId;
  }

  /**
   * Log an info-level event.
   */
  info(message: string, context?: LogContext): void {
    this.log("info", message, context);
  }

  /**
   * Log a warning-level event.
   */
  warn(message: string, context?: LogContext): void {
    this.log("warn", message, context);
  }

  /**
   * Log an error-level event.
   */
  error(message: string, context?: LogContext): void {
    this.log("error", message, context);
  }

  /**
   * Add a breadcrumb for debugging context.
   * Breadcrumbs are lightweight markers that help reconstruct
   * the sequence of events leading to an error.
   */
  addBreadcrumb(category: string, message: string, level: LogLevel = "info"): void {
    this.breadcrumbs.push({
      timestamp: new Date().toISOString(),
      category,
      message,
      level,
    });

    // Keep only the most recent breadcrumbs
    if (this.breadcrumbs.length > MAX_BREADCRUMBS) {
      this.breadcrumbs = this.breadcrumbs.slice(-MAX_BREADCRUMBS);
    }
  }

  /**
   * Get current breadcrumbs (for attaching to error reports).
   */
  getBreadcrumbs(): readonly Breadcrumb[] {
    return this.breadcrumbs;
  }

  /**
   * Get buffered log entries (for batch flush to backend).
   */
  getLogBuffer(): readonly LogEntry[] {
    return this.logBuffer;
  }

  /**
   * Flush the log buffer (e.g., after sending to backend).
   */
  flushBuffer(): LogEntry[] {
    const entries = [...this.logBuffer];
    this.logBuffer = [];
    return entries;
  }

  /**
   * Clear all state (on sign-out).
   */
  clear(): void {
    this.breadcrumbs = [];
    this.logBuffer = [];
    this.userId = null;
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  private log(level: LogLevel, message: string, context?: LogContext): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: {
        ...context,
        userId: context?.userId ?? this.userId ?? undefined,
      },
    };

    // Buffer for batch flush
    this.logBuffer.push(entry);
    if (this.logBuffer.length > MAX_LOG_BUFFER) {
      this.logBuffer = this.logBuffer.slice(-MAX_LOG_BUFFER);
    }

    // Also add as breadcrumb
    this.addBreadcrumb(context?.action ?? "log", message, level);

    // Development console output (only warn/error per lint rules)
    if (import.meta.env.DEV) {
      const consoleFn = level === "error" ? console.error : console.warn;
      consoleFn(`[IMS:${level.toUpperCase()}]`, message, context ?? "");
    }
  }
}

// Export singleton
export const logger = new StructuredLogger();

// Wire up as globalThis.structuredLog for hlm-api.ts compatibility
(globalThis as Record<string, unknown>)["structuredLog"] = (
  level: string,
  meta: Record<string, string>,
) => {
  const logLevel = (level === "error" || level === "warn" ? level : "info") as LogLevel;
  logger.addBreadcrumb(meta.source ?? "api", meta.message ?? level, logLevel);
};
