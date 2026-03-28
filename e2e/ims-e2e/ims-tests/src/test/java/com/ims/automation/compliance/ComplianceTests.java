package com.ims.automation.compliance;

import com.ims.NovusGuiTestBase;
import com.ims.actor.Actor;
import com.ims.annotations.MetaData;
import com.ims.automation.constants.TestGroups;
import com.ims.automation.impls.compliance.ComplianceImpl;
import com.ims.automation.macros.Login;
import com.ims.automation.macros.Navigate;
import com.ims.automation.pages.compliance.CompliancePage;
import com.ims.automation.services.UrlService;
import com.ims.actions.Launch;
import com.ims.actions.Waiting;
import org.springframework.beans.factory.annotation.Autowired;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;

@Test(groups = {TestGroups.COMPLIANCE, TestGroups.REGRESSION})
public class ComplianceTests extends NovusGuiTestBase {

    @Autowired
    private UrlService urlService;
    private final Actor actor = new Actor();

    @BeforeClass(dependsOnMethods = "baseBeforeClassSetup")
    public void setup() {
        actor.setBrowser(browser);
        actor.attemptsTo(
                Launch.app(urlService.login()),
                Login.withCredentials("admin@ims.com", "password"),
                Navigate.to().compliance()
        );
    }

    @MetaData(testCaseId = "IMS-CMP-001", author = "ims-automation", category = "compliance")
    @Test(description = "Verify compliance page loads with compliance table")
    public void verifyCompliancePageLoads() {
        step("Verify compliance table is displayed");
        softly.assertTrue(
                actor.is(Waiting.on(CompliancePage.COMPLIANCE_TABLE)),
                "Compliance table should be visible"
        );
        softly.assertAll();
    }

    @MetaData(testCaseId = "IMS-CMP-002", author = "ims-automation", category = "compliance")
    @Test(description = "Verify vulnerability panel is displayed")
    public void verifyVulnerabilityPanel() {
        step("Verify vulnerability panel is visible");
        softly.assertTrue(
                actor.is(Waiting.on(CompliancePage.VULNERABILITY_PANEL)),
                "Vulnerability panel should be visible"
        );
        softly.assertAll();
    }

    @MetaData(testCaseId = "IMS-CMP-003", author = "ims-automation", category = "compliance")
    @Test(description = "Verify generate report button is functional")
    public void verifyGenerateReportButton() {
        step("Verify generate report button is visible");
        softly.assertTrue(
                actor.is(Waiting.on(CompliancePage.GENERATE_REPORT_BUTTON)),
                "Generate report button should be visible"
        );
        softly.assertAll();
    }

    @MetaData(testCaseId = "IMS-CMP-004", author = "ims-automation", category = "compliance")
    @Test(description = "Verify submit for review button is present")
    public void verifySubmitForReviewButton() {
        step("Verify submit for review button is visible");
        softly.assertTrue(
                actor.is(Waiting.on(CompliancePage.SUBMIT_FOR_REVIEW_BUTTON)),
                "Submit for review button should be visible"
        );
        softly.assertAll();
    }
}
