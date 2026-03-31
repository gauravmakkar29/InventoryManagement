# Test Plan: Story 1.1 — User Login with Email and Password

| Field             | Value                                     |
| ----------------- | ----------------------------------------- |
| **Story**         | Story 1.1                                 |
| **Parent Issue**  | #2                                        |
| **Epic**          | Epic 1 — Authentication & User Management |
| **Generated**     | 2026-03-31                                |
| **QA Plan Issue** | #147                                      |

## Story Summary

As a platform user, I want to log in with my email and password, so that I can securely access the HLM platform.

## Acceptance Criteria Covered

- AC1: Unauthenticated user navigating to any route is redirected to `/login`
- AC2: Valid email + password → authenticated → redirected to Dashboard (`/`)
- AC3: Invalid credentials → red error banner "Invalid email or password. Please try again."
- AC4: Password not meeting policy (12+ chars, upper, lower, digit, symbol) → Sign In disabled + inline hints with check/x marks
- AC5: Already authenticated user navigating to `/login` → redirected to Dashboard
- AC6: Login API unreachable → toast "Unable to connect. Check your network and try again."

## Test Cases

### TC-1: Unauthenticated user is redirected to /login

- **Priority:** P1
- **AC:** AC1
- **Pre-conditions:** User is NOT authenticated (fresh browser session)
- **Steps:**
  1. Navigate to `http://localhost:5173/` (Dashboard route)
  2. Observe the URL
- **Expected Result:** URL changes to `/login`; Sign In heading (`h2`) is visible
- **Selector(s):** `h2` (PAGE_TITLE), URL assertion `/login`

### TC-2: Successful login with valid credentials redirects to Dashboard

- **Priority:** P1
- **AC:** AC2
- **Pre-conditions:** User is on `/login` page, not authenticated
- **Steps:**
  1. Wait for `input#signin-email` to be visible
  2. Enter `admin@company.com` into `input#signin-email`
  3. Enter `Admin@12345678` into `input#signin-password`
  4. Click `button[type='submit']` (Sign In)
  5. Wait for redirect
- **Expected Result:** URL is `/`; Dashboard page heading "Dashboard" is visible
- **Selector(s):** `input#signin-email`, `input#signin-password`, `button[type='submit']`, Dashboard PAGE_HEADING

### TC-3: Invalid credentials shows error banner

- **Priority:** P1
- **AC:** AC3
- **Pre-conditions:** User is on `/login` page, not authenticated
- **Steps:**
  1. Enter `admin@company.com` into `input#signin-email`
  2. Enter a policy-compliant but wrong password (e.g., `WrongPassword@123`) into `input#signin-password`
  3. Click `button[type='submit']`
  4. Wait for `[role='alert']` to appear
- **Expected Result:** A red error banner with AlertCircle icon appears containing text "Invalid email or password. Please try again." above the form. Form fields are cleared.
- **Selector(s):** `[role='alert']`, error banner CSS `.border-red-200.bg-red-50`

### TC-4: Password policy — Sign In disabled when policy not met

- **Priority:** P1
- **AC:** AC4
- **Pre-conditions:** User is on `/login` page
- **Steps:**
  1. Enter `admin@company.com` into `input#signin-email`
  2. Click/focus on `input#signin-password`
  3. Type `short` (does not meet 12+ chars, no uppercase, no digit, no symbol)
  4. Observe `button[type='submit']` state
  5. Observe `ul[aria-label='Password requirements']` list
- **Expected Result:** Sign In button is `disabled`. Password requirements list shows 5 rules: "At least 12 characters" (x), "One uppercase letter (A-Z)" (x), "One lowercase letter (a-z)" (check), "One digit (0-9)" (x), "One symbol (!@#$%^&\*)" (x). Only "lowercase" has a green check mark.
- **Selector(s):** `button[type='submit'][disabled]`, `ul[aria-label='Password requirements']`, list items with Check/X icons

### TC-5: Password policy — Sign In enabled when all policies met

- **Priority:** P1
- **AC:** AC4
- **Pre-conditions:** User is on `/login` page
- **Steps:**
  1. Enter `admin@company.com` into `input#signin-email`
  2. Enter `Admin@12345678` into `input#signin-password` (meets all 5 rules)
  3. Observe `button[type='submit']` state
  4. Observe `ul[aria-label='Password requirements']` list
