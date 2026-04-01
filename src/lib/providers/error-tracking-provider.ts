/**
 * IMS Gen 2 — Error Tracking Provider
 *
 * Pluggable crash reporting. Ships with a console adapter for dev
 * and a Sentry-compatible adapter interface for production.
 *
 * Integrates with React Error Boundaries to auto-capture unhandled crashes.
 *
 * @see Story #199 — Error tracking provider
 */

// =============================================================================
// Types
// =============================================================================

export type Severity = "fatal" | "error" | "warning" | "info";

export interface ErrorContext {
  /** Current user email/ID */
  userId?: string;
  /** Additional tags for filtering (e.g., module, page) */
  tags?: Record<string, string>;
  /** Extra data to attach to the event */
  extra?: Record<string, unknown>;
  /** Severity level */
  level?: Severity;
}

export interface IErrorTracker {
  /** Capture an exception with optional context */
  captureException(error: Error, context?: ErrorContext): void;
  /** Capture a message (breadcrumb / non-error event) */
  captureMessage(message: string, context?: ErrorContext): void;
  /** Set the current user for all future events */
  setUser(user: { id: string; email?: string } | null): void;
  /** Add a breadcrumb for debugging crash context */
  addBreadcrumb(message: string, category?: string, data?: Record<string, unknown>): void;
}

// =============================================================================
// Console Error Tracker (Development)
// =============================================================================

export class ConsoleErrorTracker implements IErrorTracker {
  captureException(error: Error, context?: ErrorContext): void {
    console.error("[ErrorTracker] Exception:", error.message, context ?? "");
    if (error.stack) {
      console.error(error.stack);
    }
  }

  captureMessage(message: string, context?: ErrorContext): void {
    const level = context?.level ?? "info";
    const method =
      level === "fatal" || level === "error" ? "error" : level === "warning" ? "warn" : "info";
    console[method]("[ErrorTracker]", message, context ?? "");
  }

  setUser(user: { id: string; email?: string } | null): void {
    if (user) {
      console.info("[ErrorTracker] User set:", user.email ?? user.id);
    } else {
      console.info("[ErrorTracker] User cleared");
    }
  }

  addBreadcrumb(message: string, category?: string): void {
    console.debug("[ErrorTracker] Breadcrumb:", category ?? "default", "—", message);
  }
}

// =============================================================================
// Sentry-Compatible Adapter (Production reference)
// =============================================================================

/**
 * Sentry adapter — reference implementation.
 *
 * To activate:
 *   npm install @sentry/react
 *   import * as Sentry from "@sentry/react";
 *   const tracker = new SentryErrorTracker();
 *
 * Initialize Sentry separately in main.tsx:
 *   Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN, ... });
 */
export class SentryErrorTracker implements IErrorTracker {
  captureException(error: Error, context?: ErrorContext): void {
    // Real implementation:
    // Sentry.captureException(error, {
    //   tags: context?.tags,
    //   extra: context?.extra,
    //   level: context?.level ?? "error",
    // });
    void error;
    void context;
    throw new Error("SentryErrorTracker not activated. Install @sentry/react.");
  }

  captureMessage(message: string, context?: ErrorContext): void {
    // Sentry.captureMessage(message, { level: context?.level ?? "info", tags: context?.tags });
    void message;
    void context;
    throw new Error("SentryErrorTracker not activated.");
  }

  setUser(user: { id: string; email?: string } | null): void {
    // Sentry.setUser(user);
    void user;
    throw new Error("SentryErrorTracker not activated.");
  }

  addBreadcrumb(message: string, category?: string, data?: Record<string, unknown>): void {
    // Sentry.addBreadcrumb({ message, category, data });
    void message;
    void category;
    void data;
    throw new Error("SentryErrorTracker not activated.");
  }
}

// =============================================================================
// Factory
// =============================================================================

export function createErrorTracker(): IErrorTracker {
  const isDev = typeof import.meta !== "undefined" && import.meta.env?.DEV;
  return isDev ? new ConsoleErrorTracker() : new ConsoleErrorTracker();
  // Production: return new SentryErrorTracker() after Sentry.init()
}
