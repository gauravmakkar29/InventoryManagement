import { createContext } from "react";
import type { AuthState } from "./types";

/**
 * Singleton context instance — avoids circular imports between
 * auth-context.tsx (provider) and use-auth.ts (consumer hook).
 */
export const AuthContext = createContext<AuthState | null>(null);
