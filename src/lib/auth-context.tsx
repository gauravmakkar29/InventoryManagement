import { useState, useEffect, useCallback, type ReactNode } from "react";
import { AuthContext } from "./auth-context-instance";
import type { User } from "./types";

const STORAGE_KEY = "ims-auth";

interface StoredAuth {
  user: User;
  email: string;
  groups: string[];
  customerId: string | null;
}

function loadStoredAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

function persistAuth(data: StoredAuth): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function clearAuth(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/** Mock credential store — replaced by Cognito in production. */
const MOCK_CREDENTIALS: Record<string, string> = {
  "admin@company.com": "Admin@12345678",
  "manager@company.com": "Manager@12345678",
  "tech@company.com": "Tech@123456789",
  "viewer@company.com": "Viewer@12345678",
  "customer@tenant.com": "Customer@123456",
};

/** Derive role from email for mock auth. */
function deriveRole(email: string): string {
  const local = email.split("@")[0]?.toLowerCase() ?? "";
  if (local.includes("admin")) return "Admin";
  if (local.includes("manager")) return "Manager";
  if (local.includes("tech")) return "Technician";
  if (local.includes("viewer")) return "Viewer";
  if (local.includes("customer")) return "CustomerAdmin";
  return "Viewer";
}

/**
 * Mock AuthProvider — simulates authentication with localStorage persistence.
 * Replace with Cognito / real IdP integration in production.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [signInError, setSignInError] = useState<string | null>(null);

  useEffect(() => {
    const stored = loadStoredAuth();
    if (stored) {
      setUser(stored.user);
    }
    setIsLoading(false);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setSignInError(null);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Check credentials against mock store
    const storedPassword = MOCK_CREDENTIALS[email.toLowerCase()];
    if (!storedPassword || storedPassword !== password) {
      setSignInError("Invalid email or password. Please try again.");
      throw new Error("Invalid credentials");
    }

    const role = deriveRole(email);
    const mockUser: User = {
      id: `usr-${Date.now().toString(36)}`,
      email: email.toLowerCase(),
      name: email.split("@")[0] ?? email,
      groups: [role],
      customerId: role === "CustomerAdmin" ? "cust-001" : undefined,
      lastLogin: new Date().toISOString(),
      isActive: true,
    };

    const authData: StoredAuth = {
      user: mockUser,
      email: mockUser.email,
      groups: mockUser.groups,
      customerId: mockUser.customerId ?? null,
    };

    persistAuth(authData);
    setUser(mockUser);
    setSignInError(null);
  }, []);

  const signOut = useCallback(() => {
    clearAuth();
    setUser(null);
    setSignInError(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        email: user?.email ?? null,
        groups: user?.groups ?? [],
        isAuthenticated: !!user,
        isLoading,
        customerId: user?.customerId ?? null,
        signInError,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
