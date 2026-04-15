/**
 * Firmware version utilities — pure helpers for working with semver strings
 * produced by the firmware pipeline.
 *
 * These utilities are deliberately self-contained (no `semver` npm dep) because
 * our version strings come from a controlled internal source and only ever need
 * major.minor.patch ordering for the handful of operations called out by the
 * Story 27.4 (#420) and Epic 4 firmware flows.
 *
 * @see Story 27.4 — Firmware Approval Comments & Rollback Reasons (#420)
 */

/**
 * Parses a firmware version string into a [major, minor, patch] tuple.
 *
 * Accepts (and strips):
 *   - optional leading `v` / `V` (e.g. `v4.1.0`)
 *   - optional prerelease / build suffix (e.g. `1.2.0-beta.1`, `1.2.0+meta`)
 *
 * Returns `null` for malformed input so callers can fall back safely.
 *
 * @example
 *   parseVersion("v4.1.0")         // [4, 1, 0]
 *   parseVersion("1.2.0-beta.1")   // [1, 2, 0]
 *   parseVersion("unknown")        // null
 */
export function parseVersion(v: string): readonly [number, number, number] | null {
  const match = v.match(/^[vV]?(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  const [, major, minor, patch] = match;
  return [Number(major), Number(minor), Number(patch)];
}

/**
 * Returns `true` when `newVersion` is strictly older (lower semver) than
 * `previousVersion` — i.e. the assignment is a rollback.
 *
 * Policy:
 *   - `previousVersion === null | undefined` → `false` (first assignment is
 *     never a rollback)
 *   - Equal versions → `false` (re-assignment of the same version is not a
 *     rollback)
 *   - Unparseable version strings → `false` (defensive; let the UI treat
 *     the assignment as an ordinary forward move and require explicit user
 *     confirmation if needed)
 *
 * Used by the firmware assignment flow to decide whether to require the
 * `rollbackReason` field per Story 27.4 (#420) AC5.
 *
 * @example
 *   isRollback("v1.0.0", "v1.2.0")       // true
 *   isRollback("v1.2.0", "v1.2.0")       // false
 *   isRollback("v1.2.0", "v1.0.0")       // false (forward)
 *   isRollback("v1.0.0", null)           // false (first assignment)
 *   isRollback("1.2.0-beta.1", "1.1.0")  // true (prerelease strips)
 *   isRollback("unknown", "v1.0.0")      // false (defensive)
 */
export function isRollback(
  newVersion: string,
  previousVersion: string | null | undefined,
): boolean {
  if (!previousVersion) return false;
  const next = parseVersion(newVersion);
  const prev = parseVersion(previousVersion);
  if (!next || !prev) return false;
  for (let i = 0; i < 3; i++) {
    const n = next[i]!;
    const p = prev[i]!;
    if (n < p) return true;
    if (n > p) return false;
  }
  return false; // equal
}
