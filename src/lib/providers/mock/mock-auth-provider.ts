/**
 * Mock Auth Provider — re-exports the existing AuthProvider component.
 * The existing auth-context.tsx IS the mock adapter. No logic is duplicated.
 */
export { AuthProvider as MockAuthProvider } from "../../auth-context";
