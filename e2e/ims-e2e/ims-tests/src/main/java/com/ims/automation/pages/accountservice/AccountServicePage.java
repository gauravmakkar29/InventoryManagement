package com.ims.automation.pages.accountservice;

import com.ims.locatorstrategy.LocateBy;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class AccountServicePage {
    public static final String KANBAN_VIEW_TOGGLE = LocateBy.css("[data-testid='view-kanban']");
    public static final String CALENDAR_VIEW_TOGGLE = LocateBy.css("[data-testid='view-calendar']");
    public static final String KANBAN_COLUMN = LocateBy.css("[data-testid='kanban-column']");
    public static final String SERVICE_ORDER_CARD = LocateBy.css("[data-testid='service-order-card']");
    public static final String CREATE_ORDER_BUTTON = LocateBy.css("[data-testid='create-order']");
    public static final String CALENDAR_GRID = LocateBy.css("[data-testid='calendar-grid']");
    public static final String PAGE_HEADING = LocateBy.text("Account Service");
}
