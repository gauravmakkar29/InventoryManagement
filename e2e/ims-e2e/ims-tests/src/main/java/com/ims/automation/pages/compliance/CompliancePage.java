package com.ims.automation.pages.compliance;

import com.ims.locatorstrategy.LocateBy;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class CompliancePage {
    public static final String STATUS_FILTER_BUTTONS = LocateBy.css("[data-testid='compliance-status-filter']");
    public static final String COMPLIANCE_TABLE = LocateBy.css("[data-testid='compliance-table']");
    public static final String COMPLIANCE_TABLE_ROW = LocateBy.css("[data-testid='compliance-table'] tbody tr");
    public static final String VULNERABILITY_PANEL = LocateBy.css("[data-testid='vulnerability-panel']");
    public static final String SUBMIT_FOR_REVIEW_BUTTON = LocateBy.css("[data-testid='submit-review']");
    public static final String GENERATE_REPORT_BUTTON = LocateBy.css("[data-testid='generate-report']");
    public static final String PAGE_HEADING = LocateBy.text("Compliance");
}
