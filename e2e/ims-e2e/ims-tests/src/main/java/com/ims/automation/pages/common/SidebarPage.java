package com.ims.automation.pages.common;

import com.ims.locatorstrategy.LocateBy;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class SidebarPage {
    public static final String HAMBURGER_BUTTON = LocateBy.css("button[aria-label='Toggle navigation']");
    public static final String SIDEBAR_PANEL = LocateBy.css("aside[aria-label='Primary navigation']");
    public static final String DASHBOARD_LINK = LocateBy.css("a[aria-label='Dashboard']");
    public static final String INVENTORY_LINK = LocateBy.css("a[aria-label='Inventory']");
    public static final String DEPLOYMENT_LINK = LocateBy.css("a[aria-label='Deployment']");
    public static final String COMPLIANCE_LINK = LocateBy.css("a[aria-label='Compliance']");
    public static final String SERVICE_ORDERS_LINK = LocateBy.css("a[aria-label='Service Orders']");
    public static final String ANALYTICS_LINK = LocateBy.css("a[aria-label='Analytics']");
    public static final String USER_MANAGEMENT_LINK = LocateBy.css("a[aria-label='User Management']");
    public static final String SIGN_OUT_BUTTON = LocateBy.text("Sign Out");
}
