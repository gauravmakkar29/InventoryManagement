/**
 * IMS Gen 2 — Resilient API Client
 *
 * Cloud-agnostic HTTP client wrapper with:
 * - Exponential backoff with jitter
 * - Circuit breaker (stop calling after N consecutive failures)
 * - Rate limit awareness (respect 429 + Retry-After)
 * - Request/response interceptors (auth headers, logging, error normalization)
 * - Configurable timeouts per request type
 *
 * Works with any API provider adapter. Does NOT import cloud SDKs.
 *
 * @see Story #181 — API client retry, backoff, circuit breaker
 */

// =============================================================================
// Types
// =============================================================================

export type RequestType = "query" | "mutation" | "upload";

export interface ApiClientConfig {
  /** Base URL for API calls (default: from VITE_API_URL or empty for relative) */
  baseUrl?: string;
  /** Max retry attempts per request type */
  maxRetries?: Partial<Record<RequestType, number>>;
  /** Base delay in ms for exponential backoff (default: 300) */
  baseDelayMs?: number;
  /** Max delay cap in ms (default: 10000) */
  maxDelayMs?: number;
  /** Timeout per request type in ms */
  timeouts?: Partial<Record<RequestType, number>>;
  /** Circuit breaker: consecutive failures before opening (default: 5) */
  circuitBreakerThreshold?: number;
  /** Circuit breaker: cooldown in ms before half-open retry (default: 30000) */
  circuitBreakerCooldownMs?: number;
  /** Request interceptors — run before every request */
  requestInterceptors?: RequestInterceptor[];
  /** Response interceptors — run after every response */
  responseInterceptors?: ResponseInterceptor[];
}

export interface ApiRequest {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  type?: RequestType;
  signal?: AbortSignal;
}

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  headers: Record<string, string>;
  duration: number;
}

export interface ApiError {
  message: string;
  status?: number;
  code: string;
  retryable: boolean;
  original?: unknown;
}

export type RequestInterceptor = (request: ApiRequest) => ApiRequest | Promise<ApiRequest>;
export type ResponseInterceptor = (response: ApiResponse) => ApiResponse | Promise<ApiResponse>;

// =============================================================================
// Circuit Breaker
// =============================================================================

type CircuitState = "closed" | "open" | "half-open";

interface CircuitBreaker {
  state: CircuitState;
  failures: number;
  lastFailureAt: number;
  threshold: number;
  cooldownMs: number;
}

function createCircuitBreaker(threshold: number, cooldownMs: number): CircuitBreaker {
  return {
    state: "closed",
    failures: 0,
    lastFailureAt: 0,
    threshold,
    cooldownMs,
  };
}

function shouldAllowRequest(cb: CircuitBreaker): boolean {
  if (cb.state === "closed") return true;
  if (cb.state === "open") {
    // Check if cooldown has elapsed → move to half-open
    if (Date.now() - cb.lastFailureAt >= cb.cooldownMs) {
      cb.state = "half-open";
      return true;
    }
    return false;
  }
  // half-open — allow one probe request
  return true;
}

function recordSuccess(cb: CircuitBreaker): void {
  cb.failures = 0;
  cb.state = "closed";
}

function recordFailure(cb: CircuitBreaker): void {
  cb.failures++;
  cb.lastFailureAt = Date.now();
  if (cb.failures >= cb.threshold) {
    cb.state = "open";
  }
}

// =============================================================================
// Helpers
// =============================================================================

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Exponential backoff with full jitter. */
function getBackoffDelay(attempt: number, baseMs: number, maxMs: number): number {
  const exponential = baseMs * Math.pow(2, attempt);
  const capped = Math.min(exponential, maxMs);
  return Math.random() * capped;
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 502 || status === 503 || status === 504;
}

function parseRetryAfter(headers: Record<string, string>): number | null {
  const value = headers["retry-after"];
  if (!value) return null;
  const seconds = Number(value);
  if (!isNaN(seconds)) return seconds * 1000;
  const date = Date.parse(value);
  if (!isNaN(date)) return Math.max(0, date - Date.now());
  return null;
}

function normalizeError(err: unknown, status?: number): ApiError {
  if (err instanceof DOMException && err.name === "AbortError") {
    return {
      message: "Request timed out",
      status,
      code: "TIMEOUT",
      retryable: true,
      original: err,
    };
  }
  if (err instanceof TypeError && err.message.includes("fetch")) {
    return {
      message: "Network error",
      status: 0,
      code: "NETWORK_ERROR",
      retryable: true,
      original: err,
    };
  }
  if (err instanceof Error) {
    return {
      message: err.message,
      status,
      code: status ? `HTTP_${status}` : "UNKNOWN",
      retryable: status ? isRetryableStatus(status) : false,
      original: err,
    };
  }
  return { message: String(err), code: "UNKNOWN", retryable: false, original: err };
}

