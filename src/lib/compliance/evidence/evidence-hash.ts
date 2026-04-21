/**
 * SHA-256 hex digest for evidence content addressing.
 *
 * Uses the Web Crypto API which is available in both browsers and modern
 * Node (via `globalThis.crypto.subtle`). Falls back to a deterministic
 * stub only when Web Crypto is unavailable — callers should never hit
 * that branch in production.
 */

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error("Web Crypto (crypto.subtle) is unavailable — cannot compute evidence hash.");
  }
  const buf = await subtle.digest("SHA-256", bytes);
  const view = new Uint8Array(buf);
  let out = "";
  for (let i = 0; i < view.length; i++) {
    const b = view[i] ?? 0;
    out += b.toString(16).padStart(2, "0");
  }
  return out;
}
