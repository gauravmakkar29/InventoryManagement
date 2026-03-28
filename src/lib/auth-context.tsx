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

/**
 * Mock AuthProvider — simulates authentication with localStorage persistence.
 * Replace with Cognito / real IdP integration in production.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = loadStoredAuth();
    if (stored) {
      setUser(stored.user);
    }
    setIsLoading(false);
  }, []);

  const signIn = useCallback(async (email: string, _password: string) => {
    // Mock: accept any email/password combo
    const mockUser: User = {
      id: "usr-001",
      email,
      name: email.split("@")[0] ?? email,
      groups: ["admin", "operator"],
      customerId: "cust-001",
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
  }, []);

  const signOut = useCallback(() => {
    clearAuth();
    setUser(null);
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
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
