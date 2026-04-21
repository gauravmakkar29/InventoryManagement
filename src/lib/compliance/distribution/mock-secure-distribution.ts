/**
 * In-memory mock `ISecureDistribution` (Story 28.5).
 *
 * Encodes tokens as opaque base64 JSON with an HMAC-style signature stub
 * (the mock uses a deterministic hash over a configurable secret — good
 * enough to detect tampering in tests, NOT suitable for production).
 *
 * Enforces:
 * - RBAC (AC-3) on mint (distribution:approve) and redeem (distribution:request)
 * - Step-up MFA freshness (IA-2) on redeem when required
 * - Recipient binding — redeeming actor must match `recipientUserId`
 * - Single-use via atomic consumed-jti set
 * - Expiry before signature validation (constant-time behavior is not
 *   required for the mock; the reference S3 adapter does enforce it)
 */

import { AccessDeniedError, type ComplianceActor } from "../types";
import { canPerformAction, type Role } from "../../rbac";
import { logAudit } from "../../audit/log-audit";
import {
  DistributionAdapterConfigError,
  MfaStepUpRequiredError,
  SecureLinkConsumedError,
  SecureLinkExpiredError,
  TokenMismatchError,
} from "./distribution-errors";
import type {
  ISecureDistribution,
  RedeemContext,
  SecureLink,
  SecureLinkListItem,
  SecureLinkRedemption,
  SecureLinkRequest,
} from "./secure-distribution.interface";

export interface MockSecureDistributionOptions {
  readonly resolveRole?: (actor: ComplianceActor) => Role;
  readonly now?: () => Date;
  readonly storageUrlMinter?: (evidenceId: string) => string;
  readonly mfaFreshnessMs?: number;
  readonly signingSecret?: string;
}

interface TokenPayload {
  readonly jti: string;
  readonly evidenceId: string;
  readonly recipientUserId: string;
  readonly expiresAt: string;
  readonly requireStepUpMfa: boolean;
}

interface StoredLink extends TokenPayload {
  readonly mintedAt: string;
  readonly mintedBy: string;
  consumed: boolean;
}

const DEFAULT_MFA_FRESHNESS_MS = 5 * 60 * 1000;
const DEFAULT_SECRET = "mock-secure-distribution-secret";

function encodeToken(payload: TokenPayload, secret: string): string {
  const body = btoaSafe(JSON.stringify(payload));
  const sig = simpleHash(body + secret);
  return `${body}.${sig}`;
}

function decodeToken(token: string, secret: string): TokenPayload {
  const parts = token.split(".");
  if (parts.length !== 2) throw new TokenMismatchError("malformed token");
  const [body, sig] = parts;
  if (!body || !sig) throw new TokenMismatchError("malformed token");
  if (simpleHash(body + secret) !== sig) throw new TokenMismatchError("invalid signature");
  try {
    return JSON.parse(atobSafe(body)) as TokenPayload;
  } catch {
    throw new TokenMismatchError("token body unparseable");
  }
}

function simpleHash(input: string): string {
  // Non-cryptographic hash — ONLY for the mock adapter so tests can detect
  // token tampering. The s3-signed-url adapter uses a real signer.
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h + input.charCodeAt(i)) & 0xffffffff;
  }
  return (h >>> 0).toString(16);
}

function btoaSafe(s: string): string {
  if (typeof Buffer !== "undefined") return Buffer.from(s).toString("base64");
  return btoa(s);
}

function atobSafe(s: string): string {
  if (typeof Buffer !== "undefined") return Buffer.from(s, "base64").toString("utf8");
  return atob(s);
}

function randomJti(): string {
  const bytes = new Uint8Array(16);
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += (bytes[i] ?? 0).toString(16).padStart(2, "0");
  return out;
}

