package com.ims.automation.impls.analytics;

import com.ims.actions.Click;
import com.ims.actions.Perform;
import com.ims.actions.Performable;
import com.ims.actions.Waiting;
import com.ims.automation.pages.analytics.AnalyticsPage;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class AnalyticsImpl {

    public static Performable selectTimeRange7d() {
        return Perform.actions(
                Click.on(AnalyticsPage.TIME_RANGE_7D)
        ).log("selectTimeRange7d", "Selecting 7-day time range filter");
    }

    public static Performable selectTimeRange30d() {
        return Perform.actions(
                Click.on(AnalyticsPage.TIME_RANGE_30D)
        ).log("selectTimeRange30d", "Selecting 30-day time range filter");
    }

    public static Performable selectTimeRange90d() {
        return Perform.actions(
                Click.on(AnalyticsPage.TIME_RANGE_90D)
        ).log("selectTimeRange90d", "Selecting 90-day time range filter");
    }

    public static Performable waitForChartsToLoad() {
        return Perform.actions(
                (actor) -> actor.is(Waiting.on(AnalyticsPage.CHART_CONTAINER))
        ).log("waitForChartsToLoad", "Waiting for analytics charts to load");
    }

    public static Performable waitForKpiCardsToLoad() {
        return Perform.actions(
                (actor) -> actor.is(Waiting.on(AnalyticsPage.KPI_CARD))
        ).log("waitForKpiCardsToLoad", "Waiting for analytics KPI cards to load");
    }
}
