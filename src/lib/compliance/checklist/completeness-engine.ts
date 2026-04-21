/**
 * Pure completeness evaluator (Story 28.2 AC2).
 *
 * Given a schema and the current slot state, classify the subject as
 * `complete`, `conditionally-complete`, or `incomplete`. The function has
 * no I/O, no clock, and no dependency on globals — every branch is covered
 * by unit tests (100% branch coverage required).
 */

import type { ChecklistSchema, ChecklistState, Completeness, SlotState } from "./checklist-schema";

export function evaluateCompleteness<TKey extends string>(
  schema: ChecklistSchema<TKey>,
  state: ChecklistState<TKey>,
): Completeness {
  if (schema.schemaId !== state.schemaId) {
    // Caller passed a mismatched pair. Treat as incomplete and surface all
    // required slot keys — defensive, even though this shouldn't happen.
    return {
      kind: "incomplete",
      missing: schema.slots.filter((s) => s.required).map((s) => s.key),
    };
  }

  const missing: string[] = [];
  const pendingWaivers: string[] = [];

  for (const slot of schema.slots) {
    if (!slot.required) continue;
    const slotState: SlotState = state.slots[slot.key] ?? { kind: "missing" };
    switch (slotState.kind) {
      case "present":
      case "waived-permanent":
        break;
      case "waived-conditional":
        pendingWaivers.push(slot.key);
        break;
      case "missing":
        missing.push(slot.key);
        break;
    }
  }

  if (missing.length > 0) {
    return { kind: "incomplete", missing };
  }
  if (pendingWaivers.length > 0) {
    return { kind: "conditionally-complete", pendingWaivers };
  }
  return { kind: "complete" };
}
