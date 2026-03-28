package com.ims.automation.dashboard;

import com.ims.NovusGuiTestBase;
import com.ims.actor.Actor;
import com.ims.annotations.MetaData;
import com.ims.automation.constants.TestGroups;
import com.ims.automation.impls.dashboard.DashboardImpl;
import com.ims.automation.macros.Login;
import com.ims.automation.macros.Navigate;
import com.ims.automation.pages.dashboard.DashboardPage;
import com.ims.automation.services.UrlService;
import com.ims.actions.Launch;
import com.ims.actions.Waiting;
import org.springframework.beans.factory.annotation.Autowired;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;

@Test(groups = {TestGroups.DASHBOARD, TestGroups.REGRESSION})
public class DashboardTests extends NovusGuiTestBase {

    @Autowired
    private UrlService urlService;
    private final Actor actor = new Actor();

    @BeforeClass(dependsOnMethods = "baseBeforeClassSetup")
    public void setup() {
        actor.setBrowser(browser);
        actor.attemptsTo(
                Launch.app(urlService.login()),
                Login.withCredentials("admin@ims.com", "password")
        );
    }

    @MetaData(testCaseId = "IMS-DASH-001", author = "ims-automation", category = "dashboard")
    @Test(description = "Verify KPI cards are displayed on the dashboard")
    public void verifyKpiCardsDisplayed() {
        step("Navigate to Dashboard");
        actor.attemptsTo(Navigate.to().dashboard());

        step("Verify KPI cards are visible");
        softly.assertTrue(
                actor.is(Waiting.on(DashboardPage.KPI_CARD)),
                "KPI cards should be visible on the dashboard"
        );
        softly.assertAll();
    }

    @MetaData(testCaseId = "IMS-DASH-002", author = "ims-automation", category = "dashboard")
    @Test(description = "Verify quick actions panel is displayed")
    public void verifyQuickActionsDisplayed() {
        step("Verify quick actions panel is visible");
        softly.assertTrue(
                actor.is(Waiting.on(DashboardPage.QUICK_ACTIONS_PANEL)),
                "Quick actions panel should be visible"
        );
        softly.assertAll();
    }

    @MetaData(testCaseId = "IMS-DASH-003", author = "ims-automation", category = "dashboard")
    @Test(description = "Verify dashboard refresh updates data")
    public void verifyDashboardRefresh() {
        step("Click the refresh button");
        actor.attemptsTo(DashboardImpl.refreshDashboard());

        step("Verify KPI cards are still visible after refresh");
        softly.assertTrue(
                actor.is(Waiting.on(DashboardPage.KPI_CARD)),
                "KPI cards should remain visible after refresh"
        );
        softly.assertAll();
    }

    @MetaData(testCaseId = "IMS-DASH-004", author = "ims-automation", category = "dashboard")
    @Test(description = "Verify system status section is displayed")
    public void verifySystemStatusDisplayed() {
        step("Verify system status section is visible");
        softly.assertTrue(
                actor.is(Waiting.on(DashboardPage.SYSTEM_STATUS)),
                "System status section should be visible"
        );
        softly.assertAll();
    }
}
