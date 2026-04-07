import type {
  IComplianceScannerProvider,
  ScanRequest,
  ScanStatus,
  ScanReport,
  ScanVulnerability,
  ComplianceScore,
} from "../types";

// =============================================================================
// Mock data
// =============================================================================

const MOCK_VULNERABILITIES: ScanVulnerability[] = [
  {
    id: "vuln-001",
    cveId: "CVE-2025-31024",
    title: "Buffer overflow in TLS handshake parser",
    severity: "critical",
    cvssScore: 9.8,
    description:
      "A stack-based buffer overflow in the TLS 1.3 handshake parser allows remote attackers to execute arbitrary code via a crafted ClientHello message.",
    remediation: "Upgrade openssl to >= 3.2.1 or apply vendor patch TLSFIX-2025-03.",
    affectedComponent: "openssl@3.1.4",
    detectedAt: "2025-11-15T08:30:00Z",
  },
  {
    id: "vuln-002",
    cveId: "CVE-2025-28819",
    title: "Privilege escalation via firmware update service",
    severity: "high",
    cvssScore: 8.1,
    description:
      "The firmware update service does not validate the signing certificate chain, allowing a local attacker to inject a malicious firmware image.",
    remediation: "Enable strict certificate chain validation in update-agent.conf.",
    affectedComponent: "ims-update-agent@1.4.2",
    detectedAt: "2025-11-15T08:31:00Z",
  },
  {
    id: "vuln-003",
    cveId: "CVE-2025-22147",
    title: "Information disclosure in device telemetry API",
    severity: "medium",
    cvssScore: 5.3,
    description:
      "The /api/telemetry endpoint returns internal device identifiers in error responses, which may aid further attacks.",
    remediation: "Sanitize error payloads in telemetry-api middleware.",
    affectedComponent: "ims-telemetry-api@2.0.1",
    detectedAt: "2025-11-15T08:32:00Z",
  },
  {
    id: "vuln-004",
    cveId: "CVE-2025-19503",
    title: "Weak cryptographic algorithm in config encryption",
    severity: "low",
    cvssScore: 3.1,
    description:
      "Device configuration files are encrypted with DES, which is considered cryptographically weak.",
    remediation: "Migrate configuration encryption to AES-256-GCM.",
    affectedComponent: "ims-config-manager@1.2.0",
    detectedAt: "2025-11-15T08:33:00Z",
  },
  {
    id: "vuln-005",
    cveId: "CVE-2025-17290",
    title: "Outdated dependency with known information leak",
    severity: "info",
    cvssScore: 0.0,
    description:
      "The bundled logging library has a known informational CVE with no practical exploit path in this deployment context.",
    remediation: "Upgrade pino to >= 8.17.0 when convenient.",
    affectedComponent: "pino@8.15.0",
    detectedAt: "2025-11-15T08:34:00Z",
  },
];

// =============================================================================
// Internal state
// =============================================================================

