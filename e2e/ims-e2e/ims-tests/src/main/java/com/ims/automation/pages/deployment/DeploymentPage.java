package com.ims.automation.pages.deployment;

import com.ims.locatorstrategy.LocateBy;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class DeploymentPage {
    public static final String FIRMWARE_TAB = LocateBy.css("[data-testid='tab-firmware']");
    public static final String AUDIT_LOG_TAB = LocateBy.css("[data-testid='tab-audit-log']");
    public static final String FIRMWARE_CARD = LocateBy.css("[data-testid='firmware-card']");
    public static final String APPROVAL_STAGE_INDICATOR = LocateBy.css("[data-testid='approval-stage']");
    public static final String UPLOAD_BUTTON = LocateBy.css("[data-testid='firmware-upload']");
    public static final String AUDIT_LOG_TABLE = LocateBy.css("[data-testid='audit-log-table']");
    public static final String AUDIT_LOG_ROW = LocateBy.css("[data-testid='audit-log-table'] tbody tr");
    public static final String PAGE_HEADING = LocateBy.text("Deployment");
}
