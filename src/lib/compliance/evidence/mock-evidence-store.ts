/**
 * In-memory mock `IEvidenceStore` (Story 28.1).
 *
 * Intended for tests, Storybook, and the `VITE_EVIDENCE_STORE_PROVIDER=mock`
 * path in local dev. Persistence is per-instance and lost on reload.
 *
 * Immutability invariant: the internal Map holds frozen `EvidenceMetadata`
 * and the byte blob separately. Every exported method returns a fresh
 * shallow clone so callers cannot mutate the store through the returned
 * reference.
 */

import { AccessDeniedError, type ComplianceActor } from "../types";
import { canPerformAction, type Role } from "../../rbac";
import { logAudit } from "../../audit/log-audit";
import type {
  EvidenceMetadata,
  EvidencePutInput,
  IEvidenceStore,
} from "./evidence-store.interface";
import { EvidenceImmutabilityError, EvidenceNotFoundError } from "./evidence-errors";
import { sha256Hex } from "./evidence-hash";

export interface MockEvidenceStoreOptions {
  /**
   * Resolve the caller's role for RBAC. Defaults to a permissive role for
   * unit tests; apps MUST pass the authenticated role resolver.
   */
  readonly resolveRole?: (actor: ComplianceActor) => Role;
  /** Injectable clock for deterministic tests. */
  readonly now?: () => Date;
}

interface StoredRecord {
  readonly meta: EvidenceMetadata;
  readonly bytes: Uint8Array;
}

export function createMockEvidenceStore(options: MockEvidenceStoreOptions = {}): IEvidenceStore {
  const records = new Map<string, StoredRecord>();
  const resolveRole = options.resolveRole ?? (() => "Admin" as Role);
  const now = options.now ?? (() => new Date());

  function ensureImmutable(id: string): void {
    const existing = records.get(id);
    if (existing && Object.isFrozen(existing.meta) === false) {
      // Paranoid internal check — metadata should always be frozen on insert.
      throw new EvidenceImmutabilityError(id, "internal-invariant");
    }
  }

  function authorize(actor: ComplianceActor, action: "evidence:put" | "evidence:read"): void {
    const role = resolveRole(actor);
    if (!canPerformAction(role, action)) {
      logAudit({
        action: `compliance.${action}`,
        resourceType: "Evidence",
        resourceId: "-",
        actor,
        outcome: "denied",
        reason: `role ${role} lacks ${action}`,
      });
      throw new AccessDeniedError(action, actor.userId);
    }
  }

  return {
    async put(input: EvidencePutInput): Promise<EvidenceMetadata> {
      authorize(input.actor, "evidence:put");

      const contentHash = await sha256Hex(input.bytes);
      const id = `ev-${contentHash.slice(0, 16)}`;

      if (records.has(id)) {
        // Content-addressed — identical payload is a no-op put. Return existing
        // metadata; emit an audit record so the event is still traceable.
        const existing = records.get(id)!;
        logAudit({
          action: "compliance.evidence.put",
          resourceType: "Evidence",
          resourceId: id,
          actor: input.actor,
          outcome: "success",
          context: { contentHash, dedup: true },
        });
        return existing.meta;
      }

      const meta: EvidenceMetadata = Object.freeze({
        id,
        contentHash,
        mimeType: input.mimeType,
        sizeBytes: input.bytes.byteLength,
        uploadedAt: now().toISOString(),
        uploadedBy: { userId: input.actor.userId, displayName: input.actor.displayName },
        retention: { mode: input.retentionMode, retainUntil: input.retainUntil },
        tags: Object.freeze({ ...(input.tags ?? {}) }),
        immutable: true,
      });

      records.set(id, { meta, bytes: input.bytes.slice() });

      logAudit({
        action: "compliance.evidence.put",
        resourceType: "Evidence",
        resourceId: id,
        actor: input.actor,
        outcome: "success",
        context: { contentHash, retentionMode: input.retentionMode },
      });

      return meta;
    },

    async get(id, { actor }): Promise<EvidenceMetadata> {
      authorize(actor, "evidence:read");
      ensureImmutable(id);
      const rec = records.get(id);
      if (!rec) throw new EvidenceNotFoundError(id);
      return rec.meta;
    },

    async getSignedReadUrl(id, expiresInSeconds, { actor }): Promise<string> {
      authorize(actor, "evidence:read");
      const rec = records.get(id);
      if (!rec) throw new EvidenceNotFoundError(id);

      const expiresAt = new Date(now().getTime() + expiresInSeconds * 1000).toISOString();
      // Mock URL — real adapters return a provider-signed URL. The data: URL
      // encoding lets Storybook and tests exercise the download path.
      const url = `data:${rec.meta.mimeType};x-evidence-id=${encodeURIComponent(id)};expires=${encodeURIComponent(
        expiresAt,
      )};base64,${toBase64(rec.bytes)}`;

      logAudit({
        action: "compliance.evidence.signedUrl",
        resourceType: "Evidence",
        resourceId: id,
        actor,
        outcome: "success",
        context: { expiresAt, expiresInSeconds },
      });

      return url;
    },

    async list(filter, { actor }): Promise<EvidenceMetadata[]> {
      authorize(actor, "evidence:read");

      let items = [...records.values()].map((r) => r.meta);
      if (filter.uploadedBy) {
        items = items.filter((m) => m.uploadedBy.userId === filter.uploadedBy);
      }
      if (filter.uploadedAfter) {
        items = items.filter((m) => m.uploadedAt >= filter.uploadedAfter!);
      }
      if (filter.uploadedBefore) {
        items = items.filter((m) => m.uploadedAt <= filter.uploadedBefore!);
      }
      if (filter.tags) {
        items = items.filter((m) =>
          Object.entries(filter.tags!).every(([k, v]) => m.tags[k] === v),
        );
      }
      items.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
      if (typeof filter.limit === "number") items = items.slice(0, filter.limit);
      return items;
    },
  };
}

function toBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i] ?? 0);
  return typeof btoa !== "undefined" ? btoa(binary) : "";
}
