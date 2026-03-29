package com.ims.automation.pages.dashboard;

import com.ims.locatorstrategy.LocateBy;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class DashboardPage {
    public static final String PAGE_HEADING = LocateBy.css("h2");
    public static final String REFRESH_BUTTON = LocateBy.css("button[aria-label='Refresh dashboard']");
    public static final String KPI_CARD = LocateBy.css(".card-elevated");
    public static final String NOTIFICATION_BELL = LocateBy.css("button[aria-label*='Notifications']");
    public static final String QUICK_ACTIONS_PANEL = LocateBy.css("[data-testid='quick-actions']");
    public static final String RECENT_ALERTS = LocateBy.css("[data-testid='recent-alerts']");
    public static final String SYSTEM_STATUS = LocateBy.css("[data-testid='system-status']");
}
