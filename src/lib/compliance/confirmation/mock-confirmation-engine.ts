/**
 * In-memory mock `IConfirmationEngine` (Story 28.6).
 *
 * Enforces:
 * - RBAC (AC-3) on initiate / complete / abandon
 * - Optional SoD (AC-5) via `requireDistinctConfirmer` — when true, the
 *   confirmer cannot be the initiator
 * - Validator-registry dispatch on `complete` — caller-supplied schemas
 *   keep the primitive domain-agnostic
 * - Audit log on every transition and every denial (AU-2/AU-3)
 */

import { AccessDeniedError, type ComplianceActor } from "../types";
import { canPerformAction, type Role } from "../../rbac";
import { logAudit } from "../../audit/log-audit";
import type { IConfirmationEngine } from "./confirmation-engine.interface";
import {
  createValidatorRegistry,
  type ActionInitiation,
  type ValidatorRegistry,
} from "./confirmation-primitive";
import {
  ActionConfirmationMismatchError,
  ActionInitiationNotFoundError,
  InvalidConfirmationTransitionError,
  SelfConfirmationError,
  UnknownValidatorError,
} from "./confirmation-errors";

export interface MockConfirmationEngineOptions {
  readonly resolveRole?: (actor: ComplianceActor) => Role;
  readonly now?: () => Date;
  /** Automatic-abandon timeout in ms (default: 7 days). */
  readonly abandonAfterMs?: number;
  /** When true, `complete` throws SelfConfirmationError if confirmer === initiator. */
  readonly requireDistinctConfirmer?: boolean;
  readonly validators?: ValidatorRegistry;
}

const DEFAULT_ABANDON_MS = 7 * 24 * 60 * 60 * 1000;

