import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import React from "react";
import { useAuth } from "../../lib/use-auth";
import { AuthContext } from "../../lib/auth-context-instance";
import type { AuthState } from "../../lib/types";

function createMockAuthState(overrides?: Partial<AuthState>): AuthState {
  return {
    user: null,
    email: null,
    groups: [],
    isAuthenticated: false,
    isLoading: false,
    customerId: null,
    signInError: null,
    mfaRequired: false,
    mfaEnabled: false,
    sessionExpiring: false,
    signIn: async () => {},
    verifyMfa: async () => {},
    setupMfa: async () => "",
    confirmMfaSetup: async () => {},
    signOut: () => {},
    extendSession: async () => {},
    ...overrides,
  };
}

describe("useAuth", () => {
  it("throws when used outside AuthProvider", () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow("useAuth must be used within an AuthProvider");
  });

  it("returns auth state when used inside AuthProvider", () => {
    const mockState = createMockAuthState({
      isAuthenticated: true,
      email: "admin@company.com",
      groups: ["Admin"],
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={mockState}>{children}</AuthContext.Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.email).toBe("admin@company.com");
    expect(result.current.groups).toEqual(["Admin"]);
  });

  it("returns unauthenticated state correctly", () => {
    const mockState = createMockAuthState();

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={mockState}>{children}</AuthContext.Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.email).toBeNull();
  });

  it("exposes signIn, signOut, and MFA methods", () => {
    const mockState = createMockAuthState();

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={mockState}>{children}</AuthContext.Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(typeof result.current.signIn).toBe("function");
    expect(typeof result.current.signOut).toBe("function");
    expect(typeof result.current.verifyMfa).toBe("function");
    expect(typeof result.current.setupMfa).toBe("function");
    expect(typeof result.current.confirmMfaSetup).toBe("function");
    expect(typeof result.current.extendSession).toBe("function");
  });

  it("reflects session expiring state", () => {
    const mockState = createMockAuthState({ sessionExpiring: true });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={mockState}>{children}</AuthContext.Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.sessionExpiring).toBe(true);
  });

  it("reflects MFA required state", () => {
    const mockState = createMockAuthState({ mfaRequired: true });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={mockState}>{children}</AuthContext.Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.mfaRequired).toBe(true);
  });
});
