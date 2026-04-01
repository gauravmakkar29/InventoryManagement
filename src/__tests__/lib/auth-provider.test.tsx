import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createAuthProvider } from "../../lib/providers/auth-provider";
import { createMockAuthAdapter } from "../../lib/providers/mock/mock-auth-adapter";
import { useAuth } from "../../lib/use-auth";

// Mock localStorage
const store: Record<string, string> = {};
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
  },
});

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  },
}));

/** Test component that exposes auth state */
function AuthConsumer() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="authenticated">{String(auth.isAuthenticated)}</span>
      <span data-testid="loading">{String(auth.isLoading)}</span>
      <span data-testid="email">{auth.email ?? "none"}</span>
      <span data-testid="groups">{auth.groups.join(",") || "none"}</span>
      <span data-testid="error">{auth.signInError ?? "none"}</span>
      <span data-testid="mfa-required">{String(auth.mfaRequired)}</span>
      <span data-testid="mfa-enabled">{String(auth.mfaEnabled)}</span>
      <button
        data-testid="sign-in"
        onClick={() => auth.signIn("admin@company.com", "Admin@12345678")}
      >
        Sign In
      </button>
      <button
        data-testid="sign-in-bad"
        onClick={() => auth.signIn("admin@company.com", "wrong").catch(() => {})}
      >
        Bad Sign In
      </button>
      <button data-testid="sign-out" onClick={() => auth.signOut()}>
        Sign Out
      </button>
    </div>
  );
}

describe("AuthProvider (generic + MockAuthAdapter)", () => {
  let AuthProvider: ReturnType<typeof createAuthProvider>;

  beforeEach(() => {
    Object.keys(store).forEach((key) => delete store[key]);
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const adapter = createMockAuthAdapter({ networkDelay: 0 });
    AuthProvider = createAuthProvider(adapter);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders children and starts unauthenticated", async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId("authenticated").textContent).toBe("false");
    expect(screen.getByTestId("email").textContent).toBe("none");
  });

  it("signs in with valid credentials", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await user.click(screen.getByTestId("sign-in"));

    expect(screen.getByTestId("authenticated").textContent).toBe("true");
    expect(screen.getByTestId("email").textContent).toBe("admin@company.com");
    expect(screen.getByTestId("groups").textContent).toBe("Admin");
  });

  it("shows error for invalid credentials", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await user.click(screen.getByTestId("sign-in-bad"));

    expect(screen.getByTestId("authenticated").textContent).toBe("false");
    expect(screen.getByTestId("error").textContent).toContain("Invalid email or password");
  });

  it("signs out successfully", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await user.click(screen.getByTestId("sign-in"));
    expect(screen.getByTestId("authenticated").textContent).toBe("true");

    await user.click(screen.getByTestId("sign-out"));
    expect(screen.getByTestId("authenticated").textContent).toBe("false");
    expect(screen.getByTestId("email").textContent).toBe("none");
  });

  it("restores session from localStorage on mount", async () => {
    // Pre-populate localStorage with a valid session
    const session = {
      user: {
        id: "usr-test",
        email: "admin@company.com",
        name: "admin",
        groups: ["Admin"],
        lastLogin: new Date().toISOString(),
        isActive: true,
      },
      groups: ["Admin"],
      customerId: null,
      accessTokenExpiresAt: Date.now() + 15 * 60 * 1000,
      refreshTokenExpiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    };
    store["ims-auth"] = JSON.stringify(session);

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId("authenticated").textContent).toBe("true");
    expect(screen.getByTestId("email").textContent).toBe("admin@company.com");
  });

  it("RBAC works — groups are passed through correctly", async () => {
    const adapter = createMockAuthAdapter({ networkDelay: 0 });
    const Provider = createAuthProvider(adapter);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    function RbacConsumer() {
      const auth = useAuth();
      return (
        <div>
          <span data-testid="groups">{auth.groups.join(",")}</span>
          <button
            data-testid="sign-in-viewer"
            onClick={() => auth.signIn("viewer@company.com", "Viewer@12345678")}
          >
            Sign In Viewer
          </button>
        </div>
      );
    }

    render(
      <Provider>
        <RbacConsumer />
      </Provider>,
    );

    await user.click(screen.getByTestId("sign-in-viewer"));
    expect(screen.getByTestId("groups").textContent).toBe("Viewer");
  });
});
