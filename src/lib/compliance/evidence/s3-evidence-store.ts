/**
 * AWS S3 reference adapter for `IEvidenceStore` (Story 28.1).
 *
 * REQUIRED bucket configuration (enforced at deploy time — NOT by this file):
 *
 * 1. Object Lock ENABLED on the bucket at creation time.
 * 2. Default retention configured with `Mode: COMPLIANCE` (not GOVERNANCE)
 *    so even the bucket-owner root account cannot delete or overwrite.
 * 3. Versioning ENABLED (required for Object Lock).
 * 4. Bucket policy denies `s3:DeleteObject`, `s3:DeleteObjectVersion`,
 *    `s3:PutBucketObjectLockConfiguration` for ALL principals.
 * 5. Server-side encryption: `aws:kms` with a CMK whose key policy allows
 *    only the evidence-service IAM role. NIST SC-12.
 * 6. Access logs forwarded to a dedicated audit bucket (NIST AU-2 / AU-6).
 *
 * NOTE: To keep this repo's runtime dependency surface minimal, the concrete
 * AWS SDK wiring is intentionally deferred — this file defines the adapter
 * contract and throws when instantiated without a platform-provided SDK
 * injector. Real deployments inject the SDK via `s3Client` / `signer`.
 */

import { AccessDeniedError, type ComplianceActor } from "../types";
import { canPerformAction, type Role } from "../../rbac";
import { logAudit } from "../../audit/log-audit";
import type {
  EvidenceListFilter,
  EvidenceMetadata,
  EvidencePutInput,
  IEvidenceStore,
} from "./evidence-store.interface";
import { EvidenceAdapterConfigError, EvidenceNotFoundError } from "./evidence-errors";
import { sha256Hex } from "./evidence-hash";

export interface S3EvidenceStoreConfig {
  readonly bucket: string;
  readonly region: string;
  readonly kmsKeyId: string;
  /**
   * Injected SDK surface. Real deployments pass an AWS SDK v3 `S3Client`
   * adapter + presigner; tests pass a mock.
   */
  readonly driver: IS3Driver;
  readonly resolveRole: (actor: ComplianceActor) => Role;
  readonly now?: () => Date;
}

export interface IS3Driver {
  putObject(input: {
    readonly key: string;
    readonly body: Uint8Array;
    readonly contentType: string;
    readonly kmsKeyId: string;
    readonly objectLock: { readonly mode: "COMPLIANCE"; readonly retainUntil: string };
    readonly metadata: Readonly<Record<string, string>>;
  }): Promise<void>;
  headObject(key: string): Promise<IS3HeadResult | null>;
  presignGet(key: string, expiresInSeconds: number): Promise<string>;
  listObjects(prefix: string): Promise<readonly IS3HeadResult[]>;
}

export interface IS3HeadResult {
  readonly key: string;
  readonly metadata: Readonly<Record<string, string>>;
  readonly sizeBytes: number;
  readonly contentType: string;
  readonly lastModified: string;
}

