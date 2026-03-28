package com.ims.automation.inventory;

import com.ims.NovusGuiTestBase;
import com.ims.actor.Actor;
import com.ims.annotations.MetaData;
import com.ims.automation.constants.TestGroups;
import com.ims.automation.impls.inventory.InventoryImpl;
import com.ims.automation.macros.Login;
import com.ims.automation.macros.Navigate;
import com.ims.automation.pages.inventory.InventoryPage;
import com.ims.automation.services.UrlService;
import com.ims.actions.Launch;
import com.ims.actions.Waiting;
import org.springframework.beans.factory.annotation.Autowired;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;

@Test(groups = {TestGroups.INVENTORY, TestGroups.REGRESSION})
public class InventoryTests extends NovusGuiTestBase {

    @Autowired
    private UrlService urlService;
    private final Actor actor = new Actor();

    @BeforeClass(dependsOnMethods = "baseBeforeClassSetup")
    public void setup() {
        actor.setBrowser(browser);
        actor.attemptsTo(
                Launch.app(urlService.login()),
                Login.withCredentials("admin@ims.com", "password"),
                Navigate.to().inventory()
        );
    }

    @MetaData(testCaseId = "IMS-INV-001", author = "ims-automation", category = "inventory")
    @Test(description = "Verify inventory page loads with device table")
    public void verifyInventoryPageLoads() {
        step("Verify the device table is displayed");
        softly.assertTrue(
                actor.is(Waiting.on(InventoryPage.DEVICE_TABLE)),
                "Device table should be visible on the inventory page"
        );
        softly.assertAll();
    }

    @MetaData(testCaseId = "IMS-INV-002", author = "ims-automation", category = "inventory")
    @Test(description = "Verify tab switching between Hardware, Firmware, and Geo")
    public void verifyTabSwitching() {
        step("Switch to Firmware tab");
        actor.attemptsTo(InventoryImpl.switchToFirmwareTab());

        step("Switch to Geo tab");
        actor.attemptsTo(InventoryImpl.switchToGeoTab());

        step("Switch back to Hardware tab");
        actor.attemptsTo(InventoryImpl.switchToHardwareTab());

        step("Verify device table is still visible");
        softly.assertTrue(
                actor.is(Waiting.on(InventoryPage.DEVICE_TABLE)),
                "Device table should be visible after tab switching"
        );
        softly.assertAll();
    }

    @MetaData(testCaseId = "IMS-INV-003", author = "ims-automation", category = "inventory")
    @Test(description = "Verify device search functionality")
    public void verifyDeviceSearch() {
        step("Search for a device");
        actor.attemptsTo(InventoryImpl.searchForDevice("test-device"));

        step("Verify search results are displayed in table");
        softly.assertTrue(
                actor.is(Waiting.on(InventoryPage.DEVICE_TABLE)),
                "Device table should display search results"
        );
        softly.assertAll();
    }

    @MetaData(testCaseId = "IMS-INV-004", author = "ims-automation", category = "inventory")
    @Test(description = "Verify CSV export button is present")
    public void verifyCsvExportAvailable() {
        step("Verify the CSV export button is visible");
        softly.assertTrue(
                actor.is(Waiting.on(InventoryPage.CSV_EXPORT_BUTTON)),
                "CSV export button should be visible"
        );
        softly.assertAll();
    }
}
