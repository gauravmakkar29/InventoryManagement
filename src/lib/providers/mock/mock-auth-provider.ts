/**
 * Mock Auth Provider — combines MockAuthAdapter with the generic AuthProvider.
 * This is the default auth provider used when VITE_PLATFORM=mock.
 */
import { createAuthProvider } from "../auth-provider";
import { createMockAuthAdapter } from "./mock-auth-adapter";

export const MockAuthProvider = createAuthProvider(createMockAuthAdapter());
