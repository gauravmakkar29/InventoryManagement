package com.ims.automation.smoke;

import com.ims.NovusGuiTestBase;
import com.ims.actor.Actor;
import com.ims.annotations.MetaData;
import com.ims.automation.constants.TestGroups;
import com.ims.automation.macros.Login;
import com.ims.automation.pages.common.LoginPage;
import com.ims.automation.pages.common.SidebarPage;
import com.ims.automation.pages.dashboard.DashboardPage;
import com.ims.automation.services.UrlService;
import com.ims.actions.Click;
import com.ims.actions.Launch;
import com.ims.actions.Waiting;
import org.springframework.beans.factory.annotation.Autowired;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;

@Test(groups = {TestGroups.SMOKE})
public class SmokeTests extends NovusGuiTestBase {

    @Autowired
    private UrlService urlService;
    private final Actor actor = new Actor();

    @BeforeClass(dependsOnMethods = "baseBeforeClassSetup")
    public void setup() {
        actor.setBrowser(browser);
    }

    @MetaData(testCaseId = "IMS-SM-001", author = "ims-automation", category = "smoke")
    @Test(description = "Verify application loads and login page is accessible")
    public void verifyApplicationLoads() {
        step("Navigate to the application login page");
        actor.attemptsTo(Launch.app(urlService.login()));

        step("Verify the login page title is visible");
        softly.assertTrue(
                actor.is(Waiting.on(LoginPage.PAGE_TITLE)),
                "Login page title should be visible"
        );
        softly.assertAll();
    }

    @MetaData(testCaseId = "IMS-SM-002", author = "ims-automation", category = "smoke")
    @Test(description = "Verify dashboard loads after login")
    public void verifyDashboardLoadsAfterLogin() {
        step("Navigate to login page and authenticate");
        actor.attemptsTo(
                Launch.app(urlService.login()),
                Login.asAdmin()
        );

        step("Verify dashboard heading is visible");
        softly.assertTrue(
                actor.is(Waiting.on(DashboardPage.PAGE_HEADING)),
                "Dashboard page heading should be visible"
        );
        softly.assertAll();
    }

    @MetaData(testCaseId = "IMS-SM-003", author = "ims-automation", category = "smoke")
    @Test(description = "Verify all sidebar navigation links are present")
    public void verifySidebarLinksArePresent() {
        step("Open sidebar navigation");
        actor.attemptsTo(Click.on(SidebarPage.HAMBURGER_BUTTON));

        step("Verify Dashboard link exists in sidebar");
        softly.assertTrue(
                actor.is(Waiting.on(SidebarPage.DASHBOARD_LINK)),
                "Dashboard sidebar link should be visible"
        );

        step("Verify Inventory link exists in sidebar");
        softly.assertTrue(
                actor.is(Waiting.on(SidebarPage.INVENTORY_LINK)),
                "Inventory sidebar link should be visible"
        );

        step("Verify Deployment link exists in sidebar");
        softly.assertTrue(
                actor.is(Waiting.on(SidebarPage.DEPLOYMENT_LINK)),
                "Deployment sidebar link should be visible"
        );

        step("Verify Compliance link exists in sidebar");
        softly.assertTrue(
                actor.is(Waiting.on(SidebarPage.COMPLIANCE_LINK)),
                "Compliance sidebar link should be visible"
        );

        step("Verify Service Orders link exists in sidebar");
        softly.assertTrue(
                actor.is(Waiting.on(SidebarPage.SERVICE_ORDERS_LINK)),
                "Service Orders sidebar link should be visible"
        );

        step("Verify Analytics link exists in sidebar");
        softly.assertTrue(
                actor.is(Waiting.on(SidebarPage.ANALYTICS_LINK)),
                "Analytics sidebar link should be visible"
        );

        softly.assertAll();
    }
}
