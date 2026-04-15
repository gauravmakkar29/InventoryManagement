/**
 * IMS Gen 2 — Structured Logging Provider
 *
 * Pluggable logging with levels, session correlation, and transport adapters.
 * Console for dev, structured JSON for prod. Swap transports via config.
 *
 * @see Story #198 — Structured logging provider
 */

// =============================================================================
// Types
// =============================================================================

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  /** User email or ID (set after auth) */
  userId?: string;
  /** Session/correlation ID for tracing */
  sessionId?: string;
  /** Component or module name */
  module?: string;
  /** Additional key-value pairs */
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context: LogContext;
  data?: unknown;
}

/** Transport interface — implement for CloudWatch, Azure Monitor, Datadog, etc. */
export interface ILogTransport {
  send(entry: LogEntry): void;
}

export interface ILogger {
  debug(message: string, data?: unknown): void;
  info(message: string, data?: unknown): void;
  warn(message: string, data?: unknown): void;
  error(message: string, data?: unknown): void;
  /** Set persistent context (e.g., userId after login) */
  setContext(ctx: Partial<LogContext>): void;
  /** Create a child logger with additional module context */
  child(module: string): ILogger;
}

// =============================================================================
// Log Level Filtering
// =============================================================================

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// =============================================================================
// Console Transport (Development)
// =============================================================================
// This transport intentionally routes to `console.*` — it IS the dev-mode log
// sink. The `no-console` lint rule is disabled for this class only.

/* eslint-disable no-console */
export class ConsoleTransport implements ILogTransport {
  send(entry: LogEntry): void {
    const { level, message, context, data } = entry;
    const prefix = `[${context.module ?? "app"}]`;
    const args = data !== undefined ? [prefix, message, data] : [prefix, message];

    switch (level) {
      case "debug":
        console.debug(...args);
        break;
      case "info":
        console.info(...args);
        break;
      case "warn":
        console.warn(...args);
        break;
      case "error":
        console.error(...args);
        break;
    }
  }
}
/* eslint-enable no-console */

// =============================================================================
// JSON Transport (Production — pipe to CloudWatch, Datadog, etc.)
// =============================================================================

export class JsonTransport implements ILogTransport {
  private readonly endpoint?: string;

  constructor(endpoint?: string) {
    this.endpoint = endpoint;
  }

  send(entry: LogEntry): void {
    const json = JSON.stringify(entry);

    if (this.endpoint) {
      // Fire-and-forget to logging endpoint
      navigator.sendBeacon?.(this.endpoint, json);
    } else {
      // Fallback: structured console output (captured by log aggregator)
      // eslint-disable-next-line no-console -- structured JSON fallback sink
      console.log(json);
    }
  }
}

// =============================================================================
// Logger Factory
// =============================================================================

export interface LoggerConfig {
  /** Minimum log level to emit (default: "debug" in dev, "info" in prod) */
  minLevel?: LogLevel;
  /** Transports to send log entries to */
  transports?: ILogTransport[];
  /** Initial context (e.g., app version) */
  context?: LogContext;
}

export function createLogger(config?: LoggerConfig): ILogger {
  const isDev = typeof import.meta !== "undefined" && import.meta.env?.DEV;
  const minLevel = config?.minLevel ?? (isDev ? "debug" : "info");
  const transports = config?.transports ?? [isDev ? new ConsoleTransport() : new JsonTransport()];
  let globalContext: LogContext = {
    sessionId: crypto.randomUUID?.() ?? Date.now().toString(36),
    ...config?.context,
  };

  function shouldLog(level: LogLevel): boolean {
    return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[minLevel];
  }

  function emit(level: LogLevel, message: string, data?: unknown, moduleCtx?: string): void {
    if (!shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: { ...globalContext, ...(moduleCtx ? { module: moduleCtx } : {}) },
      data,
    };

    for (const transport of transports) {
      try {
        transport.send(entry);
      } catch {
        // Never let logging break the app
      }
    }
  }

  function createLoggerInstance(module?: string): ILogger {
    return {
      debug: (msg, data) => emit("debug", msg, data, module),
      info: (msg, data) => emit("info", msg, data, module),
      warn: (msg, data) => emit("warn", msg, data, module),
      error: (msg, data) => emit("error", msg, data, module),
      setContext: (ctx) => {
        globalContext = { ...globalContext, ...ctx };
      },
      child: (childModule) =>
        createLoggerInstance(module ? `${module}.${childModule}` : childModule),
    };
  }

  return createLoggerInstance();
}