export function createS3EvidenceStore(config: S3EvidenceStoreConfig): IEvidenceStore {
  if (!config.bucket) throw new EvidenceAdapterConfigError("bucket is required");
  if (!config.kmsKeyId) throw new EvidenceAdapterConfigError("kmsKeyId is required (NIST SC-12)");
  if (!config.driver) throw new EvidenceAdapterConfigError("driver (S3 SDK) must be injected");

  const now = config.now ?? (() => new Date());

  function authorize(actor: ComplianceActor, action: "evidence:put" | "evidence:read"): void {
    const role = config.resolveRole(actor);
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

  function keyFor(id: string): string {
    return `evidence/${id}`;
  }

  function metaFromHead(head: IS3HeadResult): EvidenceMetadata {
    const m = head.metadata;
    const meta: EvidenceMetadata = Object.freeze({
      id: m["x-evidence-id"] ?? "",
      contentHash: m["x-content-hash"] ?? "",
      mimeType: head.contentType,
      sizeBytes: head.sizeBytes,
      uploadedAt: m["x-uploaded-at"] ?? head.lastModified,
      uploadedBy: {
        userId: m["x-uploaded-by-id"] ?? "",
        displayName: m["x-uploaded-by-name"] ?? "",
      },
      retention: {
        mode: "compliance" as const,
        retainUntil: m["x-retain-until"] ?? "",
      },
      tags: Object.freeze({ ...parseTagMetadata(head.metadata) }),
      immutable: true,
    });
    return meta;
  }

  return {
    async put(input: EvidencePutInput): Promise<EvidenceMetadata> {
      authorize(input.actor, "evidence:put");

      if (input.retentionMode !== "compliance") {
        throw new EvidenceAdapterConfigError(
          "S3 adapter supports COMPLIANCE retention only (NIST MP-6). Use governance with a different bucket.",
        );
      }
      const contentHash = await sha256Hex(input.bytes);
      const id = `ev-${contentHash.slice(0, 16)}`;
      const uploadedAt = now().toISOString();

      const metadata: Record<string, string> = {
        "x-evidence-id": id,
        "x-content-hash": contentHash,
        "x-uploaded-at": uploadedAt,
        "x-uploaded-by-id": input.actor.userId,
        "x-uploaded-by-name": input.actor.displayName,
        "x-retain-until": input.retainUntil,
      };
      for (const [k, v] of Object.entries(input.tags ?? {})) metadata[`tag-${k}`] = v;

      await config.driver.putObject({
        key: keyFor(id),
        body: input.bytes,
        contentType: input.mimeType,
        kmsKeyId: config.kmsKeyId,
        objectLock: { mode: "COMPLIANCE", retainUntil: input.retainUntil },
        metadata,
      });

      const meta: EvidenceMetadata = Object.freeze({
        id,
        contentHash,
        mimeType: input.mimeType,
        sizeBytes: input.bytes.byteLength,
        uploadedAt,
        uploadedBy: { userId: input.actor.userId, displayName: input.actor.displayName },
        retention: { mode: "compliance" as const, retainUntil: input.retainUntil },
        tags: Object.freeze({ ...(input.tags ?? {}) }),
        immutable: true,
      });

      logAudit({
        action: "compliance.evidence.put",
        resourceType: "Evidence",
        resourceId: id,
        actor: input.actor,
        outcome: "success",
        context: { contentHash, bucket: config.bucket },
      });

      return meta;
    },

    async get(id, { actor }): Promise<EvidenceMetadata> {
      authorize(actor, "evidence:read");
      const head = await config.driver.headObject(keyFor(id));
      if (!head) throw new EvidenceNotFoundError(id);
      return metaFromHead(head);
    },

    async getSignedReadUrl(id, expiresInSeconds, { actor }): Promise<string> {
      authorize(actor, "evidence:read");
      const head = await config.driver.headObject(keyFor(id));
      if (!head) throw new EvidenceNotFoundError(id);
      const url = await config.driver.presignGet(keyFor(id), expiresInSeconds);

      logAudit({
        action: "compliance.evidence.signedUrl",
        resourceType: "Evidence",
        resourceId: id,
        actor,
        outcome: "success",
        context: { expiresInSeconds, bucket: config.bucket },
      });

      return url;
    },

    async list(filter: EvidenceListFilter, { actor }): Promise<EvidenceMetadata[]> {
      authorize(actor, "evidence:read");
      const heads = await config.driver.listObjects("evidence/");
      let items = heads.map(metaFromHead);
      if (filter.uploadedBy) items = items.filter((m) => m.uploadedBy.userId === filter.uploadedBy);
      if (filter.uploadedAfter) items = items.filter((m) => m.uploadedAt >= filter.uploadedAfter!);
      if (filter.uploadedBefore)
        items = items.filter((m) => m.uploadedAt <= filter.uploadedBefore!);
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

function parseTagMetadata(md: Readonly<Record<string, string>>): Record<string, string> {
  const tags: Record<string, string> = {};
  for (const [k, v] of Object.entries(md)) {
    if (k.startsWith("tag-")) tags[k.slice(4)] = v;
  }
  return tags;
}
