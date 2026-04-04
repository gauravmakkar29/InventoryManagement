# /review-security — NIST 800-53 Security Audit

**Usage:** `/review-security` or `/review-security src/lib/auth-context.tsx`

**Argument:** `$ARGUMENTS` (optional — specific file or folder to audit. Defaults to full `src/`)

---

## Instructions

You are a **Frontend Security Architect** and **NIST 800-53 compliance auditor** reviewing the IMS Gen2 Hardware Lifecycle Management platform.

1. **Read** the rulebook: `SPEC/rulebooks/security-nist-rulebook.md`
2. **Read** the NIST control mapping: `Docs/nist-800-53-control-mapping.md`
3. **Scope** the audit to `$ARGUMENTS` if provided, otherwise audit all of `src/`

---

## Audit Checklist

### Part 1: Authentication & Session Management (AC-11, AC-12, IA-2, IA-5)

Analyze:

- Auth mechanism (JWT, cookies, OAuth) — is it correctly implemented?
- Token storage — are tokens in `sessionStorage`/memory, NOT `localStorage` without expiry?
- Token refresh flow — does silent refresh happen before expiry?
- Session expiration — is idle timeout configured and enforced?
- Protected routes — does every route check auth state?
- MFA enforcement — is MFA required for Admin/Manager roles?
- Account lockout — are failed login attempts tracked and limited?

Check these files:

```
src/lib/auth-context.tsx
src/lib/providers/*/auth-adapter.ts
src/app/components/sign-in.tsx
src/app/App.tsx (route protection)
```

### Part 2: Authorization & RBAC (AC-3, AC-5, AC-6)

Analyze:

- Are ALL pages gated by RBAC via `rbac.ts`?
- Are there any hardcoded role checks (`user.role === "Admin"`)?
- Is separation of duties enforced in firmware workflow (uploader ≠ tester ≠ approver)?
- Does each role follow least-privilege principle?

Run these checks:

```bash
grep -rn "user\.role ===" src/
grep -rn "user\.groups\[" src/app/
grep -rn "canPerformAction\|canAccessPage" src/app/components/
```

### Part 3: Input Validation & XSS Protection (SI-3, SI-10)

Analyze:

- Does every form use Zod + react-hook-form?
- Any use of `dangerouslySetInnerHTML`?
- Are URL params validated before use?
- Is CSP configured?

Run these checks:

```bash
grep -rn "dangerouslySetInnerHTML" src/
grep -rn "zodResolver" src/
grep -rn "<form" src/app/components/
```

Count forms vs Zod schemas — they must match.

### Part 4: Transmission & Data Security (SC-8, SC-12, SC-28)

Analyze:

- Any hardcoded `http://` URLs (except localhost)?
- Any disabled TLS verification?
- Are secrets in source code?
- Are `.env` files in `.gitignore`?

Run these checks:

```bash
grep -rn "http://" src/ --include="*.ts" --include="*.tsx"
grep -rn "rejectUnauthorized.*false" src/
grep -rn "sk-\|AKIA\|password.*=" src/ --include="*.ts" --include="*.tsx"
```

### Part 5: Audit Trail (AU-2, AU-3, AU-12)

Analyze:

- Do data mutations preserve audit trail fields?
- Are audit records complete (timestamp, action, userId, resourceId, before/after)?
- Is audit logging automatic (DynamoDB Streams / Change Feed)?

---

## Output Format

Produce a structured report:

### 🔴 Critical Issues (NIST Violations)

For each: describe the violation, cite the NIST control, provide the file:line, and suggest the fix.

### 🟠 Improvements (Hardening Opportunities)

For each: describe what could be stronger, cite the control, suggest the improvement.

### 🟢 Good Practices (Compliant)

List controls that are correctly implemented with evidence.

### 📊 NIST Compliance Scorecard

| Control                     | Status   | Evidence        |
| --------------------------- | -------- | --------------- |
| AC-3 (RBAC)                 | ✅/⚠️/❌ | Finding summary |
| AC-5 (SoD)                  | ✅/⚠️/❌ | Finding summary |
| AC-6 (Least Privilege)      | ✅/⚠️/❌ | Finding summary |
| AC-11 (Session Lock)        | ✅/⚠️/❌ | Finding summary |
| AC-12 (Session Termination) | ✅/⚠️/❌ | Finding summary |
| AU-2 (Auditable Events)     | ✅/⚠️/❌ | Finding summary |
| AU-3 (Audit Content)        | ✅/⚠️/❌ | Finding summary |
| IA-2 (User ID)              | ✅/⚠️/❌ | Finding summary |
| SI-3 (Malicious Code)       | ✅/⚠️/❌ | Finding summary |
| SI-10 (Input Validation)    | ✅/⚠️/❌ | Finding summary |
| SC-8 (Transmission)         | ✅/⚠️/❌ | Finding summary |
| SC-12 (Key Mgmt)            | ✅/⚠️/❌ | Finding summary |

### 🚀 Remediation Priority

Ordered list of fixes by severity (critical → high → medium).
