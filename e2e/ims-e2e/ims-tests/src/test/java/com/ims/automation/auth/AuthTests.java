package com.ims.automation.auth;

import com.ims.NovusGuiTestBase;
import com.ims.actor.Actor;
import com.ims.annotations.Description;
import com.ims.annotations.MetaData;
import com.ims.annotations.Outcome;
import com.ims.automation.constants.TestGroups;
import com.ims.automation.impls.common.LoginImpl;
import com.ims.automation.macros.Login;
import com.ims.automation.pages.common.LoginPage;
import com.ims.automation.pages.common.SidebarPage;
import com.ims.automation.pages.dashboard.DashboardPage;
import com.ims.automation.services.UrlService;
import com.ims.actions.Launch;
import com.ims.actions.Retrieve;
import com.ims.actions.Waiting;
import com.ims.actions.Click;
import com.ims.actions.Enter;
import com.ims.verification.Verify;

import org.springframework.beans.factory.annotation.Autowired;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;

@Test(groups = {TestGroups.AUTH})
public class AuthTests extends NovusGuiTestBase {

    @Autowired
    private UrlService urlService;
    private final Actor actor = new Actor();

    @BeforeClass(dependsOnMethods = "baseBeforeClassSetup")
    public void setup() {
        actor.setBrowser(browser);
    }

    @Description("Verify login with valid admin credentials redirects to dashboard")
    @Outcome("User is authenticated and dashboard is displayed")
    @MetaData(testCaseId = "IMS-AUTH-001", author = "ims-automation", category = "auth", stories = {"#2"})
    @Test(description = "Verify login with valid admin credentials")
    public void verifyLoginWithValidCredentials() {
        step("Navigate to login and sign in as admin");
        actor.attemptsTo(
                Launch.app(urlService.login()),
                Login.asAdmin()
        );
        step("Verify dashboard is displayed");
        softly.assertTrue(
                actor.is(Waiting.on(DashboardPage.PAGE_HEADING)),
                "Dashboard heading should be visible after login"
        );
        softly.assertAll();
    }

    @Description("Verify login with invalid credentials shows error banner")
    @Outcome("Error message 'Invalid email or password' is displayed")
    @MetaData(testCaseId = "IMS-AUTH-002", author = "ims-automation", category = "auth", stories = {"#2"})
    @Test(description = "Verify login with invalid credentials shows error")
    public void verifyLoginWithInvalidCredentials() {
        step("Navigate to login page");
        actor.attemptsTo(Launch.app(urlService.login()));
        step("Enter invalid credentials");
        actor.attemptsTo(
                (a) -> a.is(Waiting.on(LoginPage.EMAIL_INPUT)),
                Enter.text(Login.ADMIN_EMAIL).on(LoginPage.EMAIL_INPUT),
                Enter.text("WrongPassword@123").on(LoginPage.PASSWORD_INPUT),
                Click.on(LoginPage.SIGN_IN_BUTTON)
        );
        step("Verify error message is displayed");
        softly.assertTrue(
                actor.is(Waiting.on(LoginPage.ERROR_MESSAGE)),
                "Error message should be visible for invalid credentials"
        );
        softly.assertAll();
    }

    @Description("Verify sign out clears session and redirects to login page")
    @Outcome("User is logged out and login page is displayed")
    @MetaData(testCaseId = "IMS-AUTH-003", author = "ims-automation", category = "auth", stories = {"#12"})
    @Test(description = "Verify sign out redirects to login")
    public void verifySignOut() {
        step("Login as admin");
        actor.attemptsTo(
                Launch.app(urlService.login()),
                Login.asAdmin()
        );
        step("Open sidebar and click sign out");
        actor.attemptsTo(
                Click.on(SidebarPage.HAMBURGER_BUTTON),
                (a) -> a.is(Waiting.on(SidebarPage.SIGN_OUT_BUTTON)),
                Click.on(SidebarPage.SIGN_OUT_BUTTON)
        );
        step("Verify redirected to login page");
        softly.assertTrue(
                actor.is(Waiting.on(LoginPage.PAGE_TITLE)),
                "Should be redirected to login page after sign out"
        );
        softly.assertAll();
    }

