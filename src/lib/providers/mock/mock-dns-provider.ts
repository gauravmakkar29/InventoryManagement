/**
 * Mock DNS Provider — in-memory DNS record management for local development.
 *
 * Simulates DNS operations including propagation delay (2s) and certificate validation.
 * All records are stored in a Map keyed by "name:type".
 */
import type {
  IDNSProvider,
  DNSRecord,
  DNSRecordType,
  DNSProviderConfig,
  CertValidationResult,
  PropagationStatus,
} from "../types";

/** Propagation delay threshold in milliseconds */
const PROPAGATION_DELAY_MS = 2_000;

/**
 * Creates a mock DNS provider backed by an in-memory Map.
 *
 * @example
 * ```ts
 * const dns = createMockDNSProvider({ provider: "mock", domain: "example.com" });
 * await dns.createRecord({ type: "CNAME", name: "app.example.com", value: "cdn.example.com", ttl: 300 });
 * ```
 */
export function createMockDNSProvider(_config: DNSProviderConfig): IDNSProvider {
  const records = new Map<string, DNSRecord>();
  const createdTimestamps = new Map<string, number>();

  function recordKey(name: string, type: DNSRecordType): string {
    return `${name}:${type}`;
  }

  return {
    async createRecord(record: DNSRecord): Promise<DNSRecord> {
      const key = recordKey(record.name, record.type);
      const created: DNSRecord = { ...record, status: "active" };
      records.set(key, created);
      createdTimestamps.set(record.name, Date.now());
      return created;
    },

    async updateRecord(name: string, partial: Partial<DNSRecord>): Promise<DNSRecord> {
      const existing = [...records.entries()].find(([, r]) => r.name === name);
      if (!existing) {
        throw new Error(`DNS record not found: ${name}`);
      }
      const [key, current] = existing;
      const updated: DNSRecord = { ...current, ...partial, name };
      records.set(key, updated);
      return updated;
    },

    async deleteRecord(name: string, type: DNSRecordType): Promise<void> {
      const key = recordKey(name, type);
      if (!records.has(key)) {
        throw new Error(`DNS record not found: ${key}`);
      }
      records.delete(key);
      createdTimestamps.delete(name);
    },

    async getRecord(name: string, type: DNSRecordType): Promise<DNSRecord | null> {
      return records.get(recordKey(name, type)) ?? null;
    },

    async listRecords(): Promise<DNSRecord[]> {
      return [...records.values()];
    },

    async validateCertificate(domain: string): Promise<CertValidationResult> {
      const validationRecord: DNSRecord = {
        type: "TXT",
        name: `_acme-challenge.${domain}`,
        value: `mock-validation-token-${Date.now()}`,
        ttl: 60,
        status: "active",
      };

      const key = recordKey(validationRecord.name, validationRecord.type);
      records.set(key, validationRecord);
      createdTimestamps.set(validationRecord.name, Date.now());

      return {
        domain,
        status: "validated",
        validationRecord,
      };
    },

    async checkPropagation(name: string): Promise<PropagationStatus> {
      const timestamp = createdTimestamps.get(name);
      if (!timestamp) {
        return "failed";
      }

      const elapsed = Date.now() - timestamp;
      return elapsed >= PROPAGATION_DELAY_MS ? "propagated" : "pending";
    },
  };
}
