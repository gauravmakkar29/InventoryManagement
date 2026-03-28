package com.ims.automation.impls.compliance;

import com.ims.actions.Click;
import com.ims.actions.Perform;
import com.ims.actions.Performable;
import com.ims.actions.Waiting;
import com.ims.automation.pages.compliance.CompliancePage;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class ComplianceImpl {

    public static Performable filterByStatus() {
        return Perform.actions(
                Click.on(CompliancePage.STATUS_FILTER_BUTTONS)
        ).log("filterByStatus", "Clicking compliance status filter");
    }

    public static Performable submitForReview() {
        return Perform.actions(
                Click.on(CompliancePage.SUBMIT_FOR_REVIEW_BUTTON)
        ).log("submitForReview", "Clicking submit for review button");
    }

    public static Performable generateReport() {
        return Perform.actions(
                Click.on(CompliancePage.GENERATE_REPORT_BUTTON)
        ).log("generateReport", "Clicking generate report button");
    }

    public static Performable waitForComplianceTableToLoad() {
        return Perform.actions(
                (actor) -> actor.is(Waiting.on(CompliancePage.COMPLIANCE_TABLE))
        ).log("waitForComplianceTableToLoad", "Waiting for compliance table to load");
    }
}
