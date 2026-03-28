package com.ims.automation.deployment;

import com.ims.NovusGuiTestBase;
import com.ims.actor.Actor;
import com.ims.annotations.MetaData;
import com.ims.automation.constants.TestGroups;
import com.ims.automation.impls.deployment.DeploymentImpl;
import com.ims.automation.macros.Login;
import com.ims.automation.macros.Navigate;
import com.ims.automation.pages.deployment.DeploymentPage;
import com.ims.automation.services.UrlService;
import com.ims.actions.Launch;
import com.ims.actions.Waiting;
import org.springframework.beans.factory.annotation.Autowired;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;

@Test(groups = {TestGroups.DEPLOYMENT, TestGroups.REGRESSION})
public class DeploymentTests extends NovusGuiTestBase {

    @Autowired
    private UrlService urlService;
    private final Actor actor = new Actor();

    @BeforeClass(dependsOnMethods = "baseBeforeClassSetup")
    public void setup() {
        actor.setBrowser(browser);
        actor.attemptsTo(
                Launch.app(urlService.login()),
                Login.withCredentials("admin@ims.com", "password"),
                Navigate.to().deployment()
        );
    }

    @MetaData(testCaseId = "IMS-DEP-001", author = "ims-automation", category = "deployment")
    @Test(description = "Verify deployment page loads with firmware cards")
    public void verifyDeploymentPageLoads() {
        step("Verify firmware cards are displayed");
        softly.assertTrue(
                actor.is(Waiting.on(DeploymentPage.FIRMWARE_CARD)),
                "Firmware cards should be visible on the deployment page"
        );
        softly.assertAll();
    }

    @MetaData(testCaseId = "IMS-DEP-002", author = "ims-automation", category = "deployment")
    @Test(description = "Verify audit log tab displays data")
    public void verifyAuditLogTab() {
        step("Switch to Audit Log tab");
        actor.attemptsTo(DeploymentImpl.switchToAuditLogTab());

        step("Verify audit log table is visible");
        softly.assertTrue(
                actor.is(Waiting.on(DeploymentPage.AUDIT_LOG_TABLE)),
                "Audit log table should be visible"
        );
        softly.assertAll();
    }

    @MetaData(testCaseId = "IMS-DEP-003", author = "ims-automation", category = "deployment")
    @Test(description = "Verify firmware upload button is accessible")
    public void verifyFirmwareUploadButton() {
        step("Switch to Firmware tab");
        actor.attemptsTo(DeploymentImpl.switchToFirmwareTab());

        step("Verify upload button is visible");
        softly.assertTrue(
                actor.is(Waiting.on(DeploymentPage.UPLOAD_BUTTON)),
                "Firmware upload button should be visible"
        );
        softly.assertAll();
    }

    @MetaData(testCaseId = "IMS-DEP-004", author = "ims-automation", category = "deployment")
    @Test(description = "Verify approval stage indicator is displayed")
    public void verifyApprovalStageIndicator() {
        step("Verify approval stage indicator is visible");
        softly.assertTrue(
                actor.is(Waiting.on(DeploymentPage.APPROVAL_STAGE_INDICATOR)),
                "Approval stage indicator should be visible"
        );
        softly.assertAll();
    }
}
