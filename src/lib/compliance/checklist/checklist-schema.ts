/**
 * Generic checklist types for the document-completeness engine (Story 28.2).
 *
 * Schemas are caller-defined. The primitive carries no domain knowledge —
 * it does not know what an SBOM, FAT report, or release note is. Callers
 * declare a `ChecklistSchema<TKey>` describing the slots they require and
 * pass it to `<ChecklistPanel>` / `evaluateCompleteness()`.
 */

import type { ComplianceActor } from "../types";

export interface ChecklistSlot<TKey extends string = string> {
  readonly key: TKey;
  readonly label: string;
  readonly required: boolean;
  readonly description?: string;
}

export interface ChecklistSchema<TKey extends string = string> {
  readonly schemaId: string;
  readonly label: string;
  readonly slots: readonly ChecklistSlot<TKey>[];
}

export type SlotState =
  | { readonly kind: "missing" }
  | {
      readonly kind: "present";
      readonly evidenceId: string;
      readonly filledAt: string;
      readonly filledBy: ComplianceActor;
    }
  | {
      readonly kind: "waived-permanent";
      readonly reason: string;
      readonly waivedAt: string;
      readonly waivedBy: ComplianceActor;
    }
  | {
      readonly kind: "waived-conditional";
      readonly reason: string;
      readonly dueAt: string;
      readonly waivedAt: string;
      readonly waivedBy: ComplianceActor;
    };

export interface ChecklistState<TKey extends string = string> {
  readonly schemaId: string;
  readonly subjectId: string;
  readonly slots: Readonly<Record<TKey, SlotState>>;
}

export type Completeness =
  | { readonly kind: "complete" }
  | { readonly kind: "conditionally-complete"; readonly pendingWaivers: readonly string[] }
  | { readonly kind: "incomplete"; readonly missing: readonly string[] };