- **Expected Result:** Sign In button is enabled (not disabled). All 5 password requirement items show green check marks.
- **Selector(s):** `button[type='submit']:not([disabled])`, `ul[aria-label='Password requirements']`

### TC-6: Authenticated user redirected away from /login

- **Priority:** P1
- **AC:** AC5
- **Pre-conditions:** User is already authenticated (logged in as admin)
- **Steps:**
  1. Login as admin via `Login.asAdmin()` macro
  2. Verify Dashboard is displayed
  3. Navigate directly to `/login`
  4. Observe the URL
- **Expected Result:** URL is `/` (redirected back to Dashboard); login page is NOT displayed
- **Selector(s):** URL assertion, Dashboard PAGE_HEADING

### TC-7: Network error shows toast notification

- **Priority:** P1
- **AC:** AC6
- **Pre-conditions:** User is on `/login` page; network/API is unreachable
- **Steps:**
  1. Simulate network failure (block API requests via route interception or offline mode)
  2. Enter valid credentials
  3. Click Sign In
  4. Observe toast notification area
- **Expected Result:** A Sonner toast appears with text "Unable to connect. Check your network and try again."
- **Selector(s):** Toast notification region (`[data-sonner-toaster]` or `region "Notifications alt+T"`), toast text

### TC-8: Show/Hide password toggle

- **Priority:** P2
- **Pre-conditions:** User is on `/login` page
- **Steps:**
  1. Enter `Admin@12345678` into `input#signin-password`
  2. Click `button[aria-label='Show password']`
  3. Observe password field `type` attribute
  4. Observe button aria-label changes
  5. Click `button[aria-label='Hide password']`
  6. Observe password field `type` attribute
- **Expected Result:** After first click: password is visible (type="text"), button label changes to "Hide password". After second click: password is masked (type="password"), button label changes to "Show password".
- **Selector(s):** `button[aria-label='Show password']`, `button[aria-label='Hide password']`, `input#signin-password`

### TC-9: Email validation on blur

- **Priority:** P2
- **Pre-conditions:** User is on `/login` page
- **Steps:**
  1. Click into `input#signin-email`
  2. Type `not-an-email`
  3. Tab out of the field (blur)
  4. Submit the form
  5. Observe inline error below email field
- **Expected Result:** Inline red error text "Enter a valid email address" appears below the email field with `role="alert"`
- **Selector(s):** `input#signin-email`, `[role='alert']` beneath email field (`.text-red-500`)

### TC-10: Loading spinner during authentication

- **Priority:** P2
- **Pre-conditions:** User is on `/login` page with valid credentials entered
- **Steps:**
  1. Enter valid credentials (`admin@company.com` / `Admin@12345678`)
  2. Click Sign In
  3. Immediately observe button text
- **Expected Result:** Button text changes to "Signing in..." while request is in progress (600ms simulated delay). Button should be in disabled/submitting state.
- **Selector(s):** `button[type='submit']`, text "Signing in..."

### TC-11: Demo credentials hint is displayed

- **Priority:** P2
- **Pre-conditions:** User is on `/login` page
- **Steps:**
  1. Navigate to `/login`
  2. Observe area below the form card
- **Expected Result:** A hint box displays "Demo credentials" label and "admin@company.com / Admin@12345678" text
- **Selector(s):** `.rounded-lg.bg-gray-50` (DEMO_CREDENTIALS), text assertions

### TC-12: Split layout — branding left, form right (desktop)

- **Priority:** P2
- **Pre-conditions:** Desktop viewport (>= 1024px width)
- **Steps:**
  1. Navigate to `/login` at desktop viewport
  2. Observe page layout
- **Expected Result:** Left half shows "IMS Gen2" branding with "Hardware Lifecycle Management Platform" text. Right half shows the Sign In form card.
- **Selector(s):** `h1` (IMS Gen2 heading on left), `h2` (Sign in heading on right)

### TC-13: Empty form submission — required field validation

- **Priority:** P3
- **Pre-conditions:** User is on `/login` page
- **Steps:**
  1. Leave email and password fields empty
  2. Click Sign In button
- **Expected Result:** Inline error "Email is required" appears below email field. Form is NOT submitted. (Note: Sign In may already be disabled if password is empty and has been focused, but if not focused, button is enabled — test the HTML5 required validation path)
- **Selector(s):** `[role='alert']`, form validation messages

### TC-14: Forgot password button exists and is clickable