interface InternalScanState {
  status: ScanStatus;
  createdAt: number;
  artifactVersion: string;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let scanCounter = 0;

function generateScanId(): string {
  scanCounter += 1;
  return `mock-scan-${Date.now()}-${scanCounter}`;
}

function calculateScore(vulns: ScanVulnerability[]): ComplianceScore {
  const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  for (const v of vulns) {
    counts[v.severity] += 1;
  }

  // Deduct points by severity weight, floor at 0
  const overall = Math.max(
    0,
    100 -
      counts.critical * 25 -
      counts.high * 15 -
      counts.medium * 5 -
      counts.low * 2 -
      counts.info * 0,
  );

  return { overall, ...counts };
}

/**
 * Resolve the lifecycle status of a scan based on elapsed time.
 * - 0–2 s  → submitted (0 %)
 * - 2–4 s  → scanning  (50 %)
 * - 4 s+   → completed (100 %)
 */
function resolveStatus(state: InternalScanState): ScanStatus {
  const elapsed = Date.now() - state.createdAt;

  if (elapsed < 2_000) {
    return { ...state.status, status: "submitted", progress: 0 };
  }
  if (elapsed < 4_000) {
    return { ...state.status, status: "scanning", progress: 50 };
  }
  return {
    ...state.status,
    status: "completed",
    progress: 100,
    completedAt: new Date(state.createdAt + 4_000).toISOString(),
  };
}

// =============================================================================
// Factory
// =============================================================================

/**
 * Creates a mock compliance scanner provider for local development and tests.
 *
 * Simulates an async scan lifecycle:
 *  - `submitScan` returns status "submitted"
 *  - After ~2 s the scan transitions to "scanning"
 *  - After ~4 s the scan transitions to "completed"
 *
 * @returns IComplianceScannerProvider backed by in-memory state
 *
 * @example
 * ```ts
 * const scanner = createMockScannerProvider();
 * const status = await scanner.submitScan({ artifactId: "fw-001", artifactVersion: "2.1.0" });
 * ```
 */
export function createMockScannerProvider(): IComplianceScannerProvider {
  const scans = new Map<string, InternalScanState>();
  const artifactScans = new Map<string, string[]>();

  return {
    /**
     * Submit a new mock scan. Returns immediately with status "submitted".
     *
     * @example
     * ```ts
     * const s = await scanner.submitScan({ artifactId: "fw-001", artifactVersion: "2.0.0" });
     * ```
     */
    async submitScan(request: ScanRequest): Promise<ScanStatus> {
      await delay(150); // simulate network latency

      const scanId = generateScanId();
      const now = new Date().toISOString();

      const status: ScanStatus = {
        scanId,
        artifactId: request.artifactId,
        status: "submitted",
        startedAt: now,
        completedAt: null,
        progress: 0,
      };

      const state: InternalScanState = {
        status,
        createdAt: Date.now(),
        artifactVersion: request.artifactVersion,
      };

      scans.set(scanId, state);

      const existing = artifactScans.get(request.artifactId) ?? [];
      existing.push(scanId);
      artifactScans.set(request.artifactId, existing);

      return { ...status };
    },

    /**
     * Get current status of a mock scan. Status progresses with wall-clock time.
     *
     * @example
     * ```ts
     * const s = await scanner.getScanStatus("mock-scan-123");
     * ```
     */
    async getScanStatus(scanId: string): Promise<ScanStatus> {
      await delay(100);

      const state = scans.get(scanId);
      if (!state) {
        throw new Error(`Scan not found: ${scanId}`);
      }

      return resolveStatus(state);
    },

    /**
     * Get the scan report. Returns null if the scan has not yet completed.
     *
     * @example
     * ```ts
     * const report = await scanner.getScanReport("mock-scan-123");
     * ```
     */
    async getScanReport(scanId: string): Promise<ScanReport | null> {
      await delay(100);

      const state = scans.get(scanId);
      if (!state) {
        throw new Error(`Scan not found: ${scanId}`);
      }

      const current = resolveStatus(state);
      if (current.status !== "completed") {
        return null;
      }

      const vulns = MOCK_VULNERABILITIES;
      const score = calculateScore(vulns);
      const hasCritical = vulns.some((v) => v.severity === "critical");

      return {
        id: `report-${scanId}`,
        scanId,
        artifactId: state.status.artifactId,
        status: hasCritical ? "fail" : "pass",
        vulnerabilities: vulns,
        score,
        generatedAt: current.completedAt ?? new Date().toISOString(),
        scanner: "mock-scanner",
      };
    },

    /**
     * List mock vulnerabilities for an artifact, optionally filtered by severity.
     *
     * @example
     * ```ts
     * const highs = await scanner.listVulnerabilities("fw-001", "high");
     * ```
     */
    async listVulnerabilities(
      _artifactId: string,
      severity?: ScanVulnerability["severity"],
    ): Promise<ScanVulnerability[]> {
      await delay(100);

      if (severity) {
        return MOCK_VULNERABILITIES.filter((v) => v.severity === severity);
      }
      return [...MOCK_VULNERABILITIES];
    },

    /**
     * Simulate uploading an external report. Returns a generated report.
     *
     * @example
     * ```ts
     * const report = await scanner.uploadReport("fw-001", file);
     * ```
     */
    async uploadReport(artifactId: string, _report: File | Blob): Promise<ScanReport> {
      await delay(300);

      const score = calculateScore(MOCK_VULNERABILITIES);

      return {
        id: `report-upload-${Date.now()}`,
        scanId: `upload-${Date.now()}`,
        artifactId,
        status: "pass",
        vulnerabilities: [],
        score,
        generatedAt: new Date().toISOString(),
        scanner: "external-upload",
      };
    },

    /**
     * Get the compliance score for an artifact based on known vulnerabilities.
     *
     * @example
     * ```ts
     * const score = await scanner.getComplianceScore("fw-001");
     * ```
     */
    async getComplianceScore(_artifactId: string): Promise<ComplianceScore> {
      await delay(100);
      return calculateScore(MOCK_VULNERABILITIES);
    },

    /**
     * List all scan history for an artifact, most recent first.
     *
     * @example
     * ```ts
     * const history = await scanner.listScanHistory("fw-001");
     * ```
     */
    async listScanHistory(artifactId: string): Promise<ScanStatus[]> {
      await delay(100);

      const scanIds = artifactScans.get(artifactId) ?? [];
      const results: ScanStatus[] = [];

      for (const id of scanIds) {
        const state = scans.get(id);
        if (state) {
          results.push(resolveStatus(state));
        }
      }

      // Most recent first
      return results.reverse();
    },
  };
}
