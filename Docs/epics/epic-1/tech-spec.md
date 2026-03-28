# Epic 1: Authentication & User Management — Technical Specification

**Epic:** Epic 1 — Authentication & User Management
**Brief Reference:** FR-7, Section 5 (Cognito, RBAC, MFA, 5 Groups, Session Management)

---

## 1. Overview

This epic implements the complete authentication and user management layer for IMS Gen2 HLM. It covers Cognito User Pool integration, RBAC enforcement across 5 groups, optional TOTP MFA, session lifecycle management, and a user administration interface for Admin users.

---

## 2. Data Models

### 2.1 User Entity (DynamoDB)

```typescript
{
  PK: "USER#<uuid>",
  SK: "USER#<uuid>",
  entityType: "User",
  email: string,
  givenName: string,
  familyName: string,
  role: "Admin" | "Manager" | "Technician" | "Viewer" | "CustomerAdmin",
  department: string,
  customerId: string,
  preferences: { theme: string, language: string, timezone: string },
  GSI1PK: "USER",
  GSI1SK: "<role>#<timestamp>",
  GSI3PK: "<email>",
  GSI3SK: "USER#<uuid>"
}
```

### 2.2 GSI Access Patterns

| GSI | PK | SK | Query |
|-----|----|----|-------|
| GSI1 | `"USER"` | `<role>#<timestamp>` | `listUsersByRole(role)` — filter by role prefix |
| GSI3 | `<email>` | `"USER#<uuid>"` | `getUserByEmail(email)` — lookup by email |

---

## 3. Cognito Configuration

### 3.1 User Pool Settings

| Setting | Value | NIST Control |
|---------|-------|-------------|
| Password Min Length | 12 characters | IA-5 |
| Require Uppercase | Yes | IA-5 |
| Require Lowercase | Yes | IA-5 |
| Require Numbers | Yes | IA-5 |
| Require Symbols | Yes | IA-5 |
| MFA | Optional TOTP | IA-2 |
| Access Token Expiry | 15 minutes | AC-11 |
| ID Token Expiry | 15 minutes | AC-11 |
| Refresh Token Expiry | 7 days | AC-12 |
| Account Recovery | EMAIL_ONLY | — |

### 3.2 Custom Attributes

- `custom:role` — RBAC role string
- `custom:department` — organizational unit
- `custom:customerId` — tenant scoping for CustomerAdmin

### 3.3 Cognito Groups (5)

| Group | Permissions |
|-------|------------|
| Admin | Full CRUD, firmware approval, stage advancement, user management |
| Manager | Create/Read/Update, stage advancement, no delete, no user management |
| Technician | Read all, update own items only |
| Viewer | Read-only across all entities |
| CustomerAdmin | Read own tenant data only (filtered by customerId) |

---

## 4. API Contracts

### 4.1 Queries

| Query | Auth | Resolver | Description |
|-------|------|----------|-------------|
| `getUserByEmail(email)` | Admin, Manager | `queryByGSI3.js` | Lookup user by email via GSI3 |
| `listUsersByRole(role)` | Admin only | `listByGSI1.js` | List users filtered by role via GSI1 |

### 4.2 Mutations

User creation and group assignment happen through Cognito Admin APIs (Lambda-backed or Terraform-provisioned), not through AppSync mutations directly. The User entity in DynamoDB is synced from Cognito via a post-confirmation Lambda trigger.

---

## 5. Component Hierarchy

```
src/
├── app/components/
│   └── sign-in.tsx              # Login page (email/password + MFA)
├── lib/
│   ├── auth-context.tsx         # AuthProvider React Context
│   ├── auth-context-instance.ts # Singleton for circular import prevention
│   └── use-auth.ts              # useAuth() hook
└── app/components/
    └── user-management.tsx      # Admin-only user list & management UI
```

### 5.1 AuthProvider Context Shape

```typescript
interface AuthContextValue {
  user: CognitoUser | null;
  email: string;
  groups: string[];        // Cognito group memberships
  isAuthenticated: boolean;
  isLoading: boolean;
  customerId: string;      // For tenant scoping
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setupMFA: () => Promise<string>;  // Returns TOTP setup URI
  verifyMFA: (code: string) => Promise<void>;
}
```

### 5.2 ProtectedLayout

Wraps all authenticated routes. Behavior:
- If `isLoading` is true, show spinner
- If `isAuthenticated` is false, redirect to `/login`
- If authenticated, render child routes with sidebar + header

### 5.3 Role-Based UI Guards

```typescript
// Component-level guard
function RequireRole({ roles, children }: { roles: string[], children: ReactNode }) {
  const { groups } = useAuth();
  if (!roles.some(r => groups.includes(r))) return null;
  return <>{children}</>;
}
```

---

## 6. Session Management

| Event | Behavior |
|-------|----------|
| Login success | Store tokens in memory (not localStorage for XSS safety) |
| Token refresh | Auto-refresh via Cognito SDK before expiry |
| Refresh failure | Clear context, redirect to `/login` with "Session expired" toast |
| Idle timeout | 15-minute access token expiry acts as session lock (NIST AC-11) |
| Explicit sign-out | Revoke refresh token, clear context, redirect to `/login` |

---

## 7. Security Considerations

- Passwords validated client-side (UX) AND server-side (Cognito policy enforcement)
- JWT tokens included in AppSync requests via Cognito authorization mode
- RBAC enforced at AppSync resolver level (Cognito group claims in JWT)
- No secrets stored in frontend code
- CSP headers prevent XSS vectors
- WAF rate-limiting protects login endpoint (2,000 requests/5 min per IP)