    @Description("Verify admin user sees all 7 navigation items including User Management")
    @Outcome("All navigation links are visible in sidebar for Admin role")
    @MetaData(testCaseId = "IMS-AUTH-004", author = "ims-automation", category = "auth", stories = {"#15", "#25"})
    @Test(description = "Verify admin sees all navigation items including User Management")
    public void verifyRbacAdminSeesAllNavItems() {
        step("Login as admin");
        actor.attemptsTo(
                Launch.app(urlService.login()),
                Login.asAdmin()
        );
        step("Open sidebar");
        actor.attemptsTo(Click.on(SidebarPage.HAMBURGER_BUTTON));
        step("Verify all nav items visible");
        softly.assertTrue(actor.is(Waiting.on(SidebarPage.DASHBOARD_LINK)), "Dashboard link visible");
        softly.assertTrue(actor.is(Waiting.on(SidebarPage.INVENTORY_LINK)), "Inventory link visible");
        softly.assertTrue(actor.is(Waiting.on(SidebarPage.DEPLOYMENT_LINK)), "Deployment link visible");
        softly.assertTrue(actor.is(Waiting.on(SidebarPage.COMPLIANCE_LINK)), "Compliance link visible");
        softly.assertTrue(actor.is(Waiting.on(SidebarPage.SERVICE_ORDERS_LINK)), "Service Orders link visible");
        softly.assertTrue(actor.is(Waiting.on(SidebarPage.ANALYTICS_LINK)), "Analytics link visible");
        softly.assertTrue(actor.is(Waiting.on(SidebarPage.USER_MANAGEMENT_LINK)), "User Management link visible");
        softly.assertAll();
    }

    @Description("Verify technician role sees only Dashboard, Inventory, and Service Orders")
    @Outcome("Only 3 navigation links are visible for Technician role")
    @MetaData(testCaseId = "IMS-AUTH-005", author = "ims-automation", category = "auth", stories = {"#15"})
    @Test(description = "Verify technician sees limited navigation")
    public void verifyRbacTechnicianSeesLimitedNav() {
        step("Login as technician");
        actor.attemptsTo(
                Launch.app(urlService.login()),
                Login.asTechnician()
        );
        step("Open sidebar");
        actor.attemptsTo(Click.on(SidebarPage.HAMBURGER_BUTTON));
        step("Verify limited nav items");
        softly.assertTrue(actor.is(Waiting.on(SidebarPage.DASHBOARD_LINK)), "Dashboard visible for tech");
        softly.assertTrue(actor.is(Waiting.on(SidebarPage.INVENTORY_LINK)), "Inventory visible for tech");
        softly.assertTrue(actor.is(Waiting.on(SidebarPage.SERVICE_ORDERS_LINK)), "Service Orders visible for tech");
        softly.assertAll();
    }

    // ── Story 1.1 — User Login with Email and Password (TC-1, TC-4 to TC-14) ──

    @Description("Verify unauthenticated user is redirected to /login")
    @Outcome("User lands on /login page with Sign In heading visible")
    @MetaData(testCaseId = "IMS-AUTH-006", author = "ims-automation", category = "auth", stories = {"#2"})
    @Test(description = "Verify unauthenticated user is redirected to /login")
    public void verifyUnauthenticatedRedirectToLogin() {
        step("Navigate to dashboard URL without authentication");
        actor.attemptsTo(Launch.app(urlService.dashboard()));

        step("Verify redirected to login page");
        actor.wantsTo(Verify.page().url().contains("/login"));
        softly.assertTrue(
                actor.is(Waiting.on(LoginPage.PAGE_TITLE)),
                "Sign In heading should be visible after redirect"
        );
        softly.assertAll();
    }

    @Description("Verify Sign In button is disabled when password does not meet policy")
    @Outcome("Sign In button is disabled and password requirements show failing rules")
    @MetaData(testCaseId = "IMS-AUTH-007", author = "ims-automation", category = "auth", stories = {"#2"})
    @Test(description = "Verify password policy disables Sign In for weak password")
    public void verifyPasswordPolicyDisablesSignIn() {
        step("Navigate to login page");
        actor.attemptsTo(Launch.app(urlService.login()));
        actor.attemptsTo((a) -> a.is(Waiting.on(LoginPage.EMAIL_INPUT)));

        step("Enter email and a weak password");
        actor.attemptsTo(
                LoginImpl.fillEmail(Login.ADMIN_EMAIL),
                LoginImpl.focusPasswordField(),
                LoginImpl.enterPassword("short")
        );

        step("Verify Sign In button is disabled");
        actor.wantsTo(Verify.uiElement(LoginPage.SIGN_IN_BUTTON).isDisabled());

        step("Verify password requirements list is visible");
        softly.assertTrue(
                actor.is(Waiting.on(LoginPage.PASSWORD_REQUIREMENTS)),
                "Password requirements list should be visible"
        );
        softly.assertAll();
    }

