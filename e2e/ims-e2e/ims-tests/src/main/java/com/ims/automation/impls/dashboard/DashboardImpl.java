package com.ims.automation.impls.dashboard;

import com.ims.actions.Click;
import com.ims.actions.Perform;
import com.ims.actions.Performable;
import com.ims.actions.Waiting;
import com.ims.automation.pages.dashboard.DashboardPage;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class DashboardImpl {

    public static Performable waitForDashboardToLoad() {
        return Perform.actions(
                (actor) -> actor.is(Waiting.on(DashboardPage.KPI_CARD))
        ).log("waitForDashboardToLoad", "Waiting for dashboard KPI cards to load");
    }

    public static Performable refreshDashboard() {
        return Perform.actions(
                Click.on(DashboardPage.REFRESH_BUTTON)
        ).log("refreshDashboard", "Clicking refresh button on dashboard");
    }
}
