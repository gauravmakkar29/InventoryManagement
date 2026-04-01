/**
 * IMS Gen 2 — API Versioning Strategy
 *
 * Supports two versioning modes (configured per provider):
 * - Header-based: sends X-API-Version header with every request
 * - Path-based: prefixes URL with /v1/, /v2/, etc.
 *
 * Includes version mismatch detection — if the server responds with a
 * different version than expected, a warning is surfaced.
 *
 * @see ADR-006 for the rationale behind this design.
 * @see Story #182 — API versioning strategy
 */

// =============================================================================
// Types
// =============================================================================

export type VersioningMode = "header" | "path";

export interface ApiVersionConfig {
  /** Current client API version (default: "1") */
  version: string;
  /** Versioning mode: "header" sends X-API-Version, "path" prefixes /v{N}/ */
  mode: VersioningMode;
  /** Header name for server-reported version in responses (default: "X-API-Version") */
  versionHeader: string;
  /** Called when server version doesn't match client version */
  onVersionMismatch?: (clientVersion: string, serverVersion: string) => void;
}

export interface VersionedRequest {
  url: string;
  headers: Record<string, string>;
}

// =============================================================================
// Defaults
// =============================================================================

const DEFAULT_CONFIG: ApiVersionConfig = {
  version: "1",
  mode: "header",
  versionHeader: "X-API-Version",
};

// =============================================================================
// API Version Manager
// =============================================================================

export interface IApiVersionManager {
  /** Apply versioning to a request (add header or rewrite URL). */
  applyVersion(url: string, headers?: Record<string, string>): VersionedRequest;
  /** Check response headers for version mismatch. */
  checkResponseVersion(responseHeaders: Record<string, string>): void;
  /** Get current client version. */
  getVersion(): string;
  /** Whether a deprecation warning has been detected. */
  isDeprecated(): boolean;
}

export function createApiVersionManager(config?: Partial<ApiVersionConfig>): IApiVersionManager {
  const resolved: ApiVersionConfig = { ...DEFAULT_CONFIG, ...config };
  let deprecated = false;

  return {
    applyVersion(url: string, headers: Record<string, string> = {}): VersionedRequest {
      if (resolved.mode === "header") {
        return {
          url,
          headers: { ...headers, [resolved.versionHeader]: resolved.version },
        };
      }

      // Path-based: prefix /v{N}/ if not already present
      const versionPrefix = `/v${resolved.version}`;
      const prefixedUrl = url.startsWith(versionPrefix) ? url : `${versionPrefix}${url}`;
      return { url: prefixedUrl, headers };
    },

    checkResponseVersion(responseHeaders: Record<string, string>): void {
      const serverVersion =
        responseHeaders[resolved.versionHeader.toLowerCase()] ??
        responseHeaders[resolved.versionHeader];
      if (!serverVersion) return;

      if (serverVersion !== resolved.version) {
        deprecated = true;
        resolved.onVersionMismatch?.(resolved.version, serverVersion);
      }
    },

    getVersion(): string {
      return resolved.version;
    },

    isDeprecated(): boolean {
      return deprecated;
    },
  };
}

/**
 * Request interceptor factory — plugs into createApiClient().
 * Adds version headers/path to every outgoing request.
 */
export function createVersionInterceptor(manager: IApiVersionManager) {
  return (request: { url: string; headers?: Record<string, string> }) => {
    const versioned = manager.applyVersion(request.url, request.headers);
    return { ...request, url: versioned.url, headers: versioned.headers };
  };
}

/**
 * Response interceptor factory — checks server version on every response.
 */
export function createVersionCheckInterceptor(manager: IApiVersionManager) {
  return (response: { headers: Record<string, string> }) => {
    manager.checkResponseVersion(response.headers);
    return response;
  };
}
