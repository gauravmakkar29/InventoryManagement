package com.ims.automation.macros;

import com.ims.actions.Launch;
import com.ims.actions.Perform;
import com.ims.actions.Performable;
import com.ims.actions.Waiting;
import com.ims.automation.impls.common.SidebarImpl;
import com.ims.automation.pages.accountservice.AccountServicePage;
import com.ims.automation.pages.analytics.AnalyticsPage;
import com.ims.automation.pages.compliance.CompliancePage;
import com.ims.automation.pages.dashboard.DashboardPage;
import com.ims.automation.pages.deployment.DeploymentPage;
import com.ims.automation.pages.inventory.InventoryPage;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class Navigate {

    public static Navigate to() {
        return new Navigate();
    }

    public Performable dashboard() {
        return Perform.actions(
                SidebarImpl.navigateToDashboard(),
                (actor) -> actor.is(Waiting.on(DashboardPage.PAGE_HEADING))
        ).log("Navigate.to.dashboard", "Navigating to Dashboard page via sidebar");
    }

    public Performable inventory() {
        return Perform.actions(
                SidebarImpl.navigateToInventory(),
                (actor) -> actor.is(Waiting.on(InventoryPage.PAGE_HEADING))
        ).log("Navigate.to.inventory", "Navigating to Inventory page via sidebar");
    }

    public Performable deployment() {
        return Perform.actions(
                SidebarImpl.navigateToDeployment(),
                (actor) -> actor.is(Waiting.on(DeploymentPage.PAGE_HEADING))
        ).log("Navigate.to.deployment", "Navigating to Deployment page via sidebar");
    }

    public Performable compliance() {
        return Perform.actions(
                SidebarImpl.navigateToCompliance(),
                (actor) -> actor.is(Waiting.on(CompliancePage.PAGE_HEADING))
        ).log("Navigate.to.compliance", "Navigating to Compliance page via sidebar");
    }

    public Performable accountService() {
        return Perform.actions(
                SidebarImpl.navigateToServiceOrders(),
                (actor) -> actor.is(Waiting.on(AccountServicePage.PAGE_HEADING))
        ).log("Navigate.to.accountService", "Navigating to Account Service page via sidebar");
    }

    public Performable analytics() {
        return Perform.actions(
                SidebarImpl.navigateToAnalytics(),
                (actor) -> actor.is(Waiting.on(AnalyticsPage.PAGE_HEADING))
        ).log("Navigate.to.analytics", "Navigating to Analytics page via sidebar");
    }

    public static Performable directlyTo(String url) {
        return Perform.actions(
                Launch.app(url)
        ).log("Navigate.directlyTo", "Navigating directly to URL: " + url);
    }
}
