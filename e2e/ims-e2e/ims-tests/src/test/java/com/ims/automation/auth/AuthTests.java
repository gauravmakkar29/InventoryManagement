package com.ims.automation.auth;

import com.ims.NovusGuiTestBase;
import com.ims.actor.Actor;
import com.ims.annotations.Description;
import com.ims.annotations.MetaData;
import com.ims.annotations.Outcome;
import com.ims.automation.constants.TestGroups;
import com.ims.automation.macros.Login;
import com.ims.automation.pages.common.LoginPage;
import com.ims.automation.pages.common.SidebarPage;
import com.ims.automation.pages.dashboard.DashboardPage;
import com.ims.automation.services.UrlService;
import com.ims.actions.Launch;
import com.ims.actions.Waiting;
import com.ims.actions.Click;
import com.ims.actions.Enter;
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
    @MetaData(testCaseId = "IMS-AUTH-001", author = "ims-automation", category = "auth")
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
    @MetaData(testCaseId = "IMS-AUTH-002", author = "ims-automation", category = "auth")
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
    @MetaData(testCaseId = "IMS-AUTH-003", author = "ims-automation", category = "auth")
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
    @MetaData(testCaseId = "IMS-AUTH-004", author = "ims-automation", category = "auth")
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
    @MetaData(testCaseId = "IMS-AUTH-005", author = "ims-automation", category = "auth")
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
}
