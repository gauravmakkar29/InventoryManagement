package com.ims.automation.impls.inventory;

import com.ims.actions.Click;
import com.ims.actions.Perform;
import com.ims.actions.Performable;
import com.ims.actions.Type;
import com.ims.actions.Waiting;
import com.ims.automation.pages.inventory.InventoryPage;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class InventoryImpl {

    public static Performable switchToHardwareTab() {
        return Perform.actions(
                Click.on(InventoryPage.HARDWARE_TAB)
                        .afterWaiting(Waiting.on(InventoryPage.HARDWARE_TAB))
        ).log("switchToHardwareTab", "Switching to Hardware tab");
    }

    public static Performable switchToFirmwareTab() {
        return Perform.actions(
                Click.on(InventoryPage.FIRMWARE_TAB)
                        .afterWaiting(Waiting.on(InventoryPage.FIRMWARE_TAB))
        ).log("switchToFirmwareTab", "Switching to Firmware tab");
    }

    public static Performable switchToGeoTab() {
        return Perform.actions(
                Click.on(InventoryPage.GEO_TAB)
                        .afterWaiting(Waiting.on(InventoryPage.GEO_TAB))
        ).log("switchToGeoTab", "Switching to Geo tab");
    }

    public static Performable searchForDevice(String query) {
        return Perform.actions(
                Type.text(query).on(InventoryPage.SEARCH_INPUT)
        ).log("searchForDevice", "Searching for device: " + query);
    }

    public static Performable exportCsv() {
        return Perform.actions(
                Click.on(InventoryPage.CSV_EXPORT_BUTTON)
        ).log("exportCsv", "Clicking CSV export button");
    }

    public static Performable waitForTableToLoad() {
        return Perform.actions(
                (actor) -> actor.is(Waiting.on(InventoryPage.DEVICE_TABLE))
        ).log("waitForTableToLoad", "Waiting for device table to load");
    }
}
