package com.ims.automation.pages.inventory;

import com.ims.locatorstrategy.LocateBy;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class InventoryPage {
    public static final String HARDWARE_TAB = LocateBy.css("[data-testid='tab-hardware']");
    public static final String FIRMWARE_TAB = LocateBy.css("[data-testid='tab-firmware']");
    public static final String GEO_TAB = LocateBy.css("[data-testid='tab-geo']");
    public static final String SEARCH_INPUT = LocateBy.css("[data-testid='inventory-search'] input");
    public static final String FILTER_DROPDOWN = LocateBy.css("[data-testid='inventory-filter']");
    public static final String DEVICE_TABLE = LocateBy.css("[data-testid='device-table']");
    public static final String DEVICE_TABLE_ROW = LocateBy.css("[data-testid='device-table'] tbody tr");
    public static final String PAGINATION = LocateBy.css("[data-testid='pagination']");
    public static final String CSV_EXPORT_BUTTON = LocateBy.css("[data-testid='csv-export']");
    public static final String PAGE_HEADING = LocateBy.text("Inventory");
}