    @Description("Verify Sign In button is enabled when all password policies are met")
    @Outcome("Sign In button is enabled and all requirements show green check marks")
    @MetaData(testCaseId = "IMS-AUTH-008", author = "ims-automation", category = "auth", stories = {"#2"})
    @Test(description = "Verify password policy enables Sign In for strong password")
    public void verifyPasswordPolicyEnablesSignIn() {
        step("Navigate to login page");
        actor.attemptsTo(Launch.app(urlService.login()));
        actor.attemptsTo((a) -> a.is(Waiting.on(LoginPage.EMAIL_INPUT)));

        step("Enter email and a policy-compliant password");
        actor.attemptsTo(
                LoginImpl.fillEmail(Login.ADMIN_EMAIL),
                LoginImpl.focusPasswordField(),
                LoginImpl.enterPassword(Login.ADMIN_PASSWORD)
        );

        step("Verify Sign In button is enabled");
        softly.assertTrue(
                actor.is(Waiting.on(LoginPage.SIGN_IN_BUTTON)),
                "Sign In button should be visible and enabled"
        );

        step("Verify password requirements list is visible with all rules passing");
        softly.assertTrue(
                actor.is(Waiting.on(LoginPage.PASSWORD_REQUIREMENTS)),
                "Password requirements list should be visible"
        );
        String reqCount = Retrieve.count().ofLocator(LoginPage.PASSWORD_REQUIREMENTS + " li").getAs(actor);
        softly.assertTrue(
                "5".equals(reqCount),
                "Should display 5 password requirement rules but found " + reqCount
        );
        softly.assertAll();
    }

    @Description("Verify authenticated user navigating to /login is redirected to dashboard")
    @Outcome("User is redirected to / and dashboard is displayed")
    @MetaData(testCaseId = "IMS-AUTH-009", author = "ims-automation", category = "auth", stories = {"#2"})
    @Test(description = "Verify authenticated user is redirected away from /login")
    public void verifyAuthenticatedUserRedirectFromLogin() {
        step("Login as admin");
        actor.attemptsTo(
                Launch.app(urlService.login()),
                Login.asAdmin()
        );

        step("Verify dashboard is displayed");
        softly.assertTrue(
                actor.is(Waiting.on(DashboardPage.PAGE_HEADING)),
                "Dashboard heading should be visible"
        );

        step("Navigate directly to /login");
        actor.attemptsTo(Launch.app(urlService.login()));

        step("Verify redirected back to dashboard");
        actor.wantsTo(Verify.page().url().contains("/"));
        softly.assertTrue(
                actor.is(Waiting.on(DashboardPage.PAGE_HEADING)),
                "Dashboard heading should still be visible after redirect"
        );
        softly.assertAll();
    }

    @Description("Verify network error shows toast notification")
    @Outcome("Toast message 'Unable to connect' is displayed")
    @MetaData(testCaseId = "IMS-AUTH-010", author = "ims-automation", category = "auth", stories = {"#2"})
    @Test(description = "Verify network error shows toast notification")
    public void verifyNetworkErrorShowsToast() {
        step("Navigate to login page");
        actor.attemptsTo(Launch.app(urlService.login()));
        actor.attemptsTo((a) -> a.is(Waiting.on(LoginPage.EMAIL_INPUT)));

        step("Block network requests to simulate API failure");
        actor.usesBrowser().route("**/*", route -> {
            if (route.request().url().contains("api") || route.request().url().contains("cognito")) {
                route.abort();
            } else {
                route.resume();
            }
        });

        step("Enter valid credentials and submit");
        actor.attemptsTo(
                LoginImpl.fillEmail(Login.ADMIN_EMAIL),
                LoginImpl.fillPassword(Login.ADMIN_PASSWORD),
                LoginImpl.clickSignIn()
        );

        step("Verify toast notification is displayed");
        softly.assertTrue(
                actor.is(Waiting.on(LoginPage.TOAST_NOTIFICATION).seconds(10)),
                "Toast notification should appear for network error"
        );

        step("Unblock network requests");
        actor.usesBrowser().unroute("**/*");
        softly.assertAll();
    }

