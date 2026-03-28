package com.ims.automation.pages.analytics;

import com.ims.locatorstrategy.LocateBy;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class AnalyticsPage {
    public static final String KPI_CARD = LocateBy.css("[data-testid='analytics-kpi-card']");
    public static final String TIME_RANGE_7D = LocateBy.css("[data-testid='time-range-7d']");
    public static final String TIME_RANGE_30D = LocateBy.css("[data-testid='time-range-30d']");
    public static final String TIME_RANGE_90D = LocateBy.css("[data-testid='time-range-90d']");
    public static final String CHART_CONTAINER = LocateBy.css("[data-testid='chart-container']");
    public static final String AUDIT_TABLE = LocateBy.css("[data-testid='analytics-audit-table']");
    public static final String AUDIT_TABLE_ROW = LocateBy.css("[data-testid='analytics-audit-table'] tbody tr");
    public static final String PAGE_HEADING = LocateBy.text("Analytics");
}
