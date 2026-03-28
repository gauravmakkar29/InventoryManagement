package com.ims.automation.impls.deployment;

import com.ims.actions.Click;
import com.ims.actions.Perform;
import com.ims.actions.Performable;
import com.ims.actions.Waiting;
import com.ims.automation.pages.deployment.DeploymentPage;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class DeploymentImpl {

    public static Performable switchToFirmwareTab() {
        return Perform.actions(
                Click.on(DeploymentPage.FIRMWARE_TAB)
                        .afterWaiting(Waiting.on(DeploymentPage.FIRMWARE_TAB))
        ).log("switchToFirmwareTab", "Switching to Firmware tab on Deployment page");
    }

    public static Performable switchToAuditLogTab() {
        return Perform.actions(
                Click.on(DeploymentPage.AUDIT_LOG_TAB)
                        .afterWaiting(Waiting.on(DeploymentPage.AUDIT_LOG_TAB))
        ).log("switchToAuditLogTab", "Switching to Audit Log tab on Deployment page");
    }

    public static Performable clickUpload() {
        return Perform.actions(
                Click.on(DeploymentPage.UPLOAD_BUTTON)
        ).log("clickUpload", "Clicking firmware upload button");
    }

    public static Performable waitForFirmwareCardsToLoad() {
        return Perform.actions(
                (actor) -> actor.is(Waiting.on(DeploymentPage.FIRMWARE_CARD))
        ).log("waitForFirmwareCardsToLoad", "Waiting for firmware cards to load");
    }
}