export function createMockConfirmationEngine(
  options: MockConfirmationEngineOptions = {},
): IConfirmationEngine {
  const resolveRole = options.resolveRole ?? (() => "Admin" as Role);
  const now = options.now ?? (() => new Date());
  const abandonAfterMs = options.abandonAfterMs ?? DEFAULT_ABANDON_MS;
  const requireDistinctConfirmer = options.requireDistinctConfirmer ?? false;
  const validators = options.validators ?? createValidatorRegistry();

  const byId = new Map<string, ActionInitiation>();

  function mintId(): string {
    return `init-${Math.random().toString(36).slice(2, 11)}`;
  }

  function authorize(
    actor: ComplianceActor,
    action: "confirmation:initiate" | "confirmation:complete" | "confirmation:abandon",
    resourceId: string,
  ): void {
    const role = resolveRole(actor);
    if (!canPerformAction(role, action)) {
      logAudit({
        action: `compliance.${action}`,
        resourceType: "ActionInitiation",
        resourceId,
        actor,
        outcome: "denied",
        reason: `role ${role} lacks ${action}`,
      });
      throw new AccessDeniedError(action, actor.userId);
    }
  }

  return {
    validators,

    async initiate<TPayload>(
      kind: string,
      payload: TPayload,
      actor: ComplianceActor,
    ): Promise<ActionInitiation<TPayload>> {
      authorize(actor, "confirmation:initiate", kind);
      const id = mintId();
      const init: ActionInitiation<TPayload> = {
        id,
        kind,
        payload,
        initiatedAt: now().toISOString(),
        initiatedBy: actor,
        state: "initiated",
      };
      byId.set(id, init as ActionInitiation);
      logAudit({
        action: "compliance.confirmation.initiate",
        resourceType: "ActionInitiation",
        resourceId: id,
        actor,
        outcome: "success",
        context: { kind },
      });
      return init;
    },

    async complete<TProof>(
      initiationId: string,
      proof: TProof,
      actor: ComplianceActor,
    ): Promise<ActionInitiation> {
      authorize(actor, "confirmation:complete", initiationId);
      const current = byId.get(initiationId);
      if (!current) throw new ActionInitiationNotFoundError(initiationId);

      if (current.state !== "initiated") {
        logAudit({
          action: "compliance.confirmation.complete",
          resourceType: "ActionInitiation",
          resourceId: initiationId,
          actor,
          outcome: "denied",
          reason: `invalid transition ${current.state} → confirmed`,
        });
        throw new InvalidConfirmationTransitionError(current.state, "confirmed");
      }

      if (requireDistinctConfirmer && current.initiatedBy.userId === actor.userId) {
        logAudit({
          action: "compliance.confirmation.complete",
          resourceType: "ActionInitiation",
          resourceId: initiationId,
          actor,
          outcome: "denied",
          reason: "AC-5: confirmer equals initiator",
        });
        throw new SelfConfirmationError(actor.userId);
      }

      const validator = validators.get(current.kind);
      if (!validator) {
        logAudit({
          action: "compliance.confirmation.complete",
          resourceType: "ActionInitiation",
          resourceId: initiationId,
          actor,
          outcome: "error",
          reason: `no validator for kind ${current.kind}`,
        });
        throw new UnknownValidatorError(current.kind);
      }
      const result = validator(proof);
      if (!result.ok) {
        logAudit({
          action: "compliance.confirmation.complete",
          resourceType: "ActionInitiation",
          resourceId: initiationId,
          actor,
          outcome: "denied",
          reason: `validator rejected: ${result.messages.join("; ")}`,
        });
        throw new ActionConfirmationMismatchError(result.messages);
      }

      const updated: ActionInitiation = {
        ...current,
        state: "confirmed",
        confirmation: {
          confirmedAt: now().toISOString(),
          confirmedBy: actor,
          proof,
        },
      };
      byId.set(initiationId, updated);
      logAudit({
        action: "compliance.confirmation.complete",
        resourceType: "ActionInitiation",
        resourceId: initiationId,
        actor,
        outcome: "success",
        context: { kind: current.kind },
      });
      return updated;
    },

    async abandon(initiationId, reason, actor) {
      authorize(actor, "confirmation:abandon", initiationId);
      const current = byId.get(initiationId);
      if (!current) throw new ActionInitiationNotFoundError(initiationId);
      if (current.state !== "initiated") {
        logAudit({
          action: "compliance.confirmation.abandon",
          resourceType: "ActionInitiation",
          resourceId: initiationId,
          actor,
          outcome: "denied",
          reason: `invalid transition ${current.state} → abandoned`,
        });
        throw new InvalidConfirmationTransitionError(current.state, "abandoned");
      }
      if (reason.length < 10 || reason.length > 500) {
        throw new InvalidConfirmationTransitionError(
          "initiated",
          "abandoned (reason must be 10-500 chars)",
        );
      }
      const updated: ActionInitiation = {
        ...current,
        state: "abandoned",
        abandonment: {
          abandonedAt: now().toISOString(),
          abandonedBy: actor,
          reason,
          auto: false,
        },
      };
      byId.set(initiationId, updated);
      logAudit({
        action: "compliance.confirmation.abandon",
        resourceType: "ActionInitiation",
        resourceId: initiationId,
        actor,
        outcome: "success",
        context: { kind: current.kind },
        reason,
      });
      return updated;
    },

    async loadById(initiationId) {
      return byId.get(initiationId) ?? null;
    },

    async loadByKind(kind, filter) {
      let items = [...byId.values()].filter((i) => i.kind === kind);
      if (filter.state) items = items.filter((i) => i.state === filter.state);
      items.sort((a, b) => b.initiatedAt.localeCompare(a.initiatedAt));
      if (filter.limit) items = items.slice(0, filter.limit);
      return items;
    },

    async abandonStale(kind) {
      const clock = now().getTime();
      const abandoned: ActionInitiation[] = [];
      const systemActor: ComplianceActor = { userId: "system", displayName: "System" };
      for (const current of byId.values()) {
        if (current.kind !== kind) continue;
        if (current.state !== "initiated") continue;
        const age = clock - Date.parse(current.initiatedAt);
        if (age <= abandonAfterMs) continue;
        const updated: ActionInitiation = {
          ...current,
          state: "abandoned",
          abandonment: {
            abandonedAt: now().toISOString(),
            abandonedBy: systemActor,
            reason: "auto-abandoned: exceeded timeout",
            auto: true,
          },
        };
        byId.set(current.id, updated);
        logAudit({
          action: "compliance.confirmation.abandon",
          resourceType: "ActionInitiation",
          resourceId: current.id,
          actor: systemActor,
          outcome: "success",
          context: { kind, auto: true },
          reason: "exceeded timeout",
        });
        abandoned.push(updated);
      }
      return abandoned;
    },
  };
}
