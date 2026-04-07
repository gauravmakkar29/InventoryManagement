// Platform Config
// =============================================================================

// =============================================================================
// DNS Provider
// =============================================================================

export type DNSRecordType = "CNAME" | "A" | "AAAA" | "TXT";

export interface DNSRecord {
  type: DNSRecordType;
  name: string;
  value: string;
  ttl: number;
  status?: "active" | "pending" | "failed";
}

export interface DNSProviderConfig {
  readonly provider: "azure" | "route53" | "mock";
  readonly domain: string;
  readonly hostedZoneId?: string;
  readonly region?: string;
}

export interface CertValidationResult {
  domain: string;
  status: "pending" | "validated" | "failed";
  validationRecord: DNSRecord;
}

export type PropagationStatus = "pending" | "propagated" | "failed";

/**
 * DNS provider interface — abstracts DNS record management.
 *
 * Adapters handle vendor-specific logic (Azure DNS, Route 53, Cloudflare, GCP Cloud DNS).
 * Used for domain routing (Azure DNS CNAME → CloudFront) and ACM certificate validation.
 *
 * **Context:** Sungrow uses Azure DNS for sungrow.com. Route 53 is the template fallback.
 */
export interface IDNSProvider {
  /**
   * Create a new DNS record in the managed zone.
   *
   * @example
   * ```ts
   * const record = await dns.createRecord({
   *   type: "CNAME",
   *   name: "aegis.sungrow.com",
   *   value: "d1234.cloudfront.net",
   *   ttl: 300,
   * });
   * ```
   */
  createRecord(record: DNSRecord): Promise<DNSRecord>;

  /**
   * Update an existing DNS record by name.
   *
   * @example
   * ```ts
   * const updated = await dns.updateRecord("aegis.sungrow.com", { ttl: 600 });
   * ```
   */
  updateRecord(name: string, record: Partial<DNSRecord>): Promise<DNSRecord>;

  /**
   * Delete a DNS record by name and type.
   *
   * @example
   * ```ts
   * await dns.deleteRecord("aegis.sungrow.com", "CNAME");
   * ```
   */
  deleteRecord(name: string, type: DNSRecordType): Promise<void>;

  /**
   * Retrieve a single DNS record by name and type, or null if not found.
   *
   * @example
   * ```ts
   * const record = await dns.getRecord("aegis.sungrow.com", "CNAME");
   * ```
   */
  getRecord(name: string, type: DNSRecordType): Promise<DNSRecord | null>;

  /**
   * List all DNS records in the managed zone.
   *
   * @example
   * ```ts
   * const records = await dns.listRecords();
   * ```
   */
  listRecords(): Promise<DNSRecord[]>;

  /**
   * Validate a certificate for the given domain by creating a DNS challenge record.
   *
   * @example
   * ```ts
   * const result = await dns.validateCertificate("aegis.sungrow.com");
   * // result.validationRecord contains the TXT record for ACM validation
   * ```
   */
  validateCertificate(domain: string): Promise<CertValidationResult>;

  /**
   * Check DNS propagation status for a record.
   *
   * @example
   * ```ts
   * const status = await dns.checkPropagation("aegis.sungrow.com");
   * // "pending" | "propagated" | "failed"
   * ```
   */
  checkPropagation(name: string): Promise<PropagationStatus>;
}
