/**
 * Sungrow Ignite adapter — stub implementation.
 * Full implementation pending Ignite access (coordinating via Sohil/Hudson).
 *
 * All methods call the configured Lambda endpoint. Response parsing and
 * error handling follow the IMS provider conventions. Each method includes
 * a TODO for final validation once Ignite API access is granted.
 */
import type {
  IComplianceScannerProvider,
  ScannerProviderConfig,
  ScanRequest,
  ScanStatus,
  ScanReport,
  ScanVulnerability,
  ComplianceScore,
} from "../types";

// =============================================================================
// Helpers
// =============================================================================

async function igniteFetch<T>(
  config: ScannerProviderConfig,
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${config.lambdaEndpoint}${path}`;
  const timeout = config.timeout ?? 30_000;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "Unknown error");
      throw new Error(
        `Ignite scanner request failed: ${response.status} ${response.statusText} — ${body}`,
      );
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

// =============================================================================
// Factory
// =============================================================================

/**
 * Creates an Ignite compliance scanner provider that delegates to the
 * Sungrow Ignite vulnerability scanning service via a Lambda proxy.
 *
 * @param config - Provider configuration with Lambda endpoint URL
 * @returns IComplianceScannerProvider backed by the Ignite service
 *
 * @example
 * ```ts
 * const scanner = createIgniteScannerProvider({
 *   lambdaEndpoint: "https://xyz.execute-api.us-east-1.amazonaws.com/prod",
 *   pollIntervalMs: 5000,
 *   timeout: 30000,
 * });
 * ```
 */
export function createIgniteScannerProvider(
  config: ScannerProviderConfig,
): IComplianceScannerProvider {
  return {
    /**
     * Submit a scan request to the Ignite service.
     *
     * @example
     * ```ts
     * const status = await scanner.submitScan({ artifactId: "fw-001", artifactVersion: "2.1.0" });
     * ```
     */
    // TODO: Validate against Ignite API response schema when access is granted
    async submitScan(request: ScanRequest): Promise<ScanStatus> {
      return igniteFetch<ScanStatus>(config, "/scan", {
        method: "POST",
        body: JSON.stringify(request),
      });
    },

    /**
     * Poll scan status from the Ignite service.
     *
     * @example
     * ```ts
     * const status = await scanner.getScanStatus("scan-abc123");
     * ```
     */
    // TODO: Validate against Ignite API response schema when access is granted
    async getScanStatus(scanId: string): Promise<ScanStatus> {
      return igniteFetch<ScanStatus>(config, `/status/${scanId}`);
    },

    /**
     * Retrieve a completed scan report from the Ignite service.
     *
     * @example
     * ```ts
     * const report = await scanner.getScanReport("scan-abc123");
     * ```
     */
    // TODO: Validate against Ignite API response schema when access is granted
    async getScanReport(scanId: string): Promise<ScanReport | null> {
      try {
        return await igniteFetch<ScanReport>(config, `/report/${scanId}`);
      } catch (error) {
        // 404 means report not yet available
        if (error instanceof Error && error.message.includes("404")) {
          return null;
        }
        throw error;
      }
    },

    /**
     * List vulnerabilities for an artifact from the Ignite service.
     *
     * @example
     * ```ts
     * const vulns = await scanner.listVulnerabilities("fw-001", "critical");
     * ```
     */
    // TODO: Validate against Ignite API response schema when access is granted
    async listVulnerabilities(
      artifactId: string,
      severity?: ScanVulnerability["severity"],
    ): Promise<ScanVulnerability[]> {
      const params = new URLSearchParams({ artifactId });
      if (severity) {
        params.set("severity", severity);
      }
      return igniteFetch<ScanVulnerability[]>(config, `/vulnerabilities?${params.toString()}`);
    },

    /**
     * Upload an external compliance report to the Ignite service.
     *
     * @example
     * ```ts
     * const report = await scanner.uploadReport("fw-001", file);
     * ```
     */
    // TODO: Validate against Ignite API response schema when access is granted
    async uploadReport(artifactId: string, report: File | Blob): Promise<ScanReport> {
      const formData = new FormData();
      formData.append("artifactId", artifactId);
      formData.append("file", report);

      const url = `${config.lambdaEndpoint}/report/upload`;
      const timeout = config.timeout ?? 30_000;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });

        if (!response.ok) {
          const body = await response.text().catch(() => "Unknown error");
          throw new Error(
            `Ignite report upload failed: ${response.status} ${response.statusText} — ${body}`,
          );
        }

        return (await response.json()) as ScanReport;
      } finally {
        clearTimeout(timer);
      }
    },

    /**
     * Get the compliance score for an artifact from the Ignite service.
     *
     * @example
     * ```ts
     * const score = await scanner.getComplianceScore("fw-001");
     * ```
     */
    // TODO: Validate against Ignite API response schema when access is granted
    async getComplianceScore(artifactId: string): Promise<ComplianceScore> {
      return igniteFetch<ComplianceScore>(config, `/score/${artifactId}`);
    },

    /**
     * List scan history for an artifact from the Ignite service.
     *
     * @example
     * ```ts
     * const history = await scanner.listScanHistory("fw-001");
     * ```
     */
    // TODO: Validate against Ignite API response schema when access is granted
    async listScanHistory(artifactId: string): Promise<ScanStatus[]> {
      return igniteFetch<ScanStatus[]>(config, `/history/${artifactId}`);
    },
  };
}
