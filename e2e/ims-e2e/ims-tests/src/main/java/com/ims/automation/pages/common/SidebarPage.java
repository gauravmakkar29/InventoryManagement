package com.ims.automation.pages.common;

import com.ims.locatorstrategy.LocateBy;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class SidebarPage {
    public static final String SIDEBAR_NAV = LocateBy.css("nav[data-testid='sidebar']");
    public static final String DASHBOARD_LINK = LocateBy.css("a[href='/dashboard']");
    public static final String INVENTORY_LINK = LocateBy.css("a[href='/inventory']");
    public static final String DEPLOYMENT_LINK = LocateBy.css("a[href='/deployment']");
    public static final String COMPLIANCE_LINK = LocateBy.css("a[href='/compliance']");
    public static final String ACCOUNT_SERVICE_LINK = LocateBy.css("a[href='/account-service']");
    public static final String ANALYTICS_LINK = LocateBy.css("a[href='/analytics']");
    public static final String COLLAPSE_TOGGLE = LocateBy.css("[data-testid='sidebar-collapse']");
}
