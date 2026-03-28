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

    public static Performable navigateToAccountService() {
        return Perform.actions(
                Click.on(SidebarPage.ACCOUNT_SERVICE_LINK)
                        .afterWaiting(Waiting.on(SidebarPage.ACCOUNT_SERVICE_LINK))
        ).log("navigateToAccountService", "Clicking Account Service link in sidebar");
    }

    public static Performable navigateToAnalytics() {
        return Perform.actions(
                Click.on(SidebarPage.ANALYTICS_LINK)
                        .afterWaiting(Waiting.on(SidebarPage.ANALYTICS_LINK))
        ).log("navigateToAnalytics", "Clicking Analytics link in sidebar");
    }

    public static Performable collapseSidebar() {
        return Perform.actions(
                Click.on(SidebarPage.COLLAPSE_TOGGLE)
        ).log("collapseSidebar", "Toggling sidebar collapse");
    }
}
