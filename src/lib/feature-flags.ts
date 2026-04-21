/**
 * Feature flag utility — reads `import.meta.env.VITE_FEATURE_*` and caches results.
 *
 * Flags are resolved once at module load. Consumers call `isFeatureEnabled("COMPLIANCE_LIB")`.
 *
 * @example
 * if (isFeatureEnabled("COMPLIANCE_LIB")) {
 *   return <NewComplianceWiring />;
 * }
 * return <LegacyFlow />;
 */

export type FeatureFlag = "COMPLIANCE_LIB";

const FLAG_PREFIX = "VITE_FEATURE_";

function readFlag(name: FeatureFlag): boolean {
  const envKey = `${FLAG_PREFIX}${name}` as const;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (import.meta as any).env as Record<string, string | undefined> | undefined;
  const raw = env?.[envKey];
  if (raw === undefined) return false;
  return raw === "true" || raw === "1" || raw === "on";
}

const cache = new Map<FeatureFlag, boolean>();

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  let v = cache.get(flag);
  if (v === undefined) {
    v = readFlag(flag);
    cache.set(flag, v);
  }
  return v;
}

/** Reset flag cache — test-only helper. */
export function _resetFeatureFlagsForTest(): void {
  cache.clear();
}
