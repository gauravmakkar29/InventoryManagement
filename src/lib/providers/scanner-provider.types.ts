// Platform Config
// =============================================================================

// =============================================================================
// Compliance Scanner Provider
// =============================================================================

/** Request payload for initiating a compliance scan. */
export interface ScanRequest {
  artifactId: string;
  artifactVersion: string;
  scanType?: "full" | "quick" | "dependency-only";
}

/** Possible states of a compliance scan lifecycle. */
export type ScanStatusValue = "submitted" | "scanning" | "completed" | "failed";

/** Status snapshot of a running or completed scan. */
export interface ScanStatus {
  scanId: string;
  artifactId: string;
  status: ScanStatusValue;
  startedAt: string;
  completedAt: string | null;
  progress: number;
}

/** A single vulnerability detected by a scanner. */
export interface ScanVulnerability {
  id: string;
  cveId: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  cvssScore: number;
  description: string;
  remediation: string;
  affectedComponent: string;
  detectedAt: string;
}

/** Aggregated scan report with vulnerabilities and compliance score. */
export interface ScanReport {
  id: string;
  scanId: string;
  artifactId: string;
  status: "pass" | "fail" | "pending";
  vulnerabilities: ScanVulnerability[];
  score: ComplianceScore;
  generatedAt: string;
  scanner: string;
}

/** Numeric breakdown of vulnerability counts by severity. */
export interface ComplianceScore {
  overall: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
}

/** Configuration for compliance scanner provider adapters. */
export interface ScannerProviderConfig {
  readonly lambdaEndpoint: string;
  readonly pollIntervalMs?: number;
  readonly timeout?: number;
}

/**
 * Compliance scanner provider interface — abstracts vulnerability scanning.
 *
 * Adapters handle vendor-specific logic (Ignite, Qualys, Tenable, Snyk).
 * The app consumes this interface without knowing which scanner is behind it.
 */
export interface IComplianceScannerProvider {
  /**
   * Submit a new compliance scan for the given artifact.
   *
   * @param request - Scan request containing artifact ID, version, and scan type
   * @returns Initial scan status with a unique scanId for tracking
   *
   * @example
   * ```ts
   * const status = await scanner.submitScan({
   *   artifactId: "fw-001",
   *   artifactVersion: "2.1.0",
   *   scanType: "full",
   * });
   * console.log(status.scanId); // "scan-abc123"
   * ```
   */
  submitScan(request: ScanRequest): Promise<ScanStatus>;

  /**
   * Poll the current status of a previously submitted scan.
   *
   * @param scanId - Unique scan identifier returned by submitScan
   * @returns Current scan status including progress percentage
   *
   * @example
   * ```ts
   * const status = await scanner.getScanStatus("scan-abc123");
   * if (status.status === "completed") { ... }
   * ```
   */
  getScanStatus(scanId: string): Promise<ScanStatus>;

  /**
   * Retrieve the full scan report once a scan has completed.
   *
   * @param scanId - Unique scan identifier
   * @returns Scan report with vulnerabilities and score, or null if not yet available
   *
   * @example
   * ```ts
   * const report = await scanner.getScanReport("scan-abc123");
   * if (report) console.log(report.score.overall);
   * ```
   */
  getScanReport(scanId: string): Promise<ScanReport | null>;

  /**
   * List vulnerabilities for a specific artifact, optionally filtered by severity.
   *
   * @param artifactId - The artifact to query vulnerabilities for
   * @param severity - Optional severity filter
   * @returns Array of vulnerabilities matching the criteria
   *
   * @example
   * ```ts
   * const criticals = await scanner.listVulnerabilities("fw-001", "critical");
   * ```
   */
  listVulnerabilities(
    artifactId: string,
    severity?: ScanVulnerability["severity"],
  ): Promise<ScanVulnerability[]>;

  /**
   * Upload an externally generated compliance report for an artifact.
   *
   * @param artifactId - The artifact this report belongs to
   * @param report - Report file (PDF, JSON, etc.)
   * @returns Parsed scan report
   *
   * @example
   * ```ts
   * const file = new File([json], "report.json", { type: "application/json" });
   * const report = await scanner.uploadReport("fw-001", file);
   * ```
   */
  uploadReport(artifactId: string, report: File | Blob): Promise<ScanReport>;

  /**
   * Get the current compliance score for an artifact.
   *
   * @param artifactId - The artifact to score
   * @returns Compliance score breakdown by severity
   *
   * @example
   * ```ts
   * const score = await scanner.getComplianceScore("fw-001");
   * console.log(`Overall: ${score.overall}/100`);
   * ```
   */
  getComplianceScore(artifactId: string): Promise<ComplianceScore>;

  /**
   * List all historical scans for an artifact, most recent first.
   *
   * @param artifactId - The artifact to query scan history for
   * @returns Array of scan status records
   *
   * @example
   * ```ts
   * const history = await scanner.listScanHistory("fw-001");
   * ```
   */
  listScanHistory(artifactId: string): Promise<ScanStatus[]>;
}
