/**
 * In-memory mock `IChecklistStore` (Story 28.2).
 *
 * Schemas registered by code; state kept per-subject in a Map. Every write
 * method enforces RBAC (AC-3) and writes an AUDIT# record with the prior
 * and new slot state (AU-2/AU-3).
 */

import { AccessDeniedError, type ComplianceActor } from "../types";
import { canPerformAction, type Role } from "../../rbac";
import { logAudit } from "../../audit/log-audit";
import type { ChecklistSchema, ChecklistState, SlotState } from "./checklist-schema";
import type { IChecklistStore } from "./checklist-store.interface";
import { ChecklistSchemaNotFoundError, ChecklistValidationError } from "./checklist-errors";

export interface MockChecklistStoreOptions {
  readonly resolveRole?: (actor: ComplianceActor) => Role;
  readonly now?: () => Date;
  readonly seedSchemas?: readonly ChecklistSchema[];
}

const MIN_REASON = 10;
const MAX_REASON = 500;

function validateReason(reason: string): void {
  if (reason.length < MIN_REASON || reason.length > MAX_REASON) {
    throw new ChecklistValidationError(
      `reason must be ${MIN_REASON}-${MAX_REASON} chars (got ${reason.length}).`,
    );
  }
}

function validateDueDate(iso: string, now: Date): void {
  const due = Date.parse(iso);
  if (Number.isNaN(due)) {
    throw new ChecklistValidationError("dueAt must be an ISO-8601 timestamp.");
  }
  const nowMs = now.getTime();
  const oneYear = 365 * 24 * 60 * 60 * 1000;
  if (due <= nowMs) {
    throw new ChecklistValidationError("dueAt must be in the future.");
  }
  if (due > nowMs + oneYear) {
    throw new ChecklistValidationError("dueAt cannot be more than 365 days in the future.");
  }
}

export function createMockChecklistStore(options: MockChecklistStoreOptions = {}): IChecklistStore {
  const schemas = new Map<string, ChecklistSchema>();
  const states = new Map<string, ChecklistState>();
  const resolveRole = options.resolveRole ?? (() => "Admin" as Role);
  const now = options.now ?? (() => new Date());

  for (const s of options.seedSchemas ?? []) {
    schemas.set(s.schemaId, s);
  }

  function stateKey(schemaId: string, subjectId: string): string {
    return `${schemaId}|${subjectId}`;
  }

  function loadOrInitState(schemaId: string, subjectId: string): ChecklistState {
    const key = stateKey(schemaId, subjectId);
    const existing = states.get(key);
    if (existing) return existing;
    const schema = schemas.get(schemaId);
    if (!schema) throw new ChecklistSchemaNotFoundError(schemaId);
    const slots = Object.fromEntries(
      schema.slots.map((s) => [s.key, { kind: "missing" } as SlotState]),
    );
    const fresh: ChecklistState = { schemaId, subjectId, slots };
    states.set(key, fresh);
    return fresh;
  }

  function updateSlot(
    schemaId: string,
    subjectId: string,
    slotKey: string,
    next: SlotState,
  ): ChecklistState {
    const prev = loadOrInitState(schemaId, subjectId);
    const nextSlots = { ...prev.slots, [slotKey]: next };
    const nextState: ChecklistState = { ...prev, slots: nextSlots };
    states.set(stateKey(schemaId, subjectId), nextState);
    return nextState;
  }

  function authorize(
    actor: ComplianceActor,
    action: "checklist:attach" | "checklist:waive",
    subjectId: string,
  ): void {
    const role = resolveRole(actor);
    if (!canPerformAction(role, action)) {
      logAudit({
        action: `compliance.${action}`,
        resourceType: "Checklist",
        resourceId: subjectId,
        actor,
        outcome: "denied",
        reason: `role ${role} lacks ${action}`,
      });
      throw new AccessDeniedError(action, actor.userId);
    }
  }

  function audit(
    action: string,
    subjectId: string,
    slotKey: string,
    prior: SlotState,
    next: SlotState,
    actor: ComplianceActor,
    reason?: string,
  ): void {
    logAudit({
      action,
      resourceType: "Checklist",
      resourceId: subjectId,
      actor,
      outcome: "success",
      context: { slotKey, priorKind: prior.kind, nextKind: next.kind },
      reason,
    });
  }

  return {
    registerSchema(schema) {
      schemas.set(schema.schemaId, schema);
    },

    async loadSchema(schemaId) {
      const s = schemas.get(schemaId);
      if (!s) throw new ChecklistSchemaNotFoundError(schemaId);
      return s;
    },

    async loadState(schemaId, subjectId) {
      return loadOrInitState(schemaId, subjectId);
    },

    async attachSlot(schemaId, subjectId, slotKey, evidenceId, actor) {
      authorize(actor, "checklist:attach", subjectId);
      const prior =
        loadOrInitState(schemaId, subjectId).slots[slotKey] ?? ({ kind: "missing" } as SlotState);
      const next: SlotState = {
        kind: "present",
        evidenceId,
        filledAt: now().toISOString(),
        filledBy: actor,
      };
      updateSlot(schemaId, subjectId, slotKey, next);
      audit("compliance.checklist.attach", subjectId, slotKey, prior, next, actor);
      return next;
    },

    async waivePermanent(schemaId, subjectId, slotKey, reason, actor) {
      authorize(actor, "checklist:waive", subjectId);
      validateReason(reason);
      const prior =
        loadOrInitState(schemaId, subjectId).slots[slotKey] ?? ({ kind: "missing" } as SlotState);
      const next: SlotState = {
        kind: "waived-permanent",
        reason,
        waivedAt: now().toISOString(),
        waivedBy: actor,
      };
      updateSlot(schemaId, subjectId, slotKey, next);
      audit("compliance.checklist.waive.permanent", subjectId, slotKey, prior, next, actor, reason);
      return next;
    },

    async waiveConditional(schemaId, subjectId, slotKey, reason, dueAt, actor) {
      authorize(actor, "checklist:waive", subjectId);
      validateReason(reason);
      validateDueDate(dueAt, now());
      const prior =
        loadOrInitState(schemaId, subjectId).slots[slotKey] ?? ({ kind: "missing" } as SlotState);
      const next: SlotState = {
        kind: "waived-conditional",
        reason,
        dueAt,
        waivedAt: now().toISOString(),
        waivedBy: actor,
      };
      updateSlot(schemaId, subjectId, slotKey, next);
      audit(
        "compliance.checklist.waive.conditional",
        subjectId,
        slotKey,
        prior,
        next,
        actor,
        reason,
      );
      return next;
    },

    async unwaive(schemaId, subjectId, slotKey, actor) {
      authorize(actor, "checklist:waive", subjectId);
      const prior =
        loadOrInitState(schemaId, subjectId).slots[slotKey] ?? ({ kind: "missing" } as SlotState);
      const next: SlotState = { kind: "missing" };
      updateSlot(schemaId, subjectId, slotKey, next);
      audit("compliance.checklist.unwaive", subjectId, slotKey, prior, next, actor);
      return next;
    },
  };
}