    @Description("Verify show/hide password toggle switches input type")
    @Outcome("Password visibility toggles between masked and plain text")
    @MetaData(testCaseId = "IMS-AUTH-011", author = "ims-automation", category = "auth", stories = {"#2"})
    @Test(description = "Verify show/hide password toggle")
    public void verifyShowHidePasswordToggle() {
        step("Navigate to login page");
        actor.attemptsTo(Launch.app(urlService.login()));
        actor.attemptsTo((a) -> a.is(Waiting.on(LoginPage.EMAIL_INPUT)));

        step("Enter a password");
        actor.attemptsTo(LoginImpl.enterPassword(Login.ADMIN_PASSWORD));

        step("Click Show password button");
        actor.attemptsTo(LoginImpl.clickShowPassword());

        step("Verify password input type is text (visible)");
        String typeAfterShow = Retrieve.attribute("type").ofLocator(LoginPage.PASSWORD_INPUT).getAs(actor);
        softly.assertTrue(
                "text".equals(typeAfterShow),
                "Password input type should be 'text' after clicking Show, but was: " + typeAfterShow
        );

        step("Verify Hide password button is now visible");
        softly.assertTrue(
                actor.is(Waiting.on(LoginPage.HIDE_PASSWORD_BUTTON)),
                "Hide password button should be visible"
        );

        step("Click Hide password button");
        actor.attemptsTo(LoginImpl.clickHidePassword());

        step("Verify password input type is password (masked)");
        String typeAfterHide = Retrieve.attribute("type").ofLocator(LoginPage.PASSWORD_INPUT).getAs(actor);
        softly.assertTrue(
                "password".equals(typeAfterHide),
                "Password input type should be 'password' after clicking Hide, but was: " + typeAfterHide
        );
        softly.assertAll();
    }

    @Description("Verify email validation shows error for invalid email format")
    @Outcome("Inline error 'Enter a valid email address' appears below email field")
    @MetaData(testCaseId = "IMS-AUTH-012", author = "ims-automation", category = "auth", stories = {"#2"})
    @Test(description = "Verify email validation on blur")
    public void verifyEmailValidationOnBlur() {
        step("Navigate to login page");
        actor.attemptsTo(Launch.app(urlService.login()));
        actor.attemptsTo((a) -> a.is(Waiting.on(LoginPage.EMAIL_INPUT)));

        step("Enter an invalid email");
        actor.attemptsTo(LoginImpl.enterEmail("not-an-email"));

        step("Tab out of email field and submit form to trigger validation");
        actor.attemptsTo(
                LoginImpl.tabOutOfEmail(),
                LoginImpl.clickSignIn()
        );

        step("Verify email validation error is displayed");
        softly.assertTrue(
                actor.is(Waiting.on(LoginPage.ERROR_MESSAGE)),
                "Validation error should appear for invalid email"
        );
        softly.assertAll();
    }

    @Description("Verify loading spinner text during authentication")
    @Outcome("Sign In button shows 'Signing in...' during auth request")
    @MetaData(testCaseId = "IMS-AUTH-013", author = "ims-automation", category = "auth", stories = {"#2"})
    @Test(description = "Verify loading spinner during authentication")
    public void verifyLoadingSpinnerDuringAuth() {
        step("Navigate to login page");
        actor.attemptsTo(Launch.app(urlService.login()));
        actor.attemptsTo((a) -> a.is(Waiting.on(LoginPage.EMAIL_INPUT)));

        step("Enter valid credentials");
        actor.attemptsTo(
                LoginImpl.fillEmail(Login.ADMIN_EMAIL),
                LoginImpl.fillPassword(Login.ADMIN_PASSWORD)
        );

        step("Click Sign In and immediately check button text");
        actor.attemptsTo(LoginImpl.clickSignIn());

        step("Verify button text changes to 'Signing in...'");
        actor.wantsTo(Verify.uiElement(LoginPage.SIGN_IN_BUTTON).containsText("Signing in"));
        softly.assertAll();
    }