export function createMockSecureDistribution(
  options: MockSecureDistributionOptions = {},
): ISecureDistribution {
  const resolveRole = options.resolveRole ?? (() => "Admin" as Role);
  const now = options.now ?? (() => new Date());
  const mintStorage =
    options.storageUrlMinter ??
    ((evidenceId) => `mock-storage://${evidenceId}?t=${now().toISOString()}`);
  const mfaFreshnessMs = options.mfaFreshnessMs ?? DEFAULT_MFA_FRESHNESS_MS;
  const secret = options.signingSecret ?? DEFAULT_SECRET;
  if (!secret) throw new DistributionAdapterConfigError("signingSecret must be non-empty");

  const links = new Map<string, StoredLink>();
  // The "consumed-jti" invariant lives on StoredLink.consumed. Atomic write
  // is simulated — the async boundary in JS is single-threaded so a plain
  // check-then-set is race-safe within this process. For a distributed
  // reference adapter (s3-signed-url) the equivalent is a conditional
  // DynamoDB PutItem keyed on `jti`.

  function authorize(
    actor: ComplianceActor,
    action: "distribution:approve" | "distribution:request",
    resourceId: string,
  ): void {
    const role = resolveRole(actor);
    if (!canPerformAction(role, action)) {
      logAudit({
        action: `compliance.${action}`,
        resourceType: "SecureLink",
        resourceId,
        actor,
        outcome: "denied",
        reason: `role ${role} lacks ${action}`,
      });
      throw new AccessDeniedError(action, actor.userId);
    }
  }

  return {
    async mintLink(request: SecureLinkRequest, minter: ComplianceActor): Promise<SecureLink> {
      authorize(minter, "distribution:approve", request.evidenceId);
      if (request.expiresInSeconds <= 0 || request.expiresInSeconds > 86_400) {
        throw new DistributionAdapterConfigError(
          "expiresInSeconds must be 1-86400 (NIST SI-10 — bounded validity).",
        );
      }

      const mintedAt = now();
      const expiresAt = new Date(mintedAt.getTime() + request.expiresInSeconds * 1000);
      const jti = randomJti();

      const payload: TokenPayload = {
        jti,
        evidenceId: request.evidenceId,
        recipientUserId: request.recipientUserId,
        expiresAt: expiresAt.toISOString(),
        requireStepUpMfa: request.requireStepUpMfa,
      };
      const token = encodeToken(payload, secret);

      links.set(jti, {
        ...payload,
        mintedAt: mintedAt.toISOString(),
        mintedBy: minter.userId,
        consumed: false,
      });

      logAudit({
        action: "compliance.distribution.minted",
        resourceType: "SecureLink",
        resourceId: jti,
        actor: minter,
        outcome: "success",
        context: {
          evidenceId: request.evidenceId,
          recipientUserId: request.recipientUserId,
          expiresAt: expiresAt.toISOString(),
          purpose: request.purpose,
          requireStepUpMfa: request.requireStepUpMfa,
        },
      });

      return {
        token,
        url: `mock://distribution/redeem?token=${encodeURIComponent(token)}`,
        expiresAt: expiresAt.toISOString(),
        jti,
        singleUse: true,
      };
    },

    async redeem(token: string, ctx: RedeemContext): Promise<SecureLinkRedemption> {
      const payload = decodeToken(token, secret);
      authorize(ctx.actor, "distribution:request", payload.jti);

      const stored = links.get(payload.jti);
      if (!stored) {
        logAudit({
          action: "compliance.distribution.redeem",
          resourceType: "SecureLink",
          resourceId: payload.jti,
          actor: ctx.actor,
          outcome: "denied",
          reason: "unknown jti",
        });
        throw new TokenMismatchError("unknown jti");
      }

      if (stored.recipientUserId !== ctx.actor.userId) {
        logAudit({
          action: "compliance.distribution.redeem",
          resourceType: "SecureLink",
          resourceId: payload.jti,
          actor: ctx.actor,
          outcome: "denied",
          reason: "recipient mismatch",
        });
        throw new TokenMismatchError("redeemer does not match recipient");
      }

      const clock = now();
      if (Date.parse(stored.expiresAt) <= clock.getTime()) {
        logAudit({
          action: "compliance.distribution.redeem",
          resourceType: "SecureLink",
          resourceId: payload.jti,
          actor: ctx.actor,
          outcome: "denied",
          reason: "expired",
        });
        throw new SecureLinkExpiredError(payload.jti);
      }

      if (stored.requireStepUpMfa) {
        const last = ctx.lastStepUpMfaAt ? Date.parse(ctx.lastStepUpMfaAt) : NaN;
        if (Number.isNaN(last) || clock.getTime() - last > mfaFreshnessMs) {
          logAudit({
            action: "compliance.distribution.redeem",
            resourceType: "SecureLink",
            resourceId: payload.jti,
            actor: ctx.actor,
            outcome: "denied",
            reason: "step-up MFA required",
          });
          throw new MfaStepUpRequiredError();
        }
      }

      if (stored.consumed) {
        logAudit({
          action: "compliance.distribution.redeem",
          resourceType: "SecureLink",
          resourceId: payload.jti,
          actor: ctx.actor,
          outcome: "denied",
          reason: "already consumed",
        });
        throw new SecureLinkConsumedError(payload.jti);
      }
      stored.consumed = true;

      const storageUrl = mintStorage(stored.evidenceId);
      const redeemedAt = clock.toISOString();

      logAudit({
        action: "compliance.distribution.redeemed",
        resourceType: "SecureLink",
        resourceId: payload.jti,
        actor: ctx.actor,
        outcome: "success",
        context: { evidenceId: stored.evidenceId, redeemedAt },
      });

      return {
        jti: payload.jti,
        storageUrl,
        redeemedAt,
        recipientUserId: stored.recipientUserId,
        evidenceId: stored.evidenceId,
      };
    },

    async listMyActive(userId): Promise<readonly SecureLinkListItem[]> {
      const clock = now().getTime();
      return [...links.values()]
        .filter(
          (l) => l.recipientUserId === userId && !l.consumed && Date.parse(l.expiresAt) > clock,
        )
        .map((l) => ({
          jti: l.jti,
          evidenceId: l.evidenceId,
          recipientUserId: l.recipientUserId,
          expiresAt: l.expiresAt,
          consumed: l.consumed,
          mintedAt: l.mintedAt,
        }));
    },

    async getByJti(jti) {
      const l = links.get(jti);
      if (!l) return null;
      return {
        jti: l.jti,
        evidenceId: l.evidenceId,
        recipientUserId: l.recipientUserId,
        expiresAt: l.expiresAt,
        consumed: l.consumed,
        mintedAt: l.mintedAt,
      };
    },
  };
}
