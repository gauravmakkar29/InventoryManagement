package com.ims.automation.accountservice;

import com.ims.NovusGuiTestBase;
import com.ims.actor.Actor;
import com.ims.annotations.MetaData;
import com.ims.automation.constants.TestGroups;
import com.ims.automation.impls.accountservice.AccountServiceImpl;
import com.ims.automation.macros.Login;
import com.ims.automation.macros.Navigate;
import com.ims.automation.pages.accountservice.AccountServicePage;
import com.ims.automation.services.UrlService;
import com.ims.actions.Launch;
import com.ims.actions.Waiting;
import org.springframework.beans.factory.annotation.Autowired;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;

@Test(groups = {TestGroups.ACCOUNT_SERVICE, TestGroups.REGRESSION})
public class AccountServiceTests extends NovusGuiTestBase {

    @Autowired
    private UrlService urlService;
    private final Actor actor = new Actor();

    @BeforeClass(dependsOnMethods = "baseBeforeClassSetup")
    public void setup() {
        actor.setBrowser(browser);
        actor.attemptsTo(
                Launch.app(urlService.login()),
                Login.withCredentials("admin@ims.com", "password"),
                Navigate.to().accountService()
        );
    }

    @MetaData(testCaseId = "IMS-ACC-001", author = "ims-automation", category = "account-service")
    @Test(description = "Verify account service page loads with Kanban view")
    public void verifyAccountServicePageLoads() {
        step("Verify Kanban columns are displayed");
        softly.assertTrue(
                actor.is(Waiting.on(AccountServicePage.KANBAN_COLUMN)),
                "Kanban columns should be visible"
        );
        softly.assertAll();
    }

    @MetaData(testCaseId = "IMS-ACC-002", author = "ims-automation", category = "account-service")
    @Test(description = "Verify switching to calendar view")
    public void verifySwitchToCalendarView() {
        step("Switch to Calendar view");
        actor.attemptsTo(AccountServiceImpl.switchToCalendarView());

        step("Verify calendar grid is displayed");
        softly.assertTrue(
                actor.is(Waiting.on(AccountServicePage.CALENDAR_GRID)),
                "Calendar grid should be visible"
        );
        softly.assertAll();
    }

    @MetaData(testCaseId = "IMS-ACC-003", author = "ims-automation", category = "account-service")
    @Test(description = "Verify create order button is present")
    public void verifyCreateOrderButton() {
        step("Verify create order button is visible");
        softly.assertTrue(
                actor.is(Waiting.on(AccountServicePage.CREATE_ORDER_BUTTON)),
                "Create order button should be visible"
        );
        softly.assertAll();
    }

    @MetaData(testCaseId = "IMS-ACC-004", author = "ims-automation", category = "account-service")
    @Test(description = "Verify switching back to Kanban view")
    public void verifySwitchBackToKanbanView() {
        step("Switch to Kanban view");
        actor.attemptsTo(AccountServiceImpl.switchToKanbanView());

        step("Verify Kanban columns are visible");
        softly.assertTrue(
                actor.is(Waiting.on(AccountServicePage.KANBAN_COLUMN)),
                "Kanban columns should be visible after switching back"
        );
        softly.assertAll();
    }
}
