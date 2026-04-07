/**
 * Route 53 DNS adapter — generates Terraform-compatible config for AWS Route 53.
 * Template fallback for AWS-native deployments where the client manages DNS in Route 53
 * rather than an external provider like Azure DNS.
 *
 * This adapter does NOT call AWS API directly from the browser.
 * It produces aws_route53_record-compatible resource configs that are
 * submitted to the infra provisioning pipeline.
 *
 * Per-environment subdomain support:
 * - aegis-dev.{domain} (development)
 * - aegis-qa.{domain}  (QA / staging)
 * - aegis.{domain}     (production)
 */
import type {
  IDNSProvider,
  DNSRecord,
  DNSRecordType,
  DNSProviderConfig,
  CertValidationResult,
  PropagationStatus,
} from "../types";

/** Terraform resource shape for aws_route53_record */
interface Route53ResourceConfig {
  resource_type: "aws_route53_record";
  zone_id: string;
  name: string;
  type: DNSRecordType;
  ttl: number;
  records: string[];
  tags: Record<string, string>;
}

function buildRoute53ResourceConfig(
  record: DNSRecord,
  config: DNSProviderConfig,
): Route53ResourceConfig {
  return {
    resource_type: "aws_route53_record",
    zone_id: config.hostedZoneId ?? "PLACEHOLDER_ZONE_ID",
    name: record.name,
    type: record.type,
    ttl: record.ttl,
    records: [record.value],
    tags: {
      managed_by: "ims-gen2",
      provider: "route53",
      region: config.region ?? "us-east-1",
    },
  };
}

/**
 * Creates a Route 53 DNS provider that generates Terraform-compatible resource configs.
 *
 * @example
 * ```ts
 * const dns = createRoute53DNSProvider({
 *   provider: "route53",
 *   domain: "example.com",
 *   hostedZoneId: "Z1234567890",
 *   region: "us-east-1",
 * });
 * const record = await dns.createRecord({
 *   type: "CNAME",
 *   name: "aegis.example.com",
 *   value: "d1234abcde.cloudfront.net",
 *   ttl: 300,
 * });
 * ```
 */
export function createRoute53DNSProvider(config: DNSProviderConfig): IDNSProvider {
  const pendingConfigs = new Map<string, Route53ResourceConfig>();

  function recordKey(name: string, type: DNSRecordType): string {
    return `${name}:${type}`;
  }

  return {
    async createRecord(record: DNSRecord): Promise<DNSRecord> {
      const resourceConfig = buildRoute53ResourceConfig(record, config);
      const key = recordKey(record.name, record.type);
      pendingConfigs.set(key, resourceConfig);

      // TODO: POST to infra provisioning Lambda when available
      // await infraApi.submitResourceConfig(resourceConfig);

      return { ...record, status: "pending" };
    },

    async updateRecord(name: string, partial: Partial<DNSRecord>): Promise<DNSRecord> {
      const existing = [...pendingConfigs.entries()].find(([, cfg]) => cfg.name === name);
      if (!existing) {
        throw new Error(`Route 53 DNS record not found: ${name}`);
      }

      const [key, cfg] = existing;
      const updated: DNSRecord = {
        type: partial.type ?? cfg.type,
        name,
        value: partial.value ?? cfg.records[0] ?? "",
        ttl: partial.ttl ?? cfg.ttl,
        status: "pending",
      };

      const updatedConfig = buildRoute53ResourceConfig(updated, config);
      pendingConfigs.set(key, updatedConfig);

      // TODO: POST to infra provisioning Lambda when available

      return updated;
    },

    async deleteRecord(name: string, type: DNSRecordType): Promise<void> {
      const key = recordKey(name, type);
      if (!pendingConfigs.has(key)) {
        throw new Error(`Route 53 DNS record not found: ${key}`);
      }
      pendingConfigs.delete(key);

      // TODO: POST to infra provisioning Lambda when available
    },

    async getRecord(name: string, type: DNSRecordType): Promise<DNSRecord | null> {
      const cfg = pendingConfigs.get(recordKey(name, type));
      if (!cfg) return null;

      return {
        type: cfg.type,
        name: cfg.name,
        value: cfg.records[0] ?? "",
        ttl: cfg.ttl,
        status: "pending",
      };
    },

    async listRecords(): Promise<DNSRecord[]> {
      return [...pendingConfigs.values()].map((cfg) => ({
        type: cfg.type,
        name: cfg.name,
        value: cfg.records[0] ?? "",
        ttl: cfg.ttl,
        status: "pending" as const,
      }));
    },

    async validateCertificate(domain: string): Promise<CertValidationResult> {
      const validationRecord: DNSRecord = {
        type: "TXT",
        name: `_acme-challenge.${domain}`,
        value: `route53-acm-validation-pending`,
        ttl: 60,
        status: "pending",
      };

      const resourceConfig = buildRoute53ResourceConfig(validationRecord, config);
      pendingConfigs.set(recordKey(validationRecord.name, validationRecord.type), resourceConfig);

      // TODO: POST to infra provisioning Lambda when available

      return {
        domain,
        status: "pending",
        validationRecord,
      };
    },

    async checkPropagation(_name: string): Promise<PropagationStatus> {
      // TODO: POST to infra provisioning Lambda when available
      // Route 53 propagation must be checked server-side via AWS SDK
      return "pending";
    },
  };
}