- **Priority:** P3
- **Pre-conditions:** User is on `/login` page
- **Steps:**
  1. Observe "Forgot password?" button
  2. Click on it
- **Expected Result:** Button is visible, cursor is pointer. (Currently a no-op in mock mode — verify it exists and is interactive)
- **Selector(s):** Button with text "Forgot password?"

## Edge Cases

| TC    | Description                             | Priority |
| ----- | --------------------------------------- | -------- |
| TC-7  | Network error / API unreachable         | P1       |
| TC-13 | Empty form submission — required fields | P3       |
| TC-14 | Forgot password button presence         | P3       |

## Discovered Selectors

| Element                    | Selector                                 | Strategy    |
| -------------------------- | ---------------------------------------- | ----------- |
| Email input                | `input#signin-email`                     | CSS (id)    |
| Password input             | `input#signin-password`                  | CSS (id)    |
| Sign In button             | `button[type='submit']`                  | CSS (type)  |
| Error banner               | `[role='alert']`                         | role        |
| Show/Hide password         | `button[aria-label='Show password']`     | aria-label  |
| Password requirements list | `ul[aria-label='Password requirements']` | aria-label  |
| Remember me checkbox       | `input[name='remember']`                 | CSS (name)  |
| Forgot password button     | Button text "Forgot password?"           | text        |
| Demo credentials hint      | `.rounded-lg.bg-gray-50`                 | CSS (class) |
| Page title (Sign in)       | `h2`                                     | CSS (tag)   |
| Loading state text         | Button text "Signing in..."              | text        |
| Toast notification area    | `region "Notifications alt+T"`           | role/aria   |
| Branding heading           | `h1` (IMS Gen2)                          | CSS (tag)   |

## E2E Mapping

| TC    | Test Class | Test Method                              | testCaseId   | Status   |
| ----- | ---------- | ---------------------------------------- | ------------ | -------- |
| TC-1  | AuthTests  | verifyUnauthenticatedRedirectToLogin     | IMS-AUTH-006 | New      |
| TC-2  | AuthTests  | verifyLoginWithValidCredentials          | IMS-AUTH-001 | Existing |
| TC-3  | AuthTests  | verifyLoginWithInvalidCredentials        | IMS-AUTH-002 | Existing |
| TC-4  | AuthTests  | verifyPasswordPolicyDisablesSignIn       | IMS-AUTH-007 | New      |
| TC-5  | AuthTests  | verifyPasswordPolicyEnablesSignIn        | IMS-AUTH-008 | New      |
| TC-6  | AuthTests  | verifyAuthenticatedUserRedirectFromLogin | IMS-AUTH-009 | New      |
| TC-7  | AuthTests  | verifyNetworkErrorShowsToast             | IMS-AUTH-010 | New      |
| TC-8  | AuthTests  | verifyShowHidePasswordToggle             | IMS-AUTH-011 | New      |
| TC-9  | AuthTests  | verifyEmailValidationOnBlur              | IMS-AUTH-012 | New      |
| TC-10 | AuthTests  | verifyLoadingSpinnerDuringAuth           | IMS-AUTH-013 | New      |
| TC-11 | AuthTests  | verifyDemoCredentialsHintDisplayed       | IMS-AUTH-014 | New      |
| TC-12 | AuthTests  | verifyDesktopSplitLayout                 | IMS-AUTH-015 | New      |
| TC-13 | AuthTests  | verifyEmptyFormSubmissionValidation      | IMS-AUTH-016 | New      |
| TC-14 | AuthTests  | verifyForgotPasswordButtonExists         | IMS-AUTH-017 | New      |

## Notes

- Selectors confirmed via Playwright MCP live exploration on localhost:5175
- Login uses 600ms simulated network delay — TC-10 must assert during this window
- TC-7 (network error) requires Playwright route interception to simulate offline; uses Sonner toast (not inline error banner)
- Existing IMS-AUTH-001 and IMS-AUTH-002 cover TC-2 and TC-3 respectively — no new code needed for those
- IMS-AUTH-003 (sign out) and IMS-AUTH-004/005 (RBAC) belong to other stories, not Story 1.1
- Password hints only appear when password field has been focused AND has >0 characters
- The `signInError` state drives the error banner; form fields clear after failed login attempt
- No `data-testid` attributes found on login page — selectors rely on id, role, aria-label, and CSS class strategies
- `Remember me` checkbox and `Forgot password?` button are present but have no backend behavior in mock mode