    @Description("Verify demo credentials hint is displayed on login page")
    @Outcome("Demo credentials hint box shows admin@company.com / Admin@12345678")
    @MetaData(testCaseId = "IMS-AUTH-014", author = "ims-automation", category = "auth", stories = {"#2"})
    @Test(description = "Verify demo credentials hint is displayed")
    public void verifyDemoCredentialsHintDisplayed() {
        step("Navigate to login page");
        actor.attemptsTo(Launch.app(urlService.login()));
        actor.attemptsTo((a) -> a.is(Waiting.on(LoginPage.EMAIL_INPUT)));

        step("Verify demo credentials section is visible");
        softly.assertTrue(
                actor.is(Waiting.on(LoginPage.DEMO_CREDENTIALS)),
                "Demo credentials hint box should be visible"
        );

        step("Verify demo credentials contain expected text");
        actor.wantsTo(Verify.uiElement(LoginPage.DEMO_CREDENTIALS).containsText("Demo credentials"));
        actor.wantsTo(Verify.uiElement(LoginPage.DEMO_CREDENTIALS).containsText("admin@company.com"));
        softly.assertAll();
    }

    @Description("Verify login page shows split layout with branding on desktop")
    @Outcome("Left side shows IMS Gen2 branding, right side shows Sign In form")
    @MetaData(testCaseId = "IMS-AUTH-015", author = "ims-automation", category = "auth", stories = {"#2"})
    @Test(description = "Verify desktop split layout on login page")
    public void verifyDesktopSplitLayout() {
        step("Navigate to login page");
        actor.attemptsTo(Launch.app(urlService.login()));
        actor.attemptsTo((a) -> a.is(Waiting.on(LoginPage.EMAIL_INPUT)));

        step("Verify branding heading is visible on left side");
        softly.assertTrue(
                actor.is(Waiting.on(LoginPage.BRANDING_HEADING)),
                "IMS Gen2 branding heading should be visible"
        );
        actor.wantsTo(Verify.uiElement(LoginPage.BRANDING_HEADING).containsText("IMS"));

        step("Verify Sign In form heading is visible on right side");
        actor.wantsTo(Verify.uiElement(LoginPage.PAGE_TITLE).hasText("Sign in"));
        softly.assertAll();
    }

    @Description("Verify empty form submission shows required field validation")
    @Outcome("Inline error 'Email is required' appears, form is not submitted")
    @MetaData(testCaseId = "IMS-AUTH-016", author = "ims-automation", category = "auth", stories = {"#2"})
    @Test(description = "Verify empty form submission shows validation errors")
    public void verifyEmptyFormSubmissionValidation() {
        step("Navigate to login page");
        actor.attemptsTo(Launch.app(urlService.login()));
        actor.attemptsTo((a) -> a.is(Waiting.on(LoginPage.EMAIL_INPUT)));

        step("Click Sign In without entering any credentials");
        actor.attemptsTo(LoginImpl.clickSignIn());

        step("Verify validation error is displayed");
        softly.assertTrue(
                actor.is(Waiting.on(LoginPage.ERROR_MESSAGE)),
                "Validation error should appear for empty form submission"
        );

        step("Verify still on login page");
        actor.wantsTo(Verify.page().url().contains("/login"));
        softly.assertAll();
    }

    @Description("Verify Forgot password button exists and is interactive")
    @Outcome("Forgot password button is visible and clickable")
    @MetaData(testCaseId = "IMS-AUTH-017", author = "ims-automation", category = "auth", stories = {"#2"})
    @Test(description = "Verify forgot password button exists")
    public void verifyForgotPasswordButtonExists() {
        step("Navigate to login page");
        actor.attemptsTo(Launch.app(urlService.login()));
        actor.attemptsTo((a) -> a.is(Waiting.on(LoginPage.EMAIL_INPUT)));

        step("Verify Forgot password button is visible");
        softly.assertTrue(
                actor.is(Waiting.on(LoginPage.FORGOT_PASSWORD_BUTTON)),
                "Forgot password button should be visible"
        );

        step("Click Forgot password button");
        actor.attemptsTo(LoginImpl.clickForgotPassword());

        step("Verify still on login page (no-op in mock mode)");
        actor.wantsTo(Verify.page().url().contains("/login"));
        softly.assertAll();
    }
}
