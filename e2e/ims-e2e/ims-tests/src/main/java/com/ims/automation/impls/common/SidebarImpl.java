package com.ims.automation.impls.common;

import com.ims.actions.Click;
import com.ims.actions.Perform;
import com.ims.actions.Performable;
import com.ims.actions.Waiting;
import com.ims.automation.pages.common.SidebarPage;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class SidebarImpl {

    public static Performable openSidebar() {
        return Perform.actions(
                Click.on(SidebarPage.HAMBURGER_BUTTON)
                        .afterWaiting(Waiting.on(SidebarPage.HAMBURGER_BUTTON)),
                (actor) -> actor.is(Waiting.on(SidebarPage.SIDEBAR_PANEL))
        ).log("openSidebar", "Opening sidebar via hamburger button");
    }

    public static Performable navigateToDashboard() {
        return Perform.actions(
                Click.on(SidebarPage.DASHBOARD_LINK)
                        .afterWaiting(Waiting.on(SidebarPage.DASHBOARD_LINK))
        ).log("navigateToDashboard", "Clicking Dashboard link in sidebar");
    }

    public static Performable navigateToInventory() {
        return Perform.actions(
                Click.on(SidebarPage.INVENTORY_LINK)
                        .afterWaiting(Waiting.on(SidebarPage.INVENTORY_LINK))
        ).log("navigateToInventory", "Clicking Inventory link in sidebar");
    }

    public static Performable navigateToDeployment() {
        return Perform.actions(
                Click.on(SidebarPage.DEPLOYMENT_LINK)
                        .afterWaiting(Waiting.on(SidebarPage.DEPLOYMENT_LINK))
        ).log("navigateToDeployment", "Clicking Deployment link in sidebar");
    }

    public static Performable navigateToCompliance() {
        return Perform.actions(
                Click.on(SidebarPage.COMPLIANCE_LINK)
                        .afterWaiting(Waiting.on(SidebarPage.COMPLIANCE_LINK))
        ).log("navigateToCompliance", "Clicking Compliance link in sidebar");
    }

    public static Performable navigateToServiceOrders() {
        return Perform.actions(
                Click.on(SidebarPage.SERVICE_ORDERS_LINK)
                        .afterWaiting(Waiting.on(SidebarPage.SERVICE_ORDERS_LINK))
        ).log("navigateToServiceOrders", "Clicking Service Orders link in sidebar");
    }

    public static Performable navigateToAnalytics() {
        return Perform.actions(
                Click.on(SidebarPage.ANALYTICS_LINK)
                        .afterWaiting(Waiting.on(SidebarPage.ANALYTICS_LINK))
        ).log("navigateToAnalytics", "Clicking Analytics link in sidebar");
    }

    public static Performable navigateToUserManagement() {
        return Perform.actions(
                Click.on(SidebarPage.USER_MANAGEMENT_LINK)
                        .afterWaiting(Waiting.on(SidebarPage.USER_MANAGEMENT_LINK))
        ).log("navigateToUserManagement", "Clicking User Management link in sidebar");
    }

    public static Performable signOut() {
        return Perform.actions(
                Click.on(SidebarPage.SIGN_OUT_BUTTON)
                        .afterWaiting(Waiting.on(SidebarPage.SIGN_OUT_BUTTON))
        ).log("signOut", "Clicking Sign Out button in sidebar");
    }
}
