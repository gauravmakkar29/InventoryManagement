/**
 * Azure DNS adapter — generates Terraform-compatible config for Azure DNS zone management.
 * Used when client owns the domain on Azure (e.g., sungrow.com).
 *
 * This adapter does NOT call Azure API directly from the browser.
 * It produces azurerm_dns_cname_record-compatible resource configs that are
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

/** Terraform resource shape for azurerm_dns_cname_record */
interface AzureDNSResourceConfig {
  resource_type: string;
  zone_name: string;
  record_name: string;
  record_value: string;
  ttl: number;
  tags: Record<string, string>;
}

function buildAzureResourceConfig(
  record: DNSRecord,
  config: DNSProviderConfig,
): AzureDNSResourceConfig {
  const typeMap: Record<DNSRecordType, string> = {
    CNAME: "azurerm_dns_cname_record",
    A: "azurerm_dns_a_record",
    AAAA: "azurerm_dns_aaaa_record",
    TXT: "azurerm_dns_txt_record",
  };

  return {
    resource_type: typeMap[record.type],
    zone_name: config.domain,
    record_name: record.name,
    record_value: record.value,
    ttl: record.ttl,
    tags: {
      managed_by: "ims-gen2",
      provider: "azure-dns",
    },
  };
}

/**
 * Creates an Azure DNS provider that generates Terraform-compatible resource configs.
 *
 * @example
 * ```ts
 * const dns = createAzureDNSProvider({ provider: "azure", domain: "sungrow.com" });
 * const record = await dns.createRecord({
 *   type: "CNAME",
 *   name: "aegis.sungrow.com",
 *   value: "d1234abcde.cloudfront.net",
 *   ttl: 300,
 * });
 * ```
 */
export function createAzureDNSProvider(config: DNSProviderConfig): IDNSProvider {
  const pendingConfigs = new Map<string, AzureDNSResourceConfig>();

  function recordKey(name: string, type: DNSRecordType): string {
    return `${name}:${type}`;
  }

  return {
    async createRecord(record: DNSRecord): Promise<DNSRecord> {
      const resourceConfig = buildAzureResourceConfig(record, config);
      const key = recordKey(record.name, record.type);
      pendingConfigs.set(key, resourceConfig);

      // TODO: POST to infra provisioning Lambda when available
      // await infraApi.submitResourceConfig(resourceConfig);

      return { ...record, status: "pending" };
    },

    async updateRecord(name: string, partial: Partial<DNSRecord>): Promise<DNSRecord> {
      const existing = [...pendingConfigs.entries()].find(([, cfg]) => cfg.record_name === name);
      if (!existing) {
        throw new Error(`Azure DNS record not found: ${name}`);
      }

      const [key, cfg] = existing;
      const updated: DNSRecord = {
        type: (partial.type as DNSRecordType) ?? (key.split(":")[1] as DNSRecordType),
        name,
        value: partial.value ?? cfg.record_value,
        ttl: partial.ttl ?? cfg.ttl,
        status: "pending",
      };

      const updatedConfig = buildAzureResourceConfig(updated, config);
      pendingConfigs.set(key, updatedConfig);

      // TODO: POST to infra provisioning Lambda when available

      return updated;
    },

    async deleteRecord(name: string, type: DNSRecordType): Promise<void> {
      const key = recordKey(name, type);
      if (!pendingConfigs.has(key)) {
        throw new Error(`Azure DNS record not found: ${key}`);
      }
      pendingConfigs.delete(key);

      // TODO: POST to infra provisioning Lambda when available
    },

    async getRecord(name: string, type: DNSRecordType): Promise<DNSRecord | null> {
      const cfg = pendingConfigs.get(recordKey(name, type));
      if (!cfg) return null;

      return {
        type,
        name: cfg.record_name,
        value: cfg.record_value,
        ttl: cfg.ttl,
        status: "pending",
      };
    },

    async listRecords(): Promise<DNSRecord[]> {
      return [...pendingConfigs.entries()].map(([key, cfg]) => ({
        type: key.split(":")[1] as DNSRecordType,
        name: cfg.record_name,
        value: cfg.record_value,
        ttl: cfg.ttl,
        status: "pending" as const,
      }));
    },

    async validateCertificate(domain: string): Promise<CertValidationResult> {
      const validationRecord: DNSRecord = {
        type: "TXT",
        name: `_acme-challenge.${domain}`,
        value: `azure-validation-pending`,
        ttl: 60,
        status: "pending",
      };

      const resourceConfig = buildAzureResourceConfig(validationRecord, config);
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
      // Azure DNS propagation must be checked server-side via Azure SDK
      return "pending";
    },
  };
}
