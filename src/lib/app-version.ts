/**
 * IMS Gen 2 — Application Versioning
 *
 * Provides build-time version info, stale client detection, and
 * an API client interceptor that sends X-App-Version with every request.
 *
 * Build-time globals (__APP_VERSION__, __APP_BUILD_SHA__, __APP_BUILD_TIME__)
 * are injected by vite.config.ts `define` block.
 *
 * @see Story #232 — Application versioning strategy
 */

// =============================================================================
// Types
// =============================================================================

export interface AppBuildInfo {
  /** Semver from package.json (e.g., "0.1.0") */
  version: string;
  /** Git short SHA (e.g., "abc1234") or "local" */
  sha: string;
  /** ISO timestamp of the build */
  buildTime: string;
  /** Combined version string (e.g., "0.1.0+abc1234") */
  full: string;
}

export interface StaleClientConfig {
  /** Header name the server uses to report the deployed version */
  deployedVersionHeader: string;
  /** Called when a newer version is detected */
  onStaleDetected: (running: string, deployed: string) => void;
}

// =============================================================================
// Build Info (populated at build time via Vite define)
// =============================================================================

const version = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "0.0.0";
const sha = typeof __APP_BUILD_SHA__ !== "undefined" ? __APP_BUILD_SHA__ : "dev";
const buildTime =
  typeof __APP_BUILD_TIME__ !== "undefined" ? __APP_BUILD_TIME__ : new Date().toISOString();

export const APP_BUILD_INFO: AppBuildInfo = {
  version,
  sha,
  buildTime,
  full: `${version}+${sha}`,
};

// =============================================================================
// Display Helpers
// =============================================================================

/** Short display string for UI footer (e.g., "v0.1.0 (abc1234)") */
export function getVersionDisplay(): string {
  return `v${APP_BUILD_INFO.version} (${APP_BUILD_INFO.sha})`;
}

/** Full display for settings/about (e.g., "v0.1.0+abc1234 — Built 2026-04-02T10:30:00Z") */
export function getVersionFull(): string {
  const date = new Date(APP_BUILD_INFO.buildTime);
  const formatted = date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `v${APP_BUILD_INFO.full} — Built ${formatted}`;
}

// =============================================================================
// Semver Utilities
// =============================================================================

interface SemverParts {
  major: number;
  minor: number;
  patch: number;
}

export function parseSemver(ver: string): SemverParts | null {
  // Strip leading "v" and anything after "+" (build metadata)
  const clean = ver.replace(/^v/, "").split("+")[0] ?? "";
  const match = clean.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) };
}

/** Check if running version is compatible with deployed version (same major). */
export function isCompatible(running: string, deployed: string): boolean {
  const r = parseSemver(running);
  const d = parseSemver(deployed);
  if (!r || !d) return true; // Can't parse — assume compatible
  return r.major === d.major;
}

/** Check if deployed version is newer than running version. */
export function isNewer(running: string, deployed: string): boolean {
  const r = parseSemver(running);
  const d = parseSemver(deployed);
  if (!r || !d) return false;
  if (d.major > r.major) return true;
  if (d.major === r.major && d.minor > r.minor) return true;
  if (d.major === r.major && d.minor === r.minor && d.patch > r.patch) return true;
  return false;
}

// =============================================================================
// Stale Client Detection
// =============================================================================

const DEFAULT_DEPLOYED_VERSION_HEADER = "x-deployed-version";

let staleNotified = false;

export function createStaleClientDetector(config?: Partial<StaleClientConfig>) {
  const header = config?.deployedVersionHeader ?? DEFAULT_DEPLOYED_VERSION_HEADER;
  const onStale = config?.onStaleDetected;

  return {
    /** Check response headers for a newer deployed version. */
    checkResponse(responseHeaders: Record<string, string>): void {
      if (staleNotified) return; // Only notify once per session

      const deployed = responseHeaders[header] ?? responseHeaders[header.toLowerCase()];
      if (!deployed) return;

      if (isNewer(APP_BUILD_INFO.version, deployed)) {
        staleNotified = true;
        onStale?.(APP_BUILD_INFO.version, deployed);
      }
    },

    /** Reset notification state (e.g., after user dismisses or refreshes). */
    reset(): void {
      staleNotified = false;
    },
  };
}

// =============================================================================
// API Client Interceptor
// =============================================================================

/**
 * Request interceptor that adds X-App-Version header to every API call.
 * Plug into createApiClient({ requestInterceptors: [appVersionInterceptor] }).
 */
export function createAppVersionInterceptor() {
  return (request: {
    url: string;
    headers?: Record<string, string>;
  }): { url: string; headers: Record<string, string> } => ({
    ...request,
    headers: {
      ...request.headers,
      "X-App-Version": APP_BUILD_INFO.full,
    },
  });
}
