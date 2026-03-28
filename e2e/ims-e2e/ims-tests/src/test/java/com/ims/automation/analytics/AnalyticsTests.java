package com.ims.automation.analytics;

import com.ims.NovusGuiTestBase;
import com.ims.actor.Actor;
import com.ims.annotations.MetaData;
import com.ims.automation.constants.TestGroups;
import com.ims.automation.impls.analytics.AnalyticsImpl;
import com.ims.automation.macros.Login;
import com.ims.automation.macros.Navigate;
import com.ims.automation.pages.analytics.AnalyticsPage;
import com.ims.automation.services.UrlService;
import com.ims.actions.Launch;
import com.ims.actions.Waiting;
import org.springframework.beans.factory.annotation.Autowired;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;

@Test(groups = {TestGroups.ANALYTICS, TestGroups.REGRESSION})
public class AnalyticsTests extends NovusGuiTestBase {

    @Autowired
    private UrlService urlService;
    private final Actor actor = new Actor();

    @BeforeClass(dependsOnMethods = "baseBeforeClassSetup")
    public void setup() {
        actor.setBrowser(browser);
        actor.attemptsTo(
                Launch.app(urlService.login()),
                Login.withCredentials("admin@ims.com", "password"),
                Navigate.to().analytics()
        );
    }

    @MetaData(testCaseId = "IMS-ANL-001", author = "ims-automation", category = "analytics")
    @Test(description = "Verify analytics page loads with KPI cards")
    public void verifyAnalyticsPageLoads() {
        step("Verify KPI cards are displayed");
        softly.assertTrue(
                actor.is(Waiting.on(AnalyticsPage.KPI_CARD)),
                "Analytics KPI cards should be visible"
        );
        softly.assertAll();
    }

    @MetaData(testCaseId = "IMS-ANL-002", author = "ims-automation", category = "analytics")
    @Test(description = "Verify chart containers are displayed")
    public void verifyChartsDisplayed() {
        step("Verify chart containers are visible");
        softly.assertTrue(
                actor.is(Waiting.on(AnalyticsPage.CHART_CONTAINER)),
                "Chart containers should be visible"
        );
        softly.assertAll();
    }

    @MetaData(testCaseId = "IMS-ANL-003", author = "ims-automation", category = "analytics")
    @Test(description = "Verify time range filter switching")
    public void verifyTimeRangeFilterSwitching() {
        step("Select 7-day time range");
        actor.attemptsTo(AnalyticsImpl.selectTimeRange7d());

        step("Select 30-day time range");
        actor.attemptsTo(AnalyticsImpl.selectTimeRange30d());

        step("Select 90-day time range");
        actor.attemptsTo(AnalyticsImpl.selectTimeRange90d());

        step("Verify charts are still visible after filter changes");
        softly.assertTrue(
                actor.is(Waiting.on(AnalyticsPage.CHART_CONTAINER)),
                "Charts should remain visible after time range changes"
        );
        softly.assertAll();
    }

    @MetaData(testCaseId = "IMS-ANL-004", author = "ims-automation", category = "analytics")
    @Test(description = "Verify audit table is displayed")
    public void verifyAuditTableDisplayed() {
        step("Verify audit table is visible");
        softly.assertTrue(
                actor.is(Waiting.on(AnalyticsPage.AUDIT_TABLE)),
                "Analytics audit table should be visible"
        );
        softly.assertAll();
    }
}
