package com.ims.automation.impls.accountservice;

import com.ims.actions.Click;
import com.ims.actions.Perform;
import com.ims.actions.Performable;
import com.ims.actions.Waiting;
import com.ims.automation.pages.accountservice.AccountServicePage;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class AccountServiceImpl {

    public static Performable switchToKanbanView() {
        return Perform.actions(
                Click.on(AccountServicePage.KANBAN_VIEW_TOGGLE)
                        .afterWaiting(Waiting.on(AccountServicePage.KANBAN_VIEW_TOGGLE))
        ).log("switchToKanbanView", "Switching to Kanban view");
    }

    public static Performable switchToCalendarView() {
        return Perform.actions(
                Click.on(AccountServicePage.CALENDAR_VIEW_TOGGLE)
                        .afterWaiting(Waiting.on(AccountServicePage.CALENDAR_VIEW_TOGGLE))
        ).log("switchToCalendarView", "Switching to Calendar view");
    }

    public static Performable clickCreateOrder() {
        return Perform.actions(
                Click.on(AccountServicePage.CREATE_ORDER_BUTTON)
        ).log("clickCreateOrder", "Clicking create order button");
    }

    public static Performable waitForKanbanToLoad() {
        return Perform.actions(
                (actor) -> actor.is(Waiting.on(AccountServicePage.KANBAN_COLUMN))
        ).log("waitForKanbanToLoad", "Waiting for Kanban columns to load");
    }
}