// =============================================================================
// Default Config
// =============================================================================

const DEFAULT_MAX_RETRIES: Record<RequestType, number> = {
  query: 3,
  mutation: 1,
  upload: 0,
};

const DEFAULT_TIMEOUTS: Record<RequestType, number> = {
  query: 10_000,
  mutation: 30_000,
  upload: 5 * 60_000,
};

// =============================================================================
// API Client
// =============================================================================

export interface IApiClient {
  /** Execute an API request with retry, backoff, and circuit breaker. */
  execute<T = unknown>(request: ApiRequest): Promise<ApiResponse<T>>;
  /** Get current circuit breaker state (for monitoring/debugging). */
  getCircuitState(): CircuitState;
  /** Reset circuit breaker (e.g., after network recovery). */
  resetCircuit(): void;
}

export function createApiClient(config: ApiClientConfig = {}): IApiClient {
  const baseUrl = config.baseUrl ?? "";
  const baseDelayMs = config.baseDelayMs ?? 300;
  const maxDelayMs = config.maxDelayMs ?? 10_000;
  const maxRetries = { ...DEFAULT_MAX_RETRIES, ...config.maxRetries };
  const timeouts = { ...DEFAULT_TIMEOUTS, ...config.timeouts };
  const requestInterceptors = config.requestInterceptors ?? [];
  const responseInterceptors = config.responseInterceptors ?? [];

  const circuit = createCircuitBreaker(
    config.circuitBreakerThreshold ?? 5,
    config.circuitBreakerCooldownMs ?? 30_000,
  );

  async function execute<T = unknown>(request: ApiRequest): Promise<ApiResponse<T>> {
    const type = request.type ?? "query";
    const retries = maxRetries[type];
    const timeout = timeouts[type];

    // Circuit breaker check
    if (!shouldAllowRequest(circuit)) {
      throw {
        message: "Circuit breaker is open — API temporarily unavailable",
        code: "CIRCUIT_OPEN",
        retryable: false,
      } satisfies ApiError;
    }

    // Apply request interceptors
    let req = { ...request };
    for (const interceptor of requestInterceptors) {
      req = await interceptor(req);
    }

    let lastError: ApiError | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      // Backoff delay (skip on first attempt)
      if (attempt > 0) {
        const backoff = getBackoffDelay(attempt - 1, baseDelayMs, maxDelayMs);
        await delay(backoff);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      const start = performance.now();

      try {
        const url = baseUrl + req.url;
        const fetchResponse = await fetch(url, {
          method: req.method ?? "GET",
          headers: {
            "Content-Type": "application/json",
            ...req.headers,
          },
          body: req.body ? JSON.stringify(req.body) : undefined,
          signal: req.signal ?? controller.signal,
        });

        clearTimeout(timeoutId);
        const duration = performance.now() - start;

        const responseHeaders: Record<string, string> = {};
        fetchResponse.headers.forEach((v, k) => {
          responseHeaders[k] = v;
        });

        if (!fetchResponse.ok) {
          const status = fetchResponse.status;

          // Rate limited — respect Retry-After
          if (status === 429) {
            const retryAfter = parseRetryAfter(responseHeaders);
            if (retryAfter && attempt < retries) {
              await delay(retryAfter);
              continue;
            }
          }

          if (isRetryableStatus(status) && attempt < retries) {
            recordFailure(circuit);
            lastError = normalizeError(new Error(`HTTP ${status}`), status);
            continue;
          }

          recordFailure(circuit);
          throw normalizeError(new Error(`HTTP ${status}: ${fetchResponse.statusText}`), status);
        }

        // Success
        recordSuccess(circuit);
        const data = (await fetchResponse.json()) as T;

        let response: ApiResponse<T> = {
          data,
          status: fetchResponse.status,
          headers: responseHeaders,
          duration,
        };

        // Apply response interceptors
        for (const interceptor of responseInterceptors) {
          response = (await interceptor(response as ApiResponse)) as ApiResponse<T>;
        }

        return response;
      } catch (err) {
        clearTimeout(timeoutId);

        // Already-normalized ApiError — rethrow as-is
        if (typeof err === "object" && err !== null && "code" in err && "retryable" in err) {
          const apiErr = err as ApiError;
          if (!apiErr.retryable || attempt >= retries) throw apiErr;
          lastError = apiErr;
          continue;
        }

        lastError = normalizeError(err);
        if (!lastError.retryable || attempt >= retries) {
          recordFailure(circuit);
          throw lastError;
        }
        recordFailure(circuit);
      }
    }

    throw lastError ?? normalizeError(new Error("Request failed after retries"));
  }

  return {
    execute,
    getCircuitState: () => circuit.state,
    resetCircuit: () => {
      circuit.state = "closed";
      circuit.failures = 0;
    },
  };
}
